const { TOOLS } = require("../../utils/tools");

Page({
  data: {
    tools: TOOLS,
    statusBarHeight: 20,
    navBarHeight: 44,
    menuBtnSize: 32,
    capsuleSide: 96,
    sidebarOpen: false,
  },
  onLoad() {
    // 用菜单胶囊按钮位置精确计算导航栏高度，适配刘海屏 / 挖孔屏 / iPad 等不同机型。
    try {
      const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const statusBarHeight = win.statusBarHeight || 20;
      let navBarHeight = 44;
      let menuBtnSize = 32;
      let capsuleSide = 96;
      if (wx.getMenuButtonBoundingClientRect) {
        const menu = wx.getMenuButtonBoundingClientRect();
        // 标准公式：胶囊上边距 × 2 + 胶囊高度 = 导航栏内容高度
        navBarHeight = (menu.top - statusBarHeight) * 2 + menu.height;
        menuBtnSize = menu.height;
        // 右侧预留胶囊宽度 + 间距，避免标题被胶囊遮挡
        capsuleSide = (win.windowWidth || 375) - menu.right + 8;
      }
      this.setData({ statusBarHeight, navBarHeight, menuBtnSize, capsuleSide });
    } catch {
      // 保持默认值
    }
  },
  openSidebar() {
    this.setData({ sidebarOpen: true });
  },
  closeSidebar() {
    this.setData({ sidebarOpen: false });
  },
  openTool(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url });
  },
});
