import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');

function slugify(value) {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&[^;]+;/g, ' ')
    .toLowerCase()
    .replace(/(?<=\d)\.(?=\d)/g, '')
    .replace(/[^a-z0-9_]+/g, '-')
    .replace(/^-|-$/g, '');
}

function addHeadingIds(html) {
  const used = new Map();
  return html.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, (_match, level, contents) => {
    const base = slugify(contents) || 'section';
    const count = used.get(base) || 0;
    used.set(base, count + 1);
    const id = count ? `${base}-${count + 1}` : base;
    return `<h${level} id="${id}">${contents}</h${level}>`;
  });
}

function navigation(prefix, active) {
  const items = [
    ['spec', 'Specification', `${prefix}spec/`],
    ['conformance', 'Conformance', `${prefix}conformance/`],
    ['libraries', 'Libraries', `${prefix}libraries/`],
  ];
  return items.map(([key, label, href]) => `<a${key === active ? ' aria-current="page"' : ''} href="${href}">${label}</a>`).join('');
}

function layout({ title, description, body, prefix = '../', active, toc = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content="${description}" />
  <title>${title} — Opalinx</title>
  <link rel="icon" href="${prefix}assets/opalinx-mark.svg" />
  <script>try{const t=localStorage.getItem('opalinx-theme');if(t)document.documentElement.dataset.theme=t;else if(matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.dataset.theme='dark'}catch{}</script>
  <link rel="stylesheet" href="${prefix}assets/site.css" />
  <script src="${prefix}assets/site.js" defer></script>
</head>
<body>
  <header class="site-header">
    <a class="brand" href="${prefix}" aria-label="Opalinx home"><img src="${prefix}assets/opalinx-mark.svg" alt="" /><span>Opalinx</span></a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-label="Open navigation">Menu</button>
    <nav class="site-nav" aria-label="Primary navigation">${navigation(prefix, active)}<a href="https://github.com/djipco/opalinx-spec">GitHub</a><button class="theme-toggle" type="button">Theme</button></nav>
  </header>
  <main class="page-shell">
    <aside class="page-aside"><strong>On this page</strong>${toc}</aside>
    <article class="prose">${body}</article>
  </main>
  <footer class="site-footer"><p>Opalinx · Designed by Jean-Philippe Cô</p><p><a href="mailto:jp@djip.co">Commercial licensing</a></p></footer>
</body>
</html>`;
}

async function renderPage(source, destination, options) {
  let markdown = await readFile(path.join(root, source), 'utf8');
  if (source === 'README.md') {
    markdown = markdown
      .replace('(conformance/README.md)', '(../conformance/)')
      .replaceAll('(LICENSE.md', '(../license/');
  }
  if (source === 'conformance/README.md') {
    markdown = markdown.replaceAll('../site/assets/', '../assets/');
  }
  let body = addHeadingIds(marked.parse(markdown, { gfm: true }))
    .replace(/<blockquote>\s*<p>\[!WARNING\]\s*/g, '<blockquote class="warning">\n<p>');
  const headings = [...body.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)];
  const toc = headings.map(([, id, text]) => `<a href="#${id}">${text.replace(/<[^>]+>/g, '')}</a>`).join('');
  const html = layout({ ...options, body, toc });
  const target = path.join(output, destination, 'index.html');
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html);
}

async function build() {
  if (output === root || !output.startsWith(`${root}${path.sep}`)) throw new Error('Refusing unsafe output path');
  await mkdir(output, { recursive: true });
  for (const entry of await readdir(output)) {
    await rm(path.join(output, entry), { recursive: true, force: true });
  }
  await cp(path.join(root, 'site'), output, { recursive: true });

  await renderPage('README.md', 'spec', {
    title: 'Protocol specification',
    description: 'The Opalinx 1.0 protocol specification.',
    active: 'spec',
  });
  await renderPage('conformance/README.md', 'conformance', {
    title: 'Conformance corpus',
    description: 'Canonical Opalinx wire vectors and observable behavior cases.',
    active: 'conformance',
  });
  await renderPage('LICENSE.md', 'license', {
    title: 'Licence',
    description: 'Licence terms for the Opalinx specification.',
  });
  await cp(path.join(root, 'conformance', 'vectors.json'), path.join(output, 'conformance', 'vectors.json'));
  await cp(path.join(root, 'conformance', 'schema.json'), path.join(output, 'conformance', 'schema.json'));

  await writeFile(path.join(output, '.nojekyll'), '');
  console.log(`Built Opalinx site in ${output}`);
}

await build();
