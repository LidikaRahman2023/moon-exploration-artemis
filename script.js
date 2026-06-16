// ═══════════════════════════════════════════
// STARS
// ═══════════════════════════════════════════
const canvas = document.getElementById('stars-canvas');
const ctx = canvas.getContext('2d');
let stars = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
function initStars() {
  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.2 + 0.3,
      speed: Math.random() * 0.015 + 0.005,
      phase: Math.random() * Math.PI * 2,
      color: ['#ffffff','#FFD93D','#4ECDC4','#A855F7'][Math.floor(Math.random()*4)]
    });
  }
}
function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const t = Date.now() / 1000;
  stars.forEach(s => {
    const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.speed * 10 + s.phase));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = s.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    ctx.fill();
  });
  requestAnimationFrame(drawStars);
}
resizeCanvas(); initStars(); drawStars();
window.addEventListener('resize', () => { resizeCanvas(); initStars(); });


// ═══════════════════════════════════════════
// ROCKET BUBBLE — typewriter on home page
// ═══════════════════════════════════════════
const ROCKET_MESSAGES = [
  "Hello! 👋",
  "To start your voyage,\nscroll down! ⬇️"
];

function initRocketBubble() {
  const bubble   = document.getElementById('rocket-bubble');
  const textEl   = document.getElementById('rocket-bubble-text');
  const hint     = document.getElementById('scroll-hint');
  if (!bubble || !textEl) return;

  let msgIndex  = 0;
  let charIndex = 0;
  let typing    = null;
  let phase     = 'typing'; // 'typing' | 'pause' | 'erasing' | 'next'

  // Show bubble with pop-in
  setTimeout(() => bubble.classList.add('visible'), 800);

  function typeChar() {
    const msg = ROCKET_MESSAGES[msgIndex];
    if (charIndex <= msg.length) {
      textEl.innerHTML = msg.slice(0, charIndex).replace(/\n/g, '<br>');
      charIndex++;
      typing = setTimeout(typeChar, charIndex === 1 ? 120 : 55);
    } else {
      phase = 'pause';
      typing = setTimeout(() => {
        if (msgIndex < ROCKET_MESSAGES.length - 1) {
          phase = 'erasing';
          eraseChar();
        } else {
          bubble.classList.add('floating');
          hint.classList.add('visible');
        }
      }, msgIndex === 0 ? 1000 : 3500);
    }
  }

  function eraseChar() {
    const msg = ROCKET_MESSAGES[msgIndex];
    if (charIndex > 0) {
      charIndex--;
      textEl.innerHTML = msg.slice(0, charIndex).replace(/\n/g, '<br>');
      typing = setTimeout(eraseChar, 35);
    } else {
      msgIndex++;
      charIndex = 0;
      phase = 'typing';
      typing = setTimeout(typeChar, 300);
    }
  }

  setTimeout(typeChar, 1200);
}


// ═══════════════════════════════════════════
// AUTH STATE
// ═══════════════════════════════════════════
const accounts = {};
let currentUser = null;
let isGuest     = false;

// Returns true if the user is authenticated (logged in OR guest)
function isAuthenticated() {
  return currentUser !== null || isGuest;
}

function updateNavForUser() {
  const nav = document.getElementById('main-nav');
  if (!nav) return;

  if (currentUser) {
    nav.innerHTML = `
      <div class="user-chip">
        <div class="user-avatar">${currentUser.name.charAt(0).toUpperCase()}</div>
        <span class="user-name">Hi, ${currentUser.name}!</span>
        <button class="logout-btn" id="logout-btn">Log Out</button>
      </div>`;
    document.getElementById('logout-btn').addEventListener('click', logOut);

  } else if (isGuest) {
    nav.innerHTML = `
      <div class="guest-chip">
        <div class="guest-icon">👾</div>
        <span class="guest-label">Guest Explorer</span>
        <button class="join-btn" id="join-btn">Join for free ✨</button>
      </div>`;
    document.getElementById('join-btn').addEventListener('click', () => openModal('signup'));

  } else {
    nav.innerHTML = `
      <button class="nav-btn guest" id="nav-guest-btn">Continue as Guest</button>
      <button class="nav-btn login" id="nav-login-btn">Log In</button>
      <button class="nav-btn signup" id="nav-signup-btn">Create Account ✨</button>`;
    document.getElementById('nav-guest-btn').addEventListener('click', continueAsGuest);
    document.getElementById('nav-login-btn').addEventListener('click', () => openModal('login'));
    document.getElementById('nav-signup-btn').addEventListener('click', () => openModal('signup'));
  }
}

function continueAsGuest() {
  isGuest = true; currentUser = null;
  closeModal();
  closeAuthGate();
  updateNavForUser();
  showToast('Exploring as Guest 👾 — create an account to save progress!');
  // If they clicked "Continue as Guest" from the auth gate, proceed to mission
  if (_pendingNavTarget) {
    const target = _pendingNavTarget;
    _pendingNavTarget = null;
    goToPage(target);
  }
}

function logOut() {
  currentUser = null; isGuest = false;
  updateNavForUser();
  showToast('Logged out. See you among the stars! 🌌');
}

function handleSignup() {
  const name  = document.getElementById('modal-name').value.trim();
  const email = document.getElementById('modal-user').value.trim();
  const pass  = document.getElementById('modal-pass').value;
  hideModalError();
  if (!name || !email || !pass) { showModalError('Please fill in all fields! 🚀'); return; }
  if (accounts[email]) { showModalError('That email is already registered! Try logging in.'); return; }
  accounts[email] = { name, email, pass };
  currentUser = { name, email }; isGuest = false;
  closeModal();
  closeAuthGate();
  updateNavForUser();
  showToast(`Welcome aboard, ${name}! 🚀`);
  // Proceed to pending navigation if any
  if (_pendingNavTarget) {
    const target = _pendingNavTarget;
    _pendingNavTarget = null;
    goToPage(target);
  }
}

function handleLogin() {
  const email = document.getElementById('modal-user').value.trim();
  const pass  = document.getElementById('modal-pass').value;
  hideModalError();
  if (!email || !pass) { showModalError('Please fill in all fields! 🚀'); return; }
  const acc = accounts[email];
  if (!acc) { showModalError("Hmm, we don't recognise that email."); return; }
  if (acc.pass !== pass) { showModalError('Wrong password! Try again. 🔐'); return; }
  currentUser = { name: acc.name, email }; isGuest = false;
  closeModal();
  closeAuthGate();
  updateNavForUser();
  showToast(`Welcome back, ${acc.name}! 👋`);
  // Proceed to pending navigation if any
  if (_pendingNavTarget) {
    const target = _pendingNavTarget;
    _pendingNavTarget = null;
    goToPage(target);
  }
}

function showModalError(msg) {
  const err = document.getElementById('modal-error');
  if (!err) return;
  err.textContent = msg; err.style.display = 'block';
}
function hideModalError() {
  const err = document.getElementById('modal-error');
  if (err) err.style.display = 'none';
}

function showToast(msg) {
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('toast-show'), 10);
  setTimeout(() => { t.classList.remove('toast-show'); setTimeout(() => t.remove(), 400); }, 3000);
}


// ═══════════════════════════════════════════
// AUTH GATE
// ═══════════════════════════════════════════
let _pendingNavTarget = null; // stores where the user was trying to go

function openAuthGate(targetPageId) {
  _pendingNavTarget = targetPageId || null;
  const gate = document.getElementById('auth-gate');
  if (gate) gate.classList.add('open');
}

function closeAuthGate() {
  const gate = document.getElementById('auth-gate');
  if (gate) gate.classList.remove('open');
}

// Close auth gate if clicking the backdrop
document.addEventListener('DOMContentLoaded', () => {
  const gate = document.getElementById('auth-gate');
  if (gate) {
    gate.addEventListener('click', (e) => {
      if (e.target === gate) closeAuthGate();
    });
  }
});


// ═══════════════════════════════════════════
// LET'S GO — guarded by auth check
// ═══════════════════════════════════════════
function handleLetsGo() {
  if (isAuthenticated()) {
    goToPage('page-astro');
  } else {
    openAuthGate('page-astro');
  }
}


// ═══════════════════════════════════════════
// PAGE NAVIGATION
// ═══════════════════════════════════════════
function goToPage(targetId) {
  // Guard: any navigation beyond home requires auth
  if (targetId !== 'page-home' && !isAuthenticated()) {
    openAuthGate(targetId);
    return;
  }

  const current = document.querySelector('.page.active');
  const target  = document.getElementById(targetId);
  if (!target || current === target) return;
  stopSpeech();
  current.classList.add('exit-up');
  current.classList.remove('active');
  setTimeout(() => current.classList.remove('exit-up'), 600);
  setTimeout(() => {
    target.classList.add('active');
    if (targetId === 'page-astro') startSlides();
  }, 80);
}


// ═══════════════════════════════════════════
// SPEECH SLIDES
// ═══════════════════════════════════════════
function getGreetingName() {
  return currentUser ? currentUser.name : null;
}

function buildSlides() {
  const name = getGreetingName();
  const greeting = name
    ? `Hello, ${name}!`
    : isGuest ? 'Hello, curious explorer!' : 'Hello, young explorer!';
  const greetingHTML = name
    ? `👋 <b>Hello, ${name}!</b>`
    : isGuest ? `👋 <b>Hello, curious explorer!</b>` : `👋 <b>Hello, young explorer!</b>`;

  const slidesText = [
    `${greeting} I'm Commander Lidika, and I've traveled all the way from the Moon just to meet you! Welcome to Stardance — your mission to the Moon starts right here!`,
    `Here's the thing — space science is hard, and most kids never get to truly feel what it's like to BE an astronaut. Math, physics, engineering... they seem scary when they're just numbers on a page. Kids deserve better than textbooks!`,
    `That's why Stardance turns the entire Moon mission into YOUR adventure! You'll engineer the rocket, train like a real astronaut, do actual calculations to launch and land, and even explore the lunar surface — all inside an interactive game built just for you!`,
    `And the best part? Stardance watches how YOU perform — tracking your strengths, spotting where you need help, and giving you a personal astronaut score after every mission. By the time you're done, you'll think like a real space engineer!`
  ];

  const slidesHTML = [
    `${greetingHTML} I'm Commander Lidika, and I've traveled all the way from the Moon just to meet you! Welcome to <span class="highlight">Stardance</span> — your mission to the Moon starts right here! 🌙`,
    `🌍 Here's the problem — space science feels <span class="highlight">scary and far away</span> for most kids. Math, physics, engineering... they're just numbers on a page. Kids like YOU deserve to actually <b>feel</b> what it's like to be an astronaut — not just read about it. 😔`,
    `🚀 That's why <span class="highlight">Stardance</span> turns the Moon mission into YOUR adventure! Engineer the rocket, train like an astronaut, do real calculations to launch and land, and explore the lunar surface — all inside an <b>interactive game built just for you!</b> 🌕`,
    `🏆 And Stardance <span class="highlight">watches how YOU perform</span> — tracking your strengths, spotting where you need help, and giving you a <b>personal astronaut score</b> after every mission. By the end, you'll think like a real space engineer! 💫`
  ];

  return { slidesText, slidesHTML };
}

let currentSlide  = 0;
let isSpeaking    = false;
let speechEnabled = true;
let currentUtter  = null;

function startSlides() { currentSlide = 0; renderSlide(0); }

function renderSlide(idx) {
  const { slidesHTML } = buildSlides();
  const el = document.getElementById('typed-text');

  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById('dot' + i);
    if (dot) dot.classList.toggle('active', i === idx);
  }
  const prevBtn = document.getElementById('prev-btn');
  if (prevBtn) prevBtn.style.display = idx > 0 ? 'block' : 'none';
  const nextBtn = document.getElementById('next-btn');
  if (nextBtn) nextBtn.textContent = idx === slidesHTML.length - 1 ? "Let's Mission! 🌙" : "Continue →";

  if (el) {
    el.style.opacity = '0';
    setTimeout(() => {
      el.innerHTML = slidesHTML[idx];
      el.style.transition = 'opacity 0.4s';
      el.style.opacity = '1';
    }, 120);
  }

  stopSpeech();
  if (speechEnabled) setTimeout(() => speakSlide(idx), 350);
}

function speakSlide(idx) {
  if (!window.speechSynthesis) return;
  const { slidesText } = buildSlides();
  const utter = new SpeechSynthesisUtterance(slidesText[idx]);
  currentUtter = utter;

  function pickVoice() {
    const v = window.speechSynthesis.getVoices();
    return (
      v.find(v => /samantha|victoria|karen|zira|google us english/i.test(v.name)) ||
      v.find(v => /female|woman/i.test(v.name) && /en/i.test(v.lang)) ||
      v.find(v => /en/i.test(v.lang)) || v[0] || null
    );
  }
  const voice = pickVoice();
  if (voice) utter.voice = voice;
  utter.lang = 'en-US'; utter.rate = 0.92; utter.pitch = 1.1; utter.volume = 1;

  utter.onstart = () => { isSpeaking = true;  setAstroTalking(true);  updateVoiceBtn(); };
  utter.onend   = () => { isSpeaking = false; setAstroTalking(false); updateVoiceBtn(); };
  utter.onerror = (e) => {
    if (e.error === 'interrupted' || e.error === 'canceled') return;
    isSpeaking = false; setAstroTalking(false); updateVoiceBtn();
  };
  window.speechSynthesis.speak(utter);
}

function stopSpeech() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  isSpeaking = false; setAstroTalking(false); updateVoiceBtn();
}
function toggleSpeech() {
  if (isSpeaking) { stopSpeech(); speechEnabled = false; }
  else { speechEnabled = true; speakSlide(currentSlide); }
  updateVoiceBtn();
}
function replayVoice() {
  stopSpeech(); speechEnabled = true;
  setTimeout(() => speakSlide(currentSlide), 150);
}
function updateVoiceBtn() {
  const btn = document.getElementById('voice-toggle-btn');
  if (!btn) return;
  btn.textContent = isSpeaking ? '🔇 Mute' : '🔊 Listen';
  btn.classList.toggle('speaking', isSpeaking);
  const wave = document.getElementById('sound-wave');
  if (wave) wave.classList.toggle('active', isSpeaking);
}
function setAstroTalking(on) {
  const astro = document.querySelector('.astronaut-svg');
  if (astro) astro.classList.toggle('talking', on);
}
if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = () => {};

function nextSlide() {
  const { slidesHTML } = buildSlides();
  if (currentSlide < slidesHTML.length - 1) { currentSlide++; renderSlide(currentSlide); }
  else { stopSpeech(); goToPage('page-mission'); }
}
function prevSlide() {
  if (currentSlide > 0) { currentSlide--; renderSlide(currentSlide); }
}


// ═══════════════════════════════════════════
// AUTH MODAL
// ═══════════════════════════════════════════
let modalMode = 'login';

function openModal(mode) {
  modalMode = mode; hideModalError();
  ['modal-name','modal-user','modal-pass'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('modal').classList.add('open');
  const submitBtn = document.getElementById('modal-submit-btn');

  if (mode === 'signup') {
    document.getElementById('modal-title').textContent = '✨ Create Account';
    document.getElementById('modal-name-wrap').style.display = 'block';
    document.getElementById('modal-switch').innerHTML = 'Already have an account? <a onclick="switchModal(\'login\')">Log In</a>';
    submitBtn.textContent = 'Join the Mission! 🚀';
    submitBtn.onclick = handleSignup;
  } else {
    document.getElementById('modal-title').textContent = '👾 Log In';
    document.getElementById('modal-name-wrap').style.display = 'none';
    document.getElementById('modal-switch').innerHTML = "Don't have an account? <a onclick=\"switchModal('signup')\">Sign Up</a>";
    submitBtn.textContent = "Let's Go! 🚀";
    submitBtn.onclick = handleLogin;
  }
  setTimeout(() => {
    const focus = document.getElementById(mode === 'signup' ? 'modal-name' : 'modal-user');
    if (focus) focus.focus();
  }, 100);
}

function closeModal() { document.getElementById('modal').classList.remove('open'); hideModalError(); }
function closeModalOutside(e) { if (e.target === document.getElementById('modal')) closeModal(); }
function switchModal(mode) { openModal(mode); }

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeModal(); closeAuthGate(); }
  if (e.key === 'Enter' && document.getElementById('modal').classList.contains('open')) {
    if (modalMode === 'signup') handleSignup(); else handleLogin();
  }
});


// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
updateNavForUser();
initRocketBubble();
