/** 读取当前页面 URL 查询参数（供工具页 URL 预填使用，如 /tools/qr-code?text=xxx）。 */
export function getParam(name: string): string {
  try {
    return new URL(window.location.href).searchParams.get(name) ?? "";
  } catch {
    return "";
  }
}
