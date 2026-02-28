/**
 * game-rendering.js - ฟังก์ชันการ render ต่างๆ สำหรับเกมหลัก
 * [UPDATED] ใช้ ICONS แทน emoji และ t() แทน hardcoded strings
 */

var _prevCurrentPlayer = null;
var discardPileVisuals = [];
var lastDiscardCount = 0;

function renderGameScreen() {
  document.getElementById('roundNumText').textContent = t('game.round', { n: gs.roundNum });
  var cpName = gs.playerNames[gs.currentPlayer] || '?';
  var cpEl = document.getElementById('currentPlayerBanner');
  if (cpEl) {
    var isMe = gs.currentPlayer === gs.myId;

    if (gs.currentPlayer !== _prevCurrentPlayer && _prevCurrentPlayer !== null) {
      if (isMe) {
        playSound('turn');
        showTurnChangeAnimation(true);
      } else {
        showTurnChangeAnimation(false, cpName);
      }
    }
    _prevCurrentPlayer = gs.currentPlayer;

    cpEl.innerHTML = isMe
      ? '<span class="your-turn-badge">' + ICONS.myTurn + ' ' + t('game.yourTurn') + '</span>'
      : '<span>' + ICONS.dice + ' ' + t('game.theirTurn', { name: '<strong>' + escHtml(cpName) + '</strong>' }) + '</span>';
    cpEl.className = 'current-player-banner' + (isMe ? ' my-turn' : '');
  }
  var atEl = document.getElementById('attackTurnsInfo');
  if (atEl) {
    atEl.style.display = (gs.attackTurns > 1 && gs.currentPlayer === gs.myId) ? 'block' : 'none';
    atEl.innerHTML = ICONS.attack + ' ' + t('game.attackTurns', { n: gs.attackTurns });
  }
  renderTableCenter();
  renderPlayers();
  renderHand();
  updateActionLog(gs.lastAction);
  var drawBtn = document.getElementById('drawCardBtn');
  if (drawBtn) {
    var canDraw = gs.isMyTurn && !gs.pendingAction && !gs.pendingInsert && !gs.pendingFavor;
    drawBtn.disabled = !canDraw;
    drawBtn.className = 'btn draw-btn ' + (canDraw ? 'btn-draw-active' : 'btn-draw-disabled');
  }
  var specEl = document.getElementById('spectatorBanner');
  if (specEl) specEl.style.display = gs.isSpectator ? 'block' : 'none';
  showScreen('game');
}

function renderTableCenter() {
  var deckBadge = document.getElementById('deckCountBadge');
  if (deckBadge) deckBadge.textContent = gs.deckCount;
  var drawPile = document.getElementById('drawPileArea');
  if (drawPile) {
    var canDraw = gs.isMyTurn && !gs.pendingAction && !gs.pendingInsert && !gs.pendingFavor;
    drawPile.style.opacity = canDraw ? '1' : '0.75';
    drawPile.style.cursor  = canDraw ? 'pointer' : 'default';
    var visual = document.getElementById('drawPileVisual');
    if (visual) {
      visual.style.boxShadow = canDraw
        ? '0 8px 28px rgba(0,0,0,0.6), 0 0 20px rgba(192,57,43,0.6), 0 0 40px rgba(192,57,43,0.3)'
        : '0 8px 28px rgba(0,0,0,0.6), 0 0 12px rgba(192,57,43,0.2)';
    }
  }
  var discardBadge = document.getElementById('discardCountBadge');
  if (discardBadge) discardBadge.textContent = gs.discardCount || 0;
  renderDiscardPile();
}

function renderDiscardPile() {
  var pileVis = document.getElementById('discardPileVisual');
  if (!pileVis) return;
  if (!gs.discardTop || gs.discardCount === 0) {
    pileVis.classList.remove('has-card');
    pileVis.innerHTML = '<div class="discard-empty-state" id="discardEmptyState">' + t('game.discardPile') + '</div>';
    discardPileVisuals = [];
    lastDiscardCount = 0;
    return;
  }
  pileVis.classList.add('has-card');
  if (gs.discardCount > lastDiscardCount) {
    var newEntries = gs.discardCount - lastDiscardCount;
    for (var k = 0; k < newEntries; k++) {
      discardPileVisuals.push({
        rot: (Math.random() - 0.5) * 40,
        dx:  (Math.random() - 0.5) * 12,
        dy:  (Math.random() - 0.5) * 8,
        imgObj: getCardImg(gs.discardTop),
        type:   gs.discardTop.type
      });
    }
  }
  lastDiscardCount = gs.discardCount;
  var showCount = Math.min(discardPileVisuals.length, 6);
  var startIdx  = discardPileVisuals.length - showCount;
  var html = '';
  for (var i = startIdx; i < discardPileVisuals.length; i++) {
    var entry = discardPileVisuals[i];
    var ci    = CARD_INFO[entry.type];
    var zIdx  = i - startIdx + 1;
    var isTop = (i === discardPileVisuals.length - 1);
    var cardStyle =
      'position:absolute;width:110%;padding-bottom:154%;top:50%;left:50%;' +
      'margin-top:-77%;margin-left:-55%;border-radius:10px;overflow:hidden;' +
      'transform:rotate(' + entry.rot.toFixed(1) + 'deg) translate(' + entry.dx.toFixed(1) + 'px,' + entry.dy.toFixed(1) + 'px);' +
      'z-index:' + zIdx + ';' +
      'box-shadow:' + (isTop ? '0 6px 24px rgba(0,0,0,0.6),0 2px 6px rgba(0,0,0,0.4)' : '0 3px 10px rgba(0,0,0,0.4)') + ';' +
      'transition:' + (isTop ? 'transform 0.18s ease' : 'none') + ';';
    var innerStyle = 'position:absolute;inset:0;';
    var png = entry.imgObj ? (entry.imgObj.png || entry.imgObj) : null;
    var jpg = entry.imgObj ? (entry.imgObj.jpg || null) : null;
    if (png) {
      var onErr = jpg
        ? 'this.onerror=function(){this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'};this.src=\'' + jpg + '\''
        : 'this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'';
      html += '<div style="' + cardStyle + '"><div style="' + innerStyle + '">' +
        '<img src="' + png + '" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="' + onErr + '">' +
        '<div style="width:100%;height:100%;display:none;align-items:center;justify-content:center;flex-direction:column;background:' + (ci ? ci.color + '18' : '#2a2a2a') + ';">' +
        (ci ? '<div style="font-size:1.4rem;">' + (CARD_ICONS[entry.type] || ICONS.card) + '</div>' : '') + '</div></div></div>';
    } else if (ci) {
      html += '<div style="' + cardStyle + '"><div style="' + innerStyle + 'background:' + ci.color + '18;display:flex;align-items:center;justify-content:center;">' +
        '<div style="font-size:1.4rem;">' + (CARD_ICONS[entry.type] || ICONS.card) + '</div></div></div>';
    }
  }
  pileVis.innerHTML = '<div style="position:relative;width:100%;height:100%;overflow:visible;">' + html + '</div>';
}

/** icon map สำหรับ card type → ICONS key */
var CARD_ICONS = {
  exploding_kitten: ICONS.explode,
  defuse:           ICONS.defuse,
  see_the_future:   ICONS.future,
  shuffle:          ICONS.shuffle,
  skip:             ICONS.skip,
  attack:           ICONS.attack,
  nope:             ICONS.nope,
  favor:            ICONS.favor,
  taco_cat:         ICONS.cat,
  hairy_potato_cat: ICONS.cat,
  beard_cat:        ICONS.cat,
  rainbow_cat:      ICONS.cat,
  cattermelon:      ICONS.cat,
  alter_the_future: ICONS.alter,
  clairvoyance:     ICONS.clairvoyance,
  clone:            ICONS.clone,
  dig_deeper:       ICONS.dig,
  draw_from_bottom: ICONS.drawBottom,
  reverse:          ICONS.reverse,
};

function buildCardIconsHTML(count, actionType) {
  // If an action type is specified, show status instead of card count
  if (actionType && gs.myCardSelectionAction === actionType) {
    var statusKey = 'status.' + actionType;
    var statusText = t(statusKey);
    return '<div class="card-icons-row" style="font-size:0.75rem;color:var(--gold);font-weight:bold;padding:4px 8px;background:rgba(201,151,58,0.15);border-radius:6px;white-space:nowrap;">' + statusText + '</div>';
  }
  
  if (count === 0) return '<div class="card-icons-row"><span style="font-size:0.6rem;color:var(--text-3);">' + t('misc.noCards') + '</span></div>';
  var max = 7;
  var show = Math.min(count, max);
  var html = '<div class="card-icons-row">';
  for (var i = 0; i < show; i++) html += '<div class="card-icon-mini"></div>';
  if (count > max) html += '<span class="card-icon-more">+' + (count - max) + '</span>';
  html += '</div>';
  return html;
}

function renderPlayers() {
  var container = document.getElementById('playersArea');
  if (!container) return;
  container.innerHTML = gs.alivePlayers.map(function(pid) {
    var isMe = pid === gs.myId;
    var isCurrent = pid === gs.currentPlayer;
    var name = gs.playerNames[pid] || '?';
    var count = gs.handCounts[pid] || 0;
    var rank = gs.playerRanks && gs.playerRanks[pid];
    var actionType = (isMe && gs.myCardSelectionAction) ? gs.myCardSelectionAction : null;
    return '<div class="player-chip' + (isCurrent ? ' current' : '') + (isMe ? ' mine' : '') + '" onclick="selectCatTarget(\'' + pid + '\')" id="pchip-' + pid + '">' +
      getAvatarHTML(gs.playerAvatars && gs.playerAvatars[pid], name, 40) +
      '<div class="player-chip-info">' +
        '<div class="player-chip-name">' + escHtml(name) + (isMe ? ' <span class="you-label">' + t('misc.you') + '</span>' : '') + '</div>' +
        (rank ? '<div class="rank-badge" style="color:' + rank.color + '">' + rank.name + '</div>' : '') +
        buildCardIconsHTML(count, actionType) +
      '</div>' +
      (isCurrent ? '<div class="turn-indicator">' + ICONS.turn + '</div>' : '') +
    '</div>';
  }).join('') + gs.deadPlayers.map(function(pid) {
    return '<div class="player-chip dead">' +
      getAvatarHTML(gs.playerAvatars && gs.playerAvatars[pid], gs.playerNames[pid], 40) +
      '<div class="player-chip-info">' +
        '<div class="player-chip-name">' + escHtml(gs.playerNames[pid] || '?') + '</div>' +
        '<div class="dead-label">' + ICONS.skull + ' ' + t('misc.dead') + '</div>' +
      '</div></div>';
  }).join('');
}

function updateActionLog(msg) {
  var el = document.getElementById('actionLog');
  if (!el) return;
  el.textContent = msg;
  el.style.transition = 'none';
  el.style.opacity = '1';
  clearTimeout(el._fadeTimeout);
  el._fadeTimeout = setTimeout(function() {
    el.style.transition = 'opacity 0.5s ease';
    el.style.opacity = '0.4';
  }, 3000);
}

function showNopeBanner(data) {
  var banner = document.getElementById('nopeBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'nopeBanner';
    document.body.appendChild(banner);
  }
  banner.className = 'nope-banner';
  banner.innerHTML =
    '<div style="display:flex;align-items:center;gap:12px;">' +
      '<div style="font-size:1.6rem;">' + ICONS.nope + '</div>' +
      '<div>' +
        '<div style="font-family:Kanit,sans-serif;font-size:1.3rem;font-weight:900;color:#ec4899;">NOPE!</div>' +
        (data.playerName ? '<div style="font-size:0.75rem;color:rgba(255,200,200,0.8);">' + escHtml(data.playerName) + ' ยกเลิก</div>' : '') +
      '</div>' +
    '</div>';
  setTimeout(function() {
    banner.style.transition = 'all 0.4s ease';
    banner.style.opacity = '0';
    banner.style.transform = 'translateY(-30px)';
    setTimeout(function() { if (banner.parentNode) banner.remove(); }, 450);
  }, 1600);
}

function showWinScreen(data) {
  var winEl = document.getElementById('winScreen');
  if (!winEl) return;
  var name = data.winner === gs.myId ? t('win.you') : (data.winnerName || '?');
  var winnerEl = document.getElementById('winnerName');
  if (winnerEl) winnerEl.textContent = name;
  var msgEl = document.getElementById('winMessage');
  if (msgEl) msgEl.textContent = t('win.title');
  var hostBtn = document.getElementById('hostNextGameBtn');
  if (hostBtn) hostBtn.style.display = gs.isHost ? 'inline-block' : 'none';
  winEl.style.display = 'flex';
  playSound('win');
  showConfettiAnimation();
}

function playAgain() {
  document.getElementById('winScreen').style.display = 'none';
  socket.emit('next-round');
}

function backToLobbyFromWin() {
  document.getElementById('winScreen').style.display = 'none';
  gs.gameState = 'lobby';
  gs.myHand = [];
  gs.selectedCards = [];
  if (gs.isHost) showLobbyHost();
  else showLobbyGuest();
}