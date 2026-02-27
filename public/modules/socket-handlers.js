/**
 * socket-handlers.js - ตัวรับ socket events ทั้งหมด
 */

// ตัวแปรช่วยสำหรับ socket handlers
var _favorModalOpen = false;
var _prevMyHandIds = [];

// === ฟังก์ชัน: ตั้งค่า Socket Handlers ===
function setupSocketHandlers() {
  if (!socket) {
    console.warn('⚠️ Socket not ready yet');
    setTimeout(setupSocketHandlers, 100); // Retry after 100ms
    return;
  }

// === Socket.IO Handlers ===

socket.on('your-player-id', function(id) {
  gs.myId = id;
  updateLobbyPlayersList();
  updateGuestPlayersList();
});

socket.on('join-error', function(data) {
  pendingJoinRoom = false;
  hideLoading();
  showToast((data && data.message) || '⚠️ ไม่พบห้องนี้');
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
    });
    if (gs.isHost) updateLobbyPlayersList();
    else {
      updateGuestPlayersList();
      if (pendingJoinRoom) {
        pendingJoinRoom = false;
        showLobbyGuest();
        showToast('✅ เข้าห้องสำเร็จ!');
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
  var ws = document.getElementById('winScreen');
  if (ws) ws.style.display = 'none';
  ['cardPickerModal','targetPickerModal','insertModal','favorModal','steal3Modal','discard5Modal'].forEach(function(id) {
    safeHideModal(id);
  });
});

socket.on('card-played', function(data) {
  showCardPlayedOverlay(data);
  var ci = CARD_INFO[data.cards && data.cards[0] && data.cards[0].type];
  updateActionLog(data.playerName + ' เล่น ' + (ci ? ci.emoji : '') + ' ' + (ci ? ci.name : ''));
});

socket.on('nope-played', function(data) {
  playSound('nope');
  showToast('🚫 ' + data.playerName + ' ' + (data.noped ? 'Nope!' : 'Nope the Nope!'));
});

socket.on('action-noped', function(data) {
  var banner = document.getElementById('nopeBanner');
  if (banner) { clearInterval(banner._timer); banner.remove(); }
  var overlay = document.getElementById('cardPlayedOverlay');
  var bd = document.getElementById('cardPlayedBackdrop');
  if (overlay) overlay.remove();
  if (bd) bd.remove();
  showToast('❌ ' + data.playerName + ' ถูก Nope — ยกเลิกแล้ว');
});

socket.on('see-the-future-result', function(data) {
  var cards = data.cards, cardInfoMap = data.cardInfoMap;
  var content = document.getElementById('seeFutureContent');
  if (content) {
    content.innerHTML = '<p class="mb-3" style="color:var(--text-2);">3 ใบบนสุดของกอง (ใบที่ 1 = บนสุด)</p>' +
      '<div class="d-flex gap-3 justify-content-center flex-wrap">' +
      cards.map(function(c, i) {
        var ci = cardInfoMap[c.type];
        var imgObj = CARD_INFO[c.type] ? getCardImg(c) : null;
        var imgTag = imgObj ? buildImgTag(imgObj, ci.name, 'future-card-img', '') : '';
        return '<div class="future-card text-center" style="background:' + ci.color + '15;border-color:' + ci.color + '40;animation:future-card-reveal 0.4s cubic-bezier(0.34,1.56,0.64,1) ' + (i*0.12) + 's both;">' +
          imgTag + '<div style="font-size:' + (imgObj ? '1.2rem' : '2rem') + ';">' + ci.emoji + '</div>' +
          '<div style="font-size:0.72rem;font-weight:700;margin-top:4px;">' + ci.name + '</div>' +
          '<div style="font-size:0.62rem;opacity:0.5;">ใบที่ ' + (i+1) + '</div></div>';
      }).join('') + '</div>';
    safeShowModal('seeFutureModal');
  }
});

socket.on('drew-exploding-kitten', function(data) {
  if (data.hadDefuse && data.playerId === gs.myId) {
    showToast('💥➡️🛡️ คุณจั่ว Exploding Kitten แต่ใช้ Defuse รอดได้!');
    openInsertModal(data.deckSize);
  }
  playSound('explode');
  var isMe = data.playerId === gs.myId;
  showExplodeAnimation(data.playerName, isMe);
});

socket.on('choose-insert-position', function(data) {
  openInsertModal(data.deckSize);
});

socket.on('player-exploded', function(data) {
  playSound('explode');
  var isMe = data.playerId === gs.myId;
  showToast(isMe ? '💥 คุณระเบิดแล้ว! กำลังดูแบบ Spectator' : '💥 ' + data.playerName + ' ระเบิดแล้ว!');
});

socket.on('game-over', function(data) {
  gs.gameState = 'ended';
  gs.winner = data.winner;
  showWinScreen(data);
});

socket.on('deck-shuffled', function(data) {
  playSound('shuffle');
  showShuffleAnimation(data.playerName);
  showToast('🔀 ' + data.playerName + ' สับกองไพ่');
  discardPileVisuals = [];
  lastDiscardCount = 0;
});

socket.on('log-action', function(data) {
  updateActionLog(data.msg);
});

socket.on('favor-given', function(data) {
  showToast('🙀 ' + data.fromName + ' ให้ ' + (data.cardInfo ? data.cardInfo.emoji : '🃏') + ' ' + (data.cardInfo ? data.cardInfo.name : 'ไพ่') + ' แก่ ' + data.toName);
});

socket.on('steal-result', function(data) {
  if (data.card) {
    var fromPid = data.fromId
      ? data.fromId
      : gs.alivePlayers.find(function(pid) { return gs.playerNames[pid] === data.fromName; });
    if (fromPid) showStealAnimation(fromPid, data.card);
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
    var cardLabel = data.cardInfo ? (data.cardInfo.emoji + ' ' + data.cardInfo.name) : 'ไพ่';
    showToast('🐱 คุณขโมย ' + cardLabel + ' จาก ' + (data.fromName || '?'));
  } else {
    showToast('🐱 ' + (data.byName || '?') + ' ขโมยไพ่จาก ' + (data.fromName || '?'));
  }
});

socket.on('card-was-stolen', function(data) {
  var hand = document.getElementById('myHand');
  if (hand) {
    hand.classList.add('hand-stolen-flash');
    setTimeout(function() { hand.classList.remove('hand-stolen-flash'); }, 500);
  }
  var cardLabel = data.cardInfo ? (data.cardInfo.emoji + ' ' + data.cardInfo.name) : 'ไพ่';
  showToast('😱 ' + (data.byName || '?') + ' ขโมย ' + cardLabel + ' ของคุณ!', 4000);
});

socket.on('pick-card-type-to-steal', function(data) {
  openSteal3Modal(data);
});

socket.on('pick-from-discard', function(data) {
  openDiscard5Modal(data);
});

socket.on('exploding-kitten-inserted', function(data) {
  showToast('🛡️ ' + data.playerName + ' ใส่ Exploding Kitten คืนกองแล้ว');
});

socket.on('attacked', function(data) {
  showToast('⚔️ ' + data.playerName + ' โจมตี! ผู้เล่นถัดไปต้องเล่น ' + data.attackTurns + ' เทิร์น');
});

socket.on('card-drawn-normal', function(data) {
  if (data.playerId !== gs.myId) {
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
  showToast('👋 ' + data.playerName + ' ออก');
  if (gs.isHost) updateLobbyPlayersList();
  else updateGuestPlayersList();
});

socket.on('player-disconnected', function(data) {
  showToast('📴 ' + (data.playerName || 'ผู้เล่น') + ' หลุดการเชื่อมต่อ');
});

socket.on('host-left-room', function(data) {
  socket.emit('leave-room');
  gs.roomId = '';
  gs.isHost = false;
  gs.players = [];
  gs.gameState = 'lobby';
  gs.myHand = [];
  showScreen('home');
  showToast((data && data.message) || 'เจ้าของห้องออกแล้ว');
});

socket.on('game-error', function(data) {
  showToast('⚠️ ' + data.message);
});

socket.on('rank-updated', function(data) {
  if (gs.playerRanks) {
    var pid = gs.players.find(function(p) { return gs.userIds && gs.userIds[p] === data.userId; });
    if (pid) gs.playerRanks[pid] = data.rank;
  }
});

socket.on('game-state', function(data) {
  var prevIds = _prevMyHandIds.slice();
  Object.assign(gs, data);

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
    openFavorModal(data.pendingFavor);
  }
  if (!data.pendingFavor) _favorModalOpen = false;

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

// === New Card Event Handlers ===

socket.on('alter-future-choice', function(data) {
  if (data.playerId === gs.myId) {
    openAlterFutureModal(data);
  } else {
    showToast('👁️ ' + (data.playerName || 'ผู้เล่น') + ' กำลังเรียงลำดับไพ่...');
  }
});

socket.on('clairvoyance-revealed', function(data) {
  if (data.playerId === gs.myId) {
    openClairvoyanceModal(data);
  }
  showToast('🔮 ' + (data.playerName || 'ผู้เล่น') + ' ใช้ Clairvoyance');
});

socket.on('clone-choice', function(data) {
  if (data.playerId === gs.myId) {
    var el = document.getElementById('cloneContent');
    if (el) {
      var ci = CARD_INFO[data.cardToClone.type];
      var imgObj = getCardImg(data.cardToClone);
      var imgTag = imgObj ? buildImgTag(imgObj, ci.name, 'clone-card-img', '') : '';
      el.innerHTML = '<div style="text-align:center;padding:16px;">' +
        imgTag +
        '<div style="font-size:1.4rem;">' + ci.emoji + '</div>' +
        '<div style="font-weight:700;margin-top:8px;">คัดลอกการ์ด: ' + ci.name + '</div>' +
        '<div style="font-size:0.85rem;margin-top:4px;">' + ci.desc + '</div>' +
      '</div>';
    }
    safeShowModal('cloneModal', { backdrop: 'static', keyboard: false });
  }
  showToast('📋 ' + (data.playerName || 'ผู้เล่น') + ' ใช้ Clone');
});

socket.on('dig-deeper-choice', function(data) {
  if (data.playerId === gs.myId) {
    openDigDeeperModal(data);
  } else {
    showToast('🔍 ' + (data.playerName || 'ผู้เล่น') + ' ใช้ Dig Deeper');
  }
});

socket.on('draw-from-bottom-defense', function(data) {
  if (data.playerId === gs.myId) {
    openDrawFromBottomModal(data);
  }
  showToast('⬇️ ' + (data.playerName || 'ผู้เล่น') + ' ใช้ Draw from the Bottom (ป้องกัน Attack)');
});

socket.on('reverse-played', function(data) {
  if (!data.twoPlayerMode) {
    playSound('shuffle');
  }
  showToast('🔄 ' + (data.playerName || 'ผู้เล่น') + ' ใช้ Reverse — ' + 
    (data.twoPlayerMode ? 'ทำหน้าที่เป็น Skip' : 'ลำดับการเล่นถูกย้อน'));
});

socket.on('clone-card-applied', function(data) {
  showToast('✅ Clone ได้ผล! ' + (data.cardInfo ? data.cardInfo.emoji + ' ' + data.cardInfo.name : 'ไพ่'));
});

} // End setupSocketHandlers()

// Auto-start setup when this file loads
setupSocketHandlers();
