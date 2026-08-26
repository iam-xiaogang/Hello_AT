const config = require("../../config");

const TITLES = [
  { match: "english-learning", title: "英语学习" },
  { match: "/news/", title: "Daily News" },
  { match: "iamxiaogang.cn", title: "博客" },
];

Page({
  data: {
    url: config.BLOG_URL,
  },
  onLoad(options) {
    if (options.src) {
      try {
        this.setData({ url: decodeURIComponent(options.src) });
      } catch {
        // 保持默认博客地址
      }
    }
    const hit = TITLES.find((t) => this.data.url.includes(t.match));
    if (hit) wx.setNavigationBarTitle({ title: hit.title });
  },
});
