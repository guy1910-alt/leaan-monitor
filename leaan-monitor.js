const https = require('https');
const http = require('http');

// ── הגדרות ──────────────────────────────────────────────
const KEYWORD       = 'מכבי';
const INTERVAL_MIN  = 1;
const TARGET_URL    = 'https://www.leaan.co.il/category/%D7%91%D7%99%D7%AA%D7%A8-%D7%99%D7%A8%D7%95%D7%A9%D7%9C%D7%99%D7%9D';

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
  const text = encodeURIComponent(message);
  const url  = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${text}`;
  https.get(url, res => {
    if (res.statusCode === 200) log('✅ הודעת טלגרם נשלחה!');
    else log(`⚠️  טלגרם החזיר סטטוס ${res.statusCode}`);
  }).on('error', e => log(`⚠️  שגיאת טלגרם: ${e.message}`));
}

function playBeep() {
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
  log(`🔍 בדיקה #${checkCount} — מחפש "${KEYWORD}" בעמוד ביתר ירושלים`);

  try {
    const html = await fetchPage(TARGET_URL);

    if (html.includes(KEYWORD)) {
      log('🎉🎉🎉  נמצא! כרטיסים לביתר-מכבי עלו למכירה!');
      found = true;
      clearInterval(intervalId);

      playBeep();
      sendTelegram(`🎟️ נמצאו כרטיסים!\nביתר ירושלים נגד מכבי תל אביב עלה למכירה!\nהיכנס עכשיו: https://www.leaan.co.il/category/ביתר-ירושלים`);

    } else {
      log(`😴 לא נמצא עדיין. בדיקה הבאה בעוד ${INTERVAL_MIN} דקה.`);
    }

  } catch (e) {
    log(`⚠️  שגיאה: ${e.message}`);
  }
}

// ── הפעלה ────────────────────────────────────────────────
log('▶  מוניטור לאן מופעל');
log(`   עמוד: ביתר ירושלים`);
log(`   מחפש: "${KEYWORD}"`);
log(`   תדירות: כל ${INTERVAL_MIN} דקה`);
log(`   טלגרם: ✅ מוגדר`);
log('─────────────────────────────────');

sendTelegram('✅ מוניטור לאן הופעל!\nמחפש כרטיסים לביתר ירושלים נגד מכבי תל אביב.');

check();
const intervalId = setInterval(check, INTERVAL_MIN * 60 * 1000);
