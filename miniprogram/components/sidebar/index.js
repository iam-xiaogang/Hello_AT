const { byCategory } = require("../../utils/tools");

Component({
  properties: {
    visible: { type: Boolean, value: false },
  },
  data: {
    categories: [],
  },
  lifetimes: {
    attached() {
      this.setData({ categories: byCategory() });
    },
  },
  methods: {
    noop() {},
    close() {
      this.triggerEvent("close");
    },
    openTool(e) {
      const url = e.currentTarget.dataset.url;
      this.triggerEvent("close");
      wx.navigateTo({ url });
    },
  },
});
