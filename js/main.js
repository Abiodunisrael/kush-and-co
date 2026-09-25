/**
 * KUSH & CO — main script
 * Mobile nav, settings, socials, gallery, outreaches,
 * public renewals (with certificate lightbox), and form.
 */

/* ============================================================
   MOBILE NAV
   ============================================================ */
function initNav() {
  const btn = document.getElementById('menuBtn');
  const links = document.getElementById('navLinks');
  if (!btn || !links) return;

  btn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });

  links.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      links.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    })
  );

  document.addEventListener('click', (e) => {
    if (!links.classList.contains('open')) return;
    if (links.contains(e.target) || btn.contains(e.target)) return;
    links.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && links.classList.contains('open')) {
      links.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ============================================================
   FOOTER YEAR
   ============================================================ */
function initYear() {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
}

/* ============================================================
   SOCIAL ICONS
   ============================================================ */
const SOCIAL_SVG = {
  facebook: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 22v-8h3l.5-3.5H13V8.6c0-1 .3-1.7 1.8-1.7h1.9V3.8c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5V10.5H6.5V14H9.7v8H13z"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.42.56.22.96.48 1.38.9.42.42.68.82.9 1.38.17.42.37 1.06.42 2.23.06 1.25.07 1.63.07 4.8s0 3.55-.07 4.8c-.05 1.17-.25 1.8-.42 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.17-1.06.37-2.23.42-1.25.06-1.63.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.42a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.17-.42-.37-1.06-.42-2.23C2.2 15.6 2.2 15.2 2.2 12s0-3.55.07-4.8c.05-1.17.25-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.17 1.06-.37 2.23-.42C8.4 2.2 8.8 2.2 12 2.2zm0 3.15a6.65 6.65 0 1 0 0 13.3 6.65 6.65 0 0 0 0-13.3zm0 10.97a4.32 4.32 0 1 1 0-8.64 4.32 4.32 0 0 1 0 8.64zm6.85-11.24a1.55 1.55 0 1 1-3.1 0 1.55 1.55 0 0 1 3.1 0z"/></svg>`,
  twitter: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  linkedin: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-.95 1.83-1.95 3.77-1.95C21.4 8.75 22 11.1 22 14.2V21h-4v-6.05c0-1.44-.03-3.3-2.02-3.3-2.02 0-2.33 1.57-2.33 3.2V21h-4z"/></svg>`,
  tiktok: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 2h-2.9v13.1a2.6 2.6 0 1 1-2.6-2.6c.25 0 .5.03.7.1V9.7a5.6 5.6 0 1 0 5.5 5.6V8.1a7.2 7.2 0 0 0 4.3 1.4V6.6a4.3 4.3 0 0 1-4.3-4.3V2z"/></svg>`,
  youtube: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.5a3 3 0 0 0-2.1-2.1C19.5 4 12 4 12 4s-7.5 0-9.4.4A3 3 0 0 0 .5 6.5C0 8.4 0 12 0 12s0 3.6.5 5.5a3 3 0 0 0 2.1 2.1C4.5 20 12 20 12 20s7.5 0 9.4-.4a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.5.5-5.5s0-3.6-.5-5.5zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>`,
};

/* ============================================================
   SETTINGS
   ============================================================ */
async function loadSettings() {
  try {
    const res = await fetch('data/settings.json', { cache: 'no-store' });
    if (!res.ok) return;
    const s = await res.json();

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el && val) el.textContent = val;
    };
    const setAttr = (id, attr, val) => {
      const el = document.getElementById(id);
      if (el && val) el.setAttribute(attr, val);
    };

    setText('heroBadge', s.heroBadge);
    setText('heroSubtitle', s.heroSubtitle);
    setText('footerTagline', s.footerTagline);
    setText('footerLocation', s.location);

    const heroTitle = document.getElementById('heroTitle');
    if (heroTitle && s.heroTitle) heroTitle.innerHTML = s.heroTitle;

    const emailEl = document.getElementById('footerEmail');
    if (emailEl && s.email) {
      emailEl.textContent = s.email;
      emailEl.setAttribute('href', `mailto:${s.email}`);
    }

    setAttr('heroImage', 'src', s.heroImage);

    renderSocials(s);
  } catch (err) {
    console.warn('Settings not loaded:', err);
  }
}

function renderSocials(s) {
  const wrap = document.getElementById('footerSocials');
  if (!wrap) return;

  const platforms = [
    { key: 'facebook',  label: 'Facebook'  },
    { key: 'instagram', label: 'Instagram' },
    { key: 'twitter',   label: 'X'         },
    { key: 'linkedin',  label: 'LinkedIn'  },
    { key: 'tiktok',    label: 'TikTok'    },
    { key: 'youtube',   label: 'YouTube'   },
  ];

  const socials = s.socials || {};

  wrap.innerHTML = platforms
    .map(({ key, label }) => {
      const val = socials[key];
      if (!val) return '';
      return `
        <a class="is-${key}" href="${escapeAttr(val)}" target="_blank" rel="noopener" aria-label="${label}" title="${label}">
          ${SOCIAL_SVG[key]}
        </a>`;
    })
    .filter(Boolean)
    .join('');
}

/* ============================================================
   GALLERY
   ============================================================ */
async function loadGallery() {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  try {
    const res = await fetch('data/gallery.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Gallery missing');
    const items = await res.json();

    if (!Array.isArray(items) || items.length === 0) {
      grid.innerHTML = '<p class="loading">No photos yet — check back soon.</p>';
      return;
    }

    grid.innerHTML = items
      .map((img) => `<img src="${escapeAttr(img.src)}" alt="${escapeAttr(img.alt || 'KUSH & CO outreach')}" loading="lazy" />`)
      .join('');
  } catch {
    grid.innerHTML = '<p class="loading">Could not load gallery.</p>';
  }
}

/* ============================================================
   OUTREACHES
   ============================================================ */
async function loadOutreaches() {
  const grid = document.getElementById('outreachGrid');
  if (!grid) return;

  try {
    const res = await fetch('data/outreaches.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Outreaches missing');
    const events = await res.json();

    if (!Array.isArray(events) || events.length === 0) {
      grid.innerHTML = '<p class="loading">No upcoming outreaches right now — check back soon.</p>';
      return;
    }

    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    grid.innerHTML = events
      .map((e) => `
        <article class="event">
          <div class="date">${formatDate(e.date)}</div>
          <h3>${escapeHtml(e.title)}</h3>
          <p>${escapeHtml(e.description)}</p>
        </article>
      `)
      .join('');
  } catch {
    grid.innerHTML = '<p class="loading">Could not load outreaches.</p>';
  }
}

/* ============================================================
   PUBLIC RENEWALS (with certificate lightbox)
   ============================================================ */
async function loadPublicRenewals() {
  const grid = document.getElementById('renewalsGrid');
  if (!grid) return;

  try {
    const res = await fetch('api/public_renewals.php', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed');
    const list = await res.json();

    if (!Array.isArray(list) || list.length === 0) {
      grid.innerHTML = '<p class="loading">No renewals published yet — check back soon.</p>';
      return;
    }

    grid.innerHTML = list.map((r) => {
      const cert = r.certificate ? escapeAttr(r.certificate) : '';
      return `
        <div class="renewal-card">
          <div class="renewal-check" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="renewal-info">
            <div class="renewal-name">${escapeHtml(r.name)}</div>
            <div class="renewal-date">Renewed · ${formatDate(r.renewedAt)}</div>
            ${cert ? `
              <button type="button" class="renewal-cert-btn" data-cert="${cert}">
                View certificate
              </button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    grid.querySelectorAll('.renewal-cert-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        openCertificate(btn.dataset.cert);
      });
    });
  } catch {
    grid.innerHTML = '<p class="loading">Could not load renewals.</p>';
  }
}

function openCertificate(src) {
  let box = document.getElementById('certLightbox');
  if (!box) {
    box = document.createElement('div');
    box.id = 'certLightbox';
    box.className = 'cert-lightbox';
    box.innerHTML = `
      <div class="cert-lightbox-inner">
        <button type="button" class="cert-close" aria-label="Close">×</button>
        <img alt="Renewal certificate" />
      </div>`;
    document.body.appendChild(box);

    box.addEventListener('click', (e) => {
      if (e.target === box || e.target.classList.contains('cert-close')) {
        box.classList.remove('open');
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') box.classList.remove('open');
    });
  }
  box.querySelector('img').src = src;
  box.classList.add('open');
}

/* ============================================================
   RENEWAL FORM
   ============================================================ */
function initForm() {
  const form = document.getElementById('renewalForm');
  if (!form) return;
  const status = document.getElementById('formStatus');

  const rules = {
    name:     (v) => v.trim().length >= 2 || 'Please enter your full name.',
    license:  (v) => /^[A-Za-z0-9/-]{4,}$/.test(v.trim()) || 'Enter a valid NMCN license number.',
    email:    (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Enter a valid email address.',
    whatsapp: (v) => /^[\d\s()+-]{7,20}$/.test(v.trim()) || 'Enter a valid WhatsApp number.',
  };

  const setError = (field, msg) => {
    const input = form.elements[field];
    const slot = form.querySelector(`.error[data-for="${field}"]`);
    if (slot) slot.textContent = msg || '';
    if (input) input.classList.toggle('invalid', Boolean(msg));
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let valid = true;

    for (const field of Object.keys(rules)) {
      const r = rules[field](form.elements[field].value);
      if (r !== true) {
        setError(field, r);
        valid = false;
      } else {
        setError(field, '');
      }
    }

    if (!valid) {
      status.textContent = 'Please fix the errors above.';
      status.className = 'form-status error';
      return;
    }

    const payload = Object.fromEntries(new FormData(form).entries());
    payload.submittedAt = new Date().toISOString();

    try {
      const res = await fetch('api/submit.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Submit failed');

      status.textContent = 'Thank you! Your request has been received. KUSH & CO will contact you within 24 hours.';
      status.className = 'form-status success';
      form.reset();
    } catch {
      status.textContent = 'Something went wrong. Please try again or email us directly.';
      status.className = 'form-status error';
    }
  });

  Object.keys(rules).forEach((field) => {
    const el = form.elements[field];
    if (el) el.addEventListener('input', () => setError(field, ''));
  });
}

/* ============================================================
   HELPERS
   ============================================================ */
function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function escapeAttr(str = '') { return escapeHtml(str); }

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('partials:loaded', () => {
  initNav();
  initYear();
});

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadGallery();
  loadOutreaches();
  loadPublicRenewals();
  initForm();
});