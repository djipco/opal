import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
const htmlFiles = [];
const htmlCache = new Map();

async function htmlAt(file) {
  if (!htmlCache.has(file)) htmlCache.set(file, await readFile(file, 'utf8'));
  return htmlCache.get(file);
}

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(target);
    else if (entry.name.endsWith('.html')) htmlFiles.push(target);
  }
}

await walk(output);
const missing = [];
for (const file of htmlFiles) {
  const html = await htmlAt(file);
  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
    const reference = match[1];
    if (/^(?:https?:|mailto:|data:)/.test(reference)) continue;
    const [location, fragment] = reference.split('#', 2);
    const clean = location.split('?')[0];
    let target = clean ? path.resolve(path.dirname(file), clean) : file;
    if (clean.endsWith('/')) target = path.join(target, 'index.html');
    try { await access(target); }
    catch { missing.push(`${path.relative(output, file)} → ${reference}`); }
    if (fragment && target.endsWith('.html')) {
      try {
        const targetHtml = await htmlAt(target);
        const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (!new RegExp(`\\bid=["']${escaped}["']`).test(targetHtml)) {
          missing.push(`${path.relative(output, file)} → missing #${fragment}`);
        }
      } catch {}
    }
  }
}

for (const required of [
  'index.html',
  'spec/index.html',
  'conformance/index.html',
  'compatibility/index.html',
  'libraries/index.html',
]) {
  try { await access(path.join(output, required)); }
  catch { missing.push(required); }
}

if (missing.length) throw new Error(`Missing site targets:\n${missing.join('\n')}`);
console.log(`Validated ${htmlFiles.length} HTML pages and all local asset references`);
