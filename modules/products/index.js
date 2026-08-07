/**
 * modules/products/index.js
 * Responsabilidad: única puerta de entrada pública del módulo Productos.
 * El Router solo conoce este archivo — nunca importa directamente
 * product.controller.js, product.service.js, etc. desde fuera del módulo.
 */

export { render } from './product.controller.js';
