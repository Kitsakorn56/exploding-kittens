/**
 * game-actions.js - ฟังก์ชันการกระทำหลักในเกม
 * 
 * FIX:
 * - openFavorModal: เปลี่ยน 'favorCardsList' → 'favorCardList' (ตรงกับ HTML)
 * - openSteal3Modal: เปลี่ยน 'steal3CardsList' → 'steal3CardList'
 * - openDiscard5Modal: เปลี่ยน 'discard5CardsList' → 'discard5CardList'
 * - openAdminPanel: เปลี่ยน safeShowModal('adminPanel') → safeShowModal('adminPanelModal')
 * - renderAdminRoomPlayers: เปลี่ยน 'adminPlayersList' → 'adminRoomPlayersList'
 * - เพิ่ม favorMessage text
 */

var insertPosition = 0;
var insertDeckSize = 0;

function updatePlayButton() {
  var btn = document.getElementById('playCardBtn');
  if (!btn) return;
  var n = gs.selectedCards.length;
  var cards = gs.myHand.filter(function(c) { return gs.selectedCards.indexOf(c.id) !== -1; });
  var types = cards.map(function(c) { return c.type; });
  var mainType = types[0];
  if (n === 0) {
    btn.disabled = true;
    btn.textContent = 'เลือกไพ่เพื่อเล่น';
    return;
  }
  btn.disabled = false;
  gs.catMode = null; // reset ก่อน
  if (n === 1) {
    var ci = CARD_INFO[mainType];
    if (CAT_TYPES.indexOf(mainType) !== -1) {
      btn.textContent = ci.emoji + ' ใบเดียวไม่มีผล';
      btn.disabled = true;
    } else if (mainType === 'exploding_kitten') {
      btn.textContent = '❌ ไม่สามารถเล่นได้';
      btn.disabled = true;
    } else if (mainType === 'defuse') {
      btn.textContent = '❌ ไม่สามารถเล่น Defuse โดยตรง';
      btn.disabled = true;
    } else {
      btn.textContent = 'เล่น ' + ci.emoji + ' ' + ci.name;
    }
  } else {
    var allSame = types.every(function(t) { return t === mainType; });
    var allCat  = types.every(function(t) { return CAT_TYPES.indexOf(t) !== -1; });
    var allDiff = (new Set(types)).size === types.length;
    if (n === 2 && allSame && CAT_TYPES.indexOf(mainType) !== -1) {
      btn.textContent = '🐱 2 ใบ — ขโมยไพ่สุ่ม (เลือกเป้าหมาย)';
      gs.catMode = 'steal2';
    } else if (n === 3 && allSame && CAT_TYPES.indexOf(mainType) !== -1) {
      btn.textContent = '🐱 3 ใบ — ขโมยไพ่ที่ต้องการ (เลือกเป้าหมาย)';
      gs.catMode = 'steal3';
    } else if (n === 5 && allCat && allDiff) {
      btn.textContent = '🐱🐱🐱 5 ใบ — เลือกจากกองทิ้ง';
      gs.catMode = 'steal5';
    } else {
      btn.textContent = '⚠️ ไพ่ที่เลือกไม่ถูกต้อง';
      btn.disabled = true;
    }
  }
}

function playSelectedCards() {
  var cards = gs.myHand.filter(function(c) { return gs.selectedCards.indexOf(c.id) !== -1; });
  if (!cards.length) return;
  var mainType = cards[0].type;
  var needsTarget = mainType === 'favor' || gs.catMode === 'steal2' || gs.catMode === 'steal3';
  if (needsTarget && !gs.catTarget) {
    openTargetPickerModal();
    return;
  }
  if (gs.catMode === 'steal5') {
    socket.emit('play-card', { cardIds: gs.selectedCards, catMode: 'steal5' });
  } else {
    socket.emit('play-card', { cardIds: gs.selectedCards, targetPlayerId: gs.catTarget, catMode: gs.catMode });
  }
  gs.selectedCards = [];
  gs.catMode = null;
  gs.catTarget = null;
  renderHand();
}

function openTargetPickerModal() {
  var cards = gs.myHand.filter(function(c) { return gs.selectedCards.indexOf(c.id) !== -1; });
  var mainType = cards.length ? cards[0].type : '';
  var titleEl = document.getElementById('targetPickerTitle');
  var descEl  = document.getElementById('targetPickerDesc');
  var listEl  = document.getElementById('targetPickerList');
  if (!listEl) return;
  if (titleEl) titleEl.textContent = '🎯 เลือกเป้าหมาย';
  if (descEl) {
    if (mainType === 'favor') descEl.textContent = 'เลือกผู้เล่นที่ต้องการขอไพ่ (Favor)';
    else if (gs.catMode === 'steal2') descEl.textContent = 'เลือกผู้เล่นที่ต้องการขโมยไพ่สุ่ม 1 ใบ';
    else if (gs.catMode === 'steal3') descEl.textContent = 'เลือกผู้เล่นที่ต้องการขโมยไพ่ที่ระบุ';
  }
  listEl.innerHTML = gs.alivePlayers
    .filter(function(pid) { return pid !== gs.myId; })
    .map(function(pid) {
      var name = gs.playerNames[pid] || '?';
      var count = gs.handCounts[pid] || 0;
      var avatar = getAvatarHTML(gs.playerAvatars && gs.playerAvatars[pid], name, 44);
      return '<div class="target-pick-item" onclick="confirmTargetPick(\'' + pid + '\')">' +
        avatar +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-weight:700;font-size:0.95rem;">' + escHtml(name) + '</div>' +
          '<div style="font-size:0.75rem;color:var(--text-3);">🃏 ' + count + ' ใบ</div>' +
        '</div>' +
        '<div style="color:var(--gold);font-size:1.2rem;">→</div>' +
      '</div>';
    }).join('');
  safeShowModal('targetPickerModal', { backdrop: 'static' });
}

function confirmTargetPick(pid) {
  gs.catTarget = pid;
  safeHideModal('targetPickerModal');
  var cards = gs.myHand.filter(function(c) { return gs.selectedCards.indexOf(c.id) !== -1; });
  if (!cards.length) return;
  socket.emit('play-card', { cardIds: gs.selectedCards, targetPlayerId: gs.catTarget, catMode: gs.catMode });
  gs.selectedCards = [];
  gs.catMode = null;
  gs.catTarget = null;
  renderHand();
}

function cancelTargetPick() {
  safeHideModal('targetPickerModal');
}

function highlightTargetable() {}
function selectCatTarget(pid) {}

function drawCard() {
  playSound('draw');
  socket.emit('draw-card');
}

function openInsertModal(deckSize) {
  insertDeckSize = deckSize;
  insertPosition = Math.floor(deckSize / 2);
  document.getElementById('insertSlider').max = deckSize;
  document.getElementById('insertSlider').value = insertPosition;
  updateInsertLabel();
  insertModalInstance = safeShowModal('insertModal', { backdrop: 'static', keyboard: false });
}

function updateInsertLabel() {
  var pos = parseInt(document.getElementById('insertSlider').value);
  insertPosition = pos;
  var total = insertDeckSize;
  var label;
  if (pos === 0) label = 'บนสุดของกอง (อันตรายมาก!)';
  else if (pos >= total) label = 'ล่างสุดของกอง (ปลอดภัยที่สุด)';
  else label = 'ตำแหน่งที่ ' + pos + ' จากบน (มี ' + (total - pos) + ' ใบรองรับ)';
  document.getElementById('insertPositionLabel').textContent = label;
}

function confirmInsert() {
  socket.emit('insert-exploding-kitten', { position: insertPosition });
  safeHideModal('insertModal');
}

// FIX: ใช้ 'favorCardList' (ตรงกับ HTML id="favorCardList")
function openFavorModal(favorData) {
  var listEl = document.getElementById('favorCardList');
  if (!listEl) return;
  var msgEl = document.getElementById('favorMessage');
  if (msgEl) msgEl.textContent = 'คุณถูกขอ Favor! เลือกไพ่ 1 ใบเพื่อให้';
  listEl.innerHTML = favorData.cards.map(function(c) {
    var ci = CARD_INFO[c.type];
    return '<div class="favor-card-option" onclick="giveFavor(' + c.id + ')" style="cursor:pointer;">' +
      (ci ? ci.emoji : '🃏') + ' ' + (ci ? ci.name : c.type) +
    '</div>';
  }).join('');
  safeShowModal('favorModal', { backdrop: 'static' });
}

function giveFavor(cardId) {
  socket.emit('give-card', { cardId: cardId });
  safeHideModal('favorModal');
}

// FIX: ใช้ 'steal3CardList' (ตรงกับ HTML id="steal3CardList")
function openSteal3Modal(data) {
  var listEl = document.getElementById('steal3CardList');
  if (!listEl) return;
  var nameEl = document.getElementById('steal3TargetName');
  if (nameEl) nameEl.textContent = gs.playerNames[data.targetId] || '?';
  listEl.innerHTML = data.cards.map(function(ct) {
    var ci = CARD_INFO[ct];
    return '<div class="steal-card-option" onclick="stealCardType(\'' + ct + '\',\'' + data.targetId + '\')" style="cursor:pointer;">' +
      (ci ? ci.emoji + ' ' + ci.name : ct) +
    '</div>';
  }).join('');
  safeShowModal('steal3Modal', { backdrop: 'static' });
}

function stealCardType(cardType, targetId) {
  socket.emit('steal-card-type', { cardType: cardType, targetId: targetId });
  safeHideModal('steal3Modal');
}

// FIX: ใช้ 'discard5CardList' (ตรงกับ HTML id="discard5CardList")
function openDiscard5Modal(data) {
  var listEl = document.getElementById('discard5CardList');
  if (!listEl) return;
  listEl.innerHTML = data.cards.map(function(c) {
    var ci = CARD_INFO[c.type];
    return '<div class="favor-card-option" onclick="takeFromDiscard(\'' + c.type + '\')" style="cursor:pointer;">' +
      (ci ? ci.emoji : '🃏') + ' ' + (ci ? ci.name : c.type) +
    '</div>';
  }).join('');
  safeShowModal('discard5Modal', { backdrop: 'static' });
}

function takeFromDiscard(cardType) {
  socket.emit('take-from-discard', { cardType: cardType });
  safeHideModal('discard5Modal');
}

// FIX: แก้ 'adminPanel' → 'adminPanelModal' ให้ตรงกับ HTML modal id
function openAdminPanel() {
  renderAdminRoomPlayers();
  safeShowModal('adminPanelModal', { backdrop: 'static' });
}

// FIX: แก้ 'adminPlayersList' → 'adminRoomPlayersList' ให้ตรงกับ HTML
function renderAdminRoomPlayers() {
  var listEl = document.getElementById('adminRoomPlayersList');
  if (!listEl) return;
  listEl.innerHTML = gs.players.map(function(pid) {
    var name = gs.playerNames[pid] || '?';
    return '<div style="padding:8px;border-bottom:1px solid rgba(255,255,255,0.1);cursor:pointer;border-radius:6px;" onclick="adminSelectTarget(\'' + pid + '\',\'' + escHtml(name) + '\',null)">' +
      '<strong>' + escHtml(name) + '</strong>' +
    '</div>';
  }).join('');
}

var adminTargetId = null;

function adminSelectTarget(userId, displayName, email) {
  adminTargetId = userId;
  // แสดง editor panel
  var editor = document.getElementById('adminRankEditor');
  if (editor) editor.style.display = 'block';
  var nameEl = document.getElementById('adminTargetName');
  if (nameEl) nameEl.textContent = 'เป้าหมาย: ' + displayName;
  var emailEl = document.getElementById('adminTargetEmail');
  if (emailEl && email) emailEl.textContent = email;
}

function adminApplyRank() {
  if (!adminTargetId) { showToast('⚠️ โปรดเลือกผู้เล่น'); return; }
  socket.emit('admin-set-rank', {
    targetUserId: adminTargetId,
    rankName: document.getElementById('adminRankName').value.trim(),
    rankColor: document.getElementById('adminRankColor').value
  });
  showToast('✅ บันทึกยศแล้ว');
}

function adminSearchUser() {
  var email = document.getElementById('adminSearchEmail').value.trim();
  if (!email) { showToast('⚠️ กรุณากรอก Email'); return; }
  socket.emit('admin-search-user', { email: email });
}

// === New Card Mechanics ===

function openAlterFutureModal(cardData) {
  var listEl = document.getElementById('alterFutureCardsList');
  if (!listEl) return;
  listEl.innerHTML = (cardData.cards || []).map(function(c, i) {
    var ci = CARD_INFO[c.type];
    if (!ci) return '';
    var imgObj = getCardImg(c);
    var imgTag = imgObj ? buildImgTag(imgObj, ci.name, 'future-card-img', '') : '';
    return '<div class="alter-future-card" data-index="' + i + '" style="background:' + ci.color + '15;border:1px solid ' + ci.color + '40;cursor:move;padding:12px;border-radius:8px;margin-bottom:8px;user-select:none;display:flex;align-items:center;gap:12px;">' +
      '<div style="font-size:1.5rem;">☰</div>' +
      (imgTag ? '<div style="width:50px;height:72px;border-radius:6px;overflow:hidden;flex-shrink:0;">' + imgTag + '</div>' : '') +
      '<div>' +
        '<div style="font-size:1.1rem;">' + ci.emoji + '</div>' +
        '<div style="font-weight:700;">' + ci.name + '</div>' +
        '<div style="font-size:0.75rem;opacity:0.5;">ตำแหน่ง ' + (i+1) + '</div>' +
      '</div>' +
      '<div style="margin-left:auto;display:flex;flex-direction:column;gap:4px;">' +
        (i > 0 ? '<button onclick="moveAlterCard(' + i + ',-1)" style="background:rgba(255,255,255,0.1);border:none;color:white;padding:2px 8px;border-radius:4px;cursor:pointer;">▲</button>' : '') +
        (i < (cardData.cards.length-1) ? '<button onclick="moveAlterCard(' + i + ',1)" style="background:rgba(255,255,255,0.1);border:none;color:white;padding:2px 8px;border-radius:4px;cursor:pointer;">▼</button>' : '') +
      '</div>' +
    '</div>';
  }).join('');
  document.getElementById('alterFutureCardData').value = JSON.stringify(cardData.cards.map(function(c) { return c.id; }));
  safeShowModal('alterFutureModal', { backdrop: 'static' });
}

// Helper: เลื่อนการ์ดขึ้น/ลงใน alterFuture
function moveAlterCard(index, direction) {
  var orderStr = document.getElementById('alterFutureCardData').value;
  try {
    var order = JSON.parse(orderStr);
    var newIndex = index + direction;
    if (newIndex < 0 || newIndex >= order.length) return;
    var tmp = order[index];
    order[index] = order[newIndex];
    order[newIndex] = tmp;
    document.getElementById('alterFutureCardData').value = JSON.stringify(order);
    // re-render โดยดึง cards จาก order
    var listEl = document.getElementById('alterFutureCardsList');
    if (listEl) {
      var items = Array.from(listEl.querySelectorAll('.alter-future-card'));
      if (newIndex >= 0 && newIndex < items.length) {
        if (direction === -1) {
          listEl.insertBefore(items[index], items[newIndex]);
        } else {
          listEl.insertBefore(items[newIndex], items[index]);
        }
      }
    }
  } catch(e) {}
}

function confirmAlterFuture() {
  var orderStr = document.getElementById('alterFutureCardData').value;
  try {
    var order = JSON.parse(orderStr);
    socket.emit('alter-future-result', { newOrder: order });
    safeHideModal('alterFutureModal');
  } catch (e) {
    showToast('⚠️ เกิดข้อผิดพลาด');
  }
}

function openClairvoyanceModal(clairvoyanceData) {
  var el = document.getElementById('clairvoyanceContent');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:16px;"><strong>' + 
    (clairvoyanceData.insertionIndex !== undefined ? 
      'Exploding Kitten จะถูกใส่ที่ตำแหน่งที่ ' + (clairvoyanceData.insertionIndex + 1) 
      : 'ยังไม่ได้ใส่ Exploding Kitten') +
    '</strong></div>';
  safeShowModal('clairvoyanceModal', { backdrop: 'static', keyboard: false });
}

function openDigDeeperModal(digData) {
  var listEl = document.getElementById('digDeeperCardsList');
  if (!listEl) return;
  listEl.innerHTML = (digData.cards || []).map(function(c, i) {
    var ci = CARD_INFO[c.type];
    if (!ci) return '';
    var imgObj = getCardImg(c);
    var imgTag = imgObj ? buildImgTag(imgObj, ci.name, 'dig-card-img', '') : '';
    return '<div class="dig-card-item" style="background:' + ci.color + '15;border:1px solid ' + ci.color + '40;padding:12px;border-radius:8px;margin-bottom:8px;display:flex;gap:12px;align-items:center;">' +
      '<div style="flex:1;display:flex;align-items:center;gap:10px;">' +
        (imgTag ? '<div style="width:50px;height:72px;border-radius:6px;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;">' + imgTag.replace(/<img /i, '<img style="width:100%;height:100%;object-fit:cover;" ') + '</div>' : '') +
        '<div>' +
          '<div style="font-size:1.2rem;">' + ci.emoji + '</div>' +
          '<div style="font-weight:700;">' + ci.name + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;">' +
        '<button class="btn btn-sm btn-success" onclick="selectDigCard(' + c.id + ', false)">เก็บไว้</button>' +
        '<button class="btn btn-sm btn-outline-secondary" onclick="selectDigCard(' + c.id + ', true)">คืนกอง</button>' +
      '</div>' +
    '</div>';
  }).join('');
  safeShowModal('digDeeperModal', { backdrop: 'static' });
}

function selectDigCard(cardId, returnToBottom) {
  socket.emit('dig-deeper-choice', { cardId: cardId, returnToBottom: !!returnToBottom });
  safeHideModal('digDeeperModal');
}

function openDrawFromBottomModal(drawData) {
  var el = document.getElementById('drawFromBottomContent');
  if (!el) return;
  var turnsRemaining = (drawData.attackTurnsRemaining || 1) - 1;
  el.innerHTML = '<div style="text-align:center;padding:16px;">' +
    '<div style="font-size:2.5rem;margin-bottom:12px;">⬇️</div>' +
    '<strong>ป้องกัน Attack สำเร็จ!</strong><br>' +
    '<span style="color:var(--text-2);font-size:0.9rem;">จั่วจากใบล่างของกอง</span>' +
    (turnsRemaining > 0 ? '<br><br><span style="color:#f97316;">⚠️ ยังคงต้องเล่นอีก ' + turnsRemaining + ' เทิร์น</span>' : '<br><br><span style="color:#22c55e;">✅ Attack หมดแล้ว!</span>') +
    '</div>';
  safeShowModal('drawFromBottomModal', { backdrop: 'static', keyboard: false });
}

function openReverseModal(reverseData) {
  var el = document.getElementById('reverseContent');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:16px;">' +
    '<div style="font-size:2.5rem;margin-bottom:12px;">🔄</div>' +
    (reverseData.twoPlayerMode ? 
      '<strong>Reverse ใน 2 ผู้เล่น — ทำหน้าที่เป็น Skip</strong>' :
      '<strong>ลำดับการเล่นถูกย้อนแล้ว!</strong>') +
    '</div>';
  safeShowModal('reverseModal', { backdrop: 'static', keyboard: false });
}

function closeSpecialCardModal(modalId) {
  safeHideModal(modalId);
}