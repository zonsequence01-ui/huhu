const API = window.location.origin;
const marketSelect = document.getElementById("marketSelect");
const statusEl = document.getElementById("asoStatus");
const previewEl = document.getElementById("asoPreview");
let lastCatalog = null;

function field(label, value) {
  const wrap = document.createElement("div");
  wrap.className = "aso-field";
  const h = document.createElement("h3");
  h.textContent = label;
  const pre = document.createElement("pre");
  pre.textContent = value ?? "";
  wrap.append(h, pre);
  return wrap;
}

function formatPricing(pricing) {
  if (!pricing) return "";
  return [
    `Lite: ${pricing.lite} ${pricing.currency}`,
    `Basic: ${pricing.basic} ${pricing.currency}`,
    `Premium: ${pricing.premium} ${pricing.currency}`,
  ].join("\n");
}

function formatCoinPacks(coinPacks) {
  if (!Array.isArray(coinPacks) || !coinPacks.length) return "";
  return coinPacks
    .map(
      (p) =>
        `${p.pack}: ${p.coins} coins · ${p.price} ${p.currency} (${p.productId})`,
    )
    .join("\n");
}

function renderCatalog(catalog) {
  const { listing, pricing, pricingRegion, productIds } = catalog;
  previewEl.innerHTML = "";
  previewEl.append(
    field("Bundle ID", listing.bundleId),
    field("Locale", listing.locale),
    field("PPP 區域", pricingRegion),
    field("建議訂閱定價（PPP）", formatPricing(pricing)),
    field(
      "訂閱 SKU",
      (productIds?.subscriptions ?? []).join("\n"),
    ),
    field("呼呼幣 SKU", (productIds?.coins ?? []).join("\n")),
    field("呼呼幣包建議價（PPP）", formatCoinPacks(catalog.coinPacks)),
    field("App Store — 名稱", listing.appStore?.name),
    field("App Store — 副標", listing.appStore?.subtitle),
    field("App Store — 關鍵字", listing.appStore?.keywords),
    field("App Store — 宣傳文字", listing.appStore?.promotionalText),
    field("App Store — 描述", listing.appStore?.description),
    field("Google Play — 標題", listing.googlePlay?.title),
    field("Google Play — 短描述", listing.googlePlay?.shortDescription),
    field("Google Play — 完整描述", listing.googlePlay?.fullDescription),
    field("年齡分級", listing.ageRating),
    field(
      "截圖說明",
      (listing.screenshotCaptions ?? [])
        .map((c, i) => `${i + 1}. ${c}`)
        .join("\n"),
    ),
    field(
      "截圖規格",
      "iPhone 6.7\" 1290×2796 · Google Play 1080×1920+ · 詳見 docs/ASO_SCREENSHOTS.md",
    ),
  );
}

async function loadCatalog() {
  const market = marketSelect.value;
  statusEl.textContent = "載入中…";
  const res = await fetch(
    `${API}/v1/meta/store-catalog?market=${encodeURIComponent(market)}`,
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    statusEl.textContent = data.error ?? res.statusText;
    previewEl.innerHTML = "";
    lastCatalog = null;
    return;
  }
  lastCatalog = data.catalog;
  renderCatalog(lastCatalog);
  let iapNote = "";
  try {
    const iapRes = await fetch(`${API}/v1/meta/iap-readiness`);
    if (iapRes.ok) {
      const { readiness } = await iapRes.json();
      const ios = readiness.ios.configured ? "iOS✓" : "iOS—";
      const and = readiness.android.playApi
        ? "Android✓"
        : readiness.android.packageName
          ? "Android~"
          : "Android—";
      iapNote = ` · IAP ${ios} ${and}`;
    }
  } catch {
    /* ignore */
  }
  statusEl.textContent = `已載入 ${market}（${lastCatalog.locale} / ${lastCatalog.pricingRegion}）${iapNote}`;
}

document.getElementById("loadBtn").addEventListener("click", () => {
  loadCatalog().catch((err) => {
    statusEl.textContent = err.message;
  });
});

document.getElementById("copyJsonBtn").addEventListener("click", async () => {
  if (!lastCatalog) {
    statusEl.textContent = "請先載入文案";
    return;
  }
  await navigator.clipboard.writeText(JSON.stringify(lastCatalog, null, 2));
  statusEl.textContent = "已複製完整 catalog JSON";
});

const params = new URLSearchParams(window.location.search);
if (params.get("market")) {
  marketSelect.value = params.get("market");
}
loadCatalog().catch((err) => {
  statusEl.textContent = err.message;
});
