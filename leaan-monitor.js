const https = require('https');
const http = require('http');

// ── הגדרות ──────────────────────────────────────────────
const KEYWORD       = 'ביתר מכבי';        // מה לחפש באתר
const INTERVAL_MIN  = 1;             // כמה דקות בין בדיקות
const TARGET_URL    = 'https://www.leaan.co.il/';

// טלגרם (השאר ריק אם עדיין אין)
const TELEGRAM_TOKEN   = '8476277037:AAEuSeDkBdQ-ANOdWptnjY_oq9hAtINprVk';
const TELEGRAM_CHAT_ID = '6890940548';
// ────────────────────────────────────────────────────────

let checkCount = 0;
let found      = false;

function log(msg) {
  const t = new Date().toLocaleTimeString('he-IL');
  console.log(`[${t}]  ${msg}`);
}

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function sendTelegram(message) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
  const text = encodeURIComponent(message);
  const url  = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${text}`;
  https.get(url, res => {
    if (res.statusCode === 200) log('✅ הודעת טלגרם נשלחה!');
    else log(`⚠️  טלגרם החזיר סטטוס ${res.statusCode}`);
  }).on('error', e => log(`⚠️  שגיאת טלגרם: ${e.message}`));
}

function playBeep() {
  // beep על Windows דרך PowerShell
  const { exec } = require('child_process');
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      exec(`powershell -c "[console]::beep(1000,500)"`, () => {});
    }, i * 800);
  }
}

async function check() {
  if (found) return;
  checkCount++;
  log(`🔍 בדיקה #${checkCount} — מחפש "${KEYWORD}" ב-${TARGET_URL}`);

  try {
    const html = await fetchPage(TARGET_URL);

    if (html.toLowerCase().includes(KEYWORD.toLowerCase())) {
      log('🎉🎉🎉  נמצא! כרטיסים עלו למכירה!');
      found = true;
      clearInterval(intervalId);

      playBeep();
      sendTelegram(`🎟️ נמצאו כרטיסים!\n"${KEYWORD}" מופיע באתר לאן.\nהיכנס עכשיו: ${TARGET_URL}`);

    } else {
      log(`😴 לא נמצא עדיין. בדיקה הבאה בעוד ${INTERVAL_MIN} דקה.`);
    }

  } catch (e) {
    log(`⚠️  שגיאה: ${e.message}`);
  }
}

// ── הפעלה ────────────────────────────────────────────────
log('▶  מוניטור לאן מופעל');
log(`   מחפש: "${KEYWORD}"`);
log(`   תדירות: כל ${INTERVAL_MIN} דקה`);
log(`   טלגרם: ✅ מוגדר`);
log('─────────────────────────────────');

sendTelegram('✅ מוניטור לאן הופעל!\nאקבל התראה כשביתר ירושלים יעלה למכירה.');

check(); // בדיקה מיידית
const intervalId = setInterval(check, INTERVAL_MIN * 60 * 1000);
