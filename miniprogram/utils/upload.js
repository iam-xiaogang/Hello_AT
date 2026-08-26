const { BASE_URL } = require("../config");

/**
 * 上传文件到后端（multipart/form-data）。
 * @param {string} path    接口路径，如 "/tools/doc-converter/convert"
 * @param {string} filePath 本地文件路径
 * @param {string} name    表单字段名（后端约定为 "file"）
 * @param {object} formData 额外表单字段
 * @param {boolean} binary 目标是否为二进制响应（docx 等）。文本目标传 false。
 * @returns {Promise<import("./upload").UploadResult>} resolve(res)：res.data 为字符串或 ArrayBuffer
 */
function upload(path, filePath, name, formData = {}, binary = false) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: BASE_URL + path,
      filePath,
      name,
      formData,
      ...(binary ? { responseType: "arraybuffer" } : {}),
      timeout: 120000,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res);
        } else {
          const detail = res.data && res.data.detail ? res.data.detail : `请求失败（${res.statusCode}）`;
          reject(new Error(detail));
        }
      },
      fail: () => reject(new Error("网络连接失败，请确认后端服务可用。")),
    });
  });
}

module.exports = { upload };
