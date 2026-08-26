const codec = require("../../utils/codec");

Page({
  data: {
    input: "",
    output: "",
    error: "",
  },
  onInput(e) {
    this.setData({ input: e.detail.value });
  },
  encode() {
    try {
      this.setData({ output: codec.encode(this.data.input), error: "" });
    } catch {
      this.setData({ error: "编码失败，请检查输入内容。" });
    }
  },
  decode() {
    try {
      this.setData({ output: codec.decode(this.data.input), error: "" });
    } catch {
      this.setData({ error: "无法解码，请确认输入的是有效的 Base64 字符串。" });
    }
  },
  copyOutput() {
    if (!this.data.output) return;
    wx.setClipboardData({
      data: this.data.output,
      success: () => wx.showToast({ title: "已复制", icon: "success" }),
    });
  },
});
