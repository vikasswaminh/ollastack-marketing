(function () {
  'use strict';

  /* ============================================================
     OLLASTACK REDESIGN — Interactive Logic
     ============================================================ */

  // 0. Interactive Connected Nodes Background Canvas Motion
  function initNodeNetwork() {
    const canvas = document.getElementById('hero-nodes-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0, height = 0;
    let particles = [];
    let animationId = null;

    const colors = [
      '#EF4444', // Ollastack Red
      '#DC2626', // Crimson
      '#3B82F6', // Electric Blue
      '#2563EB', // Deep Blue
      '#6366F1'  // Indigo
    ];

    function resize() {
      const hero = canvas.closest('.hero-section') || canvas.parentElement;
      if (!hero) return;
      const rect = hero.getBoundingClientRect();
      width = canvas.width = Math.max(rect.width || hero.offsetWidth || window.innerWidth, 320);
      height = canvas.height = Math.max(rect.height || hero.offsetHeight || 620, 480);
      createParticles();
    }

    function createParticles() {
      particles = [];
      const isMobile = window.innerWidth < 768;
      const count = isMobile ? 14 : 26;
      for (let i = 0; i < count; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        const hasPulse = Math.random() < 0.2;
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.55,
          vy: (Math.random() - 0.5) * 0.55,
          radius: Math.random() * 0.8 + 1.2,
          color: color,
          hasPulse: hasPulse,
          pulsePhase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.025 + Math.random() * 0.025
        });
      }
    }

    window.addEventListener('resize', resize, { passive: true });

    resize();
    setTimeout(resize, 200);

    const maxDist = 155;

    function animate() {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw connecting lines between particles with rich gradients and clear visibility
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.65;
            const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            grad.addColorStop(0, p1.color);
            grad.addColorStop(1, p2.color);

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = grad;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = dist < 80 ? 1.2 : 0.85;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          }
        }
      }

      // 2. Draw and update particle positions
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = width + 10;
        else if (p.x > width + 10) p.x = -10;

        if (p.y < -10) p.y = height + 10;
        else if (p.y > height + 10) p.y = -10;

        // Pulse ring for select nodes
        if (p.hasPulse) {
          p.pulsePhase += p.pulseSpeed;
          const pulseScale = (Math.sin(p.pulsePhase) + 1) / 2; // 0..1
          const ringRadius = p.radius + pulseScale * 4.5;
          const ringAlpha = (1 - pulseScale) * 0.45;

          ctx.beginPath();
          ctx.arc(p.x, p.y, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = p.color;
          ctx.globalAlpha = ringAlpha;
          ctx.lineWidth = 0.8;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }

        // Particle core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.9;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 2;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
      }

      animationId = requestAnimationFrame(animate);
    }

    animate();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNodeNetwork);
  } else {
    initNodeNetwork();
  }

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

    // Close when clicking any navigation link inside mobile drawer
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
      });
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

  // 3. Flip Card Click / Tap support for Mobile & Touch Devices
  const flipCards = document.querySelectorAll('.platform-feature-card.flip-card');
  flipCards.forEach(card => {
    card.addEventListener('click', (e) => {
      // If clicking directly on a link inside back card, allow standard navigation
      if (e.target.closest('a')) return;
      card.classList.toggle('flipped');
    });
  });

  // 4. API Sandbox Console Tabs
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

  // 5. API Sandbox Live Run Buttons
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

  // 6. Code Integration Snippet Tabs
  const codeNavs = document.querySelectorAll('.code-tab-nav');
  const codeContents = document.querySelectorAll('.code-tab-content');
  codeNavs.forEach(nav => {
    nav.addEventListener('click', () => {
      const lang = nav.dataset.lang;
      codeNavs.forEach(n => n.classList.toggle('active', n === nav));
      codeContents.forEach(c => c.classList.toggle('active', c.dataset.lang === lang));
    });
  });

  // 7. Test Inbox Copy Action
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
