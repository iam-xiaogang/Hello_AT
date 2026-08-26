const { BASE_URL } = require("../config");

/**
 * 通用 JSON 请求封装（与前端 apiFetch 语义一致）。
 * 返回 Promise<data>；非 2xx 或网络错误时 reject(Error(中文提示))。
 */
function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + path,
      method: options.method || "GET",
      data: options.data,
      header: options.header || {},
      timeout: options.timeout || 60000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          const detail = res.data && res.data.detail ? res.data.detail : `请求失败（${res.statusCode}）`;
          reject(new Error(detail));
        }
      },
      fail: () => reject(new Error("网络连接失败，请确认后端服务可用。")),
    });
  });
}

module.exports = { request };
