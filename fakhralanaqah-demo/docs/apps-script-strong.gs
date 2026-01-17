/**
 * Fakhr Alanaqah - Google Sheets API (Apps Script) - Stronger mode
 * Deploy as Web App (Execute as: Me, Who has access: Anyone)
 *
 * Sheet name: products
 * Columns: sku | name | sale | rent_day | deposit | cat | sizes | thumb
 * sizes stored as "S|M|L|XL" or "مقاس واحد"
 *
 * Security:
 * - Reading (action=list) is open.
 * - Writing (addOne/addBatch) requires PIN equals Script Property: FA_ADMIN_PIN
 *
 * Set Script Properties:
 * - FA_ADMIN_PIN = (رقم سري ليعقوب)
 */
const SHEET_NAME = 'products';
const HEADER = ['sku','name','sale','rent_day','deposit','cat','sizes','thumb'];

function getSheet_(){
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(SHEET_NAME);
  if(!sh){
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRange(1,1,1,HEADER.length).setValues([HEADER]);
  }
  const h = sh.getRange(1,1,1,HEADER.length).getValues()[0];
  if(String(h[0]).toLowerCase() !== 'sku'){
    sh.getRange(1,1,1,HEADER.length).setValues([HEADER]);
  }
  return sh;
}

function ok_(obj){
  return ContentService.createTextOutput(JSON.stringify({ok:true, ...obj}))
    .setMimeType(ContentService.MimeType.JSON);
}
function err_(msg){
  return ContentService.createTextOutput(JSON.stringify({ok:false, error:String(msg)}))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeSku_(sku){
  sku = String(sku||'').trim().toUpperCase().replace('-', '');
  return sku;
}

function rowsToProducts_(values){
  const out = [];
  for(let i=1;i<values.length;i++){
    const r = values[i];
    const sku = normalizeSku_(r[0]);
    if(!sku) continue;
    out.push({
      sku,
      name: r[1] || '',
      sale: Number(r[2] || 0),
      rent_day: Number(r[3] || 0),
      deposit: Number(r[4] || 0),
      cat: r[5] || '',
      sizes: String(r[6]||'').split('|').filter(Boolean),
      thumb: r[7] || ''
    });
  }
  return out;
}

function requireAdminPin_(pin){
  const adminPin = PropertiesService.getScriptProperties().getProperty('FA_ADMIN_PIN') || '';
  if(!adminPin) throw new Error('ADMIN_PIN_NOT_SET');
  if(String(pin||'') !== String(adminPin)) throw new Error('BAD_PIN');
}

function doGet(e){
  const action = (e.parameter.action || 'list').toLowerCase();
  try{
    if(action === 'list'){
      const sh = getSheet_();
      const values = sh.getDataRange().getValues();
      return ok_({products: rowsToProducts_(values)});
    }
    return err_('UNKNOWN_ACTION');
  }catch(ex){
    return err_(ex);
  }
}

function doPost(e){
  let body = {};
  try{
    body = JSON.parse(e.postData.contents || '{}');
  }catch(ex){
    return err_('BAD_JSON');
  }
  const action = String(body.action||'').toLowerCase();
  try{
    if(action === 'addone'){
      requireAdminPin_(body.pin);
      return addOne_(body);
    }
    if(action === 'addbatch'){
      requireAdminPin_(body.pin);
      return addBatch_(body);
    }
    return err_('UNKNOWN_ACTION');
  }catch(ex){
    return err_(ex);
  }
}

function addOne_(b){
  const sh = getSheet_();
  const sku = normalizeSku_(b.sku);
  if(!sku) return err_('MISSING_SKU');

  const values = sh.getDataRange().getValues();
  for(let i=1;i<values.length;i++){
    if(normalizeSku_(values[i][0]) === sku) return err_('SKU_EXISTS');
  }
  const sizesArr = (b.sizes && b.sizes.length) ? b.sizes : ['مقاس واحد'];
  const sizes = sizesArr.join('|');

  sh.appendRow([
    sku,
    b.name || '',
    Number(b.sale||0),
    Number(b.rent_day||0),
    Number(b.deposit||0),
    b.cat || '',
    sizes,
    b.thumb || ''
  ]);
  return ok_({added:1, sku});
}

function lastNumberForPrefix_(prefix, values){
  prefix = String(prefix||'').toUpperCase();
  let maxN = 0;
  for(let i=1;i<values.length;i++){
    const sku = normalizeSku_(values[i][0]);
    const m = sku.match(new RegExp('^' + prefix + '(\\d{3,})$'));
    if(m){
      const n = parseInt(m[1], 10);
      if(n > maxN) maxN = n;
    }
  }
  return maxN;
}

function addBatch_(b){
  const sh = getSheet_();
  const prefix = String(b.prefix||'').toUpperCase();
  const count = Math.max(0, parseInt(b.count||0, 10));
  if(!prefix) return err_('MISSING_PREFIX');
  if(!count) return err_('MISSING_COUNT');

  const values = sh.getDataRange().getValues();
  const startN = lastNumberForPrefix_(prefix, values) + 1;

  const sizesArr = (b.sizes && b.sizes.length) ? b.sizes : ['مقاس واحد'];
  const sizes = sizesArr.join('|');

  const rows = [];
  for(let i=0;i<count;i++){
    const n = startN + i;
    const sku = prefix + String(n).padStart(3,'0');
    rows.push([
      sku,
      b.name || '',
      Number(b.sale||0),
      Number(b.rent_day||0),
      Number(b.deposit||0),
      b.cat || '',
      sizes,
      b.thumb || prefix
    ]);
  }
  sh.getRange(sh.getLastRow()+1, 1, rows.length, HEADER.length).setValues(rows);
  return ok_({added: rows.length, from: rows[0][0], to: rows[rows.length-1][0]});
}