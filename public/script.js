/* ============================================================
   OLLASTACK REDESIGN — Interactive Logic
   ============================================================ */

(function () {
  'use strict';

  // 1. Mobile Navigation Toggle
  const burger = document.getElementById('nav-burger');
  const mobileNav = document.getElementById('nav-mobile');
  if (burger && mobileNav) {
    burger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = mobileNav.classList.toggle('open');
      burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    document.addEventListener('click', (e) => {
      if (mobileNav.classList.contains('open') && !mobileNav.contains(e.target) && e.target !== burger) {
        mobileNav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // 2. Interactive Live Demo Form Submission
  const demoForm = document.getElementById('hero-interactive-form');
  const demoSubmitBtn = document.getElementById('demo-submit-button');
  const liveLeadId = document.getElementById('live-lead-id');
  const liveTimeVal = document.getElementById('live-time-value');
  const liveLocVal = document.getElementById('live-loc-value');

  function generateLeadId() {
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let id = 'lead_01JX';
    for (let i = 0; i < 14; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  function getFormattedCurrentTime() {
    const now = new Date();
    const options = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    };
    return now.toLocaleString('en-US', options);
  }

  if (demoForm) {
    demoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const origText = demoSubmitBtn.innerHTML;
      demoSubmitBtn.innerHTML = 'Submitting…';
      demoSubmitBtn.disabled = true;
      demoSubmitBtn.style.opacity = '0.7';

      setTimeout(() => {
        if (liveLeadId) liveLeadId.textContent = generateLeadId();
        if (liveTimeVal) liveTimeVal.textContent = getFormattedCurrentTime();

        demoSubmitBtn.innerHTML = '✓ Submitted!';
        demoSubmitBtn.style.background = '#059669';
        demoSubmitBtn.style.borderColor = '#059669';

        const outputCard = document.getElementById('demo-output-display');
        if (outputCard) {
          outputCard.style.transform = 'scale(1.02)';
          outputCard.style.boxShadow = '0 12px 32px rgba(5, 150, 105, 0.15)';
          setTimeout(() => {
            outputCard.style.transform = 'scale(1)';
            outputCard.style.boxShadow = '';
          }, 400);
        }

        setTimeout(() => {
          demoSubmitBtn.innerHTML = origText;
          demoSubmitBtn.style.background = '';
          demoSubmitBtn.style.borderColor = '';
          demoSubmitBtn.style.opacity = '1';
          demoSubmitBtn.disabled = false;
        }, 1800);
      }, 700);
    });
  }

  // Detect Live Geo Location for Demo
  fetch('https://ipapi.co/json/')
    .then(r => r.json())
    .then(data => {
      if (data && data.city && data.country_name) {
        const flag = data.country_code ? String.fromCodePoint(...[...data.country_code.toUpperCase()].map(c => 127397 + c.charCodeAt())) : '';
        if (liveLocVal) {
          liveLocVal.textContent = `${data.city}, ${data.country_name} ${flag}`;
        }
      }
    })
    .catch(() => {
      // Fallback stays as "Bengaluru, India 🇮🇳"
    });

  // 3. API Sandbox Console Tabs
  const cTabBtns = document.querySelectorAll('.c-tab-btn');
  const cTabPanels = document.querySelectorAll('.c-tab-panel');
  cTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabKey = btn.dataset.tab;
      cTabBtns.forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });
      cTabPanels.forEach(panel => {
        panel.classList.toggle('active', panel.dataset.tab === tabKey);
      });
    });
  });

  // 4. API Sandbox Live Run Buttons
  const runFormsBtn = document.getElementById('run-forms-btn');
  const resFormsOut = document.getElementById('res-forms-output');
  if (runFormsBtn && resFormsOut) {
    runFormsBtn.addEventListener('click', () => {
      runFormsBtn.textContent = 'Running…';
      setTimeout(() => {
        resFormsOut.innerHTML = `<span class="c-ok">{
  "success": true,
  "id": "${generateLeadId()}",
  "country": "IN",
  "city": "Bengaluru",
  "timezone": "Asia/Kolkata",
  "geo_stamp": "verified",
  "created_at": "${new Date().toISOString()}"
}</span>`;
        runFormsBtn.textContent = '▶ Run it live';
      }, 500);
    });
  }

  const runTestBtn = document.getElementById('run-test-btn');
  const resTestOut = document.getElementById('res-test-output');
  if (runTestBtn && resTestOut) {
    runTestBtn.addEventListener('click', () => {
      runTestBtn.textContent = 'Waiting for email…';
      setTimeout(() => {
        resTestOut.innerHTML = `<span class="c-ok">{
  "status": "delivered",
  "inbox": "test_01HXY2@test.ollastack.com",
  "otp": "364921",
  "extracted_code": "364921",
  "assertion": "PASSED (took 142ms)"
}</span>`;
        runTestBtn.textContent = '▶ Run it live';
      }, 700);
    });
  }

  // 5. Code Integration Snippet Tabs
  const codeNavs = document.querySelectorAll('.code-tab-nav');
  const codeContents = document.querySelectorAll('.code-tab-content');
  codeNavs.forEach(nav => {
    nav.addEventListener('click', () => {
      const lang = nav.dataset.lang;
      codeNavs.forEach(n => n.classList.toggle('active', n === nav));
      codeContents.forEach(c => c.classList.toggle('active', c.dataset.lang === lang));
    });
  });

  // 6. Test Inbox Copy Action
  const copyInboxBtn = document.getElementById('btn-copy-test-inbox');
  if (copyInboxBtn) {
    copyInboxBtn.addEventListener('click', () => {
      navigator.clipboard.writeText('test_01HXY2@test.ollastack.com').then(() => {
        const orig = copyInboxBtn.textContent;
        copyInboxBtn.textContent = 'Copied!';
        setTimeout(() => { copyInboxBtn.textContent = orig; }, 1500);
      });
    });
  }

})();
