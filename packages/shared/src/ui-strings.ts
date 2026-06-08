import type { SupportedLocaleId } from "./locales.js";

export type UiStringKey =
  | "appTitle"
  | "inputPlaceholder"
  | "send"
  | "modeSimple"
  | "modeLong"
  | "modeExciting"
  | "dailyCheckin"
  | "offerwall"
  | "subscribe"
  | "exportChat"
  | "newCharacter"
  | "privacy"
  | "supportResources"
  | "openSupportPage"
  | "openPrivacyPolicy"
  | "characterGuardCorrected"
  | "playVoice"
  | "voiceModeOn"
  | "voiceModeOff"
  | "stamina"
  | "coins"
  | "plan"
  | "subscriptionExpired"
  | "daysRemaining"
  | "ageTitle"
  | "ageBody"
  | "birthYear"
  | "ageConfirm"
  | "createCharacter"
  | "cancel"
  | "confirm"
  | "create"
  | "settings"
  | "typing"
  | "switchCharacter"
  | "connectionFailed"
  | "save"
  | "apiBaseUrl"
  | "localeLabel"
  | "selectCharacter"
  | "privacyData"
  | "officialPreset"
  | "customPreset"
  | "chatLocale"
  | "name"
  | "personality"
  | "backstory"
  | "speakingStyle"
  | "creating"
  | "createAndSwitch"
  | "createFailed"
  | "dailyCheckinReward"
  | "checkinFailed"
  | "subscribeFailed"
  | "restorePurchases"
  | "restorePurchasesDone"
  | "restorePurchasesNone"
  | "restorePurchasesFailed"
  | "exportSuccess"
  | "exportFailed"
  | "devSubscribe"
  | "saveApiHint"
  | "saving"
  | "offerwallReward"
  | "chatPrivacyDismiss"
  | "privacyIntro"
  | "resetRelationshipTitle"
  | "resetRelationshipMsg"
  | "resetRelationshipBtn"
  | "clearRagTitle"
  | "clearRagMsg"
  | "clearRagBtn"
  | "clearMessagesTitle"
  | "clearMessagesMsg"
  | "clearMessagesBtn"
  | "deleteAccountTitle"
  | "deleteAccountMsg"
  | "deleteAccountBtn"
  | "actionDone"
  | "actionFailed"
  | "privacyPrompt"
  | "privacyResetDone"
  | "privacyMemoryDone"
  | "memoryFragmentsTitle"
  | "memoryFragmentsEmpty"
  | "memoryDeleteBtn"
  | "memoryDeleteConfirm"
  | "memoryDeleteDone"
  | "privacyMessagesDone"
  | "privacyAccountConfirm"
  | "privacyMessagesConfirm"
  | "deleteMessageBtn"
  | "deleteMessageConfirm"
  | "subscribedTier"
  | "coinsPurchased"
  | "exportDone"
  | "newCharacterReady"
  | "connectionFailedMsg"
  | "defaultGreeting"
  | "subscribePrompt"
  | "subscribePromptPrefix"
  | "personalityPlaceholder"
  | "speakingPlaceholder"
  | "holdToRecord"
  | "voiceRequiresBasic"
  | "insufficientStamina"
  | "insufficientCoins"
  | "characterLimitReached"
  | "characterNotFound"
  | "ageConfirmationRequired"
  | "contentRequired"
  | "validationFailed"
  | "rateLimited"
  | "recording"
  | "micDenied"
  | "diary"
  | "diaryTitle"
  | "diaryBody"
  | "diarySaved"
  | "diaryEmpty"
  | "diaryEdit"
  | "diaryDelete"
  | "diaryListEmpty"
  | "attachPhoto"
  | "photoTooLarge"
  | "photoCaption"
  | "moments"
  | "momentBody"
  | "momentSaved"
  | "momentEmpty"
  | "momentDelete"
  | "momentsListEmpty"
  | "momentPhoto"
  | "feedMomentsHint"
  | "momentPublishPublic"
  | "feedTabMine"
  | "feedTabCommunity"
  | "feedTabFriends"
  | "feedPublicHint"
  | "friendsFeedHint"
  | "friendsFeedEmpty"
  | "momentPublishFriends"
  | "friendsBtn"
  | "friendsDialogTitle"
  | "inviteCodeLabel"
  | "copyInviteCode"
  | "copyInviteLink"
  | "inviteCodeCopied"
  | "inviteLinkCopied"
  | "inviteDeepLinkHint"
  | "friendsIncomingTitle"
  | "friendsOutgoingTitle"
  | "friendsListTitle"
  | "addFriendByCode"
  | "searchFriendsLabel"
  | "searchFriendsPlaceholder"
  | "searchFriendsBtn"
  | "searchFriendsEmpty"
  | "searchFriendsMinLength"
  | "sendFriendRequestTo"
  | "displayNameLabel"
  | "displayNameSaved"
  | "invalidDisplayName"
  | "inviteCodeNotFound"
  | "friendRequestsEmpty"
  | "friendsClose"
  | "friendRequestSent"
  | "friendAccepted"
  | "blockUser"
  | "blockUserConfirm"
  | "blockedUsersTitle"
  | "unblockUser"
  | "userBlocked"
  | "friendBlocked"
  | "inviteQrAlt"
  | "publicFeedEmpty"
  | "momentReport"
  | "momentReported"
  | "momentReportOwn"
  | "momentReportPick"
  | "momentReportReasonSpam"
  | "momentReportReasonHarassment"
  | "momentReportReasonInappropriate"
  | "momentReportReasonOther"
  | "tierEntUnlimitedStamina"
  | "tierEntVoice"
  | "tierEntMemory"
  | "tierEntReply"
  | "tierEntPremium"
  | "tierEntCharacters"
  | "subscribePppHint"
  | "tierNameLite"
  | "tierNameBasic"
  | "tierNamePremium"
  | "tierNameFree"
  | "economyRulesTitle";

type StringTable = Record<UiStringKey, string>;

const zhTW: StringTable = {
  appTitle: "呼呼 Huhu",
  inputPlaceholder: "輸入訊息…",
  send: "送出",
  modeSimple: "簡單",
  modeLong: "長對話 (-5幣)",
  modeExciting: "心動 (-10幣)",
  dailyCheckin: "每日簽到",
  offerwall: "看廣告領幣",
  subscribe: "訂閱",
  exportChat: "匯出對話",
  newCharacter: "新角色",
  privacy: "隱私",
  supportResources: "支援資源",
  openSupportPage: "開啟支援頁面",
  openPrivacyPolicy: "開啟隱私權說明",
  characterGuardCorrected: "角色修正回覆（已替換 AI 元回覆）",
  playVoice: "▶ 播放語音",
  voiceModeOn: "語音模式開啟（3體力，需 {tier}+）",
  voiceModeOff: "語音模式（3體力，需 {tier}+）",
  stamina: "體力",
  coins: "呼呼幣",
  plan: "方案",
  subscriptionExpired: "（訂閱已過期）",
  daysRemaining: "（剩 {days} 天）",
  ageTitle: "年齡確認",
  ageBody:
    "呼呼 Huhu 僅供年滿 18 歲使用者。請輸入出生年份以繼續（無需上傳證件）。",
  birthYear: "出生年份",
  ageConfirm: "我確認已滿 18 歲",
  createCharacter: "建立角色",
  cancel: "取消",
  confirm: "確認",
  create: "建立",
  settings: "設定",
  typing: "正在輸入中…",
  switchCharacter: "切換角色",
  connectionFailed: "連線失敗",
  save: "儲存",
  apiBaseUrl: "API 位址",
  localeLabel: "介面語系",
  selectCharacter: "選擇角色",
  privacyData: "隱私與資料",
  officialPreset: "官方模板",
  customPreset: "自訂",
  chatLocale: "對話語系",
  name: "名稱",
  personality: "性格",
  backstory: "背景",
  speakingStyle: "語氣",
  creating: "建立中…",
  createAndSwitch: "建立並切換",
  createFailed: "建立失敗",
  dailyCheckinReward: "簽到 +{coins} 幣",
  checkinFailed: "簽到失敗",
  subscribeFailed: "訂閱失敗",
  restorePurchases: "恢復購買",
  restorePurchasesDone: "已恢復 {count} 筆訂閱",
  restorePurchasesNone: "未找到可恢復的訂閱",
  restorePurchasesFailed: "恢復購買失敗",
  exportSuccess: "已匯出 {chars} 字",
  exportFailed: "匯出失敗",
  devSubscribe: "訂閱（開發驗證）",
  saveApiHint: "已儲存，請重新啟動 App",
  saving: "儲存中…",
  offerwallReward: "獲得 {coins} 呼呼幣",
  chatPrivacyDismiss: "知道了",
  privacyIntro:
    "依藍圖提供資料自主權：可重置關係、檢視並刪除單筆 RAG 記憶、一次清除全部記憶，或刪除帳號資料。",
  resetRelationshipTitle: "重置好感度",
  resetRelationshipMsg: "將此角色的好感度與關係階段恢復為初始狀態。",
  resetRelationshipBtn: "重置關係進度",
  clearRagTitle: "清除長期記憶",
  clearRagMsg: "刪除向量記憶庫中的 RAG 片段，對話紀錄仍保留。",
  clearRagBtn: "清除 RAG 記憶",
  clearMessagesTitle: "清除對話紀錄",
  clearMessagesMsg:
    "刪除此角色全部聊天訊息（RAG 記憶需另按「清除 RAG 記憶」）。",
  clearMessagesBtn: "清除對話紀錄",
  deleteAccountTitle: "刪除帳號資料",
  deleteAccountMsg:
    "將刪除所有角色、對話與記憶，並重置帳號經濟狀態。此操作無法復原。",
  deleteAccountBtn: "刪除帳號全部資料",
  actionDone: "{action} 完成",
  actionFailed: "失敗",
  privacyPrompt: "隱私：1=重置好感 2=清除記憶 3=刪除帳號 4=清除對話",
  privacyResetDone: "好感度已重置。",
  privacyMemoryDone: "長期記憶已清除。",
  memoryFragmentsTitle: "長期記憶片段",
  memoryFragmentsEmpty: "尚無已索引的記憶片段。",
  memoryDeleteBtn: "刪除此片段",
  memoryDeleteConfirm: "刪除此則長期記憶？對話紀錄不會一併刪除。",
  memoryDeleteDone: "已刪除該記憶片段。",
  privacyMessagesDone: "對話紀錄已清除。",
  privacyAccountConfirm: "確定刪除所有帳號資料？",
  privacyMessagesConfirm: "確定清除此角色全部對話紀錄？",
  deleteMessageBtn: "刪除此則",
  deleteMessageConfirm: "確定刪除此則訊息？",
  subscribedTier: "已開通 {tier}（+{coins} 幣）",
  coinsPurchased: "已購買 +{amount} 呼呼幣（餘額 {total}）",
  exportDone: "已匯出網路小說 Markdown。",
  newCharacterReady: "新角色已就緒，打聲招呼吧。",
  connectionFailedMsg: "連線失敗：{message}",
  defaultGreeting: "嗨，我是 {name}。今天過得怎麼樣？",
  subscribePrompt: "訂閱方案：輕量 / 基礎 / 尊榮",
  subscribePromptPrefix: "訂閱方案：",
  personalityPlaceholder: "溫柔、傲嬌…",
  speakingPlaceholder: "口語、可愛…",
  holdToRecord: "語音模式：按住麥克風錄音，放開送出",
  voiceRequiresBasic: "語音訊息需 {tier} 或以上訂閱",
  insufficientStamina: "體力不足，請稍候恢復或升級訂閱",
  insufficientCoins: "呼呼幣不足",
  characterLimitReached: "角色數量已達上限，請升級訂閱",
  characterNotFound: "找不到此角色，已為您建立新角色",
  ageConfirmationRequired: "請先完成年齡確認",
  contentRequired: "請輸入訊息內容",
  validationFailed: "請求格式不正確，請檢查後再試",
  rateLimited: "操作過於頻繁，請稍後再試",
  recording: "（語音訊息）",
  micDenied: "無法使用麥克風，請檢查瀏覽器權限。",
  diary: "寫日記",
  diaryTitle: "日記標題（可留空）",
  diaryBody: "今天想記下什麼？",
  diarySaved: "日記已保存，並寫入長期記憶。",
  diaryEmpty: "內容不可為空。",
  diaryEdit: "編輯",
  diaryDelete: "刪除",
  diaryListEmpty: "尚無日記，在下方新增一則吧。",
  attachPhoto: "傳照片",
  photoTooLarge: "圖片需小於 2MB。",
  photoCaption: "照片說明（可留空）",
  moments: "動態",
  momentBody: "分享這一刻…",
  momentSaved: "動態已發布，並寫入長期記憶。",
  momentEmpty: "動態內容不可為空。",
  momentDelete: "刪除",
  momentsListEmpty: "尚無動態，在下方發布一則吧。",
  momentPhoto: "附加照片",
  feedMomentsHint: "顯示你所有角色的動態",
  momentPublishPublic: "發布至社群（公開）",
  feedTabMine: "我的動態",
  feedTabCommunity: "社群",
  feedTabFriends: "好友",
  feedPublicHint: "來自所有使用者的公開動態",
  friendsFeedHint: "僅互相接受好友邀請後可見的動態。",
  friendsFeedEmpty: "尚無好友動態。先加好友並請對方發布「好友可見」動態。",
  momentPublishFriends: "僅好友可見",
  friendsBtn: "好友",
  friendsDialogTitle: "好友",
  inviteCodeLabel: "我的邀請碼",
  copyInviteCode: "複製碼",
  copyInviteLink: "複製連結",
  inviteCodeCopied: "已複製邀請碼。",
  inviteLinkCopied: "已複製邀請連結。",
  inviteDeepLinkHint: "已帶入邀請碼，確認後送出好友邀請。",
  friendsIncomingTitle: "待接受邀請",
  friendsOutgoingTitle: "已送出邀請",
  friendsListTitle: "好友列表",
  addFriendByCode: "輸入對方的邀請碼",
  searchFriendsLabel: "搜尋好友",
  searchFriendsPlaceholder: "暱稱或邀請碼",
  searchFriendsBtn: "搜尋",
  searchFriendsEmpty: "找不到符合的使用者。",
  searchFriendsMinLength: "請至少輸入 2 個字元。",
  sendFriendRequestTo: "邀請",
  displayNameLabel: "我的暱稱",
  displayNameSaved: "暱稱已更新。",
  invalidDisplayName: "暱稱需為 2–32 個字元。",
  inviteCodeNotFound: "找不到此邀請碼。",
  friendRequestsEmpty: "目前沒有待處理邀請。",
  friendsClose: "關閉",
  friendRequestSent: "已送出好友邀請。",
  friendAccepted: "已成為好友。",
  blockUser: "封鎖",
  blockUserConfirm: "封鎖後將解除好友關係，且無法再互動。確定？",
  blockedUsersTitle: "已封鎖",
  unblockUser: "解除封鎖",
  userBlocked: "已封鎖該使用者。",
  friendBlocked: "無法與此使用者互動（已封鎖）。",
  inviteQrAlt: "邀請 QR 碼",
  publicFeedEmpty: "社群尚無公開動態。",
  momentReport: "檢舉",
  momentReported: "已送出檢舉，感謝協助維護社群。",
  momentReportOwn: "無法檢舉自己的動態。",
  momentReportPick: "請選擇檢舉原因（輸入編號）：",
  momentReportReasonSpam: "垃圾訊息",
  momentReportReasonHarassment: "騷擾",
  momentReportReasonInappropriate: "不當內容",
  momentReportReasonOther: "其他",
  tierEntUnlimitedStamina: "無限體力",
  tierEntVoice: "語音訊息",
  tierEntMemory: "記憶 {n} 則",
  tierEntReply: "回覆上限 {n}",
  tierEntPremium: "Premium 專屬",
  tierEntCharacters: "角色上限 {n}",
  subscribePppHint:
    "PPP（{region}）：{lite} {litePrice} / {basic} {basicPrice} / {premium} {premiumPrice} {currency}",
  tierNameLite: "輕量",
  tierNameBasic: "基礎",
  tierNamePremium: "尊榮",
  tierNameFree: "免費",
  economyRulesTitle: "經濟規則",
};

const en: StringTable = {
  appTitle: "Huhu",
  inputPlaceholder: "Type a message…",
  send: "Send",
  modeSimple: "Simple",
  modeLong: "Long chat (-5 coins)",
  modeExciting: "Exciting (-10 coins)",
  dailyCheckin: "Daily check-in",
  offerwall: "Watch ad for coins",
  subscribe: "Subscribe",
  exportChat: "Export chat",
  newCharacter: "New character",
  privacy: "Privacy",
  supportResources: "Support resources",
  openSupportPage: "Open support page",
  openPrivacyPolicy: "Open privacy policy",
  characterGuardCorrected: "Character-corrected reply (AI meta reply replaced)",
  playVoice: "▶ Play voice",
  voiceModeOn: "Voice on (3 stamina, {tier}+)",
  voiceModeOff: "Voice mode (3 stamina, {tier}+)",
  stamina: "Stamina",
  coins: "Huhu Coins",
  plan: "Plan",
  subscriptionExpired: "(subscription expired)",
  daysRemaining: "({days} days left)",
  ageTitle: "Age confirmation",
  ageBody:
    "Huhu is for users 18+. Enter your birth year to continue (no ID upload).",
  birthYear: "Birth year",
  ageConfirm: "I confirm I am 18 or older",
  createCharacter: "Create character",
  cancel: "Cancel",
  confirm: "Confirm",
  create: "Create",
  settings: "Settings",
  typing: "Typing…",
  switchCharacter: "Switch character",
  connectionFailed: "Connection failed",
  save: "Save",
  apiBaseUrl: "API base URL",
  localeLabel: "UI language",
  selectCharacter: "Select character",
  privacyData: "Privacy & data",
  officialPreset: "Official preset",
  customPreset: "Custom",
  chatLocale: "Chat language",
  name: "Name",
  personality: "Personality",
  backstory: "Backstory",
  speakingStyle: "Speaking style",
  creating: "Creating…",
  createAndSwitch: "Create & switch",
  createFailed: "Create failed",
  dailyCheckinReward: "Check-in +{coins} coins",
  checkinFailed: "Check-in failed",
  subscribeFailed: "Subscribe failed",
  restorePurchases: "Restore purchases",
  restorePurchasesDone: "Restored {count} subscription(s)",
  restorePurchasesNone: "No subscriptions to restore",
  restorePurchasesFailed: "Restore failed",
  exportSuccess: "Exported {chars} chars",
  exportFailed: "Export failed",
  devSubscribe: "Subscribe (dev verify)",
  saveApiHint: "Saved. Restart the app.",
  saving: "Saving…",
  offerwallReward: "Earned {coins} coins",
  chatPrivacyDismiss: "Got it",
  privacyIntro:
    "Control your data: reset relationship, review or delete individual RAG memories, clear all memories, or delete account.",
  resetRelationshipTitle: "Reset affection",
  resetRelationshipMsg: "Restore affection and relationship stage to default.",
  resetRelationshipBtn: "Reset relationship",
  clearRagTitle: "Clear long-term memory",
  clearRagMsg: "Remove RAG vectors; chat history stays.",
  clearRagBtn: "Clear RAG memory",
  clearMessagesTitle: "Clear chat history",
  clearMessagesMsg: "Delete all messages for this character.",
  clearMessagesBtn: "Clear messages",
  deleteAccountTitle: "Delete account data",
  deleteAccountMsg: "Deletes all characters, chats, and memories. Cannot undo.",
  deleteAccountBtn: "Delete all account data",
  actionDone: "{action} done",
  actionFailed: "Failed",
  privacyPrompt: "Privacy: 1=reset 2=memory 3=account 4=messages",
  privacyResetDone: "Affection reset.",
  privacyMemoryDone: "Long-term memory cleared.",
  memoryFragmentsTitle: "Memory fragments",
  memoryFragmentsEmpty: "No indexed memory fragments yet.",
  memoryDeleteBtn: "Delete fragment",
  memoryDeleteConfirm: "Delete this long-term memory? Chat history stays.",
  memoryDeleteDone: "Memory fragment deleted.",
  privacyMessagesDone: "Chat history cleared.",
  privacyAccountConfirm: "Delete all account data?",
  privacyMessagesConfirm: "Clear all messages for this character?",
  deleteMessageBtn: "Delete",
  deleteMessageConfirm: "Delete this message?",
  subscribedTier: "Subscribed {tier} (+{coins} coins)",
  coinsPurchased: "Purchased +{amount} coins (balance {total})",
  exportDone: "Web novel Markdown exported.",
  newCharacterReady: "New character ready. Say hi!",
  connectionFailedMsg: "Connection failed: {message}",
  defaultGreeting: "Hi, I'm {name}. How's your day?",
  subscribePrompt: "Plan: Lite / Basic / Premium",
  subscribePromptPrefix: "Plan: ",
  personalityPlaceholder: "gentle, tsundere…",
  speakingPlaceholder: "casual, cute…",
  holdToRecord: "Voice mode: hold mic to record, release to send",
  voiceRequiresBasic: "Voice messages require {tier}+ subscription",
  insufficientStamina: "Not enough stamina — wait to recover or upgrade",
  insufficientCoins: "Not enough Huhu Coins",
  characterLimitReached: "Character limit reached — upgrade your plan",
  characterNotFound: "Character not found — a new companion was created for you",
  ageConfirmationRequired: "Please confirm your age first",
  contentRequired: "Message content is required",
  validationFailed: "Invalid request — check your input and try again",
  rateLimited: "Too many requests — try again later",
  recording: "(voice message)",
  micDenied: "Microphone access denied.",
  diary: "Diary",
  diaryTitle: "Diary title (optional)",
  diaryBody: "What do you want to remember today?",
  diarySaved: "Diary saved and indexed to memory.",
  diaryEmpty: "Diary body cannot be empty.",
  diaryEdit: "Edit",
  diaryDelete: "Delete",
  diaryListEmpty: "No diary entries yet. Add one below.",
  attachPhoto: "Send photo",
  photoTooLarge: "Image must be under 2MB.",
  photoCaption: "Photo caption (optional)",
  moments: "Moments",
  momentBody: "Share this moment…",
  momentSaved: "Moment posted and saved to memory.",
  momentEmpty: "Moment text cannot be empty.",
  momentDelete: "Delete",
  momentsListEmpty: "No moments yet. Post one below.",
  momentPhoto: "Attach photo",
  feedMomentsHint: "Moments from all your characters",
  momentPublishPublic: "Publish to community (public)",
  feedTabMine: "My moments",
  feedTabCommunity: "Community",
  feedTabFriends: "Friends",
  feedPublicHint: "Public moments from all users",
  friendsFeedHint: "Moments visible only to accepted friends.",
  friendsFeedEmpty: "No friend moments yet. Add friends and ask them to post.",
  momentPublishFriends: "Friends only",
  friendsBtn: "Friends",
  friendsDialogTitle: "Friends",
  inviteCodeLabel: "My invite code",
  copyInviteCode: "Copy code",
  copyInviteLink: "Copy link",
  inviteCodeCopied: "Invite code copied.",
  inviteLinkCopied: "Invite link copied.",
  inviteDeepLinkHint: "Invite code loaded — send a friend request when ready.",
  friendsIncomingTitle: "Incoming requests",
  friendsOutgoingTitle: "Sent requests",
  friendsListTitle: "Friends",
  addFriendByCode: "Enter their invite code",
  searchFriendsLabel: "Find friends",
  searchFriendsPlaceholder: "Nickname or invite code",
  searchFriendsBtn: "Search",
  searchFriendsEmpty: "No matching users found.",
  searchFriendsMinLength: "Enter at least 2 characters.",
  sendFriendRequestTo: "Invite",
  displayNameLabel: "My nickname",
  displayNameSaved: "Nickname updated.",
  invalidDisplayName: "Nickname must be 2–32 characters.",
  inviteCodeNotFound: "Invite code not found.",
  friendRequestsEmpty: "No pending requests.",
  friendsClose: "Close",
  friendRequestSent: "Friend request sent.",
  friendAccepted: "You are now friends.",
  blockUser: "Block",
  blockUserConfirm:
    "Blocking removes friendship and prevents further interaction. Continue?",
  blockedUsersTitle: "Blocked",
  unblockUser: "Unblock",
  userBlocked: "User blocked.",
  friendBlocked: "Cannot interact with this user (blocked).",
  inviteQrAlt: "Invite QR code",
  publicFeedEmpty: "No public community moments yet.",
  momentReport: "Report",
  momentReported: "Report submitted. Thanks for helping the community.",
  momentReportOwn: "You cannot report your own moment.",
  momentReportPick: "Choose a report reason (enter number):",
  momentReportReasonSpam: "Spam",
  momentReportReasonHarassment: "Harassment",
  momentReportReasonInappropriate: "Inappropriate content",
  momentReportReasonOther: "Other",
  tierEntUnlimitedStamina: "Unlimited stamina",
  tierEntVoice: "Voice messages",
  tierEntMemory: "Memory {n}",
  tierEntReply: "Reply up to {n}",
  tierEntPremium: "Premium content",
  tierEntCharacters: "Characters {n}",
  subscribePppHint:
    "PPP ({region}): {lite} {litePrice} / {basic} {basicPrice} / {premium} {premiumPrice} {currency}",
  tierNameLite: "Lite",
  tierNameBasic: "Basic",
  tierNamePremium: "Premium",
  tierNameFree: "Free",
  economyRulesTitle: "Economy rules",
};

const ja: StringTable = {
  ...en,
  appTitle: "Huhu",
  inputPlaceholder: "メッセージを入力…",
  send: "送信",
  modeSimple: "シンプル",
  modeLong: "長文 (-5コイン)",
  modeExciting: "ドキドキ (-10コイン)",
  dailyCheckin: "デイリーボーナス",
  offerwall: "広告でコイン",
  subscribe: "サブスク",
  exportChat: "会話をエクスポート",
  newCharacter: "新しいキャラ",
  privacy: "プライバシー",
  supportResources: "サポート",
  openSupportPage: "サポートページを開く",
  openPrivacyPolicy: "プライバシーポリシーを開く",
  characterGuardCorrected: "キャラ修正返信（AIメタ返信を置換）",
  playVoice: "▶ 音声再生",
  stamina: "スタミナ",
  coins: "Huhuコイン",
  plan: "プラン",
  tierEntUnlimitedStamina: "スタミナ無制限",
  tierEntVoice: "音声メッセージ",
  tierEntMemory: "記憶 {n}",
  tierEntReply: "返信上限 {n}",
  tierEntPremium: "プレミアム",
  tierEntCharacters: "キャラ上限 {n}",
  subscribePppHint:
    "PPP（{region}）：{lite} {litePrice} / {basic} {basicPrice} / {premium} {premiumPrice} {currency}",
  tierNameLite: "ライト",
  tierNameBasic: "ベーシック",
  tierNamePremium: "プレミアム",
  tierNameFree: "無料",
  subscribePrompt: "プラン：ライト / ベーシック / プレミアム",
  subscribePromptPrefix: "プラン：",
  voiceModeOn: "音声オン（スタミナ3、{tier}+）",
  voiceModeOff: "音声（スタミナ3、{tier}+）",
  settings: "設定",
  typing: "入力中…",
  switchCharacter: "キャラ切替",
  connectionFailed: "接続失敗",
  save: "保存",
  apiBaseUrl: "API URL",
  localeLabel: "表示言語",
  selectCharacter: "キャラ選択",
  privacyData: "プライバシー",
  memoryFragmentsTitle: "長期記憶",
  memoryFragmentsEmpty: "インデックスされた記憶はまだありません。",
  memoryDeleteBtn: "削除",
  memoryDeleteConfirm:
    "この長期記憶を削除しますか？チャット履歴は残ります。",
  memoryDeleteDone: "記憶を削除しました。",
  voiceRequiresBasic: "音声メッセージは{tier}以上のサブスクが必要です",
  insufficientStamina:
    "スタミナが足りません。回復を待つかプランをアップグレードしてください",
  insufficientCoins: "Huhuコインが足りません",
  characterLimitReached:
    "キャラクター数の上限に達しました。プランをアップグレードしてください",
  characterNotFound: "キャラクターが見つかりません。新しいキャラクターを作成しました",
  ageConfirmationRequired: "チャットの前に年齢確認を完了してください",
  contentRequired: "メッセージ内容を入力してください",
  validationFailed: "リクエスト形式が正しくありません。確認して再試行してください",
  rateLimited: "操作が多すぎます。しばらくしてからお試しください",
};

const ko: StringTable = {
  ...en,
  appTitle: "Huhu",
  inputPlaceholder: "메시지 입력…",
  send: "보내기",
  modeSimple: "심플",
  modeLong: "긴 대화 (-5코인)",
  modeExciting: "설렘 (-10코인)",
  dailyCheckin: "출석",
  offerwall: "광고 보상",
  subscribe: "구독",
  exportChat: "대화보내기",
  newCharacter: "새 캐릭터",
  privacy: "개인정보",
  supportResources: "지원 안내",
  openSupportPage: "지원 페이지 열기",
  openPrivacyPolicy: "개인정보 처리방침 열기",
  characterGuardCorrected: "캐릭터 수정 응답(AI 메타 응답 대체됨)",
  playVoice: "▶ 음성 재생",
  stamina: "스태미나",
  coins: "Huhu 코인",
  plan: "요금제",
  settings: "설정",
  typing: "입력 중…",
  switchCharacter: "캐릭터 변경",
  connectionFailed: "연결 실패",
  save: "저장",
  apiBaseUrl: "API 주소",
  localeLabel: "UI 언어",
  selectCharacter: "캐릭터 선택",
  privacyData: "개인정보",
  memoryFragmentsTitle: "장기 기억",
  memoryFragmentsEmpty: "인덱싱된 기억 조각이 없습니다.",
  memoryDeleteBtn: "삭제",
  memoryDeleteConfirm:
    "이 장기 기억을 삭제할까요? 채팅 기록은 유지됩니다.",
  memoryDeleteDone: "기억 조각을 삭제했습니다.",
  tierEntUnlimitedStamina: "스태미나 무제한",
  tierEntVoice: "음성 메시지",
  tierEntMemory: "기억 {n}",
  tierEntReply: "답변 상한 {n}",
  tierEntPremium: "프리미엄",
  tierEntCharacters: "캐릭터 {n}개",
  subscribePppHint:
    "PPP({region}): {lite} {litePrice} / {basic} {basicPrice} / {premium} {premiumPrice} {currency}",
  tierNameLite: "라이트",
  tierNameBasic: "베이직",
  tierNamePremium: "프리미엄",
  tierNameFree: "무료",
  subscribePrompt: "요금제: 라이트 / 베이직 / 프리미엄",
  subscribePromptPrefix: "요금제: ",
  voiceModeOn: "음성 켜짐 (스태미나 3, {tier}+)",
  voiceModeOff: "음성 (스태미나 3, {tier}+)",
  voiceRequiresBasic: "음성 메시지는 {tier} 이상 구독이 필요합니다",
  insufficientStamina:
    "스태미나가 부족합니다. 회복을 기다리거나 요금제를 업그레이드하세요",
  insufficientCoins: "Huhu 코인이 부족합니다",
  characterLimitReached:
    "캐릭터 수 한도에 도달했습니다. 요금제를 업그레이드하세요",
  characterNotFound: "캐릭터를 찾을 수 없습니다. 새 캐릭터를 만들었습니다",
  ageConfirmationRequired: "채팅 전에 연령 확인을 완료해 주세요",
  contentRequired: "메시지 내용을 입력해 주세요",
  validationFailed: "요청 형식이 올바르지 않습니다. 확인 후 다시 시도하세요",
  rateLimited: "요청이 너무 많습니다. 잠시 후 다시 시도하세요",
};

const zhCN: StringTable = {
  ...zhTW,
  inputPlaceholder: "输入消息…",
  modeLong: "长对话 (-5币)",
  modeExciting: "心动 (-10币)",
  offerwall: "看广告领币",
  exportChat: "导出对话",
  ageBody:
    "呼呼 Huhu 仅供年满 18 岁用户。请输入出生年份以继续（无需上传证件）。",
  tierNameLite: "轻量",
  tierNameBasic: "基础",
  tierNamePremium: "尊荣",
  tierNameFree: "免费",
  subscribePrompt: "订阅方案：轻量 / 基础 / 尊荣",
  subscribePromptPrefix: "订阅方案：",
};

const vi: StringTable = {
  ...en,
  appTitle: "Huhu",
  inputPlaceholder: "Nhập tin nhắn…",
  send: "Gửi",
  modeSimple: "Đơn giản",
  modeLong: "Trò chuyện dài (-5 xu)",
  modeExciting: "Lãng mạn (-10 xu)",
  dailyCheckin: "Điểm danh",
  offerwall: "Xem quảng cáo",
  subscribe: "Đăng ký",
  exportChat: "Xuất hội thoại",
  newCharacter: "Nhân vật mới",
  privacy: "Quyền riêng tư",
  supportResources: "Hỗ trợ",
  openSupportPage: "Mở trang hỗ trợ",
  openPrivacyPolicy: "Mở chính sách quyền riêng tư",
  characterGuardCorrected: "Phản hồi đã chỉnh (thay thế lời AI meta)",
  playVoice: "▶ Phát giọng",
  voiceModeOn: "Giọng: bật (3 thể lực, cần {tier}+)",
  voiceModeOff: "Giọng (3 thể lực, cần {tier}+)",
  stamina: "Thể lực",
  coins: "Xu Huhu",
  plan: "Gói",
  subscriptionExpired: "(đã hết hạn)",
  daysRemaining: "(còn {days} ngày)",
  ageTitle: "Xác nhận tuổi",
  ageBody:
    "Huhu dành cho người từ 18 tuổi. Nhập năm sinh để tiếp tục (không cần giấy tờ).",
  birthYear: "Năm sinh",
  ageConfirm: "Tôi đủ 18 tuổi trở lên",
  createCharacter: "Tạo nhân vật",
  cancel: "Hủy",
  confirm: "Xác nhận",
  create: "Tạo",
  settings: "Cài đặt",
  typing: "Đang nhập…",
  switchCharacter: "Đổi nhân vật",
  connectionFailed: "Kết nối thất bại",
  save: "Lưu",
  apiBaseUrl: "URL API",
  localeLabel: "Ngôn ngữ giao diện",
  selectCharacter: "Chọn nhân vật",
  privacyData: "Dữ liệu & quyền riêng tư",
  officialPreset: "Mẫu chính thức",
  customPreset: "Tùy chỉnh",
  chatLocale: "Ngôn ngữ trò chuyện",
  name: "Tên",
  personality: "Tính cách",
  backstory: "Tiểu sử",
  speakingStyle: "Giọng nói",
  creating: "Đang tạo…",
  createAndSwitch: "Tạo & chuyển",
  createFailed: "Tạo thất bại",
  dailyCheckinReward: "Điểm danh +{coins} xu",
  checkinFailed: "Điểm danh thất bại",
  subscribeFailed: "Đăng ký thất bại",
  restorePurchases: "Khôi phục giao dịch",
  restorePurchasesDone: "Đã khôi phục {count} gói đăng ký",
  restorePurchasesNone: "Không có gói đăng ký để khôi phục",
  restorePurchasesFailed: "Khôi phục thất bại",
  exportSuccess: "Đã xuất {chars} ký tự",
  exportFailed: "Xuất thất bại",
  devSubscribe: "Đăng ký (dev)",
  saveApiHint: "Đã lưu. Khởi động lại app.",
  saving: "Đang lưu…",
  offerwallReward: "Nhận {coins} xu",
  chatPrivacyDismiss: "Đã hiểu",
  privacyIntro:
    "Quản lý dữ liệu: đặt lại quan hệ, xóa bộ nhớ RAG hoặc xóa tài khoản.",
  resetRelationshipTitle: "Đặt lại thiện cảm",
  resetRelationshipMsg: "Khôi phục thiện cảm và giai đoạn quan hệ mặc định.",
  resetRelationshipBtn: "Đặt lại quan hệ",
  clearRagTitle: "Xóa bộ nhớ dài hạn",
  clearRagMsg: "Xóa vector RAG; lịch sử chat giữ nguyên.",
  clearRagBtn: "Xóa bộ nhớ RAG",
  clearMessagesTitle: "Xóa lịch sử chat",
  clearMessagesMsg: "Xóa mọi tin nhắn của nhân vật này.",
  clearMessagesBtn: "Xóa tin nhắn",
  deleteAccountTitle: "Xóa dữ liệu tài khoản",
  deleteAccountMsg: "Xóa nhân vật, chat và bộ nhớ. Không hoàn tác.",
  deleteAccountBtn: "Xóa toàn bộ dữ liệu",
  actionDone: "{action} xong",
  actionFailed: "Thất bại",
  defaultGreeting: "Xin chào, mình là {name}. Hôm nay thế nào?",
  subscribePrompt: "Gói: Lite / Basic / Premium",
  subscribePromptPrefix: "Gói: ",
  diary: "Nhật ký",
  diarySaved: "Đã lưu nhật ký vào bộ nhớ.",
  diaryEmpty: "Nội dung nhật ký không được trống.",
  moments: "Khoảnh khắc",
  momentSaved: "Đã đăng khoảnh khắc.",
  momentEmpty: "Nội dung không được trống.",
  feedTabMine: "Của tôi",
  feedTabCommunity: "Cộng đồng",
  feedTabFriends: "Bạn bè",
  friendsBtn: "Bạn bè",
  friendsDialogTitle: "Bạn bè",
  inviteCodeLabel: "Mã mời của tôi",
  copyInviteCode: "Sao chép mã",
  copyInviteLink: "Sao chép liên kết",
  inviteCodeCopied: "Đã sao chép mã mời.",
  inviteLinkCopied: "Đã sao chép liên kết.",
  searchFriendsLabel: "Tìm bạn",
  searchFriendsPlaceholder: "Biệt danh hoặc mã mời",
  searchFriendsBtn: "Tìm",
  searchFriendsEmpty: "Không tìm thấy người dùng.",
  searchFriendsMinLength: "Nhập ít nhất 2 ký tự.",
  displayNameLabel: "Biệt danh",
  displayNameSaved: "Đã cập nhật biệt danh.",
  invalidDisplayName: "Biệt danh 2–32 ký tự.",
  blockUser: "Chặn",
  blockUserConfirm: "Chặn sẽ gỡ kết bạn và ngăn tương tác. Tiếp tục?",
  blockedUsersTitle: "Đã chặn",
  unblockUser: "Bỏ chặn",
  userBlocked: "Đã chặn người dùng.",
  friendBlocked: "Không thể tương tác (đã chặn).",
  inviteQrAlt: "Mã QR mời",
  momentReportReasonSpam: "Spam",
  momentReportReasonHarassment: "Quấy rối",
  momentReportReasonInappropriate: "Nội dung không phù hợp",
  momentReportReasonOther: "Khác",
  tierEntUnlimitedStamina: "Thể lực không giới hạn",
  tierEntVoice: "Tin nhắn thoại",
  tierEntMemory: "Bộ nhớ {n}",
  tierEntReply: "Trả lời tối đa {n}",
  tierEntPremium: "Nội dung Premium",
  tierEntCharacters: "Giới hạn {n} nhân vật",
  subscribePppHint:
    "PPP ({region}): {lite} {litePrice} / {basic} {basicPrice} / {premium} {premiumPrice} {currency}",
  tierNameLite: "Lite",
  tierNameBasic: "Basic",
  tierNamePremium: "Premium",
  tierNameFree: "Miễn phí",
  economyRulesTitle: "Quy tắc kinh tế",
  memoryFragmentsTitle: "Mảnh nhớ dài hạn",
  memoryFragmentsEmpty: "Chưa có mảnh nhớ được lập chỉ mục.",
  memoryDeleteBtn: "Xóa mảnh",
  memoryDeleteConfirm:
    "Xóa ký ức dài hạn này? Lịch sử chat vẫn giữ nguyên.",
  memoryDeleteDone: "Đã xóa mảnh nhớ.",
  voiceRequiresBasic: "Tin nhắn thoại cần gói {tier} trở lên",
  insufficientStamina: "Không đủ thể lực — chờ hồi hoặc nâng cấp gói",
  insufficientCoins: "Không đủ xu Huhu",
  characterLimitReached: "Đã đạt giới hạn nhân vật",
  characterNotFound: "Không tìm thấy nhân vật — đã tạo nhân vật mới",
  ageConfirmationRequired: "Cần xác nhận đủ 18 tuổi trước khi trò chuyện",
  contentRequired: "Vui lòng nhập nội dung tin nhắn",
  validationFailed: "Yêu cầu không hợp lệ — kiểm tra và thử lại",
  rateLimited: "Quá nhiều yêu cầu — thử lại sau",
};

const TABLES: Record<SupportedLocaleId, StringTable> = {
  "zh-TW": zhTW,
  "zh-CN": zhCN,
  "ja-JP": ja,
  "ko-KR": ko,
  en,
  "vi-VN": vi,
};

export function getUiStrings(locale: string): StringTable {
  const id = locale in TABLES ? (locale as SupportedLocaleId) : "zh-TW";
  return TABLES[id];
}

export function tUi(
  locale: string,
  key: UiStringKey,
  vars?: Record<string, string | number>,
): string {
  let text = getUiStrings(locale)[key] ?? getUiStrings("zh-TW")[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}
