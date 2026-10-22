const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const BUNDLE_PATH_1 = path.join(ROOT_DIR, 'raw_web', 'assets', 'index-BVS57iLR.js');
const BUNDLE_PATH_2 = path.join(ROOT_DIR, 'raw_web', 'index-BVS57iLR.js');
const BAK_PATH = path.join(ROOT_DIR, 'raw_web', 'assets', 'index-BVS57iLR.js.bak');

// Always start clean from the pristine backup
const pristineBundle = fs.readFileSync(BAK_PATH, 'utf-8');

const startTarget = 'MC=()=>{';
const startIdx = pristineBundle.indexOf(startTarget);
if (startIdx === -1) {
  throw new Error('startTarget not found in pristine bundle');
}

const endTarget = 'jC=()=>';
const endIdx = pristineBundle.indexOf(endTarget, startIdx);
if (endIdx === -1) {
  throw new Error('endTarget not found in pristine bundle');
}

let mcCode = pristineBundle.substring(startIdx, endIdx);
console.log('Original MC block length:', mcCode.length);

// 1. Season default to auto-detect + isRunning (!0) + isAudioUnlocked (!0)
const origStart = 'MC=()=>{const[e,t]=y.useState("summer"),[n,r]=y.useState(!1),[o,i]=y.useState(!1)';
const newStart = 'MC=()=>{const getInitSeason=()=>{const m=new Date().getMonth();return(m>=3&&m<=8)?"summer":"winter"};const[e,t]=y.useState(getInitSeason),[n,r]=y.useState(!0),[o,i]=y.useState(!0)';
if (!mcCode.includes(origStart)) {
  throw new Error('origStart not found');
}
mcCode = mcCode.replace(origStart, newStart);

// 2. Default status message
const origStatus = '[x,g]=y.useState("प्रारंभ करने के लिए TEST BELL दबाएं")';
const newStatus = '[x,g]=y.useState("🟢 घंटी प्रणाली सक्रिय है (Active)")';
if (!mcCode.includes(origStatus)) {
  throw new Error('origStatus not found');
}
mcCode = mcCode.replace(origStatus, newStatus);

// 3. Audio reliability for period bell strike (fresh Audio instance prevents AbortError on rapid strikes)
const origQ = 'q=y.useCallback(()=>{H.current&&(H.current.currentTime=0,H.current.play().catch(console.error))},[])';
const newQ = 'q=y.useCallback(()=>{try{const a=new Audio(PC);a.play().catch(()=>{if(H.current){H.current.currentTime=0;H.current.play().catch(console.error);}})}catch(e){if(H.current){H.current.currentTime=0;H.current.play().catch(console.error);}}},[])';
if (!mcCode.includes(origQ)) {
  throw new Error('origQ not found');
}
mcCode = mcCode.replace(origQ, newQ);

// 4. Initial clock immediate display without '--:--:-- --'
mcCode = mcCode.replace('children:s||"--:--:-- --"', 'children:s||N(new Date)');

// 5. Clock ticker: run immediately on mount (no 1-second lag), tick every 500ms, sync on window focus
// CRITICAL: The return statement chains expressions with commas! (return expr1, expr2, S.jsxs(...))
// We MUST separate with COMMA `,` so S.jsxs(...) is returned by MC()!
const origEffect = 'y.useEffect(()=>{const W=setInterval(()=>{const V=new Date,oe=b(V),xe=N(V);l(xe),u(V);const me=$(oe);if(v(me),n&&o){const hn=B.find(Yt=>Yt.time===oe);hn&&L.current!==oe&&(L.current=oe,de(hn.ringCount,hn.label))}},1e3);return()=>clearInterval(W)},[n,o,B,$,de])';
const newEffect = 'y.useEffect(()=>{const tick=()=>{const V=new Date,oe=b(V),xe=N(V);l(xe),u(V);const me=$(oe);if(v(me),n&&o){const hn=B.find(Yt=>Yt.time===oe);hn&&L.current!==oe&&(L.current=oe,de(hn.ringCount,hn.label))}};tick();const W=setInterval(tick,500);window.addEventListener("focus",tick);document.addEventListener("visibilitychange",tick);return()=>{clearInterval(W);window.removeEventListener("focus",tick);document.removeEventListener("visibilitychange",tick)}},[n,o,B,$,de]),y.useEffect(()=>{window.__triggerAutoBell=(cnt,lbl)=>de(cnt,lbl);return()=>{delete window.__triggerAutoBell}},[de])';

if (!mcCode.includes(origEffect)) {
  throw new Error('origEffect not found');
}
mcCode = mcCode.replace(origEffect, newEffect);

// 6. Verify that mcCode still ends with '},' so it chains perfectly with 'jC=()=>'
if (!mcCode.endsWith('},')) {
  throw new Error('mcCode must end with "}," to preserve const declaration chain');
}

// Assemble the final bundle
const finalBundle = pristineBundle.substring(0, startIdx) + mcCode + pristineBundle.substring(endIdx);

fs.writeFileSync(BUNDLE_PATH_1, finalBundle, 'utf-8');
console.log('✓ Updated:', BUNDLE_PATH_1);

fs.writeFileSync(BUNDLE_PATH_2, finalBundle, 'utf-8');
console.log('✓ Updated:', BUNDLE_PATH_2);

console.log('✓ Surgical fix applied successfully!');
