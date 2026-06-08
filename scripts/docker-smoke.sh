#!/usr/bin/env sh
set -e
docker build -t huhu-api:smoke .
cid=$(docker run -d -p 3000:3000 \
  -e JWT_SECRET=smoke-test-secret \
  -e LLM_PROVIDER=mock \
  huhu-api:smoke)
trap "docker rm -f $cid" EXIT INT TERM
i=0
while [ $i -lt 30 ]; do
  if curl -sf http://127.0.0.1:3000/health >/dev/null; then
    curl -sf http://127.0.0.1:3000/v1/meta/locales | grep -q zh-TW
    echo "docker smoke ok"
    exit 0
  fi
  i=$((i + 1))
  sleep 1
done
echo "health check timed out"
exit 1
