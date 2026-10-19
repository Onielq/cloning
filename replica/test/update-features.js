// Audits gauntlet-yms.html against replica/features.csv and rewrites the CSV
// in the schema required by replica-diff parity.py:
//   feature, area, priority, original, clone, notes
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.resolve(__dirname, '..', '..', 'gauntlet-yms.html'), 'utf8');
const has = (s) => html.includes(s);

// Evidence keys per feature id — all must be present for clone=yes
const evidence = {
  F01: ['pill', 'on-light', 'on-teal'],
  F02: ['nav[aria-label]', 'Product'],
  F03: ['btn-primary'],
  F04: ['data-parallax'],
  F05: ['scallop'],
  F06: ['wmask', 'reveal-words'],
  F07: ['story-sticky', 'story-spacer', 'scene'],
  F08: ['stepNum', 'exit-up', 'active'],
  F09: ['scene'],
  F10: ['lane'],
  F11: ['scan'],
  F12: ['GATE RELEASED', 'MOVE TO SPOT'],
  F13: ['pdot', 'data-i'],
  F14: ['closing', 'lmask'],
  F15: ['poster='],
  F16: ['footer', 'href='],
  F17: ['curDot'],
  F18: ['@media'],
  F19: ['aria-label', 'prefers-reduced-motion'],
  F20: ['requestAnimationFrame'],
};

// nav[aria-label] needs a regex-ish check; handle specially
const check = (id, key) => {
  if (key === 'nav[aria-label]') return /<nav[^>]*aria-label/.test(html);
  if (key === 'href=') return /<a[^>]+href=/.test(html);
  return has(key);
};

const src = fs.readFileSync(path.resolve(__dirname, '..', 'features.csv'), 'utf8').trim().split('\n').slice(1);
const rows = [];
for (const line of src) {
  const m = line.match(/^([A-Z]\d+),(.*?),(S[\d/a-zA-Z]+|all),(must|should|could),(\w+),(.*)$/);
  if (!m) { console.error('UNPARSED:', line); continue; }
  const [, id, feature, area, priority, , notes] = m;
  const keys = evidence[id] || [];
  const missing = keys.filter((k) => !check(id, k));
  const clone = missing.length === 0 ? 'yes' : 'partial';
  const outNotes = missing.length ? notes + ' | missing evidence: ' + missing.join(',') : notes;
  // sanitize commas inside notes -> semicolons to keep flat CSV valid
  const clean = (s) => s.replace(/,/g, ';');
  rows.push([clean(feature), clean(area), priority, 'yes', clone, clean(outNotes)].join(','));
}

const header = 'feature,area,priority,original,clone,notes';
fs.writeFileSync(path.resolve(__dirname, '..', 'features.csv'), header + '\n' + rows.join('\n') + '\n');
console.log('rewrote features.csv with', rows.length, 'rows');
rows.forEach((r) => console.log(r.split(',')[0].slice(0, 40), '->', r.split(',')[4]));
