export function getBackendTimezoneOffset() {
  // JS Date.getTimezoneOffset() trả offset ngược dấu so với backend cần (UTC + offset = local)
  return -new Date().getTimezoneOffset();
}