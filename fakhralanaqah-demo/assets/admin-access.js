(() => {
  const KEY = 'FA_ADMIN_ACCESS_OK_V1';

  function getCfg(){
    return window.FA_CONFIG || {};
  }

  function getPin(){
    const cfg = getCfg();
    const p = cfg.adminAccessPin;
    return String(p && String(p).trim() ? p : '2025');
  }

  function isRequired(){
    // تم تعطيل الحماية مؤقتاً (بدون PIN)
    return false;
  }

  function alreadyUnlocked(){
    return sessionStorage.getItem(KEY) === '1';
  }

  function setUnlocked(){
    sessionStorage.setItem(KEY, '1');
  }

  function makeOverlay(){
    const ov = document.createElement('div');
    ov.id = 'faAccessOverlay';
    ov.innerHTML = `
      <div class="fa-access-card">
        <div class="fa-access-title">دخول لوحة الإدارة</div>
        <div class="fa-access-sub">أدخل رمز الدخول للمتابعة.</div>
        <div class="fa-access-row">
          <input id="faAccessPin" type="password" inputmode="numeric" autocomplete="one-time-code" placeholder="رمز الدخول" />
          <button id="faAccessBtn" type="button">دخول</button>
        </div>
        <div id="faAccessErr" class="fa-access-err"></div>
        <div class="fa-access-hint">ملاحظة: هذا قفل بسيط داخل المتصفح (Static).</div>
      </div>
    `;
    return ov;
  }

  function injectStyles(){
    if(document.getElementById('faAccessStyles')) return;
    const st = document.createElement('style');
    st.id = 'faAccessStyles';
    st.textContent = `
      body{visibility:hidden;}
      #faAccessOverlay{
        position:fixed; inset:0; z-index:999999;
        background:rgba(0,0,0,.72);
        display:flex; align-items:center; justify-content:center;
        padding:16px;
      }
      .fa-access-card{
        width:min(520px, 100%);
        background:rgba(16,16,16,.94);
        border:1px solid rgba(255,215,120,.35);
        box-shadow:0 18px 60px rgba(0,0,0,.55);
        border-radius:18px;
        padding:18px;
        color:#fff;
        font-family:system-ui, -apple-system, Segoe UI, Tahoma, Arial;
      }
      .fa-access-title{font-size:20px; font-weight:800; margin-bottom:6px;}
      .fa-access-sub{opacity:.8; font-size:13px; margin-bottom:12px;}
      .fa-access-row{display:flex; gap:10px;}
      #faAccessPin{
        flex:1;
        padding:12px 12px;
        border-radius:12px;
        border:1px solid rgba(255,255,255,.14);
        background:rgba(0,0,0,.25);
        color:#fff;
        outline:none;
      }
      #faAccessPin:focus{border-color: rgba(255,215,120,.6); box-shadow:0 0 0 3px rgba(255,215,120,.12);}
      #faAccessBtn{
        padding:12px 14px;
        border-radius:12px;
        border:1px solid rgba(255,215,120,.35);
        background:linear-gradient(180deg, rgba(255,215,120,.22), rgba(255,215,120,.12));
        color:#fff;
        cursor:pointer;
        font-weight:700;
        min-width:92px;
      }
      #faAccessBtn:hover{filter:brightness(1.06);}
      .fa-access-err{color:#ff6b6b; font-size:13px; margin-top:10px; min-height:18px;}
      .fa-access-hint{opacity:.65; font-size:12px; margin-top:10px;}
    `;
    document.head.appendChild(st);
  }

  function lockUntilPin(){
    injectStyles();

    const ov = makeOverlay();
    document.body.appendChild(ov);

    const pinInput = ov.querySelector('#faAccessPin');
    const btn = ov.querySelector('#faAccessBtn');
    const err = ov.querySelector('#faAccessErr');

    const PIN = getPin();

    function attempt(){
      const v = String(pinInput.value || '').trim();
      if(v === PIN){
        setUnlocked();
        ov.remove();
        document.body.style.visibility = 'visible';
      } else {
        err.textContent = 'رمز غير صحيح. حاول مرة ثانية.';
        pinInput.focus();
        pinInput.select();
      }
    }

    btn.addEventListener('click', attempt);
    pinInput.addEventListener('keydown', (e) => {
      if(e.key === 'Enter') attempt();
    });

    // show page (but covered by overlay)
    document.body.style.visibility = 'visible';
    setTimeout(() => pinInput.focus(), 50);
  }

  document.addEventListener('DOMContentLoaded', () => {
    if(!isRequired()){
      document.body.style.visibility = 'visible';
      return;
    }
    if(alreadyUnlocked()){
      document.body.style.visibility = 'visible';
      return;
    }
    lockUntilPin();
  });
})();
