const express = require('express');
require('dotenv').config();
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URL = process.env.MONGO_URL || process.env.MONGODB_URI;
if (!MONGO_URL) {
  console.warn('⚠️  MONGO_URL / MONGODB_URI is not set.');
} else {
  mongoose.connect(MONGO_URL)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('Failed to connect MongoDB:', err));
}

const userSchema = new mongoose.Schema({
  email:        { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  displayName:  { type: String, required: true },
  avatarUrl:    { type: String, default: null },
  isAdmin:      { type: Boolean, default: false },
  rank: {
    name:  { type: String, default: null },
    color: { type: String, default: '#f97316' }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

function publicUserRow(user) {
  if (!user) return null;
  return {
    id: user._id.toString(), email: user.email, displayName: user.displayName,
    avatarUrl: user.avatarUrl || null, isAdmin: !!user.isAdmin,
    rank: (user.rank && user.rank.name) ? { name: user.rank.name, color: user.rank.color || '#f97316' } : null
  };
}

const rooms = {};

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.post('/api/signup', async (req, res) => {
  if (!MONGO_URL || mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'MongoDB ยังไม่ได้เชื่อมต่อ' });
  const { email, password, displayName, avatarUrl } = req.body || {};
  if (!email || !password || !displayName) return res.status(400).json({ error: 'ต้องกรอก email, password และ displayName' });
  try {
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    const existing = await User.findOne({ email }).lean();
    if (existing) return res.status(409).json({ error: 'อีเมลนี้ถูกใช้ไปแล้ว' });
    const created = await User.create({ email, passwordHash: bcrypt.hashSync(password, 10), displayName, avatarUrl: avatarUrl || null, isAdmin: !!(adminEmail && email.toLowerCase() === adminEmail) });
    res.json({ user: publicUserRow(created) });
  } catch (err) { res.status(500).json({ error: 'สมัครไม่สำเร็จ' }); }
});

app.post('/api/login', async (req, res) => {
  if (!MONGO_URL || mongoose.connection.readyState !== 1) return res.status(503).json({ error: 'MongoDB ยังไม่ได้เชื่อมต่อ' });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'ต้องกรอก email และ password' });
  try {
    const user = await User.findOne({ email }).exec();
    if (!user || !bcrypt.compareSync(password, user.passwordHash)) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
    const adminEmail = (process.env.ADMIN_EMAIL || '').toLowerCase();
    if (adminEmail && email.toLowerCase() === adminEmail && !user.isAdmin) { user.isAdmin = true; await user.save(); }
    res.json({ user: publicUserRow(user) });
  } catch (err) { res.status(500).json({ error: 'ล็อกอินไม่สำเร็จ' }); }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).exec();
    if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    res.json({ user: publicUserRow(user) });
  } catch (err) { res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' }); }
});

app.put('/api/users/:id', async (req, res) => {
  const { displayName, avatarUrl } = req.body || {};
  try {
    const user = await User.findById(req.params.id).exec();
    if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    if (displayName) user.displayName = displayName;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
    await user.save();
    res.json({ user: publicUserRow(user) });
  } catch (err) { res.status(500).json({ error: 'อัปเดตไม่สำเร็จ' }); }
});

app.put('/api/users/:id/rank', async (req, res) => {
  const { rankName, rankColor } = req.body || {};
  const adminId = req.headers['x-admin-id'];
  if (!adminId) return res.status(403).json({ error: 'ต้องเป็น admin' });
  try {
    const admin = await User.findById(adminId).lean();
    if (!admin || !admin.isAdmin) return res.status(403).json({ error: 'ต้องเป็น admin' });
    const target = await User.findById(req.params.id).exec();
    if (!target) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    target.rank = (!rankName || rankName.trim() === '') ? { name: null, color: '#f97316' } : { name: rankName.trim(), color: rankColor || '#f97316' };
    await target.save();
    const updatedUser = publicUserRow(target);
    io.emit('rank-updated', { userId: target._id.toString(), rank: updatedUser.rank });
    res.json({ user: updatedUser });
  } catch (err) { res.status(500).json({ error: 'อัปเดตยศไม่สำเร็จ' }); }
});

app.get('/api/users/search/:email', async (req, res) => {
  const adminId = req.headers['x-admin-id'];
  if (!adminId) return res.status(403).json({ error: 'ต้องเป็น admin' });
  try {
    const admin = await User.findById(adminId).lean();
    if (!admin || !admin.isAdmin) return res.status(403).json({ error: 'ต้องเป็น admin' });
    const user = await User.findOne({ email: req.params.email }).lean();
    if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
    res.json({ user: publicUserRow(user) });
  } catch (err) { res.status(500).json({ error: 'ค้นหาไม่สำเร็จ' }); }
});

app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) return res.status(413).json({ error: 'ไฟล์ใหญ่เกินไป' });
  res.status(500).json({ error: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
});

function canControlRoom(room, socket) {
  if (!room) return false;
  return socket.id === room.creator || socket.isAdmin;
}

// ─── Exploding Kittens Game Logic ────────────────────────────────────────────
const C = {
  EXPLODING: 'exploding_kitten', DEFUSE: 'defuse',
  SEE_FUTURE: 'see_the_future', SHUFFLE: 'shuffle',
  SKIP: 'skip', ATTACK: 'attack', NOPE: 'nope', FAVOR: 'favor',
  TACO: 'taco_cat', POTATO: 'hairy_potato_cat',
  BEARD: 'beard_cat', RAINBOW: 'rainbow_cat', WATERMELON: 'cattermelon',
  // ✅ FIX: เพิ่มการ์ดใหม่ทั้ง 6 ตัว
  ALTER_FUTURE: 'alter_the_future',
  CLAIRVOYANCE: 'clairvoyance',
  CLONE: 'clone',
  DIG_DEEPER: 'dig_deeper',
  DRAW_BOTTOM: 'draw_from_bottom',
  REVERSE: 'reverse',
};

// ✅ FIX: เพิ่มการ์ดใหม่ใน CARD_INFO
const CARD_INFO = {
  exploding_kitten: { emoji: '💥', name: 'Exploding Kitten', color: '#ef4444', desc: 'จั่วใบนี้แล้วไม่มี Defuse = ตายทันที!' },
  defuse:           { emoji: '🛡️', name: 'Defuse', color: '#22c55e', desc: 'ป้องกันการระเบิด แล้วใส่ Exploding Kitten คืนกอง' },
  see_the_future:   { emoji: '🔮', name: 'See the Future', color: '#8b5cf6', desc: 'ดูไพ่ 3 ใบบนสุดของกองแบบลับๆ' },
  shuffle:          { emoji: '🔀', name: 'Shuffle', color: '#3b82f6', desc: 'ผสมกองไพ่กลางใหม่ทั้งหมด' },
  skip:             { emoji: '⏭️', name: 'Skip', color: '#06b6d4', desc: 'จบเทิร์นโดยไม่ต้องจั่วไพ่' },
  attack:           { emoji: '⚔️', name: 'Attack', color: '#f97316', desc: 'จบเทิร์นตัวเอง บังคับคนถัดไปเล่น 2 เทิร์น' },
  nope:             { emoji: '🚫', name: 'Nope', color: '#ec4899', desc: 'ยกเลิกการ์ดที่คนอื่นเพิ่งเล่น ใช้ได้ทุกเมื่อ' },
  favor:            { emoji: '🙀', name: 'Favor', color: '#eab308', desc: 'บังคับผู้เล่นคนหนึ่งให้ไพ่ 1 ใบ' },
  taco_cat:         { emoji: '🌮', name: 'Taco Cat', color: '#f59e0b', desc: 'ไพ่แมว — ใช้คู่ขโมยไพ่สุ่ม, 3 ใบ = ขโมยไพ่ที่ต้องการ' },
  hairy_potato_cat: { emoji: '🥔', name: 'Hairy Potato Cat', color: '#a3a3a3', desc: 'ไพ่แมว — ใช้คู่ขโมยไพ่สุ่ม, 3 ใบ = ขโมยไพ่ที่ต้องการ' },
  beard_cat:        { emoji: '🧔', name: 'Beard Cat', color: '#78716c', desc: 'ไพ่แมว — ใช้คู่ขโมยไพ่สุ่ม, 3 ใบ = ขโมยไพ่ที่ต้องการ' },
  rainbow_cat:      { emoji: '🌈', name: 'Rainbow Cat', color: '#a855f7', desc: 'ไพ่แมว — ใช้คู่ขโมยไพ่สุ่ม, 3 ใบ = ขโมยไพ่ที่ต้องการ' },
  cattermelon:      { emoji: '🍉', name: 'Cattermelon', color: '#4ade80', desc: 'ไพ่แมว — ใช้คู่ขโมยไพ่สุ่ม, 3 ใบ = ขโมยไพ่ที่ต้องการ' },
  // ✅ FIX: การ์ดใหม่
  alter_the_future: { emoji: '👁️', name: 'Alter the Future', color: '#8b5cf6', desc: 'ดูไพ่ 3 ใบบนสุดแล้วเรียงลำดับใหม่ (เป็นความลับ)' },
  clairvoyance:     { emoji: '🔮', name: 'Clairvoyance', color: '#06b6d4', desc: 'เล่นหลัง Defuse — รู้ว่า Exploding Kitten ถูกใส่ที่ไหน' },
  clone:            { emoji: '📋', name: 'Clone', color: '#6366f1', desc: 'คัดลอกการ์ดใต้ใบนี้แล้วใช้กฎของมัน' },
  dig_deeper:       { emoji: '🔍', name: 'Dig Deeper', color: '#3b82f6', desc: 'จั่ว 2 ใบ เก็บ 1 ใบ คืน 1 ใบลงกองที่จั่วไป' },
  draw_from_bottom: { emoji: '⬇️', name: 'Draw from the Bottom', color: '#10b981', desc: 'ป้องกัน Attack — จั่วจากใบล่างของกอง (ลด 1 ตาต่อใบ)' },
  reverse:          { emoji: '🔄', name: 'Reverse', color: '#ec4899', desc: 'ย้อนลำดับการเล่น หรือทำหน้าที่เป็น Skip (2 ผู้เล่น)' },
};

const CAT_CARDS = [C.TACO, C.POTATO, C.BEARD, C.RAINBOW, C.WATERMELON];

// ✅ FIX: การ์ดที่สามารถถูก Nope ได้ (ไม่รวม cat card combos ซึ่ง handle แยก)
const NOPEABLE_TYPES = [
  C.SEE_FUTURE, C.SHUFFLE, C.SKIP, C.ATTACK, C.FAVOR,
  C.ALTER_FUTURE, C.CLAIRVOYANCE, C.CLONE, C.DIG_DEEPER, C.DRAW_BOTTOM, C.REVERSE,
  ...CAT_CARDS
];

function shuffleArr(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

let globalCardId = 1;

// ✅ FIX: เพิ่ม CARD_VARIANTS ของการ์ดใหม่ (1 variant = ไฟล์เดียว)
const CARD_VARIANTS = {
  exploding_kitten: 3, defuse: 3, see_the_future: 3, shuffle: 3,
  skip: 3, attack: 3, nope: 3, favor: 3,
  taco_cat: 3, hairy_potato_cat: 3, beard_cat: 3, rainbow_cat: 3, cattermelon: 3,
  // การ์ดใหม่ — มีไฟล์เดียว (1 variant)
  alter_the_future: 1, clairvoyance: 1, clone: 1,
  dig_deeper: 1, draw_from_bottom: 1, reverse: 1,
};

function makeCard(type) {
  const numVariants = CARD_VARIANTS[type] || 1;
  const card = { id: globalCardId++, type };
  if (numVariants > 1) card.variantIndex = Math.floor(Math.random() * numVariants);
  return card;
}

// ✅ FIX: เพิ่มการ์ดใหม่ใน DEFAULT_CARD_COUNTS
const DEFAULT_CARD_COUNTS = {
  [C.SEE_FUTURE]: 5,  [C.SHUFFLE]: 4,    [C.SKIP]: 4,
  [C.ATTACK]: 4,      [C.NOPE]: 5,       [C.FAVOR]: 4,
  [C.TACO]: 4,        [C.POTATO]: 4,     [C.BEARD]: 4,
  [C.RAINBOW]: 4,     [C.WATERMELON]: 4,
  // การ์ดใหม่
  [C.ALTER_FUTURE]: 3, [C.CLAIRVOYANCE]: 3, [C.CLONE]: 3,
  [C.DIG_DEEPER]: 3,  [C.DRAW_BOTTOM]: 3,  [C.REVERSE]: 3,
};

// ✅ FIX: list of valid card types ที่ set-card-counts ยอมรับได้
const VALID_CARD_TYPES = new Set(Object.keys(DEFAULT_CARD_COUNTS));

function buildDeck(cardCounts) {
  const counts = cardCounts || DEFAULT_CARD_COUNTS;
  const deck = [];
  Object.entries(counts).forEach(([type, n]) => {
    // ✅ FIX: ข้าม type ที่ไม่รู้จักหรือ n <= 0
    if (!VALID_CARD_TYPES.has(type) || !CARD_INFO[type]) return;
    const count = Math.max(0, Math.min(20, Number(n) || 0));
    for (let i = 0; i < count; i++) deck.push(makeCard(type));
  });
  return shuffleArr(deck);
}

function initGame(room) {
  const players = room.players;
  let deck = buildDeck(room.cardCounts || null);
  room.hands = {};
  // ✅ FIX: reset turn direction สำหรับ Reverse card
  room.turnDirection = 1; // 1 = ปกติ, -1 = ย้อน

  // แจก Defuse 1 ใบ + ไพ่ 7 ใบ ให้ทุกคน
  players.forEach(pid => {
    room.hands[pid] = [makeCard(C.DEFUSE)];
    for (let i = 0; i < 7; i++) {
      if (deck.length > 0) room.hands[pid].push(deck.shift());
    }
  });

  // ใส่ Exploding Kittens = จำนวนผู้เล่น - 1
  for (let i = 0; i < players.length - 1; i++) deck.push(makeCard(C.EXPLODING));

  room.deck = shuffleArr(deck);
  room.discardPile = [];
  room.alivePlayers = [...players];
  room.currentPlayerIndex = 0;
  room.attackTurns = 1;
  room.pendingAction = null;
  room.pendingInsert = null;
  room.pendingFavor = null;
  room.pendingCatAction = null;
  room.pendingSteal3 = null;
  room.pendingDiscard5 = null;
  room.pendingClairvoyanceFor = null; // ✅ NEW: รอ clairvoyance หลัง defuse
  room.pendingDigDeeper = null;       // ✅ NEW: รอ dig deeper choice
  room.winner = null;
  room.lastAction = 'เกมเริ่มแล้ว! ขอให้โชคดี 🍀';
  room.gameState = 'playing';

  console.log(`🎮 Game started: ${players.length} players, ${room.deck.length} cards in deck`);
  console.log(`📦 Deck composition:`, room.deck.reduce((acc, c) => { acc[c.type] = (acc[c.type]||0)+1; return acc; }, {}));
}

function getCurrentPlayer(room) {
  if (!room.alivePlayers.length) return null;
  return room.alivePlayers[room.currentPlayerIndex % room.alivePlayers.length];
}

function advanceTurn(room) {
  if (room.attackTurns > 1) {
    room.attackTurns--;
  } else {
    room.attackTurns = 1;
    // ✅ FIX: รองรับ turnDirection สำหรับ Reverse
    const dir = room.turnDirection || 1;
    const len = room.alivePlayers.length;
    room.currentPlayerIndex = ((room.currentPlayerIndex + dir) % len + len) % len;
  }
}

function getNextPlayerIndex(room) {
  const dir = room.turnDirection || 1;
  const len = room.alivePlayers.length;
  return ((room.currentPlayerIndex + dir) % len + len) % len;
}

function broadcastGameState(room, io) {
  const allPlayers = room.players;
  allPlayers.forEach(pid => {
    const alive = room.alivePlayers.includes(pid);
    io.to(pid).emit('game-state', {
      currentPlayer: getCurrentPlayer(room),
      alivePlayers: room.alivePlayers,
      deadPlayers: room.players.filter(p => !room.alivePlayers.includes(p)),
      playerNames: room.playerNames,
      playerAvatars: room.playerAvatars,
      playerRanks: room.playerRanks,
      deckCount: room.deck.length,
      explodingKittensInDeck: room.deck.filter(c => c.type === C.EXPLODING).length,
      discardTop: room.discardPile.length > 0 ? room.discardPile[room.discardPile.length - 1] : null,
      discardCount: room.discardPile.length,
      myHand: alive ? (room.hands[pid] || []) : [],
      handCounts: Object.fromEntries(room.alivePlayers.map(p => [p, (room.hands[p] || []).length])),
      attackTurns: room.attackTurns,
      gameState: room.gameState,
      winner: room.winner,
      lastAction: room.lastAction,
      isMyTurn: getCurrentPlayer(room) === pid && alive,
      pendingAction: room.pendingAction,
      pendingInsert: room.pendingInsert ? (room.pendingInsert.playerId === pid ? { deckSize: room.deck.length } : null) : null,
      pendingFavor: room.pendingFavor && room.pendingFavor.targetId === pid ? room.pendingFavor : null,
      pendingCatAction: room.pendingCatAction,
      roundNum: room.roundNum,
      isSpectator: !alive,
      scores: Object.fromEntries(room.players.map(p => [p, (room.scores[p] || { wins: 0 }).wins]))
    });
  });
}

// ✅ FIX: resolveCardAction เพิ่ม logic การ์ดใหม่ทั้ง 6 ตัว
function resolveCardAction(room, io, roomId, action) {
  const { type, playerId, playerName, targetPlayerId, cards } = action;

  switch (type) {

    case C.SEE_FUTURE: {
      const top3 = room.deck.slice(0, 3);
      room.lastAction = `🔮 ${playerName} ดูไพ่ 3 ใบบนสุด (แบบลับ)`;
      io.to(playerId).emit('see-the-future-result', { cards: top3, cardInfoMap: CARD_INFO });
      break;
    }

    case C.SHUFFLE: {
      room.deck = shuffleArr(room.deck);
      room.lastAction = `🔀 ${playerName} สับกองไพ่`;
      io.to(roomId).emit('deck-shuffled', { playerName });
      break;
    }

    case C.SKIP: {
      room.lastAction = `⏭️ ${playerName} ข้ามเทิร์น`;
      advanceTurn(room);
      io.to(roomId).emit('log-action', { msg: room.lastAction });
      break;
    }

    case C.ATTACK: {
      // ✅ FIX Attack logic: คนถัดไปเล่น 2 เทิร์น (ถ้าถูก attack ซ้อน = บวกรวม)
      const nextIdx = getNextPlayerIndex(room);
      const currentTurns = room.attackTurns;
      // advance ไปคนถัดไปทันที
      room.attackTurns = 1;
      room.currentPlayerIndex = nextIdx;
      // กำหนด attack turns ให้คนถัดไป
      room.attackTurns = (getCurrentPlayer(room) === room.alivePlayers[nextIdx] && currentTurns > 1)
        ? currentTurns + 2
        : 2;
      room.lastAction = `⚔️ ${playerName} โจมตี! คนถัดไปต้องเล่น ${room.attackTurns} เทิร์น`;
      io.to(roomId).emit('attacked', { playerName, attackTurns: room.attackTurns });
      break;
    }

    case C.FAVOR: {
      if (targetPlayerId && room.alivePlayers.includes(targetPlayerId)) {
        room.lastAction = `🙀 ${playerName} ขอ Favor จาก ${room.playerNames[targetPlayerId]}`;
        room.pendingFavor = {
          requesterId: playerId,
          requesterName: playerName,
          targetId: targetPlayerId,
          cards: room.hands[targetPlayerId] || []
        };
      }
      break;
    }

    // ✅ NEW: Alter the Future — ดูและเรียงลำดับ 3 ใบบนสุด
    case C.ALTER_FUTURE: {
      const top3 = room.deck.slice(0, 3);
      room.lastAction = `👁️ ${playerName} ใช้ Alter the Future`;
      room.pendingAlterFuture = { playerId };
      io.to(playerId).emit('alter-future-choice', {
        playerId, playerName, cards: top3, cardInfoMap: CARD_INFO
      });
      // แจ้งคนอื่นว่ากำลังเรียง
      io.to(roomId).emit('log-action', { msg: room.lastAction });
      break;
    }

    // ✅ NEW: Clairvoyance — บอกตำแหน่ง exploding kitten ที่เพิ่งถูกใส่
    case C.CLAIRVOYANCE: {
      const ekIdx = room.deck.findIndex(c => c.type === C.EXPLODING);
      room.lastAction = `🔮 ${playerName} ใช้ Clairvoyance`;
      io.to(playerId).emit('clairvoyance-revealed', {
        playerId, playerName,
        insertionIndex: ekIdx >= 0 ? ekIdx : null
      });
      break;
    }

    // ✅ NEW: Clone — คัดลอกการ์ดใต้ใบ clone แล้วใช้ effect ของมัน
    case C.CLONE: {
      // หาการ์ดที่อยู่ "ใต้" clone ในกองทิ้ง (ใบที่เพิ่งถูกใส่ก่อน clone)
      // ถ้ากองทิ้งมีอย่างน้อย 2 ใบ = ใบที่ 2 จากบน
      const discardLen = room.discardPile.length;
      let cardToClone = null;
      if (discardLen >= 2) {
        cardToClone = room.discardPile[discardLen - 2]; // ใบก่อนหน้า clone
      }
      if (cardToClone && CARD_INFO[cardToClone.type] && cardToClone.type !== C.EXPLODING && cardToClone.type !== C.DEFUSE && cardToClone.type !== C.CLONE) {
        room.lastAction = `📋 ${playerName} Clone → ${CARD_INFO[cardToClone.type].emoji} ${CARD_INFO[cardToClone.type].name}`;
        io.to(playerId).emit('clone-choice', {
          playerId, playerName, cardToClone, cardInfoMap: CARD_INFO
        });
        // Execute clone effect immediately
        setTimeout(() => {
          resolveCardAction(room, io, roomId, {
            type: cardToClone.type,
            playerId, playerName,
            targetPlayerId: action.targetPlayerId,
            cards: [cardToClone]
          });
          io.to(roomId).emit('clone-card-applied', { cardInfo: CARD_INFO[cardToClone.type] });
          broadcastGameState(room, io);
        }, 1500);
      } else {
        // ไม่มีการ์ดที่ clone ได้ = ไม่มีผล
        room.lastAction = `📋 ${playerName} Clone แต่ไม่มีการ์ดที่จะ clone`;
        io.to(roomId).emit('log-action', { msg: room.lastAction });
      }
      break;
    }

    // ✅ NEW: Dig Deeper — จั่ว 2 ใบ เก็บ 1 คืน 1
    case C.DIG_DEEPER: {
      if (room.deck.length < 1) {
        room.lastAction = `🔍 ${playerName} ใช้ Dig Deeper แต่กองไพ่หมด`;
        io.to(roomId).emit('log-action', { msg: room.lastAction });
        break;
      }
      const drawCount = Math.min(2, room.deck.length);
      const drawnCards = room.deck.splice(0, drawCount);
      room.lastAction = `🔍 ${playerName} ใช้ Dig Deeper จั่ว ${drawCount} ใบ`;
      room.pendingDigDeeper = { playerId, drawnCards };
      io.to(playerId).emit('dig-deeper-choice', {
        playerId, playerName, cards: drawnCards, cardInfoMap: CARD_INFO
      });
      io.to(roomId).emit('log-action', { msg: room.lastAction });
      break;
    }

    // ✅ NEW: Draw from the Bottom — ใช้ป้องกัน Attack (เล่นขณะถูก attack)
    // เมื่อเล่นการ์ดนี้ขณะมี attackTurns > 1 = ลด 1 เทิร์น + จั่วจากล่าง
    case C.DRAW_BOTTOM: {
      if (room.attackTurns > 1) {
        // ป้องกัน attack: จั่วจากล่าง ลด 1 เทิร์น
        const bottomCard = room.deck.length > 0 ? room.deck.pop() : null;
        const drawsUsed = (action._drawsUsed || 0) + 1;
        if (bottomCard) {
          if (bottomCard.type === C.EXPLODING) {
            // จั่วได้ Exploding จากล่าง!
            const defuseIdx = (room.hands[playerId] || []).findIndex(c => c.type === C.DEFUSE);
            if (defuseIdx !== -1) {
              const defuseCard = room.hands[playerId].splice(defuseIdx, 1)[0];
              room.discardPile.push(defuseCard);
              room.pendingInsert = { playerId };
              io.to(playerId).emit('drew-exploding-kitten', { playerId, playerName, hadDefuse: true, deckSize: room.deck.length });
              socket.emit('choose-insert-position', { deckSize: room.deck.length });
            } else {
              room.alivePlayers = room.alivePlayers.filter(p => p !== playerId);
              delete room.hands[playerId];
              io.to(roomId).emit('player-exploded', { playerId, playerName });
              checkWinCondition(room, io, roomId);
            }
          } else {
            room.hands[playerId].push(bottomCard);
          }
        }
        room.attackTurns--;
        room.lastAction = `⬇️ ${playerName} ใช้ Draw from the Bottom ป้องกัน Attack`;
        io.to(playerId).emit('draw-from-bottom-defense', {
          playerId, playerName,
          attackTurnsRemaining: room.attackTurns,
          drawsUsed
        });
      } else {
        // ไม่ได้ถูก attack — จั่วจากล่างปกติ (แล้วจบเทิร์น)
        const bottomCard = room.deck.length > 0 ? room.deck.pop() : null;
        if (bottomCard) {
          if (bottomCard.type === C.EXPLODING) {
            const defuseIdx = (room.hands[playerId] || []).findIndex(c => c.type === C.DEFUSE);
            if (defuseIdx !== -1) {
              const defuseCard = room.hands[playerId].splice(defuseIdx, 1)[0];
              room.discardPile.push(defuseCard);
              room.pendingInsert = { playerId };
              io.to(playerId).emit('drew-exploding-kitten', { playerId, playerName, hadDefuse: true, deckSize: room.deck.length });
            } else {
              room.alivePlayers = room.alivePlayers.filter(p => p !== playerId);
              delete room.hands[playerId];
              io.to(roomId).emit('player-exploded', { playerId, playerName });
              checkWinCondition(room, io, roomId);
              break;
            }
          } else {
            room.hands[playerId].push(bottomCard);
          }
        }
        room.lastAction = `⬇️ ${playerName} ใช้ Draw from the Bottom`;
        advanceTurn(room);
      }
      break;
    }

    // ✅ NEW: Reverse — ย้อนลำดับ (หรือ Skip ถ้า 2 ผู้เล่น)
    case C.REVERSE: {
      const twoPlayerMode = room.alivePlayers.length <= 2;
      if (twoPlayerMode) {
        // 2 ผู้เล่น: ทำหน้าที่เป็น Skip
        room.lastAction = `🔄 ${playerName} Reverse (2 ผู้เล่น = Skip)`;
        advanceTurn(room);
      } else {
        // มากกว่า 2 ผู้เล่น: ย้อนลำดับ
        room.turnDirection = (room.turnDirection || 1) * -1;
        room.lastAction = `🔄 ${playerName} ย้อนลำดับการเล่น`;
        advanceTurn(room); // advance ไปคนถัดไปในทิศทางใหม่
      }
      io.to(roomId).emit('reverse-played', { playerName, twoPlayerMode });
      break;
    }

    default: {
      // Cat cards
      if (CAT_CARDS.includes(type) && room.pendingCatAction) {
        const catAct = room.pendingCatAction;
        room.pendingCatAction = null;
        if (catAct.mode === 'steal2' && catAct.targetId && room.alivePlayers.includes(catAct.targetId)) {
          room.lastAction = `🐱 ${playerName} ขโมยไพ่จาก ${room.playerNames[catAct.targetId]}`;
          if (room.hands[catAct.targetId] && room.hands[catAct.targetId].length > 0) {
            const ri = Math.floor(Math.random() * room.hands[catAct.targetId].length);
            const stolen = room.hands[catAct.targetId].splice(ri, 1)[0];
            room.hands[playerId].push(stolen);
            io.to(playerId).emit('steal-result', { card: stolen, cardInfo: CARD_INFO[stolen.type], fromId: catAct.targetId, fromName: room.playerNames[catAct.targetId] });
            io.to(catAct.targetId).emit('card-was-stolen', { byId: playerId, byName: playerName, cardInfo: CARD_INFO[stolen.type] });
          }
        } else if (catAct.mode === 'steal3' && catAct.targetId) {
          room.pendingSteal3 = { requesterId: playerId, requesterName: playerName, targetId: catAct.targetId };
          const availableTypes = [...new Set((room.hands[catAct.targetId] || []).map(c => c.type))];
          io.to(playerId).emit('pick-card-type-to-steal', {
            targetId: catAct.targetId,
            targetName: room.playerNames[catAct.targetId],
            cards: availableTypes, // ✅ FIX: ส่งเป็น 'cards' array (ตรงกับ client openSteal3Modal)
            cardInfoMap: CARD_INFO
          });
        } else if (catAct.mode === 'steal5') {
          const discardCards = room.discardPile.filter((c, i, arr) =>
            arr.findIndex(x => x.type === c.type) === i && c.type !== C.EXPLODING
          );
          room.pendingDiscard5 = { requesterId: playerId, requesterName: playerName };
          io.to(playerId).emit('pick-from-discard', { cards: discardCards, cardInfoMap: CARD_INFO });
        }
      }
      break;
    }
  }
}

// ✅ NEW: helper ตรวจ win condition
function checkWinCondition(room, io, roomId) {
  if (room.alivePlayers.length === 1) {
    room.gameState = 'ended';
    room.winner = room.alivePlayers[0];
    const winnerName = room.playerNames[room.winner];
    if (room.scores[room.winner]) room.scores[room.winner].wins++;
    io.to(roomId).emit('game-over', { winner: room.winner, winnerName });
    return true;
  }
  return false;
}

// ── Socket.io ─────────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('🔗 Connected:', socket.id);

  socket.on('join-room', async (data) => {
    const { roomId, playerName, userId, avatarUrl } = data;

    if (!rooms[roomId]) {
      if (!playerName) { socket.emit('join-error', { message: 'ไม่พบห้องนี้' }); return; }
      rooms[roomId] = {
        id: roomId, creator: socket.id, players: [],
        playerNames: {}, playerAvatars: {}, playerRanks: {}, userIds: {}, scores: {},
        gameState: 'lobby', roundNum: 0,
        hands: {}, deck: [], discardPile: [], alivePlayers: [],
        currentPlayerIndex: 0, attackTurns: 1, turnDirection: 1,
        pendingAction: null, pendingInsert: null, pendingFavor: null,
        pendingCatAction: null, pendingSteal3: null, pendingDiscard5: null,
        pendingAlterFuture: null, pendingDigDeeper: null,
        winner: null, lastAction: '',
        cardCounts: null, // ✅ เริ่มต้น null = ใช้ DEFAULT
      };
    }

    const room = rooms[roomId];
    if (room.gameState === 'playing') { socket.emit('join-error', { message: 'เกมเริ่มแล้ว' }); return; }

    let userRank = null;
    if (userId && mongoose.connection.readyState === 1) {
      try {
        const u = await User.findById(userId).lean();
        if (u) {
          userRank = (u.rank && u.rank.name) ? { name: u.rank.name, color: u.rank.color || '#f97316' } : null;
          socket.isAdmin = !!u.isAdmin;
        }
      } catch (_) {}
    }

    if (!room.players.includes(socket.id)) {
      if (room.players.length >= 5) { socket.emit('join-error', { message: 'ห้องเต็มแล้ว (สูงสุด 5 คน)' }); return; }
      room.players.push(socket.id);
      room.playerNames[socket.id] = playerName;
      room.scores[socket.id] = { wins: 0 };
      room.playerAvatars[socket.id] = avatarUrl || null;
      room.playerRanks[socket.id] = userRank;
      room.userIds[socket.id] = userId || null;
    }

    socket.join(roomId);
    socket.roomId = roomId;
    socket.playerName = playerName;
    socket.userId = userId || null;

    broadcastRoomUpdate(room);
    socket.emit('your-player-id', socket.id);
    console.log(`✅ ${playerName} joined ${roomId} (${room.players.length} players)`);
  });

  socket.on('start-game', () => {
    const room = rooms[socket.roomId];
    if (!room || room.gameState === 'playing' || !canControlRoom(room, socket)) return;
    if (room.players.length < 2) { socket.emit('game-error', { message: 'ต้องมีผู้เล่นอย่างน้อย 2 คน' }); return; }
    room.roundNum = (room.roundNum || 0) + 1;
    initGame(room);
    io.to(socket.roomId).emit('game-started', { roundNum: room.roundNum });
    broadcastGameState(room, io);
  });

  socket.on('play-card', (data) => {
    const room = rooms[socket.roomId];
    if (!room || room.gameState !== 'playing') return;
    if (getCurrentPlayer(room) !== socket.id) { socket.emit('game-error', { message: 'ยังไม่ใช่เทิร์นของคุณ' }); return; }
    if (room.pendingAction) { socket.emit('game-error', { message: 'รอ Nope หมดเวลาก่อน' }); return; }
    if (room.pendingInsert) { socket.emit('game-error', { message: 'เลือกตำแหน่งใส่ Exploding Kitten ก่อน' }); return; }

    const { cardIds, targetPlayerId, catMode } = data;
    const hand = room.hands[socket.id];

    const cards = [];
    const tempHand = [...hand];
    for (const cid of cardIds) {
      const idx = tempHand.findIndex(c => c.id === cid);
      if (idx === -1) { socket.emit('game-error', { message: 'ไม่พบไพ่นี้ในมือ' }); return; }
      cards.push(tempHand.splice(idx, 1)[0]);
    }

    const types = cards.map(c => c.type);
    const mainType = types[0];

    if (mainType === C.EXPLODING) { socket.emit('game-error', { message: 'ไม่สามารถเล่น Exploding Kitten ได้' }); return; }
    if (mainType === C.DEFUSE && cards.length === 1) { socket.emit('game-error', { message: 'ไม่สามารถเล่น Defuse โดยตรงได้' }); return; }

    // Cat card validation
    if (CAT_CARDS.includes(mainType)) {
      if (cards.length === 1) { socket.emit('game-error', { message: 'Cat Card ใบเดียวไม่มีผล' }); return; }
      if (cards.length === 2 && !types.every(t => t === mainType)) { socket.emit('game-error', { message: 'ต้องใช้ Cat Cards 2 ใบเหมือนกัน' }); return; }
      if (cards.length === 3 && !types.every(t => t === mainType)) { socket.emit('game-error', { message: 'ต้องใช้ Cat Cards 3 ใบเหมือนกัน' }); return; }
      if (cards.length === 5) {
        const allCat = types.every(t => CAT_CARDS.includes(t));
        const allDiff = new Set(types).size === types.length;
        if (!allCat || !allDiff) { socket.emit('game-error', { message: 'ต้องใช้ Cat Cards 5 ใบที่ต่างกันทั้งหมด' }); return; }
      }
    }

    // ลบไพ่จากมือและใส่กองทิ้ง
    for (const cid of cardIds) {
      const idx = hand.findIndex(c => c.id === cid);
      if (idx !== -1) hand.splice(idx, 1);
    }
    cards.forEach(c => room.discardPile.push(c));

    const playerName = room.playerNames[socket.id];
    const ci = CARD_INFO[mainType] || { emoji: '🃏', name: mainType };

    // ตั้ง cat action
    if (CAT_CARDS.includes(mainType) && cards.length >= 2) {
      const mode = cards.length === 2 ? 'steal2' : cards.length === 3 ? 'steal3' : 'steal5';
      room.pendingCatAction = { mode, targetId: targetPlayerId || null };
    }

    room.pendingAction = {
      type: mainType, playerId: socket.id, playerName,
      cards, targetPlayerId: targetPlayerId || null,
      noped: false, timestamp: Date.now()
    };
    room.lastAction = `${playerName} เล่น ${ci.emoji} ${ci.name}${cards.length > 1 ? ` (${cards.length} ใบ)` : ''}`;

    io.to(socket.roomId).emit('card-played', {
      playerId: socket.id, playerName, cards, cardInfo: ci, targetPlayerId
    });

    broadcastGameState(room, io);

    const ts = room.pendingAction.timestamp;
    setTimeout(() => {
      if (!room.pendingAction || room.pendingAction.timestamp !== ts) return;
      const act = room.pendingAction;
      room.pendingAction = null;
      if (!act.noped) {
        resolveCardAction(room, io, socket.roomId, act);
      } else {
        room.lastAction = `❌ ${act.playerName} ถูก Nope — ${ci.emoji} ${ci.name} ถูกยกเลิก`;
        room.pendingCatAction = null;
        io.to(socket.roomId).emit('action-noped', { playerName: act.playerName });
      }
      broadcastGameState(room, io);
    }, 3000);
  });

  socket.on('play-nope', (data) => {
    const room = rooms[socket.roomId];
    if (!room || room.gameState !== 'playing') return;
    if (!room.pendingAction) { socket.emit('game-error', { message: 'ไม่มีไพ่ที่จะ Nope ได้' }); return; }
    const now = Date.now();
    if (room.pendingAction.timestamp && now - room.pendingAction.timestamp > 3200) {
      socket.emit('game-error', { message: 'หมดเวลา Nope แล้ว' }); return;
    }
    const { cardId } = data;
    const hand = room.hands[socket.id];
    if (!hand) return;
    const idx = hand.findIndex(c => c.id === cardId && c.type === C.NOPE);
    if (idx === -1) { socket.emit('game-error', { message: 'คุณไม่มีไพ่ Nope' }); return; }
    hand.splice(idx, 1);
    room.discardPile.push({ id: globalCardId++, type: C.NOPE });
    room.pendingAction.noped = !room.pendingAction.noped;
    const pName = room.playerNames[socket.id];
    room.lastAction = `🚫 ${pName} ${room.pendingAction.noped ? 'Nope!' : 'Nope the Nope!'}`;
    io.to(socket.roomId).emit('nope-played', { playerName: pName, noped: room.pendingAction.noped });
    broadcastGameState(room, io);
  });

  socket.on('draw-card', () => {
    const room = rooms[socket.roomId];
    if (!room || room.gameState !== 'playing') return;
    if (getCurrentPlayer(room) !== socket.id) { socket.emit('game-error', { message: 'ยังไม่ใช่เทิร์นของคุณ' }); return; }
    if (room.pendingAction || room.pendingInsert || room.pendingFavor) {
      socket.emit('game-error', { message: 'รอ action ก่อนหน้าให้เสร็จก่อน' }); return;
    }
    // ✅ FIX: ตรวจ pendingDigDeeper และ pendingAlterFuture ด้วย
    if (room.pendingDigDeeper || room.pendingAlterFuture) {
      socket.emit('game-error', { message: 'รอ action ก่อนหน้าให้เสร็จก่อน' }); return;
    }

    const drawnCard = room.deck.shift();
    const playerName = room.playerNames[socket.id];

    if (!drawnCard) { socket.emit('game-error', { message: 'กองไพ่หมดแล้ว' }); return; }

    io.to(socket.roomId).emit('drawing-card', { playerId: socket.id, playerName });

    if (drawnCard.type === C.EXPLODING) {
      const defuseIdx = (room.hands[socket.id] || []).findIndex(c => c.type === C.DEFUSE);
      if (defuseIdx !== -1) {
        const defuseCard = room.hands[socket.id].splice(defuseIdx, 1)[0];
        room.discardPile.push(defuseCard);
        room.lastAction = `💥 ${playerName} จั่ว Exploding Kitten! แต่ใช้ 🛡️ Defuse รอดได้`;
        room.pendingInsert = { playerId: socket.id };
        io.to(socket.roomId).emit('drew-exploding-kitten', {
          playerId: socket.id, playerName, hadDefuse: true, deckSize: room.deck.length
        });
        socket.emit('choose-insert-position', { deckSize: room.deck.length });
        broadcastGameState(room, io);
      } else {
        room.lastAction = `💥💀 ${playerName} จั่ว Exploding Kitten และไม่มี Defuse — ออกจากเกม!`;
        room.alivePlayers = room.alivePlayers.filter(p => p !== socket.id);
        delete room.hands[socket.id];
        io.to(socket.roomId).emit('player-exploded', {
          playerId: socket.id, playerName, alivePlayers: room.alivePlayers
        });
        if (!checkWinCondition(room, io, socket.roomId)) {
          if (room.currentPlayerIndex >= room.alivePlayers.length) room.currentPlayerIndex = 0;
        }
        broadcastGameState(room, io);
      }
    } else {
      room.hands[socket.id].push(drawnCard);
      room.lastAction = `${playerName} จั่วไพ่`;
      io.to(socket.roomId).emit('card-drawn-normal', { playerId: socket.id, playerName });
      advanceTurn(room);
      broadcastGameState(room, io);
    }
  });

  socket.on('insert-exploding-kitten', (data) => {
    const room = rooms[socket.roomId];
    if (!room || !room.pendingInsert || room.pendingInsert.playerId !== socket.id) return;
    const pos = Math.min(Math.max(0, data.position || 0), room.deck.length);
    room.deck.splice(pos, 0, makeCard(C.EXPLODING));
    room.pendingInsert = null;
    room.lastAction = `${room.playerNames[socket.id]} ใส่ 💥 Exploding Kitten คืนกองที่ตำแหน่ง ${pos + 1}`;
    io.to(socket.roomId).emit('exploding-kitten-inserted', {
      playerName: room.playerNames[socket.id], position: pos, deckSize: room.deck.length
    });
    advanceTurn(room);
    broadcastGameState(room, io);
  });

  socket.on('give-card', (data) => {
    const room = rooms[socket.roomId];
    if (!room || !room.pendingFavor || room.pendingFavor.targetId !== socket.id) return;
    const { cardId } = data;
    const hand = room.hands[socket.id];
    const idx = hand.findIndex(c => c.id === cardId);
    if (idx === -1) { socket.emit('game-error', { message: 'ไม่พบไพ่นี้' }); return; }
    const card = hand.splice(idx, 1)[0];
    const requester = room.pendingFavor.requesterId;
    if (room.hands[requester]) room.hands[requester].push(card);
    const fromName = room.playerNames[socket.id];
    const toName = room.pendingFavor.requesterName;
    room.lastAction = `🙀 ${fromName} ให้ ${CARD_INFO[card.type]?.emoji || ''} ${CARD_INFO[card.type]?.name || card.type} แก่ ${toName}`;
    io.to(socket.roomId).emit('favor-given', {
      fromId: socket.id, fromName, toId: requester, toName,
      cardInfo: CARD_INFO[card.type] || null
    });
    room.pendingFavor = null;
    broadcastGameState(room, io);
  });

  socket.on('steal-card-type', (data) => {
    const room = rooms[socket.roomId];
    if (!room || !room.pendingSteal3 || room.pendingSteal3.requesterId !== socket.id) return;
    const { cardType, targetId } = data;
    const targetHand = room.hands[targetId] || [];
    const idx = targetHand.findIndex(c => c.type === cardType);
    if (idx === -1) {
      socket.emit('game-error', { message: 'ผู้เล่นนั้นไม่มีไพ่นี้' });
      room.pendingSteal3 = null;
      broadcastGameState(room, io);
      return;
    }
    const card = targetHand.splice(idx, 1)[0];
    room.hands[socket.id].push(card);
    const fromName = room.playerNames[targetId];
    const myName = room.playerNames[socket.id];
    room.lastAction = `🐱 ${myName} ขโมย ${CARD_INFO[card.type]?.emoji || ''} ${CARD_INFO[card.type]?.name || card.type} จาก ${fromName}`;
    io.to(socket.roomId).emit('card-stolen', {
      byId: socket.id, byName: myName, fromId: targetId, fromName,
      cardInfo: CARD_INFO[card.type] || null
    });
    io.to(targetId).emit('card-was-stolen', { byName: myName, cardInfo: CARD_INFO[card.type] || null });
    room.pendingSteal3 = null;
    broadcastGameState(room, io);
  });

  socket.on('take-from-discard', (data) => {
    const room = rooms[socket.roomId];
    if (!room || !room.pendingDiscard5 || room.pendingDiscard5.requesterId !== socket.id) return;
    const { cardType } = data;
    let idx = -1;
    for (let i = room.discardPile.length - 1; i >= 0; i--) {
      if (room.discardPile[i].type === cardType) { idx = i; break; }
    }
    if (idx === -1) { socket.emit('game-error', { message: 'ไม่พบไพ่นี้ในกองทิ้ง' }); return; }
    const card = room.discardPile.splice(idx, 1)[0];
    room.hands[socket.id].push(card);
    const myName = room.playerNames[socket.id];
    room.lastAction = `🐱 ${myName} หยิบ ${CARD_INFO[card.type]?.emoji || ''} ${CARD_INFO[card.type]?.name || card.type} จากกองทิ้ง`;
    room.pendingDiscard5 = null;
    broadcastGameState(room, io);
  });

  // ✅ NEW: Alter the Future result
  socket.on('alter-future-result', (data) => {
    const room = rooms[socket.roomId];
    if (!room || !room.pendingAlterFuture || room.pendingAlterFuture.playerId !== socket.id) return;
    const { newOrder } = data; // array of card ids
    if (!Array.isArray(newOrder) || newOrder.length === 0) {
      room.pendingAlterFuture = null;
      broadcastGameState(room, io);
      return;
    }
    // reorder top cards ตาม newOrder
    const top = room.deck.slice(0, newOrder.length);
    const rest = room.deck.slice(newOrder.length);
    const reordered = newOrder.map(id => top.find(c => c.id === id)).filter(Boolean);
    // ถ้าจำนวนไม่ครบ ใช้ original
    if (reordered.length === top.length) {
      room.deck = [...reordered, ...rest];
    }
    room.pendingAlterFuture = null;
    const playerName = room.playerNames[socket.id];
    room.lastAction = `👁️ ${playerName} เรียงลำดับไพ่ใหม่แล้ว`;
    io.to(socket.roomId).emit('log-action', { msg: room.lastAction });
    broadcastGameState(room, io);
  });

  // ✅ NEW: Dig Deeper choice
  socket.on('dig-deeper-choice', (data) => {
    const room = rooms[socket.roomId];
    if (!room || !room.pendingDigDeeper || room.pendingDigDeeper.playerId !== socket.id) return;
    const { cardId, returnToBottom } = data;
    const { drawnCards } = room.pendingDigDeeper;

    const keepIdx = drawnCards.findIndex(c => c.id === cardId);
    if (keepIdx === -1) {
      // ไม่เจอ = เก็บทั้งหมด
      drawnCards.forEach(c => room.hands[socket.id].push(c));
      room.pendingDigDeeper = null;
      broadcastGameState(room, io);
      return;
    }

    const keepCard = drawnCards[keepIdx];
    const returnCards = drawnCards.filter((_, i) => i !== keepIdx);

    if (returnToBottom) {
      // เก็บ keepCard ไว้ คืน returnCards ลงล่างกอง
      room.hands[socket.id].push(keepCard);
      returnCards.forEach(c => room.deck.push(c)); // ใส่ล่างกอง
    } else {
      // เก็บ keepCard คืน returnCards กลับบนกอง
      room.hands[socket.id].push(keepCard);
      returnCards.forEach(c => room.deck.unshift(c)); // ใส่บนกอง
    }

    room.pendingDigDeeper = null;
    const playerName = room.playerNames[socket.id];
    room.lastAction = `🔍 ${playerName} เก็บไพ่จาก Dig Deeper`;
    broadcastGameState(room, io);
  });

  socket.on('next-round', () => {
    const room = rooms[socket.roomId];
    if (!canControlRoom(room, socket) || room.gameState !== 'ended') return;
    room.roundNum++;
    initGame(room);
    io.to(socket.roomId).emit('game-started', { roundNum: room.roundNum });
    broadcastGameState(room, io);
  });

  // ✅ FIX: set-card-counts — validate types ก่อนบันทึก
  socket.on('set-card-counts', (data) => {
    const room = rooms[socket.roomId];
    if (!room || !canControlRoom(room, socket) || room.gameState !== 'lobby') return;

    if (!data.cardCounts) {
      room.cardCounts = null; // reset เป็น default
      socket.emit('card-counts-saved', { ok: true });
      return;
    }

    // ✅ กรองเฉพาะ card type ที่ valid และ sanitize ค่า
    const validated = {};
    let hasAny = false;
    Object.entries(data.cardCounts).forEach(([type, n]) => {
      if (VALID_CARD_TYPES.has(type)) {
        const count = Math.max(0, Math.min(20, Math.floor(Number(n) || 0)));
        validated[type] = count;
        if (count > 0) hasAny = true;
      }
    });

    room.cardCounts = hasAny ? validated : null;
    console.log(`📋 Room ${socket.roomId} card counts set:`, room.cardCounts);
    socket.emit('card-counts-saved', { ok: true });
  });

  socket.on('admin-set-rank', async (data) => {
    if (!socket.isAdmin) return;
    const { targetUserId, rankName, rankColor } = data;
    if (!targetUserId) return;
    try {
      const target = await User.findById(targetUserId).exec();
      if (!target) return;
      target.rank = (!rankName || rankName.trim() === '') ? { name: null, color: '#f97316' } : { name: rankName.trim(), color: rankColor || '#f97316' };
      await target.save();
      const rank = target.rank.name ? { name: target.rank.name, color: target.rank.color } : null;
      const room = rooms[socket.roomId];
      if (room) {
        const tSid = room.players.find(pid => room.userIds[pid] === targetUserId);
        if (tSid) room.playerRanks[tSid] = rank;
      }
      io.to(socket.roomId).emit('rank-updated', { userId: targetUserId, rank });
      socket.emit('admin-rank-success', { userId: targetUserId, rank, displayName: target.displayName });
    } catch (err) { socket.emit('admin-rank-error', { message: 'อัปเดตยศไม่สำเร็จ' }); }
  });

  socket.on('admin-search-user', async (data) => {
    if (!socket.isAdmin) return;
    try {
      const user = await User.findOne({ email: data.email.trim() }).lean();
      socket.emit('admin-search-result', user ? { user: publicUserRow(user) } : { error: 'ไม่พบผู้ใช้' });
    } catch (err) { socket.emit('admin-search-result', { error: 'ค้นหาไม่สำเร็จ' }); }
  });

  socket.on('leave-room', () => handleLeave(socket));
  socket.on('disconnect', () => handleLeave(socket, true));
});

function handleLeave(socket, isDisconnect = false) {
  const room = rooms[socket.roomId];
  if (!room) return;

  const wasCreator = socket.id === room.creator;
  if (wasCreator) socket.to(socket.roomId).emit('host-left-room', { message: 'เจ้าของห้องออกจากห้องแล้ว' });

  room.players = room.players.filter(pid => pid !== socket.id);
  room.alivePlayers = (room.alivePlayers || []).filter(pid => pid !== socket.id);
  ['playerNames','scores','playerAvatars','playerRanks','userIds','hands'].forEach(k => {
    if (room[k]) delete room[k][socket.id];
  });

  if (room.players.length === 0) {
    delete rooms[socket.roomId];
  } else {
    const event = isDisconnect ? 'player-disconnected' : 'player-left';
    io.to(socket.roomId).emit(event, {
      playerId: socket.id, playerName: socket.playerName,
      players: room.players.map(pid => ({ id: pid, name: room.playerNames[pid] }))
    });

    if (room.gameState === 'playing') {
      if (room.currentPlayerIndex >= room.alivePlayers.length) room.currentPlayerIndex = 0;
      if (room.alivePlayers.length === 1) {
        room.gameState = 'ended';
        room.winner = room.alivePlayers[0];
        io.to(socket.roomId).emit('game-over', { winner: room.winner, winnerName: room.playerNames[room.winner] });
      }
      broadcastGameState(room, io);
    } else {
      broadcastRoomUpdate(room);
    }
  }

  if (!isDisconnect) { socket.leave(socket.roomId); socket.roomId = null; socket.playerName = null; }
}

function broadcastRoomUpdate(room) {
  room.players.forEach(pid => {
    io.to(pid).emit('room-updated', {
      roomId: room.id,
      players: room.players.map(p => ({
        id: p, name: room.playerNames[p],
        avatarUrl: room.playerAvatars?.[p] || null,
        rank: room.playerRanks?.[p] || null,
        userId: room.userIds?.[p] || null
      })),
      isHost: pid === room.creator,
      gameState: room.gameState,
      roundNum: room.roundNum
    });
  });
}

setInterval(() => {
  Object.keys(rooms).forEach(roomId => {
    const room = rooms[roomId];
    if (!room || room.players.length === 0) { delete rooms[roomId]; return; }
    if (!room.players.includes(room.creator)) {
      room.players.forEach(pid => io.to(pid).emit('host-left-room', { message: 'ห้องถูกปิด' }));
      delete rooms[roomId];
    }
  });
}, 2 * 60 * 1000);

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`🚀 Exploding Kittens Server on port ${PORT}`));