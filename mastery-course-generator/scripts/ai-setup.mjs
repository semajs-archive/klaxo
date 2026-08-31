/**
 * Connect an AI provider, interactively.
 *
 * Run with `npm run ai:setup`.
 *
 * Two reasons this exists rather than "edit .env yourself":
 *
 * 1. The token is read without echoing and written straight to `.env`. It is
 *    never printed, never pasted into a chat, never in shell history.
 * 2. It REPLACES the keys rather than appending them. Appending leaves two
 *    copies of `FCC_SERVER_BASE_URL` in the file, and which one wins is a
 *    detail of the loader nobody should have to know.
 */
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env');
const examplePath = resolve(root, '.env.example');

const PROVIDERS = {
  1: {
    name: 'Cloudflare Workers AI (free daily allowance)',
    needsAccountId: true,
    baseUrl: (accountId) => `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`,
    model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    visionModel: '@cf/meta/llama-3.2-11b-vision-instruct',
    tokenHint: 'API token with the "Workers AI" permission',
  },
  2: {
    name: 'NVIDIA NIM',
    needsAccountId: false,
    baseUrl: () => 'https://integrate.api.nvidia.com/v1',
    model: 'nvidia/nemotron-3-super-120b-a12b',
    visionModel: 'meta/llama-3.2-90b-vision-instruct',
    tokenHint: 'NVIDIA API key',
  },
  3: {
    name: 'OpenAI',
    needsAccountId: false,
    baseUrl: () => 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    visionModel: 'gpt-4o-mini',
    tokenHint: 'OpenAI API key (this one is not free)',
  },
};

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (question) => new Promise((res) => rl.question(question, (a) => res(a.trim())));

/** Read without echoing, so the token never appears on screen. */
function askSecret(question) {
  return new Promise((res) => {
    process.stdout.write(question);
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    if (stdin.setRawMode) stdin.setRawMode(true);
    stdin.resume();

    let value = '';
    const ENTER = ['\n', '\r'];
    const CTRL_C = '\u0003';
    const BACKSPACE = ['\u0008', '\u007f'];

    const onData = (chunk) => {
      const char = chunk.toString('utf8');

      if (ENTER.includes(char)) {
        if (stdin.setRawMode) stdin.setRawMode(wasRaw ?? false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        res(value.trim());
        return;
      }

      if (char === CTRL_C) {
        if (stdin.setRawMode) stdin.setRawMode(wasRaw ?? false);
        process.stdout.write('\n');
        process.exit(1);
      }

      if (BACKSPACE.includes(char)) {
        value = value.slice(0, -1);
        return;
      }

      value += char;
    };
    stdin.on('data', onData);
  });
}

/** Set a key in the file, replacing any existing definition of it. */
function setKey(contents, key, value) {
  const line = `${key}="${value}"`;
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  return pattern.test(contents) ? contents.replace(pattern, line) : `${contents.trimEnd()}\n${line}\n`;
}

async function main() {
  if (!existsSync(envPath)) {
    if (!existsSync(examplePath)) {
      console.error('No .env and no .env.example to copy. Are you in the right directory?');
      process.exit(1);
    }
    copyFileSync(examplePath, envPath);
    console.log('Created .env from .env.example.\n');
  }

  console.log('Which provider?\n');
  for (const [key, provider] of Object.entries(PROVIDERS)) {
    console.log(`  ${key}. ${provider.name}`);
  }
  console.log('');

  const choice = await ask('Number [1]: ');
  const provider = PROVIDERS[choice || '1'];
  if (!provider) {
    console.error('Not one of the options.');
    process.exit(1);
  }

  let accountId = '';
  if (provider.needsAccountId) {
    accountId = await ask('Cloudflare Account ID: ');
    if (!accountId) {
      console.error('An account id is required for Cloudflare.');
      process.exit(1);
    }
  }

  const token = await askSecret(`${provider.tokenHint}: `);
  if (!token) {
    console.error('No token given; nothing changed.');
    process.exit(1);
  }

  let contents = readFileSync(envPath, 'utf8');
  contents = setKey(contents, 'FCC_SERVER_BASE_URL', provider.baseUrl(accountId));
  contents = setKey(contents, 'FCC_SERVER_API_KEY', token);
  contents = setKey(contents, 'NVIDIA_NIM_MODEL', provider.model);
  contents = setKey(contents, 'NVIDIA_NIM_VISION_MODEL', provider.visionModel);
  contents = setKey(contents, 'AI_DEV_MODE', 'false');
  writeFileSync(envPath, contents, { mode: 0o600 });

  console.log('\nWritten to .env (not committed — it is git-ignored).');
  console.log('Check it works:  npm run nim:probe');
  console.log('Then restart the dev server so it picks up the change.');
  rl.close();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
