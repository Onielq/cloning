// /replica-test — flow + state test plan runner for gauntlet-yms.html
// Vanilla Playwright (node). Logs bugs by severity S1..S3. Exit 1 if any S1/S2 open.
const { chromium } = require('playwright');
const path = require('path');

const URL = 'file://' + path.resolve(__dirname, '..', '..', 'gauntlet-yms.html');
const bugs = [];
function bug(sev, name, detail){ bugs.push({sev,name,detail}); console.log(`[${sev}] ${name} :: ${detail}`); }
async function check(name, fn){
  try { await fn(); console.log(`PASS ${name}`); }
  catch(e){ bug('S2', name, e.message.split('\n')[0]); }
}

(async()=>{
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport:{width:1366,height:768} });
  const errors = [];
  page.on('pageerror', e=>errors.push(String(e)));
  page.on('console', m=>{ if(m.type()==='error') errors.push(m.text()); });

  await page.goto(URL, {waitUntil:'load'});

  // T01 load without JS errors
  await check('T01 no page errors on load', async()=>{
    await page.waitForTimeout(500);
    if(errors.length) throw new Error(errors.join(' | '));
  });

  // T02 navbar present with CTA
  await check('T02 navbar + CTA visible', async()=>{
    await page.locator('nav.pill').waitFor({state:'visible'});
    await page.locator('nav .btn-primary').first().waitFor({state:'visible'});
  });

  // T03 hero content
  await check('T03 hero headline rendered', async()=>{
    const t = await page.locator('#heroTitle').textContent();
    if(!t || t.length < 10) throw new Error('empty headline');
  });

  // T04 thesis word reveal triggers on scroll into view
  // NOTE: .revealed is applied to the h2.reveal-words element (word-mask host), not the section.
  await check('T04 thesis reveals words', async()=>{
    await page.locator('#thesis').scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);
    const revealed = await page.locator('#thesis .reveal-words.revealed').count();
    if(!revealed) throw new Error('.revealed not applied to #thesis .reveal-words');
    const tf = await page.locator('.wmask > span').first().evaluate(el=>getComputedStyle(el).transform);
    if(tf !== 'none' && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(tf)) throw new Error('words still hidden: '+tf);
  });

  // T05 story steps advance 0..3 as you scroll the pinned region
  await check('T05 story steps advance', async()=>{
    const seen = new Set();
    const storyTop = await page.locator('#story').evaluate(el=>el.getBoundingClientRect().top + scrollY);
    const spacer = await page.locator('.story-spacer').evaluate(el=>el.offsetHeight);
    for(const f of [0.05,0.3,0.55,0.8,0.95]){
      await page.evaluate(y=>scrollTo(0,y), storyTop + spacer*f);
      await page.waitForTimeout(350);
      seen.add(await page.locator('#stepNum').textContent());
    }
    const expect=['01 / 04','02 / 04','03 / 04','04 / 04'];
    for(const e of expect) if(!seen.has(e)) throw new Error('missing step label '+e+' saw '+[...seen]);
  });

  // T06 exactly one scene active at each step
  await check('T06 single active scene', async()=>{
    const n = await page.locator('.scene.active').count();
    if(n!==1) throw new Error('active scenes='+n);
  });

  // T07 progress dots sync + clickable navigation
  await check('T07 dot click jumps to step 3', async()=>{
    await page.locator('.pdot[data-i="2"]').click({force:true});
    await page.waitForTimeout(1200);
    const label = await page.locator('#stepNum').textContent();
    if(label.trim()!=='03 / 04') throw new Error('after dot click step='+label);
  });

  // T08 nav theme swap: light over thesis/story, teal over closing
  await check('T08 nav theme zones', async()=>{
    await page.locator('#thesis').scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    if(!(await page.locator('nav.on-light').count())) throw new Error('no on-light over light zone');
    await page.locator('#closing').scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    if(!(await page.locator('nav.on-teal').count())) throw new Error('no on-teal over closing');
  });

  // T09 closing line reveal
  await check('T09 closing revealed', async()=>{
    await page.waitForTimeout(900);
    if(!(await page.locator('.closing.revealed').count())) throw new Error('closing not revealed');
  });

  // T10 media videos have posters that exist on disk (no broken src)
  // NOTE: file:// pages block fetch() by CORS in Chromium, so verify via fs + element load state.
  await check('T10 video posters load', async()=>{
    const fs = require('fs');
    const root = path.resolve(__dirname, '..', '..');
    const posters = await page.$$eval('.card video', vids => vids.map(v=>v.getAttribute('poster')));
    if(!posters.length) throw new Error('no video posters found');
    const missing = posters.filter(p => !fs.existsSync(path.resolve(root, p)));
    if(missing.length) throw new Error('missing poster files: '+missing.join(','));
    // force-load each poster and confirm naturalWidth>0 (image actually decodes)
    const bad = await page.$$eval('.card video', vids => Promise.all(vids.map(v=>new Promise(res=>{
      const img = new Image();
      img.onload = ()=> res(img.naturalWidth>0 ? null : 'zero-size '+v.getAttribute('poster'));
      img.onerror = ()=> res('broken '+v.getAttribute('poster'));
      img.src = v.getAttribute('poster');
    })))).then(rs=>rs.filter(Boolean));
    if(bad.length) throw new Error(bad.join(','));
  });

  // T11 footer links have hrefs; landmarks exist
  await check('T11 landmarks + footer links', async()=>{
    for(const sel of ['nav[aria-label]','main#main','footer#footer'])
      if(!(await page.locator(sel).count())) throw new Error('missing '+sel);
    const noHref = await page.$$eval('footer a', as=>as.filter(a=>!a.getAttribute('href')).length);
    if(noHref) throw new Error(noHref+' footer links without href');
  });

  // T12 keyboard focus works (tab moves focus off body)
  await check('T12 keyboard reachable', async()=>{
    await page.evaluate(()=>scrollTo(0,0));
    await page.keyboard.press('Tab');
    const tag = await page.evaluate(()=>document.activeElement.tagName+'/'+document.activeElement.className);
    if(tag==='BODY') throw new Error('focus stuck on body');
  });

  // T13 mobile 375px: story collapses, no horizontal overflow
  const mp = await browser.newPage({viewport:{width:375,height:720}});
  await mp.goto(URL,{waitUntil:'load'});
  await check('T13 mobile no h-overflow, stacked titles', async()=>{
    const ow = await mp.evaluate(()=>document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if(ow>1) throw new Error('horizontal overflow '+ow+'px');
    const vis = await mp.locator('.title').evaluateAll(es=>es.filter(e=>getComputedStyle(e).position==='static').length);
    if(vis!==4) throw new Error('stacked titles='+vis);
  });

  // T14 reduced motion: content visible immediately, cursor hidden
  const rp = await browser.newPage({viewport:{width:1366,height:768}, reducedMotion:'reduce'});
  await rp.goto(URL,{waitUntil:'load'});
  await check('T14 reduced-motion shows words', async()=>{
    await rp.locator('#thesis').scrollIntoViewIfNeeded();
    await rp.waitForTimeout(300);
    const tf = await rp.locator('.wmask > span').first().evaluate(el=>getComputedStyle(el).transform);
    if(tf!=='none' && !/matrix\(1, 0, 0, 1, 0, 0\)/.test(tf)) throw new Error('hidden under reduced motion: '+tf);
    const cur = await rp.locator('#curDot').evaluate(el=>getComputedStyle(el).display);
    if(cur!=='none') throw new Error('custom cursor shown under reduced motion');
  });

  await browser.close();

  const open = bugs.filter(b=>b.sev==='S1'||b.sev==='S2');
  console.log('\n--- SUMMARY ---');
  console.log(`${open.length} S1/S2, ${bugs.filter(b=>b.sev==='S3').length} S3`);
  process.exit(open.length?1:0);
})();
