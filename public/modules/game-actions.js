/**
 * game-actions.js - ฟังก์ชันการกระทำหลักในเกม
 * [UPDATED] ใช้ ICONS แทน emoji และ t() แทน hardcoded strings
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
    btn.textContent = t('game.selectToPlay');
    return;
  }
  btn.disabled = false;
  gs.catMode = null;
  if (n === 1) {
    var ci = getCardInfo(mainType);
    if (CAT_TYPES.indexOf(mainType) !== -1) {
      btn.innerHTML = (CARD_ICONS[mainType] || ICONS.cat) + ' ' + t('card.singleCatNoEffect', { name: ci.name });
      btn.disabled = true;
    } else if (mainType === 'exploding_kitten') {
      btn.innerHTML = ICONS.warning + ' ' + t('card.cannotPlay');
      btn.disabled = true;
    } else if (mainType === 'defuse') {
      btn.innerHTML = ICONS.warning + ' ' + t('card.cannotDefuse');
      btn.disabled = true;
    } else {
      btn.innerHTML = (CARD_ICONS[mainType] || ICONS.card) + ' ' + t('card.playCard', { name: ci.name });
    }
  } else {
    var allSame = types.every(function(t) { return t === mainType; });
    var allCat  = types.every(function(t) { return CAT_TYPES.indexOf(t) !== -1; });
    var allDiff = (new Set(types)).size === types.length;
    if (n === 2 && allSame && CAT_TYPES.indexOf(mainType) !== -1) {
      btn.innerHTML = ICONS.cat + ' ' + t('card.steal2');
      gs.catMode = 'steal2';
    } else if (n === 3 && allSame && CAT_TYPES.indexOf(mainType) !== -1) {
      btn.innerHTML = ICONS.cat + ' ' + t('card.steal3');
      gs.catMode = 'steal3';
    } else if (n === 5 && allCat && allDiff) {
      btn.innerHTML = ICONS.cat + ' ' + t('card.steal5');
      gs.catMode = 'steal5';
    } else {
      btn.innerHTML = ICONS.warning + ' ' + t('card.invalidCombo');
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
  if (titleEl) titleEl.innerHTML = ICONS.target + ' ' + t('modal.targetTitle');
  if (descEl) {
    if (mainType === 'favor') descEl.textContent = t('modal.targetFavor');
    else if (gs.catMode === 'steal2') descEl.textContent = t('modal.targetSteal2');
    else if (gs.catMode === 'steal3') descEl.textContent = t('modal.targetSteal3');
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
          '<div style="font-size:0.75rem;color:var(--text-3);">' + ICONS.card + ' ' + t('misc.cards', { n: count }) + '</div>' +
        '</div>' +
        '<div style="color:var(--gold);font-size:1rem;"><i class="fas fa-chevron-right"></i></div>' +
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
  if (pos === 0) label = t('modal.insertTop');
  else if (pos >= total) label = t('modal.insertBottom');
  else label = t('modal.insertMid', { pos: pos, rem: total - pos });
  document.getElementById('insertPositionLabel').textContent = label;
}

function confirmInsert() {
  socket.emit('insert-exploding-kitten', { position: insertPosition });
  safeHideModal('insertModal');
}

function openFavorModal(favorData) {
  var listEl = document.getElementById('favorCardList');
  if (!listEl) return;
  var msgEl = document.getElementById('favorMessage');
  if (msgEl) msgEl.textContent = t('modal.favorPrompt');
  listEl.innerHTML = favorData.cards.map(function(c) {
    var ci = getCardInfo(c.type);
    var icon = CARD_ICONS[c.type] || ICONS.card;
    return '<div class="favor-card-option" onclick="giveFavor(' + c.id + ')" style="cursor:pointer;">' +
      icon + ' ' + (ci ? ci.name : c.type) +
    '</div>';
  }).join('');
  safeShowModal('favorModal', { backdrop: 'static' });
}

function giveFavor(cardId) {
  socket.emit('give-card', { cardId: cardId });
  gs.myCardSelectionAction = null;
  renderGameScreen();
  safeHideModal('favorModal');
}

function openSteal3Modal(data) {
  var listEl = document.getElementById('steal3CardList');
  if (!listEl) return;
  var nameEl = document.getElementById('steal3TargetName');
  if (nameEl) nameEl.textContent = data.targetName || '?';
  var types = data.cardTypes || data.cards || [];
  listEl.innerHTML = (types || []).map(function(type) {
    var ci = getCardInfo(type);
    if (!ci) return '';
    var icon = CARD_ICONS[type] || ICONS.card;
    return '<div class="steal3-card-option" onclick="stealCard3(\'' + type + '\')" style="cursor:pointer;">' +
      icon + ' ' + ci.name +
    '</div>';
  }).join('');
  safeShowModal('steal3Modal');
}

function stealCard3(cardType) {
  socket.emit('steal-card-type', { cardType: cardType });
  safeHideModal('steal3Modal');
}

function openDiscard5Modal(data) {
  var listEl = document.getElementById('discard5CardList');
  if (!listEl) return;
  listEl.innerHTML = (data.cards || []).map(function(c) {
    var ci = getCardInfo(c.type);
    if (!ci) return '';
    var icon = CARD_ICONS[c.type] || ICONS.card;
    return '<div class="discard5-card-option" onclick="takeFromDiscard(\'' + c.type + '\')" style="cursor:pointer;">' +
      icon + ' ' + ci.name +
    '</div>';
  }).join('');
  safeShowModal('discard5Modal');
}

function takeFromDiscard(cardType) {
  socket.emit('take-from-discard', { cardType: cardType });
  safeHideModal('discard5Modal');
}

function openAdminPanel() {
  renderAdminRoomPlayers();
  safeShowModal('adminPanelModal', { backdrop: 'static' });
}

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
  var editor = document.getElementById('adminRankEditor');
  if (editor) editor.style.display = 'block';
  var nameEl = document.getElementById('adminTargetName');
  if (nameEl) nameEl.textContent = t('admin.target', { name: displayName });
  var emailEl = document.getElementById('adminTargetEmail');
  if (emailEl && email) emailEl.textContent = email;
}

function adminApplyRank() {
  if (!adminTargetId) { showToast(ICONS.warning + ' ' + t('admin.selectPlayer')); return; }
  socket.emit('admin-set-rank', {
    targetUserId: adminTargetId,
    rankName: document.getElementById('adminRankName').value.trim(),
    rankColor: document.getElementById('adminRankColor').value
  });
  showToast(ICONS.check + ' ' + t('admin.saved'));
}

function adminSearchUser() {
  var email = document.getElementById('adminSearchEmail').value.trim();
  if (!email) { showToast(ICONS.warning + ' ' + t('admin.enterEmail')); return; }
  socket.emit('admin-search-user', { email: email });
}

// === New Card Mechanics ===

function openAlterFutureModal(cardData) {
  var listEl = document.getElementById('alterFutureCardsList');
  if (!listEl) return;
  listEl.innerHTML = (cardData.cards || []).map(function(c, i) {
    var ci = getCardInfo(c.type);
    if (!ci) return '';
    var imgObj = getCardImg(c);
    var imgTag = imgObj ? buildImgTag(imgObj, ci.name, 'future-card-img', '') : '';
    return '<div class="alter-future-card" data-index="' + i + '" style="background:' + ci.color + '15;border:1px solid ' + ci.color + '40;cursor:move;padding:12px;border-radius:8px;margin-bottom:8px;user-select:none;display:flex;align-items:center;gap:12px;">' +
      '<div style="font-size:1rem;color:var(--text-3);"><i class="fas fa-grip-lines"></i></div>' +
      (imgTag ? '<div style="width:50px;height:72px;border-radius:6px;overflow:hidden;flex-shrink:0;">' + imgTag + '</div>' : '') +
      '<div>' +
        '<div style="font-size:1rem;">' + (CARD_ICONS[c.type] || ICONS.card) + '</div>' +
        '<div style="font-weight:700;">' + ci.name + '</div>' +
        '<div style="font-size:0.75rem;opacity:0.5;">' + t('alter.pos', { n: i + 1 }) + '</div>' +
      '</div>' +
      '<div style="margin-left:auto;display:flex;flex-direction:column;gap:4px;">' +
        (i > 0 ? '<button onclick="moveAlterCard(' + i + ',-1)" style="background:rgba(255,255,255,0.1);border:none;color:white;padding:2px 8px;border-radius:4px;cursor:pointer;"><i class="fas fa-chevron-up"></i></button>' : '') +
        (i < (cardData.cards.length-1) ? '<button onclick="moveAlterCard(' + i + ',1)" style="background:rgba(255,255,255,0.1);border:none;color:white;padding:2px 8px;border-radius:4px;cursor:pointer;"><i class="fas fa-chevron-down"></i></button>' : '') +
      '</div>' +
    '</div>';
  }).join('');
  document.getElementById('alterFutureCardData').value = JSON.stringify(cardData.cards.map(function(c) { return c.id; }));
  safeShowModal('alterFutureModal', { backdrop: 'static' });
}

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
    gs.myCardSelectionAction = null;
    renderGameScreen();
    safeHideModal('alterFutureModal');
  } catch (e) {
    showToast(ICONS.warning + ' ' + t('misc.error'));
  }
}

function openClairvoyanceModal(clairvoyanceData) {
  var el = document.getElementById('clairvoyanceContent');
  if (!el) return;
  var msg = clairvoyanceData.insertionIndex !== undefined
    ? t('clair.inserted', { pos: clairvoyanceData.insertionIndex + 1 })
    : t('clair.notYet');
  el.innerHTML = '<div style="text-align:center;padding:16px;"><strong>' + msg + '</strong></div>';
  safeShowModal('clairvoyanceModal', { backdrop: 'static', keyboard: false });
}

function openDigDeeperModal(digData) {
  var listEl = document.getElementById('digDeeperCardsList');
  if (!listEl) return;
  listEl.innerHTML = (digData.cards || []).map(function(c, i) {
    var ci = getCardInfo(c.type);
    if (!ci) return '';
    var imgObj = getCardImg(c);
    var imgTag = imgObj ? buildImgTag(imgObj, ci.name, 'dig-card-img', '') : '';
    return '<div class="dig-card-item" style="background:' + ci.color + '15;border:1px solid ' + ci.color + '40;padding:12px;border-radius:8px;margin-bottom:8px;display:flex;gap:12px;align-items:center;">' +
      '<div style="flex:1;display:flex;align-items:center;gap:10px;">' +
        (imgTag ? '<div style="width:50px;height:72px;border-radius:6px;overflow:hidden;flex-shrink:0;display:flex;align-items:center;justify-content:center;">' + imgTag.replace(/<img /i, '<img style="width:100%;height:100%;object-fit:cover;" ') + '</div>' : '') +
        '<div>' +
          '<div style="font-size:1rem;">' + (CARD_ICONS[c.type] || ICONS.card) + '</div>' +
          '<div style="font-weight:700;">' + ci.name + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;">' +
        '<button class="btn btn-sm btn-success" onclick="selectDigCard(' + c.id + ', false)">' + t('dig.keep') + '</button>' +
        '<button class="btn btn-sm btn-outline-secondary" onclick="selectDigCard(' + c.id + ', true)">' + t('dig.return') + '</button>' +
      '</div>' +
    '</div>';
  }).join('');
  safeShowModal('digDeeperModal', { backdrop: 'static' });
}

function selectDigCard(cardId, returnToBottom) {
  socket.emit('dig-deeper-choice', { cardId: cardId, returnToBottom: !!returnToBottom });
  gs.myCardSelectionAction = null;
  renderGameScreen();
  safeHideModal('digDeeperModal');
}

function openDrawFromBottomModal(drawData) {
  var el = document.getElementById('drawFromBottomContent');
  if (!el) return;
  var turnsRemaining = (drawData.attackTurnsRemaining || 1) - 1;
  el.innerHTML = '<div style="text-align:center;padding:16px;">' +
    '<div style="font-size:2rem;margin-bottom:12px;">' + ICONS.drawBottom + '</div>' +
    '<strong>' + t('drawBottom.success') + '</strong><br>' +
    '<span style="color:var(--text-2);font-size:0.9rem;">' + t('drawBottom.sub') + '</span>' +
    (turnsRemaining > 0
      ? '<br><br><span style="color:#f97316;">' + ICONS.warning + ' ' + t('drawBottom.remain', { n: turnsRemaining }) + '</span>'
      : '<br><br><span style="color:#22c55e;">' + ICONS.check + ' ' + t('drawBottom.done') + '</span>') +
    '</div>';
  safeShowModal('drawFromBottomModal', { backdrop: 'static', keyboard: false });
}

function openReverseModal(reverseData) {
  var el = document.getElementById('reverseContent');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:16px;"><strong>' + (reverseData.twoPlayerMode ? t('reverse.twoP') : t('reverse.normal')) + '</strong></div>';
  safeShowModal('reverseModal', { backdrop: 'static', keyboard: false });
}

function closeSpecialCardModal(modalId) {
  safeHideModal(modalId);
}