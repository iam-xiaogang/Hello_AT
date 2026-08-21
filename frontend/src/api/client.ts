export class ApiError extends Error { constructor(message: string, public status?: number) { super(message); } }

export async function apiFetch(path: string, init: RequestInit = {}) {
  let response: Response;
  try { response = await fetch(`/api${path}`, init); }
  catch { throw new ApiError("网络连接失败，请确认后端服务正在运行。"); }
  if (!response.ok) {
    let message = "请求失败，请稍后重试。";
    try { const data = await response.json(); message = data.detail ?? message; } catch { /* keep fallback */ }
    throw new ApiError(message, response.status);
  }
  return response;
}
