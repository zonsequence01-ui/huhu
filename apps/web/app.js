const API = window.location.origin;
const chatEl = document.getElementById("chat");
const statsEl = document.getElementById("stats");
const form = document.getElementById("composer");
const input = document.getElementById("input");
const modeSelect = document.getElementById("mode");
const affectionPanel = document.getElementById("affectionPanel");
const stageLabel = document.getElementById("stageLabel");
const affectionPercent = document.getElementById("affectionPercent");
const affectionFill = document.getElementById("affectionFill");
const checkinBtn = document.getElementById("checkinBtn");
const offerwallBtn = document.getElementById("offerwallBtn");
const subscribeBtn = document.getElementById("subscribeBtn");
const exportBtn = document.getElementById("exportBtn");
const diaryBtn = document.getElementById("diaryBtn");
const diaryDialog = document.getElementById("diaryDialog");
const diaryForm = document.getElementById("diaryForm");
const diaryList = document.getElementById("diaryList");
const diaryEntryId = document.getElementById("diaryEntryId");
const diaryTitleInput = document.getElementById("diaryTitleInput");
const diaryBodyInput = document.getElementById("diaryBodyInput");
const diaryCancelBtn = document.getElementById("diaryCancelBtn");
const momentsBtn = document.getElementById("momentsBtn");
const momentsDialog = document.getElementById("momentsDialog");
const momentsForm = document.getElementById("momentsForm");
const momentsList = document.getElementById("momentsList");
const momentBodyInput = document.getElementById("momentBodyInput");
const momentsCancelBtn = document.getElementById("momentsCancelBtn");
const momentPhotoBtn = document.getElementById("momentPhotoBtn");
const momentPhotoInput = document.getElementById("momentPhotoInput");
const feedMomentsHint = document.getElementById("feedMomentsHint");
const momentsTabMine = document.getElementById("momentsTabMine");
const momentsTabCommunity = document.getElementById("momentsTabCommunity");
const momentsTabFriends = document.getElementById("momentsTabFriends");
const momentPublicInput = document.getElementById("momentPublicInput");
const momentFriendsInput = document.getElementById("momentFriendsInput");
const friendsBtn = document.getElementById("friendsBtn");
const friendsDialog = document.getElementById("friendsDialog");
const friendsForm = document.getElementById("friendsForm");
const myInviteCodeEl = document.getElementById("myInviteCode");
const copyInviteBtn = document.getElementById("copyInviteBtn");
const copyInviteLinkBtn = document.getElementById("copyInviteLinkBtn");
const inviteQrImg = document.getElementById("inviteQrImg");
const inviteDeepLinkHint = document.getElementById("inviteDeepLinkHint");
let lastInviteLink = null;
const blockedUsersList = document.getElementById("blockedUsersList");
const friendsIncomingList = document.getElementById("friendsIncomingList");
const friendsOutgoingList = document.getElementById("friendsOutgoingList");
const friendsListEl = document.getElementById("friendsListEl");
const inviteCodeInput = document.getElementById("inviteCodeInput");
const friendSearchInput = document.getElementById("friendSearchInput");
const friendSearchBtn = document.getElementById("friendSearchBtn");
const friendSearchResults = document.getElementById("friendSearchResults");
const displayNameInput = document.getElementById("displayNameInput");
const saveDisplayNameBtn = document.getElementById("saveDisplayNameBtn");
const friendsCloseBtn = document.getElementById("friendsCloseBtn");
const friendsSendBtn = document.getElementById("friendsSendBtn");
let pendingMomentPhoto = null;
let momentsFeedMode = "mine";
let ownedCharacterIds = new Set();
let momentReportReasons = ["spam", "harassment", "inappropriate", "other"];
let coinProducts = [];
/** @type {{ tier: string; productId: string }[]} */
let subscriptionProducts = [];
let coinPackPrices = new Map();
let economyMeta = null;
/** @type {Record<string, { unlimitedStamina?: boolean; voice?: boolean; memoryRetrievalLimit?: number; maxReplyTokens?: number }> | null} */
let subscriptionTiersByTier = null;
let subscriptionTierDisplayByTier = null;
/** @type {Record<string, string> | null} */
let subscriptionTierLabelsByTier = null;
let subscriptionTiersPromptText = "";
/** @type {Record<string, string> | null} */
let apiErrorsByCode = null;
/** @type {{ lite?: number; basic?: number; premium?: number; currency?: string } | null} */
let lastSubscribePricing = null;
const momentReportReasonLabelKey = {
  spam: "momentReportReasonSpam",
  harassment: "momentReportReasonHarassment",
  inappropriate: "momentReportReasonInappropriate",
  other: "momentReportReasonOther",
};
const photoBtn = document.getElementById("photoBtn");
const photoInput = document.getElementById("photoInput");
const privacyBtn = document.getElementById("privacyBtn");
const supportBtn = document.getElementById("supportBtn");
const subscribeDialog = document.getElementById("subscribeDialog");
const subscribeForm = document.getElementById("subscribeForm");
const subscribeTiersPrompt = document.getElementById("subscribeTiersPrompt");
const subscribePricingHint = document.getElementById("subscribePricingHint");
const subscribeCancelBtn = document.getElementById("subscribeCancelBtn");
const privacyDialog = document.getElementById("privacyDialog");
const privacyForm = document.getElementById("privacyForm");
const privacyDialogIntro = document.getElementById("privacyDialogIntro");
const supportResourcesHint = document.getElementById("supportResourcesHint");
const privacyCloseBtn = document.getElementById("privacyCloseBtn");
const privacyResetBtn = document.getElementById("privacyResetBtn");
const privacyRagBtn = document.getElementById("privacyRagBtn");
const privacyMessagesBtn = document.getElementById("privacyMessagesBtn");
const privacyAccountBtn = document.getElementById("privacyAccountBtn");
const memoryFragmentsSection = document.getElementById("memoryFragmentsSection");
const memoryFragmentsTitle = document.getElementById("memoryFragmentsTitle");
const memoryFragmentsEmpty = document.getElementById("memoryFragmentsEmpty");
const memoryFragmentsList = document.getElementById("memoryFragmentsList");
const supportDialog = document.getElementById("supportDialog");
const supportDialogTitle = document.getElementById("supportDialogTitle");
const supportPrivacyReminder = document.getElementById("supportPrivacyReminder");
const supportCrisisTitle = document.getElementById("supportCrisisTitle");
const supportCrisisLines = document.getElementById("supportCrisisLines");
const supportWellnessTitle = document.getElementById("supportWellnessTitle");
const supportWellnessLines = document.getElementById("supportWellnessLines");
const supportCloseBtn = document.getElementById("supportCloseBtn");
const privacyStoreLinks = document.getElementById("privacyStoreLinks");
const privacyPolicyLink = document.getElementById("privacyPolicyLink");
const supportPageLink = document.getElementById("supportPageLink");
const privacyStoreLinksSep = document.getElementById("privacyStoreLinksSep");
const supportStoreLinks = document.getElementById("supportStoreLinks");
const supportPageExternalLink = document.getElementById("supportPageExternalLink");
const supportPrivacyExternalLink = document.getElementById("supportPrivacyExternalLink");
const supportStoreLinksSep = document.getElementById("supportStoreLinksSep");
/** @type {{ support?: string; privacy?: string } | null} */
let clientStoreUrls = null;
const photoCaptionDialog = document.getElementById("photoCaptionDialog");
const photoCaptionForm = document.getElementById("photoCaptionForm");
const photoCaptionInput = document.getElementById("photoCaptionInput");
const photoCaptionCancelBtn = document.getElementById("photoCaptionCancelBtn");
const reportDialog = document.getElementById("reportDialog");
const reportForm = document.getElementById("reportForm");
const reportReasons = document.getElementById("reportReasons");
const reportCancelBtn = document.getElementById("reportCancelBtn");
const createCharBtn = document.getElementById("createCharBtn");
const creatorDialog = document.getElementById("creatorDialog");
const creatorForm = document.getElementById("creatorForm");
const ageDialog = document.getElementById("ageDialog");
const ageForm = document.getElementById("ageForm");
const voiceToggle = document.getElementById("voiceToggle");
const localeSelect = document.getElementById("localeSelect");
const asoLink = document.getElementById("asoLink");
const localeLabelEl = document.getElementById("localeLabel");
const characterSelect = document.getElementById("characterSelect");
const characterLabelEl = document.getElementById("characterLabel");
const chatPrivacyBanner = document.getElementById("chatPrivacyBanner");
const chatPrivacyText = document.getElementById("chatPrivacyText");
const chatPrivacyDismiss = document.getElementById("chatPrivacyDismiss");

const CHAT_PRIVACY_DISMISS_KEY = "huhu_chat_privacy_dismissed";

let token = localStorage.getItem("huhu_token");
let voiceMode = false;
let mediaRecorder = null;
let recordStream = null;
let recordChunks = [];
let voiceHoldActive = false;
let userId = localStorage.getItem("huhu_userId");
let characterId = localStorage.getItem("huhu_characterId");
let userLocale = "zh-TW";
let ui = {};
let offerwallMeta = null;

function t(key, vars) {
  let text = ui[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

async function loadUiStrings(locale) {
  const data = await api(
    `/v1/meta/ui-strings?locale=${encodeURIComponent(locale)}`,
  );
  ui = data.strings ?? {};
  userLocale = data.locale ?? locale;
  applyUiStrings();
}

function asoMarketForLocale(locale) {
  if (locale === "zh-TW") return "tw";
  if (locale.startsWith("ja")) return "jp";
  if (locale.startsWith("ko")) return "kr";
  if (locale === "vi-VN" || locale === "vi") return "vn";
  if (locale === "zh-CN" || locale.startsWith("zh-Hans")) return "cn";
  if (locale.startsWith("en")) return "us";
  return "tw";
}

function updateAsoLink() {
  if (!asoLink) return;
  asoLink.href = `/aso.html?market=${asoMarketForLocale(userLocale)}`;
}

function applyUiStrings() {
  const h1 = document.querySelector(".header h1");
  if (h1) h1.textContent = t("appTitle");
  if (input) input.placeholder = t("inputPlaceholder");
  const submitBtn = form?.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = t("send");
  applyModeSelectLabels();
  if (checkinBtn) checkinBtn.textContent = t("dailyCheckin");
  if (offerwallBtn) offerwallBtn.textContent = t("offerwall");
  if (chatPrivacyDismiss) chatPrivacyDismiss.textContent = t("chatPrivacyDismiss");
  if (subscribeBtn) subscribeBtn.textContent = t("subscribe");
  if (exportBtn) exportBtn.textContent = t("exportChat");
  if (diaryBtn) diaryBtn.textContent = t("diary");
  if (momentsBtn) momentsBtn.textContent = t("moments");
  if (photoBtn) photoBtn.title = t("attachPhoto");
  const diaryH2 = document.getElementById("diaryDialogTitle");
  if (diaryH2) diaryH2.textContent = t("diary");
  if (diaryCancelBtn) diaryCancelBtn.textContent = t("cancel");
  const diarySave = diaryForm?.querySelector('button[type="submit"]');
  if (diarySave) diarySave.textContent = t("save");
  const momentsH2 = document.getElementById("momentsDialogTitle");
  if (momentsH2) momentsH2.textContent = t("moments");
  if (momentsCancelBtn) momentsCancelBtn.textContent = t("cancel");
  if (momentPhotoBtn) momentPhotoBtn.textContent = t("momentPhoto");
  if (momentsTabMine) momentsTabMine.textContent = t("feedTabMine");
  if (momentsTabCommunity) momentsTabCommunity.textContent = t("feedTabCommunity");
  if (momentsTabFriends) momentsTabFriends.textContent = t("feedTabFriends");
  if (friendsBtn) friendsBtn.textContent = t("friendsBtn");
  const friendsH2 = document.getElementById("friendsDialogTitle");
  if (friendsH2) friendsH2.textContent = t("friendsDialogTitle");
  const inviteLbl = document.getElementById("inviteCodeLabel");
  if (inviteLbl) inviteLbl.textContent = t("inviteCodeLabel");
  if (copyInviteBtn) copyInviteBtn.textContent = t("copyInviteCode");
  if (copyInviteLinkBtn) copyInviteLinkBtn.textContent = t("copyInviteLink");
  if (inviteQrImg) inviteQrImg.alt = t("inviteQrAlt");
  const blockedH3 = document.getElementById("blockedUsersTitle");
  if (blockedH3) blockedH3.textContent = t("blockedUsersTitle");
  const incH3 = document.getElementById("friendsIncomingTitle");
  if (incH3) incH3.textContent = t("friendsIncomingTitle");
  const outH3 = document.getElementById("friendsOutgoingTitle");
  if (outH3) outH3.textContent = t("friendsOutgoingTitle");
  const listH3 = document.getElementById("friendsListTitle");
  if (listH3) listH3.textContent = t("friendsListTitle");
  const addLbl = document.getElementById("addFriendByCodeLabel");
  if (addLbl) addLbl.textContent = t("addFriendByCode");
  const searchLbl = document.getElementById("searchFriendsLabel");
  if (searchLbl) searchLbl.textContent = t("searchFriendsLabel");
  if (friendSearchInput) {
    friendSearchInput.placeholder = t("searchFriendsPlaceholder");
  }
  if (friendSearchBtn) friendSearchBtn.textContent = t("searchFriendsBtn");
  const dnLbl = document.getElementById("displayNameLabel");
  if (dnLbl) dnLbl.textContent = t("displayNameLabel");
  if (saveDisplayNameBtn) saveDisplayNameBtn.textContent = t("save");
  if (friendsCloseBtn) friendsCloseBtn.textContent = t("friendsClose");
  if (friendsSendBtn) friendsSendBtn.textContent = t("send");
  updateMomentsFeedHint();
  const momentPubLabel = momentPublicInput?.closest("label");
  if (momentPubLabel) {
    const span = momentPubLabel.querySelector("span");
    if (span) span.textContent = t("momentPublishPublic");
  }
  const momentFriendsLabel = momentFriendsInput?.closest("label");
  if (momentFriendsLabel) {
    const span = momentFriendsLabel.querySelector("span");
    if (span) span.textContent = t("momentPublishFriends");
  }
  const momentSave = momentsForm?.querySelector('button[type="submit"]');
  if (momentSave) momentSave.textContent = t("send");
  if (createCharBtn) createCharBtn.textContent = t("newCharacter");
  if (privacyBtn) privacyBtn.textContent = t("privacy");
  if (supportBtn) supportBtn.textContent = t("supportResources");
  if (supportDialogTitle) supportDialogTitle.textContent = t("supportResources");
  if (supportCloseBtn) supportCloseBtn.textContent = t("cancel");
  const subscribeH2 = document.getElementById("subscribeDialogTitle");
  if (subscribeH2) subscribeH2.textContent = t("subscribe");
  if (subscribeCancelBtn) subscribeCancelBtn.textContent = t("cancel");
  const subscribeOk = subscribeForm?.querySelector('button[value="ok"]');
  if (subscribeOk) subscribeOk.textContent = t("confirm");
  const privacyH2 = document.getElementById("privacyDialogTitle");
  if (privacyH2) privacyH2.textContent = t("privacyData");
  if (privacyDialogIntro) privacyDialogIntro.textContent = t("privacyIntro");
  if (privacyResetBtn) privacyResetBtn.textContent = t("resetRelationshipBtn");
  if (privacyRagBtn) privacyRagBtn.textContent = t("clearRagBtn");
  if (privacyMessagesBtn) privacyMessagesBtn.textContent = t("clearMessagesBtn");
  document.querySelectorAll("[data-i18n-delete-message]").forEach((el) => {
    el.textContent = t("deleteMessageBtn");
    el.setAttribute("aria-label", t("deleteMessageBtn"));
  });
  if (privacyAccountBtn) privacyAccountBtn.textContent = t("deleteAccountBtn");
  if (privacyCloseBtn) privacyCloseBtn.textContent = t("friendsClose");
  applyStoreUrlsLinks(clientStoreUrls);
  if (memoryFragmentsTitle) memoryFragmentsTitle.textContent = t("memoryFragmentsTitle");
  if (memoryFragmentsEmpty) memoryFragmentsEmpty.textContent = t("memoryFragmentsEmpty");
  const photoCapH2 = document.getElementById("photoCaptionDialogTitle");
  if (photoCapH2) photoCapH2.textContent = t("attachPhoto");
  const photoCapLabel = document.getElementById("photoCaptionLabel");
  if (photoCapLabel) photoCapLabel.textContent = t("photoCaption");
  if (photoCaptionCancelBtn) photoCaptionCancelBtn.textContent = t("cancel");
  const photoCapSubmit = photoCaptionForm?.querySelector('button[value="ok"]');
  if (photoCapSubmit) photoCapSubmit.textContent = t("send");
  const reportH2 = document.getElementById("reportDialogTitle");
  if (reportH2) reportH2.textContent = t("momentReport");
  const reportHint = document.getElementById("reportDialogHint");
  if (reportHint) reportHint.textContent = t("momentReportPick");
  if (reportCancelBtn) reportCancelBtn.textContent = t("cancel");
  const reportSubmit = reportForm?.querySelector('button[value="ok"]');
  if (reportSubmit) reportSubmit.textContent = t("send");
  const ageH2 = ageDialog?.querySelector("h2");
  if (ageH2) ageH2.textContent = t("ageTitle");
  const ageP = ageDialog?.querySelector("p");
  if (ageP) ageP.textContent = t("ageBody");
  const ageLabel = ageForm?.querySelector("label");
  if (ageLabel) ageLabel.firstChild.textContent = t("birthYear");
  const ageSubmit = ageForm?.querySelector('button[type="submit"]');
  if (ageSubmit) ageSubmit.textContent = t("ageConfirm");
  const creatorH2 = creatorDialog?.querySelector("h2");
  if (creatorH2) creatorH2.textContent = t("createCharacter");
  const creatorCancel = creatorForm?.querySelector('button[value="cancel"]');
  if (creatorCancel) creatorCancel.textContent = t("cancel");
  const creatorOk = creatorForm?.querySelector('button[value="ok"]');
  if (creatorOk) creatorOk.textContent = t("create");
  updateVoiceToggleTitle();
  updateSubscribeTierLabels(lastSubscribePricing);
  if (localeLabelEl) localeLabelEl.textContent = t("localeLabel");
  if (characterLabelEl) characterLabelEl.textContent = t("switchCharacter");
  if (characterSelect) characterSelect.setAttribute("aria-label", t("selectCharacter"));
  for (const el of document.querySelectorAll("[data-i18n]")) {
    el.textContent = t(el.dataset.i18n);
  }
  const personalityInput = document.getElementById("personalityInput");
  if (personalityInput) {
    personalityInput.placeholder = t("personalityPlaceholder");
  }
  const speakingInput = document.getElementById("speakingStyleInput");
  if (speakingInput) {
    speakingInput.placeholder = t("speakingPlaceholder");
  }
  updateAsoLink();
}

async function loadLocaleOptions() {
  if (!localeSelect) return;
  try {
    const data = await api("/v1/meta/locales");
    localeSelect.innerHTML = "";
    for (const l of data.locales ?? []) {
      const opt = document.createElement("option");
      opt.value = l.id;
      opt.textContent = l.label ?? l.id;
      if (l.id === userLocale) opt.selected = true;
      localeSelect.appendChild(opt);
    }
  } catch {
    /* optional */
  }
}

localeSelect?.addEventListener("change", async () => {
  const locale = localeSelect.value;
  if (!locale || !token) return;
  try {
    await api("/v1/users/me/locale", {
      method: "PATCH",
      body: JSON.stringify({ locale }),
    });
    await loadUiStrings(locale);
    await loadCoinCatalog();
    renderCoinButtons();
    updateAsoLink();
    await loadClientConfigMeta();
    await refreshProfile();
  } catch (err) {
    bubble(`（${err.message}）`, "assistant");
  }
});

function playVoiceBase64(audioBase64, mimeType = "audio/mpeg") {
  if (!audioBase64 || mimeType === "text/plain") return;
  const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
  audio.play().catch(() => {});
}

function bubble(
  text,
  role,
  voice,
  media,
  safety,
  characterCorrected,
  messageId,
) {
  const div = document.createElement("div");
  div.className = `bubble ${role}`;
  if (safety && role === "assistant") div.classList.add("safety");
  if (characterCorrected && role === "assistant") {
    div.classList.add("guard-corrected");
    div.title = t("characterGuardCorrected");
  }
  if (media?.imageBase64 && media?.mimeType) {
    const img = document.createElement("img");
    img.className = "chat-photo";
    img.src = `data:${media.mimeType};base64,${media.imageBase64}`;
    img.alt = "";
    div.appendChild(img);
    const caption = text?.trim();
    if (caption && !caption.startsWith("[使用者分享")) {
      const p = document.createElement("p");
      p.textContent = caption;
      div.appendChild(p);
    }
  } else {
    const p = document.createElement("p");
    p.textContent = text;
    div.appendChild(p);
  }
  if (voice?.audioBase64 && voice.mimeType !== "text/plain") {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "secondary";
    btn.textContent = t("playVoice");
    btn.addEventListener("click", () =>
      playVoiceBase64(voice.audioBase64, voice.mimeType),
    );
    div.appendChild(btn);
  }
  if (messageId && characterId) {
    attachBubbleDelete(div, messageId);
  }
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
  return div;
}

function activeCharacterId() {
  return characterId || localStorage.getItem("huhu_characterId");
}

function attachBubbleDelete(div, messageId) {
  const cid = activeCharacterId();
  if (!messageId || !cid || div.querySelector(".bubble-delete")) return;
  const actions = document.createElement("div");
  actions.className = "bubble-actions";
  const del = document.createElement("button");
  del.type = "button";
  del.className = "bubble-delete";
  del.dataset.i18nDeleteMessage = "1";
  del.textContent = t("deleteMessageBtn");
  del.setAttribute("aria-label", t("deleteMessageBtn"));
  del.addEventListener("click", async () => {
    if (!confirm(t("deleteMessageConfirm"))) return;
    try {
      await api(`/v1/characters/${cid}/messages/${messageId}`, {
        method: "DELETE",
      });
      div.remove();
    } catch (err) {
      bubble(`（${err.message}）`, "assistant");
    }
  });
  actions.appendChild(del);
  div.appendChild(actions);
}

function applyChatMessageIds(userDiv, result) {
  const userMessageId = result?.userMessageId;
  const assistantId = result?.reply?.id;
  if (userDiv && userMessageId) attachBubbleDelete(userDiv, userMessageId);
  return assistantId;
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      resolve(String(dataUrl).split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function startVoiceCapture() {
  recordStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : MediaRecorder.isTypeSupported("audio/webm")
      ? "audio/webm"
      : "";
  mediaRecorder = mime
    ? new MediaRecorder(recordStream, { mimeType: mime })
    : new MediaRecorder(recordStream);
  recordChunks = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) recordChunks.push(e.data);
  };
  mediaRecorder.start();
  voiceToggle?.classList.add("recording");
}

async function stopVoiceCaptureAndSend() {
  if (!mediaRecorder || mediaRecorder.state === "inactive") return;
  const mime = mediaRecorder.mimeType || "audio/webm";
  await new Promise((resolve) => {
    mediaRecorder.onstop = resolve;
    mediaRecorder.stop();
  });
  recordStream?.getTracks().forEach((tr) => tr.stop());
  recordStream = null;
  voiceToggle?.classList.remove("recording");
  const blob = new Blob(recordChunks, { type: mime });
  if (blob.size < 64) return;
  const base64 = await blobToBase64(blob);
  const userDiv = bubble(t("recording"), "user");
  const typing = bubble(t("typing"), "assistant typing");
  try {
    const result = await api("/v1/chat", {
      method: "POST",
      body: JSON.stringify({
        characterId,
        content: "",
        mode: modeSelect.value,
        messageType: "voice",
        voiceAudioBase64: base64,
        voiceMimeType: mime,
      }),
    });
    typing.remove();
    const assistantId = applyChatMessageIds(userDiv, result);
    const reply = result.reply ?? {};
    bubble(
      reply.content ?? "…",
      "assistant",
      reply.voice,
      undefined,
      result.safety?.flagged === true,
      reply.characterCorrected === true,
      assistantId,
    );
    if (reply.voice?.audioBase64) {
      playVoiceBase64(reply.voice.audioBase64, reply.voice.mimeType);
    }
    updateStats(result.economy, result.relationship);
  } catch (err) {
    typing.remove();
    bubble(`（${err.message}）`, "assistant");
  }
}

if (voiceToggle) {
  voiceToggle.addEventListener("click", () => {
    if (voiceHoldActive) return;
    voiceMode = !voiceMode;
    voiceToggle.classList.toggle("active", voiceMode);
    updateVoiceToggleTitle();
  });
  voiceToggle.addEventListener("pointerdown", async (e) => {
    if (!voiceMode) return;
    voiceHoldActive = true;
    e.preventDefault();
    try {
      await startVoiceCapture();
    } catch {
      bubble(t("micDenied"), "assistant");
    }
  });
  const endHold = () => {
    if (!voiceMode || !voiceHoldActive) return;
    voiceHoldActive = false;
    stopVoiceCaptureAndSend();
  };
  voiceToggle.addEventListener("pointerup", endHold);
  voiceToggle.addEventListener("pointercancel", endHold);
  voiceToggle.addEventListener("pointerleave", endHold);
}

function updateAffection(rel) {
  if (!rel) {
    affectionPanel.hidden = true;
    return;
  }
  affectionPanel.hidden = false;
  stageLabel.textContent = rel.stageLabel ?? rel.stage;
  affectionPercent.textContent = `${rel.percent ?? 0}%`;
  affectionFill.style.width = `${rel.percent ?? 0}%`;
  if (rel.stage) affectionFill.dataset.stage = rel.stage;
}

function formatPlanTierLabel(tier, economy) {
  if (economy?.subscriptionTierDisplayName && economy.subscriptionTier === tier) {
    return economy.subscriptionTierDisplayName;
  }
  if (tier === "free") return t("tierNameFree");
  return subscriptionTierDisplayByTier?.[tier] ?? tier;
}

function formatPlanExpiry(plan) {
  if (!plan?.subscriptionExpiresAt) return "";
  if (plan.subscriptionExpired) return t("subscriptionExpired");
  const days = plan.subscriptionDaysRemaining;
  if (days != null && days > 0) return t("daysRemaining", { days });
  return "";
}

function updateVoiceToggleTitle() {
  if (!voiceToggle) return;
  const tier = subscriptionTierDisplayByTier?.basic ?? t("tierNameBasic");
  voiceToggle.title = voiceMode
    ? t("voiceModeOn", { tier })
    : t("voiceModeOff", { tier });
}

function formatSubscribePppHint(region, pricing) {
  if (!pricing) return "";
  return t("subscribePppHint", {
    region: region ?? "",
    lite: subscriptionTierDisplayByTier?.lite ?? t("tierNameLite"),
    litePrice: pricing.lite,
    basic: subscriptionTierDisplayByTier?.basic ?? t("tierNameBasic"),
    basicPrice: pricing.basic,
    premium: subscriptionTierDisplayByTier?.premium ?? t("tierNamePremium"),
    premiumPrice: pricing.premium,
    currency: pricing.currency,
  });
}

function formatPricingHint(plan) {
  if (!plan?.pricing) return "";
  return formatSubscribePppHint(plan.pricingRegion, plan.pricing);
}

function updateStats(economy, relationship) {
  const stamina = economy?.staminaDisplay;
  const staminaText = stamina?.unlimited
    ? `${t("stamina")} ∞`
    : `${t("stamina")} ${economy?.stamina ?? "—"}/${stamina?.max ?? 50}`;
  const plan = economy?.plan;
  const tierLine = `${t("plan")} ${formatPlanTierLabel(economy?.subscriptionTier ?? "free", economy)}${formatPlanExpiry(plan)}`;
  const pricingLine = formatPricingHint(plan);
  const ent = plan?.entitlements;
  const entLine = ent ? formatTierEntitlementsShort(ent) : "";
  statsEl.textContent = [
    staminaText,
    `${t("coins")} ${economy?.coins ?? "—"}`,
    tierLine,
    pricingLine,
    entLine,
  ]
    .filter(Boolean)
    .join(" · ");
  updateAffection(relationship);
}

function formatApiError(code) {
  if (!code || typeof code !== "string") return String(code ?? "");
  const fromConfig = apiErrorsByCode?.[code];
  if (fromConfig) return fromConfig;
  const tier = subscriptionTierDisplayByTier?.basic ?? t("tierNameBasic");
  const map = {
    voice_requires_basic_subscription: () =>
      t("voiceRequiresBasic", { tier }),
    insufficient_stamina: () => t("insufficientStamina"),
    insufficient_coins: () => t("insufficientCoins"),
    character_limit_reached: () => t("characterLimitReached"),
    character_not_found: () => t("characterNotFound"),
    age_confirmation_required: () => t("ageConfirmationRequired"),
    content_required: () => t("contentRequired"),
    validation_failed: () => t("validationFailed"),
    rate_limited: () => t("rateLimited"),
  };
  const fn = map[code];
  return fn ? fn() : code;
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body != null && options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(formatApiError(data.error) || res.statusText);
    err.code = data.error;
    throw err;
  }
  return data;
}

async function ensureAgeConfirmed() {
  const me = await api("/v1/users/me");
  if (me.ageConfirmed || !me.ageGateRequired) return;
  ageDialog.showModal();
  await new Promise((resolve) => {
    ageForm.addEventListener(
      "submit",
      async (e) => {
        e.preventDefault();
        const birthYear = Number(ageForm.birthYear.value);
        try {
          await api("/v1/users/me/age-confirm", {
            method: "POST",
            body: JSON.stringify({ birthYear }),
          });
          ageDialog.close();
          resolve();
        } catch (err) {
          bubble(`（${err.message}）`, "assistant");
        }
      },
      { once: true },
    );
  });
}

function pickReportReason() {
  if (!reportDialog || !reportForm || !reportReasons) return Promise.resolve(null);
  reportReasons.innerHTML = "";
  for (const [i, r] of momentReportReasons.entries()) {
    const label = document.createElement("label");
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "reason";
    input.value = r;
    if (i === 0) input.checked = true;
    const labelKey = momentReportReasonLabelKey[r] ?? r;
    label.append(input, document.createTextNode(` ${t(labelKey)}`));
    reportReasons.append(label);
  }
  return new Promise((resolve) => {
    const finish = (value) => {
      reportForm.removeEventListener("submit", onSubmit);
      reportCancelBtn?.removeEventListener("click", onCancel);
      resolve(value);
    };
    const onCancel = () => {
      reportDialog.close();
      finish(null);
    };
    const onSubmit = (e) => {
      e.preventDefault();
      if (reportForm.returnValue !== "ok") {
        reportDialog.close();
        finish(null);
        return;
      }
      const val = reportForm.reason?.value;
      reportDialog.close();
      finish(val && momentReportReasons.includes(val) ? val : null);
    };
    reportForm.addEventListener("submit", onSubmit);
    reportCancelBtn?.addEventListener("click", onCancel);
    reportDialog.showModal();
  });
}

function askPhotoCaption() {
  if (!photoCaptionDialog || !photoCaptionForm) return Promise.resolve(null);
  if (photoCaptionInput) photoCaptionInput.value = "";
  return new Promise((resolve) => {
    const finish = (value) => {
      photoCaptionForm.removeEventListener("submit", onSubmit);
      photoCaptionCancelBtn?.removeEventListener("click", onCancel);
      resolve(value);
    };
    const onCancel = () => {
      photoCaptionDialog.close();
      finish(null);
    };
    const onSubmit = (e) => {
      e.preventDefault();
      if (photoCaptionForm.returnValue !== "ok") {
        photoCaptionDialog.close();
        finish(null);
        return;
      }
      const caption = photoCaptionInput?.value?.trim() ?? "";
      photoCaptionDialog.close();
      finish(caption);
    };
    photoCaptionForm.addEventListener("submit", onSubmit);
    photoCaptionCancelBtn?.addEventListener("click", onCancel);
    photoCaptionDialog.showModal();
  });
}

function applyModeSelectLabels() {
  if (!modeSelect) return;
  const c = economyMeta?.coins ?? {};
  if (modeSelect.options[0]) {
    modeSelect.options[0].textContent = t("modeSimple");
  }
  if (modeSelect.options[1]) {
    modeSelect.options[1].textContent = `${t("modeLong")} (-${c.longMode ?? 5})`;
  }
  if (modeSelect.options[2]) {
    modeSelect.options[2].textContent = `${t("modeExciting")} (-${c.excitingMode ?? 10})`;
  }
}

function formatEconomyRulesText(e) {
  if (!e) return "";
  const s = e.stamina ?? {};
  const c = e.coins ?? {};
  const recoverMin = Math.round((s.recoverIntervalMs ?? 600_000) / 60_000);
  return [
    `${t("economyRulesTitle")}:`,
    `${t("stamina")} ${s.max ?? 50}, text -${s.costText ?? 1}, voice -${s.costVoice ?? 3}, image -${s.costImage ?? 2}, +1/${recoverMin}min`,
    `${t("coins")} long -${c.longMode ?? 5}, exciting -${c.excitingMode ?? 10}, check-in +${c.dailyCheckin ?? 5}`,
  ].join(" · ");
}

function applyOfferwallButtonMeta() {
  if (!offerwallBtn) return;
  const c = economyMeta?.coins;
  const ow = offerwallMeta;
  const coinRange =
    c != null
      ? `+${c.offerwallMin ?? ow?.coinsPerReward?.min ?? 1}–${c.offerwallMax ?? ow?.coinsPerReward?.max ?? 3}`
      : ow?.coinsPerReward
        ? `+${ow.coinsPerReward.min}–${ow.coinsPerReward.max}`
        : "";
  const cap = ow?.dailyCap != null ? ` · ${ow.dailyCap}/day` : "";
  offerwallBtn.title = `${t("offerwall")} (${coinRange} ${t("coins")}${cap})`.trim();
  if (ow?.mode === "verified") {
    offerwallBtn.dataset.offerwallMode = "verified";
  } else {
    delete offerwallBtn.dataset.offerwallMode;
  }
}

function formatTierEntitlementsShort(ent) {
  if (!ent) return "";
  const parts = [];
  if (ent.unlimitedStamina) parts.push(t("tierEntUnlimitedStamina"));
  if (ent.voice) parts.push(t("tierEntVoice"));
  if (ent.memoryRetrievalLimit != null) {
    parts.push(t("tierEntMemory", { n: ent.memoryRetrievalLimit }));
  }
  if (ent.maxReplyTokens != null) {
    parts.push(t("tierEntReply", { n: ent.maxReplyTokens }));
  }
  if (ent.maxCharacters != null) {
    parts.push(t("tierEntCharacters", { n: ent.maxCharacters }));
  }
  if (ent.premiumContent) parts.push(t("tierEntPremium"));
  return parts.join(" · ");
}

function applyStoreUrlsLinks(storeUrls) {
  clientStoreUrls = storeUrls ?? null;
  const support = storeUrls?.support;
  const privacy = storeUrls?.privacy;
  const hasSupport = typeof support === "string" && support.length > 0;
  const hasPrivacy = typeof privacy === "string" && privacy.length > 0;

  if (supportStoreLinks && supportPageExternalLink && supportPrivacyExternalLink) {
    if (hasSupport || hasPrivacy) {
      supportStoreLinks.hidden = false;
      if (hasSupport) {
        supportPageExternalLink.href = support;
        supportPageExternalLink.textContent = t("openSupportPage");
        supportPageExternalLink.hidden = false;
      } else {
        supportPageExternalLink.hidden = true;
      }
      if (hasPrivacy) {
        supportPrivacyExternalLink.href = privacy;
        supportPrivacyExternalLink.textContent = t("openPrivacyPolicy");
        supportPrivacyExternalLink.hidden = false;
      } else {
        supportPrivacyExternalLink.hidden = true;
      }
      if (supportStoreLinksSep) {
        supportStoreLinksSep.hidden = !(hasSupport && hasPrivacy);
      }
    } else {
      supportStoreLinks.hidden = true;
    }
  }

  if (privacyStoreLinks && privacyPolicyLink && supportPageLink) {
    if (hasSupport || hasPrivacy) {
      privacyStoreLinks.hidden = false;
      if (hasPrivacy) {
        privacyPolicyLink.href = privacy;
        privacyPolicyLink.textContent = t("openPrivacyPolicy");
        privacyPolicyLink.hidden = false;
      } else {
        privacyPolicyLink.hidden = true;
      }
      if (hasSupport) {
        supportPageLink.href = support;
        supportPageLink.textContent = t("openSupportPage");
        supportPageLink.hidden = false;
      } else {
        supportPageLink.hidden = true;
      }
      if (privacyStoreLinksSep) {
        privacyStoreLinksSep.hidden = !(hasSupport && hasPrivacy);
      }
    } else {
      privacyStoreLinks.hidden = true;
    }
  }
}

async function loadClientConfigMeta() {
  const hint = document.getElementById("economyHint");
  try {
    const res = await fetch(
      `${API}/v1/meta/client-config?locale=${encodeURIComponent(userLocale)}`,
    );
    if (!res.ok) return;
    const data = await res.json();
    const config = data.config ?? {};
    economyMeta = config.economy ?? null;
    offerwallMeta = config.offerwall ?? null;
    subscriptionTiersByTier = Object.fromEntries(
      (config.subscriptionTiers ?? []).map((row) => [row.tier, row.entitlements ?? {}]),
    );
    subscriptionTierLabelsByTier = Object.fromEntries(
      (config.subscriptionTiers ?? [])
        .filter((row) => row.tier && row.entitlementsLabel)
        .map((row) => [row.tier, row.entitlementsLabel]),
    );
    subscriptionTierDisplayByTier = Object.fromEntries(
      (config.subscriptionTiers ?? [])
        .filter((row) => row.tier && row.tierDisplayName)
        .map((row) => [row.tier, row.tierDisplayName]),
    );
    subscriptionTiersPromptText = config.subscriptionTiersPrompt ?? "";
    apiErrorsByCode =
      config.apiErrors && typeof config.apiErrors === "object"
        ? config.apiErrors
        : null;
    applySubscribeDialogCopy();
    updateSubscribeTierLabels(lastSubscribePricing);
    applyModeSelectLabels();
    applyOfferwallButtonMeta();
    if (hint && economyMeta) {
      hint.textContent = formatEconomyRulesText(economyMeta);
      hint.hidden = false;
    }
    applyChatPrivacyFromResources(config.supportResources);
    applyStoreUrlsLinks(config.storeUrls);
  } catch {
    if (hint) hint.hidden = true;
  }
}

/** @deprecated use loadClientConfigMeta */
async function loadEconomyMeta() {
  await loadClientConfigMeta();
}

function applyChatPrivacyFromResources(resources) {
  if (!chatPrivacyBanner || !chatPrivacyText) return;
  if (localStorage.getItem(CHAT_PRIVACY_DISMISS_KEY) === "1") {
    chatPrivacyBanner.hidden = true;
    return;
  }
  const reminder = resources?.privacyReminder;
  if (!reminder) {
    chatPrivacyBanner.hidden = true;
    return;
  }
  chatPrivacyText.textContent = reminder;
  chatPrivacyBanner.hidden = false;
}

async function loadChatPrivacyBanner() {
  if (localStorage.getItem(CHAT_PRIVACY_DISMISS_KEY) === "1") {
    if (chatPrivacyBanner) chatPrivacyBanner.hidden = true;
    return;
  }
  try {
    const res = await fetch(
      `${API}/v1/meta/support-resources?locale=${encodeURIComponent(userLocale)}`,
    );
    if (!res.ok) return;
    const data = await res.json();
    applyChatPrivacyFromResources(data.resources);
  } catch {
    if (chatPrivacyBanner) chatPrivacyBanner.hidden = true;
  }
}

chatPrivacyDismiss?.addEventListener("click", () => {
  localStorage.setItem(CHAT_PRIVACY_DISMISS_KEY, "1");
  if (chatPrivacyBanner) chatPrivacyBanner.hidden = true;
});

function resolveSubscriptionProductId(tier) {
  const match = subscriptionProducts.find((s) => s.tier === tier);
  return match?.productId ?? `com.ctrlz.huhu.sub.${tier}`;
}

async function loadAppMeta() {
  try {
    const meta = await api("/v1/meta/iap-products");
    if (Array.isArray(meta.momentReportReasons) && meta.momentReportReasons.length) {
      momentReportReasons = meta.momentReportReasons;
    }
    coinProducts = (meta.products ?? []).filter((p) => p.kind === "coins");
    if (Array.isArray(meta.subscriptions) && meta.subscriptions.length) {
      subscriptionProducts = meta.subscriptions;
    }
  } catch {
    /* keep defaults */
  }
  await loadCoinCatalog();
  renderCoinButtons();
}

async function loadCoinCatalog() {
  coinPackPrices = new Map();
  const market = asoMarketForLocale(userLocale);
  try {
    const res = await fetch(
      `${API}/v1/meta/store-catalog?market=${encodeURIComponent(market)}`,
    );
    if (!res.ok) return;
    const data = await res.json();
    for (const pack of data.catalog?.coinPacks ?? []) {
      coinPackPrices.set(pack.productId, pack);
    }
  } catch {
    /* optional */
  }
}

function renderCoinButtons() {
  const container = document.getElementById("coinsToolbar");
  if (!container) return;
  container.innerHTML = "";
  for (const p of coinProducts) {
    const pack = coinPackPrices.get(p.productId);
    const coins = p.coins ?? pack?.coins ?? "?";
    const price =
      pack?.price != null && pack?.currency
        ? ` · ${pack.price} ${pack.currency}`
        : "";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "secondary";
    btn.textContent = `+${coins}${price}`;
    btn.title = p.productId;
    btn.addEventListener("click", () => buyCoins(p.productId));
    container.append(btn);
  }
}

async function buyCoins(productId) {
  if (!productId) return;
  try {
    const r = await api("/v1/iap/verify", {
      method: "POST",
      body: JSON.stringify({
        platform: "web",
        productId,
        receipt: `valid_${productId}`,
        transactionId: `dev_stub:${productId}-${Date.now()}`,
      }),
    });
    const amount =
      r.grant?.kind === "coins" ? String(r.grant.amount) : "?";
    bubble(
      t("coinsPurchased", {
        amount,
        total: String(r.economy?.coins ?? "?"),
      }),
      "assistant",
    );
    await refreshProfile();
  } catch (err) {
    bubble(`（${err.message}）`, "assistant");
  }
}

async function ensureSession() {
  const storedToken = localStorage.getItem("huhu_token");
  const storedUserId = localStorage.getItem("huhu_userId");
  const storedCharacterId = localStorage.getItem("huhu_characterId");
  if (storedToken) token = storedToken;
  if (storedUserId) userId = storedUserId;
  if (storedCharacterId) characterId = storedCharacterId;
  if (!token) {
    const boot = await api("/v1/users/bootstrap", { method: "POST" });
    userId = boot.userId;
    token = boot.token;
    localStorage.setItem("huhu_userId", userId);
    localStorage.setItem("huhu_token", token);
  }
  await ensureAgeConfirmed();
  await loadUiStrings(userLocale);
  await loadAppMeta();
  await loadClientConfigMeta();
  updateAsoLink();
  await loadLocaleOptions();
  await loadCharacterPicker();
  if (!characterId) {
    await createDefaultCharacter();
    await loadCharacterPicker();
  } else if (!ownedCharacterIds.has(characterId)) {
    await recoverMissingCharacter(false);
  } else {
    await loadHistory();
  }
  await refreshProfile({ skipRecover: true });
}

async function recoverMissingCharacter(notify = true) {
  characterId = null;
  localStorage.removeItem("huhu_characterId");
  chatEl.innerHTML = "";
  let created = false;
  await loadCharacterPicker();
  if (!characterId) {
    await createDefaultCharacter();
    created = true;
    await loadCharacterPicker();
  }
  if (characterId) {
    await loadHistory({ allowRecover: false });
  }
  if (notify && created) {
    bubble(`（${formatApiError("character_not_found")}）`, "assistant");
  }
  await refreshProfile({ skipRecover: true });
}

async function loadCharacterPicker() {
  if (!characterSelect || !userId) return;
  try {
    const data = await api(`/v1/users/${userId}/characters`);
    const list = data.characters ?? [];
    const prev = characterId;
    characterSelect.innerHTML = "";
    for (const c of list) {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name ?? c.id.slice(0, 8);
      characterSelect.appendChild(opt);
    }
    ownedCharacterIds = new Set(list.map((c) => c.id));
    if (characterId && list.some((c) => c.id === characterId)) {
      characterSelect.value = characterId;
    } else if (list.length > 0) {
      characterId = list[0].id;
      localStorage.setItem("huhu_characterId", characterId);
      characterSelect.value = characterId;
      if (prev !== characterId) await loadHistory({ allowRecover: false });
    } else {
      characterId = null;
      localStorage.removeItem("huhu_characterId");
    }
  } catch {
    /* optional */
  }
}

if (characterSelect) {
  characterSelect.addEventListener("change", async () => {
    const next = characterSelect.value;
    if (!next || next === characterId) return;
    characterId = next;
    localStorage.setItem("huhu_characterId", characterId);
    chatEl.innerHTML = "";
    await loadHistory();
    await refreshProfile();
  });
}

async function createDefaultCharacter() {
  const meta = await api(
    `/v1/meta/default-character?locale=${encodeURIComponent(userLocale)}`,
  );
  const char = await api("/v1/characters/from-preset", {
    method: "POST",
    body: JSON.stringify({
      presetId: meta.presetId,
      locale: meta.locale ?? userLocale,
    }),
  });
  characterId = char.characterId;
  localStorage.setItem("huhu_characterId", characterId);
  bubble(meta.greeting ?? t("defaultGreeting", { name: "" }), "assistant");
}

async function loadHistory({ allowRecover = true } = {}) {
  if (!characterId) return;
  try {
    const data = await api(`/v1/characters/${characterId}/messages?limit=50`);
    chatEl.innerHTML = "";
    for (const row of data.messages) {
      bubble(
        row.content,
        row.role === "user" ? "user" : "assistant",
        null,
        row.media,
        row.safety?.flagged === true,
        row.characterCorrected === true,
        row.id,
      );
    }
  } catch (err) {
    if (allowRecover && err.code === "character_not_found") {
      await recoverMissingCharacter(true);
      return;
    }
    throw err;
  }
}

async function refreshProfile({ skipRecover = false } = {}) {
  const user = await api("/v1/users/me");
  const locale = user.locale || "zh-TW";
  if (locale !== userLocale || Object.keys(ui).length === 0) {
    await loadUiStrings(locale);
  }
  if (localeSelect && localeSelect.value !== locale) {
    localeSelect.value = locale;
  }
  if (displayNameInput && document.activeElement !== displayNameInput) {
    displayNameInput.value = user.displayName ?? "";
  }
  if (!characterId) {
    updateStats(user, null);
    return;
  }
  try {
    const char = await api(`/v1/characters/${characterId}`);
    updateStats(user, char.relationship);
  } catch (err) {
    if (!skipRecover && err.code === "character_not_found") {
      await recoverMissingCharacter(false);
      return;
    }
    throw err;
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (voiceMode && !text) {
    bubble(t("holdToRecord"), "assistant");
    return;
  }
  if (!text) {
    bubble(`（${formatApiError("content_required")}）`, "assistant");
    return;
  }
  input.value = "";
  const userDiv = bubble(text, "user");
  const typing = bubble(t("typing"), "assistant typing");
  try {
    const result = await api("/v1/chat", {
      method: "POST",
      body: JSON.stringify({
        characterId,
        content: text,
        mode: modeSelect.value,
        messageType: voiceMode ? "voice" : "text",
      }),
    });
    typing.remove();
    const assistantId = applyChatMessageIds(userDiv, result);
    const reply = result.reply ?? {};
    bubble(
      reply.content ?? "…",
      "assistant",
      reply.voice,
      undefined,
      result.safety?.flagged === true,
      reply.characterCorrected === true,
      assistantId,
    );
    if (reply.voice?.audioBase64) {
      playVoiceBase64(reply.voice.audioBase64, reply.voice.mimeType);
    }
    updateStats(result.economy, result.relationship);
  } catch (err) {
    typing.remove();
    bubble(`（${err.message}）`, "assistant");
  }
});

async function renderDiaryList() {
  if (!diaryList || !characterId) return;
  diaryList.innerHTML = "";
  try {
    const data = await api(`/v1/characters/${characterId}/diary`);
    const entries = data.entries ?? [];
    if (entries.length === 0) {
      const li = document.createElement("li");
      li.textContent = t("diaryListEmpty");
      diaryList.appendChild(li);
      return;
    }
    for (const e of entries) {
      const li = document.createElement("li");
      const snippet = document.createElement("div");
      snippet.className = "diary-snippet";
      const title = e.title?.trim();
      const body = e.body ?? "";
      snippet.textContent = title ? `${title} — ${body}` : body;
      const actions = document.createElement("div");
      actions.className = "diary-actions";
      const editBtn = document.createElement("button");
      editBtn.type = "button";
      editBtn.className = "secondary";
      editBtn.textContent = t("diaryEdit");
      editBtn.addEventListener("click", () => {
        if (diaryEntryId) diaryEntryId.value = e.id;
        if (diaryTitleInput) diaryTitleInput.value = title ?? "";
        if (diaryBodyInput) diaryBodyInput.value = body;
      });
      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "secondary";
      delBtn.textContent = t("diaryDelete");
      delBtn.addEventListener("click", async () => {
        try {
          await api(`/v1/characters/${characterId}/diary/${e.id}`, {
            method: "DELETE",
          });
          await renderDiaryList();
        } catch (err) {
          alert(err.message);
        }
      });
      actions.append(editBtn, delBtn);
      li.append(snippet, actions);
      diaryList.appendChild(li);
    }
  } catch (err) {
    const li = document.createElement("li");
    li.textContent = err.message;
    diaryList.appendChild(li);
  }
}

diaryBtn?.addEventListener("click", async () => {
  if (!characterId || !diaryDialog) return;
  if (diaryEntryId) diaryEntryId.value = "";
  if (diaryTitleInput) diaryTitleInput.value = "";
  if (diaryBodyInput) diaryBodyInput.value = "";
  await renderDiaryList();
  diaryDialog.showModal();
});

diaryCancelBtn?.addEventListener("click", () => diaryDialog?.close());

diaryForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!characterId) return;
  const title = diaryTitleInput?.value.trim() ?? "";
  const body = diaryBodyInput?.value.trim() ?? "";
  if (!body) {
    alert(t("diaryEmpty"));
    return;
  }
  const entryId = diaryEntryId?.value?.trim();
  try {
    if (entryId) {
      await api(`/v1/characters/${characterId}/diary/${entryId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: title || undefined,
          body,
        }),
      });
    } else {
      await api(`/v1/characters/${characterId}/diary`, {
        method: "POST",
        body: JSON.stringify({
          title: title || undefined,
          body,
        }),
      });
    }
    diaryDialog?.close();
    alert(t("diarySaved"));
  } catch (err) {
    alert(err.message);
  }
});

function updateMomentsFeedHint() {
  if (!feedMomentsHint) return;
  feedMomentsHint.textContent =
    momentsFeedMode === "community"
      ? t("feedPublicHint")
      : momentsFeedMode === "friends"
        ? t("friendsFeedHint")
        : t("feedMomentsHint");
}

function setMomentsFeedMode(mode) {
  momentsFeedMode = mode;
  if (momentsTabMine) {
    momentsTabMine.setAttribute("aria-selected", mode === "mine" ? "true" : "false");
    momentsTabMine.classList.toggle("active", mode === "mine");
  }
  if (momentsTabCommunity) {
    momentsTabCommunity.setAttribute(
      "aria-selected",
      mode === "community" ? "true" : "false",
    );
    momentsTabCommunity.classList.toggle("active", mode === "community");
  }
  if (momentsTabFriends) {
    momentsTabFriends.setAttribute(
      "aria-selected",
      mode === "friends" ? "true" : "false",
    );
    momentsTabFriends.classList.toggle("active", mode === "friends");
  }
  updateMomentsFeedHint();
}

function momentVisibilityFromInputs() {
  if (momentPublicInput?.checked) return "public";
  if (momentFriendsInput?.checked) return "friends";
  return "private";
}

async function renderMomentsList() {
  if (!momentsList || !characterId) return;
  momentsList.innerHTML = "";
  try {
    const path =
      momentsFeedMode === "community"
        ? "/v1/feed/moments/public"
        : momentsFeedMode === "friends"
          ? "/v1/feed/moments/friends"
          : "/v1/feed/moments";
    const data = await api(path);
    const items = data.moments ?? [];
    if (items.length === 0) {
      const li = document.createElement("li");
      li.textContent =
        momentsFeedMode === "community"
          ? t("publicFeedEmpty")
          : momentsFeedMode === "friends"
            ? t("friendsFeedEmpty")
            : t("momentsListEmpty");
      momentsList.appendChild(li);
      return;
    }
    for (const m of items) {
      const li = document.createElement("li");
      const snippet = document.createElement("div");
      snippet.className = "diary-snippet";
      const when = m.createdAt ? new Date(m.createdAt).toLocaleString() : "";
      const who = m.characterName ? `${m.characterName} · ` : "";
      const vis =
        m.visibility === "public" && momentsFeedMode === "mine"
          ? ` · ${t("feedTabCommunity")}`
          : m.visibility === "friends" && momentsFeedMode === "mine"
            ? ` · ${t("feedTabFriends")}`
            : "";
      snippet.textContent = `${when ? `${when} · ` : ""}${who}${m.body}${vis}`;
      if (m.media?.base64 && m.media?.mimeType) {
        const img = document.createElement("img");
        img.className = "moment-thumb";
        img.alt = "";
        img.src = `data:${m.media.mimeType};base64,${m.media.base64}`;
        snippet.appendChild(document.createElement("br"));
        snippet.appendChild(img);
      }
      const actions = document.createElement("div");
      actions.className = "diary-actions";
      if (
        (momentsFeedMode === "community" || momentsFeedMode === "friends") &&
        !ownedCharacterIds.has(m.characterId)
      ) {
        const reportBtn = document.createElement("button");
        reportBtn.type = "button";
        reportBtn.className = "secondary";
        reportBtn.textContent = t("momentReport");
        reportBtn.addEventListener("click", async () => {
          const reason = await pickReportReason();
          if (!reason) return;
          if (!confirm(`${t("momentReport")}?`)) return;
          try {
            await api(`/v1/feed/moments/${m.id}/report`, {
              method: "POST",
              body: JSON.stringify({ reason }),
            });
            alert(t("momentReported"));
            await renderMomentsList();
          } catch (err) {
            alert(err.message?.includes("cannot_report_own")
              ? t("momentReportOwn")
              : err.message);
          }
        });
        actions.append(reportBtn);
      }
      if (ownedCharacterIds.has(m.characterId)) {
        const delBtn = document.createElement("button");
        delBtn.type = "button";
        delBtn.className = "secondary";
        delBtn.textContent = t("momentDelete");
        delBtn.addEventListener("click", async () => {
          try {
            await api(
              `/v1/characters/${m.characterId}/moments/${m.id}`,
              { method: "DELETE" },
            );
            await renderMomentsList();
          } catch (err) {
            alert(err.message);
          }
        });
        actions.append(delBtn);
      }
      li.append(snippet, actions);
      momentsList.appendChild(li);
    }
  } catch (err) {
    const li = document.createElement("li");
    li.textContent = err.message;
    momentsList.appendChild(li);
  }
}

momentsTabMine?.addEventListener("click", async () => {
  setMomentsFeedMode("mine");
  await renderMomentsList();
});

momentsTabCommunity?.addEventListener("click", async () => {
  setMomentsFeedMode("community");
  await renderMomentsList();
});

momentsTabFriends?.addEventListener("click", async () => {
  setMomentsFeedMode("friends");
  await renderMomentsList();
});

momentPublicInput?.addEventListener("change", () => {
  if (momentPublicInput.checked && momentFriendsInput) {
    momentFriendsInput.checked = false;
  }
});

momentFriendsInput?.addEventListener("change", () => {
  if (momentFriendsInput.checked && momentPublicInput) {
    momentPublicInput.checked = false;
  }
});

function renderFriendsList(ul, items, emptyText) {
  if (!ul) return;
  ul.innerHTML = "";
  if (!items?.length) {
    const li = document.createElement("li");
    li.className = "hint";
    li.textContent = emptyText;
    ul.appendChild(li);
    return;
  }
  for (const item of items) {
    const li = document.createElement("li");
    li.textContent = item.displayName || item.userId || item.toUserId || "—";
    ul.appendChild(li);
  }
}

function parseInviteFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("invite");
  if (!raw) return null;
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function clearInviteFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("invite")) return;
  url.searchParams.delete("invite");
  const next = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, "", next);
}

async function handleInviteDeepLink() {
  const code = parseInviteFromUrl();
  if (!code || code.length < 4) return;
  clearInviteFromUrl();
  if (inviteCodeInput) inviteCodeInput.value = code;
  if (inviteDeepLinkHint) {
    inviteDeepLinkHint.hidden = false;
    inviteDeepLinkHint.textContent = t("inviteDeepLinkHint");
  }
  await openFriendsDialog();
}

async function blockFriendUser(userId) {
  if (!userId || !window.confirm(t("blockUserConfirm"))) return;
  await api("/v1/blocks", {
    method: "POST",
    body: JSON.stringify({ userId }),
  });
  alert(t("userBlocked"));
  await loadFriendsDialog();
}

async function unblockFriendUser(userId) {
  if (!userId) return;
  await api(`/v1/blocks/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
  await loadFriendsDialog();
}

async function loadFriendsDialog() {
  const [me, requests, friends, blocks, qr] = await Promise.all([
    api("/v1/users/me"),
    api("/v1/friends/requests"),
    api("/v1/friends"),
    api("/v1/blocks"),
    api("/v1/users/me/invite-qr").catch(() => null),
  ]);
  if (myInviteCodeEl) myInviteCodeEl.textContent = me.inviteCode || "—";
  lastInviteLink = me.inviteLink || null;
  if (copyInviteLinkBtn) {
    copyInviteLinkBtn.disabled = !lastInviteLink;
  }
  if (inviteQrImg && qr?.dataUrl) {
    inviteQrImg.src = qr.dataUrl;
    inviteQrImg.hidden = false;
  } else if (inviteQrImg) {
    inviteQrImg.hidden = true;
    inviteQrImg.removeAttribute("src");
  }
  const incoming = requests.incoming ?? [];
  const outgoing = requests.outgoing ?? [];
  const friendRows = friends.friends ?? [];
  if (friendsIncomingList) {
    friendsIncomingList.innerHTML = "";
    if (!incoming.length) {
      renderFriendsList(
        friendsIncomingList,
        [],
        t("friendRequestsEmpty"),
      );
    } else {
      for (const row of incoming) {
        const li = document.createElement("li");
        li.textContent = `${row.displayName} (${row.fromUserId})`;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "secondary";
        btn.textContent = t("confirm");
        btn.addEventListener("click", async () => {
          try {
            await api(`/v1/friends/${row.friendshipId}/accept`, {
              method: "POST",
            });
            alert(t("friendAccepted"));
            await loadFriendsDialog();
          } catch (err) {
            alert(err.message);
          }
        });
        li.appendChild(document.createTextNode(" "));
        li.appendChild(btn);
        friendsIncomingList.appendChild(li);
      }
    }
  }
  renderFriendsList(
    friendsOutgoingList,
    outgoing.map((o) => ({
      displayName: `${o.displayName} → ${o.toUserId}`,
    })),
    t("friendRequestsEmpty"),
  );
  if (friendsListEl) {
    friendsListEl.innerHTML = "";
    if (!friendRows.length) {
      renderFriendsList(friendsListEl, [], t("friendRequestsEmpty"));
    } else {
      for (const row of friendRows) {
        const li = document.createElement("li");
        li.className = "friend-row";
        const name = document.createElement("span");
        name.textContent = row.displayName || row.userId || "—";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "secondary";
        btn.textContent = t("blockUser");
        btn.addEventListener("click", () => blockFriendUser(row.userId));
        li.appendChild(name);
        li.appendChild(btn);
        friendsListEl.appendChild(li);
      }
    }
  }
  const blockedRows = blocks.blocked ?? [];
  if (blockedUsersList) {
    blockedUsersList.innerHTML = "";
    if (!blockedRows.length) {
      renderFriendsList(
        blockedUsersList,
        [],
        t("friendRequestsEmpty"),
      );
    } else {
      for (const row of blockedRows) {
        const li = document.createElement("li");
        li.className = "friend-row";
        const name = document.createElement("span");
        name.textContent = row.displayName || row.userId || "—";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "secondary";
        btn.textContent = t("unblockUser");
        btn.addEventListener("click", () => unblockFriendUser(row.userId));
        li.appendChild(name);
        li.appendChild(btn);
        blockedUsersList.appendChild(li);
      }
    }
  }
}

async function runFriendSearch() {
  const q = friendSearchInput?.value?.trim();
  if (!friendSearchResults) return;
  friendSearchResults.innerHTML = "";
  if (!q || q.length < 2) {
    const li = document.createElement("li");
    li.className = "hint";
    li.textContent = t("searchFriendsMinLength");
    friendSearchResults.appendChild(li);
    return;
  }
  try {
    const data = await api(
      `/v1/users/search?q=${encodeURIComponent(q)}`,
    );
    const results = data.results ?? [];
    if (!results.length) {
      renderFriendsList(
        friendSearchResults,
        [],
        t("searchFriendsEmpty"),
      );
      return;
    }
    for (const row of results) {
      const li = document.createElement("li");
      li.className = "friend-row";
      const name = document.createElement("span");
      const codeSuffix = row.inviteCode ? ` (${row.inviteCode})` : "";
      name.textContent = `${row.displayName || row.userId}${codeSuffix}`;
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "secondary";
      btn.textContent = t("sendFriendRequestTo");
      btn.addEventListener("click", async () => {
        try {
          const r = await api("/v1/friends/request", {
            method: "POST",
            body: JSON.stringify({ targetUserId: row.userId }),
          });
          alert(
            r.autoAccepted ? t("friendAccepted") : t("friendRequestSent"),
          );
          await loadFriendsDialog();
        } catch (err) {
          const msg =
            err.message === "blocked"
              ? t("friendBlocked")
              : err.message;
          alert(msg);
        }
      });
      li.appendChild(name);
      li.appendChild(btn);
      friendSearchResults.appendChild(li);
    }
  } catch (err) {
    alert(err.message);
  }
}

friendSearchBtn?.addEventListener("click", () => runFriendSearch());
friendSearchInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    runFriendSearch();
  }
});

saveDisplayNameBtn?.addEventListener("click", async () => {
  const name = displayNameInput?.value?.trim();
  if (!name) return;
  try {
    await api("/v1/users/me/display-name", {
      method: "PATCH",
      body: JSON.stringify({ displayName: name }),
    });
    alert(t("displayNameSaved"));
    await refreshProfile();
  } catch (err) {
    alert(
      err.message === "invalid_display_name"
        ? t("invalidDisplayName")
        : err.message,
    );
  }
});

async function openFriendsDialog() {
  if (!friendsDialog) return;
  try {
    await loadFriendsDialog();
    if (inviteCodeInput) inviteCodeInput.value = "";
    if (friendSearchInput) friendSearchInput.value = "";
    if (friendSearchResults) friendSearchResults.innerHTML = "";
    friendsDialog.showModal();
  } catch (err) {
    alert(err.message);
  }
}

copyInviteBtn?.addEventListener("click", async () => {
  const code = myInviteCodeEl?.textContent?.trim();
  if (!code || code === "—") return;
  try {
    await navigator.clipboard.writeText(code);
    alert(t("inviteCodeCopied"));
  } catch {
    alert(code);
  }
});

copyInviteLinkBtn?.addEventListener("click", async () => {
  if (!lastInviteLink) return;
  try {
    await navigator.clipboard.writeText(lastInviteLink);
    alert(t("inviteLinkCopied"));
  } catch {
    alert(lastInviteLink);
  }
});

friendsBtn?.addEventListener("click", () => {
  openFriendsDialog();
});

friendsCloseBtn?.addEventListener("click", () => friendsDialog?.close());

friendsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const code = inviteCodeInput?.value?.trim();
  if (!code) return;
  try {
    const r = await api("/v1/friends/request", {
      method: "POST",
      body: JSON.stringify({ inviteCode: code }),
    });
    alert(r.autoAccepted ? t("friendAccepted") : t("friendRequestSent"));
    if (inviteCodeInput) inviteCodeInput.value = "";
    await loadFriendsDialog();
  } catch (err) {
    const msg =
      err.message === "invite_code_not_found"
        ? t("inviteCodeNotFound")
        : err.message === "blocked"
          ? t("friendBlocked")
          : err.message;
    alert(msg);
  }
});

momentsBtn?.addEventListener("click", async () => {
  if (!characterId || !momentsDialog) return;
  if (momentBodyInput) momentBodyInput.value = "";
  if (momentPublicInput) momentPublicInput.checked = false;
  if (momentFriendsInput) momentFriendsInput.checked = false;
  pendingMomentPhoto = null;
  setMomentsFeedMode("mine");
  await renderMomentsList();
  momentsDialog.showModal();
});

momentPhotoBtn?.addEventListener("click", () => momentPhotoInput?.click());

momentPhotoInput?.addEventListener("change", async () => {
  const file = momentPhotoInput.files?.[0];
  momentPhotoInput.value = "";
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    alert(t("photoTooLarge"));
    return;
  }
  pendingMomentPhoto = {
    mimeType: file.type || "image/jpeg",
    base64: await blobToBase64(file),
  };
});

momentsCancelBtn?.addEventListener("click", () => momentsDialog?.close());

momentsForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!characterId) return;
  const body = momentBodyInput?.value.trim() ?? "";
  if (!body) {
    alert(t("momentEmpty"));
    return;
  }
  try {
    const payload = {
      body,
      visibility: momentVisibilityFromInputs(),
    };
    if (pendingMomentPhoto) {
      payload.imageBase64 = pendingMomentPhoto.base64;
      payload.imageMimeType = pendingMomentPhoto.mimeType;
    }
    await api(`/v1/characters/${characterId}/moments`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    pendingMomentPhoto = null;
    momentsDialog?.close();
    alert(t("momentSaved"));
  } catch (err) {
    alert(err.message);
  }
});

photoBtn?.addEventListener("click", () => photoInput?.click());

photoInput?.addEventListener("change", async () => {
  const file = photoInput.files?.[0];
  photoInput.value = "";
  if (!file || !characterId) return;
  if (file.size > 2 * 1024 * 1024) {
    alert(t("photoTooLarge"));
    return;
  }
  const caption = await askPhotoCaption();
  if (caption === null) return;
  const base64 = await blobToBase64(file);
  const preview = { mimeType: file.type || "image/jpeg", imageBase64: base64 };
  const userDiv = bubble(caption || t("attachPhoto"), "user", null, preview);
  const typing = bubble(t("typing"), "assistant typing");
  try {
    const result = await api("/v1/chat", {
      method: "POST",
      body: JSON.stringify({
        characterId,
        content: caption,
        mode: modeSelect.value,
        messageType: "image",
        imageBase64: base64,
        imageMimeType: file.type || "image/jpeg",
      }),
    });
    typing.remove();
    const assistantId = applyChatMessageIds(userDiv, result);
    const reply = result.reply ?? {};
    bubble(
      reply.content ?? "…",
      "assistant",
      reply.voice,
      reply.userMedia,
      result.safety?.flagged === true,
      reply.characterCorrected === true,
      assistantId,
    );
    if (reply.voice?.audioBase64) {
      playVoiceBase64(reply.voice.audioBase64, reply.voice.mimeType);
    }
    updateStats(result.economy, result.relationship);
  } catch (err) {
    typing.remove();
    bubble(`（${err.message}）`, "assistant");
  }
});

function applySubscribeDialogCopy() {
  if (subscribeTiersPrompt) {
    subscribeTiersPrompt.textContent =
      subscriptionTiersPromptText || t("subscribePrompt");
  }
}

function localTierDisplayName(tier) {
  if (tier === "lite") return t("tierNameLite");
  if (tier === "basic") return t("tierNameBasic");
  if (tier === "premium") return t("tierNamePremium");
  return tier;
}

/** @param {{ lite?: number; basic?: number; premium?: number; currency?: string } | null} pricing */
function updateSubscribeTierLabels(pricing) {
  for (const span of subscribeForm?.querySelectorAll(".tier-label") ?? []) {
    const tier = span.dataset.tier;
    if (!tier) continue;
    const name =
      subscriptionTierDisplayByTier?.[tier] ?? localTierDisplayName(tier);
    const ent =
      subscriptionTierLabelsByTier?.[tier] ??
      formatTierEntitlementsShort(subscriptionTiersByTier?.[tier]);
    const price = pricing?.[tier];
    const currency = pricing?.currency;
    if (price != null && currency) {
      span.textContent = ent
        ? `${name} · ${price} ${currency} · ${ent}`
        : `${name} · ${price} ${currency}`;
    } else if (ent) {
      span.textContent = `${name} · ${ent}`;
    } else {
      span.textContent = name;
    }
  }
}

async function loadSubscribePricingHint() {
  applySubscribeDialogCopy();
  if (subscribePricingHint) subscribePricingHint.textContent = "";
  let pricing = null;
  let regionLabel = "";
  try {
    const me = await api("/v1/users/me");
    pricing = me.plan?.pricing ?? null;
    regionLabel = me.plan?.pricingRegion ?? "";
  } catch {
    /* ignore */
  }
  if (!pricing) {
    try {
      const market = asoMarketForLocale(userLocale);
      const res = await fetch(
        `${API}/v1/meta/store-catalog?market=${encodeURIComponent(market)}`,
      );
      if (res.ok) {
        const data = await res.json();
        pricing = data.catalog?.pricing ?? null;
        regionLabel = data.catalog?.pricingRegion ?? market.toUpperCase();
      }
    } catch {
      /* ignore */
    }
  }
  lastSubscribePricing = pricing;
  updateSubscribeTierLabels(pricing);
  if (pricing && subscribePricingHint) {
    subscribePricingHint.textContent = formatSubscribePppHint(
      regionLabel,
      pricing,
    );
  }
}

subscribeBtn.addEventListener("click", async () => {
  if (!subscribeDialog) return;
  await loadSubscribePricingHint();
  subscribeDialog.showModal();
});

subscribeCancelBtn?.addEventListener("click", () => subscribeDialog?.close());

subscribeForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (subscribeForm.returnValue !== "ok") {
    subscribeDialog?.close();
    return;
  }
  const tier = subscribeForm.tier?.value;
  if (!tier || !["lite", "basic", "premium"].includes(tier)) return;
  subscribeDialog?.close();
  try {
    const productId = resolveSubscriptionProductId(tier);
    const r = await api("/v1/iap/verify", {
      method: "POST",
      body: JSON.stringify({
        platform: "web",
        productId,
        receipt: `valid_${productId}`,
        transactionId: `dev_stub:sub-${tier}-${Date.now()}`,
      }),
    });
    bubble(
      t("subscribedTier", {
        tier: localTierDisplayName(tier),
        coins: String(r.bonusCoins ?? 0),
      }),
      "assistant",
    );
    await refreshProfile();
  } catch (err) {
    bubble(`（${err.message}）`, "assistant");
  }
});

async function runPrivacyAction(action) {
  if (!characterId) return;
  try {
    if (action === "reset") {
      if (!confirm(t("resetRelationshipMsg"))) return;
      await api(`/v1/characters/${characterId}/relationship/reset`, {
        method: "POST",
      });
      bubble(t("privacyResetDone"), "assistant");
    } else if (action === "rag") {
      if (!confirm(t("clearRagMsg"))) return;
      await api(`/v1/characters/${characterId}/memories`, { method: "DELETE" });
      bubble(t("privacyMemoryDone"), "assistant");
      await loadMemoryFragments();
    } else if (action === "account") {
      if (!confirm(t("privacyAccountConfirm"))) return;
      await api("/v1/users/me/data", { method: "DELETE" });
      localStorage.clear();
      location.reload();
      return;
    } else if (action === "messages") {
      if (!confirm(t("privacyMessagesConfirm"))) return;
      await api(`/v1/characters/${characterId}/messages`, {
        method: "DELETE",
      });
      chatEl.innerHTML = "";
      bubble(t("privacyMessagesDone"), "assistant");
    }
    await refreshProfile();
  } catch (err) {
    bubble(`（${err.message}）`, "assistant");
  }
}

async function loadSupportResourcesHint() {
  if (!supportResourcesHint) return;
  supportResourcesHint.textContent = "";
  try {
    const res = await fetch(
      `${API}/v1/meta/support-resources?locale=${encodeURIComponent(userLocale)}`,
    );
    if (!res.ok) return;
    const { resources } = await res.json();
    if (resources?.privacyReminder) {
      supportResourcesHint.textContent = resources.privacyReminder;
    }
  } catch {
    /* optional */
  }
}

function fillSupportList(el, lines) {
  if (!el) return;
  el.replaceChildren();
  for (const line of lines ?? []) {
    const li = document.createElement("li");
    li.textContent = line;
    el.appendChild(li);
  }
}

async function loadSupportDialog() {
  try {
    const res = await fetch(
      `${API}/v1/meta/support-resources?locale=${encodeURIComponent(userLocale)}`,
    );
    if (!res.ok) return;
    const { resources } = await res.json();
    if (supportPrivacyReminder) {
      supportPrivacyReminder.textContent = resources?.privacyReminder ?? "";
    }
    if (supportCrisisTitle) {
      supportCrisisTitle.textContent = resources?.crisis?.title ?? "";
    }
    fillSupportList(supportCrisisLines, resources?.crisis?.lines);
    if (supportWellnessTitle) {
      supportWellnessTitle.textContent = resources?.wellness?.title ?? "";
    }
    fillSupportList(supportWellnessLines, resources?.wellness?.lines);
  } catch {
    /* optional */
  }
}

async function loadMemoryFragments() {
  if (!memoryFragmentsSection || !characterId) {
    if (memoryFragmentsSection) memoryFragmentsSection.hidden = true;
    return;
  }
  memoryFragmentsSection.hidden = false;
  memoryFragmentsList.innerHTML = "";
  try {
    const data = await api(`/v1/characters/${characterId}/memories?limit=30`);
    const items = data.items ?? [];
    if (memoryFragmentsEmpty) {
      memoryFragmentsEmpty.hidden = items.length > 0;
    }
    for (const item of items) {
      const li = document.createElement("li");
      const preview = document.createElement("p");
      preview.textContent = item.preview;
      const del = document.createElement("button");
      del.type = "button";
      del.className = "secondary";
      del.textContent = t("memoryDeleteBtn");
      del.addEventListener("click", async () => {
        if (!confirm(t("memoryDeleteConfirm"))) return;
        await api(`/v1/characters/${characterId}/memories/${item.id}`, {
          method: "DELETE",
        });
        bubble(t("memoryDeleteDone"), "assistant");
        await loadMemoryFragments();
      });
      li.append(preview, del);
      memoryFragmentsList.append(li);
    }
  } catch {
    if (memoryFragmentsEmpty) memoryFragmentsEmpty.hidden = false;
  }
}

privacyBtn.addEventListener("click", async () => {
  if (!privacyDialog) return;
  await loadSupportResourcesHint();
  await loadMemoryFragments();
  privacyDialog.showModal();
});

supportBtn?.addEventListener("click", async () => {
  if (!supportDialog) return;
  await loadSupportDialog();
  supportDialog.showModal();
});

supportCloseBtn?.addEventListener("click", () => supportDialog?.close());

privacyCloseBtn?.addEventListener("click", () => privacyDialog?.close());

for (const btn of [
  privacyResetBtn,
  privacyRagBtn,
  privacyMessagesBtn,
  privacyAccountBtn,
]) {
  btn?.addEventListener("click", async () => {
    const action = btn.dataset.privacyAction;
    if (!action) return;
    privacyDialog?.close();
    await runPrivacyAction(action);
  });
}

exportBtn.addEventListener("click", async () => {
  if (!characterId) return;
  try {
    const data = await api(
      `/v1/characters/${characterId}/export?format=webnovel`,
    );
    const blob = new Blob([data.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `huhu-${characterId.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    bubble(t("exportDone"), "assistant");
  } catch (err) {
    bubble(`（${err.message}）`, "assistant");
  }
});

checkinBtn.addEventListener("click", async () => {
  try {
    const r = await api("/v1/rewards/daily-checkin", { method: "POST" });
    bubble(
      t("dailyCheckinReward", { coins: String(r.coinsAwarded) }),
      "assistant",
    );
    await refreshProfile();
  } catch (err) {
    bubble(`（${err.message}）`, "assistant");
  }
});

offerwallBtn.addEventListener("click", async () => {
  try {
    const prep = await api("/v1/rewards/offerwall/prepare", { method: "POST" });
    const body =
      prep.verificationRequired === true
        ? {
            transactionId: prep.transactionId,
            timestamp: prep.timestamp,
            signature: prep.signature,
          }
        : {};
    const r = await api("/v1/rewards/offerwall", {
      method: "POST",
      body: JSON.stringify(body),
    });
    bubble(
      t("offerwallReward", { coins: String(r.coinsAwarded) }),
      "assistant",
    );
    await refreshProfile();
  } catch (err) {
    bubble(`（${err.message}）`, "assistant");
  }
});

async function loadPresets() {
  const select = document.getElementById("presetSelect");
  if (!select) return;
  try {
    const data = await api("/v1/characters/presets");
    for (const p of data.presets) {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = `${p.name}（${p.tags?.join("、") ?? ""}）`;
      select.appendChild(opt);
    }
    select.addEventListener("change", () => {
      const preset = data.presets.find((x) => x.id === select.value);
      if (!preset) return;
      creatorForm.name.value = preset.name;
      creatorForm.personality.value = preset.personality;
      creatorForm.backstory.value = preset.backstory;
      creatorForm.speakingStyle.value = preset.speakingStyle;
      const loc = document.getElementById("creatorLocale");
      if (loc && preset.locale) loc.value = preset.locale;
    });
  } catch {
    /* presets optional */
  }
}

createCharBtn.addEventListener("click", () => {
  loadPresets();
  creatorDialog.showModal();
});

creatorForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(creatorForm);
  try {
    const presetId = fd.get("preset");
    const locale = fd.get("locale") || "zh-TW";
    const char = presetId
      ? await api("/v1/characters/from-preset", {
          method: "POST",
          body: JSON.stringify({ presetId, locale }),
        })
      : await api("/v1/characters", {
          method: "POST",
          body: JSON.stringify({
            name: fd.get("name"),
            personality: fd.get("personality"),
            backstory: fd.get("backstory"),
            speakingStyle: fd.get("speakingStyle"),
            locale,
          }),
        });
    characterId = char.characterId;
    localStorage.setItem("huhu_characterId", characterId);
    chatEl.innerHTML = "";
    creatorDialog.close();
    creatorForm.reset();
    bubble(t("newCharacterReady"), "assistant");
    await loadCharacterPicker();
    await refreshProfile();
  } catch (err) {
    alert(err.message);
  }
});

if (window.visualViewport) {
  const updateViewport = () => {
    const vv = window.visualViewport;
    document.body.style.height = `${vv.height}px`;
    const inset = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty(
      "--keyboard-inset",
      `${inset}px`,
    );
    if (document.activeElement === input) {
      chatEl.scrollTop = chatEl.scrollHeight;
    }
  };
  window.visualViewport.addEventListener("resize", updateViewport);
  window.visualViewport.addEventListener("scroll", updateViewport);
  input?.addEventListener("focus", updateViewport);
  input?.addEventListener("blur", () => {
    document.documentElement.style.setProperty("--keyboard-inset", "0px");
  });
  updateViewport();
}

ensureSession()
  .then(() => handleInviteDeepLink())
  .catch((err) => {
    bubble(t("connectionFailedMsg", { message: err.message }), "assistant");
  });
