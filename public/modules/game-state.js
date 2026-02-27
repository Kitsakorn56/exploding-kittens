/**
 * game-state.js - ตัวแปรและสถานะทั่วโลก
 */

// Game state principal
let gs = {
  myId: null, myName: '', roomId: '', isHost: false,
  players: [], playerNames: {}, scores: {},
  gameState: 'lobby', roundNum: 0,
  currentPlayer: null, alivePlayers: [], deadPlayers: [],
  playerAvatars: {}, playerRanks: {},
  deckCount: 0, discardTop: null, discardCount: 0,
  explodingKittensInDeck: 0,
  myHand: [], handCounts: {}, attackTurns: 1,
  winner: null, lastAction: '',
  isMyTurn: false, pendingAction: null, pendingInsert: null,
  pendingFavor: null, pendingCatAction: null,
  isSpectator: false,
  selectedCards: [], catMode: null, catTarget: null
};

// ตัวแปรอื่น ๆ
let pendingJoinRoom = false;
let insertModalInstance = null;

// Socket (initialize ที่ต้นว่าง ก่อนไฟล์อื่น ๆ โหลด)
let socket = (function() {
  try { return io(); }
  catch(e) { return null; }
})();

// Auth user
let currentUser = null;

// Profile avatar state
let profileAvatarState = { type: null, value: null };

// Card selection
var customCardCounts = null;
