const canvas = document.getElementById('star-canvas');
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
        })
    }
}

function drawStars() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = Date.now() / 1000;
    stars.forEach(s => {
        const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t * s.speed * 10 +s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fill();
    });
    requestAnimationFrame(drawStars);
}

resizeCanvas();
initStars();
drawStars();
window.addEventListener('resize', () => { resizeCanvas(); initStars(); });

const accounts = {};
let currentUser = null;

function updateNavForUser() {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    if (currentUser) {
        nav.innerHTML = `
        <div class="user-chip">
        <div class="user-avatar">${currentUser.name.charAt(0).toUpperCase()}</div>
        <span class="user-name">Hi, ${currentUser.name}! </span>
        <button class="logout-btn" id="logout-btn">Log Out </button>
        </div>
        `;
        document.getElementById('logout-btn').addEventListener('click', logOut);
    } else {
        nav.innerHTML = `
        <button class="nav-btn login" id="nav-login-btn">Log In</button>
        <button class="nav-btn signup" id="nav-signup-btn">Create Account ✨</button>`;
        document.getElementById('nav-login-btn').addEventListener('click', () => openModal('login'));
        document.getElementById('nav-signup-btn').addEventListener('click', () => openModal('signup')); 
    }
}

function logOut() {
    currentUser = null;
    updateNavForUser();
    showToast('Logged out. See you among the stars! 🌌');
}

function handleSignup() {
    const name = document.getElementById('modal-name').value.trim();
    const email = document.getElementById('modal-user').value.trim();
    const pass = document.getElementById('modal-pass').value;

    hideModalError();

    if(!name || !email || !pass){
        showModalError('Please fill in all fields! 🚀');
        return;
    }
    if (accounts[email]){
        showModalError('That email is already registered! Try logging in');
        return;
    }

    accounts[email] = { name, email, pass };
    currentUser = { name, email };

    closeModal();
    updateNavForUser();
    showToast(`Welcome aboard, ${name}! 🚀`);
}

function handleLogin() {
    const email = document.getElementById('modal-user').value.trim();
    const pass = document.getElementById('modal-pass').value;

    hideModalError();

    if (!email || !pass) {
        showModalError('Please fill in all fields! 🚀');
        return;
    }
    const acc = accounts[email];
    if (!acc) {
        showModalError("Hmm, we don't recognise that email.");
        return;
    }
    if (acc.pass !== pass) {
        showModalError('Wrong password! Try again. 🔐');
        return;
    }

    currentUser = { name: acc.name, email };
    closeModal();
    updateNavForUser();
    showToast(`Welcome back, ${acc.name}! 👋`)
}

function showModalError(msg) {
    const err = document.getElementById('modal-errpr');
    if (!err) return;
    err.textContent = msg;
    err.style.display = 'block';
}

function hideModalError() {
    const err = document.getElementById('modal-error');
    if(err) err.style.display = 'none'
}

function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('toast-show'), 10);
    setTimeOut(() => {
        t.classList.remove('toast-show');
        setTimeout(() => t.remove(), 400);
    }, 3000);
}

function goToPage(targetId) {
    const current = document.querySelector('page.active');
    const target = document.getElementById(targetId);
    if(!target || current  === target) return;

    stopSpeech();

    current.classList.add('exit-up');
    current.classList.remove('active');
    setTimeout(() => current.classList.remove('exit-up'), 600);

    setTimeout(() => {
        target.classList.add('active');
        if (targetId === 'page-astro') startSlides ();
    }, 80);
}

const slidesText = [
    "Hello, young explorer! I'm Commander Luna, and I've traveled all the way from the Moon just to talk to you! Are you ready to blast off on an adventure?",
  "NASA's Artemis Program is humanity's big return to the Moon! Artemis means we're going back — but this time, we're taking the first woman and first person of color to walk on the lunar surface. How cool is that?",
  "To get there, NASA built the most powerful rocket ever — the Space Launch System, or SLS! It stands taller than the Statue of Liberty and produces 8.8 million pounds of thrust. That's like 160,000 car engines going at once!",
  "But we're not just stopping at the Moon! Artemis is a stepping stone to Mars. Everything we learn — living in space, building habitats, growing food — prepares us for the next giant leap. And YOU could be part of it someday!"
];

const slidesHTML = [
    `👋 <b>Hello, young explorer!</b> I'm Commander Luna, and I've traveled all the way from the Moon just to talk to you! Are you ready to <span class="highlight">blast off on an adventure?</span> 🌟`,
  `🌙 <b>NASA's Artemis Program</b> is humanity's big return to the Moon! Artemis means we're going back — but this time, we're taking the <span class="highlight">first woman and first person of color</span> to walk on the lunar surface. How cool is that?`,
  `🚀 To get there, NASA built the most powerful rocket ever — the <span class="highlight">Space Launch System (SLS)</span>! It stands taller than the Statue of Liberty and produces 8.8 million pounds of thrust. That's like 160,000 car engines going at once! 🤯`,
  `🌌 But we're not just stopping at the Moon! Artemis is a <span class="highlight">stepping stone to Mars</span>. Everything we learn — living in space, building habitats, growing food — prepares us for the next giant leap. And YOU could be part of it someday! 💫
    `
];

let currentSlide = 0;
let isSpeaking = false;
let speechEnabled = true;
let currentUtter = null;

function startSlides() {
    currentSlide = 0;
    renderSlide(0);
}

function renderSlide(idx) {
    const el = document.getElementById('typed-text');

    for (let i = 0; i < 4; i++) {
        const dot = document.getElementById('dot' + i);
        if (dot) dot.classList.toggle('active',i == idx);
    }

    const prevBtn = document.getElementById('prev-btn');
    if(prevBtn) prevBtn.style.display = idx > 0 ? 'block' : 'none' ;

    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) nextBtn.textContent =
    idx == slidesHTML.length - 1 ? "Let's Mission! 🌙" : "Continue →";

    if (el) {
        el.style.opacity = '0';
        setTimeout(() => {
            el.innerHTML = slidesHTML[idx];
            el.style.transition = 'opacity 0.4s';
            el.style.opacity = '1'
        }, 120);
    }

    stopSpeech();
    if (speechEnabled) {
        setTimeout(() => speakSlide(idx), 350);
    }
}

function speakSlide(idx) {
    if(!window.speechSynthesis) {
        console.warn('Web Speech API not supported in this browser.');
        return;
    }

    const text = slidesText[idx];
    const utter = new SpeechSynthesisUtterance(text);
    currentUtter = utter;
}

function speakSlide(idx) {
  if (!window.speechSynthesis) {
    console.warn('Web Speech API not supported in this browser.');
    return;
  }
 
  const text  = slidesText[idx];
  const utter = new SpeechSynthesisUtterance(text);
  currentUtter = utter;
 
  // Choose the best available voice
  function pickVoice() {
    const voices = window.speechSynthesis.getVoices();
    // Prefer a clear English female voice
    return (
      voices.find(v => /samantha|victoria|karen|zira|google us english/i.test(v.name)) ||
      voices.find(v => /female|woman/i.test(v.name) && /en/i.test(v.lang)) ||
      voices.find(v => /en/i.test(v.lang)) ||
      voices[0] ||
      null
    );
  }
 
  const voice = pickVoice();
  if (voice) utter.voice = voice;
 
  utter.lang   = 'en-US';
  utter.rate   = 0.92;
  utter.pitch  = 1.1;
  utter.volume = 1;
 
  utter.onstart = () => {
    isSpeaking = true;
    setAstroTalking(true);
    updateVoiceBtn();
  };
 
  utter.onend = () => {
    isSpeaking = false;
    setAstroTalking(false);
    updateVoiceBtn();
  };
 
  utter.onerror = (e) => {
    // 'interrupted' fires when we deliberately cancel — suppress it
    if (e.error === 'interrupted' || e.error === 'canceled') return;
    console.warn('SpeechSynthesisUtterance error:', e.error);
    isSpeaking = false;
    setAstroTalking(false);
    updateVoiceBtn();
  };
 
  window.speechSynthesis.speak(utter);
}

function stopSpeech() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    isSpeaking = false;
    setAstroTalking(false);
    updateVoiceBtn();
}

function toggleSpeech() {
    if (isSpeaking) {
        stopSpeech();
        speechEnabled = false;
    } else {
        speechEnabled = true;
        speakSlide(currentSlide);
    }
    updateVoiceBtn();
}

function replayVoice() {
    stopSpeech();
    speechEnabled = true;
    setTimeout(() => speakSlide(currentSlide), 150);
}

function updateVoiceBtn() {
    const btn = document.getElementById('voice-toggle-btn');
    if(!btn) return;
    if(isSpeaking) {
        btn.textContent = '🔇 Mute';
        btn.classList.add('speaking');
    } else {
        btn.textContent = '🔊 Listen';
        btn.classList.remove('speaking');
    }
    const wave = document.getElementById('sound-wave');
    if (wave) wave.classList.toggle('active',isSpeaking);
}

function setAstroTalking(on) {
    const astro = document.querySelector('.astronaut-svg');
    if (astro) astro.classList.toggle('talking',on);
}
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {

    };
}

function nextSlide() {
    if (currentSlide < slidesHTML.length - 1) {
        currentSlide++;
        renderSlide(currentSlide);
    } else {
        stopSpeech();
        goToPage('page-mission');
    }
}

function prevSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        renderSlide(currentSlide);
    }
}

let modalMode = 'login';

function openModal(mode) {
    modalMode = mode;
    hideModalError();

    ['modal-name', 'modal-user', 'modal-pass'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
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
        document.getElementById('modal-title').textContent = "👾 Log In";
        document.getElementById('modal-name-wrap').style.display = 'none';
        document.getElementById('modal-switch').innerHTML = 'Don\'t have an account? <a onclick="switchModal(\'signup\')">Sign Up</a>';
        submitBtn.textContent = "Let's Go! 🚀"
        submitBtn.onclick = handleLogin;
    }

    setTimeout(() => {
        const focus = document.getElementById(mode === 'signup' ? 'modal-name' : 'modal-user');
        if (focus) focus.focus();
    }, 100);
}

function closeModal() {
    document.getElementById('modal').classList.remove('open');
    hideModalError();
}


 