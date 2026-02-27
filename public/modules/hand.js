/**
 * hand.js - จัดการมือไพ่และการเลือกไพ่
 */

var _prevHandCount = 0;
var _previewTimeout = null;
var _touchTimeout = null;
var _touchMoved = false;

function buildCardHTML(card, index, total) {
  var ci = CARD_INFO[card.type];
  var isSelected = gs.selectedCards.indexOf(card.id) !== -1;
  var isNope = card.type === 'nope';
  var imgObj = getCardImg(card);
  var fallbackHTML = '<div class="hand-card-fallback" style="display:flex;">' +
    '<div class="hand-card-emoji">' + (ci ? ci.emoji : '?') + '</div>' +
    '<div class="hand-card-name">' + (ci ? ci.name : card.type) + '</div>' +
    '</div>';
  var innerContent = imgObj
    ? buildImgTag(imgObj, ci ? ci.name : card.type, 'hand-card-img', '') +
      '<div class="hand-card-fallback" style="display:none;"><div class="hand-card-emoji">' + (ci ? ci.emoji : '?') + '</div>' +
      '<div class="hand-card-name">' + (ci ? ci.name : card.type) + '</div></div>'
    : fallbackHTML;
  if (isSelected) innerContent += '<div class="selected-badge">✓</div>';
  return '<div class="hand-card' + (isSelected ? ' selected' : '') + (isNope ? ' nope-card' : '') + '"' +
    ' style="z-index:' + (isSelected ? 60 : index + 1) + ';"' +
    ' onclick="toggleSelectCard(' + card.id + ',\'' + card.type + '\')"' +
    ' onmouseenter="showCardPreview(' + card.id + ',\'' + card.type + '\',event)"' +
    ' onmouseleave="hideCardPreview()"' +
    ' ontouchstart="startCardTouchPreview(' + card.id + ',\'' + card.type + '\',event)"' +
    ' ontouchend="endCardTouchPreview()"' +
    ' ontouchmove="cancelCardTouchPreview()"' +
    ' title="' + (ci ? ci.desc : '') + '">' +
    innerContent + '</div>';
}

function renderHand() {
  var container = document.getElementById('myHand');
  if (!container) return;
  if (gs.isSpectator) {
    container.innerHTML = '<div style="color:var(--text-3);font-style:italic;text-align:center;padding:32px 0;width:100%;">💀 คุณถูกระเบิดแล้ว — กำลังดู Spectator</div>';
    return;
  }
  if (!gs.myHand.length) {
    container.innerHTML = '<div style="color:var(--text-3);text-align:center;padding:32px 0;width:100%;">ไม่มีไพ่ในมือ</div>';
    return;
  }

  var newCount = gs.myHand.length;
  var prevCount = _prevHandCount;
  container.innerHTML = gs.myHand.map(function(card, i) { return buildCardHTML(card, i, gs.myHand.length); }).join('');

  if (newCount > prevCount) {
    var cards = container.querySelectorAll('.hand-card');
    var newCardEls = Array.from(cards).slice(prevCount);
    newCardEls.forEach(function(card, i) {
      card.classList.add('card-fly-in');
      setTimeout(function() { card.classList.remove('card-fly-in'); }, 500);
    });
  }
  _prevHandCount = newCount;

  updatePlayButton();
}

function toggleSelectCard(cardId, cardType) {
  if (!gs.isMyTurn && cardType !== 'nope') {
    showToast('⚠️ ยังไม่ใช่เทิร์นของคุณ');
    return;
  }
  if (cardType === 'nope') {
    if (gs.pendingAction) {
      playSound('nope');
      socket.emit('play-nope', { cardId: cardId });
    } else {
      showToast('⚠️ ไม่มีไพ่ที่จะ Nope ได้ตอนนี้');
    }
    return;
  }
  if (!gs.isMyTurn) return;
  playSound('click');
  var idx = gs.selectedCards.indexOf(cardId);
  if (idx === -1) gs.selectedCards.push(cardId);
  else gs.selectedCards.splice(idx, 1);
  renderHand();
}

function showCardPreview(cardId, cardType, event) {
  clearTimeout(_previewTimeout);
  var ci = CARD_INFO[cardType];
  if (!ci) return;

  var tooltip = document.getElementById('cardPreviewTooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'cardPreviewTooltip';
    tooltip.className = 'card-preview-tooltip';
    document.body.appendChild(tooltip);
  }

  tooltip.innerHTML =
    '<div class="card-preview-content">' +
      '<div class="card-preview-emoji">' + ci.emoji + '</div>' +
      '<div class="card-preview-name">' + ci.name + '</div>' +
      '<div class="card-preview-desc">' + ci.desc + '</div>' +
      '<div class="card-preview-type">' + cardType.toUpperCase().replace(/_/g, ' ') + '</div>' +
    '</div>';

  _previewTimeout = setTimeout(function() {
    var rect = event.target.closest('.hand-card').getBoundingClientRect();
    tooltip.style.left = (rect.left + rect.width/2 - 140) + 'px';
    tooltip.style.top = (rect.top - 160) + 'px';
    tooltip.classList.add('show');
  }, 120);
}

function hideCardPreview() {
  clearTimeout(_previewTimeout);
  var tooltip = document.getElementById('cardPreviewTooltip');
  if (tooltip) tooltip.classList.remove('show');
}

function startCardTouchPreview(cardId, cardType, event) {
  _touchMoved = false;
  clearTimeout(_touchTimeout);
  _touchTimeout = setTimeout(function() {
    if (!_touchMoved) showCardDetailModal(cardId, cardType);
  }, 500);
}

function endCardTouchPreview() {
  clearTimeout(_touchTimeout);
  _touchTimeout = null;
}

function cancelCardTouchPreview() {
  _touchMoved = true;
  clearTimeout(_touchTimeout);
}

function showCardDetailModal(cardId, cardType) {
  var ci = CARD_INFO[cardType];
  if (!ci) return;

  var backdrop = document.createElement('div');
  backdrop.className = 'card-detail-modal-backdrop show';
  backdrop.onclick = function(e) {
    if (e.target === backdrop) closeCardDetailModal();
  };

  var modal = document.createElement('div');
  modal.className = 'card-detail-modal';
  var card = gs.myHand.find(function(c) { return c.id === cardId; });
  var imgObj = card ? getCardImg(card) : null;
  var imgHTML = imgObj ? buildImgTag(imgObj, ci.name, 'card-detail-img', '') : '';
  modal.innerHTML =
    '<div class="card-detail-modal-close" onclick="closeCardDetailModal()">✕</div>' +
    (imgHTML ? '<div style="display:flex;justify-content:center;">' + imgHTML + '</div>' : '') +
    '<div class="card-detail-emoji">' + ci.emoji + '</div>' +
    '<div class="card-detail-name">' + ci.name + '</div>' +
    '<div class="card-detail-desc">' + ci.desc + '</div>' +
    '<div class="card-detail-type">' + cardType.toUpperCase().replace(/_/g, ' ') + '</div>' +
    '<div class="card-detail-hint">👆 แตะ ✕ หรือพื้นที่นอก เพื่อปิด</div>';

  backdrop.appendChild(modal);
  document.body.appendChild(backdrop);

  window._cardDetailBackdrop = backdrop;
}

function closeCardDetailModal() {
  if (window._cardDetailBackdrop) {
    window._cardDetailBackdrop.remove();
    window._cardDetailBackdrop = null;
  }
}
