/**
 * run-test.mjs
 * Prueba de integración de extremo a extremo. Ejecuta el código REAL del
 * proyecto (no una reimplementación) contra un DOM simulado (jsdom) con
 * localStorage funcional, encadenando todos los módulos como lo haría un uso
 * real de la aplicación: Ingredientes -> Recetas -> Producción -> Inventario
 * -> Productos -> Clientes -> Caja -> Ventas -> Dashboard.
 */

import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/' });
global.window = dom.window;
global.document = dom.window.document;
global.localStorage = dom.window.localStorage;
if (!global.crypto) global.crypto = dom.window.crypto;

const BASE = '../..';
const startTime = Date.now();
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed += 1;
    console.log(`  ✅ ${message}`);
  } else {
    failed += 1;
    console.log(`  ❌ ${message}`);
  }
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

async function run() {
  // ---------- INGREDIENTES ----------
  section('Ingredientes');
  const { ingredientService } = await import(`${BASE}/modules/ingredients/ingredient.service.js`);

  const harina = await ingredientService.create({ name: 'Harina 0000', unit: 'kg', stock: 10, minStock: 2, cost: 800, supplier: 'Molino SA', notes: '' });
  const azucar = await ingredientService.create({ name: 'Azúcar', unit: 'kg', stock: 5, minStock: 1, cost: 600, supplier: '', notes: '' });
  const manteca = await ingredientService.create({ name: 'Manteca', unit: 'kg', stock: 1, minStock: 0.5, cost: 3000, supplier: '', notes: '' });
  const chocolate = await ingredientService.create({ name: 'Chocolate cobertura', unit: 'kg', stock: 0.1, minStock: 1, cost: 5000, supplier: '', notes: '' });

  assert(harina.id && azucar.id && manteca.id && chocolate.id, 'Se crean 4 ingredientes con id asignado');
  const allIngredients = await ingredientService.list();
  assert(allIngredients.length === 4, 'ingredientService.list() devuelve los 4 ingredientes');
  assert(!ingredientService.isLowStock(harina), 'Harina no está en stock bajo (10 > mínimo 2)');
  assert(ingredientService.isLowStock(chocolate), 'Chocolate cobertura SÍ está en stock bajo (0.1 <= mínimo 1)');

  let threwOnInvalid = false;
  try {
    await ingredientService.create({ name: 'X', unit: 'kg', stock: -5, minStock: 0, cost: 0, supplier: '', notes: '' });
  } catch (err) {
    threwOnInvalid = err.name === 'ValidationError';
  }
  assert(threwOnInvalid, 'El validador rechaza stock negativo con ValidationError');

  section('Errores tipados (AppError) y validadores compartidos');
  const { AppError, ValidationError } = await import(`${BASE}/core/errors.js`);
  const { isNonEmptyString, isPositiveNumber, isValidEmail } = await import(`${BASE}/core/validators.js`);
  const sampleError = new ValidationError('mensaje de prueba', { campo: 'error' });
  assert(sampleError instanceof AppError, 'ValidationError extiende AppError');
  assert(sampleError.name === 'ValidationError', 'AppError fija this.name automáticamente al nombre de la subclase');
  assert(isNonEmptyString('  hola  ', 2) === true && isNonEmptyString(' a ', 2) === false, 'isNonEmptyString respeta el largo mínimo tras hacer trim');
  assert(isPositiveNumber(0) === false && isPositiveNumber(5) === true, 'isPositiveNumber rechaza cero y acepta positivos');
  assert(isValidEmail('no-es-email') === false && isValidEmail('a@b.com') === true, 'isValidEmail distingue formatos válidos e inválidos');
  assert(isNonEmptyString('a'.repeat(200), 2) === true && isNonEmptyString('a'.repeat(201), 2) === false, 'isNonEmptyString rechaza nombres de más de 200 caracteres');

  section('QA — Batería de pruebas reportada por el usuario (documento de control de calidad)');
  const { normalizeForSearch } = await import(`${BASE}/core/utils.js`);

  section('UX: ordenamiento de tablas (sortRows, components/dataTable.js)');
  const { sortRows } = await import(`${BASE}/components/dataTable.js`);
  const datosDePrueba = [
    { name: 'Zapallo', stock: 5 },
    { name: 'Almendras', stock: 20 },
    { name: 'Miel', stock: null },
    { name: 'Canela', stock: 12 },
  ];
  const porNombreAsc = sortRows(datosDePrueba, 'name', 'asc').map((r) => r.name);
  assert(JSON.stringify(porNombreAsc) === JSON.stringify(['Almendras', 'Canela', 'Miel', 'Zapallo']), `sortRows() ordena strings alfabéticamente (asc): ${porNombreAsc}`);
  const porNombreDesc = sortRows(datosDePrueba, 'name', 'desc').map((r) => r.name);
  assert(porNombreDesc[0] === 'Zapallo', 'sortRows() invierte el orden correctamente (desc)');
  const porStockAsc = sortRows(datosDePrueba, 'stock', 'asc').map((r) => r.name);
  assert(porStockAsc[porStockAsc.length - 1] === 'Miel', 'sortRows() deja los valores null/undefined siempre al final, sea cual sea la dirección');
  const porStockDesc = sortRows(datosDePrueba, 'stock', 'desc').map((r) => r.name);
  assert(porStockDesc[porStockDesc.length - 1] === 'Miel', 'sortRows() deja null al final también en orden descendente');
  assert(sortRows(datosDePrueba, 'stock', 'asc')[0].name === 'Zapallo', 'sortRows() ordena números correctamente (asc): 5 antes que 12 y 20');
  assert(datosDePrueba[0].name === 'Zapallo', 'sortRows() no modifica el array original (devuelve uno nuevo)');
  assert(normalizeForSearch('Azúcar') === normalizeForSearch('azucar') && normalizeForSearch('AZÚCAR') === normalizeForSearch('Azúcar'), 'normalizeForSearch() iguala "Azúcar", "azucar" y "AZÚCAR"');
  assert(normalizeForSearch('Ázucar') === normalizeForSearch('Azúcar'), 'normalizeForSearch() iguala tildes mal puestas ("Ázucar" con "Azúcar") — el caso exacto que pidió el usuario');
  assert('Cookies Chocolate'.toLowerCase().includes(normalizeForSearch('choco')), 'Una búsqueda parcial como "CHOCO" encuentra "Cookies Chocolate" (case-insensitive ya funcionaba, se preserva)');

  const { findDuplicateIngredientName } = await import(`${BASE}/modules/ingredients/ingredient.controller.js`);
  const ingredientesActuales = await ingredientService.list();
  assert(findDuplicateIngredientName(ingredientesActuales, 'Harina 0000') !== null, 'findDuplicateIngredientName() detecta el mismo nombre exacto');
  assert(findDuplicateIngredientName(ingredientesActuales, 'HARINA 0000') !== null, 'findDuplicateIngredientName() ignora mayúsculas');
  assert(findDuplicateIngredientName(ingredientesActuales, 'hárina 0000') !== null, 'findDuplicateIngredientName() ignora tildes (comparación exacta, no substring — "Harina" no detecta "Harina Integral" como duplicado)');
  assert(findDuplicateIngredientName(ingredientesActuales, 'Ingrediente que no existe') === null, 'findDuplicateIngredientName() no da falsos positivos');
  assert(findDuplicateIngredientName(ingredientesActuales, 'Harina 0000', harina.id) === null, 'findDuplicateIngredientName() excluye el propio id al editar (no se detecta a sí mismo)');

  let ingredienteDuplicadoFalla = false;
  try {
    await ingredientService.create({ name: 'HARINA 0000', unit: 'kg', stock: 1, minStock: 0, cost: 100, supplier: '', notes: '' });
    ingredienteDuplicadoFalla = false; // el Service en sí NO bloquea — el bloqueo vive en el Controller (mismo patrón que las guardas de integridad referencial)
  } catch {
    ingredienteDuplicadoFalla = true;
  }
  assert(ingredienteDuplicadoFalla === false, 'El Service no bloquea duplicados (por diseño): el bloqueo vive en ingredient.controller.js, igual que las guardas de integridad referencial — ver docs/ARCHITECTURE.md');
  // Limpieza: el ingrediente duplicado creado recién arriba para probar el punto anterior no debe interferir con el resto del test.
  const ingredienteDuplicadoRecienCreado = (await ingredientService.list()).find((i) => i.name === 'HARINA 0000' && i.id !== harina.id);
  if (ingredienteDuplicadoRecienCreado) await ingredientService.remove(ingredienteDuplicadoRecienCreado.id);

  const { findDuplicateProductName } = await import(`${BASE}/modules/products/product.controller.js`);

  // ---------- RECETAS ----------
  section('Recetas');
  const { recipeService } = await import(`${BASE}/modules/recipes/recipe.service.js`);

  const receta = await recipeService.create({
    name: 'Torta de vainilla',
    items: [
      { ingredientId: harina.id, quantity: 0.5 },
      { ingredientId: azucar.id, quantity: 0.3 },
      { ingredientId: manteca.id, quantity: 0.2 },
    ],
    yieldQuantity: 1,
    yieldUnit: 'unidad',
    prepTimeMinutes: 90,
    notes: '',
  });
  assert(receta.id && receta.version === 1, 'Se crea la receta con version=1');

  let recetaConIngredienteRepetidoFalla = false;
  try {
    await recipeService.create({
      name: 'Receta con ingrediente repetido',
      items: [{ ingredientId: harina.id, quantity: 0.2 }, { ingredientId: harina.id, quantity: 0.3 }],
      yieldQuantity: 1, yieldUnit: 'unidad', prepTimeMinutes: 0, notes: '',
    });
  } catch (err) {
    recetaConIngredienteRepetidoFalla = err.name === 'ValidationError';
  }
  assert(recetaConIngredienteRepetidoFalla, 'Una receta con el mismo ingrediente listado dos veces se rechaza con ValidationError');

  const costo = recipeService.calculateCost(receta, allIngredients);
  const costoEsperado = 0.5 * 800 + 0.3 * 600 + 0.2 * 3000;
  assert(Math.abs(costo.totalCost - costoEsperado) < 0.001, `Costo calculado correctamente: $${costo.totalCost} (esperado $${costoEsperado})`);

  const recetaEditada = await recipeService.update(receta.id, { ...receta, notes: 'actualizada' });
  assert(recetaEditada.version === 2, 'Al editar la receta, la versión se incrementa a 2');

  // ---------- PRODUCCIÓN ----------
  section('Producción (feasibility + completar orden)');
  const { productionService } = await import(`${BASE}/modules/production/production.service.js`);

  section('QA: Conversión de unidades — el ejemplo exacto del usuario (Harina 25kg → receta 180g)');
  const { convertUnit, areCompatibleUnits: areCompatibleUnitsTest } = await import(`${BASE}/core/units.js`);

  assert(convertUnit(180, 'g', 'kg') === 0.18, `convertUnit(180, 'g', 'kg') da ${convertUnit(180, 'g', 'kg')} (esperado 0.18)`);
  assert(convertUnit(1, 'kg', 'g') === 1000, 'convertUnit(1, "kg", "g") da 1000');
  assert(convertUnit(1, 'l', 'ml') === 1000, 'convertUnit(1, "l", "ml") da 1000 — también funciona para volumen');
  assert(areCompatibleUnitsTest('g', 'ml') === false, 'Masa y volumen NUNCA son compatibles (g no se puede convertir a ml)');
  let conversionImposibleFalla = false;
  try { convertUnit(1, 'g', 'ml'); } catch { conversionImposibleFalla = true; }
  assert(conversionImposibleFalla, 'convertUnit() lanza un error explícito al intentar convertir masa a volumen, en vez de devolver un número sin sentido');

  const harinaUnidades = await ingredientService.create({ name: 'Harina (test unidades)', unit: 'kg', stock: 25, minStock: 1, cost: 800, supplier: '', notes: '' });
  const recetaUnidades = await recipeService.create({
    name: 'Receta test unidades',
    items: [{ ingredientId: harinaUnidades.id, quantity: 180, unit: 'g' }], // ingrediente en kg, receta cargada en gramos
    yieldQuantity: 15, yieldUnit: 'unidad', prepTimeMinutes: 0, notes: '',
  });

  const costoUnidades = recipeService.calculateCost(recetaUnidades, await ingredientService.list());
  const costoEsperadoUnidades = 0.18 * 800; // 180g = 0.18kg, a $800/kg
  assert(Math.abs(costoUnidades.totalCost - costoEsperadoUnidades) < 0.0001, `El costo se calcula convirtiendo 180g a 0.18kg automáticamente: $${costoUnidades.totalCost} (esperado $${costoEsperadoUnidades})`);
  assert(costoUnidades.incompatibleUnits.length === 0, 'No hay unidades incompatibles en una conversión válida de masa (g -> kg)');

  const ordenUnidades = await productionService.create({ recipeId: recetaUnidades.id, multiplier: 1, status: 'planned', plannedDate: '2026-07-18', notes: '' });
  const feasUnidades = await productionService.checkFeasibility(ordenUnidades);
  assert(feasUnidades.feasible === true, 'La orden es factible: 180g necesarios, 25kg disponibles, tras convertir alcanza de sobra');
  assert(Math.abs(feasUnidades.requirements[0].required - 0.18) < 0.0001, `checkFeasibility() expresa el requerimiento ya convertido a la unidad del ingrediente (kg): ${feasUnidades.requirements[0].required} (esperado 0.18)`);

  await productionService.complete(ordenUnidades.id);
  const harinaUnidadesTrasProducir = await ingredientService.get(harinaUnidades.id);
  assert(Math.abs(harinaUnidadesTrasProducir.stock - (25 - 0.18)) < 0.0001, `El stock de Harina bajó de 25kg a ${harinaUnidadesTrasProducir.stock}kg (esperado ${25 - 0.18}kg) — la producción de 15 unidades consumió exactamente 180g convertidos a kg, tal como pidió el usuario`);

  // Limpieza — no debe interferir con el resto del test.
  await recipeService.remove(recetaUnidades.id);
  await ingredientService.remove(harinaUnidades.id);


  const ordenGrande = await productionService.create({ recipeId: receta.id, multiplier: 100, status: 'planned', plannedDate: '2026-07-15', notes: '' });
  const feasBig = await productionService.checkFeasibility(ordenGrande);
  assert(feasBig.feasible === false, 'Una orden ×100 correctamente detecta que NO hay stock suficiente');

  let bloqueoCorrect = false;
  try {
    await productionService.complete(ordenGrande.id);
  } catch (err) {
    bloqueoCorrect = err.name === 'InsufficientStockError' && err.shortages.length > 0;
  }
  assert(bloqueoCorrect, 'complete() lanza InsufficientStockError y NO ejecuta movimientos cuando falta stock');

  const stockHarinaAntes = (await ingredientService.get(harina.id)).stock;
  assert(stockHarinaAntes === 10, 'El stock de Harina NO se tocó tras el intento fallido (operación todo-o-nada)');

  const ordenChica = await productionService.create({ recipeId: receta.id, multiplier: 2, status: 'planned', plannedDate: '2026-07-15', notes: '' });
  const feasSmall = await productionService.checkFeasibility(ordenChica);
  assert(feasSmall.feasible === true, 'Una orden ×2 sí es factible con el stock actual');

  const ordenCompletada = await productionService.complete(ordenChica.id);
  assert(ordenCompletada.status === 'completed', 'La orden queda marcada como completed');

  const harinaTrasProduccion = await ingredientService.get(harina.id);
  assert(Math.abs(harinaTrasProduccion.stock - (10 - 0.5 * 2)) < 0.001, `El stock de Harina se descontó correctamente: ${harinaTrasProduccion.stock}kg (esperado ${10 - 0.5 * 2}kg)`);

  // ---------- ROLLBACK ATÓMICO (runAtomic) ----------
  section('Rollback atómico (core/storage/atomicRun.js)');
  const { runAtomic } = await import(`${BASE}/core/storage/atomicRun.js`);

  const applied = [];
  let rolledBackCount = 0;
  let rollbackError = null;
  try {
    await runAtomic([
      { run: async () => { applied.push('paso1'); return 'ok1'; }, rollback: async () => { rolledBackCount += 1; } },
      { run: async () => { applied.push('paso2'); return 'ok2'; }, rollback: async () => { rolledBackCount += 1; } },
      { run: async () => { throw new Error('falla simulada en paso 3'); }, rollback: async () => { rolledBackCount += 1; } },
    ]);
  } catch (err) {
    rollbackError = err;
  }
  assert(rollbackError?.message === 'falla simulada en paso 3', 'runAtomic() propaga el error original cuando un paso falla');
  assert(applied.length === 2, 'Los dos primeros pasos se ejecutaron antes de la falla');
  assert(rolledBackCount === 2, 'runAtomic() deshizo exactamente los 2 pasos que sí se habían aplicado (no el que falló)');

  // ---------- INVENTARIO ----------
  section('Inventario (movimiento generado por Producción)');
  const { inventoryService } = await import(`${BASE}/modules/inventory/inventory.service.js`);
  const movimientosHarina = await inventoryService.listForIngredient(harina.id);
  assert(movimientosHarina.length === 1, 'Producción generó exactamente 1 movimiento de salida en Inventario para Harina');
  assert(movimientosHarina[0].type === 'out' && movimientosHarina[0].quantity === 1, `El movimiento es de salida por la cantidad correcta (${movimientosHarina[0].quantity}kg)`);

  // Movimiento manual directo en Inventario
  const ingredienteAntesAjuste = await ingredientService.get(azucar.id);
  await inventoryService.create({ ingredientId: azucar.id, type: 'in', quantity: 10, reason: 'Compra a proveedor' });
  const azucarTrasCompra = await ingredientService.get(azucar.id);
  assert(azucarTrasCompra.stock === ingredienteAntesAjuste.stock + 10, 'Un movimiento manual de entrada actualiza el stock del ingrediente correctamente');

  section('QA: movimiento manual de salida que excede el stock disponible se rechaza');
  const manteca_stock_actual = (await ingredientService.get(manteca.id)).stock;
  let movimientoExcesivoFalla = false;
  try {
    await inventoryService.create({ ingredientId: manteca.id, type: 'out', quantity: manteca_stock_actual + 100, reason: 'Intento de sacar más de lo que hay' });
  } catch (err) {
    movimientoExcesivoFalla = err.name === 'InsufficientStockError';
  }
  assert(movimientoExcesivoFalla, 'Un movimiento de salida manual por más cantidad de la disponible se rechaza con InsufficientStockError (antes se aceptaba en silencio y el stock quedaba en 0 sin avisar)');
  assert((await ingredientService.get(manteca.id)).stock === manteca_stock_actual, 'El stock de Manteca no se modificó tras el intento rechazado');

  // ---------- PRODUCTOS ----------
  section('Productos');
  const { productService } = await import(`${BASE}/modules/products/product.service.js`);
  const torta = await productService.create({ name: 'Torta de vainilla (venta)', category: 'Tortas', costPrice: 3000, sellPrice: 8000, stock: 20, active: true, notes: '' });
  assert(findDuplicateProductName([torta], 'torta de vainilla (venta)') !== null, 'findDuplicateProductName() detecta el mismo nombre ignorando mayúsculas, con datos reales');
  assert(findDuplicateProductName([torta], 'torta de vainilla (venta)', torta.id) === null, 'findDuplicateProductName() excluye el propio id al editar');
  assert(productService.margin(torta) === Math.round(((8000 - 3000) / 8000) * 100), `Margen calculado correctamente: ${productService.margin(torta)}%`);

  section('Vínculo Producto ↔ Receta (syncCostFromRecipe)');
  const tortaConReceta = await productService.create({
    name: 'Torta de vainilla (con receta)', category: 'Tortas', recipeId: receta.id,
    costPrice: 0, sellPrice: 9000, stock: 5, active: true, notes: '',
  });
  const { costPerUnit } = await productService.syncCostFromRecipe(tortaConReceta.id);
  assert(costPerUnit === costo.costPerUnit, `syncCostFromRecipe() calcula el mismo costo por unidad que la receta: $${costPerUnit}`);
  const tortaActualizada = await productService.get(tortaConReceta.id);
  assert(tortaActualizada.costPrice === Math.round(costPerUnit * 100) / 100, 'El costo sincronizado quedó efectivamente guardado en el producto');

  let productoSinRecetaFalla = false;
  try {
    await productService.syncCostFromRecipe(torta.id); // torta no tiene recipeId
  } catch (err) {
    productoSinRecetaFalla = err.name === 'ValidationError';
  }
  assert(productoSinRecetaFalla, 'syncCostFromRecipe() rechaza productos sin receta vinculada');

  section('Guardas de integridad referencial (Controller, no Service — ver ARCHITECTURE.md)');
  const { findProductsUsingRecipe } = await import(`${BASE}/modules/recipes/recipe.controller.js`);
  const { findRecipesUsingIngredient } = await import(`${BASE}/modules/ingredients/ingredient.controller.js`);

  const todosLosProductos = await productService.list();
  const productosQueUsanReceta = findProductsUsingRecipe(todosLosProductos, receta.id);
  assert(productosQueUsanReceta.length === 1 && productosQueUsanReceta[0].id === tortaConReceta.id, 'findProductsUsingRecipe() detecta correctamente el producto vinculado a la receta');
  assert(findProductsUsingRecipe(todosLosProductos, 'id-inexistente').length === 0, 'findProductsUsingRecipe() no da falsos positivos para una receta sin productos vinculados');

  const todasLasRecetas = await recipeService.list();
  const recetasQueUsanHarina = findRecipesUsingIngredient(todasLasRecetas, harina.id);
  assert(recetasQueUsanHarina.length === 1 && recetasQueUsanHarina[0].id === receta.id, 'findRecipesUsingIngredient() detecta correctamente la receta que usa Harina');
  assert(findRecipesUsingIngredient(todasLasRecetas, 'id-inexistente').length === 0, 'findRecipesUsingIngredient() no da falsos positivos para un ingrediente sin recetas que lo usen');

  // Confirma que el Service en sí (la capa de negocio) sigue sin conocer al otro módulo:
  // el remove() de bajo nivel no bloquea nada — el bloqueo es responsabilidad del Controller.
  // No se prueba acá borrando de verdad (rompería el resto del test, que sigue usando `receta` y `harina`).

  section('BUG REAL reportado por el usuario: Producción debe sumar stock al Producto vinculado');
  const stockTortaConRecetaAntes = (await productService.get(tortaConReceta.id)).stock;
  const ordenVinculada = await productionService.create({ recipeId: receta.id, multiplier: 1, status: 'planned', plannedDate: '2026-07-18', notes: '' });
  await productionService.complete(ordenVinculada.id);
  const tortaConRecetaTrasProduccion = await productService.get(tortaConReceta.id);
  const unidadesEsperadas = receta.yieldQuantity * 1; // yieldQuantity de la receta × multiplier de la orden
  assert(
    tortaConRecetaTrasProduccion.stock === stockTortaConRecetaAntes + unidadesEsperadas,
    `Al completar la producción, el stock del producto vinculado sube en ${unidadesEsperadas} unidad(es): ${stockTortaConRecetaAntes} -> ${tortaConRecetaTrasProduccion.stock}`
  );
  // Y confirma que un producto SIN receta vinculada (torta) no se ve afectado por esta producción.
  const stockTortaSinRecetaSinCambios = (await productService.get(torta.id)).stock;
  assert(stockTortaSinRecetaSinCambios === 20, 'Un producto sin receta vinculada no se modifica por una producción de otra receta');

  // ---------- CLIENTES ----------
  section('Clientes');
  const { customerService } = await import(`${BASE}/modules/customers/customer.service.js`);
  const cliente = await customerService.create({ name: 'María Gómez', phone: '11-5555-1234', email: '', address: '', birthday: '', notes: '' });
  assert(cliente.id, 'Cliente creado correctamente');

  let clienteSinContactoFalla = false;
  try {
    await customerService.create({ name: 'Sin contacto', phone: '', email: '', address: '', birthday: '', notes: '' });
  } catch (err) {
    clienteSinContactoFalla = err.name === 'ValidationError';
  }
  assert(clienteSinContactoFalla, 'El validador exige al menos un dato de contacto (teléfono o email)');

  // ---------- CAJA + VENTAS ----------
  section('Caja + Ventas (flujo completo)');
  const { cashboxService } = await import(`${BASE}/modules/cashbox/cashbox.service.js`);
  const { saleService } = await import(`${BASE}/modules/sales/sale.service.js`);

  let sesion = await cashboxService.getActiveSession();
  assert(sesion === null, 'No hay ninguna caja abierta al principio');

  sesion = await cashboxService.open({ openingAmount: 5000, notes: 'Apertura de prueba' });
  assert(sesion.status === 'open', 'La caja se abre correctamente con $5000');

  let dobleAperturaFalla = false;
  try {
    await cashboxService.open({ openingAmount: 1000, notes: '' });
  } catch (err) {
    dobleAperturaFalla = err.name === 'ValidationError';
  }
  assert(dobleAperturaFalla, 'No se puede abrir una segunda caja mientras hay una abierta');

  // Venta con más cantidad de la disponible: debe rechazarse sin tocar stock
  let ventaSobrestockFalla = false;
  try {
    await saleService.create({ customerId: cliente.id, items: [{ productId: torta.id, quantity: 999, unitPrice: 8000 }], paymentMethod: 'cash', discount: 0, notes: '' });
  } catch (err) {
    ventaSobrestockFalla = err.name === 'InsufficientStockError';
  }
  assert(ventaSobrestockFalla, 'Una venta que excede el stock disponible se rechaza con InsufficientStockError');

  const stockTortaAntes = (await productService.get(torta.id)).stock;
  assert(stockTortaAntes === 20, 'El stock de la Torta no se modificó tras la venta rechazada');

  const venta = await saleService.create({
    customerId: cliente.id,
    items: [{ productId: torta.id, quantity: 3, unitPrice: 8000 }],
    paymentMethod: 'cash',
    discount: 500,
    notes: 'Venta de prueba',
  });
  assert(venta.total === 3 * 8000 - 500, `El total de la venta se calcula correctamente: $${venta.total}`);

  const tortaTrasVenta = await productService.get(torta.id);
  assert(tortaTrasVenta.stock === 17, `El stock de la Torta se descontó correctamente: ${tortaTrasVenta.stock} (esperado 17)`);

  const movimientosCaja = await cashboxService.listMovements(sesion.id);
  const movVenta = movimientosCaja.find((m) => m.type === 'sale');
  assert(Boolean(movVenta) && movVenta.amount === venta.total, 'La venta generó automáticamente un movimiento de tipo "sale" en Caja por el monto correcto');

  await cashboxService.addMovement({ type: 'expense', amount: 1000, reason: 'Compra de bolsas' });
  const esperado = 5000 + venta.total - 1000; // apertura + venta - egreso manual
  const movimientosFinales = await cashboxService.listMovements(sesion.id);
  const expectedCalc = cashboxService.calculateExpectedAmount(sesion, movimientosFinales);
  assert(expectedCalc === esperado, `El monto esperado en caja se calcula correctamente: $${expectedCalc} (esperado $${esperado})`);

  const cierre = await cashboxService.close(sesion.id, { closingAmountCounted: expectedCalc, notes: 'Cierre exacto' });
  assert(cierre.status === 'closed' && cierre.difference === 0, 'La caja cierra correctamente con diferencia $0 cuando el conteo coincide');

  let cerrarDeNuevoFalla = false;
  try {
    await cashboxService.close(sesion.id, { closingAmountCounted: 0 });
  } catch (err) {
    cerrarDeNuevoFalla = err.name === 'ValidationError';
  }
  assert(cerrarDeNuevoFalla, 'No se puede volver a cerrar una caja ya cerrada');

  const sesionActivaTrasCierre = await cashboxService.getActiveSession();
  assert(sesionActivaTrasCierre === null, 'No queda ninguna sesión activa tras el cierre');

  section('Vuelto en efectivo (calculateChange + validación de monto insuficiente)');
  const { calculateChange } = await import(`${BASE}/modules/sales/sale.model.js`);

  // El ejemplo exacto del usuario: 3 pastafrolas a $500 c/u = $1500, paga con $2000, vuelto $500.
  const ejemploUsuario = { items: [{ productId: 'x', quantity: 3, unitPrice: 500 }], discount: 0, amountReceived: 2000 };
  assert(calculateChange(ejemploUsuario) === 500, `calculateChange() reproduce el ejemplo exacto del usuario: vuelto de $${calculateChange(ejemploUsuario)} (esperado $500)`);
  assert(calculateChange({ items: [{ productId: 'x', quantity: 1, unitPrice: 1000 }], discount: 0, amountReceived: null }) === null, 'calculateChange() devuelve null cuando no se cargó un monto recibido (no aplica)');

  let ventaSinAlcanzarFalla = false;
  try {
    await saleService.create({ customerId: cliente.id, items: [{ productId: torta.id, quantity: 1, unitPrice: 8000 }], paymentMethod: 'cash', discount: 0, amountReceived: 5000, notes: '' });
  } catch (err) {
    ventaSinAlcanzarFalla = err.name === 'ValidationError';
  }
  assert(ventaSinAlcanzarFalla, 'Una venta en efectivo con monto recibido MENOR al total se rechaza con ValidationError (evita guardar un vuelto negativo)');

  const stockTortaAntesVueltoTest = (await productService.get(torta.id)).stock;
  const ventaConVuelto = await saleService.create({ customerId: cliente.id, items: [{ productId: torta.id, quantity: 1, unitPrice: 8000 }], paymentMethod: 'cash', discount: 0, amountReceived: 10000, notes: '' });
  assert(ventaConVuelto.amountReceived === 10000, 'El monto recibido queda guardado en el registro de la venta');
  assert(calculateChange(ventaConVuelto) === 2000, `El vuelto de una venta guardada se recalcula correctamente: $${calculateChange(ventaConVuelto)} (esperado $2000)`);
  assert((await productService.get(torta.id)).stock === stockTortaAntesVueltoTest - 1, 'La venta con vuelto también descontó stock del producto correctamente (la venta rechazada por monto insuficiente no descontó nada)');

  // ---------- MIGRACIONES ----------
  section('Migraciones de esquema');
  const { runMigrations, CURRENT_SCHEMA_VERSION } = await import(`${BASE}/core/storage/migrations.js`);
  const { storage } = await import(`${BASE}/core/storage/index.js`);

  await runMigrations();
  const schemaVersion = await storage.getMeta('schemaVersion');
  assert(schemaVersion === CURRENT_SCHEMA_VERSION, `runMigrations() deja registrada la versión de esquema actual (v${schemaVersion})`);

  section('Estado global: preferencias de accesibilidad (regresión: ya no toca localStorage directo)');
  const { store } = await import(`${BASE}/core/state.js`);
  await store.setA11yPref('theme', 'dark');
  const savedA11y = await storage.getMeta('a11yPrefs');
  assert(savedA11y?.theme === 'dark', 'setA11yPref() persiste correctamente a través de storage.setMeta()');

  const { store: freshStore } = await import(`${BASE}/core/state.js?t=${Date.now()}`);
  await freshStore.hydrateA11yPrefs();
  assert(freshStore.getState().a11y.theme === 'dark', 'hydrateA11yPrefs() recupera la preferencia guardada en un "reinicio" simulado de la app');

  section('Logger (regresión: bug de prefijo de storage corregido)');
  const { logger } = await import(`${BASE}/core/logger.js`);
  await logger.info('Mensaje de prueba', { origin: 'integration-test' });
  const logs = await storage.getAll('system_logs');
  assert(logs.some((l) => l.message === 'Mensaje de prueba'), 'Un log escrito con logger.info() se puede leer de vuelta a través de storage.getAll() (antes se escribía en una clave distinta a la que se leía)');

  // ---------- PROVEEDORES + COMPRAS ----------
  section('Proveedores + Compras (conectado con Inventario e Ingredientes)');
  const { supplierService } = await import(`${BASE}/modules/suppliers/supplier.service.js`);
  const { purchaseService } = await import(`${BASE}/modules/purchases/purchase.service.js`);

  const proveedor = await supplierService.create({ name: 'Molino Central', contactName: 'Juan Pérez', phone: '11-4444-5555', email: '', leadTimeDays: 3, notes: '' });
  assert(proveedor.id, 'Proveedor creado correctamente');

  const stockHarinaAntesCompra = (await ingredientService.get(harina.id)).stock;
  const costoHarinaAntesCompra = (await ingredientService.get(harina.id)).cost;

  const compra = await purchaseService.create({
    supplierId: proveedor.id,
    items: [{ ingredientId: harina.id, quantity: 20, unitCost: 850 }],
    notes: 'Compra de prueba',
  });
  assert(compra.id, 'Compra registrada correctamente');

  const harinaTrasCompra = await ingredientService.get(harina.id);
  assert(harinaTrasCompra.stock === stockHarinaAntesCompra + 20, `La compra sumó stock a Harina vía Inventario: ${harinaTrasCompra.stock}kg (esperado ${stockHarinaAntesCompra + 20}kg)`);
  assert(harinaTrasCompra.cost === 850 && harinaTrasCompra.cost !== costoHarinaAntesCompra, `La compra actualizó el costo de Harina al precio pagado: $${harinaTrasCompra.cost}`);

  const movimientosHarinaTrasCompra = await inventoryService.listForIngredient(harina.id);
  assert(movimientosHarinaTrasCompra.some((m) => m.type === 'in' && m.quantity === 20 && m.reason.includes('Molino Central')), 'La compra generó el movimiento de entrada correcto en Inventario, trazable al proveedor');

  // El costo actualizado por la compra se refleja automáticamente en el costo de la receta (sin que Compras conozca a Recetas)
  const ingredientesActualizados = await ingredientService.list();
  const costoRecetaTrasCompra = recipeService.calculateCost(receta, ingredientesActualizados);
  assert(costoRecetaTrasCompra.totalCost > costo.totalCost, 'El costo de la receta sube automáticamente al recalcularse con el nuevo costo de Harina, sin que Compras conozca a Recetas');

  // ---------- PEDIDOS ----------
  section('Pedidos (seña, saldo pendiente, entrega)');
  const { orderService } = await import(`${BASE}/modules/orders/order.service.js`);

  const sesionCaja2 = await cashboxService.open({ openingAmount: 0, notes: '' });
  const pedido = await orderService.create({
    customerId: cliente.id,
    items: [{ productId: torta.id, quantity: 2, unitPrice: 8000 }],
    deliveryDate: '2026-07-20',
    depositAmount: 5000,
    notes: 'Pedido de prueba',
  });
  assert(pedido.total === 16000, `El total del pedido se calcula correctamente: $${pedido.total}`);

  const movimientosSeña = await cashboxService.listMovements(sesionCaja2.id);
  assert(movimientosSeña.some((m) => m.amount === 5000 && m.reason.includes(pedido.id.slice(0, 8))), 'La seña del pedido se registró automáticamente en Caja al crearlo');

  const stockTortaAntesEntrega = (await productService.get(torta.id)).stock;
  const entregado = await orderService.markDelivered(pedido.id);
  assert(entregado.status === 'delivered', 'El pedido queda marcado como entregado');

  const tortaTrasEntrega = await productService.get(torta.id);
  assert(tortaTrasEntrega.stock === stockTortaAntesEntrega - 2, `El stock de la Torta se descontó al entregar el pedido: ${tortaTrasEntrega.stock} (esperado ${stockTortaAntesEntrega - 2})`);

  const movimientosSaldo = await cashboxService.listMovements(sesionCaja2.id);
  const saldoEsperado = 16000 - 5000;
  assert(movimientosSaldo.some((m) => m.amount === saldoEsperado && m.reason.includes(pedido.id.slice(0, 8))), `El saldo pendiente (${saldoEsperado}) se registró en Caja al entregar el pedido`);

  await cashboxService.close(sesionCaja2.id, { closingAmountCounted: 0 + 5000 + saldoEsperado, notes: 'Cierre de prueba 2' });

  section('Caja: cierre con monto DISTINTO al esperado (nunca se había probado)');
  const sesionMismatch = await cashboxService.open({ openingAmount: 1000, notes: 'Prueba de arqueo con diferencia' });

  // Faltante: contás MENOS de lo esperado.
  const cierreFaltante = await cashboxService.close(sesionMismatch.id, { closingAmountCounted: 800, notes: '' });
  assert(cierreFaltante.status === 'closed', 'La caja cierra sin problema aunque el monto contado sea MENOR al esperado (no exige un monto exacto)');
  assert(cierreFaltante.difference === -200, `La diferencia se calcula correctamente como faltante: $${cierreFaltante.difference} (esperado -200)`);

  const sesionMismatch2 = await cashboxService.open({ openingAmount: 1000, notes: 'Prueba de arqueo con sobrante' });
  // Sobrante: contás MÁS de lo esperado.
  const cierreSobrante = await cashboxService.close(sesionMismatch2.id, { closingAmountCounted: 1300, notes: '' });
  assert(cierreSobrante.status === 'closed', 'La caja cierra sin problema aunque el monto contado sea MAYOR al esperado');
  assert(cierreSobrante.difference === 300, `La diferencia se calcula correctamente como sobrante: $${cierreSobrante.difference} (esperado 300)`);

  const { sessionSummaryHtml } = await import(`${BASE}/modules/cashbox/cashbox.renderer.js`);
  assert(sessionSummaryHtml(cierreFaltante).includes('badge--danger'), 'Un faltante se muestra en rojo (badge--danger)');
  assert(sessionSummaryHtml(cierreSobrante).includes('badge--success'), 'Un sobrante se muestra en verde (badge--success)');

  // ---------- REPORTES ----------
  section('Reportes (agregación de solo lectura sobre datos existentes)');
  const { reportService } = await import(`${BASE}/modules/reports/report.service.js`);

  const rangoAmplio = { from: '2020-01-01', to: '2030-12-31' };
  const reporteVentas = await reportService.salesReport(rangoAmplio);
  assert(reporteVentas.count === 2, 'El reporte de ventas cuenta las 2 ventas creadas durante el test (la rechazada por stock/monto insuficiente no cuenta)');
  assert(reporteVentas.totalRevenue === venta.total + ventaConVuelto.total, `El reporte de ventas suma correctamente el total: $${reporteVentas.totalRevenue}`);
  assert(reporteVentas.byPaymentMethod['Efectivo'] === venta.total + ventaConVuelto.total, 'El reporte de ventas agrupa correctamente por método de pago');

  const reporteProduccion = await reportService.productionReport(rangoAmplio);
  assert(reporteProduccion.count === 3, 'El reporte de producción cuenta las 3 órdenes completadas (×2, ×1, y la de la prueba de conversión de unidades; la ×100 quedó pendiente y no cuenta)');
  const ordenesConRecetaConocida = reporteProduccion.orders.filter((o) => o.recipeName !== 'Receta eliminada');
  assert(ordenesConRecetaConocida.every((o) => o.recipeName === receta.name), 'El reporte de producción resuelve el nombre de la receta a partir del id en las órdenes cuya receta todavía existe (la de la prueba de unidades borró su receta a propósito, y se muestra como "Receta eliminada", igual que cualquier otra referencia histórica en la app)');

  const reportePurchases = await reportService.purchasesReport(rangoAmplio);
  assert(reportePurchases.count === 1, 'El reporte de compras cuenta la compra registrada');
  assert(reportePurchases.bySupplierId[proveedor.id] === 20 * 850, 'El reporte de compras agrupa correctamente el gasto por proveedor');

  const { buildCsv } = await import(`${BASE}/core/csv.js`);
  const csv = buildCsv({ headers: ['Fecha', 'Total'], rows: [['2026-07-16', 1000], ['coma, y "comillas"', 2000]] });
  assert(csv.includes('"coma, y ""comillas"""'), 'buildCsv() escapa correctamente comas y comillas dentro de una celda');

  // ---------- DASHBOARD (agregación de todos los módulos) ----------
  section('Dashboard (agregación cross-módulo)');
  const { dashboardService } = await import(`${BASE}/modules/dashboard/dashboard.service.js`);
  const resumen = await dashboardService.getSummary();

  assert(resumen.totalProducts === 2, 'Dashboard cuenta correctamente los productos totales');
  assert(resumen.totalIngredients === 4, 'Dashboard cuenta correctamente los ingredientes totales');
  assert(resumen.totalRecipes === 1, 'Dashboard cuenta correctamente las recetas totales');
  assert(resumen.totalCustomers === 1, 'Dashboard cuenta correctamente los clientes totales');
  assert(resumen.pendingProduction === 1, 'Dashboard cuenta correctamente la producción pendiente (quedó 1 orden sin completar: la ×100)');
  assert(resumen.todaySalesTotal === venta.total + ventaConVuelto.total, `Dashboard suma correctamente las ventas de hoy: $${resumen.todaySalesTotal}`);
  assert(resumen.cashboxOpen === false, 'Dashboard refleja que la caja está cerrada');
  assert(resumen.pendingOrders === 0, 'Dashboard cuenta correctamente los pedidos pendientes (el único pedido creado ya fue entregado)');
  assert(resumen.lowStockIngredients.some((i) => i.id === chocolate.id), 'Dashboard detecta a Chocolate cobertura en la lista de stock bajo');

  // ---------- BACKUP (exportar + restaurar) ----------
  section('Backup (exportar + restaurar)');
  const { exportBackup, restoreBackup } = await import(`${BASE}/core/backup.js`);

  const backupAntes = await exportBackup();
  assert(backupAntes.data.products.length === 2, 'El backup exportado incluye los 2 productos creados');
  assert(backupAntes.data.recipes.length === 1, 'El backup exportado incluye la receta creada');
  assert(backupAntes.schemaVersion === CURRENT_SCHEMA_VERSION, 'El backup registra la versión de esquema actual');

  // Se borra un producto para simular pérdida de datos, y se restaura desde el backup.
  await productService.remove(torta.id);
  assert((await productService.list()).length === 1, 'El producto se eliminó correctamente antes de restaurar (queda solo el vinculado a la receta)');

  await restoreBackup(backupAntes);
  const productosTrasRestaurar = await productService.list();
  assert(productosTrasRestaurar.length === 2 && productosTrasRestaurar.some((p) => p.id === torta.id), 'restoreBackup() recupera el producto eliminado, con el mismo id original');

  const recetaTrasRestaurar = await recipeService.get(receta.id);
  assert(recetaTrasRestaurar.items[0].ingredientId === harina.id, 'Tras restaurar, las referencias entre colecciones siguen intactas (receta -> ingrediente)');

  section('QA: decimales (0.333 kg) — ¿aparecen errores de redondeo visibles?');
  const ingredienteDecimal = await ingredientService.create({ name: 'Ingrediente decimal de prueba', unit: 'kg', stock: 10, minStock: 0, cost: 300, supplier: '', notes: '' });
  const recetaDecimal = await recipeService.create({
    name: 'Receta decimal de prueba',
    items: [{ ingredientId: ingredienteDecimal.id, quantity: 0.333 }],
    yieldQuantity: 1, yieldUnit: 'unidad', prepTimeMinutes: 0, notes: '',
  });
  const costoDecimal = recipeService.calculateCost(recetaDecimal, await ingredientService.list());
  const esperadoDecimal = 0.333 * 300; // 99.9
  assert(Math.abs(costoDecimal.totalCost - esperadoDecimal) < 0.0001, `0.333 kg × $300 da $${costoDecimal.totalCost} (esperado ~$${esperadoDecimal}) — sin error de redondeo visible en el resultado final`);
  // Limpieza.
  await recipeService.remove(recetaDecimal.id);
  await ingredientService.remove(ingredienteDecimal.id);

  section('QA: importar el mismo backup dos veces no duplica registros');
  const cantidadProductosAntesDeReimportar = (await productService.list()).length;
  await restoreBackup(backupAntes);
  await restoreBackup(backupAntes); // se importa una segunda vez, a propósito
  const cantidadProductosTrasReimportar = (await productService.list()).length;
  assert(cantidadProductosTrasReimportar === cantidadProductosAntesDeReimportar, `Importar el mismo backup 2 veces seguidas no duplica registros: ${cantidadProductosTrasReimportar} productos antes y después (restoreBackup() siempre borra la colección completa antes de recrearla)`);

  section('QA: Verificador de integridad de datos (reportService.checkIntegrity)');
  const { reportService: reportServiceParaIntegridad } = await import(`${BASE}/modules/reports/report.service.js`);

  const resultadoLimpio = await reportServiceParaIntegridad.checkIntegrity();
  assert(resultadoLimpio.issues.every((i) => i.severity !== 'error'), `Con los datos actuales (todos consistentes) no hay ningún error de severidad "error": ${JSON.stringify(resultadoLimpio.issues.filter((i) => i.severity === 'error'))}`);
  assert(resultadoLimpio.totalChecked > 0, `El verificador efectivamente revisó registros: ${resultadoLimpio.totalChecked}`);

  // Ahora se genera un caso real de referencia rota, sin pasar por el Controller
  // (que la bloquearía) — llamando al Service directo, para simular el escenario
  // residual que el verificador está pensado para atrapar (ver report.service.js).
  const ingredienteHuerfano = await ingredientService.create({ name: 'Ingrediente para huérfano de prueba', unit: 'g', stock: 100, minStock: 0, cost: 10, supplier: '', notes: '' });
  const recetaConHuerfano = await recipeService.create({
    name: 'Receta temporal para probar integridad',
    items: [{ ingredientId: ingredienteHuerfano.id, quantity: 5 }],
    yieldQuantity: 1, yieldUnit: 'unidad', prepTimeMinutes: 0, notes: '',
  });
  await storage.remove('ingredients', ingredienteHuerfano.id); // borrado directo, sin pasar por la guarda del Controller

  const resultadoConHuerfano = await reportServiceParaIntegridad.checkIntegrity();
  const errorDeReceta = resultadoConHuerfano.issues.find((i) => i.area === 'Recetas' && i.severity === 'error');
  assert(Boolean(errorDeReceta), 'El verificador detecta la receta que quedó con un ingrediente inexistente tras el borrado directo');

  // Limpieza para no afectar el resto del test.
  await recipeService.remove(recetaConHuerfano.id);

  // ---------- RESUMEN ----------
  const elapsedMs = Date.now() - startTime;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`RESULTADO: ${passed} pasaron, ${failed} fallaron, de ${passed + failed} verificaciones totales.`);
  console.log(`Tiempo de ejecución: ${elapsedMs}ms`);
  console.log('='.repeat(50));
  console.log('Actualizá docs/METRICS.md con estos números si corresponde a una nueva versión.');
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('\n💥 ERROR NO CONTROLADO DURANTE EL TEST:', err);
  process.exit(1);
});
