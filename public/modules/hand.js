/**
 * hand.js - จัดการมือไพ่และการเลือกไพ่
 * [UPDATED] ใช้ ICONS แทน emoji และ t() แทน hardcoded strings
 */

var _prevHandCount = 0;

// ─── Card Tooltip ─────────────────────────────────────────────────────────────
var _tooltipEl     = null;
var _tooltipTimer  = null;
var _tooltipVisible = false;

function getOrCreateTooltip() {
  if (!_tooltipEl) {
    _tooltipEl = document.createElement('div');
    _tooltipEl.id = 'cardTooltip';
    _tooltipEl.className = 'card-tooltip';
    document.body.appendChild(_tooltipEl);
  }
  return _tooltipEl;
}

function showCardTooltip(cardEl, ci) {
  if (!ci) return;
  var tip = getOrCreateTooltip();
  tip.innerHTML =
    '<div class="card-tooltip-emoji">' + (CARD_ICONS[ci._type] || ICONS.card) + '</div>' +
    '<div class="card-tooltip-body">' +
      '<div class="card-tooltip-name">' + ci.name + '</div>' +
      '<div class="card-tooltip-desc">' + ci.desc + '</div>' +
    '</div>';
  tip.style.opacity = '0';
  tip.style.display = 'flex';
  tip.style.pointerEvents = 'none';
  var rect = cardEl.getBoundingClientRect();
  var tipW = tip.offsetWidth || 220;
  var tipH = tip.offsetHeight || 64;
  var margin = 10;
  var left = rect.left + rect.width / 2 - tipW / 2;
  var top  = rect.top - tipH - margin;
  left = Math.max(margin, Math.min(left, window.innerWidth - tipW - margin));
  if (top < margin) top = rect.bottom + margin;
  tip.style.left = left + 'px';
  tip.style.top  = top + 'px';
  requestAnimationFrame(function() {
    tip.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
    tip.style.transform = 'translateY(4px) scale(0.97)';
    requestAnimationFrame(function() {
      tip.style.opacity = '1';
      tip.style.transform = 'translateY(0) scale(1)';
    });
  });
  _tooltipVisible = true;
}

function hideCardTooltip() {
  clearTimeout(_tooltipTimer);
  _tooltipTimer = null;
  if (_tooltipEl && _tooltipVisible) {
    _tooltipEl.style.transition = 'opacity 0.15s ease';
    _tooltipEl.style.opacity = '0';
    setTimeout(function() { if (_tooltipEl) _tooltipEl.style.display = 'none'; }, 160);
    _tooltipVisible = false;
  }
}

function attachCardTooltip(el, ci) {
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  el.addEventListener('mouseenter', function() {
    clearTimeout(_tooltipTimer);
    _tooltipTimer = setTimeout(function() { showCardTooltip(el, ci); }, 420);
  });
  el.addEventListener('mouseleave', function() {
    clearTimeout(_tooltipTimer);
    hideCardTooltip();
  });
}

// ─── Card Info Popup ──────────────────────────────────────────────────────────
var _cardInfoPopupEl = null;

function getOrCreateCardInfoPopup() {
  if (!_cardInfoPopupEl) {
    _cardInfoPopupEl = document.createElement('div');
    _cardInfoPopupEl.id = 'cardInfoPopup';
    _cardInfoPopupEl.className = 'card-info-popup';
    _cardInfoPopupEl.innerHTML =
      '<div class="cip-backdrop" onclick="hideCardInfoPopup()"></div>' +
      '<div class="cip-panel">' +
        '<button class="cip-close" onclick="hideCardInfoPopup()"><i class="fas fa-times"></i></button>' +
        '<div class="cip-img-wrap" id="cipImgWrap"></div>' +
        '<div class="cip-name" id="cipName"></div>' +
        '<div class="cip-desc" id="cipDesc"></div>' +
      '</div>';
    document.body.appendChild(_cardInfoPopupEl);
  }
  return _cardInfoPopupEl;
}

function showCardInfoPopup(card) {
  var ci = getCardInfo(card.type);
  if (!ci) return;
  var popup = getOrCreateCardInfoPopup();

  var imgObj = getCardImg(card);
  var wrap = popup.querySelector('#cipImgWrap');
  if (imgObj) {
    var png = imgObj.png || imgObj;
    var jpg = imgObj.jpg || null;
    var onErr = jpg
      ? 'this.onerror=function(){this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'};this.src=\'' + jpg + '\''
      : 'this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'';
    wrap.innerHTML =
      '<img src="' + png + '" alt="' + ci.name + '" class="cip-img" onerror="' + onErr + '">' +
      '<div class="cip-img-fallback" style="display:none;background:' + ci.color + '22;">' +
        '<span style="font-size:2.2rem;">' + (CARD_ICONS[card.type] || ICONS.card) + '</span>' +
      '</div>';
  } else {
    wrap.innerHTML =
      '<div class="cip-img-fallback" style="display:flex;background:' + ci.color + '22;">' +
        '<span style="font-size:2.2rem;">' + (CARD_ICONS[card.type] || ICONS.card) + '</span>' +
      '</div>';
  }

  popup.querySelector('#cipName').innerHTML = (CARD_ICONS[card.type] || ICONS.card) + ' ' + ci.name;
  popup.querySelector('#cipDesc').textContent = ci.desc;
  popup.classList.add('visible');
}

function hideCardInfoPopup() {
  if (_cardInfoPopupEl) _cardInfoPopupEl.classList.remove('visible');
}

// ─── Build Card HTML ──────────────────────────────────────────────────────────
function buildCardHTML(card, index, total) {
  var ci = getCardInfo(card.type);
  var isSelected = gs.selectedCards.indexOf(card.id) !== -1;
  var isNope = card.type === 'nope';
  var imgObj = getCardImg(card);
  var cardIcon = CARD_ICONS[card.type] || ICONS.card;

  var fallbackHTML = '<div class="hand-card-fallback" style="display:flex;">' +
    '<div class="hand-card-emoji">' + cardIcon + '</div>' +
    '<div class="hand-card-name">' + (ci ? ci.name : card.type) + '</div>' +
    '</div>';
  var innerContent = imgObj
    ? buildImgTag(imgObj, ci ? ci.name : card.type, 'hand-card-img', '') +
      '<div class="hand-card-fallback" style="display:none;"><div class="hand-card-emoji">' + cardIcon + '</div>' +
      '<div class="hand-card-name">' + (ci ? ci.name : card.type) + '</div></div>'
    : fallbackHTML;

  if (isSelected) innerContent += '<div class="selected-badge"><i class="fas fa-check"></i></div>';
  // info hint icon
  if (ci) innerContent += '<div class="card-info-hint" title="">' + ICONS.hint + '</div>';

  return '<div class="hand-card' + (isSelected ? ' selected' : '') + (isNope ? ' nope-card' : '') + '"' +
    ' style="z-index:' + (isSelected ? 60 : index + 1) + ';"' +
    ' data-card-id="' + card.id + '"' +
    ' data-card-type="' + card.type + '"' +
    ' onclick="handleCardClick(event,' + card.id + ',\'' + card.type + '\')">' +
    innerContent + '</div>';
}

function handleCardClick(e, cardId, cardType) {
  if (e.target && (e.target.classList.contains('card-info-hint') || e.target.closest('.card-info-hint'))) {
    e.stopPropagation();
    var card = (gs.myHand || []).find(function(c) { return c.id === cardId; })
      || { id: cardId, type: cardType, variantIndex: 0 };
    showCardInfoPopup(card);
    return;
  }
  toggleSelectCard(cardId, cardType);
}

function renderHand() {
  var container = document.getElementById('myHand');
  if (!container) return;
  if (gs.isSpectator) {
    container.innerHTML = '<div style="color:var(--text-3);font-style:italic;text-align:center;padding:32px 0;width:100%;">' +
      ICONS.spectator + ' ' + t('game.spectating') + '</div>';
    return;
  }
  if (!gs.myHand.length) {
    container.innerHTML = '<div style="color:var(--text-3);text-align:center;padding:32px 0;width:100%;">' + t('game.noCards') + '</div>';
    return;
  }

  var newCount = gs.myHand.length;
  var prevCount = _prevHandCount;
  container.innerHTML = gs.myHand.map(function(card, i) { return buildCardHTML(card, i, gs.myHand.length); }).join('');

  // Attach tooltips — store type on ci for icon lookup
  hideCardTooltip();
  container.querySelectorAll('.hand-card').forEach(function(el) {
    var type = el.getAttribute('data-card-type');
    var ci = getCardInfo(type);
    if (ci) {
      var ciWithType = Object.assign({}, ci, { _type: type });
      attachCardTooltip(el, ciWithType);
    }
  });

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
    showToast(ICONS.warning + ' ' + t('card.notYourTurn'));
    return;
  }
  if (cardType === 'nope') {
    if (gs.pendingAction) {
      playSound('nope');
      socket.emit('play-nope', { cardId: cardId });
    } else {
      showToast(ICONS.warning + ' ' + t('card.noNopeTarget'));
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