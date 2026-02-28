/**
 * game.js - ไฟล์หลักสำหรับนำเข้า modules ทั้งหมดและ initialization
 * [UPDATED] ใช้ ICONS แทน emoji และ t() แทน hardcoded strings
 * Socket ถูกสร้างไว้แล้วใน game-state.js
 */

document.addEventListener('DOMContentLoaded', function () {
  initTheme();
  setAuthMode('login');
  updateAllUITexts();

  var saved = localStorage.getItem('user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      applyUserToUI(currentUser);
      showScreen('home');
    } catch (_) {
      showScreen('auth');
    }
  } else {
    showScreen('auth');
  }

  var roomCode = new URLSearchParams(window.location.search).get('room');
  if (roomCode) {
    var el = document.getElementById('roomCode');
    if (el) {
      el.value = roomCode;
      goToJoinRoom();
    }
  }

  setTimeout(hideLoading, 1500);
});

// === Card Selection (Deck Builder) ===
function openCardSelectionModal() {
  var modal = document.getElementById('cardSelectionModal');
  if (!modal) return;
  var list = document.getElementById('cardSelectionList');
  list.innerHTML = SELECTABLE_CARDS.map(function(entry) {
    var ci  = getCardInfo(entry.type);
    var val = (customCardCounts && customCardCounts[entry.type] !== undefined) ? customCardCounts[entry.type] : entry.default;
    var png = ci.img || ('/cards/' + entry.type + '.png');
    var jpg = ci.imgJpg || ('/cards/' + entry.type + '.jpg');
    var onErr = 'this.onerror=function(){this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'};this.src=\'' + jpg + '\'';
    var cardIcon = CARD_ICONS[entry.type] || ICONS.card;
    return '<div class="card-sel-item" id="csi-' + entry.type + '">' +
      '<div style="position:relative;width:70px;height:98px;border-radius:8px;overflow:hidden;flex-shrink:0;box-shadow:0 3px 10px rgba(0,0,0,0.4);">' +
        '<img src="' + png + '" alt="' + ci.name + '" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="' + onErr + '">' +
        '<div style="width:100%;height:100%;display:none;align-items:center;justify-content:center;flex-direction:column;background:' + ci.color + '22;position:absolute;top:0;left:0;">' +
          '<div style="font-size:1.8rem;">' + cardIcon + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-weight:700;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-1);">' + ci.name + '</div>' +
        '<div style="font-size:0.7rem;color:var(--text-3);margin-bottom:10px;">' + ci.desc + '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<button class="btn btn-sm btn-ghost" style="width:32px;height:32px;padding:0;border-radius:8px;font-size:1.1rem;" onclick="adjustCardCount(\'' + entry.type + '\',-1)"><i class="fas fa-minus"></i></button>' +
          '<span id="csc-' + entry.type + '" style="min-width:32px;text-align:center;font-weight:800;font-size:1.15rem;color:var(--gold);">' + val + '</span>' +
          '<button class="btn btn-sm btn-ghost" style="width:32px;height:32px;padding:0;border-radius:8px;font-size:1.1rem;" onclick="adjustCardCount(\'' + entry.type + '\',1)"><i class="fas fa-plus"></i></button>' +
          (t('cardsel.unit') ? '<span style="font-size:0.72rem;color:var(--text-3);">' + t('cardsel.unit') + '</span>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }).join('');
  safeShowModal('cardSelectionModal');
}

function adjustCardCount(type, delta) {
  if (!customCardCounts) {
    customCardCounts = {};
    SELECTABLE_CARDS.forEach(function(e) { customCardCounts[e.type] = e.default; });
  }
  var newVal = Math.max(0, Math.min(10, (customCardCounts[type] || 0) + delta));
  customCardCounts[type] = newVal;
  var el = document.getElementById('csc-' + type);
  if (el) el.textContent = newVal;
}

function resetCardSelection() {
  customCardCounts = null;
  SELECTABLE_CARDS.forEach(function(e) {
    var el = document.getElementById('csc-' + e.type);
    if (el) el.textContent = e.default;
  });
  showToast(ICONS.check + ' ' + t('cardsel.reset'));
}

function saveCardSelection() {
  socket.emit('set-card-counts', { cardCounts: customCardCounts });
  safeHideModal('cardSelectionModal');
  showToast(ICONS.check + ' ' + t('cardsel.saved'));
}

// === UI Text Updater for i18n ===
function updateAllUITexts() {
  ['auth-login-text', 'auth-signup-text', 'admin-menu-text', 'logout-text', 
   'play-again-text', 'card-select-text', 'card-select-text2', 'create-room-text', 
   'start-game-text', 'select-cards-text', 'upload-hint', 'draw-text']
   .forEach(function(cls) {
    var els = document.querySelectorAll('.' + cls);
    els.forEach(function(el) {
      var key = cls.replace(/-text$/, '').replace(/-/g, '.');
      if (key === 'auth.login') el.textContent = t('auth.login');
      else if (key === 'auth.signup') el.textContent = t('auth.signup');
      else if (key === 'admin.menu') el.textContent = t('room.adminPanel');
      else if (key === 'logout') el.textContent = t('room.logout');
      else if (key === 'play.again') el.textContent = t('win.playAgain');
      else if (key === 'create.room') el.textContent = t('room.createRoom');
      else if (key === 'start.game') el.textContent = t('lobby.startGame');
      else if (key === 'select.cards') el.textContent = t('room.selectCards');
      else if (key === 'upload.hint') el.textContent = t('profile.upload');
      else if (key === 'draw') el.textContent = t('game.drawCard');
      else if (key === 'card.select') el.textContent = t('game.selectToPlay');
    });
  });
}