/**
 * Fakhr Alanaqah - Apps Script Web App (Products + Transactions + Summary)
 *
 * Sheets:
 * 1) products: sku | name | sale | rent_day | deposit | cat | sizes | thumb
 * 2) transactions: ts | type | sku | amount | deposit | note
 *
 * Security:
 * - list (products) open
 * - summary/tx/addTx require admin PIN in Script Property: FA_ADMIN_PIN
 *
 * Deploy: Execute as Me | Access Anyone
 */
const SHEET_PRODUCTS = 'products';
const SHEET_TX = 'transactions';

const HEADER_PRODUCTS = ['sku','name','sale','rent_day','deposit','cat','sizes','thumb'];
const HEADER_TX = ['ts','type','sku','amount','deposit','note'];

function sh_(name, header){
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(name);
  if(!sh){
    sh = ss.insertSheet(name);
    sh.getRange(1,1,1,header.length).setValues([header]);
  }
  const h = sh.getRange(1,1,1,header.length).getValues()[0];
  if(String(h[0]).toLowerCase() !== String(header[0]).toLowerCase()){
    sh.getRange(1,1,1,header.length).setValues([header]);
  }
  return sh;
}
function ok_(obj){ return ContentService.createTextOutput(JSON.stringify({ok:true, ...obj})).setMimeType(ContentService.MimeType.JSON); }
function err_(msg){ return ContentService.createTextOutput(JSON.stringify({ok:false, error:String(msg)})).setMimeType(ContentService.MimeType.JSON); }
function pin_(){ return PropertiesService.getScriptProperties().getProperty('FA_ADMIN_PIN') || ''; }
function requirePin_(pin){
  const p = pin_();
  if(!p) throw new Error('ADMIN_PIN_NOT_SET');
  if(String(pin||'') !== String(p)) throw new Error('BAD_PIN');
}
function nSku_(sku){ return String(sku||'').trim().toUpperCase().replace('-', ''); }

function rowsProducts_(vals){
  const out=[];
  for(let i=1;i<vals.length;i++){
    const r=vals[i];
    const sku=nSku_(r[0]);
    if(!sku) continue;
    out.push({
      sku, name:r[1]||'',
      sale:Number(r[2]||0),
      rent_day:Number(r[3]||0),
      deposit:Number(r[4]||0),
      cat:r[5]||'',
      sizes:String(r[6]||'').split('|').filter(Boolean),
      thumb:r[7]||''
    });
  }
  return out;
}
function rowsTx_(vals){
  const out=[];
  for(let i=1;i<vals.length;i++){
    const r=vals[i];
    if(!r[0]) continue;
    out.push({
      ts: r[0],
      type: r[1]||'',
      sku: nSku_(r[2]),
      amount: Number(r[3]||0),
      deposit: Number(r[4]||0),
      note: r[5]||''
    });
  }
  return out;
}

function doGet(e){
  const action = (e.parameter.action || 'list').toLowerCase();
  try{
    if(action === 'list'){
      const sh = sh_(SHEET_PRODUCTS, HEADER_PRODUCTS);
      return ok_({products: rowsProducts_(sh.getDataRange().getValues())});
    }
    if(action === 'summary'){
      requirePin_(e.parameter.pin);
      return ok_({summary: buildSummary_(
        e.parameter.day || '',
        e.parameter.month || ''
      )});
    }
    if(action === 'tx'){
      requirePin_(e.parameter.pin);
      const limit = Math.max(1, Math.min(200, parseInt(e.parameter.limit||'20',10)));
      const sh = sh_(SHEET_TX, HEADER_TX);
      const vals = sh.getDataRange().getValues();
      const all = rowsTx_(vals).reverse().slice(0, limit);
      return ok_({transactions: all});
    }
    return err_('UNKNOWN_ACTION');
  }catch(ex){
    return err_(ex);
  }
}

function doPost(e){
  let body={};
  try{ body = JSON.parse(e.postData.contents || '{}'); }catch(ex){ return err_('BAD_JSON'); }
  const action = String(body.action||'').toLowerCase();
  try{
    if(action === 'addtx'){
      requirePin_(body.pin);
      return addTx_(body);
    }
    return err_('UNKNOWN_ACTION');
  }catch(ex){
    return err_(ex);
  }
}

function addTx_(b){
  const sh = sh_(SHEET_TX, HEADER_TX);
  const ts = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  const type = String(b.type||'').trim(); // sale | rent
  const sku = nSku_(b.sku);
  const amount = Number(b.amount||0);
  const deposit = Number(b.deposit||0);
  const note = String(b.note||'');
  if(!type) return err_('MISSING_TYPE');
  if(!sku) return err_('MISSING_SKU');
  sh.appendRow([ts, type, sku, amount, deposit, note]);
  return ok_({added:1, ts});
}

function buildSummary_(dayKey, monthKey){
  const sh = sh_(SHEET_TX, HEADER_TX);
  const vals = sh.getDataRange().getValues();
  const tx = rowsTx_(vals);

  function isDay(ts){
    return String(ts||'').slice(0,10) === dayKey;
  }
  function isMonth(ts){
    return String(ts||'').slice(0,7) === monthKey;
  }
  function agg(filterFn){
    let sale_rev=0, rent_rev=0, dep=0, sales=0, rents=0;
    tx.forEach(r=>{
      if(!filterFn(r.ts)) return;
      dep += Number(r.deposit||0);
      if(r.type==='sale'){ sale_rev += Number(r.amount||0); sales++; }
      if(r.type==='rent'){ rent_rev += Number(r.amount||0); rents++; }
    });
    return {
      rev: sale_rev + rent_rev,
      sale_rev, rent_rev, dep, sales, rents
    };
  }
  const d=agg(isDay), m=agg(isMonth);
  return {
    today_rev:d.rev, today_sale_rev:d.sale_rev, today_rent_rev:d.rent_rev, today_dep:d.dep, today_sales:d.sales, today_rents:d.rents,
    month_rev:m.rev, month_sale_rev:m.sale_rev, month_rent_rev:m.rent_rev, month_dep:m.dep, month_sales:m.sales, month_rents:m.rents
  };
}