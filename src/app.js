import { drawCover } from './art.js';

// ============================================================================
//  ARCADE — shelf + player
//  Games are listed in games.json and launched into a same-origin iframe, so
//  they run full-bleed without leaving the page (and keep pointer + keyboard).
// ============================================================================

const $ = (id) => document.getElementById(id);
const shelf = $('shelf');

/* ------------------------------------------------------------ the shelf */
async function load() {
  let data;
  try {
    const res = await fetch('./games.json', { cache: 'no-cache' });
    data = await res.json();
  } catch (e) {
    shelf.innerHTML = `<p style="color:#ff8fae;font-size:13px">Couldn't load games.json — ${e.message}</p>`;
    return;
  }

  const games = (data.games || []).filter(g => g && g.url);
  $('count').textContent = games.length;

  for (const g of games) shelf.appendChild(card(g));
  shelf.appendChild(soonSlot());

  // covers need layout to have happened so clientWidth is real
  requestAnimationFrame(() => {
    shelf.querySelectorAll('canvas[data-game]').forEach(c => {
      const g = games.find(x => x.id === c.dataset.game);
      if (g) drawCover(c, g);
    });
  });
}

function card(g) {
  const el = document.createElement('button');
  el.className = 'card';
  el.type = 'button';
  el.style.setProperty('--glow', (g.accent && g.accent[0]) || '#6bffc4');
  el.setAttribute('aria-label', `Play ${g.title}`);

  const chips = (g.tech || []).map(t => `<span class="chip">${esc(t)}</span>`).join('');

  el.innerHTML = `
    <canvas data-game="${esc(g.id)}" aria-hidden="true"></canvas>
    <div class="body">
      <h2>${esc(g.title)}</h2>
      <div class="tag">${esc(g.tagline || '')}</div>
      <p class="desc">${esc(g.description || '')}</p>
      <div class="chips">${chips}</div>
      <div class="cardfoot">
        <span class="play"><span class="dot"></span>Play</span>
        ${g.repo ? `<span class="src" data-repo="${esc(g.repo)}" role="link" tabindex="0">Source</span>` : ''}
      </div>
    </div>`;

  el.addEventListener('click', (e) => {
    const src = e.target.closest('.src');
    if (src) { e.stopPropagation(); window.open(src.dataset.repo, '_blank', 'noopener'); return; }
    launch(g);
  });
  return el;
}

function soonSlot() {
  const el = document.createElement('div');
  el.className = 'card soon';
  el.innerHTML = `
    <div class="soonbox">Cabinet free</div>
    <div class="body">
      <h2>Next one</h2>
      <div class="tag">Yet to be built</div>
      <p class="desc">Drop another entry into <code>games.json</code> and it shows up here — cover art and all.</p>
    </div>`;
  return el;
}

const esc = (s) => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------------------------------------------------------- the player */
const player = $('player'), frame = $('frame'), bar = $('bar');
let playing = false;

function launch(g) {
  if (playing) return;
  frame.src = g.url;
  $('nowTitle').textContent = g.title;
  player.classList.add('on');
  player.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Flush layout so the opacity transition has a start value to animate from.
  // Deferring this to requestAnimationFrame works right up until the tab is
  // backgrounded mid-launch, at which point rAF is throttled, the transition
  // stalls part-way, and the overlay is left translucent over the shelf.
  void player.offsetWidth;
  player.classList.add('vis');
  playing = true;

  // Show the chrome briefly, then let it hide so it doesn't sit over the game.
  bar.classList.add('show');
  setTimeout(() => bar.classList.remove('show'), 2600);

  // Keyboard has to reach the game, not the shelf behind it.
  frame.addEventListener('load', () => { try { frame.contentWindow.focus(); } catch {} }, { once: true });
}

function exit() {
  if (!playing) return;
  playing = false;
  player.classList.remove('vis');
  document.body.style.overflow = '';
  if (document.fullscreenElement) document.exitFullscreen?.();
  setTimeout(() => {
    player.classList.remove('on');
    player.setAttribute('aria-hidden', 'true');
    frame.src = 'about:blank';        // stop audio and the render loop
  }, 420);
}

$('exitBtn').addEventListener('click', exit);
$('fsBtn').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else player.requestFullscreen?.();
});

// Esc inside a focused iframe never reaches us, so also offer the button.
addEventListener('keydown', (e) => { if (e.key === 'Escape' && playing) exit(); });

// Nudging the pointer to the top reveals the chrome again.
player.addEventListener('mousemove', (e) => {
  if (e.clientY < 90) bar.classList.add('show');
  else bar.classList.remove('show');
});

/* ------------------------------------------------------- background art
   A 160x90 buffer scaled up by CSS. Upscaling gives smoother falloff than a
   blur filter and costs almost nothing, so it can animate forever.        */
(function background() {
  const c = $('bg'), ctx = c.getContext('2d');
  const W = 160, H = 90;
  c.width = W; c.height = H;

  const bands = Array.from({ length: 5 }, (_, i) => ({
    y: 0.18 + i * 0.13,
    amp: 0.05 + Math.random() * 0.07,
    freq: 0.8 + Math.random() * 1.8,
    phase: Math.random() * 6.28,
    speed: 0.05 + Math.random() * 0.10,
    col: ['#6bffc4', '#7ad4ff', '#c58bff', '#4fd8ff', '#9d7bff'][i % 5],
  }));

  let raf = 0;
  function frameLoop(t) {
    raf = requestAnimationFrame(frameLoop);
    if (document.hidden) return;
    const time = t * 0.001;

    ctx.fillStyle = '#04060d';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    for (const b of bands) {
      for (let x = 0; x <= W; x += 2) {
        const u = x / W;
        const y = (b.y + Math.sin(u * b.freq * 6.28 + b.phase + time * b.speed) * b.amp) * H;
        const g = ctx.createLinearGradient(0, y - H * 0.16, 0, y + H * 0.05);
        g.addColorStop(0, b.col + '00');
        g.addColorStop(0.7, b.col + '18');
        g.addColorStop(1, b.col + '3a');
        ctx.fillStyle = g;
        ctx.fillRect(x, y - H * 0.16, 3, H * 0.21);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  raf = requestAnimationFrame(frameLoop);
})();

load();
