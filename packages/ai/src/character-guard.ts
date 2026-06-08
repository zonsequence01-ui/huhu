const BREAK_PATTERNS = [
  /我是(一個)?(人工智慧|AI|語言模型|語言助理)/i,
  /作为(一个)?AI/i,
  /I am an? (AI|language model|assistant)/i,
  /I'm an? (AI|language model|assistant)/i,
  /人工知能|AIアシスタント|言語モデル/i,
  /저는\s*(AI|인공지능|언어\s*모델)/i,
  /tôi là (AI|trợ lý|mô hình ngôn ngữ)/i,
  /OpenAI|ChatGPT|Claude|Anthropic/i,
  /无法提供|不能提供|抱歉.*(政策|规定)/i,
  /申し訳.*(提供|でき)/i,
  /죄송.*(제공|할\s*수)/i,
];

export interface CharacterGuardResult {
  content: string;
  corrected: boolean;
}

function emptyFallback(characterName: string, locale?: string): string {
  if (locale?.startsWith("ja")) {
    return `（${characterName}が少し考え込む）…もう一度言ってくれる？`;
  }
  if (locale?.startsWith("ko")) {
    return `（${characterName}이 잠시 생각에 잠긴다）…다시 한번 말해줄래?`;
  }
  if (locale === "vi" || locale?.startsWith("vi")) {
    return `（${characterName} suy nghĩ một lúc）…nói lại giúp mình được không?`;
  }
  if (locale?.startsWith("en")) {
    return `(${characterName} pauses for a moment)… could you say that again?`;
  }
  return `（${characterName}似乎想了一下）…能再說一次嗎？`;
}

function breakFallback(characterName: string, locale?: string): string {
  if (locale?.startsWith("ja")) {
    return `（${characterName}がそっと手を握る）今、少しぼーっとしてた…もう一度聞かせて？`;
  }
  if (locale?.startsWith("ko")) {
    return `（${characterName}이 조용히 손을 잡는다）방금 잠깐 멍했어…다시 말해줄래?`;
  }
  if (locale === "vi" || locale?.startsWith("vi")) {
    return `（${characterName} nhẹ nhàng nắm tay bạn）Mình vừa hơi lơ đãng… nói lại được không?`;
  }
  if (locale?.startsWith("en")) {
    return `(${characterName} gently takes your hand) I got distracted for a moment… could you say that again?`;
  }
  return `（${characterName}輕輕握住你的手）剛才我有點走神…你剛才說的，我想再聽你說一次，好嗎？`;
}

/** Detect obvious out-of-character / assistant meta replies and soften with fallback. */
export function guardCharacterReply(
  content: string,
  characterName: string,
  locale?: string,
): CharacterGuardResult {
  const trimmed = content.trim();
  if (!trimmed) {
    return {
      content: emptyFallback(characterName, locale),
      corrected: true,
    };
  }
  for (const pattern of BREAK_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        content: breakFallback(characterName, locale),
        corrected: true,
      };
    }
  }
  return { content: trimmed, corrected: false };
}
