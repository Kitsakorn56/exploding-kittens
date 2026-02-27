/**
 * game-rendering.js - ฟังก์ชันการ render ต่างๆ สำหรับเกมหลัก
 */

var _prevCurrentPlayer = null;
var discardPileVisuals = [];
var lastDiscardCount = 0;

function renderGameScreen() {
  document.getElementById('roundNumText').textContent = 'รอบที่ ' + gs.roundNum;
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
      ? '<span class="your-turn-badge">🎯 เทิร์นของคุณ!</span>'
      : '<span>🎲 เทิร์นของ <strong>' + escHtml(cpName) + '</strong></span>';
    cpEl.className = 'current-player-banner' + (isMe ? ' my-turn' : '');
  }
  var atEl = document.getElementById('attackTurnsInfo');
  if (atEl) {
    atEl.style.display = (gs.attackTurns > 1 && gs.currentPlayer === gs.myId) ? 'block' : 'none';
    atEl.textContent = '⚔️ คุณต้องเล่นอีก ' + gs.attackTurns + ' เทิร์น';
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
  renderRiskGauge();
}

function renderDiscardPile() {
  var pileVis = document.getElementById('discardPileVisual');
  if (!pileVis) return;
  if (!gs.discardTop || gs.discardCount === 0) {
    pileVis.classList.remove('has-card');
    pileVis.innerHTML = '<div class="discard-empty-state" id="discardEmptyState">กองทิ้ง</div>';
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
        (ci ? '<div style="font-size:1.8rem;">' + ci.emoji + '</div>' : '') + '</div></div></div>';
    } else if (ci) {
      html += '<div style="' + cardStyle + '"><div style="' + innerStyle + 'background:' + ci.color + '18;display:flex;align-items:center;justify-content:center;">' +
        '<div style="font-size:1.8rem;">' + ci.emoji + '</div></div></div>';
    }
  }
  pileVis.innerHTML = '<div style="position:relative;width:100%;height:100%;overflow:visible;">' + html + '</div>';
}

function renderRiskGauge() {
  var bombs = gs.explodingKittensInDeck || 0;
  var total = gs.deckCount || 1;
  var pct   = total > 0 ? Math.round((bombs / total) * 100) : 0;
  var pctEl = document.getElementById('riskPercent');
  if (pctEl) {
    pctEl.textContent = pct + '%';
    pctEl.className = 'risk-pct';
    if (pct === 0 || pct < 20) pctEl.classList.add('low');
    else if (pct < 40) pctEl.classList.add('medium');
    else if (pct < 65) pctEl.classList.add('high');
    else               pctEl.classList.add('danger');
  }
  var arcLen = 251, fillLen = arcLen * (pct / 100);
  var fillColor = pct < 20 ? '#22c55e' : pct < 40 ? '#a3c55e' : pct < 60 ? '#eab308' : pct < 80 ? '#f97316' : '#ef4444';
  var fillPath = document.getElementById('gaugeFill');
  if (fillPath) {
    fillPath.setAttribute('stroke-dasharray', fillLen + ' ' + arcLen);
    fillPath.setAttribute('stroke', fillColor);
  }
  var angle = -180 + (pct / 100) * 180;
  var rad = (angle * Math.PI) / 180;
  var nx = 100 + 72 * Math.cos(rad), ny = 100 + 72 * Math.sin(rad);
  var needle = document.getElementById('gaugeNeedle');
  if (needle) {
    needle.setAttribute('x2', nx.toFixed(1));
    needle.setAttribute('y2', ny.toFixed(1));
    needle.setAttribute('stroke', fillColor);
  }
  var gG = document.getElementById('gaugeGreen'), gY = document.getElementById('gaugeYellow'), gR = document.getElementById('gaugeRed');
  if (gG && gY && gR) {
    gG.setAttribute('opacity', pct < 33  ? '0.7' : '0.25');
    gY.setAttribute('opacity', pct >= 33 && pct < 66 ? '0.7' : '0.25');
    gR.setAttribute('opacity', pct >= 66 ? '0.7' : '0.25');
  }
}

function buildCardIconsHTML(count) {
  if (count === 0) return '<div class="card-icons-row"><span style="font-size:0.6rem;color:var(--text-3);">ไม่มีไพ่</span></div>';
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
    return '<div class="player-chip' + (isCurrent ? ' current' : '') + (isMe ? ' mine' : '') + '" onclick="selectCatTarget(\'' + pid + '\')" id="pchip-' + pid + '">' +
      getAvatarHTML(gs.playerAvatars && gs.playerAvatars[pid], name, 40) +
      '<div class="player-chip-info">' +
        '<div class="player-chip-name">' + escHtml(name) + (isMe ? ' <span class="you-label">(คุณ)</span>' : '') + '</div>' +
        (rank ? '<div class="rank-badge" style="color:' + rank.color + '">' + rank.name + '</div>' : '') +
        buildCardIconsHTML(count) +
      '</div>' +
      (isCurrent ? '<div class="turn-indicator">🎯</div>' : '') +
    '</div>';
  }).join('') + gs.deadPlayers.map(function(pid) {
    return '<div class="player-chip dead">' +
      getAvatarHTML(gs.playerAvatars && gs.playerAvatars[pid], gs.playerNames[pid], 40) +
      '<div class="player-chip-info">' +
        '<div class="player-chip-name">' + escHtml(gs.playerNames[pid] || '?') + '</div>' +
        '<div class="dead-label">💀 ระเบิดแล้ว</div>' +
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
      '<div style="font-size:2.4rem;">🚫</div>' +
      '<div>' +
        '<div style="font-family:Cinzel,serif;font-size:1.3rem;font-weight:900;color:#ec4899;">NOPE!</div>' +
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
  var name = data.winner === gs.myId ? 'คุณ!' : (data.winnerName || '?');
  winEl.innerHTML =
    '<div class="win-content">' +
      '<div class="win-confetti"></div>' +
      '<div style="font-size:3rem;margin-bottom:20px;animation:explode-emoji-pulse 0.6s ease;">🏆</div>' +
      '<div style="font-family:Cinzel,serif;font-size:2.2rem;font-weight:900;color:#f0c060;margin-bottom:12px;text-shadow:0 0 20px rgba(240,192,96,0.8);">ผู้ชนะ!</div>' +
      '<div style="font-size:1.6rem;color:#e0e0e0;margin-bottom:24px;">' + escHtml(name) + '</div>' +
      '<div style="display:flex;gap:12px;justify-content:center;margin-top:24px;">' +
        '<button class="btn btn-success" onclick="playAgain()">🔄 เล่นอีกครั้ง</button>' +
        '<button class="btn btn-secondary" onclick="backToLobbyFromWin()">🏠 กลับ Lobby</button>' +
      '</div>' +
    '</div>';
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
