// 图片压缩：使用微信原生 wx.compressImage 在本地压缩（仅 JPG）。
// PNG / WebP 压缩请使用 Web 端（后端 Pillow 压缩）。
Page({
  data: {
    src: "",
    quality: 80,
    busy: false,
    resultPath: "",
    sizeText: "",
    error: "",
  },
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      success: (res) => {
        const file = res.tempFiles[0];
        this.setData({ src: file.tempFilePath, resultPath: "", sizeText: "", error: "" });
      },
    });
  },
  onQuality(e) {
    this.setData({ quality: e.detail.value });
  },
  compress() {
    if (!this.data.src) return;
    this.setData({ busy: true, error: "", resultPath: "", sizeText: "" });
    wx.compressImage({
      src: this.data.src,
      quality: this.data.quality,
      success: (res) => {
        this.setData({ resultPath: res.tempFilePath, busy: false });
        wx.getFileInfo({
          filePath: res.tempFilePath,
          success: (info) => this.setData({ sizeText: (info.size / 1024).toFixed(1) + " KB" }),
          fail: () => {},
        });
      },
      fail: () => this.setData({ busy: false, error: "压缩失败，请确认图片为 JPG 格式。" }),
    });
  },
  preview() {
    if (this.data.resultPath) wx.previewImage({ urls: [this.data.resultPath] });
  },
  save() {
    wx.saveImageToPhotosAlbum({
      filePath: this.data.resultPath,
      success: () => wx.showToast({ title: "已保存到相册", icon: "success" }),
      fail: () => {
        wx.showModal({
          title: "需要相册权限",
          content: "请在设置中允许保存图片到相册",
          confirmText: "去设置",
          success: (r) => {
            if (r.confirm) wx.openSetting();
          },
        });
      },
    });
  },
});
