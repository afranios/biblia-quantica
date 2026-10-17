#!/usr/bin/env node
// Checks data/news.json before a build or a commit: shape, dates, URLs, tags, no duplicates.
const fs = require('fs'), path = require('path');
const file = path.resolve(__dirname, '..', 'data', 'news.json');
const items = JSON.parse(fs.readFileSync(file, 'utf8'));
const TAGS = ['hw', 'adv', 'crypto', 'biz', 'br', 'money'];
const errors = [];
if (!Array.isArray(items)) errors.push('news.json must be an array');
const seen = new Set();
items.forEach((it, i) => {
  const where = 'item ' + i + ' (' + (it.t || '?').slice(0, 40) + ')';
  ['d', 'y', 't', 'w', 'n', 's', 'u'].forEach(k => { if (typeof it[k] !== 'string' || !it[k].trim()) errors.push(where + ': missing ' + k); });
  if (!/^(19|20)\d\d$/.test(it.y || '')) errors.push(where + ': y must be a 4-digit year');
  if (!/^https?:\/\//.test(it.u || '')) errors.push(where + ': u must be an http(s) URL');
  if (!Array.isArray(it.tags) || !it.tags.length || it.tags.some(t => !TAGS.includes(t))) errors.push(where + ': tags must be a non-empty subset of ' + TAGS.join(','));
  if (seen.has(it.u)) errors.push(where + ': duplicate URL'); seen.add(it.u);
  if ((it.w || '').length > 700 || (it.n || '').length > 400) errors.push(where + ': w (max 700) or n (max 400) too long');
});
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('news.json ok: ' + items.length + ' items');
