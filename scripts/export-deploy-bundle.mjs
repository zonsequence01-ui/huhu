/**
 * One-shot deploy handoff: compose files, Caddy example, env template, checklist.
 * Usage: pnpm export:deploy-bundle
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "dist/deploy-bundle");

mkdirSync(out, { recursive: true });

for (const rel of [
  "docker-compose.prod.yml",
  "docker-compose.static.yml",
  "docker-compose.yml",
  "Dockerfile",
  ".env.example",
]) {
  const src = join(root, rel);
  if (!existsSync(src)) continue;
  cpSync(src, join(out, rel));
}

mkdirSync(join(out, "infra"), { recursive: true });
for (const rel of ["infra/Caddyfile.example", "infra/Caddyfile.static.example"]) {
  const src = join(root, rel);
  if (!existsSync(src)) continue;
  cpSync(src, join(out, rel.replace("infra/", "infra/")));
}

const webSrc = join(root, "apps/web");
const webOut = join(out, "web");
if (existsSync(webSrc)) {
  cpSync(webSrc, webOut, { recursive: true });
}

const deployMd = `# Huhu 生產部署包

Bundle ID: \`com.ctrlz.huhu\`

## 1. 主機需求

- Docker + Docker Compose v2
- 開放 80/443
- DNS：在 **你的 Cloudflare 帳戶** 部署 Pages（\`pnpm deploy:pages\`）→ 預設 \`https://huhu-app.pages.dev\`；或自備網域 + VPS（見下方 Phase 2）

## 2. Phase 1 — 靜態頁（先解除商店隱私權 URL 封鎖）

**Cloudflare Pages（建議，無需自備網域）：**

\`\`\`bash
# Cloudflare → My Profile → API Tokens → Edit Cloudflare Workers
export CLOUDFLARE_API_TOKEN=...
pnpm deploy:pages
curl -sI https://huhu-app.pages.dev/privacy   # 應 200
\`\`\`

**或 VPS + Caddy：**

\`\`\`bash
cp infra/Caddyfile.static.example infra/Caddyfile.static
docker compose -f docker-compose.static.yml up -d
curl -sI https://YOUR_DOMAIN/privacy   # 應 200
\`\`\`

含 \`web/privacy.html\`、\`web/support.html\`。無 API／\`/health\`。

## 3. Phase 2 — 完整 API

\`\`\`bash
pnpm generate:jwt-secret   # 產生 JWT_SECRET
cp .env.example .env
# 編輯 .env：貼上 JWT_SECRET（必填，不可為 change-me-in-production）
docker compose -f docker-compose.prod.yml up --build -d
\`\`\`

TLS（Let's Encrypt）：

\`\`\`bash
cp infra/Caddyfile.example infra/Caddyfile
docker compose -f docker-compose.prod.yml --profile tls up --build -d
\`\`\`

## 4. 驗證

\`\`\`bash
curl -s https://huhu-app.pages.dev/health | jq .   # Phase 2 API 就緒後
# deployment.storePublicSiteUrl 應為 https://huhu-app.pages.dev

pnpm smoke:api:prod
pnpm verify:docker
\`\`\`

## 5. 商店連結

- 隱私權：\`https://huhu-app.pages.dev/privacy\`
- 支援：\`https://huhu-app.pages.dev/support\`

## 6. 遠端主機（範例）

\`\`\`bash
export DEPLOY_HOST=user@your-server
export DEPLOY_DIR=/opt/huhu
bash deploy-remote.example.sh
\`\`\`

首次部署前於主機建立 \`.env\`（含 \`JWT_SECRET\`、可選 \`OPENAI_API_KEY\`）。

## 7. 注意

- \`NODE_ENV=production\` 且 \`JWT_SECRET\` 為預設值時 API 會拒絕啟動
- 映像已包含 \`apps/web\` 靜態頁與 Web UI
`;

writeFileSync(join(out, "DEPLOY.md"), deployMd);

const remoteDeploySh = `#!/usr/bin/env bash
# Example: copy bundle to a VPS and start production stack.
# Usage:
#   export DEPLOY_HOST=user@your-server
#   export DEPLOY_DIR=/opt/huhu
#   bash deploy-remote.example.sh
set -euo pipefail

HOST="\${DEPLOY_HOST:?set DEPLOY_HOST (e.g. user@1.2.3.4)}"
DIR="\${DEPLOY_DIR:-/opt/huhu}"

rsync -avz --delete \\
  --exclude '.env' \\
  ./ "\${HOST}:\${DIR}/"

ssh "\${HOST}" "cd \${DIR} && \\
  test -f .env || { echo 'Missing .env — copy .env.example and set JWT_SECRET'; exit 1; } && \\
  docker compose -f docker-compose.prod.yml --profile tls up --build -d"

echo "Deployed. Verify: curl -s https://huhu-app.pages.dev/health"
`;

writeFileSync(join(out, "deploy-remote.example.sh"), remoteDeploySh);

const staticDeploySh = `#!/usr/bin/env bash
# Phase 1: static privacy/support only (no JWT / API build).
set -euo pipefail

HOST="\${DEPLOY_HOST:?set DEPLOY_HOST (e.g. user@1.2.3.4)}"
DIR="\${DEPLOY_DIR:-/opt/huhu}"

rsync -avz --delete ./ "\${HOST}:\${DIR}/"

ssh "\${HOST}" "cd \${DIR} && \\
  test -f infra/Caddyfile.static || cp infra/Caddyfile.static.example infra/Caddyfile.static && \\
  docker compose -f docker-compose.static.yml up -d"

echo "Static deploy done. Verify: curl -sI https://huhu-app.pages.dev/privacy"
`;

writeFileSync(join(out, "deploy-remote-static.example.sh"), staticDeploySh);

writeFileSync(
  join(out, "manifest.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      files: [
        "DEPLOY.md",
        "deploy-remote.example.sh",
        "deploy-remote-static.example.sh",
        "docker-compose.prod.yml",
        "docker-compose.static.yml",
        "docker-compose.yml",
        "Dockerfile",
        ".env.example",
        "infra/Caddyfile.example",
        "infra/Caddyfile.static.example",
        "web/privacy.html",
        "web/support.html",
      ],
    },
    null,
    2,
  ),
);

console.log(`Deploy bundle → ${out}`);
