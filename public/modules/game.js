/**
 * game.js - ไฟล์หลักสำหรับนำเข้า modules ทั้งหมดและ initialization
 * Socket ถูกสร้างไว้แล้วใน game-state.js
 */

// === DOMContentLoaded Initialization ===
document.addEventListener('DOMContentLoaded', function () {
  initTheme();
  setAuthMode('login');

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
    var ci  = CARD_INFO[entry.type];
    var val = (customCardCounts && customCardCounts[entry.type] !== undefined) ? customCardCounts[entry.type] : entry.default;
    var png = ci.img || ('/cards/' + entry.type + '.png');
    var jpg = ci.imgJpg || ('/cards/' + entry.type + '.jpg');
    var onErr = 'this.onerror=function(){this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'};this.src=\'' + jpg + '\'';
    return '<div class="card-sel-item" id="csi-' + entry.type + '">' +
      '<div style="position:relative;width:70px;height:98px;border-radius:8px;overflow:hidden;flex-shrink:0;box-shadow:0 3px 10px rgba(0,0,0,0.4);">' +
        '<img src="' + png + '" alt="' + ci.name + '" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="' + onErr + '">' +
        '<div style="width:100%;height:100%;display:none;align-items:center;justify-content:center;flex-direction:column;background:' + ci.color + '22;position:absolute;top:0;left:0;">' +
          '<div style="font-size:2rem;">' + ci.emoji + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="flex:1;min-width:0;">' +
        '<div style="font-weight:700;font-size:0.85rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--text-1);">' + ci.name + '</div>' +
        '<div style="font-size:0.7rem;color:var(--text-3);margin-bottom:10px;">' + ci.desc + '</div>' +
        '<div style="display:flex;align-items:center;gap:8px;">' +
          '<button class="btn btn-sm btn-ghost" style="width:32px;height:32px;padding:0;border-radius:8px;font-size:1.1rem;" onclick="adjustCardCount(\'' + entry.type + '\',-1)">－</button>' +
          '<span id="csc-' + entry.type + '" style="min-width:32px;text-align:center;font-weight:800;font-size:1.15rem;color:var(--gold);">' + val + '</span>' +
          '<button class="btn btn-sm btn-ghost" style="width:32px;height:32px;padding:0;border-radius:8px;font-size:1.1rem;" onclick="adjustCardCount(\'' + entry.type + '\',1)">＋</button>' +
          '<span style="font-size:0.72rem;color:var(--text-3);">ใบ</span>' +
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
  showToast('✅ รีเซ็ตเป็นค่าเริ่มต้นแล้ว');
}

function saveCardSelection() {
  socket.emit('set-card-counts', { cardCounts: customCardCounts });
  safeHideModal('cardSelectionModal');
  showToast('✅ บันทึกการ์ดที่เลือกแล้ว');
}
