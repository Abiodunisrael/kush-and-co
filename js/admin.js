/**
 * KUSH & CO — Admin Panel logic
 * Auth, tabs, outreaches, gallery, settings,
 * submissions (with Renewed status, Public toggle, Certificate upload,
 * Search + Filter, unread badge), and Backup.
 */

const API = 'api';
let state = { outreaches: [], gallery: [], settings: {} };

let subsSearchTerm = '';
let subsStatusFilter = 'all';

/* ============================================================
   AUTH
   ============================================================ */
async function checkAuth() {
  try {
    const res = await fetch(`${API}/auth.php?action=check`, {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    const data = await res.json();
    if (data.authenticated) showDashboard();
  } catch (_) {}
}

function showDashboard() {
  const loginView = document.getElementById('loginView');
  const dashView = document.getElementById('dashboardView');
  if (loginView) loginView.hidden = true;
  if (dashView) dashView.hidden = false;
  initDashboard();
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const pwInput = document.getElementById('password');
  const err = document.getElementById('loginError');
  const pw = pwInput ? pwInput.value : '';
  if (err) err.textContent = '';

  try {
    const res = await fetch(`${API}/auth.php?action=login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (data.success) showDashboard();
    else if (err) err.textContent = data.message || 'Incorrect password.';
  } catch (ex) {
    if (err) err.textContent = 'Network error.';
  }
}

async function handleLogout() {
  await fetch(`${API}/auth.php?action=logout`, { credentials: 'same-origin' });
  location.reload();
}

/* ============================================================
   TABS
   ============================================================ */
function initTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      buttons.forEach((b) => b.classList.toggle('active', b === btn));
      panels.forEach((p) => p.classList.toggle('active', p.dataset.panel === target));

      if (target === 'submissions') markSubmissionsRead();
    });
  });
}

/* ============================================================
   LOAD ALL
   ============================================================ */
async function loadAll() {
  const bust = `?_=${Date.now()}`;
  const [out, gal, set] = await Promise.all([
    fetch(`data/outreaches.json${bust}`).then(r => r.json()).catch(() => []),
    fetch(`data/gallery.json${bust}`).then(r => r.json()).catch(() => []),
    fetch(`data/settings.json${bust}`).then(r => r.json()).catch(() => ({})),
  ]);
  state.outreaches = Array.isArray(out) ? out : [];
  state.gallery = Array.isArray(gal) ? gal : [];
  state.settings = set || {};

  renderOutreaches();
  renderGallery();
  renderSettings();
}

/* ============================================================
   OUTREACHES
   ============================================================ */
function renderOutreaches() {
  const list = document.getElementById('outreachList');
  if (!list) return;
  if (!state.outreaches.length) {
    list.innerHTML = '<p class="hint">No outreaches yet. Click "Add Outreach".</p>';
    return;
  }
  list.innerHTML = state.outreaches.map((e, i) => `
    <div class="item-card" data-index="${i}">
      <div class="item-fields">
        <div class="form-row"><label>Date</label><input type="date" data-field="date" value="${e.date || ''}" /></div>
        <div class="form-row"><label>Title</label><input type="text" data-field="title" value="${escapeAttr(e.title || '')}" /></div>
        <div class="form-row"><label>Description</label><textarea rows="2" data-field="description">${escapeHtml(e.description || '')}</textarea></div>
      </div>
      <div class="item-actions">
        <button class="btn btn-danger btn-sm" data-action="delete">Delete</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.item-card').forEach((card) => {
    const idx = Number(card.dataset.index);
    card.querySelectorAll('input, textarea').forEach((input) => {
      input.addEventListener('input', () => {
        state.outreaches[idx][input.dataset.field] = input.value;
      });
    });
    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (confirm('Delete this outreach?')) {
        state.outreaches.splice(idx, 1);
        renderOutreaches();
      }
    });
  });
}

function handleAddOutreach() {
  state.outreaches.push({ date: '', title: '', description: '' });
  renderOutreaches();
}

async function handleSaveOutreaches() {
  const clean = state.outreaches
    .filter(e => e.title && e.date)
    .map(e => ({
      date: e.date,
      title: e.title.trim(),
      description: (e.description || '').trim(),
    }));
  await saveFile('outreaches.json', clean, 'outreachSaveStatus');
}

/* ============================================================
   GALLERY
   ============================================================ */
function renderGallery() {
  const wrap = document.getElementById('galleryList');
  if (!wrap) return;
  if (!state.gallery.length) {
    wrap.innerHTML = '<p class="hint">No images yet. Click "Upload Image".</p>';
    return;
  }
  wrap.innerHTML = state.gallery.map((img, i) => `
    <div class="g-item" data-index="${i}">
      <img src="${escapeAttr(img.src)}" alt="" />
      <button class="g-remove" data-action="delete" aria-label="Remove">×</button>
      <div class="g-caption"><input type="text" data-field="alt" value="${escapeAttr(img.alt || '')}" placeholder="Caption / alt text" /></div>
    </div>
  `).join('');

  wrap.querySelectorAll('.g-item').forEach((card) => {
    const i = Number(card.dataset.index);
    card.querySelector('input[data-field="alt"]').addEventListener('input', (ev) => {
      state.gallery[i].alt = ev.target.value;
    });
    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      if (confirm('Remove this image?')) {
        state.gallery.splice(i, 1);
        renderGallery();
      }
    });
  });
}

async function handleGalleryUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  await uploadImage(file, (url) => {
    state.gallery.push({ src: url, alt: '' });
    renderGallery();
  });
  e.target.value = '';
}

async function handleSaveGallery() {
  await saveFile('gallery.json', state.gallery, 'gallerySaveStatus');
}

/* ============================================================
   SETTINGS
   ============================================================ */
function renderSettings() {
  const s = state.settings || {};
  const socials = s.socials || {};

  const map = {
    sHeroBadge: 'heroBadge',
    sHeroTitle: 'heroTitle',
    sHeroSubtitle: 'heroSubtitle',
    sEmail: 'email',
    sLocation: 'location',
    sFooterTagline: 'footerTagline',
    sHeroImage: 'heroImage',
  };
  Object.entries(map).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.value = s[key] || '';
  });

  const socialMap = {
    sFacebook: 'facebook',
    sInstagram: 'instagram',
    sTwitter: 'twitter',
    sLinkedin: 'linkedin',
    sTiktok: 'tiktok',
    sYoutube: 'youtube',
  };
  Object.entries(socialMap).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.value = socials[key] || '';
  });
}

async function handleHeroUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  await uploadImage(file, (url) => {
    const el = document.getElementById('sHeroImage');
    if (el) el.value = url;
  });
  e.target.value = '';
}

async function handleSaveSettings() {
  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  };

  const existing = state.settings || {};

  state.settings = {
    heroBadge:       getVal('sHeroBadge'),
    heroTitle:       getVal('sHeroTitle'),
    heroSubtitle:    getVal('sHeroSubtitle'),
    email:           getVal('sEmail'),
    location:        getVal('sLocation'),
    footerTagline:   getVal('sFooterTagline'),
    heroImage:       getVal('sHeroImage'),
    whatsapp:        existing.whatsapp || '',
    whatsappMessage: existing.whatsappMessage || '',
    socials: {
      facebook:  getVal('sFacebook'),
      instagram: getVal('sInstagram'),
      twitter:   getVal('sTwitter'),
      linkedin:  getVal('sLinkedin'),
      tiktok:    getVal('sTiktok'),
      youtube:   getVal('sYoutube'),
    },
  };
  await saveFile('settings.json', state.settings, 'settingsSaveStatus');
}

/* ============================================================
   SUBMISSIONS
   ============================================================ */
const SUBS_READ_KEY = 'kush_subs_last_read';

function getLastRead() {
  const v = localStorage.getItem(SUBS_READ_KEY);
  return v ? new Date(v).getTime() : 0;
}

function markSubmissionsRead() {
  localStorage.setItem(SUBS_READ_KEY, new Date().toISOString());
  const badge = document.getElementById('subsBadge');
  if (badge) badge.hidden = true;
}

function filterSubmissions(list) {
  const q = subsSearchTerm.trim().toLowerCase();
  return list.filter((s) => {
    const status = s.status || 'pending';
    if (subsStatusFilter !== 'all' && status !== subsStatusFilter) return false;
    if (!q) return true;

    const name = String(s.name || '').toLowerCase();
    const license = String(s.license || '').toLowerCase();
    const email = String(s.email || '').toLowerCase();
    const wa = String(s.whatsapp || '').toLowerCase();
    return name.includes(q) || license.includes(q) || email.includes(q) || wa.includes(q);
  });
}

async function loadSubmissions() {
  const wrap = document.getElementById('submissionsList');
  const badge = document.getElementById('subsBadge');
  if (!wrap) return;

  wrap.innerHTML = '<p class="hint">Loading…</p>';

  try {
    const res = await fetch(`${API}/load.php?file=submissions.json`, {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    const data = await res.json();
    const all = Array.isArray(data) ? data : [];

    window._allSubs = all;

    const lastRead = getLastRead();
    const unreadCount = all.filter((s) => {
      const t = new Date(s.submittedAt).getTime();
      return !Number.isNaN(t) && t > lastRead;
    }).length;

    if (badge) {
      if (unreadCount > 0) {
        badge.textContent = String(unreadCount);
        badge.hidden = false;
      } else {
        badge.hidden = true;
      }
    }

    renderSubmissionsList();
  } catch {
    wrap.innerHTML = '<p class="hint">Could not load submissions.</p>';
  }
}

function renderSubmissionsList() {
  const wrap = document.getElementById('submissionsList');
  if (!wrap) return;

  const all = Array.isArray(window._allSubs) ? window._allSubs : [];
  const list = filterSubmissions(all).sort(
    (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
  );

  if (!all.length) {
    wrap.innerHTML = '<p class="hint">No submissions yet.</p>';
    return;
  }

  if (!list.length) {
    wrap.innerHTML = '<div class="subs-empty">No submissions match your search or filter.</div>';
    return;
  }

  wrap.innerHTML = list.map((s) => {
    const waDigits = String(s.whatsapp || '').replace(/[^\d]/g, '');
    const waHref = waDigits ? `https://wa.me/${waDigits}` : '';
    const mailHref = s.email ? `mailto:${s.email}` : '';
    const status = s.status || 'pending';
    const isRenewed = status === 'renewed';
    const isPublic = !!s.public;
    const cert = s.certificate || '';

    return `
      <div class="sub-card ${isRenewed ? 'is-renewed' : ''}">
        <div class="sub-head">
          <div class="sub-date">${formatDate(s.submittedAt)}</div>
          <span class="sub-status sub-status-${status}">${isRenewed ? '✓ Renewed' : '⏳ Pending'}</span>
        </div>
        <div class="sub-name">${escapeHtml(s.name || '')}</div>
        <div class="sub-meta">
          <span class="sub-label">License:</span>
          <strong>${escapeHtml(s.license || '—')}</strong>
        </div>
        <div class="sub-actions">
          ${mailHref ? `
            <a class="sub-btn sub-btn-email" href="${escapeAttr(mailHref)}">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span>${escapeHtml(s.email || 'Email')}</span>
            </a>` : ''}
          ${waHref ? `
            <a class="sub-btn sub-btn-wa" href="${escapeAttr(waHref)}" target="_blank" rel="noopener">
              <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor"><path d="M16.04 4C9.94 4 5 8.94 5 15.04c0 2.4.75 4.62 2.03 6.45L5 28l6.68-1.99a11 11 0 0 0 4.36.9h.01c6.1 0 11.04-4.94 11.04-11.04S22.14 4 16.04 4zm0 20.18h-.01a9.14 9.14 0 0 1-4.65-1.27l-.33-.2-3.96 1.18 1.2-3.86-.22-.4a9.14 9.14 0 0 1-1.4-4.87c0-5.06 4.12-9.18 9.19-9.18 2.45 0 4.76.96 6.49 2.69a9.13 9.13 0 0 1 2.69 6.5c0 5.06-4.13 9.18-9.2 9.18z"/></svg>
              <span>${escapeHtml(s.whatsapp || 'WhatsApp')}</span>
            </a>` : ''}
          <button type="button" class="sub-btn sub-btn-status"
                  data-toggle-status
                  data-submitted="${escapeAttr(s.submittedAt || '')}"
                  data-current="${status}">
            ${isRenewed ? '↺ Mark Pending' : '✓ Mark Renewed'}
          </button>
        </div>

        ${isRenewed ? `
          <label class="sub-public-toggle">
            <input type="checkbox"
                   data-toggle-public
                   data-submitted="${escapeAttr(s.submittedAt || '')}"
                   ${isPublic ? 'checked' : ''} />
            <span>Show on public site (name &amp; date only)</span>
          </label>

          <div class="sub-cert-row">
            ${cert ? `
              <div class="sub-cert-preview">
                <img src="${escapeAttr(cert)}" alt="Certificate" />
                <button type="button" class="sub-cert-remove"
                        data-remove-cert
                        data-submitted="${escapeAttr(s.submittedAt || '')}"
                        aria-label="Remove certificate">×</button>
              </div>
            ` : ''}
            <label class="sub-cert-upload">
              ${cert ? '↻ Replace certificate' : '⬆ Upload certificate image'}
              <input type="file" accept="image/*" hidden
                     data-cert-upload
                     data-submitted="${escapeAttr(s.submittedAt || '')}" />
            </label>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  // Status toggle
  wrap.querySelectorAll('[data-toggle-status]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const submittedAt = btn.dataset.submitted;
      const current = btn.dataset.current;
      const next = current === 'renewed' ? 'pending' : 'renewed';

      btn.disabled = true;
      btn.textContent = 'Updating…';

      try {
        const r = await fetch(`${API}/update_status.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submittedAt, status: next }),
          credentials: 'same-origin',
        });
        const result = await r.json();
        if (result.success) {
          const row = (window._allSubs || []).find(x => x.submittedAt === submittedAt);
          if (row) row.status = next;
          renderSubmissionsList();
          loadSubmissions();
        } else {
          alert(result.message || 'Failed to update status.');
          btn.disabled = false;
          btn.textContent = current === 'renewed' ? '↺ Mark Pending' : '✓ Mark Renewed';
        }
      } catch {
        alert('Network error.');
        btn.disabled = false;
        btn.textContent = current === 'renewed' ? '↺ Mark Pending' : '✓ Mark Renewed';
      }
    });
  });

  // Public toggle
  wrap.querySelectorAll('[data-toggle-public]').forEach((checkbox) => {
    checkbox.addEventListener('change', async () => {
      const submittedAt = checkbox.dataset.submitted;
      const isPublic = checkbox.checked;
      checkbox.disabled = true;

      try {
        const r = await fetch(`${API}/update_public.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submittedAt, public: isPublic }),
          credentials: 'same-origin',
        });
        const result = await r.json();
        if (!result.success) {
          alert(result.message || 'Failed to update.');
          checkbox.checked = !isPublic;
        } else {
          const row = (window._allSubs || []).find(x => x.submittedAt === submittedAt);
          if (row) row.public = isPublic;
        }
      } catch {
        alert('Network error.');
        checkbox.checked = !isPublic;
      } finally {
        checkbox.disabled = false;
      }
    });
  });

  // Certificate upload
  wrap.querySelectorAll('[data-cert-upload]').forEach((input) => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const submittedAt = input.dataset.submitted;
      await uploadCertificate(file, submittedAt);
      e.target.value = '';
    });
  });

  // Certificate removal
  wrap.querySelectorAll('[data-remove-cert]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const submittedAt = btn.dataset.submitted;
      if (!confirm('Remove this certificate image?')) return;
      btn.disabled = true;
      try {
        const r = await fetch(`${API}/remove_certificate.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submittedAt }),
          credentials: 'same-origin',
        });
        const result = await r.json();
        if (result.success) {
          const row = (window._allSubs || []).find(x => x.submittedAt === submittedAt);
          if (row) row.certificate = '';
          renderSubmissionsList();
        } else {
          alert(result.message || 'Failed to remove.');
          btn.disabled = false;
        }
      } catch {
        alert('Network error.');
        btn.disabled = false;
      }
    });
  });
}

function initSubmissionsToolbar() {
  const searchInput = document.getElementById('subsSearch');
  const clearBtn = document.getElementById('subsSearchClear');
  const filterBtns = document.querySelectorAll('.subs-filter');

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      subsSearchTerm = searchInput.value;
      if (clearBtn) clearBtn.hidden = !subsSearchTerm;
      renderSubmissionsList();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      subsSearchTerm = '';
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      clearBtn.hidden = true;
      renderSubmissionsList();
    });
  }

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      subsStatusFilter = btn.dataset.filter || 'all';
      filterBtns.forEach((b) => b.classList.toggle('active', b === btn));
      renderSubmissionsList();
    });
  });
}

/* ============================================================
   BACKUP
   ============================================================ */
async function handleBackup() {
  const btn = document.getElementById('backupBtn');
  if (btn) { btn.disabled = true; btn.textContent = 'Preparing…'; }

  try {
    const bust = `?_=${Date.now()}`;
    const [outreaches, gallery, settings, submissions] = await Promise.all([
      fetch(`data/outreaches.json${bust}`).then(r => r.json()).catch(() => []),
      fetch(`data/gallery.json${bust}`).then(r => r.json()).catch(() => []),
      fetch(`data/settings.json${bust}`).then(r => r.json()).catch(() => ({})),
      fetch(`${API}/load.php?file=submissions.json`, {
        cache: 'no-store',
        credentials: 'same-origin',
      }).then(r => r.json()).catch(() => []),
    ]);

    const bundle = {
      exportedAt: new Date().toISOString(),
      version: '2.4',
      data: { outreaches, gallery, settings, submissions },
    };

    const json = JSON.stringify(bundle, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const stamp = new Date().toISOString().slice(0, 10);

    const a = document.createElement('a');
    a.href = url;
    a.download = `kush-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (btn) {
      btn.textContent = '✓ Downloaded';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = '⬇ Download Backup';
      }, 2000);
    }
  } catch (err) {
    alert('Backup failed: ' + err.message);
    if (btn) { btn.disabled = false; btn.textContent = '⬇ Download Backup'; }
  }
}

/* ============================================================
   SAVE + UPLOAD
   ============================================================ */
async function saveFile(filename, data, statusId) {
  const status = document.getElementById(statusId);
  if (status) {
    status.textContent = 'Saving…';
    status.className = 'save-status';
  }

  try {
    const res = await fetch(`${API}/save.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: filename, data }),
      credentials: 'same-origin',
    });
    const result = await res.json();
    if (!result.success) throw new Error(result.message || 'Save failed');

    if (status) {
      status.textContent = '✓ Saved';
      status.className = 'save-status success';
      setTimeout(() => { status.textContent = ''; }, 2500);
    }
  } catch (err) {
    if (status) {
      status.textContent = '✗ ' + err.message;
      status.className = 'save-status error';
    }
  }
}

async function uploadImage(file, cb) {
  const fd = new FormData();
  fd.append('image', file);
  try {
    const res = await fetch(`${API}/upload.php`, {
      method: 'POST',
      body: fd,
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Upload failed');
    cb(data.url);
  } catch (err) {
    alert('Upload failed: ' + err.message);
  }
}

async function uploadCertificate(file, submittedAt) {
  const fd = new FormData();
  fd.append('image', file);
  fd.append('submittedAt', submittedAt);
  try {
    const res = await fetch(`${API}/upload_certificate.php`, {
      method: 'POST',
      body: fd,
      credentials: 'same-origin',
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Upload failed');

    const row = (window._allSubs || []).find(x => x.submittedAt === submittedAt);
    if (row) row.certificate = data.url;
    renderSubmissionsList();
  } catch (err) {
    alert('Certificate upload failed: ' + err.message);
  }
}

/* ============================================================
   HELPERS
   ============================================================ */
function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function escapeAttr(str = '') { return escapeHtml(str); }

function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso || '';
  return d.toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' });
}

/* ============================================================
   INIT + BOOT
   ============================================================ */
function initDashboard() {
  initTabs();
  loadAll();
  loadSubmissions();
  initSubmissionsToolbar();

  if (!window._subsInterval) {
    window._subsInterval = setInterval(loadSubmissions, 30000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();

  const loginForm = document.getElementById('loginForm');
  if (loginForm) loginForm.addEventListener('submit', handleLoginSubmit);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  const addOutreachBtn = document.getElementById('addOutreachBtn');
  if (addOutreachBtn) addOutreachBtn.addEventListener('click', handleAddOutreach);

  const saveOutreachesBtn = document.getElementById('saveOutreachesBtn');
  if (saveOutreachesBtn) saveOutreachesBtn.addEventListener('click', handleSaveOutreaches);

  const galleryUpload = document.getElementById('galleryUpload');
  if (galleryUpload) galleryUpload.addEventListener('change', handleGalleryUpload);

  const saveGalleryBtn = document.getElementById('saveGalleryBtn');
  if (saveGalleryBtn) saveGalleryBtn.addEventListener('click', handleSaveGallery);

  const heroUpload = document.getElementById('heroUpload');
  if (heroUpload) heroUpload.addEventListener('change', handleHeroUpload);

  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  if (saveSettingsBtn) saveSettingsBtn.addEventListener('click', handleSaveSettings);

  const refreshSubsBtn = document.getElementById('refreshSubsBtn');
  if (refreshSubsBtn) refreshSubsBtn.addEventListener('click', loadSubmissions);

  const backupBtn = document.getElementById('backupBtn');
  if (backupBtn) backupBtn.addEventListener('click', handleBackup);
});