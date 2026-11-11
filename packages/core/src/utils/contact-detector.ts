/**
 * Contact Information & PII Detector
 * Prevents off-platform communication (emails, phone numbers, social handles, external links).
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,5}\)?[-.\s]?\d{3,5}[-.\s]?\d{3,5}/g;

const FORBIDDEN_KEYWORDS = [
  "whatsapp",
  "telegram",
  "t.me",
  "wa.me",
  "skype",
  "discord",
  "instagram",
  "facebook",
  "twitter",
  "x.com",
  "linkedin",
  "snapchat",
  "wechat",
  "signal",
  "gmail",
  "yahoo",
  "hotmail",
  "outlook",
  "protonmail",
  "phone number",
  "call me at",
  "text me at",
  "contact me at",
  "email me at",
  "my email",
  "my phone",
  "my whatsapp",
  "my telegram",
];

export interface PIICheckResult {
  hasPII: boolean;
  reason?: string;
  detectedText?: string;
}

export function detectContactInfo(text: string): PIICheckResult {
  if (!text) return { hasPII: false };

  // 1. Check Email Addresses
  const emailMatches = text.match(EMAIL_REGEX);
  if (emailMatches && emailMatches.length > 0) {
    return {
      hasPII: true,
      reason: "Email addresses are not allowed in messages.",
      detectedText: emailMatches[0],
    };
  }

  // 2. Check Phone Numbers (digits of length 7 or more with separators)
  const cleanDigitsOnly = text.replace(/[^0-9]/g, "");
  if (cleanDigitsOnly.length >= 7) {
    const phoneMatches = text.match(PHONE_REGEX);
    if (phoneMatches && phoneMatches.some((m) => m.replace(/[^0-9]/g, "").length >= 7)) {
      return {
        hasPII: true,
        reason: "Phone numbers are not allowed in messages.",
        detectedText: phoneMatches[0],
      };
    }
  }

  // 3. Check Forbidden Keywords & External Handles
  const lowerText = text.toLowerCase();
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (lowerText.includes(keyword)) {
      return {
        hasPII: true,
        reason: `Sharing external contact details ("${keyword}") is not allowed.`,
        detectedText: keyword,
      };
    }
  }

  return { hasPII: false };
}
