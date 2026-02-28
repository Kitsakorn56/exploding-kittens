/**
 * socket-handlers.js - ตัวรับ socket events ทั้งหมด
 * [UPDATED] ใช้ ICONS แทน emoji, t() แทน hardcoded strings
 * [UPDATED] เพิ่ม Activity Feed calls ทุก event
 */

var _favorModalOpen = false;
var _prevMyHandIds = [];
var _prevTurnPlayer = null; // track turn changes สำหรับ feed

function setupSocketHandlers() {
  if (!socket) {
    console.warn('⚠️ Socket not ready yet');
    setTimeout(setupSocketHandlers, 100);
    return;
  }

socket.on('your-player-id', function(id) {
  gs.myId = id;
  updateLobbyPlayersList();
  updateGuestPlayersList();
});

socket.on('join-error', function(data) {
  pendingJoinRoom = false;
  hideLoading();
  showToast(ICONS.warning + ' ' + ((data && data.message) || t('lobby.notFound')));
});

socket.on('room-updated', function(data) {
  if (data.isHost !== undefined) gs.isHost = data.isHost;
  if (data.players && Array.isArray(data.players)) {
    gs.players = data.players.map(function(p) { return p.id; });
    data.players.forEach(function(p) {
      gs.playerNames[p.id] = p.name;
      gs.playerAvatars = gs.playerAvatars || {};
      gs.playerAvatars[p.id] = p.avatarUrl;
      gs.playerRanks[p.id] = p.rank;
      gs.userIds = gs.userIds || {};
      gs.userIds[p.id] = (p.userId !== undefined) ? p.userId : null;
    });
    if (gs.isHost) updateLobbyPlayersList();
    else {
      updateGuestPlayersList();
      if (pendingJoinRoom) {
        pendingJoinRoom = false;
        showLobbyGuest();
        showToast(ICONS.check + ' ' + t('lobby.joined'));
        setTimeout(hideLoading, 1500);
      }
    }
  }
  if (data.roundNum !== undefined) gs.roundNum = data.roundNum;
  if (data.gameState) gs.gameState = data.gameState;
});

socket.on('game-started', function(data) {
  gs.roundNum = data.roundNum;
  gs.gameState = 'playing';
  gs.selectedCards = [];
  gs.catMode = null;
  gs.catTarget = null;
  discardPileVisuals = [];
  lastDiscardCount = 0;
  _prevCurrentPlayer = null;
  _prevHandCount = 0;
  _prevTurnPlayer = null;
  var ws = document.getElementById('winScreen');
  if (ws) ws.style.display = 'none';
  clearFeed();
  ['cardPickerModal','targetPickerModal','insertModal','favorModal','steal3Modal','discard5Modal'].forEach(function(id) {
    safeHideModal(id);
  });
});

socket.on('card-played', function(data) {
  showCardPlayedOverlay(data);
  var cardType = data.cards && data.cards[0] && data.cards[0].type;
  var cardCount = data.cards ? data.cards.length : 1;
  var isMe = data.playerId === gs.myId;
  // ไม่ feed ถ้าเป็นเทิร์นเรา (เราเห็น overlay อยู่แล้ว)
  if (!isMe) {
    feedCardPlayed(data.playerName, false, cardType, cardCount);
  }
  var ci = getCardInfo(cardType);
  updateActionLog(data.playerName + ' ' + t('anim.plays') + ' ' + (ci ? ci.name : ''));
});

socket.on('nope-played', function(data) {
  playSound('nope');
  var isMe = data.playerName === gs.playerNames[gs.myId];
  feedNopePlayed(data.playerName, data.noped);
  showToast(ICONS.nope + ' ' + data.playerName + ' ' + (data.noped ? t('toast.nope', { name: '' }).trim() : t('toast.nopeNope', { name: '' }).trim()));
});

socket.on('action-noped', function(data) {
  var banner = document.getElementById('nopeBanner');
  if (banner) { clearInterval(banner._timer); banner.remove(); }
  var overlay = document.getElementById('cardPlayedOverlay');
  var bd = document.getElementById('cardPlayedBackdrop');
  if (overlay) overlay.remove();
  if (bd) bd.remove();
  showToast(ICONS.nope + ' ' + t('toast.nopeCancelled', { name: data.playerName }));
});

socket.on('see-the-future-result', function(data) {
  gs.myCardSelectionAction = 'see_the_future';
  renderGameScreen();
  var cards = data.cards, cardInfoMap = data.cardInfoMap;
  var content = document.getElementById('seeFutureContent');
  if (content) {
    content.innerHTML = '<p class="mb-3" style="color:var(--text-2);">' + t('modal.seeFutureDesc') + '</p>' +
      '<div class="d-flex gap-3 justify-content-center flex-wrap">' +
      cards.map(function(c, i) {
        var ci = cardInfoMap[c.type];
        var imgObj = CARD_INFO[c.type] ? getCardImg(c) : null;
        var imgTag = imgObj ? buildImgTag(imgObj, ci.name, 'future-card-img', '') : '';
        var cardIcon = CARD_ICONS[c.type] || ICONS.card;
        return '<div class="future-card text-center" style="background:' + ci.color + '15;border-color:' + ci.color + '40;animation:future-card-reveal 0.4s cubic-bezier(0.34,1.56,0.64,1) ' + (i*0.12) + 's both;">' +
          imgTag + '<div style="font-size:' + (imgObj ? '1rem' : '1.6rem') + ';">' + cardIcon + '</div>' +
          '<div style="font-size:0.72rem;font-weight:700;margin-top:4px;">' + ci.name + '</div>' +
          '<div style="font-size:0.62rem;opacity:0.5;">' + t('modal.seeFuturePos', { n: i + 1 }) + '</div></div>';
      }).join('') + '</div>';
    safeShowModal('seeFutureModal');
  }
});

socket.on('drew-exploding-kitten', function(data) {
  var isMe = data.playerId === gs.myId;
  if (data.hadDefuse) {
    if (isMe) {
      showToast(ICONS.explode + ' ' + ICONS.defuse + ' ' + t('toast.defused'));
      openInsertModal(data.deckSize);
    }
    feedDefused(data.playerName, isMe);
  } else {
    feedPlayerExploded(data.playerName, isMe);
  }
  playSound('explode');
  showExplodeAnimation(data.playerName, isMe);
});

socket.on('choose-insert-position', function(data) {
  openInsertModal(data.deckSize);
});

socket.on('player-exploded', function(data) {
  playSound('explode');
  var isMe = data.playerId === gs.myId;
  showToast(isMe
    ? ICONS.skull + ' ' + t('toast.youExploded')
    : ICONS.explode + ' ' + t('toast.exploded', { name: data.playerName }));
  // feed อาจถูกเรียกแล้วจาก drew-exploding-kitten แต่ไม่เสียหายถ้าเรียกซ้ำ
});

socket.on('game-over', function(data) {
  gs.gameState = 'ended';
  gs.winner = data.winner;
  showWinScreen(data);
  clearFeed();
});

socket.on('deck-shuffled', function(data) {
  playSound('shuffle');
  showShuffleAnimation(data.playerName);
  var isMe = data.playerName === gs.playerNames[gs.myId];
  feedShuffled(data.playerName, isMe);
  discardPileVisuals = [];
  lastDiscardCount = 0;
});

socket.on('log-action', function(data) {
  updateActionLog(data.msg);
});

socket.on('favor-given', function(data) {
  gs.myCardSelectionAction = null;
  renderGameScreen();
  var cardLabel = data.cardInfo ? data.cardInfo.name : '';
  feedFavorGiven(data.fromName, data.toName, cardLabel);
  showToast(ICONS.favor + ' ' + t('toast.favorGiven', {
    from: data.fromName,
    card: cardLabel,
    to:   data.toName
  }));
});

socket.on('favor-noped', function() {
  gs.myCardSelectionAction = null;
  _favorModalOpen = false;
  safeHideModal('favorModal');
  renderGameScreen();
});

socket.on('steal-result', function(data) {
  if (data.card) {
    var fromPid = data.fromId
      ? data.fromId
      : gs.alivePlayers.find(function(pid) { return gs.playerNames[pid] === data.fromName; });
    if (fromPid) showStealAnimation(fromPid, data.card);
    // feed steal
    var ci = getCardInfo(data.card.type);
    feedStolenCard(gs.playerNames[gs.myId], true, data.fromName, ci ? ci.name : '');
  }
});

socket.on('card-stolen', function(data) {
  if (data.byId === gs.myId) {
    playSound('steal');
    var fromPid = data.fromId;
    if (fromPid && data.cardInfo) {
      var fakeCard = { type: Object.keys(CARD_INFO).find(function(k) { return CARD_INFO[k].emoji === data.cardInfo.emoji; }) || 'nope', variantIndex: 0 };
      showStealAnimation(fromPid, fakeCard);
    }
    var cardLabel = data.cardInfo ? data.cardInfo.name : t('card.playCard', { name: '' }).trim();
    showToast(ICONS.steal + ' ' + t('toast.stoleCard', { card: cardLabel, from: data.fromName || '?' }));
  } else {
    // คนอื่นขโมยกัน — แสดงใน feed
    var cardLbl = data.cardInfo ? data.cardInfo.name : '';
    feedStolenCard(data.byName, false, data.fromName, cardLbl);
    showToast(ICONS.steal + ' ' + t('toast.stoleOther', { by: data.byName || '?', from: data.fromName || '?' }));
  }
});

socket.on('card-was-stolen', function(data) {
  var hand = document.getElementById('myHand');
  if (hand) {
    hand.classList.add('hand-stolen-flash');
    setTimeout(function() { hand.classList.remove('hand-stolen-flash'); }, 500);
  }
  var cardLabel = data.cardInfo ? data.cardInfo.name : '';
  showToast(ICONS.warning + ' ' + t('toast.cardStolen', { by: data.byName || '?', card: cardLabel }), 4000);
});

socket.on('pick-card-type-to-steal', function(data) {
  openSteal3Modal(data);
});

socket.on('pick-from-discard', function(data) {
  openDiscard5Modal(data);
});

socket.on('exploding-kitten-inserted', function(data) {
  var isMe = data.playerName === gs.playerNames[gs.myId];
  feedInsertedKitten(data.playerName, isMe, data.position || 0);
  showToast(ICONS.defuse + ' ' + t('toast.shuffleInserted').replace('{name}', data.playerName || ''));
});

socket.on('attacked', function(data) {
  var isMe = data.playerName === gs.playerNames[gs.myId];
  feedAttacked(data.playerName, isMe, data.attackTurns);
  showToast(ICONS.attack + ' ' + t('toast.attacked', { name: data.playerName, n: data.attackTurns }));
});

socket.on('card-drawn-normal', function(data) {
  if (data.playerId !== gs.myId) {
    feedDrawCard(data.playerName, false);
    updateActionLog(data.playerName + ' จั่วไพ่');
  }
});

socket.on('drawing-card', function(data) {
  if (data.playerId !== gs.myId) {
    updateActionLog(data.playerName + ' กำลังจั่วไพ่...');
  }
});

socket.on('player-left', function(data) {
  if (data.players) {
    gs.players = data.players.map(function(p){ return p.id; });
    data.players.forEach(function(p){ gs.playerNames[p.id] = p.name; });
  }
  addFeedEvent({
    icon: ICONS.door, actor: data.playerName,
    text: 'ออกจากเกม', type: 'warn', duration: 3500,
  });
  showToast(ICONS.info + ' ' + t('toast.playerLeft', { name: data.playerName }));
  if (gs.isHost) updateLobbyPlayersList();
  else updateGuestPlayersList();
});

socket.on('player-disconnected', function(data) {
  addFeedEvent({
    icon: ICONS.warning, actor: data.playerName,
    text: 'หลุดการเชื่อมต่อ', type: 'danger', duration: 4000,
  });
  showToast(ICONS.warning + ' ' + t('toast.disconnected', { name: data.playerName || 'ผู้เล่น' }));
});

socket.on('host-left-room', function(data) {
  socket.emit('leave-room');
  gs.roomId = '';
  gs.isHost = false;
  gs.players = [];
  gs.gameState = 'lobby';
  gs.myHand = [];
  showScreen('home');
  showToast(ICONS.warning + ' ' + ((data && data.message) || t('toast.hostLeft')));
});

socket.on('game-error', function(data) {
  showToast(ICONS.warning + ' ' + (data.message || t('misc.error')));
});

socket.on('rank-updated', function(data) {
  if (gs.playerRanks) {
    var pid = gs.players.find(function(p) { return gs.userIds && gs.userIds[p] === data.userId; });
    if (pid) gs.playerRanks[pid] = data.rank;
  }
});

socket.on('game-state', function(data) {
  // Clear card selection action when pendingFavor is cleared
  if (!data.pendingFavor && gs.myCardSelectionAction === 'favor') {
    gs.myCardSelectionAction = null;
  }

  var prevIds = _prevMyHandIds.slice();
  var prevTurn = _prevTurnPlayer;
  Object.assign(gs, data);

  // ── Track turn change → feed ──
  if (data.currentPlayer && data.currentPlayer !== prevTurn && prevTurn !== null) {
    var cpName = gs.playerNames[data.currentPlayer] || '?';
    var isMyTurnNow = data.currentPlayer === gs.myId;
    feedTurnChanged(cpName, isMyTurnNow);
  }
  _prevTurnPlayer = data.currentPlayer;

  if (data.myHand) {
    var newIds = data.myHand.map(function(c) { return c.id; });
    var addedCards = data.myHand.filter(function(c) { return prevIds.indexOf(c.id) === -1; });
    if (addedCards.length === 1 && prevIds.length > 0) {
      var newCard = addedCards[0];
      if (newCard.type !== 'exploding_kitten') {
        showDrawCardAnimation(newCard, true);
      }
    }
    _prevMyHandIds = newIds;
  }

  if (data.pendingFavor && data.pendingFavor.targetId === gs.myId && !_favorModalOpen) {
    gs.myCardSelectionAction = 'favor';
    renderGameScreen();
    _favorModalOpen = true;
    openFavorModal(data.pendingFavor);
  }
  if (!data.pendingFavor) {
    gs.myCardSelectionAction = null;
    _favorModalOpen = false;
  }

  if (gs.gameState === 'playing' || gs.gameState === 'ended') renderGameScreen();

  if (data.roundNum && data.myHand && data.myHand.length > 0 && prevIds.length === 0) {
    setTimeout(function() { showDealCardsAnimation(data.myHand.length); }, 100);
  }
});

socket.on('admin-search-result', function(data) {
  var el = document.getElementById('adminSearchResult');
  if (data.error) {
    el.innerHTML = '<span class="text-danger">' + data.error + '</span>';
    return;
  }
  var u = data.user;
  el.innerHTML = '<div class="d-flex align-items-center gap-2 p-2" style="background:var(--surface-2);border-radius:8px;cursor:pointer;" onclick="adminSelectTarget(\'' + u.id + '\',\'' + escHtml(u.displayName) + '\',\'' + u.email + '\')">' +
    '<span style="font-size:0.9rem;">' + escHtml(u.displayName) + ' (' + u.email + ')</span></div>';
});

socket.on('alter-future-choice', function(data) {
  if (data.playerId === gs.myId) {
    gs.myCardSelectionAction = 'alter_the_future';
    renderGameScreen();
    openAlterFutureModal(data);
  } else {
    addFeedEvent({
      icon: ICONS.alter, actor: data.playerName,
      text: 'กำลังเรียงลำดับไพ่...',
      color: 'rgba(139,92,246,0.7)', duration: 3500,
    });
  }
});

socket.on('clairvoyance-revealed', function(data) {
  if (data.playerId === gs.myId) {
    gs.myCardSelectionAction = 'clairvoyance';
    renderGameScreen();
    openClairvoyanceModal(data);
  }
  addFeedEvent({
    icon: ICONS.clairvoyance, actor: data.playerName,
    text: 'ใช้ Clairvoyance',
    color: 'rgba(6,182,212,0.7)', duration: 3500,
  });
});

socket.on('clone-choice', function(data) {
  if (data.playerId === gs.myId) {
    var el = document.getElementById('cloneContent');
    if (el) {
      var ci = getCardInfo(data.cardToClone.type);
      var imgObj = getCardImg(data.cardToClone);
      var imgTag = imgObj ? buildImgTag(imgObj, ci.name, 'clone-card-img', '') : '';
      var cardIcon = CARD_ICONS[data.cardToClone.type] || ICONS.card;
      el.innerHTML = '<div style="text-align:center;padding:16px;">' +
        imgTag +
        '<div style="font-size:1.4rem;">' + cardIcon + '</div>' +
        '<div style="font-weight:700;margin-top:8px;">' + t('modal.cardPickerTitle') + ': ' + ci.name + '</div>' +
        '<div style="font-size:0.85rem;margin-top:4px;">' + ci.desc + '</div>' +
      '</div>';
    }
    safeShowModal('cloneModal', { backdrop: 'static', keyboard: false });
  }
  addFeedEvent({
    icon: ICONS.clone, actor: data.playerName,
    text: 'ใช้ Clone',
    color: 'rgba(99,102,241,0.7)', duration: 3500,
  });
});

socket.on('dig-deeper-choice', function(data) {
  if (data.playerId === gs.myId) {
    gs.myCardSelectionAction = 'dig_deeper';
    renderGameScreen();
    openDigDeeperModal(data);
  } else {
    addFeedEvent({
      icon: ICONS.dig, actor: data.playerName,
      text: 'ใช้ Dig Deeper', duration: 3000,
    });
  }
});

socket.on('draw-from-bottom-defense', function(data) {
  if (data.playerId === gs.myId) {
    openDrawFromBottomModal(data);
  }
  addFeedEvent({
    icon: ICONS.drawBottom, actor: data.playerName,
    text: 'จั่วจากล่าง (ป้องกัน Attack)',
    type: 'good', duration: 3500,
  });
});

socket.on('reverse-played', function(data) {
  if (!data.twoPlayerMode) playSound('shuffle');
  var isMe = data.playerName === gs.playerNames[gs.myId];
  var effect = data.twoPlayerMode ? t('toast.reverse.twoP') : t('toast.reverse.normal');
  addFeedEvent({
    icon: ICONS.reverse, actor: data.playerName, isMe: isMe,
    text: 'Reverse' + (data.twoPlayerMode ? ' (= Skip)' : ''),
    color: 'rgba(236,72,153,0.7)', duration: 3500,
  });
  showToast(ICONS.reverse + ' ' + t('toast.reverse', { name: data.playerName || 'ผู้เล่น', effect: effect }));
});

socket.on('clone-card-applied', function(data) {
  var cardLabel = data.cardInfo ? data.cardInfo.name : '';
  showToast(ICONS.check + ' ' + t('toast.cloneApplied', { card: cardLabel }));
});

} // End setupSocketHandlers()

setupSocketHandlers();