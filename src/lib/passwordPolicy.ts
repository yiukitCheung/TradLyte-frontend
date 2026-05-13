/**
 * Password policy aligned with OWASP ASVS L2 and Supabase server-side checks.
 *
 * Keep this purely client-side and side-effect free; the server-side policy in
 * Supabase Auth (Authentication → Policies → Password Settings) is the source
 * of truth. This module exists for instant UX feedback during signup/reset.
 */

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

export type PasswordRuleId =
  | "length"
  | "lowercase"
  | "uppercase"
  | "digit"
  | "special"
  | "no-email"
  | "no-name"
  | "max-length";

export interface PasswordRule {
  id: PasswordRuleId;
  label: string;
  ok: boolean;
}

export interface PasswordEvaluation {
  rules: PasswordRule[];
  failingRules: PasswordRule[];
  ok: boolean;
  /** 0..4 score for a progress meter (Very weak → Strong). */
  strengthScore: number;
  strengthLabel: "very-weak" | "weak" | "fair" | "good" | "strong";
}

interface EvaluateOptions {
  email?: string | null;
  fullName?: string | null;
}

const SPECIAL_CHAR_RE = /[^A-Za-z0-9]/;

function containsCaseInsensitive(haystack: string, needle: string): boolean {
  const needleTrimmed = needle.trim().toLowerCase();
  if (!needleTrimmed || needleTrimmed.length < 4) return false;
  return haystack.toLowerCase().includes(needleTrimmed);
}

function localPartOfEmail(email: string | null | undefined): string {
  if (!email) return "";
  const at = email.indexOf("@");
  if (at <= 0) return email.trim();
  return email.slice(0, at).trim();
}

export function evaluatePassword(
  password: string,
  options: EvaluateOptions = {},
): PasswordEvaluation {
  const pw = password ?? "";
  const emailLocal = localPartOfEmail(options.email);
  const fullName = (options.fullName ?? "").trim();

  const rules: PasswordRule[] = [
    {
      id: "length",
      label: `At least ${MIN_PASSWORD_LENGTH} characters`,
      ok: pw.length >= MIN_PASSWORD_LENGTH,
    },
    {
      id: "max-length",
      label: `No more than ${MAX_PASSWORD_LENGTH} characters`,
      ok: pw.length <= MAX_PASSWORD_LENGTH,
    },
    {
      id: "lowercase",
      label: "Includes a lowercase letter (a–z)",
      ok: /[a-z]/.test(pw),
    },
    {
      id: "uppercase",
      label: "Includes an uppercase letter (A–Z)",
      ok: /[A-Z]/.test(pw),
    },
    { id: "digit", label: "Includes a number (0–9)", ok: /\d/.test(pw) },
    {
      id: "special",
      label: "Includes a symbol (e.g. ! @ # $ % …)",
      ok: SPECIAL_CHAR_RE.test(pw),
    },
    {
      id: "no-email",
      label: "Does not contain your email",
      ok: !emailLocal || !containsCaseInsensitive(pw, emailLocal),
    },
    {
      id: "no-name",
      label: "Does not contain your name",
      ok: !fullName || !containsCaseInsensitive(pw, fullName),
    },
  ];

  const failingRules = rules.filter((r) => !r.ok);
  const ok = failingRules.length === 0;

  const baseScore =
    (pw.length >= MIN_PASSWORD_LENGTH ? 1 : 0) +
    (/[a-z]/.test(pw) && /[A-Z]/.test(pw) ? 1 : 0) +
    (/\d/.test(pw) ? 1 : 0) +
    (SPECIAL_CHAR_RE.test(pw) ? 1 : 0);
  const lengthBonus = pw.length >= 16 ? 1 : 0;
  const strengthScore = Math.min(4, Math.max(0, baseScore - 1 + lengthBonus));

  const strengthLabel: PasswordEvaluation["strengthLabel"] =
    strengthScore <= 0
      ? "very-weak"
      : strengthScore === 1
        ? "weak"
        : strengthScore === 2
          ? "fair"
          : strengthScore === 3
            ? "good"
            : "strong";

  return { rules, failingRules, ok, strengthScore, strengthLabel };
}

/** Convenience for forms: produces a short, human-friendly error or null. */
export function firstPasswordError(
  password: string,
  options?: EvaluateOptions,
): string | null {
  const { failingRules } = evaluatePassword(password, options);
  if (!failingRules.length) return null;
  return failingRules[0].label;
}
