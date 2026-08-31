# Toolbox

一个 React + FastAPI 的可扩展工具箱单页应用。前端工具在浏览器中运行；需要文件处理、密钥或持久化的工具经由统一的 `/api/tools/{tool_id}/{action}` REST 接口调用后端。

## 目录

```text
backend/
  app/
    main.py                 # FastAPI、CORS、/api 前缀
    core/config.py          # 环境配置
    db.py                   # 未来的 SQLite / PostgreSQL 接入点
    tools/
      registry.py           # 自动发现每个工具的 router.py
      image_compressor/
        router.py service.py schemas.py
frontend/
  src/
    api/client.ts           # 统一请求、网络/接口错误处理
    components/ layouts/ pages/ state/
    tools/
      registry.ts           # 前端工具唯一注册点
      json-formatter/       # index.tsx + meta.ts
      base64/                # index.tsx + meta.ts
      image-compressor/     # index.tsx + meta.ts
miniprogram/                # 微信小程序端（与 Web 共用后端 API）
  app.js app.json config.js utils/ pages/
docker-compose.yml
```

## 本地开发

需要 Python 3.11+ 与 Node.js 20+。

```bash
# 终端一：后端
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

```bash
# 终端二：前端
cd frontend
npm install
npm run dev
```

打开 `http://localhost:5173`。Vite 会把 `/api` 请求代理到 `http://localhost:8000`；后端也已允许该来源的 CORS 请求。

### 环境变量（backend/.env，均已 gitignore）

| 变量 | 默认值 | 说明 |
|---|---|---|
| `TOOLBOX_VISITOR_API_BASE` | `https://iamxiaogang.cn` | 博客访问统计接口地址；留空则只用本地记录 |
| `TOOLBOX_VISITOR_API_TOKEN` | `iamxiaogang` | 读取博客库时的令牌（与博客侧 `VISITOR_API_TOKEN` 一致） |
| `TOOLBOX_VISITOR_RECORD_RATE_LIMIT` | `5` | 访问埋点每 IP 每分钟记录上限（防刷库） |
| `TOOLBOX_AI_API_KEY` | 空 | DeepSeek 等 API 密钥，**只放 .env，勿写死在代码** |
| `TOOLBOX_AI_API_BASE` | `https://api.deepseek.com/v1` | AI 接口地址（OpenAI 兼容） |
| `TOOLBOX_AI_MODEL` | `deepseek-chat` | AI 模型名 |
| `TOOLBOX_AI_API_TOKEN` | 空 | 可选：配置后 AI 接口需携带 `X-Api-Token`（前端配 `VITE_AI_API_TOKEN` 自动带上） |
| `TOOLBOX_AI_RATE_LIMIT` | `30` | AI 接口每 IP 每小时请求上限 |

### SEO

- 每个工具页动态设置 `title` / `description` / OG 标签 / JSON-LD 结构化数据（`frontend/src/utils/seo.ts`），站点域名可用 `VITE_SITE_BASE` 覆盖。
- `npm run build` 时自动扫描工具注册表生成 `public/sitemap.xml`（18 个 URL），`public/robots.txt` 指向它；部署域名用 `SITE_DOMAIN` 环境变量覆盖。
- 提交收录：
  - 百度：百度搜索资源平台验证站点后，`BAIDU_TOKEN=xxx BAIDU_SITE=www.xiaogangai.site node frontend/scripts/push-baidu.mjs` 主动推送；也可在站长平台提交 sitemap。
  - Google：Search Console 提交 `https://www.xiaogangai.site/sitemap.xml`。
- SPA 深度预渲染（每个工具页生成静态 HTML）需要 SSR 化改造，属于后续可选优化。

### 构建后本地预览

```bash
cd frontend
npm run build
npm run preview
```

打开 `http://localhost:4173`。`vite.config.ts` 中 `preview.proxy` 与 `server.proxy` 共用同一份代理配置，因此构建产物访问 `/api` 时同样会转发到 `http://localhost:8000`（需先启动后端）。若用 Nginx 等其他静态服务器托管 `dist/`，需自行配置 `/api` 反向代理（参考 `nginx.conf`）。

## Dockerß

```bash
docker compose up --build
```
ß
打开 `http://localhost:8080`。Nginx 会将 `/api` 反向代理到后端容器。

## 新增纯前端工具

1. 新建 `frontend/src/tools/ my-tool/meta.ts`，导出包含 `id`、`name`、`description`、`icon`、`category`、`path`、`kind: "frontend-only"` 的 `meta`。
2. 新建同目录 `index.tsx`，默认导出 React 组件。
3. 在 `frontend/src/tools/registry.ts` 导入两者，并加入 `tools` 数组。

无需改动菜单、欢迎页、路由或其他文件：它们都从注册表生成。

## 新增需要后端的工具

1. 按上述方式创建前端目录，但将 `kind` 设置为 `"needs-backend"`。
2. 新建 `backend/app/tools/my_tool/`（Python 包名使用下划线），添加 `__init__.py`、`router.py`、`service.py`、`schemas.py`。
3. 在 `router.py` 导出名为 `router` 的 `APIRouter`，并设置 `prefix="/tools/my-tool"`。接口 action 例如 `@router.post("/process")`，最终地址就是 `/api/tools/my-tool/process`。

后端注册表在启动时自动扫描 `app.tools` 下的包并挂载 `router.py`，因此不用修改 `main.py` 或任何集中式后端工具清单。

## 示例工具

- JSON 格式化/校验：纯前端。
- Base64 编码解码：纯前端。
- 二维码：生成二维码（可调尺寸/颜色/下载 PNG）与从图片识别二维码，纯前端（qrcode + jsQR）。
- 时间戳：秒/毫秒自动识别、时间戳 ⇄ 日期互转、北京时间/UTC/ISO/相对时间展示，纯前端。
- 正则测试：实时匹配高亮、分组展示、flags 切换，纯前端。
- 颜色转换：HEX / RGB / HSL 互转 + 取色器 + 常用色板 + 互补色，纯前端。
- 文本对比：两段文本逐行/逐字差异高亮（左右对照），纯前端（jsdiff）。
- 文本处理：大小写/camel/snake/kebab、JSON/URL/HTML 转义编解码、行去重排序、文本统计，纯前端。
- 图片批量处理：多图批量转格式（JPEG/PNG/WebP）、缩放、圆角、文字水印，Canvas 纯前端处理，可打包 ZIP 下载（jszip）。
- 文字转语音：浏览器本地语音合成朗读文本（Web Speech API），支持中文等多种语音，纯前端零成本。
- AI 文本处理：翻译（中英日韩等）、润色、总结要点、纠错，后端代理 DeepSeek 等 OpenAI 兼容接口（密钥在服务端，`TOOLBOX_AI_API_KEY`）。
- 图片压缩：上传 JPEG、PNG、WebP 到 FastAPI，经 Pillow 压缩并下载，覆盖前后端联调、上传、加载及错误提示流程。
- 文档转换：PDF → Word（保留排版）、PDF → 文本、Word → 文本，上传至 FastAPI 经 pdf2docx / PyMuPDF / python-docx 转换并下载。
- 博客：工具箱内置博客（`backend/app/tools/blog/`），文章存 SQLite，列表 + 分类筛选 + Markdown 详情阅读，后台管理（新建/编辑/删除，`TOOLBOX_BLOG_ADMIN_TOKEN` 保护），支持图片上传（`POST /api/tools/blog/images`，保存于 `backend/data/blog-images/`，编辑器中上传/拖拽自动插入 Markdown 链接）。
- 访问者统计：前端埋点记录每次页面加载的访问者，后端用离线 ip2region 数据库把 IP 定位到中国省份（`backend/app/tools/visitor_tracker/data/ip2region_v4.xdb`），SQLite 持久化（`backend/data/toolbox.db`，自动创建、已 gitignore），只展示中国大陆访问者并按 IP 去重；数据分库存储、展示时合并：工具箱访问记本地 SQLite，博客（h3blog）访问通过 `TOOLBOX_VISITOR_API_BASE` 配置的 `/api/visitor/*` 接口读取博客库，页面显示两库总和；省份分布以中国地图展示（ECharts，地图 GeoJSON 在 `frontend/public/maps/china.json`），有访问记录的省份上色、无记录为白色。
