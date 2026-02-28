/**
 * auth.js - ฟังก์ชัน authentication และ user profile
 * [UPDATED] ใช้ ICONS แทน emoji และ t() แทน hardcoded strings
 */

var authAvatarState = { type: null, value: null };

function setAuthMode(mode) {
  var isLogin = mode === 'login';
  document.getElementById('authTabLogin').classList.toggle('active', isLogin);
  document.getElementById('authTabSignup').classList.toggle('active', !isLogin);
  document.getElementById('authDisplayNameGroup').style.display = isLogin ? 'none' : 'block';
  document.getElementById('authAvatarGroup').style.display    = isLogin ? 'none' : 'block';
  document.getElementById('authSubmitBtn').innerHTML = isLogin
    ? '<i class="fas fa-sign-in-alt me-2"></i>' + t('auth.login')
    : '<i class="fas fa-user-plus me-2"></i>' + t('auth.signup');
  document.getElementById('authForm').dataset.mode = mode;
}

async function submitAuth(e) {
  e.preventDefault();
  var mode     = document.getElementById('authForm').dataset.mode || 'login';
  var email    = document.getElementById('authEmail').value.trim();
  var password = document.getElementById('authPassword').value;
  var dispName = document.getElementById('authDisplayName') ? document.getElementById('authDisplayName').value.trim() : '';
  var avatarUrl= authAvatarState.value || null;
  var url  = mode === 'login' ? '/api/login' : '/api/signup';
  var body = mode === 'login' ? { email, password } : { email, password, displayName: dispName, avatarUrl };
  try {
    var res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    var data = await res.json();
    if (!res.ok) {
      showToast(ICONS.warning + ' ' + data.error);
      return;
    }
    currentUser = data.user;
    localStorage.setItem('user', JSON.stringify(currentUser));
    applyUserToUI(currentUser);
    showScreen('home');
  } catch (err) {
    showToast(ICONS.warning + ' ' + t('auth.error.connect'));
  }
}

function submitProfile(e) {
  if (e && e.preventDefault) e.preventDefault();
  saveProfile();
}

function applyUserToUI(user) {
  if (!user) return;
  document.getElementById('profileMenu').style.display = 'block';
  document.getElementById('profileName').textContent = user.displayName;

  var profileAvatar = document.getElementById('profileAvatar');
  if (profileAvatar) {
    if (user.avatarUrl && (
      user.avatarUrl.startsWith('data:image') ||
      user.avatarUrl.startsWith('http') ||
      user.avatarUrl.startsWith('/')
    )) {
      profileAvatar.innerHTML = '';
      profileAvatar.style.overflow = 'hidden';
      profileAvatar.style.padding = '0';
      var img = document.createElement('img');
      img.src = user.avatarUrl;
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block;border-radius:50%;';
      img.onerror = function() {
        profileAvatar.innerHTML = '<i class="fas fa-user" style="font-size:12px;color:#1a0a00;"></i>';
      };
      profileAvatar.appendChild(img);
    } else if (user.avatarUrl && user.avatarUrl.length <= 4) {
      profileAvatar.innerHTML = '<span style="font-size:16px;line-height:1;">' + user.avatarUrl + '</span>';
    } else {
      var initial = (user.displayName || '?')[0].toUpperCase();
      var colors = ['#6366f1','#8b5cf6','#ec4899','#f97316','#22c55e','#c9973a'];
      var color = colors[(user.displayName || '').length % colors.length];
      profileAvatar.innerHTML = '';
      profileAvatar.style.background = color;
      profileAvatar.innerHTML = '<span style="font-size:13px;font-weight:700;color:#fff;">' + initial + '</span>';
    }
  }

  if (user.isAdmin) document.getElementById('adminMenuEntry').style.display = 'block';
}

function logout() {
  currentUser = null;
  localStorage.removeItem('user');
  document.getElementById('profileMenu').style.display = 'none';
  showScreen('auth');
}

function requireLoginOr(fn) {
  if (!currentUser) {
    var saved = localStorage.getItem('user');
    if (saved) {
      try {
        currentUser = JSON.parse(saved);
        applyUserToUI(currentUser);
      } catch (_) {
        localStorage.removeItem('user');
      }
    }
  }
  if (!currentUser) {
    showToast(ICONS.warning + ' ' + t('auth.pleaseLogin'));
    showScreen('auth');
    return;
  }
  fn();
}

function openProfileModal() {
  if (currentUser) {
    document.getElementById('profileEmail').textContent = currentUser.email || '-';
    document.getElementById('profileDisplayName').textContent = currentUser.displayName || '-';
    document.getElementById('profileRank').textContent = (currentUser.rank && currentUser.rank.name) ? currentUser.rank.name : t('profile.noRank');

    if (currentUser.avatarUrl && (
      currentUser.avatarUrl.startsWith('data:image') ||
      currentUser.avatarUrl.startsWith('http')
    )) {
      document.getElementById('profilePictureDisplay').innerHTML = '<img src="' + currentUser.avatarUrl + '" style="width:100%;height:100%;object-fit:cover;display:block;">';
    } else {
      document.getElementById('profilePictureDisplay').innerHTML = '<i class="fas fa-user" style="color:rgba(255,255,255,0.5);font-size:3.5rem;"></i>';
    }
  }
  safeShowModal('profileModal');
}

function handleProfilePictureChange(e) {
  var file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showToast(ICONS.warning + ' ' + t('profile.imgSize'));
    return;
  }
  if (!file.type.startsWith('image/')) {
    showToast(ICONS.warning + ' ' + t('profile.imgType'));
    return;
  }
  var reader = new FileReader();
  reader.onload = function(event) {
    var base64Data = event.target.result;
    profileAvatarState = { type: 'image', value: base64Data };
    document.getElementById('profilePictureDisplay').innerHTML = '<img src="' + base64Data + '" style="width:100%;height:100%;object-fit:cover;display:block;">';
    showToast(ICONS.check + ' ' + t('profile.imgOk'));
  };
  reader.readAsDataURL(file);
}

async function saveProfile() {
  try {
    if (!currentUser || !currentUser.id) {
      showToast(ICONS.warning + ' ' + t('auth.pleaseLogin'));
      return;
    }
    var payload = { userId: currentUser.id };
    if (profileAvatarState.type === 'image') payload.avatarUrl = profileAvatarState.value;
    var res = await fetch('/api/update-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    var data = await res.json();
    if (!res.ok) {
      showToast(ICONS.warning + ' ' + data.error);
      return;
    }
    if (data.user) {
      currentUser = data.user;
      localStorage.setItem('user', JSON.stringify(currentUser));
      applyUserToUI(currentUser);
    }
    safeHideModal('profileModal');
    showToast(ICONS.check + ' ' + t('profile.saved'));
    profileAvatarState = { type: null, value: null };
  } catch (err) {
    showToast(ICONS.warning + ' ' + t('auth.error.connect'));
  }
}