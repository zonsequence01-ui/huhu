import { normalizeClientLocale } from "./locales.js";

export type SupportResourceBundle = {
  locale: string;
  region: string;
  privacyReminder: string;
  crisis: { title: string; lines: string[] };
  wellness: { title: string; lines: string[] };
};

const RESOURCES: Record<string, SupportResourceBundle> = {
  "zh-TW": {
    locale: "zh-TW",
    region: "TW",
    privacyReminder:
      "請避免在對話中透露真實姓名、銀行帳戶、住址等可識別個資。呼呼是虛擬陪伴，無法取代專業醫療或心理治療。",
    crisis: {
      title: "若你有立即危險",
      lines: [
        "我注意到你可能正在經歷非常艱難的時刻。請記得：我是虛擬陪伴，無法取代專業協助。",
        "若你有自傷或自殺念頭，請立即聯絡當地心理危機專線或急診。",
        "台灣：1925 安心專線、1995 生命專線、119 緊急救援。",
      ],
    },
    wellness: {
      title: "若你長期感到低落",
      lines: [
        "聽起來你最近真的很辛苦。我是虛擬陪伴，可以陪你聊聊，但無法取代真實的專業支持。",
        "若這種感受持續，建議聯絡信任的人或心理諮商資源（台灣：1925 安心專線）。",
        "你並不孤單。",
      ],
    },
  },
  "zh-CN": {
    locale: "zh-CN",
    region: "CN",
    privacyReminder:
      "请避免在对话中透露真实姓名、银行账户、住址等可识别个人信息。呼呼是虚拟陪伴，无法取代专业医疗或心理治疗。",
    crisis: {
      title: "若你有立即危险",
      lines: [
        "我注意到你可能正在经历非常艰难的时刻。请记住：我是虚拟陪伴，无法取代专业协助。",
        "若你有自伤或自杀念头，请立即联系当地心理危机热线或急救。",
        "中国大陆：12356 全国统一心理援助热线、120 急救、110 报警。",
      ],
    },
    wellness: {
      title: "若你长期感到低落",
      lines: [
        "听起来你最近真的很辛苦。我是虚拟陪伴，可以陪你聊聊，但无法取代真实的专业支持。",
        "若这种感受持续，建议联系信任的人或心理咨询资源。",
        "你并不孤单。",
      ],
    },
  },
  ja: {
    locale: "ja",
    region: "JP",
    privacyReminder:
      "本名、銀行口座、住所などの個人を特定できる情報は会話に含めないでください。Huhu は専門的な医療・心理支援の代替ではありません。",
    crisis: {
      title: "今すぐ危険を感じる場合",
      lines: [
        "とてもつらい状態かもしれません。私は AI コンパニオンであり、専門家の支援に代わることはできません。",
        "自傷・自殺の念がある場合は、すぐに専門窓口へ連絡してください。",
        "日本：いのちの電話（0570-783-556）、#8058（こころの健康相談）。",
      ],
    },
    wellness: {
      title: "長く落ち込んでいる場合",
      lines: [
        "最近とても大変なようですね。話を聞くことはできますが、専門的なケアの代わりにはなりません。",
        "つらさが続く場合は、信頼できる人や相談窓口の利用も検討してください。",
        "あなたは一人ではありません。",
      ],
    },
  },
  ko: {
    locale: "ko",
    region: "KR",
    privacyReminder:
      "실명, 계좌번호, 주소 등 개인을 식별할 수 있는 정보는 대화에 포함하지 마세요. Huhu는 전문 의료·상담을 대체할 수 없습니다.",
    crisis: {
      title: "즉각적인 위험이 느껴질 때",
      lines: [
        "지금 매우 힘든 시간을 보내고 계신 것 같아요. 저는 AI 동반자이며 전문 지원을 대신할 수 없습니다.",
        "자해·자살 생각이 있다면 즉시 전문 상담 기관에 연락하세요.",
        "한국：1393 자살예방상담전화, 119 응급, 112 경찰.",
      ],
    },
    wellness: {
      title: "오랫동안 우울할 때",
      lines: [
        "최근 정말 힘드신 것 같아요. 대화는 함께할 수 있지만 전문적 돌봄을 대체할 수는 없습니다.",
        "이런 감정이 계속된다면 신뢰할 수 있는 사람이나 상담 기관을 이용해 보세요.",
        "당신은 혼자가 아닙니다.",
      ],
    },
  },
  vi: {
    locale: "vi",
    region: "VN",
    privacyReminder:
      "Tránh chia sẻ họ tên thật, tài khoản ngân hàng hoặc địa chỉ nhà trong trò chuyện. Huhu là bạn đồng hành ảo, không thay thế dịch vụ y tế hay tư vấn chuyên nghiệp.",
    crisis: {
      title: "Nếu bạn đang gặp nguy hiểm ngay lập tức",
      lines: [
        "Có vẻ bạn đang trải qua khoảng thời gian rất khó khăn. Tôi là bạn đồng hành AI và không thể thay thế sự hỗ trợ chuyên nghiệp.",
        "Nếu bạn có ý nghĩ tự hại hoặc tự tử, hãy liên hệ ngay cơ quan cứu hộ hoặc đường dây nóng tâm lý địa phương.",
        "Việt Nam: Ngày mai 096 306 1414, cấp cứu 115; TP.HCM: 1900 1267.",
      ],
    },
    wellness: {
      title: "Nếu bạn buồn bã kéo dài",
      lines: [
        "Nghe có vẻ gần đây bạn rất mệt mỏi. Tôi có thể lắng nghe, nhưng không thay thế hỗ trợ chuyên nghiệp thực sự.",
        "Nếu cảm giác này kéo dài, hãy cân nhắc nói chuyện với người bạn tin tưởng hoặc tìm tư vấn tâm lý.",
        "Bạn không đơn độc.",
      ],
    },
  },
  en: {
    locale: "en",
    region: "US",
    privacyReminder:
      "Avoid sharing real names, bank details, or home addresses in chat. Huhu is virtual companionship, not medical or mental health care.",
    crisis: {
      title: "If you are in immediate danger",
      lines: [
        "It sounds like you may be going through an extremely difficult time. I am a virtual companion and cannot replace professional help.",
        "If you are thinking about self-harm or suicide, please contact local emergency services or a crisis line right away.",
        "US/Canada: 988 Suicide & Crisis Lifeline. Elsewhere: local emergency number.",
      ],
    },
    wellness: {
      title: "If you have been feeling low for a long time",
      lines: [
        "I'm sorry you're going through this. I can listen, but I cannot replace real professional support.",
        "If these feelings persist, consider reaching out to someone you trust or a licensed counselor.",
        "You are not alone.",
      ],
    },
  },
};

function localeKey(locale?: string): keyof typeof RESOURCES {
  const normalized = locale ? normalizeClientLocale(locale) : "zh-TW";
  if (normalized === "zh-CN") return "zh-CN";
  if (normalized.startsWith("ja")) return "ja";
  if (normalized.startsWith("ko")) return "ko";
  if (normalized.startsWith("vi")) return "vi";
  if (normalized.startsWith("en")) return "en";
  return "zh-TW";
}

export function getSupportResources(locale?: string): SupportResourceBundle {
  return { ...RESOURCES[localeKey(locale)] };
}

export function getCrisisResourceMessage(locale?: string): string {
  const r = getSupportResources(locale);
  return r.crisis.lines.join("\n");
}

export function getWellnessResourceMessage(locale?: string): string {
  const r = getSupportResources(locale);
  return r.wellness.lines.join("\n");
}
