/**
 * API: is a real AI connected?
 *
 * The app is perfectly usable with no provider configured — it answers from
 * fixtures — and that is exactly the danger: a course full of placeholder
 * lessons looks like a course. The UI needs to be able to say so plainly, so
 * this reports the state without ever exposing the credential itself.
 */
import { NextResponse } from 'next/server';
import { isRealAiEnabled, getEnv } from '@/lib/env';

export async function GET(): Promise<NextResponse> {
  const env = getEnv();

  return NextResponse.json({
    realAiEnabled: isRealAiEnabled(env),
    devMode: env.AI_DEV_MODE,
    hasCredential: Boolean(env.FCC_SERVER_API_KEY),
    model: env.NVIDIA_NIM_MODEL,
  });
}
