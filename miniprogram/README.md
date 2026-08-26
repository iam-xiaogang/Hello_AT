# Toolbox 微信小程序端

Toolbox 工具箱的微信小程序客户端，与 Web 前端共用同一个 FastAPI 后端（`backend/`）。

## 目录结构

```text
miniprogram/
  app.js / app.json / app.wxss     # 小程序入口与全局配置
  project.config.json              # 开发者工具项目配置（appid 为占位符）
  config.js                        # 后端 API 地址等全局配置（唯一需要改的配置）
  sitemap.json
  utils/
    request.js                     # wx.request 封装（JSON 接口，错误提示与 Web 端一致）
    upload.js                      # wx.uploadFile 封装（文件上传，支持二进制响应）
    codec.js                       # Base64 编解码（小程序无 btoa/atob，自带 UTF-8 支持）
    tools.js                       # 工具清单与分类（首页网格和侧边栏共用）
  components/
    sidebar/                       # 侧边栏抽屉组件（分类导航，首页汉堡按钮触发）
  pages/
    index/    # 工具首页（自定义渐变导航栏 + 侧边栏）
    json/     # JSON 格式化 / 校验（纯本地）
    base64/   # Base64 编解码（纯本地）
    compress/ # 图片压缩（微信原生 wx.compressImage，仅 JPG）
    convert/  # 文档转换（走后端 /api/tools/doc-converter/convert）
    webview/  # 博客 / Daily News / 英语学习（web-view）
```

## UI 说明

- 采用与 Web 端一致的多巴胺配色（紫 → 靛蓝 → 天蓝渐变），每个工具一个专属渐变强调色。
- 首页为自定义导航栏（渐变背景），左上角 ☰ 按钮打开侧边栏抽屉（按分类分组导航）；工具页使用标准导航栏（紫色），带返回按钮。
- `web-view` 页面（博客 / Daily News / 英语学习）是系统原生组件，无法叠加侧边栏，从首页或抽屉进入。

## 功能说明

| 页面 | 实现方式 | 依赖后端 |
|---|---|---|
| JSON 格式化 / 校验 | 本地 JS | 否 |
| Base64 编解码 | 本地 JS | 否 |
| 图片压缩 | 微信原生 `wx.compressImage`（仅 JPG） | 否 |
| 文档转换 | `wx.uploadFile` 上传到后端 | 是 |
| Daily News | `<web-view>` 加载 `https://www.xiaogangai.site/news/`（nginx 同源代理） | 否 |
| 英语学习 | `<web-view>` 加载 `https://www.xiaogangai.site/english-learning/`（nginx 同源代理） | 否 |
| 博客 | `<web-view>` 嵌入 `https://iamxiaogang.cn/` | 否 |

**说明：**
- 图片压缩在小程序端使用微信原生接口（本地、仅 JPG）；PNG / WebP 压缩请使用 Web 端。
- Daily News 与英语学习的外部服务是纯 HTTP 地址，小程序禁止直连；因此通过 Toolbox 服务器 nginx 的 `/news/`、`/english-learning/` 同源代理包装成 HTTPS 地址，再用 `<web-view>` 加载。
- PDF → Word 依赖二进制响应（ArrayBuffer）；若个别基础库不支持，页面会提示改用文本转换。
- 英语学习（Streamlit）依赖 WebSocket，若页面空白，需在 Streamlit 服务端加启动参数 `--server.enableCORS=false --server.enableXsrfProtection=false`。

## 运行步骤

1. 安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)，登录后「导入项目」。
2. 选择本目录（`miniprogram/`），AppID 可先用测试号，或替换 `project.config.json` 中的 `appid` 为你的小程序 AppID。
3. 开发调试：在开发者工具右上角「详情 → 本地设置」勾选 **「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」**，即可直接访问后端。
4. 编译运行，首页即可进入各工具。

## 发布前的必要配置（mp.weixin.qq.com 后台）

1. **request 合法域名**：添加 `https://www.xiaogangai.site`（后端 API 所在域名）。
2. **web-view 业务域名**：添加 `https://www.xiaogangai.site` 和 `https://iamxiaogang.cn`（Daily News / 英语学习 / 博客都经 web-view 加载）。添加业务域名需在对应站点根目录放置微信提供的校验文件（nginx 已把 `/` 指向 `frontend/dist`，把校验文件放到该目录即可）。
3. 后端必须通过 **HTTPS** 提供服务（当前 nginx 已配置 Let's Encrypt 证书）。

## 配置后端地址

编辑 `config.js`：

```js
module.exports = {
  BASE_URL: "https://www.xiaogangai.site/api",   // 后端 API 基地址（/api 前缀）
  BLOG_URL: "https://iamxiaogang.cn/",           // 博客地址
};
```

## 注意事项

- 小程序请求不涉及浏览器 CORS，后端无需为此修改（现有 CORS 配置仅作用于 Web 端）。
- 上传超时已设为 120 秒（PDF → Word 转换耗时较长）。
- 若后端部署在别的域名，改 `config.js` 即可，无需动其他文件。
