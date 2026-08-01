/* ===========================================================
   CrushAI web app — real backend wiring behind the exact
   markup/CSS of the design system. Function names match the
   onclick="" handlers already present in index.html verbatim;
   nothing in the HTML/CSS was changed except two hidden
   <input type="file"> elements for real photo uploads.
   =========================================================== */

const API_BASE = "http://localhost:4000";
const TOKEN_KEY = "crushai_token";

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || "request_failed_" + status);
    this.status = status;
    this.body = body;
  }
}

async function api(path, options = {}) {
  const headers = Object.assign({}, options.headers);
  const token = getToken();
  if (token) headers["Authorization"] = "Bearer " + token;
  if (!(options.body instanceof FormData) && options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(API_BASE + path, Object.assign({}, options, { headers }));
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) throw new ApiError(res.status, body);
  return body;
}

function resolveMediaUrl(url) {
  if (!url) return null;
  return url.startsWith("http") ? url : API_BASE + url;
}

function ageFromBirthDate(birthDate) {
  const dob = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

/* ===========================================================
   Decorative background (unchanged from the prototype)
   =========================================================== */
const starsWrap = document.getElementById('ca-stars');
for (let i = 0; i < 28; i++) {
  const s = document.createElement('div');
  s.className = 'ca-star';
  s.style.top = Math.random() * 100 + '%';
  s.style.left = Math.random() * 100 + '%';
  s.style.animationDelay = (Math.random() * 3) + 's';
  starsWrap.appendChild(s);
}

document.getElementById('ca-screen-home').classList.add('ca-hidden');
document.getElementById('ca-screen-splash').classList.remove('ca-hidden');
history.replaceState({ screen: 'splash' }, '', '#splash');
setTimeout(() => { caShowScreen('home'); }, 1300);

function caTileImg(seed) {
  return "url('https://api.dicebear.com/9.x/lorelei/svg?seed=" + seed + "&backgroundColor=2b1b42,4a3560,3a2e4a')";
}
function caTileImgUrl(photoUrl, seedFallback) {
  return photoUrl ? "url('" + resolveMediaUrl(photoUrl) + "')" : caTileImg(seedFallback);
}

/* ===========================================================
   Navigation (unchanged) — screen stack, tab highlighting,
   auth-gate on Results/Chats/Settings.
   =========================================================== */
let caLoggedIn = false;
let caHasProfile = null;
let caPendingAction = null;
let caHistory = [];
let caHasSearched = false;

function caUpdateHomeRecent() {
  const label = document.getElementById('ca-home-recent-label');
  if (label) label.textContent = caHasSearched ? 'חיפושים אחרונים' : 'הצעות לחיפוש';
  const cta = document.getElementById('ca-home-signup-cta');
  if (cta) cta.style.display = caLoggedIn ? 'none' : '';
}

const CA_SCREENS = ['auth', 'onboarding', 'notif', 'home', 'analyzing', 'results', 'profile', 'chats', 'settings',
  'verify', 'safety', 'delete', 'quiz', 'premium', 'splash', 'chatroom', 'match', 'edit-profile', 'inbox',
  'discovery', 'showme', 'invite', 'boost', 'forgot', 'interests', 'orientation', 'otp'];

function caNavigateTo(name) {
  if ((name === 'results' || name === 'chats' || name === 'settings') && !caLoggedIn) {
    caRequireAuth(() => caShowScreen(name));
    return;
  }
  if (name === 'results') caRenderResults();
  if (name === 'chats') caRenderChats();
  if (name === 'settings') caRenderSettings();

  CA_SCREENS.forEach(s => {
    document.getElementById('ca-screen-' + s).classList.add('ca-hidden');
  });
  document.getElementById('ca-screen-' + name).classList.remove('ca-hidden');
  if (name === 'discovery') caUpdateSetAgeRange();
  if (name === 'edit-profile') caLoadEditProfile();
  if (name === 'home') caUpdateHomeRecent();
  const tabbar = document.querySelector('.ca-tabbar');
  if (tabbar) tabbar.classList.toggle('ca-hidden', ['auth', 'onboarding', 'notif', 'quiz', 'splash', 'chatroom', 'match', 'otp'].includes(name));
  ['home', 'results', 'chats', 'settings'].forEach(t => {
    document.getElementById('ca-tab-' + t)?.classList.remove('active');
  });
  if (name === 'home') document.getElementById('ca-tab-home').classList.add('active');
  if (name === 'results' || name === 'profile') document.getElementById('ca-tab-results').classList.add('active');
  if (name === 'chats') document.getElementById('ca-tab-chats').classList.add('active');
  if (name === 'settings') document.getElementById('ca-tab-settings').classList.add('active');
}

function caShowScreen(name) {
  const activeEl = document.querySelector('.ca-screen:not(.ca-hidden)');
  const prev = activeEl ? activeEl.id.replace('ca-screen-', '') : null;
  if (prev && prev !== name) {
    caHistory.push(prev);
    history.pushState({ screen: name }, '', '#' + name);
  } else if (!history.state) {
    history.replaceState({ screen: name }, '', '#' + name);
  }
  caNavigateTo(name);
}

// Real back-navigation — this also makes the browser's own Back button (and
// mobile swipe-back) work, not just the in-app "← חזרה" links, since both
// paths now go through popstate below.
function caGoBack() {
  history.back();
}

window.addEventListener('popstate', (event) => {
  caHistory.pop();
  const screen = (event.state && event.state.screen) || 'home';
  caNavigateTo(screen);
});

function caRequireAuth(action) {
  if (caLoggedIn && caHasProfile) { action(); return; }
  caPendingAction = action;
  if (!caLoggedIn) {
    caShowScreen('auth');
  } else {
    caShowScreen('onboarding');
  }
}

/* ===========================================================
   Boot: resume a session if a token is already stored.
   =========================================================== */
(async function boot() {
  const token = getToken();
  if (!token) return;
  try {
    await api('/auth/me');
    caLoggedIn = true;
    try {
      await api('/profile/me');
      caHasProfile = true;
    } catch (err) {
      caHasProfile = err instanceof ApiError && err.status === 404 ? false : true;
    }
  } catch {
    clearToken();
    caLoggedIn = false;
  }
})();

/* ===========================================================
   Auth (signup / login) — real, followed by simulated OTP for
   new signups (no SMS provider wired up yet — any 6-digit code
   is accepted so the rest of the flow can be built end-to-end).
   =========================================================== */
let caAuthMode = 'signup';

function caAuthTab(mode) {
  caAuthMode = mode;
  const signupBtn = document.getElementById('ca-tab-signup');
  const loginBtn = document.getElementById('ca-tab-login');
  const forgot = document.getElementById('ca-forgot-link');
  const submit = document.getElementById('ca-auth-submit');
  if (mode === 'signup') {
    signupBtn.classList.add('active');
    loginBtn.classList.remove('active');
    forgot.style.display = 'none';
    submit.textContent = 'המשך';
  } else {
    loginBtn.classList.add('active');
    signupBtn.classList.remove('active');
    forgot.style.display = '';
    submit.textContent = 'התחברות';
  }
}

function caUpdateAuthGate() {
  const submit = document.getElementById('ca-auth-submit');
  const checked = document.getElementById('ca-age-check').checked;
  submit.style.opacity = checked ? '1' : '0.5';
  submit.style.pointerEvents = checked ? 'auto' : 'none';
}

function caAuthFields() {
  const scope = document.getElementById('ca-screen-auth');
  return {
    email: scope.querySelector('input[type=email]'),
    phone: scope.querySelector('input[type=tel]'),
    password: scope.querySelector('input[type=password]'),
  };
}

async function caStartOtp() {
  const { email, password } = caAuthFields();
  if (!email.value || !password.value) { alert('נא למלא אימייל וסיסמה'); return; }

  try {
    if (caAuthMode === 'signup') {
      const result = await api('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: email.value,
          password: password.value,
          birthDate: '2000-01-01', // placeholder — real DOB is collected (as age) in onboarding
          acceptedTerms: true,
        }),
      });
      setToken(result.token);
      caLoggedIn = true;
      caHasProfile = false;
      document.getElementById('ca-otp-input').value = '';
      caShowScreen('otp');
    } else {
      const result = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: email.value, password: password.value }) });
      setToken(result.token);
      caLoggedIn = true;
      try {
        await api('/profile/me');
        caHasProfile = true;
        caFinishAuthFlow();
      } catch (err) {
        caHasProfile = false;
        caShowScreen('onboarding');
      }
    }
  } catch (err) {
    alert(caAuthErrorMessage(err));
  }
}

function caAuthErrorMessage(err) {
  const code = err instanceof ApiError ? err.body?.error : null;
  switch (code) {
    case 'must_be_18_or_older': return 'צריך להיות מעל גיל 18.';
    case 'email_already_registered': return 'כבר יש חשבון עם האימייל הזה.';
    case 'invalid_credentials': return 'אימייל או סיסמה שגויים.';
    case 'account_banned': return 'החשבון הזה חסום.';
    case 'password_too_short': return 'הסיסמה חייבת להכיל לפחות 8 תווים.';
    case 'password_needs_letter': return 'הסיסמה חייבת להכיל לפחות אות אחת.';
    case 'password_needs_number': return 'הסיסמה חייבת להכיל לפחות ספרה אחת.';
    default: return 'אירעה שגיאה. נסה/נסי שוב.';
  }
}

function caVerifyOtp() {
  const code = document.getElementById('ca-otp-input').value.trim();
  if (code.length !== 6) { alert('נא להזין קוד בן 6 ספרות'); return; }
  caOnboardStep = 1;
  caUpdateOnboardStep();
  caUpdateHeightRange();
  caShowScreen('onboarding');
}

function caResendOtp() {
  alert('קוד חדש נשלח ב-SMS');
}

function caFinishAuthFlow() {
  const action = caPendingAction;
  caPendingAction = null;
  if (action) action(); else caShowScreen('home');
}

/* ===========================================================
   Onboarding — real profile save + real photo upload.
   =========================================================== */
let caOnboardStep = 1;
let caMainPhotoFile = null;
const caExtraPhotoFiles = [null, null, null];
let caPendingPhotoTarget = null; // 'main' | 0 | 1 | 2

function caPickPhoto(el) {
  caPendingPhotoTarget = el === 'main' ? 'main' : Array.from(el.parentElement.children).indexOf(el);
  document.getElementById('ca-profile-photo-input').click();
}

function caProfilePhotoSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  if (caPendingPhotoTarget === 'main') {
    caMainPhotoFile = file;
    const box = document.getElementById('ca-main-photo');
    box.style.backgroundImage = "url('" + url + "')";
    box.style.backgroundSize = 'cover';
    box.textContent = '';
    box.classList.add('filled');
  } else if (typeof caPendingPhotoTarget === 'number') {
    caExtraPhotoFiles[caPendingPhotoTarget] = file;
    const slot = document.querySelectorAll('.ca-photo-slot')[caPendingPhotoTarget];
    slot.style.backgroundImage = "url('" + url + "')";
    slot.style.backgroundSize = 'cover';
    slot.textContent = '';
    slot.classList.add('filled');
  }
  event.target.value = '';
}

function caToggleTrait(el) {
  el.classList.toggle('selected');
}

function caToggleSingle(el, group) {
  const wasSelected = el.classList.contains('selected');
  el.parentElement.querySelectorAll('.ca-trait').forEach(t => t.classList.remove('selected'));
  if (!wasSelected) el.classList.add('selected');
}

function caSelectGender(g) {
  document.getElementById('ca-gender-male').classList.toggle('active', g === 'male');
  document.getElementById('ca-gender-female').classList.toggle('active', g === 'female');
}
function caSelectInterest(g) {
  document.getElementById('ca-interest-men').classList.toggle('active', g === 'men');
  document.getElementById('ca-interest-women').classList.toggle('active', g === 'women');
}
function caSelectReligion(r) {
  ['secular', 'traditional', 'religious'].forEach(v => {
    document.getElementById('ca-religion-' + v).classList.toggle('active', v === r);
  });
}

function caUpdateHeightRange() {
  const el = document.getElementById('ca-height-range');
  const val = parseInt(el.value);
  const pct = ((val - el.min) / (el.max - el.min)) * 100;
  document.getElementById('ca-height-fill').style.width = pct + '%';
  document.getElementById('ca-height-label').textContent = (val / 100).toFixed(2) + " מ'";
}

function caUpdateOnboardStep() {
  [1, 2, 3].forEach(n => {
    document.getElementById('ca-ob-step-' + n).classList.toggle('active', n === caOnboardStep);
    document.getElementById('ca-dot-' + n).classList.toggle('active', n === caOnboardStep);
  });
  document.getElementById('ca-ob-back').style.visibility = 'visible';
  document.getElementById('ca-ob-next').textContent = caOnboardStep === 3 ? 'סיום' : 'הבא';
  caUpdateTermsGate();
}

function caUpdateTermsGate() {
  const nextBtn = document.getElementById('ca-ob-next');
  const checked = document.getElementById('ca-terms-check').checked;
  const shouldDisable = caOnboardStep === 3 && !checked;
  nextBtn.style.opacity = shouldDisable ? '0.5' : '1';
  nextBtn.style.pointerEvents = shouldDisable ? 'none' : 'auto';
}

function caOnboardStep2Fields() {
  const scope = document.getElementById('ca-ob-step-2');
  const texts = scope.querySelectorAll('input[type=text]');
  return {
    age: scope.querySelector('input[type=number]'),
    city: texts[0],
    occupation: texts[1],
    bio: scope.querySelector('textarea'),
    genderActive: scope.querySelector('#ca-gender-male.active') ? 'male' : (scope.querySelector('#ca-gender-female.active') ? 'female' : null),
    interestActive: scope.querySelector('#ca-interest-men.active') ? 'men' : (scope.querySelector('#ca-interest-women.active') ? 'women' : null),
    religionActive: ['secular', 'traditional', 'religious'].find(v => document.getElementById('ca-religion-' + v).classList.contains('active')) || null,
  };
}

async function caOnboardNext() {
  if (caOnboardStep < 3) {
    if (caOnboardStep === 1 && !caMainPhotoFile) { alert('יש לבחור תמונה ראשית'); return; }
    caOnboardStep++;
    caUpdateOnboardStep();
    return;
  }

  const f = caOnboardStep2Fields();
  if (!f.age.value || !f.genderActive || !f.interestActive) {
    alert('חסרים פרטים בסיסיים (גיל, מין, העדפה) בשלב הקודם');
    caOnboardStep = 2;
    caUpdateOnboardStep();
    return;
  }

  const nextBtn = document.getElementById('ca-ob-next');
  nextBtn.textContent = 'שומר...';
  try {
    const year = new Date().getFullYear() - parseInt(f.age.value, 10);
    const smokeGrid = Array.from(document.querySelectorAll('#ca-ob-step-2 .ca-trait-grid')).find(g => g.previousElementSibling?.textContent.includes('מעשן'));
    const intentGrid = Array.from(document.querySelectorAll('#ca-ob-step-2 .ca-trait-grid')).find(g => g.previousElementSibling?.textContent.includes('לחפש'));
    const tags = Array.from(document.querySelectorAll('#ca-trait-grid .ca-trait.selected')).map(t => t.textContent.trim());

    await api('/profile/me', {
      method: 'PUT',
      body: JSON.stringify({
        displayName: (caAuthFields().email.value || 'משתמש/ת').split('@')[0],
        birthDate: `${year}-01-01`,
        gender: f.genderActive,
        interestedIn: f.interestActive,
        region: f.city.value || undefined,
        bio: f.bio.value || undefined,
        profession: f.occupation.value || undefined,
        religion: f.religionActive || undefined,
        lifestyleTags: tags,
      }),
    });
    void smokeGrid; void intentGrid; // captured for future structured storage; lifestyleTags already covers step-3 tags

    if (caMainPhotoFile) await caUploadPhoto(caMainPhotoFile);
    for (const file of caExtraPhotoFiles) if (file) await caUploadPhoto(file);

    caHasProfile = true;
    caShowScreen('notif');
  } catch (err) {
    alert('שגיאה בשמירת הפרופיל: ' + (err instanceof ApiError ? (err.body?.error || err.message) : 'שגיאה לא צפויה'));
  } finally {
    nextBtn.textContent = 'סיום';
  }
}

async function caUploadPhoto(file) {
  const form = new FormData();
  form.append('photo', file);
  await api('/profile/me/photos', { method: 'POST', body: form });
}

function caOnboardBack() {
  if (caOnboardStep > 1) {
    caOnboardStep--;
    caUpdateOnboardStep();
  } else {
    caGoBack();
  }
}

function caFinishNotif() {
  caFinishAuthFlow();
}

/* ===========================================================
   Home — real visual search (+ traits search shared runner)
   =========================================================== */
function caRequestPhotoAccess() {
  document.getElementById('ca-permission-overlay').classList.remove('ca-hidden');
}
function caAllowPhotoAccess() {
  document.getElementById('ca-permission-overlay').classList.add('ca-hidden');
  document.getElementById('ca-file-input').click();
}
function caDenyPhotoAccess() {
  document.getElementById('ca-permission-overlay').classList.add('ca-hidden');
}
function caPhotoSelected(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  caRequireAuth(() => caRunVisualSearch(file));
}

async function caRunSearch(runner) {
  caShowScreen('analyzing');
  try {
    const [response] = await Promise.all([runner(), new Promise(r => setTimeout(r, 1400))]);
    caLastResults = response.results;
    caHasSearched = true;
    caShowScreen('results');
  } catch (err) {
    const msg = err instanceof ApiError && err.status === 502
      ? 'שירות ה-AI לא זמין כרגע. ודא/י שהוא רץ.'
      : 'לא הצלחנו להריץ את החיפוש. נסה/נסי שוב.';
    alert(msg);
    caGoBack();
  }
}

function caRunVisualSearch(file) {
  return caRunSearch(() => {
    const form = new FormData();
    form.append('photo', file);
    return api('/search/visual', { method: 'POST', body: form });
  });
}

function caRunTraitsSearch(answers) {
  return caRunSearch(() => api('/search/traits', { method: 'POST', body: JSON.stringify(answers) }));
}

/* ===========================================================
   Results / profile detail — real data.
   =========================================================== */
let caLastResults = [];
let caVisibleProfiles = [];
let caRemovedProfiles = [];
let caCurrentProfile = null;

function caRenderResults() {
  caVisibleProfiles = caLastResults.slice();
  caRemovedProfiles = [];
  const head = document.getElementById('ca-results-count');
  if (head) head.textContent = caLastResults.length + ' התאמות נמצאו';
  caShowUserGreeting();
  caDrawResultsGrid();
}

async function caShowUserGreeting() {
  const greeting = document.getElementById('ca-user-greeting');
  if (!greeting) return;
  if (!caLoggedIn) {
    greeting.style.display = 'none';
    return;
  }
  try {
    const p = await api('/profile/me');
    const firstName = (p.display_name || '').split(' ')[0];
    greeting.textContent = firstName ? `היי, ${firstName}` : '';
    greeting.style.display = firstName ? '' : 'none';
  } catch {
    greeting.style.display = 'none';
  }
}

function caDrawResultsGrid() {
  const grid = document.getElementById('ca-results-grid');
  grid.innerHTML = '';
  if (!caHasSearched) {
    grid.innerHTML = '<div class="ca-empty-state"><div class="ca-empty-icon">🔍</div>' +
      '<div class="ca-empty-title">עדיין לא חיפשת התאמות</div>' +
      '<div class="ca-empty-sub">התחיל/י חיפוש חדש מהעמוד הראשי</div></div>';
    return;
  }
  if (caVisibleProfiles.length === 0) {
    grid.innerHTML = '<div class="ca-empty-state"><div class="ca-empty-icon">🔍</div>' +
      '<div class="ca-empty-title">אין עוד תוצאות כרגע</div>' +
      '<div class="ca-empty-sub">נסה/י חיפוש חדש עם תמונה או שאלון אחר</div>' +
      '<button class="ca-btn ca-btn-primary" style="max-width:220px; margin:0 auto;" onclick="caResetResults()">חיפוש חדש</button></div>';
    return;
  }
  caVisibleProfiles.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'ca-card';
    card.onclick = () => caOpenProfile(p);
    card.innerHTML = `
      <div class="ca-card-photo">
        <div class="ca-bust" style="--a:#5A3A6E;--b:#241A34;--tile-img:${caTileImgUrl(p.primary_photo_url, p.profile_id)};"></div>
      </div>
      <div class="ca-card-body">
        <div class="ca-card-name">${escapeHtml(p.display_name)}, ${ageFromBirthDate(p.birth_date)}</div>
        <div class="ca-card-meta">${[p.region, p.profession].filter(Boolean).map(escapeHtml).join(' · ')}</div>
        ${p.bio ? `<div class="ca-card-snippet">${escapeHtml(p.bio)}</div>` : ''}
      </div>
      <span style="padding:0 10px; color:var(--ca-text-muted); font-size:16px; align-self:center;" onclick="event.stopPropagation(); caDismissProfile('${p.profile_id}')">✕</span>`;
    grid.appendChild(card);
  });
}

function caDismissProfile(profileId) {
  const idx = caVisibleProfiles.findIndex(p => p.profile_id === profileId);
  if (idx === -1) return;
  caRemovedProfiles.push(caVisibleProfiles[idx]);
  caVisibleProfiles.splice(idx, 1);
  caDrawResultsGrid();
}

function caUndoLast() {
  if (caRemovedProfiles.length === 0) { alert('אין פעולות לבטל'); return; }
  caVisibleProfiles.push(caRemovedProfiles.pop());
  caDrawResultsGrid();
}

function caResetResults() {
  caShowScreen('home');
}

function caOpenProfile(p) {
  caCurrentProfile = p;
  const hero = document.getElementById('ca-profile-hero');
  hero.innerHTML = `<div class="ca-bust" style="--a:#5A3A6E;--b:#241A34;--tile-img:${caTileImgUrl(p.primary_photo_url, p.profile_id)}; border-radius:20px;"></div>`;
  document.getElementById('ca-profile-name').textContent = `${p.display_name}, ${ageFromBirthDate(p.birth_date)}`;
  document.getElementById('ca-profile-sub').textContent = [p.region, p.profession].filter(Boolean).join(' · ');
  document.getElementById('ca-profile-bio').textContent = p.bio || '';
  document.getElementById('ca-profile-tags').innerHTML = (p.lifestyle_tags || []).map(t => `<div class="ca-chip">${escapeHtml(t)}</div>`).join('');
  document.getElementById('ca-profile-prompt').innerHTML = '';
  caShowScreen('profile');
}

async function caReportCurrentProfile() {
  const reason = prompt('מה קרה? ספר/י לנו בקצרה (זה יישלח לצוות הבטיחות)');
  if (!reason) return;
  try {
    await api('/reports', { method: 'POST', body: JSON.stringify({ reportedProfileId: caCurrentProfile.profile_id, reason }) });
    alert('הדיווח נשלח לצוות הבטיחות. תודה.');
  } catch {
    alert('לא הצלחנו לשלוח את הדיווח. נסה/נסי שוב.');
  }
}

async function caBlockCurrentProfile() {
  if (!confirm(`לחסום את ${caCurrentProfile.display_name}? לא תראו יותר זה את זה.`)) return;
  try {
    await api('/blocks', { method: 'POST', body: JSON.stringify({ targetProfileId: caCurrentProfile.profile_id }) });
    caDismissProfile(caCurrentProfile.profile_id);
    caShowScreen('results');
  } catch {
    alert('לא הצלחנו לחסום. נסה/נסי שוב.');
  }
}

async function caSendChatRequest() {
  const p = caCurrentProfile;
  try {
    const result = await api('/matches', { method: 'POST', body: JSON.stringify({ targetProfileId: p.profile_id }) });
    caCurrentMatch = p;
    const idx = caVisibleProfiles.indexOf(p);
    if (idx > -1) { caVisibleProfiles.splice(idx, 1); }
    document.getElementById('ca-match-avatar').innerHTML = `<div class="ca-bust" style="--a:#5A3A6E;--b:#241A34;--tile-img:${caTileImgUrl(p.primary_photo_url, p.profile_id)};"></div>`;
    document.getElementById('ca-match-sub').textContent = 'את/ה ו' + p.display_name + ' סימנתם התאמה הדדית';
    caCurrentMatchId = result.id;
    caShowScreen('match');
  } catch (err) {
    if (err instanceof ApiError && err.status === 403 && err.body?.error === 'daily_limit_reached') {
      document.getElementById('ca-limit-overlay').classList.remove('ca-hidden');
    } else {
      alert("לא הצלחנו לשלוח את בקשת הצ'אט. נסה/נסי שוב.");
    }
  }
}

function caCloseLimitOverlay() {
  document.getElementById('ca-limit-overlay').classList.add('ca-hidden');
}

/* ===========================================================
   Match → Chatroom / Chats list — real matches + messages.
   =========================================================== */
let caCurrentMatch = null;
let caCurrentMatchId = null;
let caCurrentChatMatchId = null;

function caGoToMatchChat() {
  const p = caCurrentMatch;
  caOpenChatroomById(caCurrentMatchId, p.display_name, p.primary_photo_url, p.profile_id);
}

async function caRenderChats() {
  const container = document.querySelector('#ca-screen-chats');
  container.querySelectorAll('.ca-chat-row, .ca-empty-state').forEach(r => r.remove());
  try {
    const { matches } = await api('/matches');
    if (matches.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'ca-empty-state';
      empty.innerHTML = '<div class="ca-empty-icon">💬</div><div class="ca-empty-title">עדיין אין שיחות</div><div class="ca-empty-sub">כשתתאימו למישהו, השיחה תופיע כאן</div>';
      container.appendChild(empty);
      return;
    }
    matches.forEach(m => {
      const row = document.createElement('div');
      row.className = 'ca-card ca-chat-row';
      row.style.cursor = 'pointer';
      row.onclick = () => caOpenChatroomById(m.id, m.display_name, m.primary_photo_url, m.other_user_id);
      row.innerHTML = `
        <div class="ca-avatar" style="width:44px; height:44px;"><div class="ca-bust" style="--a:#4A3560;--b:#241a34;--tile-img:${caTileImgUrl(m.primary_photo_url, m.other_user_id)};"></div></div>
        <div>
          <div class="ca-card-name">${escapeHtml(m.display_name)}</div>
          <div class="ca-card-meta">${escapeHtml(m.last_message || 'שלחו הודעה ראשונה')}</div>
        </div>`;
      container.appendChild(row);
    });
  } catch {
    // not fatal — leave the list empty
  }
}

async function caOpenChatroomById(matchId, name, photoUrl, seedFallback) {
  caCurrentChatMatchId = matchId;
  document.getElementById('ca-chatroom-avatar').innerHTML = `<div class="ca-bust" style="--a:#4A3560;--b:#241a34;--tile-img:${caTileImgUrl(photoUrl, seedFallback)};"></div>`;
  document.getElementById('ca-chatroom-name').textContent = name;
  await caRenderChatMessages();
  caShowScreen('chatroom');
}

async function caRenderChatMessages() {
  const wrap = document.getElementById('ca-chat-messages');
  wrap.innerHTML = '';
  try {
    const me = await api('/auth/me');
    const { messages } = await api(`/matches/${caCurrentChatMatchId}/messages`);
    wrap.innerHTML = messages.map(m =>
      `<div class="ca-bubble-row ${m.sender_id === me.userId ? 'mine' : 'theirs'}"><div class="ca-bubble">${escapeHtml(m.content)}</div></div>`
    ).join('');
  } catch {
    // ignore — empty thread
  }
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

async function caSendMessage() {
  const input = document.getElementById('ca-chat-input');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  try {
    await api(`/matches/${caCurrentChatMatchId}/messages`, { method: 'POST', body: JSON.stringify({ content: text }) });
    await caRenderChatMessages();
  } catch {
    alert('לא הצלחנו לשלוח את ההודעה.');
  }
}

/* ===========================================================
   Quiz (search by traits)
   =========================================================== */
let caQuizStep = 1;

function caStartQuiz() {
  caQuizStep = 1;
  caUpdateQuizStep();
  caUpdateAgeRange();
  caShowScreen('quiz');
}

function caUpdateQuizStep() {
  [1, 2].forEach(n => {
    document.getElementById('ca-q-step-' + n).classList.toggle('active', n === caQuizStep);
    document.getElementById('ca-qdot-' + n).classList.toggle('active', n === caQuizStep);
  });
  document.getElementById('ca-q-back').style.visibility = caQuizStep === 1 ? 'hidden' : 'visible';
  document.getElementById('ca-q-next').textContent = caQuizStep === 2 ? 'מצא לי התאמות' : 'הבא';
}

function caUpdateAgeRange() {
  const minEl = document.getElementById('ca-age-min');
  const maxEl = document.getElementById('ca-age-max');
  let min = parseInt(minEl.value), max = parseInt(maxEl.value);
  if (min > max - 1) { min = max - 1; minEl.value = min; }
  if (max < min + 1) { max = min + 1; maxEl.value = max; }
  const lo = minEl.min, hi = minEl.max;
  const minPct = ((min - lo) / (hi - lo)) * 100, maxPct = ((max - lo) / (hi - lo)) * 100;
  document.getElementById('ca-age-range-fill').style.left = minPct + '%';
  document.getElementById('ca-age-range-fill').style.width = (maxPct - minPct) + '%';
  document.getElementById('ca-age-range-label').textContent = min + ' – ' + (max >= 65 ? '65+' : max);
}

function caQuizSelected(groupLabelIncludes) {
  const grid = Array.from(document.querySelectorAll('#ca-q-step-1 .ca-trait-grid, #ca-q-step-2 .ca-trait-grid'))
    .find(g => g.previousElementSibling?.textContent.includes(groupLabelIncludes));
  return grid?.querySelector('.ca-trait.selected')?.textContent.trim();
}

function caQuizNext() {
  if (caQuizStep < 2) {
    caQuizStep++;
    caUpdateQuizStep();
    return;
  }
  const answers = {
    ageMin: parseInt(document.getElementById('ca-age-min').value, 10),
    ageMax: parseInt(document.getElementById('ca-age-max').value, 10),
    religionPref: caQuizSelected('בן/בת זוג'),
    smoking: caQuizSelected('עישון'),
    goal: caQuizSelected('מטרת קשר'),
    regionPref: caQuizSelected('אזור מגורים'),
  };
  caRequireAuth(() => caRunTraitsSearch(answers));
}

function caQuizBack() {
  if (caQuizStep > 1) { caQuizStep--; caUpdateQuizStep(); }
}

/* ===========================================================
   Settings hub + subscreens
   =========================================================== */
async function caRenderSettings() {
  try {
    const p = await api('/profile/me');
    document.querySelector('.ca-settings-name').textContent = p.display_name || '';
    document.querySelector('.ca-settings-sub').textContent = p.region || '';
    let avatarBust = document.querySelector('.ca-settings-avatar .ca-bust');
    if (!avatarBust) {
      avatarBust = document.createElement('div');
      avatarBust.className = 'ca-bust';
      document.querySelector('.ca-settings-avatar').appendChild(avatarBust);
    }
    avatarBust.style.setProperty('--tile-img', caTileImgUrl(p.photos?.[0]?.storage_url, p.id));
    avatarBust.style.setProperty('--a', '#5A3A6E');
    avatarBust.style.setProperty('--b', '#241A34');
  } catch {
    // not logged in yet / no profile — leave placeholders
  }
}

function caSetLang(lang) {
  document.getElementById('ca-lang-he').classList.toggle('selected', lang === 'he');
  document.getElementById('ca-lang-en').classList.toggle('selected', lang === 'en');
}

function caCompleteVerify() {
  document.getElementById('ca-verified-badge').style.display = 'inline-flex';
  caShowScreen('settings');
}

let caProfileHidden = false;

async function caToggleVisibility() {
  caProfileHidden = !caProfileHidden;
  try {
    await api('/profile/me/visibility', { method: 'PUT', body: JSON.stringify({ visible: !caProfileHidden }) });
    document.getElementById('ca-visibility-state').textContent = caProfileHidden ? 'מוסתר' : '‹';
    alert(caProfileHidden ? 'הפרופיל שלך מוסתר מחיפושים אחרים.' : 'הפרופיל שלך גלוי בחיפושים.');
  } catch {
    caProfileHidden = !caProfileHidden; // revert optimistic flip
    alert('לא הצלחנו לעדכן. נסה/נסי שוב.');
  }
}

async function caExportMyData() {
  try {
    const data = await api('/profile/me/export');
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'crushai-my-data.json';
    a.click();
    URL.revokeObjectURL(url);
  } catch {
    alert('לא הצלחנו להפיק את הקובץ. נסה/נסי שוב.');
  }
}

async function caConfirmDelete() {
  if (confirm('פעולה זו תמחק לצמיתות את הפרופיל, ההתאמות וההודעות שלך. לא ניתן לשחזר. להמשיך?')) {
    try {
      await api('/auth/me', { method: 'DELETE' });
    } catch { /* ignore */ }
    clearToken();
    caLoggedIn = false;
    caHasProfile = null;
    caShowScreen('auth');
  }
}

function caUpdateSetAgeRange() {
  const minEl = document.getElementById('ca-set-age-min');
  const maxEl = document.getElementById('ca-set-age-max');
  let min = parseInt(minEl.value), max = parseInt(maxEl.value);
  if (min > max - 1) { min = max - 1; minEl.value = min; }
  if (max < min + 1) { max = min + 1; maxEl.value = max; }
  const lo = minEl.min, hi = minEl.max;
  const minPct = ((min - lo) / (hi - lo)) * 100, maxPct = ((max - lo) / (hi - lo)) * 100;
  document.getElementById('ca-set-age-fill').style.left = minPct + '%';
  document.getElementById('ca-set-age-fill').style.width = (maxPct - minPct) + '%';
  document.getElementById('ca-set-age-label').textContent = min + ' – ' + (max >= 65 ? '65+' : max);
}

async function caLoadEditProfile() {
  try {
    const p = await api('/profile/me');
    const scope = document.getElementById('ca-screen-edit-profile');
    const texts = scope.querySelectorAll('input[type=text]');
    texts[0].value = p.display_name || '';
    scope.querySelector('input[type=number]').value = ageFromBirthDate(p.birth_date);
    texts[1].value = p.region || '';
    texts[2].value = p.profession || '';
    scope.querySelector('textarea').value = p.bio || '';
    const heightEl = document.getElementById('ca-edit-height-range');
    heightEl.value = p.height_cm || 175;
    caUpdateEditHeightRange();
  } catch { /* no profile yet */ }
}

function caUpdateEditHeightRange() {
  const el = document.getElementById('ca-edit-height-range');
  const val = parseInt(el.value);
  const pct = ((val - el.min) / (el.max - el.min)) * 100;
  document.getElementById('ca-edit-height-fill').style.width = pct + '%';
  document.getElementById('ca-edit-height-label').textContent = (val / 100).toFixed(2) + " מ'";
}

async function caSaveEditProfile() {
  const scope = document.getElementById('ca-screen-edit-profile');
  const texts = scope.querySelectorAll('input[type=text]');
  const intentSelected = Array.from(scope.querySelectorAll('.ca-trait-grid'))[0]?.querySelector('.ca-trait.selected')?.textContent.trim();
  const smokeSelected = Array.from(scope.querySelectorAll('.ca-trait-grid'))[1]?.querySelector('.ca-trait.selected')?.textContent.trim();
  try {
    const current = await api('/profile/me');
    await api('/profile/me', {
      method: 'PUT',
      body: JSON.stringify({
        displayName: texts[0].value,
        birthDate: current.birth_date,
        gender: current.gender,
        interestedIn: current.interested_in,
        region: texts[1].value || undefined,
        profession: texts[2].value || undefined,
        bio: scope.querySelector('textarea').value || undefined,
        heightCm: parseInt(document.getElementById('ca-edit-height-range').value, 10),
        lookingFor: intentSelected || current.looking_for || undefined,
        smoking: smokeSelected ? undefined : current.smoking || undefined,
        lifestyleTags: current.lifestyle_tags || [],
      }),
    });
    caShowScreen('settings');
  } catch {
    alert('לא הצלחנו לשמור. נסה/נסי שוב.');
  }
}

function caSaveDiscovery() {
  const prefs = {
    ageMin: document.getElementById('ca-set-age-min').value,
    ageMax: document.getElementById('ca-set-age-max').value,
  };
  localStorage.setItem('ca_pref_discovery', JSON.stringify(prefs));
  caShowScreen('settings');
}

async function caSaveShowMe() {
  const scope = document.getElementById('ca-screen-showme');
  const selected = scope.querySelector('.ca-trait.selected')?.textContent.trim();
  const map = { 'גברים': 'men', 'נשים': 'women', 'כולם': 'everyone' };
  try {
    const current = await api('/profile/me');
    await api('/profile/me', {
      method: 'PUT',
      body: JSON.stringify({
        displayName: current.display_name,
        birthDate: current.birth_date,
        gender: current.gender,
        interestedIn: map[selected] || current.interested_in,
        region: current.region || undefined,
        bio: current.bio || undefined,
        profession: current.profession || undefined,
        heightCm: current.height_cm || undefined,
        religion: current.religion || undefined,
        smoking: current.smoking || undefined,
        lifestyleTags: current.lifestyle_tags || [],
      }),
    });
    caShowScreen('settings');
  } catch {
    alert('לא הצלחנו לשמור. נסה/נסי שוב.');
  }
}

async function caSaveOrientation() {
  const scope = document.getElementById('ca-screen-orientation');
  const grids = scope.querySelectorAll('.ca-trait-grid');
  const genderLabel = grids[0]?.querySelector('.ca-trait.selected')?.textContent.trim();
  const orientationTags = Array.from(grids[1]?.querySelectorAll('.ca-trait.selected') || []).map(t => t.textContent.trim());
  const genderMap = { 'גבר': 'male', 'אישה': 'female', 'לא בינארי': 'nonbinary' };
  localStorage.setItem('ca_pref_orientation', JSON.stringify(orientationTags));
  try {
    const current = await api('/profile/me');
    await api('/profile/me', {
      method: 'PUT',
      body: JSON.stringify({
        displayName: current.display_name,
        birthDate: current.birth_date,
        gender: genderMap[genderLabel] || current.gender,
        interestedIn: current.interested_in,
        region: current.region || undefined,
        bio: current.bio || undefined,
        profession: current.profession || undefined,
        heightCm: current.height_cm || undefined,
        religion: current.religion || undefined,
        smoking: current.smoking || undefined,
        lifestyleTags: current.lifestyle_tags || [],
      }),
    });
    caShowScreen('settings');
  } catch {
    alert('לא הצלחנו לשמור. נסה/נסי שוב.');
  }
}

async function caSaveInterests() {
  const scope = document.getElementById('ca-screen-interests');
  const tags = Array.from(scope.querySelectorAll('.ca-trait.selected')).map(t => t.textContent.trim());
  try {
    const current = await api('/profile/me');
    await api('/profile/me', {
      method: 'PUT',
      body: JSON.stringify({
        displayName: current.display_name,
        birthDate: current.birth_date,
        gender: current.gender,
        interestedIn: current.interested_in,
        region: current.region || undefined,
        bio: current.bio || undefined,
        profession: current.profession || undefined,
        heightCm: current.height_cm || undefined,
        religion: current.religion || undefined,
        smoking: current.smoking || undefined,
        lifestyleTags: tags,
      }),
    });
    caShowScreen('settings');
  } catch {
    alert('לא הצלחנו לשמור. נסה/נסי שוב.');
  }
}

/* ===========================================================
   Premium / Boost (Boost stays local-only — no payment
   provider wired up; Premium purchase is real on the backend).
   =========================================================== */
const caPlans = {
  weekly: { cta: 'המשך עם השבועי — ₪19 / שבוע' },
  monthly: { cta: 'המשך עם החודשי — ₪39 / חודש' },
  yearly: { cta: 'המשך עם השנתי — ₪299 / שנה' },
};
let caSelectedPlan = 'monthly';

function caSelectPlan(plan) {
  caSelectedPlan = plan;
  ['weekly', 'monthly', 'yearly'].forEach(p => {
    document.getElementById('ca-plan-' + p).classList.toggle('selected', p === plan);
  });
  document.getElementById('ca-premium-cta').textContent = caPlans[plan].cta;
}

async function caPurchasePremium() {
  try {
    await api('/subscriptions/me/purchase', { method: 'POST', body: JSON.stringify({ plan: caSelectedPlan }) });
    document.getElementById('ca-premium-badge').style.display = 'inline-flex';
    alert('מנוי Premium הופעל — הודעות ללא הגבלה מעתה');
    caShowScreen('settings');
  } catch {
    alert('לא הצלחנו להשלים את הרכישה. נסה/נסי שוב.');
  }
}

function caActivateBoost() {
  document.getElementById('ca-boost-badge').style.display = 'inline-flex';
  alert('הבוסט הופעל למשך 30 דקות');
  caShowScreen('results');
}
