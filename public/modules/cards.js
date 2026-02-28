/**
 * cards.js - ข้อมูลและตัวช่วยสำหรับการ์ด
 *
 * ชื่อการ์ดและคำอธิบายอยู่ใน i18n.js ทั้งหมด:
 *   cardName('skip')  → ชื่อตาม locale ปัจจุบัน
 *   cardDesc('skip')  → คำอธิบายตาม locale ปัจจุบัน
 *
 * ไม่มี emoji ในไฟล์นี้ — ใช้ CARD_ICONS[type] จาก game-rendering.js แทน
 */

function makeVariants(base, n) {
  var result = [];
  for (var i = 0; i < n; i++) {
    var suffix = i === 0 ? '' : '_' + (i + 1);
    result.push({ png: '/cards/' + base + suffix + '.png', jpg: '/cards/' + base + suffix + '.jpg' });
  }
  return result;
}

// CARD_INFO: เก็บเฉพาะข้อมูลที่ไม่เปลี่ยนตามภาษา (สี, รูป, variants)
// name / desc ดึงผ่าน cardName(type) / cardDesc(type) ณ runtime
const CARD_INFO = {
  exploding_kitten: { color: '#ef4444',
    img: '/cards/exploding_kitten.png', imgJpg: '/cards/exploding_kitten.jpg',
    variants: makeVariants('exploding_kitten', 3) },
  defuse:           { color: '#22c55e',
    img: '/cards/defuse.png', imgJpg: '/cards/defuse.jpg',
    variants: makeVariants('defuse', 3) },
  see_the_future:   { color: '#8b5cf6',
    img: '/cards/see_the_future.png', imgJpg: '/cards/see_the_future.jpg',
    variants: makeVariants('see_the_future', 2) },
  shuffle:          { color: '#3b82f6',
    img: '/cards/shuffle.png', imgJpg: '/cards/shuffle.jpg',
    variants: makeVariants('shuffle', 3) },
  skip:             { color: '#06b6d4',
    img: '/cards/skip.png', imgJpg: '/cards/skip.jpg',
    variants: makeVariants('skip', 3) },
  attack:           { color: '#f97316',
    img: '/cards/attack.png', imgJpg: '/cards/attack.jpg',
    variants: makeVariants('attack', 3) },
  nope:             { color: '#ec4899',
    img: '/cards/nope.png', imgJpg: '/cards/nope.jpg',
    variants: makeVariants('nope', 3) },
  favor:            { color: '#eab308',
    img: '/cards/favor.png', imgJpg: '/cards/favor.jpg',
    variants: makeVariants('favor', 2) },
  taco_cat:         { color: '#f59e0b',
    img: '/cards/taco_cat.png', imgJpg: '/cards/taco_cat.jpg',
    variants: makeVariants('taco_cat', 1) },
  hairy_potato_cat: { color: '#a3a3a3',
    img: '/cards/hairy_potato_cat.png', imgJpg: '/cards/hairy_potato_cat.jpg',
    variants: makeVariants('hairy_potato_cat', 1) },
  beard_cat:        { color: '#78716c',
    img: '/cards/beard_cat.png', imgJpg: '/cards/beard_cat.jpg',
    variants: makeVariants('beard_cat', 1) },
  rainbow_cat:      { color: '#a855f7',
    img: '/cards/rainbow_cat.png', imgJpg: '/cards/rainbow_cat.jpg',
    variants: makeVariants('rainbow_cat', 2) },
  cattermelon:      { color: '#4ade80',
    img: '/cards/cattermelon.png', imgJpg: '/cards/cattermelon.jpg',
    variants: makeVariants('cattermelon', 1) },
  alter_the_future: { color: '#8b5cf6',
    img: '/cards/alter_the_future.png', imgJpg: '/cards/alter_the_future.jpg',
    variants: makeVariants('alter_the_future', 1) },
  clairvoyance:     { color: '#06b6d4',
    img: '/cards/clairvoyance.png', imgJpg: '/cards/clairvoyance.jpg',
    variants: makeVariants('clairvoyance', 1) },
  clone:            { color: '#6366f1',
    img: '/cards/clone.png', imgJpg: '/cards/clone.jpg',
    variants: makeVariants('clone', 1) },
  dig_deeper:       { color: '#3b82f6',
    img: '/cards/dig_deeper.png', imgJpg: '/cards/dig_deeper.jpg',
    variants: makeVariants('dig_deeper', 1) },
  draw_from_bottom: { color: '#10b981',
    img: '/cards/draw_from_bottom.png', imgJpg: '/cards/draw_from_bottom.jpg',
    variants: makeVariants('draw_from_bottom', 1) },
  reverse:          { color: '#ec4899',
    img: '/cards/reverse.png', imgJpg: '/cards/reverse.jpg',
    variants: makeVariants('reverse', 1) },
};

/**
 * getCardInfo(type) — คืน ci พร้อม .name และ .desc ตาม locale ปัจจุบัน
 * ใช้แทนการเข้าถึง CARD_INFO[type].name โดยตรง
 * เพื่อให้ได้ชื่อที่แปลแล้วเสมอ
 */
function getCardInfo(type) {
  var ci = CARD_INFO[type];
  if (!ci) return null;
  return Object.assign({}, ci, {
    name: cardName(type),
    desc: cardDesc(type),
  });
}

const CAT_TYPES = ['taco_cat','hairy_potato_cat','beard_cat','rainbow_cat','cattermelon'];

var SELECTABLE_CARDS = [
  { type: 'see_the_future',   default: 5 },
  { type: 'shuffle',          default: 4 },
  { type: 'skip',             default: 4 },
  { type: 'attack',           default: 4 },
  { type: 'nope',             default: 5 },
  { type: 'favor',            default: 4 },
  { type: 'taco_cat',         default: 4 },
  { type: 'hairy_potato_cat', default: 4 },
  { type: 'beard_cat',        default: 4 },
  { type: 'rainbow_cat',      default: 4 },
  { type: 'cattermelon',      default: 4 },
  { type: 'alter_the_future', default: 3 },
  { type: 'clairvoyance',     default: 3 },
  { type: 'clone',            default: 3 },
  { type: 'dig_deeper',       default: 3 },
  { type: 'draw_from_bottom', default: 3 },
  { type: 'reverse',          default: 3 },
];

function getTotalDefaultCards() {
  return SELECTABLE_CARDS.reduce(function(sum, e) { return sum + e.default; }, 0);
}

function getCardImg(card) {
  var ci = CARD_INFO[card.type];
  if (!ci) return null;
  if (!ci.variants || ci.variants.length === 0) {
    return { png: ci.img, jpg: ci.imgJpg || null };
  }
  var numVariants = ci.variants.length;
  var variantIndex = card.variantIndex !== undefined ? card.variantIndex : 0;
  var actualIndex = variantIndex % numVariants;
  return ci.variants[actualIndex] || { png: ci.img, jpg: ci.imgJpg || null };
}

function buildImgTag(imgObj, altName, cssClass, fallbackHTML) {
  if (!imgObj) return fallbackHTML;
  var png = imgObj.png || imgObj;
  var jpg = imgObj.jpg || null;
  var onErrJpg = jpg
    ? 'this.onerror=function(){this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'};this.src=\'' + jpg + '\''
    : 'this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'';
  return '<img class="' + (cssClass||'') + '" src="' + png + '" alt="' + (altName||'') + '" onerror="' + onErrJpg + '">';
}