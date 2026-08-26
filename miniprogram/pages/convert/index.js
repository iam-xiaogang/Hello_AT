const { upload } = require("../../utils/upload");

const TARGETS = [
  { id: "pdf-to-word", label: "PDF → Word", hint: "转为可编辑 .docx，完成后自动打开预览", ext: "pdf", binary: true },
  { id: "pdf-to-text", label: "PDF → 文本", hint: "提取 PDF 文字内容为 .txt", ext: "pdf", binary: false },
  { id: "word-to-text", label: "Word → 文本", hint: "提取 Word 文档文字为 .txt", ext: "docx", binary: false },
];

Page({
  data: {
    targets: TARGETS,
    target: "pdf-to-text",
    targetHint: TARGETS[1].hint,
    fileName: "",
    filePath: "",
    busy: false,
    error: "",
    resultText: "",
  },
  selectTarget(e) {
    const t = TARGETS.find((x) => x.id === e.currentTarget.dataset.id);
    this.setData({ target: t.id, targetHint: t.hint, fileName: "", filePath: "", resultText: "", error: "" });
  },
  chooseFile() {
    wx.chooseMessageFile({
      count: 1,
      type: "file",
      success: (res) => {
        const f = res.tempFiles[0];
        this.setData({ fileName: f.name, filePath: f.path, resultText: "", error: "" });
      },
    });
  },
  async convert() {
    const { target, filePath } = this.data;
    if (!filePath) return;
    const t = TARGETS.find((x) => x.id === target);
    this.setData({ busy: true, error: "", resultText: "" });
    try {
      const res = await upload("/tools/doc-converter/convert", filePath, "file", { target }, t.binary);
      if (t.binary) {
        if (typeof res.data === "string") {
          // 基础库不支持二进制响应（ArrayBuffer）时给出提示，引导使用文本目标。
          throw new Error("当前环境不支持二进制响应，请改用「PDF → 文本」或「Word → 文本」。");
        }
        await this.saveBinary(res.data);
      } else {
        this.setData({ resultText: String(res.data) });
      }
    } catch (e) {
      this.setData({ error: e.message || "转换失败。" });
    } finally {
      this.setData({ busy: false });
    }
  },
  saveBinary(data) {
    return new Promise((resolve, reject) => {
      const fs = wx.getFileSystemManager();
      const filePath = `${wx.env.USER_DATA_PATH}/converted.docx`;
      fs.writeFile({
        filePath,
        data,
        encoding: "binary",
        success: () => {
          wx.openDocument({
            filePath,
            fileType: "docx",
            success: resolve,
            fail: () => {
              wx.showToast({ title: "文件已保存，但无法预览", icon: "none" });
              resolve();
            },
          });
        },
        fail: reject,
      });
    });
  },
  copyResult() {
    if (!this.data.resultText) return;
    wx.setClipboardData({
      data: this.data.resultText,
      success: () => wx.showToast({ title: "已复制", icon: "success" }),
    });
  },
});
