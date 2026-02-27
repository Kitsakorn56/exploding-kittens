/**
 * animations.js - ฟังก์ชันแอนิเมชั่นต่างๆ
 */

function showDrawCardAnimation(cardData, isMyCard) {
  var ci = cardData ? CARD_INFO[cardData.type] : null;
  var drawPile = document.getElementById('drawPileArea');
  if (!drawPile) return;

  var rect = drawPile.getBoundingClientRect();
  var startX = rect.left + rect.width / 2;
  var startY = rect.top + rect.height / 2;
  var endX = window.innerWidth / 2;
  var endY = window.innerHeight * 0.75;

  var flyCard = document.createElement('div');
  flyCard.className = 'fly-card-anim';
  flyCard.style.cssText = 'position:fixed;z-index:9992;pointer-events:none;' +
    'left:' + (startX - 50) + 'px;top:' + (startY - 70) + 'px;' +
    'width:100px;height:143px;border-radius:14px;overflow:hidden;' +
    'box-shadow:0 20px 60px rgba(0,0,0,0.8),0 0 30px rgba(201,151,58,0.5);' +
    'border:2px solid var(--gold);' +
    'transition:all 0.5s cubic-bezier(0.34,1.2,0.64,1);';

  if (ci) {
    var imgObj = cardData ? getCardImg(cardData) : null;
    var png = imgObj ? (imgObj.png || imgObj) : null;
    var jpg = imgObj ? (imgObj.jpg || null) : null;
    if (png) {
      var onErr = jpg
        ? 'this.onerror=function(){this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'};this.src=\'' + jpg + '\''
        : 'this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'';
      flyCard.innerHTML = '<img src="' + png + '" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="' + onErr + '">' +
        '<div style="width:100%;height:100%;display:none;align-items:center;justify-content:center;flex-direction:column;background:' + ci.color + '22;">' +
        '<div style="font-size:3rem;">' + ci.emoji + '</div></div>';
    } else {
      flyCard.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;flex-direction:column;background:' + ci.color + '22;gap:6px;">' +
        '<div style="font-size:3rem;">' + ci.emoji + '</div>' +
        '<div style="font-size:0.7rem;font-weight:800;color:white;font-family:Cinzel,serif;text-align:center;padding:0 4px;">' + ci.name + '</div></div>';
    }
  } else {
    flyCard.innerHTML = '<div style="width:100%;height:100%;background:linear-gradient(160deg,#8b1a1a,#c0392b,#7a1010);display:flex;align-items:center;justify-content:center;font-size:3rem;">💥</div>';
  }

  document.body.appendChild(flyCard);
  playSound('draw');

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      flyCard.style.left = (endX - 50) + 'px';
      flyCard.style.top  = (endY - 70) + 'px';
      flyCard.style.transform = 'scale(1.15) rotate(5deg)';
    });
  });

  setTimeout(function() {
    if (ci) showDrawResultPopup(ci, cardData);
    flyCard.style.transition = 'all 0.3s ease';
    flyCard.style.transform = 'scale(0.8) translateY(60px)';
    flyCard.style.opacity = '0';
    setTimeout(function() { if (flyCard.parentNode) flyCard.remove(); }, 350);
  }, 520);
}

function showDrawResultPopup(ci, cardData) {
  var old = document.getElementById('drawResultPopup');
  if (old) old.remove();

  var imgObj = cardData ? getCardImg(cardData) : null;
  var png = imgObj ? (imgObj.png || imgObj) : null;
  var jpg = imgObj ? (imgObj.jpg || null) : null;

  var imgHTML = '';
  if (png) {
    var onErr = jpg
      ? 'this.onerror=function(){this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'};this.src=\'' + jpg + '\''
      : 'this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'';
    imgHTML = '<img src="' + png + '" style="width:100%;height:100%;object-fit:cover;border-radius:12px;display:block;" onerror="' + onErr + '">' +
      '<div style="width:100%;height:100%;display:none;align-items:center;justify-content:center;font-size:3rem;border-radius:12px;background:' + ci.color + '22;">' + ci.emoji + '</div>';
  } else {
    imgHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3.5rem;border-radius:12px;background:' + ci.color + '22;">' + ci.emoji + '</div>';
  }

  var popup = document.createElement('div');
  popup.id = 'drawResultPopup';
  popup.style.cssText = 'position:fixed;bottom:200px;left:50%;transform:translateX(-50%) translateY(30px) scale(0.85);z-index:9993;' +
    'display:flex;flex-direction:column;align-items:center;gap:10px;' +
    'opacity:0;transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);pointer-events:none;';

  popup.innerHTML =
    '<div style="font-size:0.72rem;font-weight:700;color:rgba(255,255,255,0.6);letter-spacing:0.15em;text-transform:uppercase;background:rgba(0,0,0,0.6);padding:4px 14px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);">🎴 คุณได้ไพ่!</div>' +
    '<div style="width:90px;height:130px;border-radius:12px;overflow:hidden;box-shadow:0 16px 48px rgba(0,0,0,0.7),0 0 24px ' + ci.color + '66;border:2px solid ' + ci.color + ';">' + imgHTML + '</div>' +
    '<div style="background:rgba(5,15,10,0.95);border:1px solid ' + ci.color + '66;border-radius:20px;padding:8px 20px;text-align:center;box-shadow:0 4px 20px rgba(0,0,0,0.5);">' +
      '<div style="font-size:1.1rem;font-weight:900;color:' + ci.color + ';font-family:Cinzel,serif;">' + ci.emoji + ' ' + ci.name + '</div>' +
      '<div style="font-size:0.72rem;color:rgba(255,255,255,0.5);margin-top:3px;">' + ci.desc + '</div>' +
    '</div>';

  document.body.appendChild(popup);

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      popup.style.transform = 'translateX(-50%) translateY(0) scale(1)';
      popup.style.opacity = '1';
    });
  });

  setTimeout(function() {
    popup.style.transform = 'translateX(-50%) translateY(-20px) scale(0.9)';
    popup.style.opacity = '0';
    setTimeout(function() { if (popup.parentNode) popup.remove(); }, 400);
  }, 2200);
}

function showStealAnimation(fromPlayerId, stolenCard) {
  var fromChip = document.getElementById('pchip-' + fromPlayerId);
  if (!fromChip) return;

  var fromRect = fromChip.getBoundingClientRect();
  var startX = fromRect.left + fromRect.width / 2;
  var startY = fromRect.top + fromRect.height / 2;

  var ci = stolenCard ? CARD_INFO[stolenCard.type] : null;
  var imgObj = stolenCard ? getCardImg(stolenCard) : null;
  var png = imgObj ? (imgObj.png || imgObj) : null;
  var jpg = imgObj ? (imgObj.jpg || null) : null;

  fromChip.classList.add('stolen-from-flash');
  setTimeout(function() { fromChip.classList.remove('stolen-from-flash'); }, 600);

  var flyCard = document.createElement('div');
  flyCard.style.cssText = 'position:fixed;z-index:9992;pointer-events:none;' +
    'left:' + (startX - 45) + 'px;top:' + (startY - 63) + 'px;' +
    'width:90px;height:126px;border-radius:12px;overflow:hidden;' +
    'box-shadow:0 16px 48px rgba(0,0,0,0.8),0 0 20px rgba(255,165,0,0.6);' +
    'border:2px solid #f59e0b;' +
    'transition:all 0.6s cubic-bezier(0.34,1.1,0.64,1);';

  var innerContent = '';
  if (ci && png) {
    var onErr = jpg
      ? 'this.onerror=function(){this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'};this.src=\'' + jpg + '\''
      : 'this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'';
    innerContent = '<img src="' + png + '" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="' + onErr + '">' +
      '<div style="width:100%;height:100%;display:none;align-items:center;justify-content:center;background:' + ci.color + '22;font-size:2.5rem;">' + ci.emoji + '</div>';
  } else if (ci) {
    innerContent = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:' + ci.color + '22;font-size:2.5rem;">' + ci.emoji + '</div>';
  } else {
    innerContent = '<div style="width:100%;height:100%;background:linear-gradient(135deg,#7c3aed,#4c1d95);display:flex;align-items:center;justify-content:center;font-size:2.5rem;">🐱</div>';
  }
  flyCard.innerHTML = innerContent;
  document.body.appendChild(flyCard);

  playSound('steal');

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      var endX = window.innerWidth / 2;
      var endY = window.innerHeight * 0.75;
      flyCard.style.left = (endX - 45) + 'px';
      flyCard.style.top  = (endY - 63) + 'px';
      flyCard.style.transform = 'rotate(15deg) scale(1.1)';
    });
  });

  setTimeout(function() {
    if (ci) showStealResultPopup(ci, fromPlayerId, stolenCard);
    flyCard.style.transition = 'all 0.3s ease';
    flyCard.style.opacity = '0';
    flyCard.style.transform = 'scale(0.6) translateY(40px)';
    setTimeout(function() { if (flyCard.parentNode) flyCard.remove(); }, 350);
  }, 650);
}

function showStealResultPopup(ci, fromPlayerId, stolenCard) {
  var old = document.getElementById('stealResultPopup');
  if (old) old.remove();

  var fromName = gs.playerNames[fromPlayerId] || '?';
  var imgObj = stolenCard ? getCardImg(stolenCard) : null;
  var png = imgObj ? (imgObj.png || imgObj) : null;
  var jpg = imgObj ? (imgObj.jpg || null) : null;

  var imgHTML = '';
  if (png) {
    var onErr = jpg
      ? 'this.onerror=function(){this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'};this.src=\'' + jpg + '\''
      : 'this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'';
    imgHTML = '<img src="' + png + '" style="width:100%;height:100%;object-fit:cover;border-radius:10px;display:block;" onerror="' + onErr + '">' +
      '<div style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:3rem;border-radius:10px;background:' + ci.color + '22;">' + ci.emoji + '</div>';
  } else {
    imgHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:3rem;border-radius:10px;background:' + ci.color + '22;">' + ci.emoji + '</div>';
  }

  var popup = document.createElement('div');
  popup.id = 'stealResultPopup';
  popup.style.cssText = 'position:fixed;bottom:180px;left:50%;transform:translateX(-50%) scale(0.8);z-index:9993;' +
    'display:flex;flex-direction:column;align-items:center;gap:8px;' +
    'opacity:0;transition:all 0.4s cubic-bezier(0.34,1.56,0.64,1);pointer-events:none;';

  popup.innerHTML =
    '<div style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);border-radius:20px;padding:4px 16px;font-size:0.72rem;font-weight:700;color:#f59e0b;letter-spacing:0.1em;">🐱 ขโมยสำเร็จ!</div>' +
    '<div style="display:flex;align-items:center;gap:14px;background:rgba(5,15,10,0.95);border:1px solid rgba(245,158,11,0.3);border-radius:16px;padding:14px 20px;box-shadow:0 8px 32px rgba(0,0,0,0.6);">' +
      '<div style="width:72px;height:103px;border-radius:10px;overflow:hidden;flex-shrink:0;box-shadow:0 6px 20px rgba(0,0,0,0.5);border:2px solid ' + ci.color + ';">' + imgHTML + '</div>' +
      '<div>' +
        '<div style="font-size:0.7rem;color:rgba(255,255,255,0.4);margin-bottom:4px;">จาก <strong style="color:#f59e0b;">' + escHtml(fromName) + '</strong></div>' +
        '<div style="font-size:1rem;font-weight:900;color:' + ci.color + ';font-family:Cinzel,serif;">' + ci.emoji + ' ' + ci.name + '</div>' +
        '<div style="font-size:0.68rem;color:rgba(255,255,255,0.4);margin-top:4px;max-width:140px;">' + ci.desc + '</div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(popup);

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      popup.style.transform = 'translateX(-50%) scale(1)';
      popup.style.opacity = '1';
    });
  });

  setTimeout(function() {
    popup.style.transform = 'translateX(-50%) scale(0.85) translateY(-15px)';
    popup.style.opacity = '0';
    setTimeout(function() { if (popup.parentNode) popup.remove(); }, 400);
  }, 3000);
}

function showTurnChangeAnimation(isMe, playerName) {
  var old = document.getElementById('turnChangeAnim');
  if (old) old.remove();

  var el = document.createElement('div');
  el.id = 'turnChangeAnim';

  if (isMe) {
    el.style.cssText = 'position:fixed;inset:0;z-index:9988;pointer-events:none;display:flex;align-items:center;justify-content:center;';
    el.innerHTML =
      '<div class="turn-change-spotlight"></div>' +
      '<div class="turn-change-label my-turn-label">' +
        '<div style="font-size:2.5rem;margin-bottom:8px;animation:bounce-icon 0.6s ease infinite;">🎯</div>' +
        '<div style="font-family:Cinzel,serif;font-size:1.4rem;font-weight:900;color:#f0c060;text-shadow:0 0 20px rgba(240,192,96,0.8);">เทิร์นของคุณ!</div>' +
      '</div>';
  } else {
    el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:9988;pointer-events:none;';
    el.innerHTML =
      '<div class="turn-change-pill">' +
        '🎲 เทิร์นของ <strong>' + escHtml(playerName || '?') + '</strong>' +
      '</div>';
  }

  document.body.appendChild(el);
  setTimeout(function() {
    el.style.transition = 'opacity 0.4s ease';
    el.style.opacity = '0';
    setTimeout(function() { if (el.parentNode) el.remove(); }, 450);
  }, isMe ? 1400 : 900);
}

function showExplodeAnimation(playerName, isMe) {
  document.body.classList.add('screen-shake');
  setTimeout(function() { document.body.classList.remove('screen-shake'); }, 700);

  var container = document.createElement('div');
  container.style.cssText = 'position:fixed;inset:0;z-index:9995;pointer-events:none;overflow:hidden;';

  var particles = ['💥','🔥','💨','✨','⚡','🌟','💫'];
  var html = '';
  for (var i = 0; i < 24; i++) {
    var angle = (i / 24) * 360;
    var dist = 80 + Math.random() * 180;
    var delay = Math.random() * 0.3;
    var size = 1.5 + Math.random() * 2;
    var dx = Math.cos(angle * Math.PI/180) * dist;
    var dy = Math.sin(angle * Math.PI/180) * dist;
    var emoji = particles[Math.floor(Math.random() * particles.length)];
    html += '<div style="position:absolute;left:50%;top:50%;' +
      'font-size:' + size + 'rem;' +
      'transform:translate(-50%,-50%);' +
      'animation:explode-particle 0.8s cubic-bezier(0.2,0,0.8,1) ' + delay + 's forwards;' +
      '--dx:' + dx + 'px;--dy:' + dy + 'px;' +
      '">' + emoji + '</div>';
  }

  html += '<div style="position:absolute;inset:0;background:radial-gradient(circle at 50% 45%,rgba(255,100,0,0.7) 0%,rgba(255,0,0,0.4) 30%,transparent 70%);animation:explode-flash 0.5s ease forwards;"></div>';

  container.innerHTML = html;
  document.body.appendChild(container);

  var textEl = document.createElement('div');
  textEl.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0.5);z-index:9996;pointer-events:none;text-align:center;transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);opacity:0;';
  textEl.innerHTML =
    '<div style="font-size:5rem;animation:explode-emoji-pulse 0.4s ease;">💥</div>' +
    '<div style="font-family:Cinzel,serif;font-size:1.4rem;font-weight:900;color:#ff4040;text-shadow:0 0 30px rgba(255,64,64,0.9);margin-top:8px;">' +
      (isMe ? 'คุณระเบิดแล้ว! 💀' : escHtml(playerName) + ' ระเบิด! 💀') +
    '</div>';
  document.body.appendChild(textEl);

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      textEl.style.transform = 'translate(-50%,-50%) scale(1)';
      textEl.style.opacity = '1';
    });
  });

  setTimeout(function() {
    textEl.style.opacity = '0';
    textEl.style.transform = 'translate(-50%,-50%) scale(0.8)';
    if (container.parentNode) container.remove();
    setTimeout(function() { if (textEl.parentNode) textEl.remove(); }, 400);
  }, 1800);
}

function showAttackAnimation(playerName, targetName) {
  var el = document.createElement('div');
  el.style.cssText = 'position:fixed;inset:0;z-index:9990;pointer-events:none;display:flex;align-items:center;justify-content:center;';

  el.innerHTML =
    '<div class="attack-flash-bg"></div>' +
    '<div class="attack-content">' +
      '<div class="attack-lightning">⚔️</div>' +
      '<div class="attack-text">' +
        '<div style="font-size:0.8rem;color:rgba(255,200,100,0.7);margin-bottom:6px;">' + escHtml(playerName) + ' โจมตี!</div>' +
        '<div style="font-family:Cinzel,serif;font-size:1.5rem;font-weight:900;color:#ff8c00;">ATTACK!</div>' +
        (targetName ? '<div style="font-size:0.75rem;color:rgba(255,180,80,0.8);margin-top:4px;">▶ ' + escHtml(targetName) + ' เล่น 2 เทิร์น</div>' : '') +
      '</div>' +
    '</div>';

  document.body.appendChild(el);
  setTimeout(function() {
    el.style.transition = 'opacity 0.4s ease';
    el.style.opacity = '0';
    setTimeout(function() { if (el.parentNode) el.remove(); }, 450);
  }, 1200);
}

function showSkipAnimation(playerName, isMe) {
  var el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-150%);z-index:9988;pointer-events:none;' +
    'transition:transform 0.4s cubic-bezier(0.34,1.2,0.64,1);';

  el.innerHTML =
    '<div class="skip-pill">' +
      '<span style="font-size:1.3rem;">⏭️</span>' +
      '<div>' +
        '<div style="font-family:Cinzel,serif;font-weight:800;font-size:0.9rem;">' + (isMe ? 'คุณ SKIP!' : escHtml(playerName) + ' SKIP!') + '</div>' +
        '<div style="font-size:0.68rem;color:rgba(255,255,255,0.5);">ข้ามเทิร์น ไม่ต้องจั่วไพ่</div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(el);
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      el.style.transform = 'translateX(-50%)';
    });
  });

  setTimeout(function() {
    el.style.transform = 'translateX(150%)';
    setTimeout(function() { if (el.parentNode) el.remove(); }, 450);
  }, 1100);
}

function showDealCardsAnimation(cardCount) {
  var handEl = document.getElementById('myHand');
  if (!handEl) return;

  var cards = handEl.querySelectorAll('.hand-card');
  cards.forEach(function(card, i) {
    card.style.opacity = '0';
    card.style.transform = 'translateY(-120px) rotate(' + (Math.random()*30-15) + 'deg) scale(0.7)';
    setTimeout(function() {
      card.style.transition = 'all 0.45s cubic-bezier(0.34,1.56,0.64,1)';
      card.style.opacity = '1';
      card.style.transform = '';
      playSound('deal');
    }, i * 80 + 100);
  });
}

function showConfettiAnimation() {
  var container = document.createElement('div');
  container.id = 'confettiContainer';
  container.style.cssText = 'position:fixed;inset:0;z-index:9997;pointer-events:none;overflow:hidden;';

  var colors = ['#f0c060','#ff6b6b','#4ade80','#60a5fa','#f472b6','#a78bfa','#fb923c'];
  var shapes = ['■','●','▲','★','◆'];
  var html = '';

  for (var i = 0; i < 80; i++) {
    var color = colors[Math.floor(Math.random() * colors.length)];
    var shape = shapes[Math.floor(Math.random() * shapes.length)];
    var x = Math.random() * 100;
    var delay = Math.random() * 1.5;
    var duration = 2 + Math.random() * 2;
    var size = 0.6 + Math.random() * 1;
    var rotStart = Math.random() * 360;
    html += '<div style="position:absolute;top:-5%;left:' + x + '%;color:' + color + ';font-size:' + size + 'rem;' +
      'animation:confetti-fall ' + duration + 's ease-in ' + delay + 's forwards;' +
      'transform:rotate(' + rotStart + 'deg);' +
      '">' + shape + '</div>';
  }

  container.innerHTML = html;
  document.body.appendChild(container);
  setTimeout(function() { if (container.parentNode) container.remove(); }, 5000);
}

function showCardPlayedOverlay(data) {
  var old = document.getElementById('cardPlayedOverlay');
  var oldBd = document.getElementById('cardPlayedBackdrop');
  if (old) old.remove();
  if (oldBd) oldBd.remove();

  var ci = CARD_INFO[data.cards && data.cards[0] && data.cards[0].type];
  if (!ci) return;

  var card = data.cards && data.cards[0];
  var imgObj = card ? getCardImg(card) : null;
  var png = imgObj ? (imgObj.png || imgObj) : null;
  var jpg = imgObj ? (imgObj.jpg || null) : null;

  var cardType = card && card.type;
  var isMe = data.playerId === gs.myId;
  var pName = isMe ? 'คุณ' : (data.playerName || '?');

  if (cardType === 'attack') {
    playSound('attack');
    setTimeout(function() { showAttackAnimation(pName, null); }, 300);
  } else if (cardType === 'skip') {
    playSound('skip');
    setTimeout(function() { showSkipAnimation(pName, isMe); }, 200);
  }

  var cardContent;
  if (png) {
    var onErr = jpg
      ? 'this.onerror=function(){this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'};this.src=\'' + jpg + '\''
      : 'this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'';
    cardContent =
      '<img src="' + png + '" onerror="' + onErr + '" style="width:100%;height:100%;object-fit:cover;display:block;">' +
      '<div class="fallback-inner" style="display:none;"><div class="fe">' + ci.emoji + '</div><div class="fn">' + ci.name + '</div></div>';
  } else {
    cardContent = '<div class="fallback-inner"><div class="fe">' + ci.emoji + '</div><div class="fn">' + ci.name + '</div></div>';
  }

  var isMe2 = data.playerId === gs.myId;
  var playerLabel = isMe2 ? 'คุณ' : escHtml(data.playerName);
  var cardCount = data.cards ? data.cards.length : 1;
  var countLabel = cardCount > 1 ? ' ×' + cardCount : '';
  var labelHTML = '<span class="player-name-hi">' + playerLabel + '</span> เล่น ' + ci.emoji + ' ' + ci.name + countLabel;

  var bd = document.createElement('div');
  bd.id = 'cardPlayedBackdrop';
  bd.className = 'card-played-backdrop';
  document.body.appendChild(bd);

  var overlay = document.createElement('div');
  overlay.id = 'cardPlayedOverlay';
  overlay.innerHTML =
    '<div class="card-played-popup">' +
      '<div class="card-played-card">' + cardContent + '</div>' +
      '<div class="card-played-label">' + labelHTML + '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  setTimeout(function() {
    var el = document.getElementById('cardPlayedOverlay');
    var elBd = document.getElementById('cardPlayedBackdrop');
    if (el) el.remove();
    if (elBd) elBd.remove();
  }, 2300);
}

function showShuffleAnimation(playerName) {
  var old = document.getElementById('shuffleOverlay');
  var oldBd = document.getElementById('shuffleBackdrop');
  if (old) old.remove();
  if (oldBd) oldBd.remove();

  var bd = document.createElement('div');
  bd.id = 'shuffleBackdrop';
  bd.className = 'shuffle-backdrop';
  document.body.appendChild(bd);

  var overlay = document.createElement('div');
  overlay.id = 'shuffleOverlay';

  var anims = ['shuffle-fly-left','shuffle-fly-right','shuffle-fly-up','shuffle-fly-left','shuffle-fly-right'];
  var delays = [0, 0.05, 0.1, 0.15, 0.08];
  var cards = '';
  for (var i = 0; i < 5; i++) {
    cards += '<div class="shuffle-card" style="' +
      'animation:' + anims[i] + ' 0.8s cubic-bezier(0.34,1.2,0.64,1) ' + delays[i] + 's forwards,shuffle-glow 0.8s ease ' + delays[i] + 's forwards;' +
      'z-index:' + (5-i) + ';transform-origin:bottom center;"></div>';
  }

  var isMe = playerName === (gs.playerNames && gs.playerNames[gs.myId]);
  var label = (isMe ? 'คุณ' : escHtml(playerName)) + ' สับกองไพ่ 🔀';

  overlay.innerHTML =
    '<div class="shuffle-anim-wrap">' +
      '<div class="shuffle-deck">' + cards + '</div>' +
      '<div class="shuffle-label">' + label + '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  setTimeout(function() {
    var el = document.getElementById('shuffleOverlay');
    var elBd = document.getElementById('shuffleBackdrop');
    if (el) el.remove();
    if (elBd) elBd.remove();
  }, 1800);
}
