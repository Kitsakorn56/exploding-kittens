/**
 * room.js - การจัดการห้อง (สร้าง เข้าร่วม ออก)
 * [UPDATED] ใช้ ICONS แทน emoji และ t() แทน hardcoded strings
 */

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function createRoom() {
  playSound('click');
  if (!currentUser) {
    showToast(ICONS.warning + ' ' + t('auth.pleaseLogin'));
    return;
  }
  showLoading();
  const name = currentUser.displayName;
  gs.myName = name;
  gs.roomId = generateRoomCode();
  gs.isHost = true;
  gs.players = [];
  gs.playerNames = {};
  gs.myId = null;
  socket.emit('join-room', { roomId: gs.roomId, playerName: name, userId: currentUser.id, avatarUrl: currentUser.avatarUrl || null });
  showLobbyHost();
  showToast(ICONS.check + ' ' + t('lobby.created'));
  setTimeout(hideLoading, 1500);
}

function joinRoom() {
  playSound('click');
  if (!currentUser) {
    showToast(ICONS.warning + ' ' + t('auth.pleaseLogin'));
    return;
  }
  const code = document.getElementById('roomCode').value.trim().toUpperCase();
  if (code.length !== 4) {
    showToast(ICONS.warning + ' ' + t('lobby.codeLength'));
    return;
  }
  const name = currentUser.displayName;
  gs.myName = name;
  gs.roomId = code;
  gs.isHost = false;
  pendingJoinRoom = true;
  showLoading();
  socket.emit('join-room', { roomId: code, playerName: name, userId: currentUser.id, avatarUrl: currentUser.avatarUrl || null });
}

function showLobbyHost() {
  document.getElementById('displayRoomCode').textContent = gs.roomId;
  buildQR();
  updateLobbyPlayersList();
  showScreen('lobby');
}

function showLobbyGuest() {
  document.getElementById('guestRoomCode').textContent = gs.roomId;
  updateGuestPlayersList();
  showScreen('guest-lobby');
}

function buildQR() {
  const c = document.getElementById('qrContainer');
  c.innerHTML = '';
  new QRCode(c, {
    text: window.location.href.split('?')[0] + '?room=' + gs.roomId,
    width: 96,
    height: 96
  });
}

function copyRoomCode() {
  playSound('click');
  var successMsg = '<i class="fas fa-clipboard-check" style="color:#22c55e;"></i> ' + t('lobby.copied', { code: gs.roomId });
  var failMsg = '<i class="fas fa-exclamation-triangle" style="color:#f97316;"></i> ' + t('lobby.copyFail', { code: gs.roomId });

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(gs.roomId)
      .then(function() { showToast(successMsg); })
      .catch(function() {
        try {
          var tmp = document.createElement('input');
          tmp.value = gs.roomId;
          document.body.appendChild(tmp);
          tmp.select();
          document.execCommand('copy');
          tmp.remove();
          showToast(successMsg);
        } catch (e) {
          showToast(failMsg, 5000);
        }
      });
  } else {
    try {
      var tmp = document.createElement('input');
      tmp.value = gs.roomId;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      tmp.remove();
      showToast(successMsg);
    } catch (e) {
      showToast(failMsg, 5000);
    }
  }
}

function updateLobbyPlayersList() {
  const list = document.getElementById('playersList');
  if (!list) return;
  document.getElementById('playerCount').textContent = gs.players.length;
  list.innerHTML = gs.players.map(function(pid) {
    return '<div class="player-row d-flex align-items-center gap-2 p-2 mb-2 rounded">' +
      '<div class="player-avatar-sm">' + getAvatarHTML(gs.playerAvatars && gs.playerAvatars[pid], gs.playerNames[pid], 36) + '</div>' +
      '<span class="flex-grow-1">' + escHtml(gs.playerNames[pid]) + (pid === gs.myId ? ' <small class="text-muted">' + t('misc.you') + '</small>' : '') + '</span>' +
      (pid === gs.players[0]
        ? '<span class="badge" style="background:rgba(201,151,58,0.15);color:#c9973a;border:1px solid rgba(201,151,58,0.3);"><i class="fas fa-crown me-1"></i>' + t('lobby.hostBadge') + '</span>'
        : '<span class="badge bg-success"><i class="fas fa-check"></i></span>') +
      '</div>';
  }).join('');
}

function updateGuestPlayersList() {
  const list = document.getElementById('guestPlayersList');
  if (!list) return;
  document.getElementById('guestPlayerCount').textContent = gs.players.length;
  list.innerHTML = gs.players.map(function(pid) {
    return '<div class="player-row d-flex align-items-center gap-2 p-2 mb-2 rounded">' +
      '<div class="player-avatar-sm">' + getAvatarHTML(gs.playerAvatars && gs.playerAvatars[pid], gs.playerNames[pid], 36) + '</div>' +
      '<span>' + escHtml(gs.playerNames[pid]) + (pid === gs.myId ? ' <small class="text-muted">' + t('misc.you') + '</small>' : '') + '</span>' +
      '</div>';
  }).join('');
}

function startGame() {
  playSound('click');
  if (gs.players.length < 2) {
    showToast(ICONS.warning + ' ' + t('lobby.minPlayers'));
    return;
  }
  socket.emit('start-game');
}

function leaveLobby() {
  playSound('click');
  socket.emit('leave-room');
  gs = Object.assign({}, gs, {
    roomId: '', isHost: false, players: [], playerNames: {},
    gameState: 'lobby', myId: null
  });
  showScreen('home');
  showToast(ICONS.info + ' ' + t('lobby.left'));
}

function leaveGame() {
  playSound('click');
  socket.emit('leave-room');
  gs = Object.assign({}, gs, {
    roomId: '', isHost: false, players: [], playerNames: {},
    gameState: 'lobby', myId: null, myHand: [], selectedCards: []
  });
  showScreen('home');
  showToast(ICONS.info + ' ' + t('game.leaveGame'));
}