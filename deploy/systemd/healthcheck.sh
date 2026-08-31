#!/usr/bin/env bash
# 后端健康检查：连续失败时自动重启（配合 cron 每分钟执行）
# 安装：crontab -e 加入  * * * * * /path/to/Hello_AT/deploy/systemd/healthcheck.sh
set -u

URL="${TOOLBOX_HEALTH_URL:-http://127.0.0.1:8000/api/health}"
SERVICE="${TOOLBOX_SERVICE:-toolbox-backend}"
LOG="${TOOLBOX_LOG:-/var/log/toolbox-health.log}"

for i in 1 2 3; do
  if curl -fsS -m 5 "$URL" > /dev/null 2>&1; then
    exit 0
  fi
  sleep 2
done

echo "$(date '+%F %T') $SERVICE 健康检查失败，执行重启" >> "$LOG"
systemctl restart "$SERVICE"
