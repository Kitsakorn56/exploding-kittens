/**
 * i18n.js - ข้อความและ icon กลาง รองรับหลายภาษา
 *
 * วิธีใช้:
 *   t('key')          → ข้อความตาม locale ปัจจุบัน
 *   t('key', {n:2})   → ข้อความพร้อม interpolation เช่น "เทิร์น {n}"
 *   I18N.setLocale('en')  → เปลี่ยนภาษา
 *   I18N.locale           → locale ปัจจุบัน ('th' | 'en')
 *
 * ── Icon Map (ใช้ Font Awesome แทน emoji ทุกที่) ──────────────────────────────
 *   ICONS.key  → '<i class="fas fa-..." ...></i>'
 */

// ─── Icons (Font Awesome — ไม่ใช้ emoji) ─────────────────────────────────────
const ICONS = {
  // gameplay
  explode:      '<i class="fas fa-bomb"           style="color:#ef4444;"></i>',
  defuse:       '<i class="fas fa-shield-alt"      style="color:#22c55e;"></i>',
  future:       '<i class="fas fa-eye"             style="color:#8b5cf6;"></i>',
  shuffle:      '<i class="fas fa-random"          style="color:#3b82f6;"></i>',
  skip:         '<i class="fas fa-forward"         style="color:#06b6d4;"></i>',
  attack:       '<i class="fas fa-crosshairs"      style="color:#f97316;"></i>',
  nope:         '<i class="fas fa-ban"             style="color:#ec4899;"></i>',
  favor:        '<i class="fas fa-hand-holding"    style="color:#eab308;"></i>',
  cat:          '<i class="fas fa-cat"             style="color:#a78bfa;"></i>',
  alter:        '<i class="fas fa-pencil-alt"      style="color:#8b5cf6;"></i>',
  clairvoyance: '<i class="fas fa-crystal-ball"    style="color:#06b6d4;"></i>',
  clone:        '<i class="fas fa-copy"            style="color:#6366f1;"></i>',
  dig:          '<i class="fas fa-search"          style="color:#3b82f6;"></i>',
  drawBottom:   '<i class="fas fa-arrow-down"      style="color:#10b981;"></i>',
  reverse:      '<i class="fas fa-undo"            style="color:#ec4899;"></i>',
  card:         '<i class="fas fa-clone"           style="color:var(--gold);"></i>',
  // UI
  target:       '<i class="fas fa-crosshairs"      style="color:var(--gold);"></i>',
  turn:         '<i class="fas fa-play-circle"     style="color:var(--gold);"></i>',
  myTurn:       '<i class="fas fa-star"            style="color:#f0c060;"></i>',
  dice:         '<i class="fas fa-dice"            style="color:var(--text-2);"></i>',
  skull:        '<i class="fas fa-skull-crossbones"style="color:#ef4444;"></i>',
  trophy:       '<i class="fas fa-trophy"          style="color:#f0c060;"></i>',
  win:          '<i class="fas fa-crown"           style="color:#f0c060;"></i>',
  steal:        '<i class="fas fa-hand-paper"      style="color:#f59e0b;"></i>',
  draw:         '<i class="fas fa-hand-point-up"   style="color:var(--gold);"></i>',
  hint:         '<i class="fas fa-question-circle" style="color:rgba(255,255,255,0.4);"></i>',
  info:         '<i class="fas fa-info-circle"     style="color:var(--gold);"></i>',
  spectator:    '<i class="fas fa-eye"             style="color:var(--text-3);"></i>',
  warning:      '<i class="fas fa-exclamation-triangle" style="color:#f97316;"></i>',
  check:        '<i class="fas fa-check-circle"    style="color:#22c55e;"></i>',
  sword:        '<i class="fas fa-sword"           style="color:#f97316;"></i>',
  plus:         '<i class="fas fa-plus-circle"     style="color:var(--gold);"></i>',
  qr:           '<i class="fas fa-qrcode"          style="color:var(--gold);"></i>',
  camera:       '<i class="fas fa-camera"          style="color:var(--gold);"></i>',
  redo:         '<i class="fas fa-redo"            style="color:var(--gold);"></i>',
  door:         '<i class="fas fa-door-open"       style="color:var(--gold);"></i>',
  user:         '<i class="fas fa-user"            style="color:var(--gold);"></i>',
  users:        '<i class="fas fa-users"           style="color:var(--gold);"></i>',
};

// ─── Locale Strings ───────────────────────────────────────────────────────────
const LOCALES = {

  th: {
    // ── Auth ──
    'auth.login':           'เข้าสู่ระบบ',
    'auth.signup':          'สมัครสมาชิก',
    'auth.email':           'อีเมล',
    'auth.password':        'รหัสผ่าน',
    'auth.displayName':     'ชื่อในเกม',
    'auth.avatarOptional':  'รูปโปรไฟล์ (ไม่บังคับ)',
    'auth.disclaimer':      'ระบบบัญชีเก็บข้อมูลบนเซิร์ฟเวอร์นี้เท่านั้น',
    'auth.pleaseLogin':     'กรุณาเข้าสู่ระบบก่อน',
    'auth.success.login':   'เข้าสู่ระบบสำเร็จ',
    'auth.success.signup':  'สมัครสมาชิกสำเร็จ',
    'auth.error.connect':   'เชื่อมต่อไม่ได้',

    // ── Home ──
    'home.createRoom':  'สร้างห้องใหม่',
    'home.joinRoom':    'เข้าร่วมห้อง',
    'home.subtitle':    'เกมเเมวระเบิดออนไลน์',

    // ── Lobby ──
    'lobby.title':          'สร้างห้องใหม่',
    'lobby.roomCode':       'รหัสห้อง',
    'lobby.copyCode':       'คัดลอก',
    'lobby.copied':         'คัดลอก: {code}',
    'lobby.copyFail':       'คัดลอกไม่ได้ — กรุณาคัดลอกเอง: {code}',
    'lobby.players':        'ผู้เล่น',
    'lobby.selectCards':    'เลือกการ์ดที่จะใช้',
    'lobby.startGame':      'เริ่มเกม!',
    'lobby.leave':          'ออก',
    'lobby.warning':        'อย่าแชร์รหัสห้องนี้กับคนที่คุณไม่รู้จัก!',
    'lobby.capacity':       'รองรับ 2–5 คน',
    'lobby.created':        'สร้างห้องสำเร็จ!',
    'lobby.joined':         'เข้าห้องสำเร็จ!',
    'lobby.notFound':       'ไม่พบห้องนี้',
    'lobby.minPlayers':     'ต้องมีผู้เล่นอย่างน้อย 2 คน!',
    'lobby.left':           'ออกจากห้องแล้ว',
    'lobby.codeLength':     'รหัส 4 ตัวอักษร!',
    'lobby.waitHost':       'รอให้เจ้าของห้องกด "เริ่มเกม"',
    'lobby.hostBadge':      'Host',

    // ── Joining ──
    'join.title':           'เข้าร่วมห้อง',
    'join.placeholder':     'XXXX',

    // ── Game HUD ──
    'game.round':           'รอบที่ {n}',
    'game.yourTurn':        'เทิร์นของคุณ!',
    'game.theirTurn':       'เทิร์นของ {name}',
    'game.attackTurns':     'คุณต้องเล่นอีก {n} เทิร์น',
    'game.noCards':         'ไม่มีการ์ดในมือ',
    'game.spectating':      'คุณถูกระเบิดแล้ว — กำลังดู Spectator',
    'game.selectToPlay':    'เลือกการ์ดเพื่อเล่น',
    'game.drawCard':        'จั่ว',
    'game.hint':            'แตะการ์ดเพื่อเลือก · ม่าย เล่นได้ทุกเมื่อ',
    'game.drawPile':        'จั่ว',
    'game.discardPile':     'กองทิ้ง',
    'game.loading':         'กำลังโหลด...',
    'game.leaveGame':       'ออกจากเกมแล้ว',

    // ── Card Actions / Play Button ──
    'card.singleCatNoEffect':   '{name} ใบเดียวไม่มีผล',
    'card.cannotPlay':          'ไม่สามารถเล่นได้',
    'card.cannotDefuse':        'ไม่สามารถเล่น การ์ดปลดชนวน โดยตรง',
    'card.playCard':            'เล่น {name}',
    'card.steal2':              'สะสม 2 ใบ — ขโมยการ์ดเเบบสุ่ม',
    'card.steal3':              'สะสม 3 ใบ — ขโมยการ์ดที่ต้องการ',
    'card.steal5':              'สะสม 5 ใบ — เลือกการ์ดจากกองทิ้ง',
    'card.invalidCombo':        'การ์ดที่เลือกไม่ถูกต้อง',
    'card.notYourTurn':         'ยังไม่ใช่เทิร์นของคุณ',
    'card.noNopeTarget':        'ไม่มีการ์ดที่จะ ม่าย ได้ตอนนี้',

    // ── Modals ──
    'modal.targetTitle':        'เลือกเป้าหมาย',
    'modal.targetFavor':        'เลือกผู้เล่นที่ต้องการขโมยการ์ด',
    'modal.targetSteal2':       'เลือกผู้เล่นที่ต้องการขโมยการ์ดสุ่ม 1 ใบ',
    'modal.targetSteal3':       'เลือกผู้เล่นที่ต้องการขโมยการ์ดที่ระบุ',
    'modal.insertTitle':        'ปลดชนวน สำเร็จ!',
    'modal.insertDesc':         'เลือกตำแหน่งที่จะใส่ เเมวระเบิด คืนในกองการ์ด',
    'modal.insertTop':          'บนสุดของกอง',
    'modal.insertBottom':       'ล่างสุดของกอง',
    'modal.insertMid':          'ตำแหน่งที่ {pos} จากบน ',
    'modal.insertHint':         '0 = บนสุด  | สูงสุด = ล่างสุด ',
    'modal.insertConfirm':      'ยืนยันตำแหน่ง',
    'modal.favorTitle':         'ขโมย!',
    'modal.favorPrompt':        'คุณถูกใช้การ์ดขโมย! เลือกการ์ด 1 ใบเพื่อให้',
    'modal.steal3Title':        'เลือกการ์ดที่ต้องการขโมย',
    'modal.steal3From':         'ขโมยจาก: {name}',
    'modal.discard5Title':      'เลือกการ์ดจากกองทิ้ง',
    'modal.seeFutureTitle':     'มองอนาคต',
    'modal.seeFutureDesc':      '3 ใบบนสุดของกอง (ใบที่ 1 = บนสุด)',
    'modal.seeFuturePos':       'ใบที่ {n}',
    'modal.cardPickerTitle':    'เลือกการ์ด',
    'modal.close':              'ปิด',
    'modal.confirm':            'ยืนยัน',
    'modal.reset':              'รีเซ็ต',
    'modal.save':               'บันทึก',
    'modal.cancel':             'ยกเลิก',

    // ── Card Selection ──
    'cardsel.title':    'เลือกการ์ดที่จะใช้',
    'cardsel.reset':    'รีเซ็ตเป็นค่าเริ่มต้นแล้ว',
    'cardsel.saved':    'บันทึกการ์ดที่เลือกแล้ว',
    'cardsel.unit':     'ใบ',

    // ── Win Screen ──
    'win.title':        'ผู้ชนะ!',
    'win.you':          'คุณ!',
    'win.playAgain':    'เล่นอีกครั้ง',
    'win.backLobby':    'กลับ Lobby',

    // ── Alter Future ──
    'alter.title':      'เปลี่ยนอนาคต',
    'alter.pos':        'ตำแหน่ง {n}',
    'alter.confirm':    'ยืนยันลำดับ',

    // ── Dig Deeper ──
    'dig.title':        'ขุดลึกลงไปอีก',
    'dig.keep':         'เก็บไว้',
    'dig.return':       'คืนกอง',

    // ── Draw from Bottom ──
    'drawBottom.title':     'จั่วจากใต้กอง',
    'drawBottom.success':   'ป้องกัน การ์ดโจมตี สำเร็จ!',
    'drawBottom.sub':       'จั่วจากใบล่างของกอง',
    'drawBottom.remain':    'ยังคงต้องเล่นอีก {n} เทิร์น',
    'drawBottom.done':      'โจมตีหมดแล้ว!',

    // ── Reverse ──
    'reverse.title':    'ย้อนกลับ',
    'reverse.normal':   'ลำดับการเล่นถูกย้อนแล้ว!',
    'reverse.twoP':     'การ์ดย้อนกลับ ใน 2 ผู้เล่น — ทำหน้าที่เป็น ข้ามเทิร์น แทน',

    // ── Clairvoyance ──
    'clair.inserted':   'การ์ดเเมวระเบิด ถูกใส่ที่ตำแหน่งที่ {pos}',
    'clair.notYet':     'ยังไม่ได้ใส่การ์ดเเมวระเบิด',

    // ── Profile ──
    'profile.title':    'โปรไฟล์ของฉัน',
    'profile.email':    'อีเมล',
    'profile.name':     'ชื่อในเกม',
    'profile.rank':     'ยศ',
    'profile.noRank':   'ไม่มี',
    'profile.upload':   'คลิกเพื่ออัพโหลดรูป JPG/PNG (ขนาดสูงสุด 5MB)',
    'profile.nameHint': 'เปลี่ยนชื่อได้เฉพาะตอนสมัครเท่านั้น',
    'profile.saved':    'บันทึกโปรไฟล์แล้ว',
    'profile.imgSize':  'ไฟล์ใหญ่เกิน 5MB',
    'profile.imgType':  'ต้องเป็นไฟล์รูปภาพ',
    'profile.imgOk':    'อัพโหลดรูปสำเร็จ',

    // ── Admin ──
    'admin.title':        'จัดการยศ',
    'admin.searchEmail':  'ค้นหาด้วยอีเมล',
    'admin.search':       'ค้นหา',
    'admin.roomPlayers':  'ผู้เล่นในห้อง',
    'admin.target':       'เป้าหมาย: {name}',
    'admin.rankName':     'ชื่อยศ',
    'admin.rankNameHint': '(เว้นว่าง = ลบยศ)',
    'admin.rankColor':    'สียศ',
    'admin.saveRank':     'บันทึกยศ',
    'admin.saved':        'บันทึกยศแล้ว',
    'admin.selectPlayer': 'โปรดเลือกผู้เล่น',
    'admin.enterEmail':   'กรุณากรอก Email',

    // ── Toasts / Events ──
    'toast.defused':        'จั่วการ์ดเเมวระเบิด แต่ใช้การ์ดปลดชนวน รอดได้!',
    'toast.youExploded':    'คุณถูกระเบิดแล้ว! กำลังดูแบบ Spectator',
    'toast.exploded':       '{name} ระเบิดแล้ว!',
    'toast.nope':           '{name} ม่าย!',
    'toast.nopeNope':       '{name} ม่าย เจอ ม่าย!',
    'toast.nopeCancelled':  '{name} ถูก ม่าย — ยกเลิกแล้ว',
    'toast.shuffled':       '{name} สับกองการ์ด',
    'toast.shuffleInserted':'ใส่ การ์ดเเมวระเบิด คืนกองแล้ว',
    'toast.attacked':       '{name} โจมตี! ผู้เล่นถัดไปต้องเล่น {n} เทิร์น',
    'toast.favorGiven':     '{from} ให้ {card} แก่ {to}',
    'toast.stoleCard':      'คุณขโมย {card} จาก {from}',
    'toast.stoleOther':     '{by} ขโมยการ์ดจาก {from}',
    'toast.cardStolen':     '{by} ขโมย {card} ของคุณ!',
    'toast.playerLeft':     '{name} ออก',
    'toast.disconnected':   '{name} หลุดการเชื่อมต่อ',
    'toast.hostLeft':       'เจ้าของห้องออกแล้ว',
    'toast.clairvoyance':   '{name} ใช้การ์ด ตาทิพย์',
    'toast.clone':          '{name} ใช้การ์ด โคลน',
    'toast.cloneApplied':   'Clone ได้ผล! {card}',
    'toast.alterFuture':    '{name} กำลังเรียงลำดับการ์ด...',
    'toast.digDeeper':      '{name} ใช้การ์ด ขุดลึกลงไปอีก',
    'toast.drawFromBottom': '{name} ใช้การ์ด จั่วการ์ดใต้กอง (ป้องกันการ์ดโจมตี)',
    'toast.reverse':        '{name} ใช้การ์ด ย้อนกลับ — {effect}',
    'toast.reverse.normal': 'ลำดับการเล่นถูกย้อน',
    'toast.reverse.twoP':   'ทำหน้าที่ ข้าม เทิร์น (ถ้าเล่น 2 คน)',
    'toast.error':          '{msg}',

    // ── Animations ──
    'anim.gotCard':     'คุณได้การ์ด!',
    'anim.stealOk':     'ขโมยสำเร็จ!',
    'anim.from':        'จาก',
    'anim.yourTurn':    'เทิร์นของคุณ!',
    'anim.theirTurn':   'เทิร์นของ {name}',
    'anim.youExplode':  'คุณระเบิดแล้ว!',
    'anim.theyExplode': '{name} ระเบิด!',
    'anim.youSkip':     'คุณ ข้าม!',
    'anim.theySkip':    '{name} ข้าม!',
    'anim.skipSub':     'ข้ามเทิร์น ไม่ต้องจั่วการ์ด',
    'anim.shuffleLabel':'{name} สับกองการ์ด',
    'anim.youPlay':     'คุณ',
    'anim.plays':       'เล่น',

    // ── Rooms ──
    'room.open':        'ห้องเปิดอยู่',
    'room.qrcode':      'QR เข้าห้อง',
    'room.profile':     'โปรไฟล์ของฉัน',
    'room.logout':      'ออกจากระบบ',
    'room.profileEdit': 'ปรับแต่งโปรไฟล์',
    'room.adminPanel':  'จัดการยศ (Admin)',
    'room.back':        'กลับ',
    'room.upload':      'อัพโหลด',
    'room.play':        'เล่น',
    'room.waiting':     'รอเริ่มเกม...',
    'room.startWait':   'รอให้เจ้าของห้องกด "เริ่มเกม"',
    'room.selectCards': 'เลือกการ์ดที่จะใช้',
    'room.createRoom':  'สร้างห้อง',
    'room.joinRoom':    'เข้าร่วม',

    // ── Misc ──
    'misc.you':         '(คุณ)',
    'misc.dead':        'ระเบิดแล้ว',
    'misc.cards':       '{n} ใบ',
    'misc.noCards':     'ไม่มีการ์ด',
    'misc.error':       'เกิดข้อผิดพลาด',

    // ── Player Action Status ──
    'status.favor':           ICONS.favor + ' เลือกการ์ด...',
    'status.see_the_future':  ICONS.future + ' ดูการ์ด...',
    'status.alter_the_future': ICONS.alter + ' เรียงลำดับ...',
    'status.clairvoyance':    ICONS.future + ' ดูการ์ดที่ซ่อน...',
    'status.dig_deeper':      ICONS.drawBottom + ' ขุด...',

    // ── Card Names ──
    'card.name.exploding_kitten': 'เเมวระเบิด',
    'card.name.defuse':           'ปลดชนวน',
    'card.name.see_the_future':   'มองอนาคต',
    'card.name.shuffle':          'สับการ์ด',
    'card.name.skip':             'ข้าม',
    'card.name.attack':           'โจมตี',
    'card.name.nope':             'ม่าย',
    'card.name.favor':            'ขโมย',
    'card.name.taco_cat':         'ทาโก้เเคท',
    'card.name.hairy_potato_cat': 'เเมวมันฝรั่งมีขน',
    'card.name.beard_cat':        'เเมวเครา',
    'card.name.rainbow_cat':      'เเมวอ้วกสายรุ้ง',
    'card.name.cattermelon':      'เเมวบิกินี่',
    'card.name.alter_the_future': 'เปลี่ยนอนาคต',
    'card.name.clairvoyance':     'ตาทิพย์',
    'card.name.clone':            'โคลน',
    'card.name.dig_deeper':       'ขุดลึกลงไปอีก',
    'card.name.draw_from_bottom': 'จั่วการ์ดใต้กอง',
    'card.name.reverse':          'ย้อนกลับ',

    // ── Card Descriptions ──
   'card.desc.exploding_kitten': 'ถ้าไม่มีใบปลดชนวน คุณต้องออกจากเกมทันที!',
    'card.desc.defuse':           'ใช้ทันทีเมื่อจั่วเจอแมวระเบิด เพื่อนำระเบิดไปวางคืนในกอง',
    'card.desc.see_the_future':   'แอบดูการ์ด 3 ใบบนสุดของกองจั่ว',
    'card.desc.shuffle':          'สับกองจั่วใหม่จนกว่าจะพอใจ',
    'card.desc.skip':             'จบเทิร์นของคุณทันทีโดยไม่ต้องจั่วการ์ด',
    'card.desc.attack':           'จบเทิร์นโดยไม่ต้องจั่ว และบังคับให้คนต่อไปเล่น 2 เทิร์น',
    'card.desc.nope':             'ใช้หยุดการกระทำของคนอื่น (ยกเว้นแมวระเบิดและปลดชนวน)',
    'card.desc.favor':            'เลือกผู้เล่น 1 คน เพื่อบังคับให้เขามอบการ์ดให้คุณ 1 ใบ',
    'card.desc.taco_cat':         'ไม่มีพลังพิเศษ แต่ถ้าใช้คู่กัน 2 ใบ จะขโมยการ์ดเพื่อนได้',
    'card.desc.hairy_potato_cat': 'สะสมให้ครบ 2 ใบในชื่อเดียวกันเพื่อขโมยการ์ดสุ่มจากเพื่อน',
    'card.desc.beard_cat':        'สะสมให้ครบ 2 ใบในชื่อเดียวกันเพื่อขโมยการ์ดสุ่มจากเพื่อน',
    'card.desc.rainbow_cat':      'สะสมให้ครบ 2 ใบในชื่อเดียวกันเพื่อขโมยการ์ดสุ่มจากเพื่อน',
    'card.desc.cattermelon':      'สะสมให้ครบ 2 ใบในชื่อเดียวกันเพื่อขโมยการ์ดสุ่มจากเพื่อน',
    'card.desc.alter_the_future': 'แอบดูการ์ด 3 ใบบนสุด และสามารถเรียงลำดับใหม่ได้ตามใจชอบ',
    'card.desc.clairvoyance':     'ใช้หลังจากเพื่อนปลดชนวน เพื่อดูว่าเขาแอบวางระเบิดไว้ตรงไหน',
    'card.desc.clone':            'เลียนแบบความสามารถของการ์ดใบที่เพิ่งถูกเล่นก่อนหน้านี้',
    'card.desc.dig_deeper':       'ดูการ์ด2ใบบนสุด เเล้วเลือกว่าจะเก็บไว้หรือเอาไปวางคืนในกอง',
    'card.desc.draw_from_bottom': 'จบเทิร์นโดยการจั่วการ์ดจากล่างสุดของกองแทนใบบนสุด',
    'card.desc.reverse':          'ย้อนลำดับทิศทางการเล่น และจบเทิร์นโดยไม่ต้องจั่วการ์ด',
  },

  // ─────────────────────────────────────────────────────────────────────────
  en: {
    // ── Auth ──
    'auth.login':           'Login',
    'auth.signup':          'Sign Up',
    'auth.email':           'Email',
    'auth.password':        'Password',
    'auth.displayName':     'Display Name',
    'auth.avatarOptional':  'Profile Picture (optional)',
    'auth.disclaimer':      'Account data is stored on this server only.',
    'auth.pleaseLogin':     'Please log in first.',
    'auth.success.login':   'Logged in!',
    'auth.success.signup':  'Account created!',
    'auth.error.connect':   'Connection failed.',

    // ── Home ──
    'home.createRoom':  'Create Room',
    'home.joinRoom':    'Join Room',
    'home.subtitle':    'Exploding Kittens Multiplayer Online',

    // ── Lobby ──
    'lobby.title':          'Create New Room',
    'lobby.roomCode':       'Room Code',
    'lobby.copyCode':       'Copy',
    'lobby.copied':         'Copied: {code}',
    'lobby.copyFail':       'Could not copy — copy manually: {code}',
    'lobby.players':        'Players',
    'lobby.selectCards':    'Select Cards',
    'lobby.startGame':      'Start Game!',
    'lobby.leave':          'Leave',
    'lobby.warning':        'Don\'t share this code with strangers!',
    'lobby.capacity':       'Supports 2–5 players',
    'lobby.created':        'Room created!',
    'lobby.joined':         'Joined room!',
    'lobby.notFound':       'Room not found.',
    'lobby.minPlayers':     'Need at least 2 players!',
    'lobby.left':           'Left the room.',
    'lobby.codeLength':     'Code must be 4 characters!',
    'lobby.waitHost':       'Waiting for the host to start the game.',
    'lobby.hostBadge':      'Host',

    // ── Joining ──
    'join.title':           'Join Room',
    'join.placeholder':     'XXXX',

    // ── Game HUD ──
    'game.round':           'Round {n}',
    'game.yourTurn':        'Your Turn!',
    'game.theirTurn':       '{name}\'s Turn',
    'game.attackTurns':     'You must play {n} more turn(s)',
    'game.noCards':         'No cards in hand',
    'game.spectating':      'You exploded — Spectating',
    'game.selectToPlay':    'Select a card to play',
    'game.drawCard':        'Draw',
    'game.hint':            'Tap a card to select · Nope can be played anytime',
    'game.drawPile':        'Draw',
    'game.discardPile':     'Discard',
    'game.loading':         'Loading...',
    'game.leaveGame':       'Left game.',

    // ── Card Actions ──
    'card.singleCatNoEffect':   '{name} alone has no effect',
    'card.cannotPlay':          'Cannot play this card',
    'card.cannotDefuse':        'Cannot play Defuse directly',
    'card.playCard':            'Play {name}',
    'card.steal2':              '2 cards — Steal random (choose target)',
    'card.steal3':              '3 cards — Steal specific (choose target)',
    'card.steal5':              '5 cards — Choose from discard',
    'card.invalidCombo':        'Invalid card combination',
    'card.notYourTurn':         'Not your turn yet',
    'card.noNopeTarget':        'Nothing to Nope right now',

    // ── Modals ──
    'modal.targetTitle':        'Choose Target',
    'modal.targetFavor':        'Choose a player to Favor',
    'modal.targetSteal2':       'Choose a player to steal a random card from',
    'modal.targetSteal3':       'Choose a player to steal a specific card from',
    'modal.insertTitle':        'Defuse Successful!',
    'modal.insertDesc':         'Choose where to insert the Exploding Kitten',
    'modal.insertTop':          'Top of deck (very dangerous!)',
    'modal.insertBottom':       'Bottom of deck (safest)',
    'modal.insertMid':          'Position {pos} from top ({rem} cards below)',
    'modal.insertHint':         '0 = top (dangerous) | max = bottom (safe)',
    'modal.insertConfirm':      'Confirm Position',
    'modal.favorTitle':         'Favor!',
    'modal.favorPrompt':        'You were Favored! Give 1 card.',
    'modal.steal3Title':        'Choose a card to steal',
    'modal.steal3From':         'Steal from: {name}',
    'modal.discard5Title':      'Choose from discard pile',
    'modal.seeFutureTitle':     'See the Future',
    'modal.seeFutureDesc':      'Top 3 cards (card 1 = top)',
    'modal.seeFuturePos':       'Card {n}',
    'modal.cardPickerTitle':    'Pick a Card',
    'modal.close':              'Close',
    'modal.confirm':            'Confirm',
    'modal.reset':              'Reset',
    'modal.save':               'Save',
    'modal.cancel':             'Cancel',

    // ── Card Selection ──
    'cardsel.title':    'Select Cards',
    'cardsel.reset':    'Reset to defaults.',
    'cardsel.saved':    'Card selection saved.',
    'cardsel.unit':     '',

    // ── Win Screen ──
    'win.title':        'Winner!',
    'win.you':          'You!',
    'win.playAgain':    'Play Again',
    'win.backLobby':    'Back to Lobby',

    // ── Alter Future ──
    'alter.title':      'Alter the Future',
    'alter.pos':        'Position {n}',
    'alter.confirm':    'Confirm Order',

    // ── Dig Deeper ──
    'dig.title':        'Dig Deeper',
    'dig.keep':         'Keep',
    'dig.return':       'Return',

    // ── Draw from Bottom ──
    'drawBottom.title':     'Draw from the Bottom',
    'drawBottom.success':   'Attack blocked!',
    'drawBottom.sub':       'Drew from the bottom of the deck',
    'drawBottom.remain':    '{n} turn(s) remaining',
    'drawBottom.done':      'Attack resolved!',

    // ── Reverse ──
    'reverse.title':    'Reverse',
    'reverse.normal':   'Turn order reversed!',
    'reverse.twoP':     'Reverse with 2 players — acts as Skip',

    // ── Clairvoyance ──
    'clair.inserted':   'Exploding Kitten will be at position {pos}',
    'clair.notYet':     'Exploding Kitten not yet inserted',

    // ── Profile ──
    'profile.title':    'My Profile',
    'profile.email':    'Email',
    'profile.name':     'Display Name',
    'profile.rank':     'Rank',
    'profile.noRank':   'None',
    'profile.upload':   'Click to upload JPG/PNG (max 5MB)',
    'profile.nameHint': 'Name can only be set at signup',
    'profile.saved':    'Profile saved.',
    'profile.imgSize':  'File exceeds 5MB',
    'profile.imgType':  'Must be an image file',
    'profile.imgOk':    'Image uploaded!',

    // ── Admin ──
    'admin.title':        'Manage Ranks',
    'admin.searchEmail':  'Search by email',
    'admin.search':       'Search',
    'admin.roomPlayers':  'Players in room',
    'admin.target':       'Target: {name}',
    'admin.rankName':     'Rank Name',
    'admin.rankNameHint': '(leave blank to remove rank)',
    'admin.rankColor':    'Rank Color',
    'admin.saveRank':     'Save Rank',
    'admin.saved':        'Rank saved.',
    'admin.selectPlayer': 'Please select a player',
    'admin.enterEmail':   'Please enter an email',

    // ── Toasts ──
    'toast.defused':        'Drew Exploding Kitten but used Defuse — survived!',
    'toast.youExploded':    'You exploded! Spectating now.',
    'toast.exploded':       '{name} exploded!',
    'toast.nope':           '{name} Nope!',
    'toast.nopeNope':       '{name} Nope the Nope!',
    'toast.nopeCancelled':  '{name} was Noped — cancelled!',
    'toast.shuffled':       '{name} shuffled the deck',
    'toast.shuffleInserted':'Exploding Kitten reinserted into deck',
    'toast.attacked':       '{name} attacked! Next player plays {n} turns',
    'toast.favorGiven':     '{from} gave {card} to {to}',
    'toast.stoleCard':      'You stole {card} from {from}',
    'toast.stoleOther':     '{by} stole from {from}',
    'toast.cardStolen':     '{by} stole {card} from you!',
    'toast.playerLeft':     '{name} left',
    'toast.disconnected':   '{name} disconnected',
    'toast.hostLeft':       'The host left the room',
    'toast.clairvoyance':   '{name} used Clairvoyance',
    'toast.clone':          '{name} used Clone',
    'toast.cloneApplied':   'Clone worked! {card}',
    'toast.alterFuture':    '{name} is reordering cards...',
    'toast.digDeeper':      '{name} used Dig Deeper',
    'toast.drawFromBottom': '{name} used Draw from the Bottom (blocks Attack)',
    'toast.reverse':        '{name} used Reverse — {effect}',
    'toast.reverse.normal': 'turn order reversed',
    'toast.reverse.twoP':   'acts as Skip',
    'toast.error':          '{msg}',

    // ── Animations ──
    'anim.gotCard':     'You got a card!',
    'anim.stealOk':     'Steal successful!',
    'anim.from':        'from',
    'anim.yourTurn':    'Your Turn!',
    'anim.theirTurn':   '{name}\'s Turn',
    'anim.youExplode':  'You exploded!',
    'anim.theyExplode': '{name} exploded!',
    'anim.youSkip':     'You SKIP!',
    'anim.theySkip':    '{name} SKIP!',
    'anim.skipSub':     'Skip turn, no draw',
    'anim.shuffleLabel':'{name} shuffled',
    'anim.youPlay':     'You',
    'anim.plays':       'played',

    // ── Rooms ──
    'room.open':        'Room Open',
    'room.qrcode':      'QR to Join',
    'room.profile':     'My Profile',
    'room.logout':      'Logout',
    'room.profileEdit': 'Edit Profile',
    'room.adminPanel':  'Manage Ranks (Admin)',
    'room.back':        'Back',
    'room.upload':      'Upload',
    'room.play':        'Play',
    'room.waiting':     'Waiting to start...',
    'room.startWait':   'Waiting for host to start the game',
    'room.selectCards': 'Select Cards',
    'room.createRoom':  'Create',
    'room.joinRoom':    'Join',

    // ── Misc ──
    'misc.you':         '(You)',
    'misc.dead':        'Exploded',
    'misc.cards':       '{n} cards',
    'misc.noCards':     'No cards',
    'misc.error':       'An error occurred',

    // ── Player Action Status ──
    'status.favor':           ICONS.favor + ' Selecting...',
    'status.see_the_future':  ICONS.future + ' Seeing...',
    'status.alter_the_future': ICONS.alter + ' Ordering...',
    'status.clairvoyance':    ICONS.future + ' Looking...',
    'status.dig_deeper':      ICONS.drawBottom + ' Digging...',

    // ── Card Names ──
    'card.name.exploding_kitten': 'Exploding Kitten',
    'card.name.defuse':           'Defuse',
    'card.name.see_the_future':   'See the Future',
    'card.name.shuffle':          'Shuffle',
    'card.name.skip':             'Skip',
    'card.name.attack':           'Attack',
    'card.name.nope':             'Nope',
    'card.name.favor':            'Favor',
    'card.name.taco_cat':         'Taco Cat',
    'card.name.hairy_potato_cat': 'Hairy Potato Cat',
    'card.name.beard_cat':        'Beard Cat',
    'card.name.rainbow_cat':      'Rainbow Cat',
    'card.name.cattermelon':      'Cattermelon',
    'card.name.alter_the_future': 'Alter the Future',
    'card.name.clairvoyance':     'Clairvoyance',
    'card.name.clone':            'Clone',
    'card.name.dig_deeper':       'Dig Deeper',
    'card.name.draw_from_bottom': 'Draw from the Bottom',
    'card.name.reverse':          'Reverse',

    // ── Card Descriptions ──
    'card.desc.exploding_kitten': 'Draw this without a Defuse — you\'re out!',
    'card.desc.defuse':           'Defuse an Exploding Kitten.',
    'card.desc.see_the_future':   'Peek at the top 3 cards of the deck.',
    'card.desc.shuffle':          'Shuffle the draw pile.',
    'card.desc.skip':             'End your turn without drawing.',
    'card.desc.attack':           'Force the next player to take 2 turns.',
    'card.desc.nope':             'Cancel any card just played.',
    'card.desc.favor':            'Force a player to give you 1 card.',
    'card.desc.taco_cat':         'Cat Card — pair to steal a card.',
    'card.desc.hairy_potato_cat': 'Cat Card — pair to steal a card.',
    'card.desc.beard_cat':        'Cat Card — pair to steal a card.',
    'card.desc.rainbow_cat':      'Cat Card — pair to steal a card.',
    'card.desc.cattermelon':      'Cat Card — pair to steal a card.',
    'card.desc.alter_the_future': 'Peek at the top 3 cards and secretly reorder them.',
    'card.desc.clairvoyance':     'Play after Defuse — see where the Exploding Kitten was placed.',
    'card.desc.clone':            'Copy the card below this one and use its effect.',
    'card.desc.dig_deeper':       'Draw 2, keep 1, return 1 to where you drew it from.',
    'card.desc.draw_from_bottom': 'Block an Attack — draw from the bottom (reduces 1 turn per use).',
    'card.desc.reverse':          'Reverse turn order, or act as Skip with 2 players.',
  }
};

// ─── I18N Core ────────────────────────────────────────────────────────────────
const I18N = (function() {
  var _locale = localStorage.getItem('locale') || 'th';

  function interpolate(str, params) {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, function(_, k) {
      return (params[k] !== undefined) ? params[k] : '{' + k + '}';
    });
  }

  return {
    get locale() { return _locale; },
    setLocale: function(loc) {
      if (LOCALES[loc]) {
        _locale = loc;
        localStorage.setItem('locale', loc);
      }
    },
    t: function(key, params) {
      var strings = LOCALES[_locale] || LOCALES['th'];
      var str = strings[key];
      if (str === undefined) {
        // fallback to 'th'
        str = LOCALES['th'][key];
      }
      if (str === undefined) return key;
      return interpolate(str, params);
    }
  };
})();

/** ฟังก์ชัน shorthand สำหรับเรียกใช้ทั่วทั้งโค้ด */
function t(key, params) {
  return I18N.t(key, params);
}

/** ชื่อการ์ดตาม locale ปัจจุบัน */
function cardName(type) {
  return I18N.t('card.name.' + type);
}

/** คำอธิบายการ์ดตาม locale ปัจจุบัน */
function cardDesc(type) {
  return I18N.t('card.desc.' + type);
}