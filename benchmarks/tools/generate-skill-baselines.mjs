import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

function value(name, fallback) {
  const prefix = `--${name}=`;
  const found = process.argv.slice(2).find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : fallback;
}

const model = value('model', 'gpt-5.6-sol');
const outputPrefix = value('output-prefix', 'skill-baseline.sol');
const selected = new Set(value('cases', '').split(',').filter(Boolean));
const root = resolve(import.meta.dirname, '..', '..');
const casesRoot = join(root, 'benchmarks', 'cases');
const skillRoot = join(root, 'hachi-readable-writing');
const codexCommand = process.platform === 'win32' ? process.execPath : 'codex';
const codexPrefixArgs = process.platform === 'win32'
  ? [join(process.env.APPDATA, 'npm', 'node_modules', '@openai', 'codex', 'bin', 'codex.js')]
  : [];

const skill = readFileSync(join(skillRoot, 'SKILL.md'), 'utf8');
const language = readFileSync(join(skillRoot, 'references', 'language-and-model.md'), 'utf8');
const documentTypes = readFileSync(join(skillRoot, 'references', 'document-types.md'), 'utf8');
const caseDirs = readdirSync(casesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => selected.size === 0 || selected.has(name))
  .sort();

const tempRoot = mkdtempSync(join(tmpdir(), 'hachi-writing-skill-'));
let completed = 0;

try {
  for (const caseName of caseDirs) {
    for (const lang of ['en', 'ja']) {
      const promptPath = join(casesRoot, caseName, `natural-prompt.${lang}.md`);
      const outputPath = join(casesRoot, caseName, `${outputPrefix}.${lang}.md`);
      const request = readFileSync(promptPath, 'utf8');
      const workdir = join(tempRoot, `${caseName}-${lang}`);
      mkdirSync(workdir);
      const input = [
        'Follow the skill instructions below. Produce only the finished document requested by the user.',
        'Do not describe the skill, your process, the workspace, or file creation.',
        '',
        '--- SKILL.md ---', skill,
        '',
        '--- references/language-and-model.md ---', language,
        '',
        '--- references/document-types.md ---', documentTypes,
        '',
        '--- USER REQUEST ---', request,
      ].join('\n');

      const args = [
        'exec', '--ephemeral', '--ignore-user-config', '--ignore-rules',
        '--skip-git-repo-check', '--sandbox', 'read-only',
        '--model', model,
        '-c', 'model_reasoning_effort="high"',
        '-c', 'personality="pragmatic"',
        '--cd', workdir,
        '--output-last-message', outputPath,
        '-',
      ];

      const result = spawnSync(codexCommand, [...codexPrefixArgs, ...args], {
        input,
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        timeout: 30 * 60 * 1000,
        windowsHide: true,
      });

      if (result.status !== 0) {
        const detail = (result.stderr || result.error?.message || 'unknown error').slice(-4000);
        throw new Error(`${caseName} ${lang} failed: ${detail}`);
      }

      completed += 1;
      process.stdout.write(`[${completed}/${caseDirs.length * 2}] ${basename(caseName)} ${lang}\n`);
    }
  }
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
