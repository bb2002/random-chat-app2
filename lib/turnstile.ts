const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY || '';
const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

interface TurnstileVerifyResult {
  success: boolean;
  'error-codes'?: string[];
}

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) {
    console.warn('TURNSTILE_SECRET_KEY not set, skipping verification');
    return true;
  }

  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret: TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });

  const result: TurnstileVerifyResult = await response.json();
  return result.success;
}
