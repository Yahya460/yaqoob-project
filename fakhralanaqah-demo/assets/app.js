
// Convert "thumb" field to image URL (supports normal URLs and Google Drive share links)
function toImageUrl(thumb){
  if(!thumb) return '';
  const s = String(thumb).trim();
  if(!s) return '';
  // If user pasted Google Drive share link, convert it
  const m1 = s.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if(m1) return `https://drive.google.com/uc?export=view&id=${m1[1]}`;
  const m2 = s.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if(m2) return `https://drive.google.com/uc?export=view&id=${m2[1]}`;
  const m3 = s.match(/drive\.google\.com\/uc\?export=(?:download|view)&id=([a-zA-Z0-9_-]+)/);
  if(m3) return `https://drive.google.com/uc?export=view&id=${m3[1]}`;
  // If it already looks like a URL, use as-is
  if(/^https?:\/\//i.test(s)) return s;
  // If it's a Drive file id only
  if(/^[a-zA-Z0-9_-]{20,}$/.test(s)) return `https://drive.google.com/uc?export=view&id=${s}`;
  return '';
}

function fmtOMR(n){ return `${n} ر.ع`; }
function daysBetween(a,b){
  const d1 = new Date(a); const d2 = new Date(b);
  const ms = d2 - d1;
  return Math.max(0, Math.ceil(ms / (1000*60*60*24)));
}
function q(name){
  const u = new URL(location.href);
  return u.searchParams.get(name);
}


async function loadProducts(){
  // Prefer Sheets API if configured, fallback to local JSON
  if(FA.apiUrl){
    const out = await apiGet('list');
    return out.products || [];
  }
  return (await fetch('/data/products.json')).json();
}

// Override PRODUCTS helper to use dynamic source

// ===== Sheets Web App client (stronger, one-time config) =====
function getApiUrl(){
  return (window.FA_CONFIG && window.FA_CONFIG.apiUrl) ? String(window.FA_CONFIG.apiUrl).trim() : '';
}
function getSessionPin(role){
  return sessionStorage.getItem('fa_pin_'+role) || '';
}
function setSessionPin(role, pin){
  if(pin) sessionStorage.setItem('fa_pin_'+role, String(pin).trim());
}

async function apiGet(action, params={}){
  const baseUrl = getApiUrl();
  if(!baseUrl || baseUrl.includes('PASTE_APPS_SCRIPT_WEBAPP_URL_HERE')) throw new Error('API_NOT_SET');
  const u = new URL(baseUrl);
  u.searchParams.set('action', action);
  for(const [k,v] of Object.entries(params)){
    if(v!==undefined && v!==null) u.searchParams.set(k, String(v));
  }
  const res = await fetch(u.toString(), {method:'GET'});
  const txt = await res.text();
  let data;
  try{ data = JSON.parse(txt); }catch(e){ throw new Error('BAD_JSON: '+txt.slice(0,160)); }
  if(!res.ok || data.ok===false) throw new Error(data.error || ('HTTP_'+res.status));
  return data;
}

async function apiPost(action, payload={}){
  const baseUrl = getApiUrl();
  if(!baseUrl || baseUrl.includes('PASTE_APPS_SCRIPT_WEBAPP_URL_HERE')) throw new Error('API_NOT_SET');
  const res = await fetch(baseUrl, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({action, ...payload})
  });
  const txt = await res.text();
  let data;
  try{ data = JSON.parse(txt); }catch(e){ throw new Error('BAD_JSON: '+txt.slice(0,160)); }
  if(!res.ok || data.ok===false) throw new Error(data.error || ('HTTP_'+res.status));
  return data;
}

async function loadProducts(){
  // Prefer Sheets API if configured, fallback to local JSON
  const apiUrl = getApiUrl();
  if(apiUrl && !apiUrl.includes('PASTE_APPS_SCRIPT_WEBAPP_URL_HERE')){
    const out = await apiGet('list');
    return out.products || [];
  }
  return (await fetch('/data/products.json')).json();
}
const PRODUCTS = async ()=> await loadProducts();
