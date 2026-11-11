const EMOJI_RE =
  /[\u{1F300}-\u{1F9FF}\u{1FA00}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F1FF}\u{1F200}-\u{1F2FF}\u{200D}\u{20E3}]/gu;

export function containsEmoji(text: string): boolean {
  EMOJI_RE.lastIndex = 0;
  return EMOJI_RE.test(text);
}

export function stripEmoji(text: string): string {
  EMOJI_RE.lastIndex = 0;
  return text.replace(EMOJI_RE, "").replace(/\s{2,}/g, " ").trim();
}

export const TAG_REGEX = /^[A-Za-z]+$/;

export function isValidTag(tag: string): boolean {
  return TAG_REGEX.test(tag.trim());
}

export function findInvalidTag(tags: string[]): string | null {
  return tags.find((t) => !isValidTag(t)) ?? null;
}
