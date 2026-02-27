# เแบ่งส่วน Game.js (Modularization)

## สรุปการเปลี่ยนแปลง

ไฟล์ `game.js` เดิมขนาด **1,983 บรรทัด** ถูกแบ่งออกเป็น **12 โมดูล** เพื่อให้โค้ดเรียบร้อยและจัดการง่ายขึ้น

## โครงสร้างโมดูล

### 1. **game-state.js**
   - ตัวแปรทั่วโลก (`gs` object)
   - `currentUser`, `socket`, `customCardCounts` เป็นต้น

### 2. **cards.js** 
   - `CARD_INFO` - ข้อมูลการ์ดทั้งหมด
   - เสริมยาร์ (variants) และการทำงานกับรูปการ์ด
   - `CAT_TYPES`, `SELECTABLE_CARDS`, `getCardImg()`, `buildImgTag()`

### 3. **audio.js**
   - `playSound()` - เสียงต่างๆ (click, explode, win, draw, attack ฯลฯ)
   - `getAudio()` - ตัวช่วยสำหรับ Web Audio API

### 4. **ui-common.js**
   - Navigation: `showScreen()`, `showToast()`, `goToHome()` ฯลฯ
   - Modal: `safeShowModal()`, `safeHideModal()`, `clearModalBackdrops()`
   - Theme: `toggleTheme()`, `updateThemeIcon()`, `initTheme()`
   - Helpers: `escHtml()`, `getAvatarHTML()`, `showLoading()`, `hideLoading()`

### 5. **room.js**
   - สร้างห้อง: `createRoom()`, `generateRoomCode()`
   - เข้าห้อง: `joinRoom()`, `showLobbyHost()`, `showLobbyGuest()`
   - จัดการผู้เล่น: `updateLobbyPlayersList()`, `updateGuestPlayersList()`
   - ควบคุมเกม: `startGame()`, `leaveLobby()`, `leaveGame()`

### 6. **animations.js**
   - Draw card: `showDrawCardAnimation()`, `showDrawResultPopup()`
   - Steal: `showStealAnimation()`, `showStealResultPopup()`
   - Explode: `showExplodeAnimation()`
   - Action: `showAttackAnimation()`, `showSkipAnimation()`, `showTurnChangeAnimation()`
   - Other: `showCardPlayedOverlay()`, `showShuffleAnimation()`, `showConfettiAnimation()`, `showDealCardsAnimation()`

### 7. **hand.js**
   - Render: `renderHand()`, `buildCardHTML()`
   - Select: `toggleSelectCard()`
   - Preview: `showCardPreview()`, `hideCardPreview()`, `showCardDetailModal()`, `closeCardDetailModal()`
   - Touch: `startCardTouchPreview()`, `endCardTouchPreview()`, `cancelCardTouchPreview()`

### 8. **game-rendering.js**
   - Main: `renderGameScreen()`, `renderTableCenter()`, `renderPlayers()`
   - Discard: `renderDiscardPile()`, `buildCardIconsHTML()`
   - Risk: `renderRiskGauge()`
   - Action: `updateActionLog()`, `showNopeBanner()`, `showWinScreen()`

### 9. **game-actions.js**
   - Play: `updatePlayButton()`, `playSelectedCards()`, `drawCard()`
   - Target: `openTargetPickerModal()`, `confirmTargetPick()`, `cancelTargetPick()`
   - Insert: `openInsertModal()`, `updateInsertLabel()`, `confirmInsert()`
   - Favor: `openFavorModal()`, `giveFavor()`
   - Steal: `openSteal3Modal()`, `stealCardType()`
   - Discard: `openDiscard5Modal()`, `takeFromDiscard()`
   - Admin: `openAdminPanel()`, `adminSelectTarget()`, `adminApplyRank()`, `adminSearchUser()`

### 10. **socket-handlers.js**
   - Socket event listeners ทั้งหมด
   - `your-player-id`, `join-error`, `room-updated`, `game-started`, `card-played`
   - `drew-exploding-kitten`, `player-exploded`, `game-over`
   - `card-stolen`, `pick-card-type-to-steal`, `steal-result`
   - `game-state`, `admin-search-result` ฯลฯ

### 11. **auth.js**
   - Auth: `setAuthMode()`, `submitAuth()`, `applyUserToUI()`
   - Profile: `openProfileModal()`, `handleProfilePictureChange()`, `saveProfile()`
   - Logout: `logout()`, `requireLoginOr()`

### 12. **game.js** (main)
   - Socket initialization
   - DOMContentLoaded setup
   - Card selection builder functions

## การเรียงลำดับการโหลด

index.html โหลด scripts ในลำดับนี้:
```html
<script src="/modules/game-state.js"></script>    <!-- 1. ตัวแปรทั่วโลก -->
<script src="/modules/cards.js"></script>         <!-- 2. ข้อมูลการ์ด -->
<script src="/modules/audio.js"></script>         <!-- 3. เสียง -->
<script src="/modules/ui-common.js"></script>     <!-- 4. UI ทั่วไป -->
<script src="/modules/room.js"></script>          <!-- 5. ห้อง -->
<script src="/modules/animations.js"></script>    <!-- 6. แอนิเมชั่น -->
<script src="/modules/hand.js"></script>          <!-- 7. มือไพ่ -->
<script src="/modules/game-rendering.js"></script><!-- 8. Render -->
<script src="/modules/game-actions.js"></script>  <!-- 9. Actions -->
<script src="/modules/socket-handlers.js"></script><!-- 10. Socket -->
<script src="/modules/auth.js"></script>          <!-- 11. Auth -->
<script src="/modules/game.js"></script>          <!-- 12. Main -->
```

## ข้อดีของการแบ่งส่วน

✅ **ไฟล์ที่เล็กกว่า** - ทุกไฟล์อ่านและแก้ไขได้ง่ายขึ้น  
✅ **สหสาขาที่ชัดเจน** - แต่ละโมดูลมีความรับผิดชอบที่ชัดเจน  
✅ **ความสามารถในการบำรุงรักษา** - ค้นหาฟังก์ชันได้ลัดเลาะ  
✅ **ความสามารถในการนำกลับมาใช้** - โมดูลสามารถนำกลับมาใช้ได้ง่ายขึ้น  
✅ **ง่ายต่อการทำงาน** - หลายคนสามารถทำงานกับไฟล์ต่างกันพร้อมกันได้

## ไฟล์สำรอง

ไฟล์ `game.js.backup` มีเนื้อหาเดิม (ถ้าจำเป็นต้องกลับไป)

## หมายเหตุ

- ทุกโมดูลใช้ namespace ทั่วโลก - ไม่มี encapsulation หรือ webpack bundling
- โหลดลำดับนั้นสำคัญ - ตรวจสอบให้แน่ใจว่า dependencies โหลดก่อนการใช้
- `socket` ถูกสร้างในโมดูล 12 (`game.js`) หลังจากโหลด socket.io
