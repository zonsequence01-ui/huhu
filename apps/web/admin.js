const API = window.location.origin;
const adminKeyInput = document.getElementById("adminKey");
const statusEl = document.getElementById("adminStatus");
const listEl = document.getElementById("hiddenList");

adminKeyInput.value = localStorage.getItem("huhu_admin_key") ?? "";

document.getElementById("saveKeyBtn").addEventListener("click", () => {
  localStorage.setItem("huhu_admin_key", adminKeyInput.value.trim());
  statusEl.textContent = "金鑰已儲存於本機。";
});

document.getElementById("refreshBtn").addEventListener("click", () => {
  loadHidden().catch((err) => {
    statusEl.textContent = err.message;
  });
});

async function adminFetch(path, options = {}) {
  const key = adminKeyInput.value.trim();
  if (!key) throw new Error("請輸入 Admin API Key");
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": key,
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text };
  }
  if (!res.ok) {
    throw new Error(data.error ?? res.statusText);
  }
  return data;
}

async function loadHidden() {
  statusEl.textContent = "載入中…";
  listEl.innerHTML = "";
  const data = await adminFetch("/v1/admin/moments/hidden?limit=50");
  const moments = data.moments ?? [];
  if (!moments.length) {
    statusEl.textContent = "目前沒有被隱藏的公開動態。";
    return;
  }
  statusEl.textContent = `共 ${moments.length} 則待覆核動態。`;
  for (const m of moments) {
    const li = document.createElement("li");
    li.className = "admin-moment-item";
    const meta = document.createElement("div");
    meta.className = "admin-moment-meta";
    meta.textContent = `${m.characterName ?? ""} · ${m.createdAt ?? ""} · 檢舉 ${m.reportCount ?? 0} · ${m.visibility}`;
    const body = document.createElement("p");
    body.textContent = m.body ?? "";
    const actions = document.createElement("div");
    actions.className = "diary-actions";
    const restoreBtn = document.createElement("button");
    restoreBtn.type = "button";
    restoreBtn.className = "secondary";
    restoreBtn.textContent = "還原至社群";
    restoreBtn.addEventListener("click", async () => {
      if (!confirm("還原此動態並清除檢舉紀錄？")) return;
      try {
        await adminFetch(`/v1/admin/moments/${m.id}/restore`, {
          method: "POST",
        });
        li.remove();
        statusEl.textContent = `已還原 ${m.id.slice(0, 8)}…`;
      } catch (err) {
        statusEl.textContent = err.message;
      }
    });
    actions.append(restoreBtn);
    li.append(meta, body, actions);
    listEl.append(li);
  }
}

async function loadIapStatus() {
  const el = document.getElementById("iapStatus");
  if (!el) return;
  try {
    const res = await fetch(`${API}/v1/meta/iap-readiness`);
    const { readiness } = await res.json();
    const ios = readiness.ios.configured ? "已設定" : "未設定";
    const and = readiness.android.playApi
      ? "Play API 已設定"
      : readiness.android.packageName
        ? "僅套件名"
        : "未設定";
    el.textContent = `IAP：iOS ${ios} · Android ${and} · productionReady=${readiness.productionReady}`;
  } catch (err) {
    el.textContent = `IAP 狀態載入失敗：${err.message}`;
  }
}

async function loadEconomyStatus() {
  const el = document.getElementById("economyStatus");
  if (!el) return;
  try {
    const res = await fetch(`${API}/v1/meta/economy`);
    const { economy: e } = await res.json();
    const s = e.stamina ?? {};
    const c = e.coins ?? {};
    const recoverMin = Math.round((s.recoverIntervalMs ?? 600000) / 60000);
    el.textContent =
      `經濟：體力 ${s.max ?? 50} max（文字 -${s.costText ?? 1}、語音 -${s.costVoice ?? 3}），` +
      `+1/${recoverMin}min；長對話 -${c.longMode ?? 5} 幣、心動 -${c.excitingMode ?? 10} 幣；簽到 +${c.dailyCheckin ?? 5}`;
  } catch (err) {
    el.textContent = `經濟規則載入失敗：${err.message}`;
  }
}

loadIapStatus();
loadEconomyStatus();
loadHidden().catch((err) => {
  statusEl.textContent = err.message;
});
