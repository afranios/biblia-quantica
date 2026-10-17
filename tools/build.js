#!/usr/bin/env node
// Builds the guide in two shapes from src/:
//   dist/site/   multi-page static site (for GitHub Pages or any host)
//   dist/single/ one self-contained index.html (for the claude.ai artifact)
// The restricted chapter (src/restrito.html) is encrypted with the access code taken from
// the RESTRICTED_CODE environment variable. When the source file is absent (public repo),
// the previously generated blobs in data/ are reused.
const fs = require('fs'), path = require('path'), { webcrypto } = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src'), DATA = path.join(ROOT, 'data'), DIST = path.join(ROOT, 'dist');
const CH = [
  { file: 'index.html', slug: 'inicio', n: '00', t: 'Início', title: 'Bíblia Quântica' },
  { file: 'fundamentos.html', slug: 'fundamentos', n: '01', t: 'Fundamentos', title: 'Fundamentos' },
  { file: 'como-funciona.html', slug: 'como-funciona', n: '02', t: 'Como funciona', title: 'Como funciona' },
  { file: 'estado-da-arte.html', slug: 'estado-da-arte', n: '03', t: 'Estado da arte', title: 'Estado da arte' },
  { file: 'desafios.html', slug: 'desafios', n: '04', t: 'Desafios', title: 'Desafios' },
  { file: 'oportunidades.html', slug: 'oportunidades', n: '05', t: 'Oportunidades', title: 'Oportunidades' },
  { file: 'riscos.html', slug: 'riscos', n: '06', t: 'Riscos e PQC', title: 'Riscos e PQC' },
  { file: 'preparacao.html', slug: 'preparacao', n: '07', t: 'Preparação', title: 'Preparação' },
  { file: 'restrito.html', slug: 'restrito', n: '08', t: 'Área restrita', title: 'Área restrita', restricted: true },
  { file: 'casos.html', slug: 'casos', n: '09', t: 'Casos e notícias', title: 'Casos e notícias' },
  { file: 'glossario.html', slug: 'glossario', n: '10', t: 'Glossário', title: 'Glossário' },
  { file: 'fontes.html', slug: 'fontes', n: '11', t: 'Fontes', title: 'Fontes' }
];
const slugOf = {}; CH.forEach(c => slugOf[c.file] = c.slug);
const read = f => fs.readFileSync(f, 'utf8');
const exists = f => fs.existsSync(f);
const news = JSON.parse(read(path.join(DATA, 'news.json')));
const changelog = exists(path.join(DATA, 'changelog.json')) ? JSON.parse(read(path.join(DATA, 'changelog.json'))) : [];
const dataScript = '<script>window.QB_NEWS=' + JSON.stringify(news) + ';window.QB_CHANGELOG=' + JSON.stringify(changelog) + ';</script>';

function parts(file) {
  const html = read(path.join(SRC, file));
  const st = html.match(/<style>([\s\S]*?)<\/style>/);
  const m = html.match(/<main class="page">([\s\S]*?)<\/main>/); if (!m) throw new Error('no main in ' + file);
  const scripts = [...html.matchAll(/<script(?![^>]*src)(?![^>]*application\/json)[^>]*>([\s\S]*?)<\/script>/g)].map(x => x[1]);
  let js = scripts.length ? scripts[scripts.length - 1].trim() : '';
  if (js.startsWith('QB.onReady = function(){')) js = js.slice('QB.onReady = function(){'.length).replace(/};\s*$/, '');
  else if (js.startsWith('(function(){')) js = js.slice('(function(){'.length).replace(/\}\)\(\);\s*$/, '');
  else if (js) throw new Error('unknown script shape in ' + file);
  return { html, css: st ? st[1] : '', body: m[1], js };
}
function spaLinks(body, slug) {
  body = body.replace(/href="([a-z-]+)\.html#([A-Za-z0-9_-]+)"/g, (_, f, a) => 'href="#' + slugOf[f + '.html'] + '.' + a + '"');
  body = body.replace(/href="([a-z-]+)\.html"/g, (_, f) => 'href="#' + slugOf[f + '.html'] + '"');
  body = body.replace(/href="#([A-Za-z0-9_-]+)"/g, (_, a) => 'href="#' + slug + '.' + a + '"');
  return body;
}

// ---------- encryption ----------
const b64 = u8 => Buffer.from(u8).toString('base64');
async function encrypt(payloadObj, code) {
  const enc = new TextEncoder();
  const salt = webcrypto.getRandomValues(new Uint8Array(16)), iv = webcrypto.getRandomValues(new Uint8Array(12));
  const base = await webcrypto.subtle.importKey('raw', enc.encode(code), 'PBKDF2', false, ['deriveKey']);
  const key = await webcrypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  const ct = await webcrypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(payloadObj)));
  return { salt: b64(salt), iv: b64(iv), ct: b64(new Uint8Array(ct)), v: 1 };
}
async function restrictedBlob(mode, payload) {
  const file = path.join(DATA, 'restrito.' + mode + '.enc.json');
  const code = process.env.RESTRICTED_CODE;
  if (payload && code) { const blob = await encrypt(payload, code); fs.writeFileSync(file, JSON.stringify(blob)); return blob; }
  if (exists(file)) return JSON.parse(read(file));
  throw new Error('Restricted chapter: provide src/restrito.html + RESTRICTED_CODE, or the blob ' + file);
}

async function main() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST, 'site', 'assets'), { recursive: true });
  fs.mkdirSync(path.join(DIST, 'site', 'data'), { recursive: true });
  fs.mkdirSync(path.join(DIST, 'single'), { recursive: true });
  const css = read(path.join(SRC, 'assets/style.css'));
  const sitejs = read(path.join(SRC, 'assets/site.js'));
  // versão curta dos assets compartilhados na URL, para furar o cache da CDN a cada alteração
  const crypto = require('crypto'); const ver = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 8);
  const cssV = 'assets/style.css?v=' + ver(css), jsV = 'assets/site.js?v=' + ver(sitejs);
  const withVersions = h => h.split('href="assets/style.css"').join('href="' + cssV + '"').split('src="assets/site.js"').join('src="' + jsV + '"');
  const hasRestrictedSrc = exists(path.join(SRC, 'restrito.html'));

  // ---------- multi-page site ----------
  fs.writeFileSync(path.join(DIST, 'site/assets/style.css'), css);
  fs.writeFileSync(path.join(DIST, 'site/assets/site.js'), sitejs);
  fs.writeFileSync(path.join(DIST, 'site/data/news.json'), JSON.stringify(news, null, 1));
  fs.writeFileSync(path.join(DIST, 'site/data/changelog.json'), JSON.stringify(changelog, null, 1));
  fs.writeFileSync(path.join(DIST, 'site/CNAME'), 'quantum.spolador.pro.br\n');
  // animação do bonequinho (página independente + áudio da narração)
  fs.cpSync(path.join(SRC, 'bonequinho'), path.join(DIST, 'site', 'bonequinho'), { recursive: true });
  fs.writeFileSync(path.join(DIST, 'site/.nojekyll'), '');
  for (const c of CH) {
    if (c.restricted) continue;
    let html = read(path.join(SRC, c.file));
    if (c.file === 'index.html') {
      html = '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' + html.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '');
      html = html.replace('<div class="bg-grad"></div>', '</head>\n<body>\n<div class="bg-grad"></div>') + '\n</body>\n</html>\n';
    }
    html = html.replace('<script src="assets/site.js"></script>', dataScript + '\n<script src="assets/site.js"></script>');
    fs.writeFileSync(path.join(DIST, 'site', c.file), withVersions(html));
  }
  // restricted page shell
  {
    let payload = null;
    if (hasRestrictedSrc) { const p = parts('restrito.html'); payload = { css: p.css, html: p.body, js: p.js }; }
    const blob = await restrictedBlob('site', payload);
    const shell = '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n<title>Área restrita · Bíblia Quântica</title>\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Manrope:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap">\n<link rel="stylesheet" href="assets/style.css">\n<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>\n</head>\n<body>\n<div class="bg-grad"></div><div class="bg-grid"></div><div id="bg3d"></div>\n<header id="site-header" class="hdr"></header>\n<main class="page" id="restrito-mount"></main>\n<div class="wrap" id="site-pager"></div>\n<footer id="site-footer"></footer>\n' + dataScript + '\n<script src="assets/site.js"></script>\n<script>window.QB_LOCK=' + JSON.stringify(blob) + ';\nQB.onReady=function(){ QB.lock(document.getElementById("restrito-mount"), window.QB_LOCK, function(){ QB.enhance(document.getElementById("restrito-mount")); }); };\n</script>\n</body>\n</html>\n';
    fs.writeFileSync(path.join(DIST, 'site', 'restrito.html'), withVersions(shell));
  }

  // ---------- single file ----------
  let allCss = css, sections = '', inits = '';
  let restrictedPayload = null;
  for (const c of CH) {
    const p = (c.restricted && !hasRestrictedSrc) ? null : parts(c.file);
    const i = CH.indexOf(c), prev = CH[i - 1], next = CH[i + 1];
    let pager = '<div class="wrap"><div class="pager">';
    if (prev) pager += '<a href="#' + prev.slug + '"><span class="k">← Anterior · ' + prev.n + '</span><span class="t">' + prev.t + '</span></a>';
    if (next) pager += '<a class="next" href="#' + next.slug + '"><span class="k">Próximo · ' + next.n + ' →</span><span class="t">' + next.t + '</span></a>';
    pager += '</div></div>';
    if (c.restricted) {
      if (hasRestrictedSrc) restrictedPayload = { css: p.css, html: spaLinks(p.body, c.slug), js: p.js };
      sections += '\n<section class="chapter" data-chapter="' + c.slug + '" hidden><div id="restrito-mount"></div>\n' + pager + '\n</section>\n';
      inits += '\nQB.init["' + c.slug + '"] = function(){ QB.lock(document.getElementById("restrito-mount"), window.QB_LOCK, function(){ QB.enhance(document.getElementById("restrito-mount")); }); };\n';
      continue;
    }
    if (p.css) allCss += '\n/* ' + c.slug + ' */\n' + p.css;
    let js = p.js;
    if (c.slug === 'inicio') {
      js = js.replace('// progress\n  var v = QB.visited();', 'QB.refreshHome = function(){ var v = QB.visited();')
        .replace('document.querySelectorAll("#home-map a").forEach(function(a){ if(v.indexOf(a.getAttribute("href"))>=0) a.classList.add("visited"); });', 'document.querySelectorAll("#home-map a").forEach(function(a){ a.classList.toggle("visited", v.indexOf(a.getAttribute("href").replace("#",""))>=0); }); }; QB.refreshHome();');
      if (js.indexOf('QB.refreshHome = function') < 0) throw new Error('home patch failed');
    }
    sections += '\n<section class="chapter" data-chapter="' + c.slug + '"' + (c.slug === 'inicio' ? '' : ' hidden') + '>\n' + spaLinks(p.body, c.slug) + '\n' + pager + '\n</section>\n';
    inits += '\nQB.init["' + c.slug + '"] = function(){\n' + js + '\n};\n';
  }
  const blob = await restrictedBlob('single', restrictedPayload);
  let spa = sitejs;
  spa = spa.replace(/var CH = \[[\s\S]*?\];/, 'var CH = ' + JSON.stringify(CH.map(c => ({ href: '#' + c.slug, slug: c.slug, n: c.n, t: c.t, title: c.title }))) + ';');
  spa = spa.replace(/function cur\(\)\{[\s\S]*?\}\n  QB\.current = cur\(\);/, 'QB.current = "#inicio";');
  spa = spa.replace("var lv = \"all\";", "nav.addEventListener('click', function(e){ if(e.target.closest('a')){ nav.classList.remove('open'); btn.setAttribute('aria-expanded','false'); } });\n    var lv = \"all\";");
  spa = spa.replace(/function buildPager\(\)\{[\s\S]*?\n  \}\n  function buildFooter/, 'function buildPager(){}\n  function buildFooter');
  spa = spa.replace(/function markVisited\(\)\{[\s\S]*?\n  \}\n  QB\.visited/, 'function markVisited(slug){\n    try{\n      var v = JSON.parse(localStorage.getItem("qb-visited")||"[]");\n      if(v.indexOf(slug)<0){ v.push(slug); localStorage.setItem("qb-visited", JSON.stringify(v)); }\n    }catch(e){}\n  }\n  QB.visited');
  const bootOld = 'buildHeader(); buildPager(); buildFooter(); markVisited(); initTerms(); initLevelTags(); initReadingTime(); initTabs(); initQuiz(); initCounters(); initBg();\n    if(typeof QB.onReady === "function") QB.onReady();';
  if (spa.indexOf(bootOld) < 0) throw new Error('boot line not found in site.js');
  spa = spa.replace(bootOld, 'buildHeader(); buildFooter(); initTerms(); initLevelTags(); initReadingTime(); initTabs(); initQuiz(); initCounters(); initBg(); QB.route(); window.addEventListener("hashchange", QB.route);');
  spa = spa.replace('window.QB = window.QB || {};', 'window.QB = window.QB || {}; QB.init = {}; QB.done = {};\n  QB.route = function(){\n    var h = (location.hash||"#inicio").replace(/^#/,""); var parts = h.split("."); var slug = parts[0], anchor = parts[1];\n    if(!document.querySelector(\'[data-chapter="\'+slug+\'"]\')){ slug = "inicio"; anchor = null; }\n    var changed = QB.current !== "#"+slug; QB.current = "#"+slug;\n    document.querySelectorAll(".chapter").forEach(function(s){ s.hidden = s.getAttribute("data-chapter") !== slug; });\n    document.querySelectorAll("#site-nav a").forEach(function(a){ if(a.getAttribute("href")==="#"+slug) a.setAttribute("aria-current","page"); else a.removeAttribute("aria-current"); });\n    var ch = CH.filter(function(c){return c.slug===slug;})[0]; document.title = ch && ch.slug!=="inicio" ? ch.title+" · Bíblia Quântica" : "Bíblia Quântica";\n    if(!QB.done[slug] && QB.init[slug]){ QB.done[slug] = true; try{ QB.init[slug](); }catch(e){ if(window.console) console.error(e); } }\n    markVisited(slug); if(slug==="inicio" && QB.refreshHome) QB.refreshHome();\n    if(anchor){ var el = document.querySelector(\'[data-chapter="\'+slug+\'"] [id="\'+anchor+\'"]\'); if(el){ setTimeout(function(){ el.scrollIntoView({block:"start"}); }, 30); return; } }\n    if(changed) window.scrollTo(0,0);\n  };');
  const head = read(path.join(SRC, 'index.html')).match(/^[\s\S]*?<script src="https:\/\/cdnjs[^>]*three[^>]*><\/script>/)[0].replace(/<link rel="stylesheet" href="assets\/style.css">\n/, '');
  const single = head + '\n<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>\n<style>\n' + allCss + '\n.chapter[hidden]{display:none}\n</style>\n' +
    '<div class="bg-grad"></div><div class="bg-grid"></div><div id="bg3d"></div>\n<header id="site-header" class="hdr"></header>\n<main class="page">' + sections + '</main>\n<footer id="site-footer"></footer>\n' + dataScript + '\n<script>window.QB_LOCK=' + JSON.stringify(blob) + ';</script>\n<script>\n' + spa + '\n</script>\n<script>\n(function(){' + inits + '\n})();\n</script>\n';
  fs.writeFileSync(path.join(DIST, 'single', 'index.html'), single);
  console.log('built: dist/site (' + (CH.length) + ' pages) and dist/single/index.html (' + (single.length / 1024).toFixed(0) + ' KB)' + (process.env.RESTRICTED_CODE && hasRestrictedSrc ? ' · restricted chapter re-encrypted' : ' · restricted blobs reused'));
}
main().catch(e => { console.error(e); process.exit(1); });
