/**
 * Đọc đích quay về từ query param "returnTo". Chỉ chấp nhận route nội bộ
 * (bắt đầu bằng "/") để chặn open-redirect ra domain ngoài nếu URL bị chỉnh tay.
 */
export function getReturnTo(searchParams, fallback = null) {
  const returnTo = searchParams.get("returnTo");
  return returnTo && returnTo.startsWith("/") ? returnTo : fallback;
}

/** Gắn returnTo vào 1 URL nội bộ, dùng khi tạo link điều hướng tiếp (giữ xuyên suốt chuỗi trang). */
export function withReturnTo(path, returnTo) {
  if (!returnTo) return path;
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}returnTo=${encodeURIComponent(returnTo)}`;
}