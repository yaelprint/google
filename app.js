/* ============================================================
   Tsuki no Tensha · app.js
   Material Design 3 + APIs reales
   ============================================================ */
(() => {
'use strict';

/* ---------- Utilidades ---------- */
const $  = (s, e = document) => e.querySelector(s);
const $$ = (s, e = document) => Array.from(e.querySelectorAll(s));
const pick = a => a[Math.random() * a.length | 0];
const rnd  = (a, b) => a + Math.random() * (b - a) | 0;
const hash = s => [...String(s).toLowerCase()].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 101, 7);

/* ---------- Estado persistente ---------- */
let S = {};
try { S = JSON.parse(localStorage.getItem('tsuki.v2') || '{}'); } catch (e) {}
S.uses   = S.uses   || {};
S.hist   = S.hist   || [];
S.favs   = S.favs   || [];
S.bingo  = S.bingo  || null;
S.streak = S.streak || { last: '', count: 0 };

const save = () => {
  try { localStorage.setItem('tsuki.v2', JSON.stringify(S)); } catch (e) {}
};

const today = () => new Date().toISOString().slice(0, 10);
const yesterday = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10);

function updateStreak() {
  const t = today();
  if (S.streak.last === t) return;
  S.streak.count = (S.streak.last === yesterday()) ? S.streak.count + 1 : 1;
  S.streak.last = t;
  save();
}

const bump = (id, entry) => {
  S.uses[id] = (S.uses[id] || 0) + 1;
  if (entry) { S.hist.unshift(entry); S.hist = S.hist.slice(0, 12); }
  save();
};

/* ---------- Toast ---------- */
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('on'), 2000);
}

/* ---------- Acciones ---------- */
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Copiado al portapapeles'); }
  catch { toast('No se pudo copiar'); }
}
function wa(text) {
  window.open('https://wa.me/?text=' + encodeURIComponent(text + '\n— Tsuki no Tensha'), '_blank');
}
function dl(canvas, name, type) {
  canvas.toBlob(b => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = name;
    a.click();
    toast('Descargado');
  }, type || 'image/png');
}

function toggleFav(id) {
  const i = S.favs.indexOf(id);
  if (i >= 0) { S.favs.splice(i, 1); toast('Quitado de favoritos'); }
  else { S.favs.push(id); toast('Añadido a favoritos'); }
  save();
}

/* ---------- Tema ---------- */
function initTheme() {
  const saved = localStorage.getItem('tsuki.theme');
  const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.dataset.theme = theme;
  updateThemeIcon();
}
function updateThemeIcon() {
  const isDark = document.documentElement.dataset.theme === 'dark';
  $('#th-icon').textContent = isDark ? 'light_mode' : 'dark_mode';
  $('#th').setAttribute('aria-label', isDark ? 'Modo claro' : 'Modo oscuro');
}

/* ============================================================
   FACTORY: herramientas de texto
   ============================================================ */
function textTool(cfg) {
  return {
    id: cfg.id,
    icon: cfg.icon,
    name: cfg.name,
    desc: cfg.desc,
    render(el) {
      const inputs = cfg.inputs.map((i, k) => i.options
        ? `<div class="field"><label>${i.label}</label>
             <select data-k="${k}">${i.options.map(o => `<option>${o}</option>`).join('')}</select>
           </div>`
        : `<div class="field"><label>${i.label}</label>
             <input data-k="${k}" placeholder="${i.placeholder || ''}">
           </div>`
      ).join('');

      el.innerHTML = `
        <div class="card">
          <div class="row">${inputs}</div>
          <div class="out" id="o">Pulsa generar…</div>
          <div class="btn-row">
            <button class="btn filled" id="go">
              <span class="material-symbols-outlined">casino</span>Generar
            </button>
            <button class="btn tonal" id="cp">
              <span class="material-symbols-outlined">content_copy</span>Copiar
            </button>
            <button class="btn text" id="sh">
              <span class="material-symbols-outlined">share</span>WhatsApp
            </button>
            <button class="btn text" id="fav">
              <span class="material-symbols-outlined">star</span>Favorito
            </button>
          </div>
        </div>`;

      const run = () => {
        const values = $$('[data-k]', el).map(x => x.value.trim());
        const t = cfg.fn(...values);
        $('#o', el).textContent = t;
        bump(cfg.id, cfg.name + ': ' + t.slice(0, 55));
      };
      $('#go', el).onclick = run;
      $('#cp', el).onclick = () => copy($('#o', el).textContent);
      $('#sh', el).onclick = () => wa($('#o', el).textContent);
      $('#fav', el).onclick = () => toggleFav(cfg.id);
      run();
    }
  };
}

/* ============================================================
   CONTENIDO: frases, noticias, etc.
   ============================================================ */
const frases = textTool({
  id: 'frases',
  icon: 'format_quote',
  name: 'Frases motivacionales',
  desc: 'Frases épicas, con sabor a manhwa, para levantar al grupo.',
  inputs: [{ label: 'Tema (opcional)', placeholder: 'estudio, amor, lunes…' }],
  fn: (t) => {
    const a = ['Como todo protagonista', 'Aunque el capítulo salga tarde', 'Si el MC pudo con el sistema', 'Después de tu peor arco', 'Incluso sin poderes ocultos', 'Cuando nadie te traduce el esfuerzo'];
    const b = ['tú también puedes subir de rango', 'tu verdadero poder despierta poco a poco', 'el entrenamiento nunca traiciona', 'cada derrota es un flashback que te hace fuerte', 'la luna siempre vuelve a salir'];
    const c = ['Y recuerda: el plot twist eres tú.', 'Respira, nivel nuevo desbloqueado.', 'Hoy toca farmear constancia.', 'Esto no es relleno, es tu desarrollo.', 'Tsuki no Tensha cree en ti.'];
    return `"${pick(a)}, ${pick(b)}${t ? ' en ' + t : ''}. ${pick(c)}"`;
  }
});

const noticias = textTool({
  id: 'noticias',
  icon: 'newspaper',
  name: 'Noticias de manhwa',
  desc: 'Noticias falsas (y dramáticas) del mundo manhwa.',
  inputs: [{ label: 'Protagonista', placeholder: 'El MC' }],
  fn: (n) => {
    n = n || 'El protagonista';
    return pick([
      `${n} despierta como el cazador más débil… y el sistema le debe una disculpa`,
      `Se filtra: el capítulo 200 de ${n} traerá flashback, traición y 3 páginas de humo`,
      `Fans furiosos: ${n} regresa del pasado, pero con la espalda destrozada`,
      `Autor confirma que ${n} NO morirá… esta semana`,
      `Tras reencarnar 3 veces, ${n} exige vacaciones y un contrato claro`,
      `Última hora: el villano de ${n} era el mentor desde el capítulo 2`,
      `${n} sube a rango SSS; la comunidad pide fuentes y palomitas`
    ]) + `\n— Tsuki News, hace ${rnd(2, 59)} min`;
  }
});

const amarillismo = textTool({
  id: 'amarillismo',
  icon: 'campaign',
  name: 'Amarillismo',
  desc: 'Titulares exagerados para cualquier cosa.',
  inputs: [{ label: 'Tema', placeholder: 'mi gato, el grupo, el lunes…' }],
  fn: (t) => {
    t = t || 'el grupo';
    return pick([
      `¡URGENTE! ${t}: lo que pasó después te dejará sin palabras`,
      `No lo vas a creer: ${t} y el secreto que NADIE quiere que sepas`,
      `Expertos en shock por lo que hizo ${t} a las 3 AM`,
      `¡ESCÁNDALO! ${t} fue captado en un momento nunca visto`,
      `Médicos lo odian: ${t} y este truco de 1 minuto`,
      `Se filtra video de ${t}… y es peor de lo que imaginas`
    ]);
  }
});

const insultos = textTool({
  id: 'insultos',
  icon: 'sentiment_dissatisfied',
  name: 'Insultos cariñosos',
  desc: 'Picones sin mala leche, versión otaku. Solo para amigos.',
  inputs: [{ label: 'Nombre', placeholder: 'tu amigo/a' }],
  fn: (n) => {
    n = n || 'Tú';
    return pick([
      `${n}, tienes menos carisma que un NPC sin diálogo.`,
      `${n}, eres el relleno de mi vida, pero te quiero.`,
      `${n}, tu tiempo de respuesta es peor que el de un capítulo en hiato.`,
      `${n}, hasta el villano de relleno tiene más trama que tú.`,
      `${n}, eres un protagonista de isekai… sin el isekai ni los poderes.`,
      `${n}, tu estilo es el de un personaje secundario que muere en el cap 3.`
    ]) + ' (con cariño, eh)';
  }
});

const ship = textTool({
  id: 'ship',
  icon: 'favorite',
  name: 'Ship-o-meter',
  desc: '¿Qué tan compatibles son dos personas o personajes?',
  inputs: [{ label: 'Persona 1' }, { label: 'Persona 2' }],
  fn: (a, b) => {
    a = a || 'Tú';
    b = b || 'Tu crush';
    const p = (hash(a) + hash(b)) % 101;
    const verdict =
      p > 80 ? 'Boda en el próximo arco' :
      p > 50 ? 'Hay química, falta desarrollo' :
      p > 25 ? 'Friendzone con final abierto' :
      'Rivales de por vida';
    return `${a} + ${b}\nCompatibilidad: ${p}%\n${verdict}`;
  }
});

const horo = textTool({
  id: 'horoscopo',
  icon: 'stars',
  name: 'Horóscopo otaku',
  desc: 'Tu destino según la luna de Tsuki.',
  inputs: [{ label: 'Signo', options: ['Aries','Tauro','Géminis','Cáncer','Leo','Virgo','Libra','Escorpio','Sagitario','Capricornio','Acuario','Piscis'] }],
  fn: (s) => {
    return `${s}: ${pick([
      'hoy te llega un capítulo extra',
      'cuidado con los spoilers',
      'alguien del grupo te robará un meme',
      'tu suerte sube a rango S',
      'evita discutir sobre quién es mejor waifu',
      'una sorpresa llegará por WhatsApp'
    ])}.\nNúmero de la suerte: ${rnd(1, 99)} · Color: ${pick(['plata lunar','rosa sakura','azul noche','dorado'])}`;
  }
});

const titulos = textTool({
  id: 'titulos',
  icon: 'menu_book',
  name: 'Títulos de manhwa',
  desc: 'Genera títulos dramáticos y absurdos al estilo manhwa.',
  inputs: [{ label: 'Estilo', options: ['Aleatorio', 'Isekai', 'Cultivación', 'Villana', 'Cazadores', 'Romance'] }],
  fn: () => {
    const pre = ['El regreso de', 'La reencarnación de', 'El ascenso de', 'El último', 'El primer', 'La leyenda de', 'El diario de', 'Crónicas de', 'El secreto de', 'El poder de'];
    const mid = ['la villana', 'el cazador', 'el espadachín', 'el heredero', 'la diosa', 'el marginado', 'el emperador', 'la sombra', 'el discípulo', 'la reina'];
    const suf = ['de las sombras', 'de la luna', 'del abismo', 'de las mil estrellas', 'del palacio olvidado', 'del rango SSS', 'de la torre infinita', 'del sistema', 'de los dioses', 'del fin del mundo'];
    return `${pick(pre)} ${pick(mid)} ${pick(suf)}`;
  }
});

const nombres = textTool({
  id: 'nombres',
  icon: 'person_add',
  name: 'Nombres para OC',
  desc: 'Combina nombres y apellidos para tu personaje original.',
  inputs: [
    { label: 'Género', options: ['Aleatorio', 'Femenino', 'Masculino', 'Neutro'] },
    { label: 'Estilo', options: ['Japonés', 'Coreano', 'Occidental'] }
  ],
  fn: (gen, est) => {
    const jp = { f: ['Yuki','Sakura','Hana','Miku','Rei','Aiko','Mio','Rin'], m: ['Haru','Ren','Kai','Sora','Yuu','Hiro','Ken','Riku'], n: ['Akira','Hikaru','Kaoru','Nao','Sora','Yuki','Rei','Hinata'] };
    const jpS = ['Tanaka','Suzuki','Sato','Takahashi','Watanabe','Yamamoto','Nakamura','Kobayashi','Kato','Yoshida','Yamada','Sasaki'];
    const kr = { f: ['Ji-woo','Seo-yeon','Min-ji','Soo-ah','Ha-eun','Yuna','Hye-jin','Eun-ji'], m: ['Min-ho','Jin-woo','Seung-hyun','Ji-hoon','Tae-yang','Hyun-woo','Jae-min','Dong-hyun'], n: ['Ji-min','Seo-jun','Ha-neul','Ye-jin','Soo-hyun','Eun-woo','Ji-hyun','Min-seo'] };
    const krS = ['Kim','Lee','Park','Choi','Jung','Kang','Cho','Yoon','Jang','Lim','Han','Oh'];
    const wName = { f: ['Luna','Aurora','Selene','Nova','Iris','Aria','Elara','Lyra'], m: ['Orion','Kai','Adrian','Lucian','Ezra','Rowan','Felix','Atlas'], n: ['Ash','Riley','Quinn','Rowan','Sage','Sky','Winter','Eden'] };
    const wS = ['Blackwood','Moonwhisper','Starfall','Shadowend','Ashford','Nightshade','Silvermoon','Duskbane'];

    const g = gen === 'Aleatorio' ? pick(['f','m','n']) : (gen === 'Femenino' ? 'f' : gen === 'Masculino' ? 'm' : 'n');
    let names, surnames;
    if (est === 'Japonés') { names = jp[g]; surnames = jpS; }
    else if (est === 'Coreano') { names = kr[g]; surnames = krS; }
    else { names = wName[g]; surnames = wS; }
    return `${pick(names)} ${pick(surnames)}`;
  }
});

const reto = textTool({
  id: 'reto',
  icon: 'today',
  name: 'Reto del día',
  desc: 'Un reto nuevo cada día, igual para todo el grupo.',
  inputs: [],
  fn: () => {
    const retos = [
      'Recomienda un manhwa con solo 3 emojis y que lo adivinen',
      'Escribe un mini-review de 2 líneas de tu último capítulo',
      'Manda un sticker de tu personaje favorito',
      'Cuenta tu panel favorito de esta semana',
      'Dibuja chafa a tu villano favorito en 60 segundos',
      'Propón un nuevo cliché para el próximo manhwa',
      'Escribe un titular amarillista sobre el grupo',
      'Cambia tu foto por un villano hasta mañana',
      'Comparte tu opening favorito de todos los tiempos',
      'Haz un meme del último capítulo que leíste',
      'Di tu hot take más polémico',
      'Describe tu día como si fuera un manhwa',
      'Presenta a tu OC en 3 líneas',
      'Vota por el mejor plot twist de la semana',
      'Adivina el manhwa con solo 3 emojis'
    ];
    const day = Math.floor(Date.now() / 86400000);
    return retos[day % retos.length];
  }
});

const password = textTool({
  id: 'password',
  icon: 'key',
  name: 'Contraseñas',
  desc: 'Genera contraseñas seguras con tema lunar.',
  inputs: [
    { label: 'Longitud', options: ['12','16','20','24','32'] },
    { label: 'Símbolos', options: ['Sí','No'] }
  ],
  fn: (len, sym) => {
    const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const l = 'abcdefghijkmnpqrstuvwxyz';
    const n = '23456789';
    const s = '!@#$%^&*-_=+?';
    const pool = L + l + n + (sym === 'Sí' ? s : '');
    const N = parseInt(len, 10);
    let out = '';
    for (let i = 0; i < N; i++) out += pool[rnd(0, pool.length)];
    return out;
  }
});

/* ============================================================
   HERRAMIENTA: Dinámica al azar
   ============================================================ */
const DINAMICAS = [
  'Manda un sticker de tu personaje favorito en 60 segundos',
  'Describe tu día como si fuera un manhwa',
  'Cambia tu foto de perfil a un villano hasta mañana',
  'Cada quien dice su opening favorito, gana el más votado',
  'Haz un meme del último capítulo que leíste',
  'Adivina el manhwa con solo 3 emojis',
  'Defiende a un villano como abogado por 1 minuto',
  'Reta a otro miembro a un duelo de frases motivacionales',
  'Escribe un titular amarillista sobre el grupo',
  'Dibuja chafa a alguien del grupo (sin ver)',
  'Di tu hot take de manhwa más polémico',
  'Presenta a tu OC en 3 líneas',
  'Todos hablan como narrador de isekai por 10 minutos',
  'Votación: mejor protagonista y peor plot twist',
  'Recomienda un manhwa a la persona de arriba en la lista'
];

const dinamicas = {
  id: 'dinamicas',
  icon: 'celebration',
  name: 'Dinámica al azar',
  desc: 'Lanza una dinámica sorpresa para la comunidad.',
  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="out" id="o" style="font-size:20px;text-align:center">Pulsa el botón para lanzar</div>
        <div class="btn-row">
          <button class="btn filled" id="go">
            <span class="material-symbols-outlined">celebration</span>Lanzar dinámica
          </button>
          <button class="btn tonal" id="cp">
            <span class="material-symbols-outlined">content_copy</span>Copiar
          </button>
          <button class="btn text" id="sh">
            <span class="material-symbols-outlined">share</span>WhatsApp
          </button>
        </div>
      </div>`;
    const run = () => {
      const t = pick(DINAMICAS);
      $('#o', el).textContent = 'Dinámica: ' + t;
      bump('dinamicas', 'Dinámica: ' + t.slice(0, 50));
    };
    $('#go', el).onclick = run;
    $('#cp', el).onclick = () => copy($('#o', el).textContent);
    $('#sh', el).onclick = () => wa($('#o', el).textContent);
    run();
  }
};

/* ============================================================
   HERRAMIENTA: Dado y moneda
   ============================================================ */
const dado = {
  id: 'dado',
  icon: 'casino',
  name: 'Dado y moneda',
  desc: 'Para decidir quién paga, quién empieza o quién es el villano.',
  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="field" style="max-width:320px">
          <label>Qué lanzar</label>
          <select id="tipo">
            <option>Moneda</option>
            <option>Dado d6</option>
            <option>Dado d20</option>
            <option>Dado d100</option>
          </select>
        </div>
        <div class="out" id="o" style="text-align:center;font-size:32px;font-weight:600">—</div>
        <div class="btn-row">
          <button class="btn filled" id="go">
            <span class="material-symbols-outlined">casino</span>Lanzar
          </button>
        </div>
      </div>`;
    const run = () => {
      const tipo = $('#tipo', el).value;
      let t;
      if (tipo === 'Moneda') t = pick(['Cara', 'Cruz']);
      else if (tipo === 'Dado d6') t = String(rnd(1, 7));
      else if (tipo === 'Dado d20') t = 'd20: ' + rnd(1, 21);
      else t = 'd100: ' + rnd(1, 101);
      $('#o', el).textContent = t;
      bump('dado', 'Dado: ' + t);
    };
    $('#go', el).onclick = run;
  }
};

/* ============================================================
   HERRAMIENTA: Ruleta
   ============================================================ */
const ruleta = {
  id: 'ruleta',
  icon: 'donut_large',
  name: 'Ruleta',
  desc: 'Escribe una opción por línea y gira la ruleta.',
  render(el) {
    el.innerHTML = `
      <div class="cols">
        <div>
          <canvas id="c" width="420" height="420" class="cv" style="border-radius:50%;background:none;border:0;max-width:420px;margin:0 auto"></canvas>
          <div class="out" id="o" style="text-align:center;font-weight:500">Gira la ruleta</div>
        </div>
        <div class="card" style="margin:0">
          <div class="field">
            <label>Opciones (una por línea)</label>
            <textarea id="t" rows="9">Reto de meme
Verdad o castigo
Sticker en 1 min
Dibujo chafa
Frase motivacional
Pregunta personal</textarea>
          </div>
          <div class="btn-row">
            <button class="btn filled" id="go" style="width:100%">
              <span class="material-symbols-outlined">donut_large</span>Girar
            </button>
          </div>
        </div>
      </div>`;

    const c = $('#c', el);
    const x = c.getContext('2d');
    let ang = 0, busy = false;

    const getOpts = () => $('#t', el).value.split('\n').map(s => s.trim()).filter(Boolean);

    function draw() {
      const o = getOpts(), n = o.length || 1, s = 2 * Math.PI / n;
      x.clearRect(0, 0, 420, 420);
      o.forEach((t, i) => {
        x.beginPath();
        x.moveTo(210, 210);
        x.arc(210, 210, 200, ang + i * s, ang + (i + 1) * s);
        x.fillStyle = `hsl(${i * 360 / n},70%,${i % 2 ? 62 : 52}%)`;
        x.fill();
        x.save();
        x.translate(210, 210);
        x.rotate(ang + (i + .5) * s);
        x.fillStyle = '#fff';
        x.font = '500 14px Poppins, sans-serif';
        x.textAlign = 'right';
        x.textBaseline = 'middle';
        x.fillText(t.slice(0, 18), 185, 0);
        x.restore();
      });
      x.beginPath();
      x.arc(210, 210, 22, 0, 7);
      x.fillStyle = '#FFC83D';
      x.fill();
      x.fillStyle = '#FF5C93';
      x.beginPath();
      x.moveTo(196, 6);
      x.lineTo(224, 6);
      x.lineTo(210, 38);
      x.fill();
    }

    $('#t', el).oninput = draw;

    $('#go', el).onclick = () => {
      const o = getOpts();
      if (busy || o.length < 2) return toast('Pon al menos 2 opciones');
      busy = true;
      const start = ang;
      const tot = Math.PI * 2 * rnd(5, 8) + rnd(0, 628) / 100;
      const t0 = performance.now();
      (function f(t) {
        const k = Math.min((t - t0) / 4000, 1);
        ang = start + tot * (1 - Math.pow(1 - k, 3));
        draw();
        if (k < 1) requestAnimationFrame(f);
        else {
          busy = false;
          const s = 2 * Math.PI / o.length;
          const i = Math.floor(((((1.5 * Math.PI - ang) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) / s);
          const result = o[i];
          $('#o', el).textContent = result;
          bump('ruleta', 'Ruleta: ' + result);
        }
      })(t0);
    };

    draw();
  }
};

/* ============================================================
   FACTORY: Editor de imágenes
   ============================================================ */
const EMOJIS = ['😭','😂','💀','🔥','😎','👑','🌙','🌸','💢','✨','🥵','🗿','💖','👀'];
const FILTERS = {
  'ninguno': 'none',
  'blanco y negro': 'grayscale(1)',
  'sepia': 'sepia(1)',
  'invertido': 'invert(1)',
  'quemado': 'contrast(2.2) saturate(3) brightness(1.1)',
  'neón': 'saturate(3) hue-rotate(90deg) contrast(1.3)'
};

function imageEditor(cfg) {
  return {
    id: cfg.id,
    icon: cfg.icon,
    name: cfg.name,
    desc: cfg.desc,
    render(el) {
      el.innerHTML = `
        <div class="cols">
          <div><canvas id="c" width="512" height="512" class="cv"></canvas></div>
          <div class="card" style="margin:0">
            <div class="field">
              <label>Foto</label>
              <input type="file" id="f" accept="image/*">
            </div>
            <div class="field">
              <label>Texto arriba</label>
              <input id="t1" value="${cfg.mode === 'meme' ? 'CUANDO SALE EL CAP' : ''}">
            </div>
            <div class="field">
              <label>Texto abajo</label>
              <input id="t2" value="${cfg.mode === 'meme' ? 'Y ES RELLENO' : ''}">
            </div>
            <div class="field">
              <label>Filtro</label>
              <select id="fl">${Object.keys(FILTERS).concat('pixelado').map(k =>
                `<option ${k === (cfg.mode === 'cara' ? 'quemado' : 'ninguno') ? 'selected' : ''}>${k}</option>`
              ).join('')}</select>
            </div>
            <div class="field">
              <label>Forma</label>
              <select id="sp">${['cuadrada','círculo','redondeada'].map(k =>
                `<option ${k === (cfg.mode === 'sticker' ? 'círculo' : 'cuadrada') ? 'selected' : ''}>${k}</option>`
              ).join('')}</select>
            </div>
            <div class="field">
              <label>Emoji (toca la imagen para mover)</label>
              <select id="em">
                <option value="">ninguno</option>
                ${EMOJIS.map(e => `<option ${e === (cfg.mode === 'cara' ? '😭' : '') ? 'selected' : ''}>${e}</option>`).join('')}
              </select>
            </div>
            <div class="field">
              <label>Tamaño emoji</label>
              <input type="range" id="es" min="40" max="300" value="150">
            </div>
            <div class="btn-row">
              <button class="btn filled" id="dl" style="width:100%">
                <span class="material-symbols-outlined">download</span>
                Descargar ${cfg.mode === 'sticker' ? '(.webp)' : '(.png)'}
              </button>
            </div>
          </div>
        </div>`;

      const c = $('#c', el);
      const x = c.getContext('2d');
      let img = null, ex = 256, ey = 256;

      function txt(t, y) {
        if (!t) return;
        t = t.toUpperCase();
        let s = 56;
        do { x.font = `800 ${s}px Poppins, sans-serif`; s -= 3; }
        while (x.measureText(t).width > 470 && s > 16);
        x.textAlign = 'center';
        x.lineWidth = Math.max(2, s / 5);
        x.strokeStyle = '#000';
        x.lineJoin = 'round';
        x.strokeText(t, 256, y);
        x.fillStyle = '#fff';
        x.fillText(t, 256, y);
      }

      function draw() {
        x.clearRect(0, 0, 512, 512);
        x.save();
        const sp = $('#sp', el).value;
        x.beginPath();
        if (sp === 'círculo') x.arc(256, 256, 256, 0, 7);
        else if (sp === 'redondeada') x.roundRect(0, 0, 512, 512, 70);
        else x.rect(0, 0, 512, 512);
        x.clip();

        const fl = $('#fl', el).value;
        if (img) {
          const s = Math.max(512 / img.width, 512 / img.height);
          const w = img.width * s, h = img.height * s;
          if (fl === 'pixelado') {
            const k = 36 / 512;
            const t = document.createElement('canvas');
            t.width = t.height = 36;
            t.getContext('2d').drawImage(img, (512 - w) / 2 * k, (512 - h) / 2 * k, w * k, h * k);
            x.imageSmoothingEnabled = false;
            x.drawImage(t, 0, 0, 512, 512);
          } else {
            x.filter = FILTERS[fl] || 'none';
            x.drawImage(img, (512 - w) / 2, (512 - h) / 2, w, h);
            x.filter = 'none';
          }
        } else {
          const g = x.createLinearGradient(0, 0, 512, 512);
          g.addColorStop(0, '#7c4dff');
          g.addColorStop(1, '#ff5c93');
          x.fillStyle = g;
          x.fillRect(0, 0, 512, 512);
          x.font = '140px serif';
          x.textAlign = 'center';
          x.fillText('🌙', 256, 250);
          x.font = '500 22px Poppins, sans-serif';
          x.fillStyle = '#fff';
          x.fillText('Sube una foto', 256, 320);
        }

        txt($('#t1', el).value, 70);
        txt($('#t2', el).value, 478);

        const e = $('#em', el).value;
        if (e) {
          x.font = `${$('#es', el).value}px serif`;
          x.textAlign = 'center';
          x.textBaseline = 'middle';
          x.fillText(e, ex, ey);
          x.textBaseline = 'alphabetic';
        }
        x.restore();
      }

      $('#f', el).onchange = ev => {
        const f = ev.target.files[0];
        if (!f) return;
        const i = new Image();
        i.onload = () => { img = i; draw(); };
        i.src = URL.createObjectURL(f);
      };

      c.onclick = ev => {
        const r = c.getBoundingClientRect();
        ex = (ev.clientX - r.left) * 512 / r.width;
        ey = (ev.clientY - r.top) * 512 / r.height;
        draw();
      };

      $$('input, select', el).forEach(i => i.addEventListener('input', draw));

      $('#dl', el).onclick = () => {
        bump(cfg.id, cfg.name + ' creado');
        if (cfg.mode === 'sticker') dl(c, 'tsuki-sticker.webp', 'image/webp');
        else dl(c, 'tsuki-' + cfg.id + '.png');
      };

      draw();
      if (document.fonts) document.fonts.ready.then(draw);
    }
  };
}

/* ============================================================
   HERRAMIENTA: Personaje favorito
   ============================================================ */
const personaje = {
  id: 'personaje',
  icon: 'badge',
  name: 'Ficha de personaje',
  desc: 'Crea la ficha de tu personaje favorito u OC.',
  render(el) {
    el.innerHTML = `
      <div class="cols">
        <div><canvas id="c" width="400" height="560" class="cv"></canvas></div>
        <div class="card" style="margin:0">
          <div class="field"><label>Nombre</label><input id="n" value="Luna Kageyama"></div>
          <div class="field"><label>Obra</label><input id="w" value="Tsuki no Tensha"></div>
          <div class="field"><label>Rol</label>
            <select id="r">
              <option>Protagonista</option><option>Villano/a</option><option>Rival</option>
              <option>Mentor/a</option><option>Waifu/Husbando</option><option>Comic relief</option>
            </select>
          </div>
          <div class="field"><label>Poder</label><input id="p" value="Control de la luna"></div>
          <div class="field"><label>Frase</label><input id="q" value="Aún no he mostrado todo mi poder."></div>
          <div class="field"><label>Color</label><input type="color" id="k" value="#7c4dff"></div>
          <div class="field"><label>Imagen (opcional)</label><input type="file" id="f" accept="image/*"></div>
          <div class="btn-row">
            <button class="btn outlined" id="rl">
              <span class="material-symbols-outlined">casino</span>Stats al azar
            </button>
            <button class="btn filled" id="dl">
              <span class="material-symbols-outlined">download</span>Descargar
            </button>
          </div>
        </div>
      </div>`;

    const c = $('#c', el);
    const x = c.getContext('2d');
    let img = null, st = [80, 70, 90];

    function wrapText(t, cx, y, maxW, lh) {
      let l = '';
      for (const p of t.split(' ')) {
        if (x.measureText(l + p).width > maxW && l) {
          x.fillText(l, cx, y);
          y += lh;
          l = '';
        }
        l += p + ' ';
      }
      x.fillText(l, cx, y);
      return y;
    }

    function draw() {
      const k = $('#k', el).value;
      const g = x.createLinearGradient(0, 0, 400, 560);
      g.addColorStop(0, k);
      g.addColorStop(1, '#110f28');
      x.fillStyle = g;
      x.fillRect(0, 0, 400, 560);

      x.fillStyle = 'rgba(255,255,255,.94)';
      x.beginPath();
      x.roundRect(20, 20, 360, 520, 24);
      x.fill();

      x.save();
      x.beginPath();
      x.arc(200, 130, 86, 0, 7);
      x.clip();
      if (img) {
        const s = Math.max(172 / img.width, 172 / img.height);
        x.drawImage(img, 200 - img.width * s / 2, 130 - img.height * s / 2, img.width * s, img.height * s);
      } else {
        x.fillStyle = k;
        x.fillRect(100, 40, 200, 200);
        x.font = '90px serif';
        x.textAlign = 'center';
        x.fillText('🌙', 200, 170);
      }
      x.restore();

      x.textAlign = 'center';
      x.fillStyle = '#231c42';
      x.font = '700 26px Poppins, sans-serif';
      x.fillText($('#n', el).value.slice(0, 22), 200, 262);

      x.font = '400 13px Poppins, sans-serif';
      x.fillStyle = '#6d6590';
      x.fillText($('#w', el).value.slice(0, 32), 200, 284);

      x.fillStyle = k;
      x.beginPath();
      x.roundRect(130, 296, 140, 26, 13);
      x.fill();
      x.fillStyle = '#fff';
      x.font = '500 12px Poppins, sans-serif';
      x.fillText($('#r', el).value, 200, 313);

      x.fillStyle = '#231c42';
      x.font = '500 14px Poppins, sans-serif';
      x.fillText('⚡ ' + $('#p', el).value.slice(0, 30), 200, 352);

      ['Fuerza', 'Carisma', 'Drama'].forEach((s, i) => {
        const y = 380 + i * 30;
        x.textAlign = 'left';
        x.font = '500 12px Poppins, sans-serif';
        x.fillStyle = '#6d6590';
        x.fillText(s, 50, y + 10);
        x.fillStyle = '#e3dcff';
        x.beginPath();
        x.roundRect(120, y, 230, 12, 6);
        x.fill();
        x.fillStyle = k;
        x.beginPath();
        x.roundRect(120, y, 230 * st[i] / 100, 12, 6);
        x.fill();
      });

      x.textAlign = 'center';
      x.fillStyle = '#231c42';
      x.font = 'italic 400 14px Poppins, sans-serif';
      wrapText('"' + $('#q', el).value + '"', 200, 490, 300, 20);
    }

    $('#f', el).onchange = ev => {
      const f = ev.target.files[0];
      if (!f) return;
      const i = new Image();
      i.onload = () => { img = i; draw(); };
      i.src = URL.createObjectURL(f);
    };
    $('#rl', el).onclick = () => { st = [rnd(30, 100), rnd(30, 100), rnd(30, 100)]; draw(); };
    $$('input, select', el).forEach(i => i.addEventListener('input', draw));
    $('#dl', el).onclick = () => {
      bump('personaje', 'Personaje: ' + $('#n', el).value);
      dl(c, 'personaje.png');
    };

    draw();
    if (document.fonts) document.fonts.ready.then(draw);
  }
};

/* ============================================================
   HERRAMIENTA: Dibujos chafas
   ============================================================ */
const dibujo = {
  id: 'dibujo',
  icon: 'draw',
  name: 'Dibujos chafas',
  desc: 'Dibuja con el dedo o el mouse. El modo chafa tiembla a propósito.',
  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="row">
          <div class="field" style="max-width:120px"><label>Color</label><input type="color" id="k" value="#ff5c93"></div>
          <div class="field" style="max-width:160px"><label>Grosor</label><input type="range" id="s" min="2" max="40" value="8"></div>
          <div class="field" style="max-width:160px"><label>Modo</label>
            <select id="m"><option>chafa</option><option>normal</option></select>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn outlined" id="cl">
            <span class="material-symbols-outlined">delete</span>Borrar
          </button>
          <button class="btn filled" id="dl">
            <span class="material-symbols-outlined">download</span>Descargar
          </button>
        </div>
      </div>
      <canvas id="c" width="800" height="500" class="cv" style="background:#fff"></canvas>`;

    const c = $('#c', el);
    const x = c.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, 800, 500);
    let on = false, lp;

    const pt = e => {
      const r = c.getBoundingClientRect();
      const j = $('#m', el).value === 'chafa' ? rnd(-6, 7) : 0;
      return [
        (e.clientX - r.left) * 800 / r.width + j,
        (e.clientY - r.top) * 500 / r.height + j
      ];
    };

    c.onpointerdown = e => { on = true; lp = pt(e); c.setPointerCapture(e.pointerId); };
    c.onpointerup = () => on = false;
    c.onpointermove = e => {
      if (!on) return;
      const p = pt(e);
      x.strokeStyle = $('#k', el).value;
      x.lineWidth = $('#s', el).value;
      x.lineCap = 'round';
      x.beginPath();
      x.moveTo(...lp);
      x.lineTo(...p);
      x.stroke();
      lp = p;
    };

    $('#cl', el).onclick = () => { x.fillStyle = '#fff'; x.fillRect(0, 0, 800, 500); };
    $('#dl', el).onclick = () => { bump('dibujo', 'Dibujo chafa guardado'); dl(c, 'dibujo-chafa.png'); };
  }
};

/* ============================================================
   HERRAMIENTA: Animaciones
   ============================================================ */
const animacion = {
  id: 'animacion',
  icon: 'animation',
  name: 'Animaciones de texto',
  desc: 'Escribe algo y míralo moverse. Haz captura o grábalo para tu estado.',
  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="row">
          <div class="field"><label>Texto</label><input id="t" value="Tsuki no Tensha"></div>
          <div class="field" style="max-width:200px"><label>Efecto</label>
            <select id="e">
              <option>rebote</option><option>temblor</option><option>brillo</option>
              <option>arcoiris</option><option>giro</option><option>latido</option>
            </select>
          </div>
          <div class="field" style="max-width:120px"><label>Color</label><input type="color" id="k" value="#7c4dff"></div>
        </div>
      </div>
      <div class="an-box"><span class="an" id="p"></span></div>`;

    const u = () => {
      const p = $('#p', el);
      p.textContent = $('#t', el).value;
      p.className = 'an an-' + $('#e', el).value;
      p.style.color = $('#k', el).value;
      bump('animacion');
    };
    $$('input, select', el).forEach(i => i.oninput = u);
    u();
  }
};

/* ============================================================
   HERRAMIENTA: Tsuki-bot (IA local)
   ============================================================ */
const ia = {
  id: 'ia',
  icon: 'smart_toy',
  name: 'Tsuki-bot',
  desc: 'Un bot lunar que responde, recomienda y bromea. Funciona sin conexión.',
  render(el) {
    el.innerHTML = `
      <div id="chat"></div>
      <div class="card" style="margin-top:16px">
        <div class="row" style="align-items:center">
          <div class="field" style="flex:1;min-width:200px">
            <input id="i" placeholder="Escríbele a Tsuki-bot…">
          </div>
          <button class="btn filled" id="s">
            <span class="material-symbols-outlined">send</span>Enviar
          </button>
        </div>
      </div>`;

    const ch = $('#chat', el);
    const add = (t, u) => {
      const d = document.createElement('div');
      d.className = 'm' + (u ? ' u' : '');
      d.textContent = t;
      ch.appendChild(d);
      ch.scrollTop = 1e9;
    };

    const R = [
      [/hola|buenas|hey/i, ['¡Hola! Soy Tsuki-bot. ¿Qué dinámica hacemos hoy?', '¡Buenas! Tengo memes, ruletas y chismes de manhwa.']],
      [/recomiend|manhwa|leer/i, ['Prueba un manhwa de cultivación: hay poder, traición y capítulos que duelen.', 'Si quieres drama, busca un isekai con villana reencarnada. Si quieres acción, uno de cazadores.']],
      [/chiste|broma|gracia/i, ['¿Por qué el MC nunca llega a tiempo? Porque siempre hay un flashback antes.', 'Mi relación con los capítulos: 1 semana de hiato y ya lo extraño.']],
      [/triste|mal|ánimo|animo/i, ['Eres protagonista de tu arco. Hoy toca descansar, mañana subes de nivel.', 'Respira. Hasta la luna tiene fases y sigue brillando.']],
      [/dinámica|dinamica|juego|aburr/i, ['Reto: describe tu día como si fuera un manhwa. ¡Yo voto por el más dramático!', 'Ve a "Dinámica al azar" o gira la Ruleta.']],
      [/meme/i, ['Ve a "Creador de memes" o "Meme con plantilla" y crea uno al toque.']],
      [/gracias/i, ['¡De nada! Aquí estaré cuando quieras.']],
      [/ayuda|help/i, ['Puedo recomendarte manhwas, contar chistes, animarte o sugerir dinámicas. Pregúntame lo que quieras.']]
    ];
    const D = [
      'Interesante… cuéntame más, que estoy tomando notas.',
      'Eso suena a plot twist.',
      'No entendí, pero lo apruebo.',
      'Dame un tema: manhwa, memes, ánimo o dinámicas.'
    ];

    const send = () => {
      const v = $('#i', el).value.trim();
      if (!v) return;
      add(v, 1);
      $('#i', el).value = '';
      const l = v.toLowerCase();
      const r = R.find(r => r[0].test(l));
      setTimeout(() => { add(pick(r ? r[1] : D)); bump('ia'); }, 500);
    };

    $('#s', el).onclick = send;
    $('#i', el).onkeydown = e => e.key === 'Enter' && send();
    add('¡Hola! Soy Tsuki-bot. Pregúntame por manhwas, chistes o dinámicas.');
  }
};

/* ============================================================
   HERRAMIENTA: Bingo de manhwa
   ============================================================ */
const BINGO_TROPES = [
  'Flashback en el peor momento', 'Sistema de niveles', 'Traición del mejor amigo',
  'Dungeon', 'Reencarnación', 'Op desde el inicio',
  'Villana incomprendida', 'Amnesia', 'Cultivación',
  'Realeza', 'Regreso al pasado', 'Harem',
  'Falsa identidad', 'Poder despertado en crisis', 'Entrenamiento express',
  'Familia abusiva', 'Contrato de matrimonio', 'Habilidad única',
  'MC subestimado', 'Rival rubio', 'Maestro con 1 línea',
  'Animal mascota que habla', 'Escena de lluvia', 'Restaurante'
];

const bingo = {
  id: 'bingo',
  icon: 'grid_on',
  name: 'Bingo de manhwa',
  desc: 'Marca los clichés que aparezcan mientras lees. Si completas una línea, ¡bingo!',
  render(el) {
    const gen = () => {
      const pool = [...BINGO_TROPES];
      const cells = [];
      for (let i = 0; i < 9; i++) {
        const idx = rnd(0, pool.length);
        cells.push({ text: pool.splice(idx, 1)[0], marked: false });
      }
      return cells;
    };

    if (!S.bingo || !S.bingo.cells) {
      S.bingo = { cells: gen() };
      save();
    }

    el.innerHTML = `
      <div class="btn-row" style="margin:0 0 16px">
        <button class="btn outlined" id="new">
          <span class="material-symbols-outlined">refresh</span>Nuevo cartón
        </button>
        <button class="btn text" id="reset">
          <span class="material-symbols-outlined">restart_alt</span>Reiniciar marcas
        </button>
      </div>
      <div class="bingo-grid" id="grid"></div>
      <div class="out" id="msg" style="text-align:center;margin-top:16px">Toca cada casilla cuando aparezca el cliché.</div>`;

    const render = () => {
      const grid = $('#grid', el);
      grid.innerHTML = S.bingo.cells.map((c, i) =>
        `<button class="bingo-cell ${c.marked ? 'marked' : ''}" data-i="${i}">${c.text}</button>`
      ).join('');
      $$('.bingo-cell', el).forEach(b => {
        b.onclick = () => {
          const i = +b.dataset.i;
          S.bingo.cells[i].marked = !S.bingo.cells[i].marked;
          save();
          render();
          checkWin();
        };
      });
    };

    const checkWin = () => {
      const m = S.bingo.cells.map(c => c.marked);
      const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      const win = lines.some(l => l.every(i => m[i]));
      $('#msg', el).textContent = win
        ? '¡BINGO! Completa el cartón para el bingo total.'
        : 'Toca cada casilla cuando aparezca el cliché.';
    };

    $('#new', el).onclick = () => {
      S.bingo = { cells: gen() };
      save();
      render();
      checkWin();
    };
    $('#reset', el).onclick = () => {
      S.bingo.cells.forEach(c => c.marked = false);
      save();
      render();
      checkWin();
    };

    render();
    checkWin();
  }
};

/* ============================================================
   HERRAMIENTA API: Meme con plantilla (memegen.link)
   ============================================================ */
const memeAPI = {
  id: 'memeapi',
  icon: 'interests',
  name: 'Meme con plantilla',
  desc: 'Elige una plantilla clásica, escribe el texto y descarga el meme generado por API.',
  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="row">
          <div class="field"><label>Plantilla</label>
            <select id="tpl">
              <option value="drake">Drake</option>
              <option value="db">Distracted Boyfriend</option>
              <option value="fine">This is Fine</option>
              <option value="cmm">Change My Mind</option>
              <option value="astronaut">Always Has Been</option>
              <option value="gru">Gru's Plan</option>
              <option value="pooh">Tuxedo Winnie the Pooh</option>
              <option value="rollsafe">Roll Safe</option>
              <option value="harold">Hide the Pain Harold</option>
              <option value="woman-cat">Woman Yelling at a Cat</option>
              <option value="spiderman">Spider-Man Pointing</option>
              <option value="buzz">Buzz Lightyear</option>
              <option value="success">Success Kid</option>
              <option value="troll">Troll Face</option>
            </select>
          </div>
        </div>
        <div class="row">
          <div class="field"><label>Texto arriba</label><input id="t1" placeholder="Texto 1"></div>
          <div class="field"><label>Texto abajo</label><input id="t2" placeholder="Texto 2"></div>
        </div>
        <div class="btn-row">
          <button class="btn filled" id="go">
            <span class="material-symbols-outlined">auto_awesome</span>Generar meme
          </button>
          <button class="btn tonal" id="dl">
            <span class="material-symbols-outlined">download</span>Descargar
          </button>
        </div>
      </div>
      <div class="api-preview" id="box">
        <span class="loading">
          <span class="material-symbols-outlined">progress_activity</span>
          Pulsa "Generar meme"
        </span>
      </div>`;

    const box = $('#box', el);

    const generate = () => {
      const tpl = $('#tpl', el).value;
      const rawT1 = $('#t1', el).value.trim();
      const rawT2 = $('#t2', el).value.trim();
      // memegen usa '_' para línea vacía
      const t1 = rawT1 ? encodeURIComponent(rawT1.replace(/ /g, '_')) : '_';
      const t2 = rawT2 ? encodeURIComponent(rawT2.replace(/ /g, '_')) : '_';
      const url = `https://api.memegen.link/images/${tpl}/${t1}/${t2}.png`;
      box.innerHTML = `<span class="loading">
        <span class="material-symbols-outlined">progress_activity</span>
        Cargando meme…
      </span>`;
      const img = new Image();
      img.alt = 'Meme generado';
      img.onload = () => {
        box.innerHTML = '';
        box.appendChild(img);
        bump('memeapi', 'Meme generado: ' + tpl);
      };
      img.onerror = () => {
        box.innerHTML = `<span class="loading" style="color:var(--error)">No se pudo cargar. Prueba otra plantilla.</span>`;
      };
      img.src = url;
    };

    $('#go', el).onclick = generate;
    $('#dl', el).onclick = () => {
      const img = box.querySelector('img');
      if (!img) return toast('Genera un meme primero');
      fetch(img.src)
        .then(r => r.blob())
        .then(blob => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'tsuki-meme.png';
          a.click();
          toast('Meme descargado');
        })
        .catch(() => window.open(img.src, '_blank'));
    };
    generate();
  }
};

/* ============================================================
   HERRAMIENTA API: Imagen por IA (Pollinations)
   ============================================================ */
const imagenIA = {
  id: 'imagenia',
  icon: 'photo_camera',
  name: 'Imagen por IA',
  desc: 'Describe lo que quieres y la IA generará una imagen única.',
  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="field">
          <label>Prompt (en inglés funciona mejor)</label>
          <textarea id="prompt" rows="3" placeholder="a cute anime girl with silver hair, night sky, moonlight, digital art"></textarea>
        </div>
        <div class="row">
          <div class="field" style="max-width:160px"><label>Ancho</label>
            <input type="number" id="w" value="512" min="256" max="1024" step="128">
          </div>
          <div class="field" style="max-width:160px"><label>Alto</label>
            <input type="number" id="h" value="512" min="256" max="1024" step="128">
          </div>
          <div class="field" style="max-width:220px"><label>Modelo</label>
            <select id="model">
              <option value="flux">Flux (recomendado)</option>
              <option value="turbo">Turbo (rápido)</option>
            </select>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn filled" id="go">
            <span class="material-symbols-outlined">auto_awesome</span>Generar imagen
          </button>
          <button class="btn tonal" id="dl">
            <span class="material-symbols-outlined">download</span>Descargar
          </button>
        </div>
      </div>
      <div class="api-preview" id="box">
        <span class="loading">
          <span class="material-symbols-outlined">progress_activity</span>
          Escribe un prompt y pulsa "Generar imagen"
        </span>
      </div>`;

    const box = $('#box', el);

    const generate = () => {
      const prompt = $('#prompt', el).value.trim();
      if (!prompt) return toast('Escribe un prompt primero');
      const w = $('#w', el).value;
      const h = $('#h', el).value;
      const model = $('#model', el).value;
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&model=${model}&nologo=true&seed=${rnd(1, 999999)}`;
      box.innerHTML = `<span class="loading">
        <span class="material-symbols-outlined">progress_activity</span>
        Generando imagen… (puede tardar unos segundos)
      </span>`;
      const img = new Image();
      img.alt = 'Imagen generada por IA';
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        box.innerHTML = '';
        box.appendChild(img);
        bump('imagenia', 'Imagen IA: ' + prompt.slice(0, 40));
      };
      img.onerror = () => {
        box.innerHTML = `<span class="loading" style="color:var(--error)">La IA no pudo generar. Intenta de nuevo o cambia el prompt.</span>`;
      };
      img.src = url;
    };

    $('#go', el).onclick = generate;
    $('#dl', el).onclick = () => {
      const img = box.querySelector('img');
      if (!img) return toast('Genera una imagen primero');
      fetch(img.src)
        .then(r => r.blob())
        .then(blob => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'tsuki-ia.png';
          a.click();
          toast('Imagen descargada');
        })
        .catch(() => window.open(img.src, '_blank'));
    };
  }
};

/* ============================================================
   HERRAMIENTA API: Avatares (DiceBear)
   ============================================================ */
const avatares = {
  id: 'avatares',
  icon: 'face',
  name: 'Avatares y plantillas',
  desc: 'Genera avatares SVG únicos a partir de un nombre o semilla.',
  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="row">
          <div class="field" style="max-width:220px"><label>Estilo</label>
            <select id="style">
              <option value="lorelei">Lorelei</option>
              <option value="pixel-art">Pixel Art</option>
              <option value="avataaars">Avataaars</option>
              <option value="adventurer">Adventurer</option>
              <option value="bottts">Bottts</option>
              <option value="initials">Initials</option>
              <option value="micah">Micah</option>
              <option value="open-peeps">Open Peeps</option>
              <option value="thumbs">Thumbs</option>
            </select>
          </div>
          <div class="field" style="flex:1"><label>Semilla (nombre o texto)</label>
            <input id="seed" value="tsuki" placeholder="Ej: LunaKageyama">
          </div>
        </div>
        <div class="btn-row">
          <button class="btn filled" id="go">
            <span class="material-symbols-outlined">refresh</span>Generar avatar
          </button>
          <button class="btn tonal" id="dl">
            <span class="material-symbols-outlined">download</span>Descargar SVG
          </button>
        </div>
      </div>
      <div class="api-preview" id="box"></div>`;

    const box = $('#box', el);

    const generate = () => {
      const style = $('#style', el).value;
      const seed = encodeURIComponent($('#seed', el).value.trim() || 'tsuki');
      const url = `https://api.dicebear.com/10.x/${style}/svg?seed=${seed}`;
      box.innerHTML = '';
      const img = new Image();
      img.className = 'avatar';
      img.alt = 'Avatar generado';
      img.onload = () => {
        box.appendChild(img);
        bump('avatares', 'Avatar: ' + style);
      };
      img.onerror = () => {
        box.innerHTML = `<span class="loading" style="color:var(--error)">No se pudo generar el avatar.</span>`;
      };
      img.src = url;
    };

    $('#go', el).onclick = generate;
    $('#dl', el).onclick = () => {
      const img = box.querySelector('img');
      if (!img) return toast('Genera un avatar primero');
      fetch(img.src)
        .then(r => r.text())
        .then(svg => {
          const blob = new Blob([svg], { type: 'image/svg+xml' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = 'avatar.svg';
          a.click();
          toast('Avatar descargado');
        })
        .catch(() => window.open(img.src, '_blank'));
    };
    generate();
  }
};

/* ============================================================
   HERRAMIENTA API: Frases célebres (Quotable)
   ============================================================ */
const frasesAPI = {
  id: 'frasesapi',
  icon: 'history_edu',
  name: 'Frases célebres',
  desc: 'Frases reales de autores famosos, traídas desde una API pública.',
  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="out" id="o" style="font-size:18px;font-style:italic;min-height:100px">Cargando frase…</div>
        <div class="btn-row">
          <button class="btn filled" id="go">
            <span class="material-symbols-outlined">refresh</span>Otra frase
          </button>
          <button class="btn tonal" id="cp">
            <span class="material-symbols-outlined">content_copy</span>Copiar
          </button>
          <button class="btn text" id="sh">
            <span class="material-symbols-outlined">share</span>WhatsApp
          </button>
        </div>
      </div>`;

    const o = $('#o', el);
    let current = '';

    const fallback = [
      '"La luna no se apresura, y aun así siempre llega." — Proverbio',
      '"Incluso el héroe más débil tiene su arco de desarrollo." — Tsuki no Tensha',
      '"El plot twist eres tú." — Anónimo'
    ];

    const run = async () => {
      o.textContent = 'Cargando…';
      try {
        const res = await fetch('https://api.quotable.io/random?maxLength=140');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        current = `"${data.content}" — ${data.author}`;
        o.textContent = current;
        bump('frasesapi', 'Frase: ' + current.slice(0, 50));
      } catch (e) {
        current = pick(fallback);
        o.textContent = current + '\n(modo offline)';
      }
    };

    $('#go', el).onclick = run;
    $('#cp', el).onclick = () => copy(current);
    $('#sh', el).onclick = () => wa(current);
    run();
  }
};

/* ============================================================
   Registro de herramientas
   ============================================================ */
const imageEditors = [
  imageEditor({ id: 'meme', icon: 'image', name: 'Creador de memes', desc: 'Sube una imagen y ponle texto arriba y abajo.', mode: 'meme' }),
  imageEditor({ id: 'cara', icon: 'face', name: 'Tu cara en meme', desc: 'Sube tu foto, quémala y ponle un emoji.', mode: 'cara' }),
  imageEditor({ id: 'sticker', icon: 'sticky_note_2', name: 'Stickers de WhatsApp', desc: 'Recorta en círculo, agrega texto y descarga en .webp (512×512).', mode: 'sticker' }),
  imageEditor({ id: 'edicion', icon: 'tune', name: 'Ediciones sencillas', desc: 'Filtros, formas y emojis para retocar tus fotos.', mode: 'edicion' })
];

const T = [
  dinamicas,
  ruleta,
  dado,
  bingo,
  frases,
  noticias,
  amarillismo,
  insultos,
  ship,
  horo,
  titulos,
  nombres,
  reto,
  password,
  memeAPI,
  imagenIA,
  avatares,
  frasesAPI,
  ...imageEditors,
  personaje,
  dibujo,
  animacion,
  ia
];

const byId = id => T.find(t => t.id === id);

/* ============================================================
   Dashboard
   ============================================================ */
const dash = {
  id: 'inicio',
  icon: 'home',
  name: 'Inicio',
  desc: '',
  render(el) {
    const tot = Object.values(S.uses).reduce((a, b) => a + b, 0);
    const top = Object.entries(S.uses).sort((a, b) => b[1] - a[1])[0];
    const tt = top && byId(top[0]);
    const favTools = S.favs.map(byId).filter(Boolean);

    el.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <span class="material-symbols-outlined">insights</span>
          <div><small>Usos totales</small><div class="stat-value">${tot}</div></div>
        </div>
        <div class="stat-card">
          <span class="material-symbols-outlined">local_fire_department</span>
          <div><small>Racha diaria</small><div class="stat-value">${S.streak.count} día${S.streak.count === 1 ? '' : 's'}</div></div>
        </div>
        <div class="stat-card">
          <span class="material-symbols-outlined">star</span>
          <div><small>Favorita</small><div class="stat-value" style="font-size:16px">${tt ? tt.name : '—'}</div></div>
        </div>
        <div class="stat-card">
          <span class="material-symbols-outlined">apps</span>
          <div><small>Herramientas</small><div class="stat-value">${T.length}</div></div>
        </div>
      </div>

      ${favTools.length ? `
        <h3 class="section-title">Favoritas</h3>
        <div class="tools-grid">
          ${favTools.map(t => `
            <button class="tool-card" data-g="${t.id}">
              <span class="material-symbols-outlined">${t.icon}</span>
              <strong>${t.name}</strong>
              <small>${t.desc || ''}</small>
            </button>`).join('')}
        </div>` : ''}

      <h3 class="section-title">Todas las herramientas</h3>
      <div class="tools-grid">
        ${T.map(t => `
          <button class="tool-card" data-g="${t.id}">
            <span class="material-symbols-outlined">${t.icon}</span>
            <strong>${t.name}</strong>
            <small>${t.desc || ''}</small>
          </button>`).join('')}
      </div>

      <h3 class="section-title">Últimas creaciones</h3>
      ${S.hist.length ? `
        <ul class="hist-list">
          ${S.hist.map(h => `<li>${h.replace(/</g, '&lt;')}</li>`).join('')}
        </ul>` : `<div class="empty">Aún no hay nada. ¡Prueba una herramienta!</div>`}
    `;

    $$('[data-g]', el).forEach(b => b.onclick = () => location.hash = b.dataset.g);
  }
};

/* ============================================================
   Navegación
   ============================================================ */
const NAV = [
  ['', ['inicio']],
  ['Juegos', ['dinamicas', 'ruleta', 'dado', 'bingo']],
  ['Texto', ['frases', 'noticias', 'amarillismo', 'insultos', 'ship', 'horoscopo', 'titulos', 'nombres', 'reto', 'frasesapi']],
  ['Imagen y arte', ['meme', 'cara', 'sticker', 'edicion', 'personaje', 'dibujo', 'animacion']],
  ['APIs y generadores', ['memeapi', 'imagenia', 'avatares']],
  ['Utilidades', ['ia', 'password']]
];

function renderNav() {
  $('#nav').innerHTML = NAV.map(([h, ids]) => {
    const items = ids.map(id => {
      const t = id === 'inicio' ? dash : byId(id);
      if (!t) return '';
      return `<button data-id="${t.id}">
        <span class="material-symbols-outlined">${t.icon}</span>
        <span>${t.name}</span>
      </button>`;
    }).join('');
    return `<div class="nav-group">${h ? `<h4>${h}</h4>` : ''}${items}</div>`;
  }).join('');

  $$('nav button[data-id]', $('#nav')).forEach(b => {
    b.onclick = () => {
      location.hash = b.dataset.id;
      closeDrawer();
    };
  });
}

function go() {
  const id = location.hash.slice(1) || 'inicio';
  const tool = id === 'inicio' ? dash : (byId(id) || dash);

  $$('nav button[data-id]', $('#nav')).forEach(b =>
    b.classList.toggle('on', b.dataset.id === tool.id)
  );

  const title = tool.id === 'inicio' ? 'Tsuki no Tensha' : tool.name;
  $('#main').innerHTML = `
    <header class="page-head">
      <span class="material-symbols-outlined page-icon">${tool.icon}</span>
      <div>
        <h1>${title}</h1>
        ${tool.desc ? `<p class="page-desc">${tool.desc}</p>` : ''}
      </div>
    </header>
    <div id="v"></div>`;

  tool.render($('#v'));
  closeDrawer();
  window.scrollTo(0, 0);
  document.title = title + ' · Tsuki no Tensha';
}

/* ============================================================
   Drawer
   ============================================================ */
function openDrawer() {
  $('#sb').classList.add('open');
  $('#scrim').hidden = false;
  requestAnimationFrame(() => $('#scrim').classList.add('show'));
}
function closeDrawer() {
  $('#sb').classList.remove('open');
  $('#scrim').classList.remove('show');
  setTimeout(() => { if (!$('#sb').classList.contains('open')) $('#scrim').hidden = true; }, 200);
}

/* ============================================================
   Búsqueda
   ============================================================ */
function onSearch(e) {
  const q = e.target.value.trim().toLowerCase();
  const box = $('#search-results');
  if (!q) { box.hidden = true; return; }

  const matches = [dash, ...T].filter(t =>
    t.name.toLowerCase().includes(q) ||
    (t.desc || '').toLowerCase().includes(q)
  ).slice(0, 8);

  if (!matches.length) {
    box.innerHTML = '<div class="search-empty">Sin resultados</div>';
  } else {
    box.innerHTML = matches.map(t => `
      <button class="search-item" data-id="${t.id}">
        <span class="material-symbols-outlined">${t.icon}</span>
        <span><strong>${t.name}</strong><small>${t.desc || ''}</small></span>
      </button>`).join('');
    $$('.search-item', box).forEach(b => b.onclick = () => {
      location.hash = b.dataset.id;
      e.target.value = '';
      box.hidden = true;
    });
  }
  box.hidden = false;
}

/* ============================================================
   Inicialización
   ============================================================ */
function init() {
  initTheme();
  updateStreak();
  renderNav();
  go();

  $('#th').onclick = () => {
    const cur = document.documentElement.dataset.theme;
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('tsuki.theme', next);
    updateThemeIcon();
  };

  $('#mb').onclick = () => $('#sb').classList.contains('open') ? closeDrawer() : openDrawer();
  $('#scrim').onclick = closeDrawer;

  const search = $('#search');
  search.addEventListener('input', onSearch);
  search.addEventListener('focus', () => {
    if (search.value.trim()) onSearch({ target: search });
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.search')) $('#search-results').hidden = true;
  });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      search.focus();
    }
    if (e.key === 'Escape') {
      search.blur();
      $('#search-results').hidden = true;
      closeDrawer();
    }
  });

  $('#fab').onclick = () => location.hash = pick(T).id;

  addEventListener('hashchange', go);

  addEventListener('scroll', () => {
    $('.appbar').classList.toggle('scrolled', scrollY > 4);
  }, { passive: true });
}

document.addEventListener('DOMContentLoaded', init);
})();