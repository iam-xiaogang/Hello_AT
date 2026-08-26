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
- 图片压缩：上传 JPEG、PNG、WebP 到 FastAPI，经 Pillow 压缩并下载，覆盖前后端联调、上传、加载及错误提示流程。
- 文档转换：PDF → Word（保留排版）、PDF → 文本、Word → 文本，上传至 FastAPI 经 pdf2docx / PyMuPDF / python-docx 转换并下载。
- 博客：iframe 嵌入 https://iamxiaogang.cn/，展示个人博客文章。
