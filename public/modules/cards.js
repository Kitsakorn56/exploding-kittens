/**
 * cards.js - ข้อมูลและตัวช่วยสำหรับการ์ด
 * 
 * FIX: ปรับ variants ให้ตรงกับไฟล์รูปที่มีจริง
 * - การ์ดที่มีรูปหลายแบบ (3 variants): exploding_kitten, defuse, see_the_future, shuffle, skip, attack, nope, favor
 * - Cat cards (1 variant): taco_cat, hairy_potato_cat, beard_cat, rainbow_cat, cattermelon  
 *   (ถ้ามีรูปจริงหลายแบบให้เพิ่มตัวเลขได้)
 * - New cards (1 variant): alter_the_future, clairvoyance, clone, dig_deeper, draw_from_bottom, reverse
 */

function makeVariants(base, n) {
  var result = [];
  for (var i = 0; i < n; i++) {
    var suffix = i === 0 ? '' : '_' + (i + 1);
    result.push({ png: '/cards/' + base + suffix + '.png', jpg: '/cards/' + base + suffix + '.jpg' });
  }
  return result;
}

const CARD_INFO = {
  exploding_kitten: { emoji: '💥', name: 'Exploding Kitten', color: '#ef4444',
    img: '/cards/exploding_kitten.png', imgJpg: '/cards/exploding_kitten.jpg',
    variants: makeVariants('exploding_kitten', 3), desc: 'จั่วใบนี้แล้วไม่มี Defuse = ตายทันที!' },
  defuse:           { emoji: '🛡️', name: 'Defuse', color: '#22c55e',
    img: '/cards/defuse.png', imgJpg: '/cards/defuse.jpg',
    variants: makeVariants('defuse', 3), desc: 'ป้องกันการระเบิด' },
  see_the_future:   { emoji: '🔮', name: 'See the Future', color: '#8b5cf6',
    img: '/cards/see_the_future.png', imgJpg: '/cards/see_the_future.jpg',
    variants: makeVariants('see_the_future', 2), desc: 'ดูไพ่ 3 ใบบนสุดของกอง' },
  shuffle:          { emoji: '🔀', name: 'Shuffle', color: '#3b82f6',
    img: '/cards/shuffle.png', imgJpg: '/cards/shuffle.jpg',
    variants: makeVariants('shuffle', 3), desc: 'ผสมกองไพ่กลางใหม่' },
  skip:             { emoji: '⏭️', name: 'Skip', color: '#06b6d4',
    img: '/cards/skip.png', imgJpg: '/cards/skip.jpg',
    variants: makeVariants('skip', 3), desc: 'ข้ามเทิร์น ไม่ต้องจั่ว' },
  attack:           { emoji: '⚔️', name: 'Attack', color: '#f97316',
    img: '/cards/attack.png', imgJpg: '/cards/attack.jpg',
    variants: makeVariants('attack', 3), desc: 'คนถัดไปต้องเล่น 2 เทิร์น' },
  nope:             { emoji: '🚫', name: 'Nope', color: '#ec4899',
    img: '/cards/nope.png', imgJpg: '/cards/nope.jpg',
    variants: makeVariants('nope', 3), desc: 'ยกเลิกการ์ดที่คนอื่นเพิ่งเล่น' },
  favor:            { emoji: '🙀', name: 'Favor', color: '#eab308',
    img: '/cards/favor.png', imgJpg: '/cards/favor.jpg',
    variants: makeVariants('favor', 2), desc: 'บังคับผู้เล่นหนึ่งให้ไพ่ 1 ใบ' },
  // Cat cards — ปรับ variants ให้ตรงกับไฟล์จริง (default: 1)
  // ถ้ามีหลายรูปให้เพิ่มตัวเลข เช่น makeVariants('taco_cat', 2)
  taco_cat:         { emoji: '🌮', name: 'Taco Cat', color: '#f59e0b',
    img: '/cards/taco_cat.png', imgJpg: '/cards/taco_cat.jpg',
    variants: makeVariants('taco_cat', 1), desc: 'Cat Card — ใช้คู่เพื่อขโมยไพ่' },
  hairy_potato_cat: { emoji: '🥔', name: 'Hairy Potato Cat', color: '#a3a3a3',
    img: '/cards/hairy_potato_cat.png', imgJpg: '/cards/hairy_potato_cat.jpg',
    variants: makeVariants('hairy_potato_cat', 1), desc: 'Cat Card — ใช้คู่เพื่อขโมยไพ่' },
  beard_cat:        { emoji: '🧔', name: 'Beard Cat', color: '#78716c',
    img: '/cards/beard_cat.png', imgJpg: '/cards/beard_cat.jpg',
    variants: makeVariants('beard_cat', 1), desc: 'Cat Card — ใช้คู่เพื่อขโมยไพ่' },
  rainbow_cat:      { emoji: '🌈', name: 'Rainbow Cat', color: '#a855f7',
    img: '/cards/rainbow_cat.png', imgJpg: '/cards/rainbow_cat.jpg',
    variants: makeVariants('rainbow_cat', 2), desc: 'Cat Card — ใช้คู่เพื่อขโมยไพ่' },
  cattermelon:      { emoji: '🍉', name: 'Cattermelon', color: '#4ade80',
    img: '/cards/cattermelon.png', imgJpg: '/cards/cattermelon.jpg',
    variants: makeVariants('cattermelon', 1), desc: 'Cat Card — ใช้คู่เพื่อขโมยไพ่' },
  // New expansion cards
  alter_the_future: { emoji: '👁️', name: 'Alter the Future', color: '#8b5cf6',
    img: '/cards/alter_the_future.png', imgJpg: '/cards/alter_the_future.jpg',
    variants: makeVariants('alter_the_future', 1), desc: 'ดูไพ่ 3 ใบบนสุดแล้วเรียงลำดับใหม่ (เป็นความลับ)' },
  clairvoyance:     { emoji: '🔮', name: 'Clairvoyance', color: '#06b6d4',
    img: '/cards/clairvoyance.png', imgJpg: '/cards/clairvoyance.jpg',
    variants: makeVariants('clairvoyance', 1), desc: 'เล่นหลัง Defuse — รู้ว่า Exploding Kitten ถูกใส่ที่ไหน' },
  clone:            { emoji: '📋', name: 'Clone', color: '#6366f1',
    img: '/cards/clone.png', imgJpg: '/cards/clone.jpg',
    variants: makeVariants('clone', 1), desc: 'คัดลอกการ์ดใต้ใบนี้แล้วใช้กฎของมัน' },
  dig_deeper:       { emoji: '🔍', name: 'Dig Deeper', color: '#3b82f6',
    img: '/cards/dig_deeper.png', imgJpg: '/cards/dig_deeper.jpg',
    variants: makeVariants('dig_deeper', 1), desc: 'จั่ว 2 ใบ เก็บ 1 ใบ คืน 1 ใบลงกองที่จั่วไป' },
  draw_from_bottom: { emoji: '⬇️', name: 'Draw from the Bottom', color: '#10b981',
    img: '/cards/draw_from_bottom.png', imgJpg: '/cards/draw_from_bottom.jpg',
    variants: makeVariants('draw_from_bottom', 1), desc: 'ป้องกัน Attack — จั่วจากใบล่างของกอง (ลด 1 ตาต่อใบ)' },
  reverse:          { emoji: '🔄', name: 'Reverse', color: '#ec4899',
    img: '/cards/reverse.png', imgJpg: '/cards/reverse.jpg',
    variants: makeVariants('reverse', 1), desc: 'ย้อนลำดับการเล่น หรือทำหน้าที่เป็น Skip (2 ผู้เล่น)' },
};

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

/**
 * คำนวณจำนวนไพ่ทั้งหมดที่ควรมีในกอง (ไม่รวม defuse/exploding)
 * ใช้ debug ตรวจสอบว่ากองไพ่ถูกต้องไหม
 */
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