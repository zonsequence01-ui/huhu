/** Basic PII scrubbing before external LLM calls */

const PATTERNS: { regex: RegExp; replacement: string }[] = [
  {
    regex: /\b[\w.-]+@[\w.-]+\.\w{2,}\b/gi,
    replacement: "[EMAIL]",
  },
  {
    regex: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g,
    replacement: "[PHONE]",
  },
  {
    regex:
      /(?:\d{1,5}\s*)?[\u4e00-\u9fff]{2,}(?:市|省|县|縣|区|區)[\u4e00-\u9fff]*(?:路|街|巷|弄)[\u4e00-\u9fff\d段\s]*\d*號/g,
    replacement: "[ADDRESS]",
  },
];

export function scrubPii(text: string): string {
  let result = text;
  for (const { regex, replacement } of PATTERNS) {
    result = result.replace(regex, replacement);
  }
  return result;
}
