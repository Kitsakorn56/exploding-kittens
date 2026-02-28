/**
 * ui-common.js - ฟังก์ชันช่วยเหลือ UI ทั่วไป modal, theme, navigation
 */

// ─── Loading ──────────────────────────────────────────────────────────────────
function showLoading() {
  const el = document.getElementById('loadingOverlay');
  if (el) {
    el.classList.remove('hidden');
    el.style.display = 'flex';
  }
}

function hideLoading() {
  const el = document.getElementById('loadingOverlay');
  if (!el) return;
  el.classList.add('hidden');
  setTimeout(() => {
    el.style.display = 'none';
  }, 200);
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id);
  if (el) el.classList.add('active');
}

function showToast(msg, duration) {
  if (!duration) duration = 3000;
  const t = document.getElementById('toast');
  // ใช้ innerHTML เพื่อรองรับ <i> icon tags จาก ICONS.*
  t.innerHTML = msg;
  t.style.display = 'block';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.display = 'none';
  }, duration);
}

function goToHome() {
  playSound('click');
  showScreen('home');
}

function goToCreateRoom() {
  playSound('click');
  showScreen('create');
}

function goToJoinRoom() {
  playSound('click');
  showScreen('join');
}

// ─── Theme ────────────────────────────────────────────────────────────────────
function toggleTheme() {
  const html = document.documentElement;
  const newTheme = html.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-bs-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(t) {
  const i = document.getElementById('themeIcon');
  if (i) i.className = t === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
}

function initTheme() {
  const s = localStorage.getItem('theme');
  const html = document.documentElement;
  if (s === 'light' || s === 'dark') html.setAttribute('data-bs-theme', s);
  updateThemeIcon(html.getAttribute('data-bs-theme') || 'dark');
}

// ─── Modal helpers ────────────────────────────────────────────────────────────
function safeShowModal(modalId, options) {
  var el = document.getElementById(modalId);
  if (!el) return null;
  var existing = bootstrap.Modal.getInstance(el);
  if (existing) {
    existing.dispose();
  }
  clearModalBackdrops();
  var instance = new bootstrap.Modal(el, options || {});
  instance.show();
  return instance;
}

function safeHideModal(modalId) {
  // Clear card selection action flags for card-selection modals
  var cardSelectionModals = ['favorModal', 'seeFutureModal', 'alterFutureModal', 'clairvoyanceModal', 'digDeeperModal'];
  if (cardSelectionModals.indexOf(modalId) !== -1) {
    gs.myCardSelectionAction = null;
    if (typeof renderGameScreen === 'function') renderGameScreen();
  }
  
  var el = document.getElementById(modalId);
  if (!el) return;
  if (el._safehide_pending) return;
  var instance = bootstrap.Modal.getInstance(el);
  if (instance) {
    el._safehide_pending = true;
    instance.hide();
    el.addEventListener('hidden.bs.modal', function() {
      el._safehide_pending = false;
      var inst2 = bootstrap.Modal.getInstance(el);
      if (inst2) inst2.dispose();
      clearModalBackdrops();
    }, { once: true });
  } else {
    el._safehide_pending = false;
    el.classList.remove('show');
    el.style.display = 'none';
    el.removeAttribute('aria-modal');
    el.removeAttribute('role');
    clearModalBackdrops();
  }
}

function clearModalBackdrops() {
  var openModals = document.querySelectorAll('.modal.show');
  if (openModals.length === 0) {
    document.querySelectorAll('.modal-backdrop').forEach(function(el) {
      el.remove();
    });
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
  } else if (openModals.length === 1) {
    var backdrops = document.querySelectorAll('.modal-backdrop');
    if (backdrops.length > 1) {
      for (var i = 1; i < backdrops.length; i++) backdrops[i].remove();
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function getAvatarHTML(avatarUrl, name, size) {
  var s = size || 40;
  var colors = ['#6366f1','#8b5cf6','#ec4899','#f97316','#22c55e','#c9973a'];
  var color = colors[(name || '').length % colors.length];

  // มี avatarUrl และเป็นรูปภาพจริง (base64 หรือ URL)
  if (avatarUrl && (
    avatarUrl.startsWith('data:image') ||
    avatarUrl.startsWith('http://') ||
    avatarUrl.startsWith('https://') ||
    avatarUrl.startsWith('/')
  )) {
    return '<img src="' + escHtml(avatarUrl) + '" ' +
      'style="width:' + s + 'px;height:' + s + 'px;border-radius:50%;object-fit:cover;flex-shrink:0;' +
      'border:2px solid rgba(201,151,58,0.4);box-shadow:0 2px 8px rgba(0,0,0,0.3);" ' +
      'alt="' + escHtml(name) + '" ' +
      'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">' +
      '<div style="display:none;width:' + s + 'px;height:' + s + 'px;border-radius:50%;background:' + color + ';' +
      'align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:' + (s*0.4) + 'px;flex-shrink:0;">' +
      (name || '?')[0].toUpperCase() + '</div>';
  }

  // เป็น emoji เดี่ยว (1-2 ตัวอักษร unicode)
  if (avatarUrl && avatarUrl.length <= 4 && !avatarUrl.startsWith('{')) {
    return '<div style="width:' + s + 'px;height:' + s + 'px;border-radius:50%;background:' + color + ';' +
      'display:flex;align-items:center;justify-content:center;flex-shrink:0;' +
      'font-size:' + (s * 0.5) + 'px;line-height:1;' +
      'border:2px solid rgba(201,151,58,0.3);">' + avatarUrl + '</div>';
  }

  // default: initial ตัวอักษร
  var initial = (name || '?')[0].toUpperCase();
  return '<div style="width:' + s + 'px;height:' + s + 'px;border-radius:50%;background:' + color + ';' +
    'display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;' +
    'font-size:' + (s*0.4) + 'px;flex-shrink:0;border:2px solid rgba(255,255,255,0.1);">' + initial + '</div>';
}