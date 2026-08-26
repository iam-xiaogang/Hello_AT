// 后端 API 基地址与外部页面地址。
//
// 开发阶段：在微信开发者工具中勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」
// 即可直接调试。
// 发布前：需在 mp.weixin.qq.com 后台「开发管理 → 服务器域名」中配置：
//   - request 合法域名：BASE_URL 的域名（https://www.xiaogangai.site）
//   - web-view 业务域名：BLOG_URL、NEWS_URL、ENGLISH_URL 的域名
//     （https://iamxiaogang.cn 与 https://www.xiaogangai.site）
//
// NEWS_URL / ENGLISH_URL 走 Toolbox 服务器的 nginx 同源代理（/news/、/english-learning/），
// 把外部的纯 HTTP 服务包装成 HTTPS 地址，满足小程序的 HTTPS 要求。
module.exports = {
  BASE_URL: "https://www.xiaogangai.site/api",
  BLOG_URL: "https://iamxiaogang.cn/",
  NEWS_URL: "https://www.xiaogangai.site/news/",
  ENGLISH_URL: "https://www.xiaogangai.site/english-learning/",
};
