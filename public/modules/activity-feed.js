/**
 * activity-feed.js - Activity Feed แบบ Kill Feed
 * แสดงสถานะการกระทำของผู้เล่นทุกคนแบบ real-time
 * ลอยขึ้นมุมขวาบน ซ้อนกันได้สูงสุด 5 รายการ
 */

var _feedContainer = null;
var _feedItems = [];
var MAX_FEED_ITEMS = 5;

function getFeedContainer() {
  if (!_feedContainer) {
    _feedContainer = document.createElement('div');
    _feedContainer.id = 'activityFeed';
    var isMobile = window.innerWidth <= 520;
    _feedContainer.style.cssText = [
      'position:fixed',
      'top:70px',
      'z-index:9970',
      'display:flex',
      'flex-direction:column',
      'gap:5px',
      'align-items:' + (isMobile ? 'stretch' : 'flex-end'),
      'pointer-events:none',
      'max-width:' + (isMobile ? 'min(92vw, 420px)' : '280px'),
      'width:' + (isMobile ? 'min(92vw, 420px)' : 'auto'),
      'right:' + (isMobile ? 'auto' : '12px'),
      'left:' + (isMobile ? '50%' : 'auto'),
      'transform:' + (isMobile ? 'translateX(-50%)' : 'none'),
    ].join(';');
    document.body.appendChild(_feedContainer);
  }
  return _feedContainer;
}

/**
 * addFeedEvent(opts)
 * opts: {
 *   icon    : string HTML (ICONS.* หรือ emoji)
 *   actor   : string ชื่อผู้เล่น (ไม่ต้องใส่ถ้าเป็น system)
 *   isMe    : bool (actor = ผู้เล่นเรา)
 *   text    : string ข้อความหลัก
 *   sub     : string ข้อความเสริม (optional)
 *   color   : string accent color (optional, default gold)
 *   duration: number ms (default 4500)
 *   type    : 'normal'|'danger'|'good'|'warn' (optional)
 * }
 */
function addFeedEvent(opts) {
  var container = getFeedContainer();
  var duration  = opts.duration || 4500;
  var isMobile = window.innerWidth <= 520;

  // ลบรายการเก่าถ้าเกิน MAX
  while (_feedItems.length >= MAX_FEED_ITEMS) {
    var old = _feedItems.shift();
    if (old && old.parentNode) {
      old.style.opacity = '0';
      old.style.transform = 'translateX(20px) scale(0.9)';
      setTimeout(function(el) { if (el.parentNode) el.remove(); }, 250, old);
    }
  }

  var accentColor = opts.color || 'rgba(201,151,58,0.7)';
  if (opts.type === 'danger') accentColor = 'rgba(239,68,68,0.7)';
  else if (opts.type === 'good') accentColor = 'rgba(34,197,94,0.7)';
  else if (opts.type === 'warn') accentColor = 'rgba(249,115,22,0.7)';

  var item = document.createElement('div');
  item.style.cssText = [
    'display:flex',
    'align-items:center',
    'gap:8px',
    'padding:' + (isMobile ? '10px 14px 10px 12px' : '7px 12px 7px 10px'),
    'background:rgba(5,18,12,0.92)',
    'border:1px solid ' + accentColor,
    'border-left:3px solid ' + accentColor,
    'border-radius:10px',
    'font-family:Kanit,sans-serif',
    'font-size:' + (isMobile ? '0.92rem' : '0.78rem'),
    'color:rgba(245,230,200,0.92)',
    'box-shadow:0 4px 16px rgba(0,0,0,0.5)',
    'backdrop-filter:blur(8px)',
    '-webkit-backdrop-filter:blur(8px)',
    'max-width:100%',
    'line-height:' + (isMobile ? '1.35' : '1.25'),
    'opacity:0',
    'transform:translateX(30px)',
    'transition:opacity 0.25s ease, transform 0.25s cubic-bezier(0.34,1.3,0.64,1)',
    'will-change:opacity,transform',
  ].join(';');

  var actorHTML = '';
  if (opts.actor) {
    var actorColor = opts.isMe ? '#fde68a' : 'rgba(245,230,200,0.75)';
    actorHTML = '<span style="font-weight:800;color:' + actorColor + ';white-space:nowrap;max-width:' + (isMobile ? '140px' : '80px') + ';overflow:hidden;text-overflow:ellipsis;display:inline-block;vertical-align:bottom;">' + escHtml(opts.actor) + '</span> ';
  }

  var subHTML = opts.sub
    ? '<div style="font-size:' + (isMobile ? '0.78rem' : '0.68rem') + ';color:rgba(245,230,200,0.45);margin-top:1px;line-height:1.2;">' + opts.sub + '</div>'
    : '';

  item.innerHTML =
    '<div style="font-size:' + (isMobile ? '1.05rem' : '0.9rem') + ';flex-shrink:0;line-height:1;">' + opts.icon + '</div>' +
    '<div style="min-width:0;">' +
      '<div style="line-height:1.3;">' + actorHTML + opts.text + '</div>' +
      subHTML +
    '</div>';

  container.appendChild(item);
  _feedItems.push(item);

  // animate in
  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      item.style.opacity = '1';
      item.style.transform = 'translateX(0)';
    });
  });

  // auto remove
  var removeTimer = setTimeout(function() {
    removeFeedItem(item);
  }, duration);
  item._removeTimer = removeTimer;

  return item;
}

function removeFeedItem(item) {
  clearTimeout(item._removeTimer);
  item.style.transition = 'opacity 0.3s ease, transform 0.3s ease, max-height 0.3s ease, margin 0.3s ease, padding 0.3s ease';
  item.style.opacity = '0';
  item.style.transform = 'translateX(20px)';
  item.style.maxHeight = '0';
  item.style.paddingTop = '0';
  item.style.paddingBottom = '0';
  item.style.marginTop = '0';
  setTimeout(function() {
    var idx = _feedItems.indexOf(item);
    if (idx !== -1) _feedItems.splice(idx, 1);
    if (item.parentNode) item.remove();
  }, 320);
}

function clearFeed() {
  _feedItems.forEach(function(item) {
    clearTimeout(item._removeTimer);
    if (item.parentNode) item.remove();
  });
  _feedItems = [];
}

// ─── Helper functions สำหรับ event ต่างๆ ─────────────────────────────────────

function feedCardPlayed(playerName, isMe, cardType, cardCount) {
  var ci = getCardInfo(cardType);
  var icon = (CARD_ICONS && CARD_ICONS[cardType]) || ICONS.card;
  var countStr = cardCount > 1 ? ' ×' + cardCount : '';
  var text = (ci ? ci.name : cardType) + countStr;
  var type = 'normal';
  if (cardType === 'attack') type = 'warn';
  else if (cardType === 'nope') type = 'danger';
  else if (cardType === 'defuse') type = 'good';
  addFeedEvent({
    icon: icon, actor: playerName, isMe: isMe,
    text: 'เล่น ' + text,
    type: type,
    color: ci ? ci.color + 'aa' : undefined,
    duration: 3500,
  });
}

function feedDrawCard(playerName, isMe) {
  addFeedEvent({
    icon: ICONS.draw,
    actor: playerName, isMe: isMe,
    text: 'จั่วไพ่',
    duration: 2500,
  });
}

function feedPlayerExploded(playerName, isMe) {
  addFeedEvent({
    icon: ICONS.explode,
    actor: playerName, isMe: isMe,
    text: 'ระเบิดแล้ว! 💀',
    type: 'danger',
    duration: 6000,
  });
}

function feedDefused(playerName, isMe) {
  addFeedEvent({
    icon: ICONS.defuse,
    actor: playerName, isMe: isMe,
    text: 'ปลดชนวนสำเร็จ!',
    type: 'good',
    duration: 4000,
  });
}

function feedStolenCard(byName, byIsMe, fromName, cardName) {
  addFeedEvent({
    icon: ICONS.steal,
    actor: byName, isMe: byIsMe,
    text: 'ขโมย ' + (cardName || 'การ์ด'),
    sub: 'จาก ' + escHtml(fromName),
    type: 'warn',
    duration: 4500,
  });
}

function feedFavorGiven(fromName, toName, cardName) {
  addFeedEvent({
    icon: ICONS.favor,
    actor: fromName,
    text: 'ให้ ' + (cardName || 'การ์ด'),
    sub: 'แก่ ' + escHtml(toName),
    duration: 4000,
  });
}

function feedNopePlayed(playerName, isNoped) {
  addFeedEvent({
    icon: ICONS.nope,
    actor: playerName,
    text: isNoped ? 'NOPE!' : 'Nope the Nope!',
    type: 'danger',
    color: 'rgba(236,72,153,0.7)',
    duration: 3000,
  });
}

function feedShuffled(playerName, isMe) {
  addFeedEvent({
    icon: ICONS.shuffle,
    actor: playerName, isMe: isMe,
    text: 'สับกองไพ่',
    duration: 3000,
  });
}

function feedAttacked(playerName, isMe, turns) {
  addFeedEvent({
    icon: ICONS.attack,
    actor: playerName, isMe: isMe,
    text: 'Attack!',
    sub: 'คนถัดไปเล่น ' + turns + ' เทิร์น',
    type: 'warn',
    duration: 4500,
  });
}

function feedInsertedKitten(playerName, isMe, position) {
  addFeedEvent({
    icon: ICONS.defuse,
    actor: playerName, isMe: isMe,
    text: 'ใส่แมวระเบิดที่ตำแหน่ง X',
    type: 'good',
    duration: 3500,
  });
}

function feedTurnChanged(playerName, isMe) {
  addFeedEvent({
    icon: isMe ? ICONS.myTurn : ICONS.turn,
    actor: playerName, isMe: isMe,
    text: isMe ? 'เทิร์นของคุณ!' : 'เทิร์น',
    color: isMe ? 'rgba(240,192,96,0.8)' : 'rgba(201,151,58,0.5)',
    duration: 2200,
  });
}