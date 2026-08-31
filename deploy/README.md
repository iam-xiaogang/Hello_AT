# 部署与进程守护

## 工具箱后端（Hello_AT / FastAPI + uvicorn）

```bash
# 1. 安装 systemd 服务
sudo cp deploy/systemd/toolbox-backend.service /etc/systemd/system/
sudo nano /etc/systemd/system/toolbox-backend.service   # 改成你的实际路径/用户
sudo systemctl daemon-reload
sudo systemctl enable --now toolbox-backend

# 2. 健康检查自动重启（cron 每分钟）
sudo chmod +x deploy/systemd/healthcheck.sh
crontab -e   # 加入：
# * * * * * /path/to/Hello_AT/deploy/systemd/healthcheck.sh

# 3. 常用命令
systemctl status toolbox-backend
journalctl -u toolbox-backend -f        # 看日志
```

## h3blog（gunicorn，另一个项目）参考

```ini
[Unit]
Description=h3blog gunicorn
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/blog
EnvironmentFile=/home/blog/.env
ExecStart=/home/blog/.venv/bin/gunicorn -c gunicorn.py wsgi:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

> ⚠️ 托管后不要再用 `pkill -f gunicorn` / `pkill -f uvicorn` 一把梭——systemd 会把它自动拉起来，且会误杀同机其他项目。停服务用 `systemctl stop <服务名>`。

## 安全注意

- API 密钥（如 `TOOLBOX_AI_API_KEY`）只放 `.env`（已 gitignore），**不要写死在代码里**。
- 如果密钥曾提交进 git，去服务商后台重置（rotate）一个新 Key。
- `.env` 权限：`chmod 600 /path/.env`
