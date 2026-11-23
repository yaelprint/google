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
             <input data-k="${k}" placeholder="${i.placeholder || ''}" value="${i.value || ''}">
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
  fn: (estilo) => {
    const sets = {
      'Isekai': [['Renacido como', 'Transportado al', 'El nuevo señor de'], ['el mago', 'el rey dragón', 'la emperatriz'], ['en otro mundo', 'del reino perdido', 'tras el apocalipsis']],
      'Cultivación': [['El cultivo de', 'La ascensión de', 'El inmortal'], ['la espada', 'el dragón celestial', 'el último discípulo'], ['rompe los cielos', 'perfora el vacío', 'alcanza la inmortalidad']],
      'Villana': [['La segunda vida de', 'El regreso de', 'La venganza de'], ['la villana', 'la princesa maldita', 'la heredera traicionada'], ['del imperio', 'contra el destino', 'en el palacio']],
      'Cazadores': [['El cazador', 'La última misión de', 'El gremio del'], ['rango SSS', 'monstruo lunar', 'guardián oscuro'], ['de la torre', 'antes del amanecer', 'contra los dioses']],
      'Romance': [['Nuestro contrato', 'El amor prohibido de', 'Bajo el brillo de'], ['la luna', 'la duquesa', 'el príncipe'], ['de invierno', 'en el internado', 'tras la promesa']],
      'Aleatorio': [['El regreso de', 'La reencarnación de', 'El ascenso de', 'El último', 'El primer', 'La leyenda de', 'El diario de', 'Crónicas de', 'El secreto de', 'El poder de'], ['la villana', 'el cazador', 'el espadachín', 'el heredero', 'la diosa', 'el marginado', 'el emperador', 'la sombra', 'el discípulo', 'la reina'], ['de las sombras', 'de la luna', 'del abismo', 'de las mil estrellas', 'del palacio olvidado', 'del rango SSS', 'de la torre infinita', 'del sistema', 'de los dioses', 'del fin del mundo']]
    };
    const [pre, mid, suf] = sets[estilo] || sets.Aleatorio;
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
  desc: 'Escribe algo, elige un efecto y descárgalo como GIF animado.',
  render(el) {
    const FX = ['rebote', 'temblor', 'brillo', 'arcoiris', 'giro', 'latido', 'onda', 'escribir', 'parpadeo', 'zoom', 'deslizar', 'neon', 'glitch', 'caida'];
    el.innerHTML = `
      <div class="card">
        <div class="row">
          <div class="field"><label>Texto</label><input id="t" value="Tsuki no Tensha" maxlength="60"></div>
          <div class="field" style="max-width:200px"><label>Efecto</label>
            <select id="e">${FX.map(f => `<option>${f}</option>`).join('')}</select>
          </div>
        </div>
        <div class="row">
          <div class="field" style="max-width:120px"><label>Color texto</label><input type="color" id="k" value="#ffffff"></div>
          <div class="field" style="max-width:120px"><label>Color fondo</label><input type="color" id="b" value="#6750a4"></div>
          <div class="field" style="max-width:170px"><label>Tamaño</label>
            <select id="z"><option>Banner</option><option>Cuadrado</option><option>Pequeño</option></select>
          </div>
          <div class="field" style="max-width:150px"><label>Velocidad</label>
            <select id="s"><option>Normal</option><option>Rápida</option><option>Lenta</option></select>
          </div>
        </div>
        <div class="btn-row">
          <button class="btn filled" id="gif"><span class="material-symbols-outlined">gif_box</span>Descargar GIF</button>
          <button class="btn tonal" id="png"><span class="material-symbols-outlined">image</span>PNG</button>
          <button class="btn text" id="fav"><span class="material-symbols-outlined">star</span>Favorito</button>
        </div>
      </div>
      <div class="api-preview"><canvas id="cv" width="480" height="200" style="max-width:100%;border-radius:12px"></canvas></div>`;

    const cv = $('#cv', el), ctx = cv.getContext('2d');
    const opts = () => ({ text: $('#t', el).value || ' ', effect: $('#e', el).value, color: $('#k', el).value, bg: $('#b', el).value });
    const dims = () => ({ Banner: [480, 200], Cuadrado: [360, 360], 'Pequeño': [320, 140] }[$('#z', el).value]);
    const dur = () => ({ Normal: 1600, 'Rápida': 1000, Lenta: 2600 }[$('#s', el).value]);

    const loop = t => {
      if (!cv.isConnected) return;
      const [w, h] = dims();
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      textFrame(ctx, w, h, (t % dur()) / dur(), opts());
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    $('#gif', el).onclick = async e => {
      const btn = e.currentTarget;
      if (btn.disabled) return;
      btn.disabled = true;
      const old = btn.innerHTML, [w, h] = dims(), o = opts(), N = 24, d = dur();
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const x = c.getContext('2d', { willReadFrequently: true });
      try {
        const frames = [];
        for (let i = 0; i < N; i++) {
          textFrame(x, w, h, i / N, o);
          frames.push(x.getImageData(0, 0, w, h).data);
          btn.lastChild.textContent = `Creando… ${Math.round(i / N * 100)}%`;
          await new Promise(r => setTimeout(r));
        }
        btn.lastChild.textContent = 'Codificando…';
        await new Promise(r => setTimeout(r));
        const bytes = gifEncode(frames, w, h, Math.max(2, Math.round(d / N / 10)));
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([bytes], { type: 'image/gif' }));
        a.download = 'tsuki-texto.gif';
        a.click();
        toast('GIF descargado (' + Math.round(bytes.length / 1024) + ' KB)');
        bump('animacion', 'GIF animado: ' + o.text.slice(0, 30));
      } catch (err) { toast('No se pudo crear el GIF'); }
      btn.disabled = false; btn.innerHTML = old;
    };
    $('#png', el).onclick = () => dl(cv, 'tsuki-texto.png');
    $('#fav', el).onclick = () => toggleFav('animacion');
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
              <option value="gptimage">GPT Image</option>
              <option value="kontext">Kontext</option>
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
   EXTRAS: más APIs, memes, modelos de IA y 50 funciones
   ============================================================ */
const J  = u => fetch(u).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); });
const I  = (label, placeholder, value) => ({ label, placeholder, value });
const O  = (label, ...options) => ({ label, options });
const enc = encodeURIComponent;
const translationCache = new Map();
const ES_WORDS = {
  alive: 'vivo', dead: 'fallecido', unknown: 'desconocido',
  human: 'humano', humanoid: 'humanoide', alien: 'alienígena',
  male: 'masculino', female: 'femenino',
  fire: 'fuego', water: 'agua', grass: 'planta', electric: 'eléctrico',
  psychic: 'psíquico', ice: 'hielo', dragon: 'dragón', dark: 'siniestro',
  fairy: 'hada', fighting: 'lucha', ghost: 'fantasma', steel: 'acero',
  flying: 'volador', poison: 'veneno', ground: 'tierra', rock: 'roca',
  bug: 'bicho', normal: 'normal',
  airing: 'en emisión', finished: 'finalizado', complete: 'completo',
  currently: 'actualmente', upcoming: 'próximo', hiatus: 'pausado'
};

async function translateText(text, source = 'en') {
  text = String(text || '').trim();
  if (!text || /^[\d\s.,;:!?¡¿()[\]{}#\/:-]+$/.test(text)) return text;
  const key = source + ':' + text;
  if (translationCache.has(key)) return translationCache.get(key);

  const local = ES_WORDS[String(text).toLowerCase()];
  if (local) {
    translationCache.set(key, local);
    return local;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const url = `https://api.mymemory.translated.net/get?q=${enc(text.slice(0, 450))}&langpair=${source}|es`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw 0;
    const data = await response.json();
    const translated = data.responseData && data.responseData.translatedText;
    const result = translated && !/^[A-Z_]+$/.test(translated) ? translated : text;
    translationCache.set(key, result);
    return result;
  } catch {
    translationCache.set(key, text);
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

function loadImg(box, url, alt) {
  box.style.display = '';
  box.innerHTML = '<span class="loading"><span class="material-symbols-outlined">progress_activity</span>Cargando…</span>';
  const img = new Image(); img.alt = alt || 'Imagen';
  img.onload = () => { box.innerHTML = ''; box.appendChild(img); };
  img.onerror = () => { box.innerHTML = '<span class="loading" style="color:var(--error)">No se pudo cargar. Intenta de nuevo.</span>'; };
  img.src = url;
}
function dlUrl(url, name) {
  fetch(url).then(r => r.blob()).then(b => {
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); toast('Descargado');
  }).catch(() => window.open(url, '_blank'));
}

/* ---------- Fábrica de herramientas API ---------- */
function apiTool(c) {
  return {
    g: c.g, id: c.id, icon: c.icon, name: c.name, desc: c.desc,
    render(el) {
      const ins = (c.inputs || []).map((i, k) => `<div class="field"><label>${i.label}</label>${i.options
        ? `<select data-k="${k}">${i.options.map(o => `<option>${o}</option>`).join('')}</select>`
        : `<input data-k="${k}" placeholder="${i.placeholder || ''}" value="${i.value || ''}">`}</div>`).join('');
      el.innerHTML = `
        <div class="card">${ins ? `<div class="row">${ins}</div>` : ''}
          <div class="out" id="o">Cargando…</div>
          <div class="btn-row">
            <button class="btn filled" id="go"><span class="material-symbols-outlined">refresh</span>Generar</button>
            <button class="btn tonal" id="cp"><span class="material-symbols-outlined">content_copy</span>Copiar</button>
            <button class="btn tonal" id="dl"><span class="material-symbols-outlined">download</span>Descargar</button>
            <button class="btn text" id="sh"><span class="material-symbols-outlined">share</span>WhatsApp</button>
            <button class="btn text" id="fav"><span class="material-symbols-outlined">star</span>Favorito</button>
          </div>
        </div>
        <div class="api-preview" id="box" style="display:none"></div>`;
      const o = $('#o', el), box = $('#box', el);
      let cur = {};
      const run = async () => {
        o.style.display = ''; o.textContent = 'Cargando…'; box.style.display = 'none'; box.innerHTML = '';
        try {
          cur = await c.get(...$$('[data-k]', el).map(x => x.value.trim()));
          o.textContent = cur.t || ''; o.style.display = cur.t ? '' : 'none';
          if (cur.img) loadImg(box, cur.img, c.name);
          bump(c.id, c.name + ': ' + (cur.t || 'imagen').replace(/\n/g, ' ').slice(0, 50));
        } catch (e) {
          o.style.display = ''; o.textContent = 'La API no respondió o no encontró resultados. Revisa el dato e intenta otra vez.'; cur = {};
        }
      };
      $('#go', el).onclick = run;
      $('#cp', el).onclick = () => copy(cur.t || cur.img || '');
      $('#sh', el).onclick = () => wa((cur.t || '') + (cur.img ? '\n' + cur.img : ''));
      $('#dl', el).onclick = () => cur.img ? dlUrl(cur.img, 'tsuki-' + c.id + (/\.svg|\/svg/.test(cur.img) ? '.svg' : '.png')) : toast('Esta herramienta no tiene imagen');
      $('#fav', el).onclick = () => toggleFav(c.id);
      run();
    }
  };
}
const ap = (g, id, icon, name, desc, inputs, get) => apiTool({ g, id, icon, name, desc, inputs, get });
const dec = h => { const t = document.createElement('textarea'); t.innerHTML = h; return t.value; };

/* ---------- Catálogo de APIs ---------- */
const SUBS = ['memes', 'dankmemes', 'wholesomememes', 'ProgrammerHumor', 'me_irl', 'animemes', 'historymemes', 'AdviceAnimals', 'PrequelMemes', 'MemeEconomy'];
const MON = ['USD', 'MXN', 'EUR', 'GBP', 'JPY', 'ARS', 'COP', 'CLP', 'BRL', 'CAD'];
const APIS = [
  // ---- Memes y humor ----
  ap('m', 'redditmeme', 'sentiment_very_satisfied', 'Memes de Reddit', 'Memes frescos de cualquier subreddit (meme-api).', [O('Subreddit', ...SUBS)],
    async s => { const d = await J(`https://meme-api.com/gimme/${s}`); return { t: d.title, img: d.url }; }),
  ap('m', 'memees', 'translate', 'Memes en español', 'Memes de subreddits en español.', [O('Subreddit', 'SpanishMeme', 'LatinoPeopleTwitter', 'memexico', 'yo_elvr')],
    async s => { const d = await J(`https://meme-api.com/gimme/${s}`); return { t: d.title, img: d.url }; }),
  ap('m', 'imgflip', 'collections', 'Plantilla al azar (Imgflip)', 'Plantillas populares de Imgflip para inspirarte.', [],
    async () => { const d = await J('https://api.imgflip.com/get_memes'); const m = pick(d.data.memes); return { t: m.name, img: m.url }; }),
  ap('m', 'memegenrnd', 'shuffle', 'Plantilla al azar (Memegen)', 'Una plantilla aleatoria de memegen.link con su ejemplo.', [],
    async () => { const d = await J('https://api.memegen.link/templates'); const m = pick(d); return { t: m.name + ' · id: ' + m.id, img: m.example.url }; }),
  ap('m', 'yesno', 'help', 'Sí o No con GIF', 'Pregúntale al universo: respuesta con GIF.', [],
    async () => { const d = await J('https://yesno.wtf/api'); return { t: d.answer.toUpperCase(), img: d.image }; }),
  ap('m', 'jokeapi', 'mood', 'Chistes (JokeAPI)', 'Chistes por categoría, en español si hay.', [O('Categoría', 'Any', 'Programming', 'Misc', 'Pun', 'Spooky', 'Christmas')],
    async c => {
      let d = await J(`https://v2.jokeapi.dev/joke/${c}?lang=es&safe-mode`);
      if (d.error) d = await J(`https://v2.jokeapi.dev/joke/${c}?safe-mode`);
      return { t: d.joke || `${d.setup}\n${d.delivery}` };
    }),
  ap('m', 'chuck', 'sports_martial_arts', 'Chuck Norris', 'Datos legendarios de Chuck Norris, sin depender de API.', [], async () =>
    ({ t: pick([
      'Chuck Norris cuenta hasta el infinito. Dos veces.',
      'Chuck Norris no duerme: espera.',
      'Una vez Chuck Norris perdió en piedra, papel o tijera… con un vaso.',
      'Las lágrimas de Chuck Norris pueden curar el cáncer. Pero nunca ha llorado.',
      'Chuck Norris contó sus pecados. Todo comenzó con el uno.'
    ]) })),
  ap('m', 'dadjoke', 'face_6', 'Chistes de papá', 'Humor de papá, nivel máximo de cringe.', [], async () =>
    ({ t: pick([
      '¿Por qué los pájaros vuelan hacia el sur? Porque caminar es muy cansado.',
      'A los árboles les gusta internet, siempre están en la red.',
      '¿Qué le dice una pared a otra? Nos vemos en la esquina.',
      '¿Por qué el libro de matemáticas estaba triste? Porque tenía demasiados problemas.',
      'Mi dieta es como el español: lleva acento.'
    ]) })),
  ap('m', 'officialjoke', 'theater_comedy', 'Chistes con remate', 'Preguntas y remates totalmente locales.', [], async () =>
    ({ t: pick([
      '¿Qué hace una abeja en el gimnasio?\n¡Zum-ba!',
      '¿Por qué el tomate se puso rojo?\nPorque vio la ensalada vestida.',
      '¿Qué hace una vaca con los ojos cerrados?\nLeche concentrada.',
      '¿Qué le dijo un gusano a otro gusano?\nVoy a dar una vuelta a la manzana.'
    ]) })),

  // ---- Anime y personajes ----
  ap('a', 'waifupics', 'favorite', 'Waifu.pics', 'Imágenes anime SFW por categoría.', [O('Tipo', 'waifu', 'neko', 'shinobu', 'megumin', 'hug', 'kiss', 'pat', 'smile', 'happy', 'wink', 'dance', 'cry', 'bonk', 'cuddle', 'poke', 'slap')],
    async t => ({ img: (await J(`https://api.waifu.pics/sfw/${t}`)).url })),
  ap('a', 'nekosbest', 'pets', 'Nekos.best', 'Arte y GIFs anime SFW con crédito.', [O('Categoría', 'neko', 'waifu', 'husbando', 'kitsune', 'hug', 'pat', 'smile', 'wave', 'dance', 'cry', 'laugh', 'blush', 'happy', 'think', 'thumbsup')],
    async c => { const r = (await J(`https://nekos.best/api/v2/${c}`)).results[0]; return { t: r.anime_name || r.artist_name || '', img: r.url }; }),
  ap('a', 'animerandom', 'live_tv', 'Anime al azar', 'Un anime aleatorio con nota y sinopsis (Jikan/MAL).', [],
    async () => { const d = (await J('https://api.jikan.moe/v4/random/anime')).data; const synopsis = await translateText(d.synopsis || 'Sin sinopsis'); return { t: `${d.title} · ★${d.score ?? '—'} · ${d.episodes ?? '?'} eps\n${synopsis.slice(0, 320)}…`, img: d.images.jpg.image_url }; }),
  ap('a', 'mangarandom', 'menu_book', 'Manga/manhwa al azar', 'Un manga, manhwa o novela aleatoria (Jikan/MAL).', [],
    async () => { const d = (await J('https://api.jikan.moe/v4/random/manga')).data; const synopsis = await translateText(d.synopsis || 'Sin sinopsis'); return { t: `${d.title} (${d.type}) · ★${d.score ?? '—'} · ${d.chapters ?? '?'} caps\n${synopsis.slice(0, 320)}…`, img: d.images.jpg.image_url }; }),
  ap('a', 'animechar', 'person_search', 'Personaje anime al azar', 'Personaje aleatorio de MyAnimeList.', [],
    async () => { const d = (await J('https://api.jikan.moe/v4/random/characters')).data; return { t: `${d.name}\n❤ ${d.favorites} favoritos`, img: d.images.jpg.image_url }; }),
  ap('a', 'animetop', 'emoji_events', 'Top de MAL', 'Uno al azar del top 25 de anime o manga.', [O('Tipo', 'anime', 'manga')],
    async t => { const d = pick((await J(`https://api.jikan.moe/v4/top/${t}?limit=25`)).data); return { t: `#${d.rank} ${d.title} · ★${d.score}`, img: d.images.jpg.image_url }; }),
  ap('a', 'animesearch', 'search', 'Buscar anime', 'Busca cualquier anime por nombre.', [I('Nombre', 'Solo Leveling')],
    async q => { const d = (await J(`https://api.jikan.moe/v4/anime?q=${enc(q || 'naruto')}&limit=1`)).data[0]; const status = ES_WORDS[String(d.status).toLowerCase().replace(/ /g, '')] || d.status; const synopsis = await translateText(d.synopsis || 'Sin sinopsis'); return { t: `${d.title} · ★${d.score ?? '—'} · ${d.episodes ?? '?'} eps · ${status}\n${synopsis.slice(0, 320)}…`, img: d.images.jpg.image_url }; }),
  ap('a', 'pokemon', 'pets', 'Pokédex', 'Busca un Pokémon por nombre o número (vacío = al azar).', [I('Nombre o número', 'pikachu')],
    async q => { const d = await J(`https://pokeapi.co/api/v2/pokemon/${(q || rnd(1, 1025)).toString().toLowerCase()}`); const species = await J(`https://pokeapi.co/api/v2/pokemon-species/${d.id}`); const nameES = (species.names.find(x => x.language.name === 'es') || {}).name || d.name; const types = d.types.map(x => ES_WORDS[x.type.name] || x.type.name); return { t: `#${d.id} ${nameES.toUpperCase()}\nTipo: ${types.join('/')} · ${d.height / 10} m · ${d.weight / 10} kg`, img: d.sprites.other['official-artwork'].front_default }; }),
  ap('a', 'rickmorty', 'science', 'Rick y Morty', 'Personaje aleatorio de la serie.', [],
    async () => { const d = await J(`https://rickandmortyapi.com/api/character/${rnd(1, 826)}`); const estado = ES_WORDS[d.status.toLowerCase()] || d.status; const especie = ES_WORDS[d.species.toLowerCase()] || d.species; return { t: `${d.name} · ${estado} · ${especie}\nOrigen: ${d.origin.name}`, img: d.image }; }),
  ap('a', 'ghibli', 'movie', 'Studio Ghibli', 'Una película aleatoria de Ghibli.', [],
    async () => { const films = [
      ['Mi vecino Totoro', 'Dos hermanas conocen a los espíritus del bosque.', '1988'],
      ['El viaje de Chihiro', 'Una niña entra en un mundo mágico gobernado por espíritus.', '2001'],
      ['La princesa Mononoke', 'Una batalla entre la naturaleza y la humanidad.', '1997'],
      ['Castillo en el cielo', 'Dos jóvenes buscan una ciudad flotante legendaria.', '1986'],
      ['Porco Rosso', 'Un piloto italiano vive bajo una peculiar transformación.', '1992'],
      ['El castillo ambulante', 'Una joven se une a un mago en un castillo mágico.', '2004']
    ]; const d = pick(films); return { t: `${d[0]} · ${d[2]}\n${d[1]}`, img: null }; }),

  // ---- Animales ----
  ap('z', 'dog', 'cruelty_free', 'Perritos', 'Un perrito aleatorio (dog.ceo).', [], async () => ({ img: (await J('https://dog.ceo/api/breeds/image/random')).message })),
  ap('z', 'cat', 'sound_detection_dog_barking', 'Gatitos', 'Un gatito aleatorio (TheCatAPI).', [], async () => ({ img: (await J('https://api.thecatapi.com/v1/images/search'))[0].url })),
  ap('z', 'fox', 'pest_control_rodent', 'Zorritos', 'Un zorro aleatorio.', [], async () => ({ img: (await J('https://randomfox.ca/floof/')).image })),
  ap('z', 'duck', 'flutter_dash', 'Patitos', 'Un pato aleatorio.', [], async () => ({ img: (await J('https://random-d.uk/api/v2/random')).url })),
  ap('z', 'catfact', 'psychology_alt', 'Datos de gatos', 'Un dato curioso sobre gatos.', [], async () => ({ t: pick([
    'Los gatos pueden hacer más de cien sonidos diferentes.',
    'Los bigotes de un gato ayudan a medir espacios estrechos.',
    'Un gato adulto suele dormir entre doce y dieciséis horas al día.',
    'Las huellas de la nariz de un gato son únicas, como las huellas humanas.',
    'Los gatos pueden girar las orejas casi 180 grados.'
  ]) })),

  // ---- Frases y datos ----
  ap('t', 'dummyquote', 'format_quote', 'Frases inspiradoras', 'Cita aleatoria traducida al español.', [], async () => { const d = await J('https://dummyjson.com/quotes/random'); const quote = await translateText(d.quote); return { t: `"${quote}" — ${d.author}` }; }),
  ap('t', 'advice', 'lightbulb', 'Consejo al azar', 'Una idea útil seleccionada localmente.', [], async () => ({ t: pick([
    'Hacer lo importante antes de abrir redes sociales puede cambiar tu día.',
    'Si algo te preocupa mucho, escríbelo y divide el problema en pasos pequeños.',
    'Descansar también es avanzar.',
    'Pide ayuda antes de que el problema se vuelva demasiado pesado.',
    'Aprende una cosa nueva con veinte minutos al día.'
  ]) })),
  ap('t', 'affirm', 'self_improvement', 'Afirmaciones', 'Una afirmación positiva para hoy.', [], async () => ({ t: pick([
    'Soy capaz de avanzar con paciencia y constancia.',
    'Cada pequeño paso cuenta.',
    'Me merezco descansar sin sentir culpa.',
    'Confío en mi capacidad para resolver lo que venga.',
    'Hoy elijo cuidar mi mente y mi cuerpo.'
  ]) })),
  ap('t', 'kanye', 'mic', 'Frases célebres', 'Citas inspiradoras de personajes conocidos.', [], async () => ({ t: pick([
    '“La única forma de hacer un gran trabajo es amar lo que haces.” — Steve Jobs',
    '“El éxito es aprender a ir de fracaso en fracaso sin perder el entusiasmo.” — Winston Churchill',
    '“Lo que no te mata te hace más fuerte.” — Friedrich Nietzsche',
    '“El futuro pertenece a quienes creen en la belleza de sus sueños.” — Eleanor Roosevelt'
  ]) })),
  ap('t', 'fact', 'school', 'Dato inútil', 'Un dato curioso e inútil.', [], async () => ({ t: pick([
    'Las huellas dactilares también existen en los pies.',
    'Los tiburones existen desde hace más tiempo que los dinosaurios.',
    'Las nubes pueden pesar más de un millón de kilos.',
    'El pulpo tiene tres corazones.',
    'La miel no se echa a perder si se conserva bien cerrada.'
  ]) })),
  ap('t', 'wiki', 'public', 'Wikipedia al azar', 'Un artículo aleatorio en español.', [],
    async () => { const d = await J('https://es.wikipedia.org/api/rest_v1/page/random/summary'); return { t: `${d.title}\n${d.extract.slice(0, 400)}…\n${d.content_urls.desktop.page}`, img: d.thumbnail && d.thumbnail.source }; }),
  ap('t', 'trivia', 'quiz', 'Trivia', 'Pregunta de cultura general traducida al español.', [],
    async () => { const d = (await J('https://opentdb.com/api.php?amount=1&type=multiple&lang=es')).results[0]; const question = await translateText(dec(d.question)); const options = await Promise.all([...d.incorrect_answers, d.correct_answer].sort().map(x => translateText(dec(x)))); const answer = await translateText(dec(d.correct_answer)); return { t: `${question}\n\nOpciones: ${options.join(' · ')}\n\nRespuesta: ${answer}` }; }),
  ap('t', 'onthisday', 'event', 'Un día como hoy', 'Hechos históricos de la fecha de hoy.', [],
    async () => { const n = new Date(); const d = await J(`https://es.wikipedia.org/api/rest_v1/feed/onthisday/events/${n.getMonth() + 1}/${n.getDate()}`); const e = pick(d.events); return { t: `${e.year}: ${e.text}` }; }),
  ap('t', 'rhymes', 'music_note', 'Rimas', 'Palabras que riman con la tuya (español).', [I('Palabra', 'luna')],
    async w => { const d = await J(`https://api.datamuse.com/words?rel_rhy=${enc(w || 'luna')}&v=es&max=30`); if (!d.length) throw 0; return { t: d.map(x => x.word).join(', ') }; }),

  // ---- Mundo y utilidades ----
  ap('w', 'weather', 'partly_cloudy_day', 'Clima por ciudad', 'Clima actual de cualquier ciudad (Open-Meteo).', [I('Ciudad', 'Ciudad de México')],
    async c => {
      const g = (await J(`https://geocoding-api.open-meteo.com/v1/search?name=${enc(c || 'Tokyo')}&count=1&language=es`)).results[0];
      const w = (await J(`https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&current=temperature_2m,wind_speed_10m,relative_humidity_2m`)).current;
      return { t: `${g.name}, ${g.country}\n🌡 ${w.temperature_2m}°C · 💧 ${w.relative_humidity_2m}% · 💨 ${w.wind_speed_10m} km/h` };
    }),
  ap('w', 'fx', 'currency_exchange', 'Convertidor de divisas', 'Tipos de cambio actualizados.', [I('Monto', '100', '100'), O('De', ...MON), O('A', ...MON.slice().reverse())],
    async (m, a, b) => { const d = await J(`https://open.er-api.com/v6/latest/${a}`); const r = d.rates[b]; return { t: `${m || 1} ${a} = ${(parseFloat(m || 1) * r).toFixed(2)} ${b}\n(1 ${a} = ${r} ${b})` }; }),
  ap('w', 'crypto', 'currency_bitcoin', 'Precios cripto', 'Bitcoin, Ethereum, Solana y Dogecoin.', [],
    async () => { const d = await J('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,dogecoin&vs_currencies=usd,mxn'); return { t: Object.entries(d).map(([k, v]) => `${k}: $${v.usd} USD · $${v.mxn} MXN`).join('\n') }; }),
  ap('w', 'apod', 'rocket_launch', 'Foto del día (NASA)', 'La imagen astronómica del día.', [],
    async () => { const d = await J('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY'); const title = await translateText(d.title); const explanation = await translateText(d.explanation || ''); return { t: `${title}\n${explanation.slice(0, 300)}…`, img: d.media_type === 'image' ? d.url : null }; }),
  ap('w', 'country', 'flag', 'Info de países', 'Capital, población e idiomas de un país.', [I('País', 'Japón')],
    async n => { const d = (await J(`https://restcountries.com/v3.1/translation/${enc(n || 'Japon')}?fields=name,capital,population,region,flags,languages`))[0]; return { t: `${d.name.common}\nCapital: ${(d.capital || ['—'])[0]} · ${d.region}\nPoblación: ${d.population.toLocaleString('es')}\nIdiomas: ${Object.values(d.languages || {}).join(', ')}`, img: d.flags.png }; }),
  ap('w', 'github', 'code', 'Perfil de GitHub', 'Mira el perfil público de un usuario.', [I('Usuario', 'torvalds')],
    async u => { const d = await J(`https://api.github.com/users/${enc(u || 'torvalds')}`); return { t: `${d.name || d.login}\nRepos: ${d.public_repos} · Seguidores: ${d.followers}\n${d.bio || ''}`, img: d.avatar_url }; }),
  ap('w', 'agify', 'cake', 'Adivina edad y país', 'Estima edad y nacionalidad según un nombre.', [I('Nombre', 'Sakura')],
    async n => { const q = enc(n || 'Luna'); const [a, c] = await Promise.all([J(`https://api.agify.io?name=${q}`), J(`https://api.nationalize.io?name=${q}`)]); return { t: `${n || 'Luna'}: edad estimada ${a.age ?? '?'}\nPaíses probables: ${c.country.slice(0, 3).map(x => x.country_id + ' ' + (x.probability * 100 | 0) + '%').join(', ')}` }; }),
  ap('w', 'randomuser', 'badge', 'Persona ficticia', 'Perfil aleatorio con foto (para pruebas o ideas).', [],
    async () => { const u = (await J('https://randomuser.me/api/')).results[0]; return { t: `${u.name.first} ${u.name.last}\n${u.email}\n${u.location.city}, ${u.location.country}`, img: u.picture.large }; }),
  ap('w', 'cocktail', 'local_bar', 'Cóctel al azar', 'Receta de cóctel aleatoria.', [],
    async () => { const d = (await J('https://www.thecocktaildb.com/api/json/v1/1/random.php')).drinks[0]; const instructions = d.strInstructionsES || await translateText(d.strInstructions); return { t: `${d.strDrink}\n${instructions.slice(0, 300)}`, img: d.strDrinkThumb }; }),
  ap('w', 'meal', 'restaurant', 'Receta al azar', 'Plato aleatorio con instrucciones traducidas.', [],
    async () => { const d = (await J('https://www.themealdb.com/api/json/v1/1/random.php')).meals[0]; const instructions = await translateText(d.strInstructions); return { t: `${d.strMeal} · ${d.strArea}\n${instructions.slice(0, 350)}…`, img: d.strMealThumb }; }),
  ap('w', 'qr', 'qr_code_2', 'Código QR', 'Convierte texto o enlace en QR.', [I('Texto o enlace', 'https://')],
    async t => ({ img: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${enc(t || 'Tsuki no Tensha')}` })),
  ap('w', 'robohash', 'smart_toy', 'Robots y monstruos', 'Avatar único por semilla (RoboHash).', [I('Semilla', 'tsuki'), O('Set', 'set1', 'set2', 'set3', 'set4', 'set5')],
    async (s, set) => ({ t: s || 'tsuki', img: `https://robohash.org/${enc(s || 'tsuki')}.png?set=${set}&size=300x300` })),
  ap('w', 'picsum', 'landscape', 'Foto aleatoria', 'Foto de stock por semilla (Picsum).', [I('Semilla (opcional)', 'luna')],
    async s => ({ img: `https://picsum.photos/seed/${enc(s || rnd(1, 99999))}/700/450` }))
];

/* ---------- Memegen: +200 plantillas / imagen propia ---------- */
const memePlus = {
  g: 'm', id: 'memeplus', icon: 'photo_library', name: 'Memegen: todas las plantillas',
  desc: 'Cientos de plantillas con buscador, o usa tu propia imagen por URL.',
  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="row">
          <div class="field"><label>Buscar plantilla</label><input id="q" placeholder="drake, doge, success…"></div>
          <div class="field"><label>Plantilla</label><select id="tpl"><option value="drake">Drake</option></select></div>
        </div>
        <div class="row">
          <div class="field"><label>Texto arriba</label><input id="t1" placeholder="Texto 1"></div>
          <div class="field"><label>Texto abajo</label><input id="t2" placeholder="Texto 2"></div>
        </div>
        <div class="field"><label>O tu imagen (URL, opcional)</label><input id="bg" placeholder="https://…/imagen.jpg"></div>
        <div class="btn-row">
          <button class="btn filled" id="go"><span class="material-symbols-outlined">auto_awesome</span>Generar</button>
          <button class="btn tonal" id="dl"><span class="material-symbols-outlined">download</span>Descargar</button>
        </div>
      </div>
      <div class="api-preview" id="box"></div>`;
    const box = $('#box', el), sel = $('#tpl', el); let all = [], url = '';
    const fill = q => {
      const f = all.filter(t => !q || (t.name + t.id).toLowerCase().includes(q)).slice(0, 300);
      sel.innerHTML = f.map(t => `<option value="${t.id}">${t.name}</option>`).join('') || '<option value="drake">Drake</option>';
    };
    J('https://api.memegen.link/templates').then(d => { all = d; fill(''); toast(d.length + ' plantillas cargadas'); }).catch(() => toast('Usando plantilla básica'));
    $('#q', el).oninput = e => fill(e.target.value.trim().toLowerCase());
    const sl = s => s.trim() ? enc(s.trim().replace(/_/g, '__').replace(/-/g, '--').replace(/\?/g, '~q').replace(/&/g, '~a').replace(/%/g, '~p').replace(/#/g, '~h').replace(/\//g, '~s').replace(/ /g, '_')) : '_';
    $('#go', el).onclick = () => {
      const bg = $('#bg', el).value.trim(), id = bg ? 'custom' : sel.value;
      url = `https://api.memegen.link/images/${id}/${sl($('#t1', el).value)}/${sl($('#t2', el).value)}.png` + (bg ? `?background=${enc(bg)}` : '');
      loadImg(box, url, 'Meme'); bump('memeplus', 'Memegen: ' + id);
    };
    $('#dl', el).onclick = () => url ? dlUrl(url, 'tsuki-meme.png') : toast('Genera un meme primero');
  }
};

/* ---------- Más modelos: comparar imágenes IA ---------- */
const comparaIA = {
  g: 'm', id: 'comparaia', icon: 'compare', name: 'Comparar modelos de imagen IA',
  desc: 'Un mismo prompt en varios modelos (Flux, Turbo, GPT Image) lado a lado.',
  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="field"><label>Prompt (inglés funciona mejor)</label><textarea id="p" rows="2" placeholder="a silver-haired angel under the moon, manhwa style"></textarea></div>
        <div class="btn-row"><button class="btn filled" id="go"><span class="material-symbols-outlined">auto_awesome</span>Comparar</button></div>
      </div>
      <div class="api-preview" id="box" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px"></div>`;
    $('#go', el).onclick = () => {
      const p = $('#p', el).value.trim(); if (!p) return toast('Escribe un prompt primero');
      const seed = rnd(1, 999999), box = $('#box', el);
      box.innerHTML = ['flux', 'turbo', 'gptimage'].map(m => `<figure style="margin:0;text-align:center"><img style="max-width:100%;border-radius:12px" alt="${m}" src="https://image.pollinations.ai/prompt/${enc(p)}?width=512&height=512&model=${m}&nologo=true&seed=${seed}"><figcaption><small>${m}</small></figcaption></figure>`).join('');
      bump('comparaia', 'Comparación IA: ' + p.slice(0, 40));
    };
  }
};

/* ---------- Más modelos: chat de texto con varios LLM ---------- */
const chatIA = {
  g: 'w', id: 'chatia', icon: 'forum', name: 'Chat IA (varios modelos)',
  desc: 'Pregunta a distintos modelos de lenguaje con personalidades.',
  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="row">
          <div class="field"><label>Modelo</label><select id="m"><option>openai</option><option>mistral</option><option>llama</option><option>deepseek</option><option>qwen-coder</option></select></div>
          <div class="field"><label>Personalidad</label><select id="s"><option>Asistente útil</option><option>Senpai tsundere</option><option>Maestro zen</option><option>Pirata</option><option>Profesor estricto</option></select></div>
        </div>
        <div class="field"><label>Mensaje</label><textarea id="p" rows="3" placeholder="Recomiéndame un manhwa de acción"></textarea></div>
        <div class="out" id="o">Escribe algo y pulsa Enviar…</div>
        <div class="btn-row">
          <button class="btn filled" id="go"><span class="material-symbols-outlined">send</span>Enviar</button>
          <button class="btn tonal" id="cp"><span class="material-symbols-outlined">content_copy</span>Copiar</button>
        </div>
      </div>`;
    const o = $('#o', el);
    $('#cp', el).onclick = () => copy(o.textContent);
    $('#go', el).onclick = async () => {
      const p = $('#p', el).value.trim(); if (!p) return toast('Escribe un mensaje');
      const sys = `Responde siempre en español, breve. Personalidad: ${$('#s', el).value}.`;
      o.textContent = 'Pensando…';
      try {
        const r = await fetch(`https://text.pollinations.ai/${enc(p)}?model=${$('#m', el).value}&system=${enc(sys)}`);
        if (!r.ok) throw 0; o.textContent = await r.text(); bump('chatia', 'Chat IA: ' + p.slice(0, 40));
      } catch (e) { o.textContent = 'Ese modelo no respondió. Prueba con otro.'; }
    };
  }
};

/* ============================================================
   50 FUNCIONES NUEVAS (texto, generadores y calculadoras)
   ============================================================ */
const L = (g, id, icon, name, desc, inputs, fn) => Object.assign(textTool({ id, icon, name, desc, inputs, fn }), { g });
const TX = I('Texto', 'Escribe aquí…');
const MORSE = { a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....', i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.', q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-', y: '-.--', z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.' };
const strip = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const num = (v, d = 0) => isNaN(parseFloat(v)) ? d : parseFloat(v);
const words = s => s.split(/[\s,;\n]+/).filter(Boolean);
const list = s => s.split(/[,;\n]+/).map(x => x.trim()).filter(Boolean);
const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
const hex = () => '#' + rnd(0, 16777216).toString(16).padStart(6, '0').toUpperCase();
const dateOf = s => { const d = new Date(s + 'T00:00:00'); return isNaN(d) ? null : d; };

const FUNCS = [
  // ---- Texto y códigos (20) ----
  L('x', 'mayus', 'text_fields', 'Mayúsculas y minúsculas', 'Convierte entre MAYÚSCULAS, minúsculas, Título y Oración.', [TX, O('Modo', 'MAYÚSCULAS', 'minúsculas', 'Título', 'Oración')],
    (t, m) => { t = t || 'hola tsuki'; return m === 'MAYÚSCULAS' ? t.toUpperCase() : m === 'minúsculas' ? t.toLowerCase() : m === 'Título' ? t.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase()) : t.charAt(0).toUpperCase() + t.slice(1).toLowerCase(); }),
  L('x', 'reves', 'swap_horiz', 'Texto al revés', 'Invierte tu texto letra por letra.', [TX], t => [...(t || 'tsuki no tensha')].reverse().join('')),
  L('x', 'vapor', 'blur_on', 'Texto vaporwave', 'Letras anchas estilo ｖａｐｏｒｗａｖｅ.', [TX],
    t => [...(t || 'tsuki')].map(c => c === ' ' ? '　' : c.charCodeAt(0) > 32 && c.charCodeAt(0) < 127 ? String.fromCharCode(c.charCodeAt(0) + 0xFEE0) : c).join('')),
  L('x', 'cursiva', 'draw', 'Letras elegantes', 'Texto en cursiva decorativa 𝓪𝓼𝓲.', [TX],
    t => [...(t || 'tsuki no tensha')].map(c => /[A-Z]/.test(c) ? String.fromCodePoint(0x1D4D0 + c.charCodeAt(0) - 65) : /[a-z]/.test(c) ? String.fromCodePoint(0x1D4EA + c.charCodeAt(0) - 97) : c).join('')),
  L('x', 'cesar', 'lock', 'Cifrado César', 'Cifra o descifra con desplazamiento (negativo = descifrar).', [TX, I('Desplazamiento', '3', '3')],
    (t, n) => { const k = ((num(n, 3) % 26) + 26) % 26; return strip(t || 'hola mundo').replace(/[a-z]/gi, c => { const b = c <= 'Z' ? 65 : 97; return String.fromCharCode((c.charCodeAt(0) - b + k) % 26 + b); }); }),
  L('x', 'morse', 'radio', 'Código Morse', 'Texto ↔ Morse.', [TX, O('Modo', 'Texto → Morse', 'Morse → Texto')],
    (t, m) => { if (m === 'Texto → Morse') return strip((t || 'sos').toLowerCase()).split('').map(c => c === ' ' ? '/' : MORSE[c] || '').filter(Boolean).join(' '); const r = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k])); return (t || '... --- ...').split(' / ').map(w => w.split(' ').map(x => r[x] || '?').join('')).join(' '); }),
  L('x', 'binario', 'code', 'Texto a binario', 'Texto ↔ binario de 8 bits.', [TX, O('Modo', 'Texto → Binario', 'Binario → Texto')],
    (t, m) => m === 'Texto → Binario' ? [...new TextEncoder().encode(t || 'hola')].map(b => b.toString(2).padStart(8, '0')).join(' ') : new TextDecoder().decode(new Uint8Array((t || '01101000 01101111 01101100 01100001').split(/\s+/).map(b => parseInt(b, 2))))),
  L('x', 'base64', 'data_object', 'Base64', 'Codifica o decodifica en Base64.', [TX, O('Modo', 'Codificar', 'Decodificar')],
    (t, m) => { try { return m === 'Codificar' ? btoa(unescape(enc(t || 'hola'))) : decodeURIComponent(escape(atob(t || 'aG9sYQ=='))); } catch (e) { return 'Entrada no válida'; } }),
  L('x', 'banderas', 'emoji_flags', 'Letras en emojis', 'Convierte letras en indicadores regionales 🇦🇧🇨.', [TX],
    t => [...strip((t || 'tsuki').toUpperCase())].map(c => /[A-Z]/.test(c) ? String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65) : c).join(' ')),
  L('x', 'sponge', 'sentiment_neutral', 'Texto burlón', 'Alterna mayúsculas y minúsculas (sPoNgEbOb).', [TX], t => [...(t || 'esto es un meme')].map((c, i) => i % 2 ? c.toLowerCase() : c.toUpperCase()).join('')),
  L('x', 'contador', 'pin', 'Contador de texto', 'Palabras, caracteres, oraciones y tiempo de lectura.', [TX],
    t => { t = t || 'Escribe o pega tu texto'; const w = words(t).length; return `Palabras: ${w}\nCaracteres: ${t.length} (${t.replace(/\s/g, '').length} sin espacios)\nOraciones: ${(t.match(/[.!?]+/g) || []).length || 1}\nLectura: ~${Math.max(1, Math.round(w / 200 * 60))} s`; }),
  L('x', 'slug', 'link', 'Texto a URL (slug)', 'Convierte un título en un slug limpio.', [TX], t => strip(t || 'Mi Título Genial!').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')),
  L('x', 'casos', 'abc', 'camelCase / snake_case', 'Cambia el estilo de nombres de variables.', [TX, O('Estilo', 'camelCase', 'snake_case', 'kebab-case', 'PascalCase')],
    (t, e) => { const w = strip(t || 'mi variable genial').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean); const C = s => s[0].toUpperCase() + s.slice(1); return e === 'camelCase' ? w[0] + w.slice(1).map(C).join('') : e === 'snake_case' ? w.join('_') : e === 'kebab-case' ? w.join('-') : w.map(C).join(''); }),
  L('x', 'sinacentos', 'spellcheck', 'Quitar acentos', 'Elimina tildes y diacríticos.', [TX], t => strip(t || 'canción año última')),
  L('x', 'repetir', 'repeat', 'Repetir texto', 'Repite una palabra o frase N veces.', [TX, I('Veces', '5', '5')], (t, n) => Array(Math.min(200, Math.max(1, num(n, 5) | 0))).fill(t || 'jaja').join(' ')),
  L('x', 'lorem', 'notes', 'Lorem ipsum', 'Texto de relleno por párrafos.', [I('Párrafos', '2', '2')],
    n => { const b = 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi'.split(' '); return Array.from({ length: Math.min(10, Math.max(1, num(n, 2) | 0)) }, () => { const s = Array.from({ length: rnd(30, 55) }, () => pick(b)).join(' '); return s[0].toUpperCase() + s.slice(1) + '.'; }).join('\n\n'); }),
  L('x', 'palindromo', 'compare_arrows', 'Detector de palíndromos', 'Revisa si una frase se lee igual al revés.', [TX],
    t => { const s = strip(t || 'Anita lava la tina').toLowerCase().replace(/[^a-z0-9]/g, ''); return s === [...s].reverse().join('') ? '✅ Sí, es un palíndromo' : '❌ No es un palíndromo'; }),
  L('x', 'jeringoza', 'record_voice_over', 'Jeringoza', 'Habla en pa-pa-la-pa-bra secreta.', [TX], t => (t || 'hola amigos').replace(/[aeiouáéíóú]/gi, v => v + 'p' + strip(v).toLowerCase())),
  L('x', 'uwu', 'pets', 'Traductor UwU', 'Convierte tu texto a modo uwu.', [TX],
    t => (t || 'hola, como estas').toLowerCase().replace(/[rl]/g, 'w').replace(/n([aeiou])/g, 'ny$1') + ' ' + pick(['uwu', 'owo', '>w<', '(◕‿◕)'])),
  L('x', 'hashtags', 'tag', 'Generador de hashtags', 'Palabras → #hashtags listos para publicar.', [TX],
    t => words(strip(t || 'anime manhwa noche luna')).map(w => '#' + w[0].toUpperCase() + w.slice(1)).join(' ')),
  L('x', 'emojicombo', 'add_reaction', 'Combo de emojis', 'Una combinación aleatoria de emojis.', [I('Cantidad', '5', '5')],
    n => Array.from({ length: Math.min(30, Math.max(1, num(n, 5) | 0)) }, () => pick([...'😭😂💀🔥😎👑🌙🌸💢✨🥵🗿💖👀🦋⚔️🎴🍜🐉🌊🍡🎐🫠😈🥺🤡'.match(/\p{Extended_Pictographic}\uFE0F?/gu)])).join('')),

  // ---- Generadores (20) ----
  L('g', 'numero', 'looks_one', 'Número aleatorio', 'Un número entre dos valores.', [I('Mínimo', '1', '1'), I('Máximo', '100', '100')],
    (a, b) => { a = num(a, 1); b = num(b, 100); if (a > b) [a, b] = [b, a]; return String(a + Math.floor(Math.random() * (b - a + 1))); }),
  L('g', 'elegir', 'checklist', 'Elige por mí', 'Escribe opciones separadas por coma y decido.', [I('Opciones', 'pizza, tacos, sushi')],
    t => { const o = list(t || 'pizza, tacos, sushi'); return '🎯 ' + pick(o); }),
  L('g', 'equipos', 'groups', 'Armar equipos', 'Reparte nombres en equipos al azar.', [I('Nombres', 'Ana, Luis, Sofi, Leo, Mar, Teo'), I('Equipos', '2', '2')],
    (t, n) => { const k = Math.max(2, num(n, 2) | 0), q = Array.from({ length: k }, () => []); shuffle(list(t || 'Ana, Luis, Sofi, Leo, Mar, Teo')).forEach((x, i) => q[i % k].push(x)); return q.map((m, i) => `Equipo ${i + 1}: ${m.join(', ')}`).join('\n'); }),
  L('g', 'mezclar', 'shuffle', 'Mezclar lista', 'Reordena una lista al azar.', [I('Lista', 'a, b, c, d, e')], t => shuffle(list(t || 'a, b, c, d, e')).map((x, i) => `${i + 1}. ${x}`).join('\n')),
  L('g', 'color', 'palette', 'Color aleatorio', 'HEX, RGB y HSL de un color al azar.', [],
    () => { const h = hex(), r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5), 16); return `${h}\nrgb(${r}, ${g}, ${b})\n${(r * .299 + g * .587 + b * .114) > 150 ? 'Color claro' : 'Color oscuro'}`; }),
  L('g', 'paleta', 'color_lens', 'Paleta de colores', 'Cinco colores HEX para tu diseño.', [], () => Array.from({ length: 5 }, hex).join('   ')),
  L('g', 'passphrase', 'key', 'Contraseña con palabras', 'Frase de contraseña fácil de recordar.', [I('Palabras', '4', '4')],
    n => { const w = ['luna', 'espada', 'dragon', 'sakura', 'nube', 'trueno', 'zorro', 'castillo', 'estrella', 'sombra', 'fuego', 'viento', 'cristal', 'gato', 'rio', 'monte', 'ninja', 'cometa', 'bosque', 'ancla']; return Array.from({ length: Math.min(8, Math.max(2, num(n, 4) | 0)) }, () => pick(w)).join('-') + '-' + rnd(10, 99); }),
  L('g', 'uuid', 'fingerprint', 'Generador de UUID', 'Un identificador único v4.', [], () => crypto.randomUUID()),
  L('g', 'gamer', 'sports_esports', 'Nick de gamer', 'Apodos épicos para tus partidas.', [I('Palabra base (opcional)', 'tsuki')],
    t => { const a = ['Dark', 'Shadow', 'Neo', 'Lunar', 'Ultra', 'Toxic', 'Silent', 'Crimson', 'Void', 'Hyper'], b = ['Wolf', 'Blade', 'Angel', 'Ninja', 'Reaper', 'Fox', 'Sensei', 'Storm', 'Phantom', 'Kitsune']; return `${pick(a)}${t ? t[0].toUpperCase() + t.slice(1) : pick(b)}${rnd(1, 99)}_xX\n${pick(b)}${pick(a)}${rnd(100, 999)}\nx${pick(a)}${pick(b)}x`; }),
  L('g', 'isekai', 'public', 'Nombre isekai', 'Nombre de protagonista reencarnado.', [],
    () => `${pick(['Kazuto', 'Reiji', 'Alden', 'Seraph', 'Ryuken', 'Lucien', 'Arata', 'Zeno'])} von ${pick(['Lunaria', 'Eclipse', 'Valkyr', 'Nightfall', 'Ashenford', 'Starfall'])}, ${pick(['el Sabio Perezoso', 'el Héroe Retirado', 'el Slime Supremo', 'el Último Mago', 'el Gremio sin Rango'])}`),
  L('g', 'tecnica', 'bolt', 'Nombre de técnica', 'Ataques con nombre dramático.', [I('Tu nombre (opcional)', '')],
    t => `${pick(['Gran', 'Secreta', 'Suprema', 'Prohibida', 'Divina'])} ${pick(['Técnica', 'Danza', 'Explosión', 'Respiración', 'Invocación'])} ${pick(['del Dragón Lunar', 'de las Mil Sombras', 'del Ángel Caído', 'de la Luz Carmesí', 'del Vacío Eterno'])}${t ? ' de ' + t : ''}: ${pick(['Primera Forma', 'Segunda Forma', 'Forma Final', 'Despertar'])}`),
  L('g', 'clan', 'shield', 'Nombre de clan o gremio', 'Nombres para tu grupo o servidor.', [],
    () => Array.from({ length: 3 }, () => `${pick(['Alas', 'Garras', 'Sombras', 'Guardianes', 'Hijos', 'Cazadores'])} ${pick(['de la Luna', 'del Eclipse', 'de Cristal', 'del Abismo', 'de Neón', 'Estelares'])}`).join('\n')),
  L('g', 'sinopsis', 'auto_stories', 'Sinopsis de manhwa', 'Premisa aleatoria lista para engancharte.', [],
    () => `${pick(['Un oficinista agotado', 'La villana de una novela', 'Un cazador de rango E', 'Una joven duquesa', 'Un mago sin maná'])} ${pick(['reencarna', 'despierta', 'regresa en el tiempo', 'obtiene un sistema', 'hereda un trono maldito'])} ${pick(['antes de que todo se arruine', 'con recuerdos de su vida pasada', 'en un mundo gobernado por mazmorras', 'para vengarse de su familia', 'y descubre que es el verdadero final boss'])}.`),
  L('g', 'excusa', 'sick', 'Excusa del día', 'Para cuando no quieres ir (úsese con cariño).', [],
    () => `${pick(['Mi gato', 'Mi internet', 'Mi vecino', 'El sistema de mi cuerpo', 'Mi alarma'])} ${pick(['decidió rendirse hoy', 'tuvo un arco de redención', 'se cayó en pleno capítulo final', 'entró en modo ahorro de energía'])}, así que ${pick(['llego tarde', 'no podré ir', 'estaré desaparecido', 'mejor reprogramamos'])}.`),
  L('g', 'piropo', 'favorite', 'Piropo anime', 'Frases cursis con aroma otaku.', [],
    () => pick(['Eres mi final feliz favorito.', 'Contigo hasta el relleno es canon.', 'Si fueras un capítulo, te releería mil veces.', 'Tu sonrisa sube mi nivel de aura.', 'Eres el plot twist que no vi venir.', 'Contigo quiero un arco de slice of life infinito.'])),
  L('g', 'yonunca', 'front_hand', 'Yo nunca nunca', 'Frases para la dinámica del grupo.', [],
    () => 'Yo nunca nunca ' + pick(['he leído un capítulo a las 3 AM', 'he llorado con un anime', 'he fingido entender un plot twist', 'he stalkeado a un ex', 'he mandado un audio de 5 minutos', 'me he quedado dormido en una videollamada', 'he dado spoilers sin querer'])),
  L('g', 'prefieres', 'balance', '¿Qué prefieres?', 'Dilemas para debatir en el grupo.', [],
    () => `¿Qué prefieres?\nA) ${pick(['Poder volar', 'Leer mentes', 'Viajar al pasado', 'Ser invisible'])}\nB) ${pick(['Respirar bajo el agua', 'Hablar con animales', 'Detener el tiempo', 'Nunca dormir'])}`),
  L('g', 'bola8', 'sports_baseball', 'Bola 8 mágica', 'Pregunta y el destino responde.', [I('Tu pregunta', '¿Aprobaré?')],
    () => '🎱 ' + pick(['Sin duda.', 'Todo apunta a que sí.', 'Pregunta más tarde.', 'No cuentes con ello.', 'Mis fuentes dicen que no.', 'Es muy probable.', 'Mejor no decirte ahora.', 'Definitivamente sí.', 'Muy dudoso.'])),
  L('g', 'buenosdias', 'wb_sunny', 'Mensaje de buenos días', 'Saludos para mandar al grupo.', [O('Momento', 'Buenos días', 'Buenas tardes', 'Buenas noches')],
    m => `${m} ${pick(['🌙', '🌸', '✨', '☀️'])} ${pick(['que hoy se te cumplan los capítulos pendientes', 'recuerda hidratarte y descansar', 'ojalá tengas un día sin spoilers', 'tú puedes con todo, protagonista'])}.`),

  // ---- Calculadoras y conversores (10) ----
  L('c', 'numerologia', 'auto_awesome', 'Numerología del nombre', 'Calcula tu número de vida con tu nombre.', [I('Nombre', 'Tsuki')],
    t => { let s = [...strip(t || 'tsuki').toLowerCase().replace(/[^a-z]/g, '')].reduce((a, c) => a + (c.charCodeAt(0) - 96), 0); while (s > 9 && s !== 11 && s !== 22) s = String(s).split('').reduce((a, b) => a + +b, 0); return `Tu número es el ${s}\n${{ 1: 'Líder nato', 2: 'Mediador sensible', 3: 'Creativo y social', 4: 'Constante y práctico', 5: 'Libre y aventurero', 6: 'Protector de todos', 7: 'Místico y analítico', 8: 'Ambicioso', 9: 'Idealista', 11: 'Maestro intuitivo', 22: 'Maestro constructor' }[s]}`; }),
  L('c', 'zodiaco', 'stars', 'Signo zodiacal', 'Descubre tu signo por fecha de nacimiento.', [I('Fecha (AAAA-MM-DD)', '2000-05-21')],
    t => { const d = dateOf(t || '2000-05-21'); if (!d) return 'Fecha no válida'; const m = d.getMonth() + 1, n = d.getDate(), z = [['Capricornio', 1, 19], ['Acuario', 2, 18], ['Piscis', 3, 20], ['Aries', 4, 19], ['Tauro', 5, 20], ['Géminis', 6, 20], ['Cáncer', 7, 22], ['Leo', 8, 22], ['Virgo', 9, 22], ['Libra', 10, 22], ['Escorpio', 11, 21], ['Sagitario', 12, 21], ['Capricornio', 12, 31]]; return '♈ ' + z.find(([, mm, dd]) => m < mm || (m === mm && n <= dd))[0]; }),
  L('c', 'edad', 'cake', 'Edad exacta', 'Años, meses, días y días vividos.', [I('Fecha de nacimiento', '2000-05-21')],
    t => { const b = dateOf(t || '2000-05-21'); if (!b) return 'Fecha no válida'; const n = new Date(); let y = n.getFullYear() - b.getFullYear(), m = n.getMonth() - b.getMonth(), d = n.getDate() - b.getDate(); if (d < 0) { m--; d += 30; } if (m < 0) { y--; m += 12; } return `${y} años, ${m} meses y ${d} días\nDías vividos: ${Math.floor((n - b) / 86400000).toLocaleString('es')}`; }),
  L('c', 'cuentaatras', 'hourglass_top', 'Cuenta regresiva', 'Días que faltan para una fecha.', [I('Fecha (AAAA-MM-DD)', '2026-12-25')],
    t => { const d = dateOf(t || '2026-12-25'); if (!d) return 'Fecha no válida'; const x = Math.ceil((d - new Date().setHours(0, 0, 0, 0)) / 86400000); return x > 0 ? `Faltan ${x} días (${Math.floor(x / 7)} semanas)` : x === 0 ? '¡Es hoy! 🎉' : `Pasó hace ${-x} días`; }),
  L('c', 'propina', 'payments', 'Dividir cuenta y propina', 'Cuánto paga cada quien.', [I('Total', '850', '850'), I('Personas', '4', '4'), I('Propina %', '10', '10')],
    (t, p, pr) => { const tot = num(t) * (1 + num(pr) / 100), n = Math.max(1, num(p, 1) | 0); return `Total con propina: $${tot.toFixed(2)}\nCada quien paga: $${(tot / n).toFixed(2)}`; }),
  L('c', 'descuento', 'sell', 'Calculadora de descuento', 'Precio final y ahorro.', [I('Precio', '1200', '1200'), I('Descuento %', '25', '25')],
    (p, d) => { const a = num(p) * num(d) / 100; return `Ahorras: $${a.toFixed(2)}\nPrecio final: $${(num(p) - a).toFixed(2)}`; }),
  L('c', 'imc', 'monitor_weight', 'Índice de masa corporal', 'Cálculo informativo (no sustituye consejo médico).', [I('Peso (kg)', '65', '65'), I('Altura (cm)', '170', '170')],
    (w, h) => { const m = num(h) / 100, v = num(w) / (m * m); return !isFinite(v) || v <= 0 ? 'Datos no válidos' : `IMC: ${v.toFixed(1)}\n${v < 18.5 ? 'Bajo peso' : v < 25 ? 'Peso normal' : v < 30 ? 'Sobrepeso' : 'Obesidad'} (referencia general)`; }),
  L('c', 'temperatura', 'thermostat', 'Conversor de temperatura', '°C, °F y K.', [I('Valor', '25', '25'), O('De', '°C', '°F', 'K')],
    (v, u) => { v = num(v); const c = u === '°C' ? v : u === '°F' ? (v - 32) * 5 / 9 : v - 273.15; return `${c.toFixed(2)} °C\n${(c * 9 / 5 + 32).toFixed(2)} °F\n${(c + 273.15).toFixed(2)} K`; }),
  L('c', 'unidades', 'straighten', 'Conversor de unidades', 'Longitud, peso y volumen comunes.', [I('Valor', '10', '10'), O('Conversión', 'km → millas', 'millas → km', 'kg → libras', 'libras → kg', 'cm → pulgadas', 'pulgadas → cm', 'litros → galones', 'galones → litros')],
    (v, c) => { const f = { 'km → millas': .621371, 'millas → km': 1.609344, 'kg → libras': 2.204623, 'libras → kg': .453592, 'cm → pulgadas': .393701, 'pulgadas → cm': 2.54, 'litros → galones': .264172, 'galones → litros': 3.785412 }[c]; return `${num(v)} ${c.split(' → ')[0]} = ${(num(v) * f).toFixed(3)} ${c.split(' → ')[1]}`; }),
  L('c', 'horamundial', 'schedule', 'Hora mundial', 'Qué hora es ahora en otras ciudades.', [O('Ciudad', 'Tokio', 'Seúl', 'Ciudad de México', 'Madrid', 'Buenos Aires', 'Nueva York', 'Los Ángeles', 'Londres', 'Sídney')],
    c => { const z = { 'Tokio': 'Asia/Tokyo', 'Seúl': 'Asia/Seoul', 'Ciudad de México': 'America/Mexico_City', 'Madrid': 'Europe/Madrid', 'Buenos Aires': 'America/Argentina/Buenos_Aires', 'Nueva York': 'America/New_York', 'Los Ángeles': 'America/Los_Angeles', 'Londres': 'Europe/London', 'Sídney': 'Australia/Sydney' }[c]; return `${c}: ` + new Date().toLocaleString('es', { timeZone: z, dateStyle: 'full', timeStyle: 'short' }); })
];

const extras = [...APIS, memePlus, comparaIA, chatIA, ...FUNCS];
const GN = { m: 'Memes, humor e imagen IA', a: 'Anime y personajes (API)', z: 'Animales (API)', t: 'Frases y datos (API)', w: 'Mundo y utilidades (API)', x: 'Texto y códigos', g: 'Generadores', c: 'Calculadoras y conversores' };
const NAVX = Object.keys(GN).map(k => [GN[k], extras.filter(t => t.g === k).map(t => t.id)]);

/* ============================================================
   TEXTO ANIMADO → GIF (codificador propio, sin librerías)
   ============================================================ */
function lzwEncode(idx, minCode) {
  const clear = 1 << minCode, eoi = clear + 1, out = [];
  let cur = 0, bits = 0, size = minCode + 1, next = eoi + 1, dict = new Map();
  const emit = c => { cur |= c << bits; bits += size; while (bits >= 8) { out.push(cur & 255); cur >>= 8; bits -= 8; } };
  emit(clear);
  let prefix = idx[0];
  for (let i = 1; i < idx.length; i++) {
    const k = idx[i], key = prefix * 256 + k, v = dict.get(key);
    if (v !== undefined) { prefix = v; continue; }
    emit(prefix);
    if (next === 4096) { emit(clear); dict.clear(); next = eoi + 1; size = minCode + 1; }
    else { if (next >= (1 << size)) size++; dict.set(key, next++); }
    prefix = k;
  }
  emit(prefix); emit(eoi);
  if (bits > 0) out.push(cur & 255);
  return out;
}

function gifEncode(frames, w, h, delay) {
  const out = [], b = (...v) => { for (const x of v) out.push(x); }, s2 = n => b(n & 255, (n >> 8) & 255);
  for (const c of 'GIF89a') b(c.charCodeAt(0));
  s2(w); s2(h); b(0xF7, 0, 0);
  for (let i = 0; i < 256; i++) {
    if (i < 216) b((i / 36 | 0) * 51, ((i / 6 | 0) % 6) * 51, (i % 6) * 51);
    else { const v = Math.round((i - 216) * 255 / 39); b(v, v, v); }
  }
  b(0x21, 0xFF, 11); for (const c of 'NETSCAPE2.0') b(c.charCodeAt(0)); b(3, 1, 0, 0, 0);
  const idx = new Uint8Array(w * h);
  for (const px of frames) {
    for (let i = 0, j = 0; j < idx.length; i += 4, j++) {
      const r = px[i], g = px[i + 1], bl = px[i + 2];
      const cr = Math.round(r / 51), cg = Math.round(g / 51), cb = Math.round(bl / 51);
      const e1 = (r - cr * 51) ** 2 + (g - cg * 51) ** 2 + (bl - cb * 51) ** 2;
      const gv = Math.round((r + g + bl) / 3 * 39 / 255), gg = Math.round(gv * 255 / 39);
      const e2 = (r - gg) ** 2 + (g - gg) ** 2 + (bl - gg) ** 2;
      idx[j] = e2 < e1 ? 216 + gv : cr * 36 + cg * 6 + cb;
    }
    b(0x21, 0xF9, 4, 4); s2(delay); b(0, 0);
    b(0x2C); s2(0); s2(0); s2(w); s2(h); b(0, 8);
    const data = lzwEncode(idx, 8);
    for (let i = 0; i < data.length; i += 255) { const n = Math.min(255, data.length - i); out.push(n); for (let k = 0; k < n; k++) out.push(data[i + k]); }
    out.push(0);
  }
  out.push(0x3B);
  return Uint8Array.from(out);
}

/* Dibuja un fotograma; p ∈ [0,1) y el bucle es continuo */
function textFrame(ctx, w, h, p, o) {
  const TAU = Math.PI * 2, s = Math.sin(TAU * p), c = Math.cos(TAU * p), color = o.color;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  ctx.fillStyle = o.bg; ctx.fillRect(0, 0, w, h);
  const t = o.text || ' ', chars = [...t], font = f => `700 ${f}px Poppins, "Google Sans", Arial, sans-serif`;
  let fs = h * 0.5; ctx.font = font(fs);
  if (o.effect !== 'deslizar') { const mw = ctx.measureText(t).width; if (mw > w * 0.88) fs = fs * w * 0.88 / mw; }
  ctx.font = font(fs); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const tw = ctx.measureText(t).width, x0 = (w - tw) / 2, cy = h / 2;
  const xs = chars.map((_, i) => ctx.measureText(chars.slice(0, i).join('')).width);
  const letter = (i, dx, dy, fill) => { ctx.fillStyle = fill || color; ctx.fillText(chars[i], x0 + xs[i] + dx, cy + dy); };
  const whole = (dx = 0, dy = 0, fill) => { ctx.fillStyle = fill || color; ctx.fillText(t, x0 + dx, cy + dy); };
  const around = (sx, sy) => { ctx.translate(w / 2, cy); ctx.scale(sx, sy); ctx.translate(-w / 2, -cy); };
  switch (o.effect) {
    case 'rebote': whole(0, -Math.abs(s) * h * 0.18); break;
    case 'temblor': whole(Math.sin(TAU * 8 * p) * h * 0.03, Math.cos(TAU * 7 * p) * h * 0.025); break;
    case 'brillo': ctx.shadowColor = color; ctx.shadowBlur = h * (0.04 + 0.14 * (0.5 + 0.5 * s)); whole(); whole(); break;
    case 'arcoiris': chars.forEach((_, i) => letter(i, 0, 0, `hsl(${(p * 360 + i * 28) % 360} 90% 60%)`)); break;
    case 'giro': around(Math.max(0.03, Math.abs(c)), 1); whole(); break;
    case 'latido': { const k = 1 + 0.12 * (0.5 + 0.5 * s); around(k, k); whole(); break; }
    case 'onda': chars.forEach((_, i) => letter(i, 0, Math.sin(TAU * p + i * 0.7) * h * 0.1)); break;
    case 'escribir': {
      const k = Math.min(chars.length, Math.floor(Math.min(1, p / 0.7) * (chars.length + 1)));
      const part = chars.slice(0, k).join(''); ctx.fillStyle = color; ctx.fillText(part, x0, cy);
      if (Math.floor(p * 8) % 2 === 0) ctx.fillRect(x0 + ctx.measureText(part).width + fs * 0.05, cy - fs * 0.45, fs * 0.06, fs * 0.9);
      break;
    }
    case 'parpadeo': ctx.globalAlpha = p < 0.5 ? 1 : 0.1; whole(); break;
    case 'zoom': { const k = 0.5 + 0.7 * (0.5 - 0.5 * c); around(k, k); whole(); break; }
    case 'deslizar': ctx.fillStyle = color; ctx.fillText(t, w - p * (w + tw), cy); break;
    case 'neon': {
      ctx.globalAlpha = 0.9 + 0.1 * Math.sin(TAU * 3 * p); ctx.shadowColor = color;
      for (const bl of [0.05, 0.1, 0.2]) { ctx.shadowBlur = h * bl; whole(0, 0, '#ffffff'); }
      break;
    }
    case 'glitch': {
      const f = Math.floor(p * 24), r = Math.abs(Math.sin(f * 12.9898) * 43758.5453) % 1, d = r > 0.7 ? (r - 0.5) * h * 0.12 : 0;
      ctx.globalAlpha = 0.85; whole(-d, 0, '#ff2d55'); whole(d, 0, '#00e5ff'); ctx.globalAlpha = 1; whole(r > 0.85 ? d * 0.3 : 0, 0); break;
    }
    case 'caida': chars.forEach((_, i) => {
      const q = Math.min(1, Math.max(0, (p * 1.5 - i / chars.length * 0.6) / 0.45)), e = 1 - Math.pow(1 - q, 3);
      ctx.globalAlpha = q * (p > 0.85 ? 1 - (p - 0.85) / 0.15 : 1); letter(i, 0, -(1 - e) * h * 0.7);
    }); break;
    default: whole();
  }
  ctx.globalAlpha = 1; ctx.shadowBlur = 0;
}

/* ---------- 100 herramientas nuevas: 35 APIs ---------- */
const geo = async c => (await J(`https://geocoding-api.open-meteo.com/v1/search?name=${enc(c || 'Tokyo')}&count=1&language=es`)).results[0];
const LAT = g => `latitude=${g.latitude}&longitude=${g.longitude}`;
const year = new Date().getFullYear();
const TIPOS = ['fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 'dark', 'fairy', 'fighting', 'ghost', 'steel', 'flying', 'poison', 'ground', 'rock', 'bug', 'normal'];

const APIS2 = [
  ap('r', 'bored', 'sports_handball', 'Actividad para el aburrimiento', 'Una idea local de qué hacer ahora.', [], async () => ({ t: pick([
    'Dibuja el paisaje que puedes ver desde tu ventana.',
    'Haz una lista de cinco canciones que te alegren.',
    'Practica cinco minutos de estiramientos.',
    'Escribe una receta inventada con tres ingredientes.',
    'Ordena solo una pequeña parte de tu escritorio.',
    'Lee las primeras páginas de un libro nuevo.'
  ]) })),
  ap('r', 'libro', 'local_library', 'Buscar libro', 'Datos y portada de cualquier libro (Open Library).', [I('Título', 'El principito')],
    async q => { const d = (await J(`https://openlibrary.org/search.json?q=${enc(q || 'el principito')}&limit=1`)).docs[0]; return { t: `${d.title}\n${(d.author_name || ['—']).join(', ')} · ${d.first_publish_year || '?'}`, img: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : null }; }),
  ap('r', 'diccionario', 'menu_book', 'Diccionario', 'Definición de una palabra.', [I('Palabra', 'luna'), O('Idioma', 'es', 'en')],
    async (w, l) => { const d = (await J(`https://api.dictionaryapi.dev/api/v2/entries/${l}/${enc(w || 'luna')}`))[0]; const m = d.meanings[0]; return { t: `${d.word} (${m.partOfSpeech})\n${m.definitions[0].definition}` }; }),
  ap('r', 'wikisearch', 'travel_explore', 'Buscar en Wikipedia', 'Resumen de cualquier tema en español.', [I('Tema', 'Manhwa')],
    async q => { const d = await J(`https://es.wikipedia.org/api/rest_v1/page/summary/${enc((q || 'Manhwa').replace(/ /g, '_'))}`); return { t: `${d.title}\n${d.extract.slice(0, 450)}…`, img: d.thumbnail && d.thumbnail.source }; }),
  ap('r', 'sinonimos', 'sync_alt', 'Sinónimos', 'Palabras parecidas a la tuya.', [I('Palabra', 'bonito')],
    async w => { const d = await J(`https://api.datamuse.com/words?rel_syn=${enc(w || 'bonito')}&v=es&max=25`); if (!d.length) throw 0; return { t: d.map(x => x.word).join(', ') }; }),
  ap('r', 'autocompletar', 'keyboard', 'Autocompletar palabras', 'Sugerencias que empiezan como tu texto.', [I('Inicio', 'mar')],
    async w => { const d = await J(`https://api.datamuse.com/sug?s=${enc(w || 'mar')}&v=es&max=20`); if (!d.length) throw 0; return { t: d.map(x => x.word).join(', ') }; }),
  ap('r', 'nacimientos', 'cake', 'Nacieron un día como hoy', 'Personajes famosos que cumplen años hoy.', [],
    async () => { const n = new Date(), d = await J(`https://es.wikipedia.org/api/rest_v1/feed/onthisday/births/${n.getMonth() + 1}/${n.getDate()}`); const e = pick(d.births); return { t: `${e.year}: ${e.text}` }; }),
  ap('r', 'receta', 'ramen_dining', 'Buscar receta', 'Receta por nombre y con instrucciones traducidas.', [I('Plato', 'pasta')],
    async q => { const data = await J(`https://www.themealdb.com/api/json/v1/1/search.php?s=${enc(q || 'pasta')}`); if (!data.meals) throw 0; const m = pick(data.meals); const instructions = await translateText(m.strInstructions); return { t: `${m.strMeal} · ${m.strArea}\n${instructions.slice(0, 350)}…`, img: m.strMealThumb }; }),
  ap('r', 'coctel', 'wine_bar', 'Buscar cóctel', 'Cóctel por nombre.', [I('Nombre', 'margarita')],
    async q => { const d = pick((await J(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${enc(q || 'margarita')}`)).drinks); return { t: `${d.strDrink}\n${(d.strInstructionsES || d.strInstructions).slice(0, 300)}`, img: d.strDrinkThumb }; }),
  ap('r', 'arte', 'palette', 'Arte al azar', 'Una obra del Art Institute of Chicago.', [],
    async () => { const d = pick((await J(`https://api.artic.edu/api/v1/artworks?page=${rnd(1, 200)}&limit=12&fields=title,artist_display,image_id,date_display`)).data.filter(x => x.image_id)); const title = await translateText(d.title); const date = d.date_display ? await translateText(d.date_display) : ''; return { t: `${title}${date ? ` (${date})` : ''}\n${d.artist_display}`, img: `https://www.artic.edu/iiif/2/${d.image_id}/full/600,/0/default.jpg` }; }),

  ap('p', 'feriados', 'beach_access', 'Feriados del año', 'Días festivos de un país.', [I('País (código)', 'MX', 'MX'), I('Año', String(year), String(year))],
    async (c, y) => { const d = await J(`https://date.nager.at/api/v3/PublicHolidays/${y || year}/${(c || 'MX').toUpperCase()}`); return { t: d.map(x => `${x.date} · ${x.localName}`).join('\n') }; }),
  ap('p', 'proxferiado', 'event_upcoming', 'Próximos feriados', 'Los siguientes días festivos de un país.', [I('País (código)', 'MX', 'MX')],
    async c => { const d = await J(`https://date.nager.at/api/v3/NextPublicHolidays/${(c || 'MX').toUpperCase()}`); return { t: d.slice(0, 6).map(x => `${x.date} · ${x.localName}`).join('\n') }; }),
  ap('p', 'amanecer', 'wb_twilight', 'Amanecer y atardecer', 'Hora del sol en cualquier ciudad.', [I('Ciudad', 'Tokio')],
    async c => { const g = await geo(c), d = (await J(`https://api.open-meteo.com/v1/forecast?${LAT(g)}&daily=sunrise,sunset&timezone=auto&forecast_days=1`)).daily; return { t: `${g.name}, ${g.country}\n🌅 ${d.sunrise[0].slice(11)} · 🌇 ${d.sunset[0].slice(11)}` }; }),
  ap('p', 'aire', 'air', 'Calidad del aire', 'Índice AQI y partículas.', [I('Ciudad', 'Ciudad de México')],
    async c => { const g = await geo(c), d = (await J(`https://air-quality-api.open-meteo.com/v1/air-quality?${LAT(g)}&current=us_aqi,pm2_5,pm10`)).current; return { t: `${g.name}, ${g.country}\nAQI: ${d.us_aqi} · PM2.5: ${d.pm2_5} · PM10: ${d.pm10}` }; }),
  ap('p', 'pronostico', 'calendar_view_week', 'Pronóstico de 5 días', 'Máximas, mínimas y lluvia.', [I('Ciudad', 'Madrid')],
    async c => { const g = await geo(c), d = (await J(`https://api.open-meteo.com/v1/forecast?${LAT(g)}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=5`)).daily; return { t: `${g.name}, ${g.country}\n` + d.time.map((x, i) => `${x}: ${d.temperature_2m_min[i]}–${d.temperature_2m_max[i]}°C · 🌧 ${d.precipitation_probability_max[i] ?? 0}%`).join('\n') }; }),
  ap('p', 'sismos', 'vibration', 'Sismos recientes', 'Terremotos de magnitud 4.5+ de la última semana.', [],
    async () => { const d = (await J('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson')).features; return { t: d.slice(0, 8).map(f => `M${f.properties.mag} · ${f.properties.place}`).join('\n') }; }),
  ap('p', 'iss', 'satellite_alt', 'Estación Espacial (ISS)', 'Dónde está la ISS ahora mismo.', [],
    async () => { const d = await J('https://api.wheretheiss.at/v1/satellites/25544'); return { t: `Lat ${d.latitude.toFixed(2)}° · Lon ${d.longitude.toFixed(2)}°\nAltura ${d.altitude.toFixed(0)} km · ${d.velocity.toFixed(0)} km/h` }; }),
  ap('p', 'spacex', 'rocket', 'Último lanzamiento SpaceX', 'Datos de la misión más reciente.', [],
    async () => { const d = await J('https://api.spacexdata.com/v5/launches/latest'); return { t: `${d.name} · ${d.date_utc.slice(0, 10)}\n${(d.details || 'Sin detalles').slice(0, 250)}`, img: d.links.patch.large }; }),
  ap('p', 'codpostal', 'markunread_mailbox', 'Código postal', 'Localidad de un código postal.', [I('País (código)', 'mx', 'mx'), I('Código postal', '91000', '91000')],
    async (p, z) => { const d = await J(`https://api.zippopotam.us/${(p || 'mx').toLowerCase()}/${z || '91000'}`); const l = d.places[0]; return { t: `${d['post code']} · ${l['place name']}, ${l.state}, ${d.country}` }; }),
  ap('p', 'paisregion', 'explore', 'País al azar por región', 'Descubre un país con su bandera.', [O('Región', 'americas', 'europe', 'asia', 'africa', 'oceania')],
    async r => { const d = pick(await J(`https://restcountries.com/v3.1/region/${r}?fields=name,capital,population,flags`)); return { t: `${d.name.common}\nCapital: ${(d.capital || ['—'])[0]} · ${d.population.toLocaleString('es')} hab.`, img: d.flags.png }; }),

  ap('a', 'pokemontipo', 'bolt', 'Pokémon por tipo', 'Un Pokémon al azar del tipo elegido.', [O('Tipo', ...TIPOS)],
    async t => { const n = pick((await J(`https://pokeapi.co/api/v2/type/${t}`)).pokemon).pokemon.name; const d = await J(`https://pokeapi.co/api/v2/pokemon/${n}`); return { t: `#${d.id} ${d.name.toUpperCase()} · ${d.types.map(x => x.type.name).join('/')}`, img: d.sprites.other['official-artwork'].front_default }; }),
  ap('a', 'dragonball', 'self_improvement', 'Personaje de Dragon Ball', 'Personaje al azar con su ki.', [],
    async () => { const d = await J(`https://dragonball-api.com/api/characters/${rnd(1, 58)}`); const description = await translateText(d.description || ''); return { t: `${d.name} · ${d.race}\nKi: ${d.ki} / Máx: ${d.maxKi}\n${description.slice(0, 220)}…`, img: d.image }; }),
  ap('a', 'digimon', 'memory', 'Digimon al azar', 'Un Digimon con su nivel.', [],
    async () => { const d = pick(await J('https://digimon-api.vercel.app/api/digimon')); return { t: `${d.name} · ${d.level}`, img: d.img }; }),
  ap('a', 'animetemporada', 'calendar_month', 'Anime de la temporada', 'Uno de los animes que se emiten ahora.', [],
    async () => { const d = pick((await J('https://api.jikan.moe/v4/seasons/now?limit=25')).data); const synopsis = await translateText(d.synopsis || 'Sin sinopsis'); return { t: `${d.title} · ★${d.score ?? '—'} · ${d.episodes ?? '?'} eps\n${synopsis.slice(0, 300)}…`, img: d.images.jpg.image_url }; }),
  ap('a', 'animeproximo', 'upcoming', 'Próximos animes', 'Estrenos que vienen pronto.', [],
    async () => { const d = pick((await J('https://api.jikan.moe/v4/seasons/upcoming?limit=25')).data); const synopsis = await translateText(d.synopsis || 'Sin sinopsis aún'); return { t: `${d.title} · ${d.type || ''}\n${synopsis.slice(0, 300)}…`, img: d.images.jpg.image_url }; }),
  ap('z', 'perroraza', 'pets', 'Perro por raza', 'Foto de una raza concreta.', [I('Raza', 'husky')],
    async b => ({ t: b || 'husky', img: (await J(`https://dog.ceo/api/breed/${enc((b || 'husky').toLowerCase().replace(/ /g, ''))}/images/random`)).message })),

  ap('w', 'hn', 'newspaper', 'Noticia tech (Hacker News)', 'Una historia del top actual traducida.', [],
    async () => { const ids = await J('https://hacker-news.firebaseio.com/v0/topstories.json'); const d = await J(`https://hacker-news.firebaseio.com/v0/item/${pick(ids.slice(0, 30))}.json`); const title = await translateText(d.title); return { t: `${title}\n▲ ${d.score} · ${d.url || ''}` }; }),
  ap('w', 'genero', 'wc', 'Género de un nombre', 'Estimación estadística (genderize).', [I('Nombre', 'Alex')],
    async n => { const d = await J(`https://api.genderize.io?name=${enc(n || 'Alex')}`); return { t: `${d.name}: ${d.gender ?? 'desconocido'} (${((d.probability || 0) * 100) | 0}% · ${d.count} muestras)` }; }),
  ap('w', 'fotobn', 'filter_b_and_w', 'Foto con efecto', 'Foto en blanco y negro o borrosa.', [I('Semilla', 'luna'), O('Efecto', 'grayscale', 'blur=3', 'grayscale&blur=2')],
    async (s, e) => ({ img: `https://picsum.photos/seed/${enc(s || rnd(1, 9999))}/700/450?${e}` })),
  ap('w', 'placeholder', 'image', 'Imagen de color con texto', 'Genera un banner de color con tu texto.', [I('Texto', 'Tsuki no Tensha'), I('Fondo (HEX)', '7c4dff', '7c4dff'), I('Texto (HEX)', 'ffffff', 'ffffff')],
    async (t, b, f) => ({ img: `https://placehold.co/700x300/${(b || '7c4dff').replace('#', '')}/${(f || 'ffffff').replace('#', '')}.png?text=${enc(t || 'Tsuki')}` })),
  ap('w', 'avatarextra', 'account_circle', 'Avatares extra', 'Más estilos de avatar (DiceBear).', [I('Semilla', 'tsuki'), O('Estilo', 'fun-emoji', 'big-smile', 'notionists', 'miniavs', 'shapes', 'rings', 'identicon', 'big-ears', 'croodles')],
    async (s, st) => ({ t: s || 'tsuki', img: `https://api.dicebear.com/9.x/${st}/png?seed=${enc(s || 'tsuki')}&size=300` })),
  ap('w', 'colorapi', 'format_color_fill', 'Nombre de un color', 'Dime un HEX y te digo cómo se llama.', [I('HEX (vacío = al azar)', '7c4dff')],
    async h => { const x = (h || hex()).replace('#', ''); const d = await J(`https://www.thecolorapi.com/id?hex=${x}`); return { t: `${d.name.value} · #${x.toUpperCase()}`, img: `https://placehold.co/300x150/${x}.png?text=+` }; }),
  ap('w', 'trending', 'trending_up', 'Cripto en tendencia', 'Las monedas más buscadas hoy.', [],
    async () => ({ t: (await J('https://api.coingecko.com/api/v3/search/trending')).coins.slice(0, 7).map((c, i) => `${i + 1}. ${c.item.name} (${c.item.symbol})`).join('\n') })),
  ap('w', 'repos', 'folder_code', 'Repos de GitHub', 'Los últimos repositorios de un usuario.', [I('Usuario', 'torvalds')],
    async u => { const d = await J(`https://api.github.com/users/${enc(u || 'torvalds')}/repos?per_page=6&sort=updated`); return { t: d.map(r => `⭐${r.stargazers_count} ${r.name}${r.description ? ' — ' + r.description.slice(0, 60) : ''}`).join('\n') }; }),
  ap('w', 'npm', 'inventory_2', 'Paquete de npm', 'Versión y descripción de un paquete.', [I('Paquete', 'react')],
    async p => { const d = await J(`https://registry.npmjs.org/${enc(p || 'react')}/latest`); const description = await translateText(d.description || 'Sin descripción'); return { t: `${d.name}@${d.version}\n${description}\nLicencia: ${d.license || '—'}` }; })
];

/* ---------- 65 funciones locales ---------- */
const mapAZ = (t, U, l) => [...strip(t)].map(c => /[A-Z]/.test(c) ? String.fromCodePoint(U + c.charCodeAt(0) - 65) : /[a-z]/.test(c) ? String.fromCodePoint(l + c.charCodeAt(0) - 97) : c).join('');
const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const fmtD = d => d.toISOString().slice(0, 10);
const rgb2 = h => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map(x => x + x).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };

const FUNCS2 = [
  // ---- Texto avanzado (21) ----
  L('h', 'zalgo', 'bug_report', 'Texto zalgo', 'Texto “maldito” con marcas encima.', [TX], t => [...(t || 'tsuki')].map(c => c + Array.from({ length: rnd(2, 6) }, () => String.fromCharCode(rnd(0x300, 0x36F))).join('')).join('')),
  L('h', 'super', 'superscript', 'Letras pequeñas', 'Texto en superíndice ᵗˢᵘᵏⁱ.', [TX], t => [...(t || 'tsuki').toLowerCase()].map(c => 'ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖqʳˢᵗᵘᵛʷˣʸᶻ'['abcdefghijklmnopqrstuvwxyz'.indexOf(c)] || c).join('')),
  L('h', 'circulos', 'radio_button_checked', 'Letras en círculos', 'Texto ⓒⓘⓡⓒⓤⓛⓐⓡ.', [TX], t => mapAZ(t || 'tsuki', 0x24B6, 0x24D0)),
  L('h', 'cuadrados', 'crop_square', 'Letras en cuadros', 'Texto en 🅲🆄🅰🅳🆁🅾🆂.', [TX], t => [...strip(t || 'tsuki').toUpperCase()].map(c => /[A-Z]/.test(c) ? String.fromCodePoint(0x1F170 + c.charCodeAt(0) - 65) : c).join('')),
  L('h', 'negrita', 'format_bold', 'Negrita unicode', 'Texto en 𝗻𝗲𝗴𝗿𝗶𝘁𝗮 que funciona en cualquier red.', [TX], t => mapAZ(t || 'tsuki', 0x1D5D4, 0x1D5EE)),
  L('h', 'mono', 'terminal', 'Letras monoespaciadas', 'Texto estilo 𝚖𝚊𝚚𝚞𝚒𝚗𝚊 de escribir.', [TX], t => mapAZ(t || 'tsuki', 0x1D670, 0x1D68A)),
  L('h', 'gotico', 'castle', 'Letras góticas', 'Texto en 𝖌𝖔́𝖙𝖎𝖈𝖔.', [TX], t => mapAZ(t || 'tsuki', 0x1D56C, 0x1D586)),
  L('h', 'tachado', 'format_strikethrough', 'Tachado y subrayado', 'Decora tu texto con líneas.', [TX, O('Estilo', 'Tachado', 'Subrayado', 'Doble subrayado', 'Sobrerrayado')],
    (t, e) => { const m = { 'Tachado': '\u0336', 'Subrayado': '\u0332', 'Doble subrayado': '\u0333', 'Sobrerrayado': '\u0305' }[e]; return [...(t || 'tsuki')].map(c => c + m).join(''); }),
  L('h', 'espaciado', 'space_bar', 'Texto espaciado', 'Separa las letras con el símbolo que quieras.', [TX, I('Separador', '·', '·')], (t, s) => [...(t || 'tsuki')].join(s || ' ')),
  L('h', 'caja', 'check_box_outline_blank', 'Texto en caja', 'Enmarca tu texto (usa | para separar líneas).', [TX],
    t => { const r = (t || 'Tsuki|no Tensha').split('|').map(s => s.trim()), w = Math.max(...r.map(s => [...s].length)); return '╔' + '═'.repeat(w + 2) + '╗\n' + r.map(s => '║ ' + s + ' '.repeat(w - [...s].length) + ' ║').join('\n') + '\n╚' + '═'.repeat(w + 2) + '╝'; }),
  L('h', 'marcos', 'auto_fix_high', 'Marcos decorativos', 'Adornos para tu bio o nick.', [TX, O('Estilo', 'Flores', 'Estrellas', 'Corchetes', 'Brillos', 'Líneas', 'Corazones')],
    (t, e) => { t = t || 'Tsuki'; return { 'Flores': `꧁ ${t} ꧂`, 'Estrellas': `★彡 ${t} 彡★`, 'Corchetes': `「 ${t} 」`, 'Brillos': `•°¯·.·  ${t}  ·.·¯°•`, 'Líneas': `✦ ━━ ${t} ━━ ✦`, 'Corazones': `♡ ${t} ♡` }[e]; }),
  L('h', 'kaomoji', 'mood', 'Kaomoji aleatorio', 'Caritas japonesas con estilo.', [], () => pick(['(◕‿◕)', '(｡•́︿•̀｡)', '(╯°□°）╯︵ ┻━┻', '٩(◕‿◕｡)۶', '(ノ◕ヮ◕)ノ*:･ﾟ✧', '¯\\_(ツ)_/¯', '(づ｡◕‿‿◕｡)づ', 'ʕ•ᴥ•ʔ', '(≧◡≦)', '(¬‿¬)', '(；一_一)', '(☞ﾟヮﾟ)☞', '(´• ω •`)', '(⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)', '٩(ˊᗜˋ*)و', '( ͡° ͜ʖ ͡°)'])),
  L('h', 'acronimo', 'short_text', 'Acrónimo', 'Saca las iniciales de una frase.', [TX], t => words(t || 'Tsuki no Tensha').map(w => w[0].toUpperCase()).join('')),
  L('h', 'invpal', 'flip', 'Invertir orden de palabras', 'Voltea el orden de las palabras.', [TX], t => words(t || 'hola mundo bonito').reverse().join(' ')),
  L('h', 'ordenar', 'sort_by_alpha', 'Ordenar lista', 'Ordena alfabéticamente (separa con comas).', [I('Lista', 'pera, manzana, uva'), O('Orden', 'A → Z', 'Z → A')],
    (t, o) => { const a = list(t || 'pera, manzana, uva').sort((x, y) => x.localeCompare(y, 'es')); return (o === 'A → Z' ? a : a.reverse()).join('\n'); }),
  L('h', 'duplicados', 'filter_none', 'Quitar duplicados', 'Elimina elementos repetidos de una lista.', [I('Lista', 'a, b, a, c, b')], t => [...new Set(list(t || 'a, b, a, c, b'))].join(', ')),
  L('h', 'numerar', 'format_list_numbered', 'Numerar lista', 'Convierte elementos en lista numerada.', [I('Lista', 'uno, dos, tres')], t => list(t || 'uno, dos, tres').map((x, i) => `${i + 1}. ${x}`).join('\n')),
  L('h', 'espacios', 'format_align_justify', 'Limpiar espacios', 'Quita espacios dobles y de los bordes.', [TX], t => (t || '  hola    mundo  ').replace(/\s+/g, ' ').trim()),
  L('h', 'buscarrep', 'find_replace', 'Buscar y reemplazar', 'Cambia una palabra por otra.', [TX, I('Buscar', 'hola'), I('Reemplazar por', 'adiós')], (t, a, b) => a ? (t || '').split(a).join(b) : 'Escribe qué buscar'),
  L('h', 'vocales', 'abc', 'Vocales y consonantes', 'Cuenta letras por tipo.', [TX],
    t => { const s = strip(t || 'Tsuki no Tensha').toLowerCase().replace(/[^a-z]/g, ''), v = (s.match(/[aeiou]/g) || []).length; return `Vocales: ${v}\nConsonantes: ${s.length - v}\nLetras totales: ${s.length}`; }),
  L('h', 'frecuencia', 'bar_chart', 'Frecuencia de palabras', 'Las palabras que más se repiten.', [TX],
    t => { const m = {}; words(strip(t || 'la luna y la noche y la luna').toLowerCase().replace(/[^\w\s]/g, '')).forEach(w => m[w] = (m[w] || 0) + 1); return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w, n]) => `${w}: ${n}`).join('\n'); }),

  // ---- Juegos y dinámicas (15) ----
  L('j', 'ppt', 'back_hand', 'Piedra, papel o tijera', 'Juega contra el bot.', [O('Tu jugada', 'Piedra', 'Papel', 'Tijera')],
    m => { const b = pick(['Piedra', 'Papel', 'Tijera']), g = (m === 'Piedra' && b === 'Tijera') || (m === 'Papel' && b === 'Piedra') || (m === 'Tijera' && b === 'Papel'); return `Tú: ${m}\nBot: ${b}\n${m === b ? 'Empate 🤝' : g ? '¡Ganaste! 🎉' : 'Perdiste 😈'}`; }),
  L('j', 'adivinanza', 'psychology', 'Adivinanzas', 'Acertijos con su respuesta.', [],
    () => { const [q, a] = pick([['Blanca por dentro, verde por fuera. Si quieres que te lo diga, espera.', 'La pera'], ['Oro parece, plata no es.', 'El plátano'], ['Tengo agujas y no coso, tengo números y no sumo.', 'El reloj'], ['Vuelo sin alas, lloro sin ojos.', 'La nube'], ['Cuanto más se seca, más se moja.', 'La toalla'], ['Tiene dientes y no muerde.', 'El ajo'], ['Siempre va al cielo y nunca llega.', 'El humo'], ['Corre sin pies y no tiene boca.', 'El río']]); return `${q}\n\nRespuesta: ${a}`; }),
  L('j', 'dados', 'casino', 'Tirar varios dados', 'N dados de M caras.', [I('Cantidad', '2', '2'), I('Caras', '6', '6')],
    (n, c) => { const r = Array.from({ length: Math.min(30, Math.max(1, num(n, 2) | 0)) }, () => rnd(1, Math.max(2, num(c, 6) | 0) + 1)); return `${r.join(' + ')} = ${r.reduce((a, b) => a + b, 0)}`; }),
  L('j', 'loteria', 'confirmation_number', 'Lotería', 'Seis números de la suerte del 1 al 49.', [], () => shuffle(Array.from({ length: 49 }, (_, i) => i + 1)).slice(0, 6).sort((a, b) => a - b).join(' · ')),
  L('j', 'sorteo', 'redeem', 'Sorteo de ganadores', 'Elige varios ganadores de una lista.', [I('Participantes', 'Ana, Luis, Sofi, Leo'), I('Ganadores', '1', '1')],
    (t, n) => '🏆 ' + shuffle(list(t || 'Ana, Luis, Sofi, Leo')).slice(0, Math.max(1, num(n, 1) | 0)).join(', ')),
  L('j', 'quienpaga', 'receipt_long', '¿Quién paga?', 'El destino decide quién invita.', [I('Nombres', 'Ana, Luis, Sofi')], t => `💸 Paga ${pick(list(t || 'Ana, Luis, Sofi'))}. ${pick(['Ni modo.', 'Es el destino.', 'La próxima invita otro.', 'Gracias por tu sacrificio.'])}`),
  L('j', 'rpgstats', 'swords', 'Stats de RPG', 'Seis atributos tirando 4d6 y descartando el menor.', [],
    () => ['Fuerza', 'Destreza', 'Constitución', 'Inteligencia', 'Sabiduría', 'Carisma'].map(a => { const d = Array.from({ length: 4 }, () => rnd(1, 7)).sort((x, y) => x - y); return `${a}: ${d.slice(1).reduce((x, y) => x + y, 0)}`; }).join('\n')),
  L('j', 'loot', 'diamond', 'Botín de mazmorra', 'Un objeto con rareza aleatoria.', [],
    () => { const r = pick([['Común', '⚪'], ['Común', '⚪'], ['Raro', '🔵'], ['Épico', '🟣'], ['Legendario', '🟠']]); return `${r[1]} ${r[0]}: ${pick(['Espada', 'Capa', 'Anillo', 'Báculo', 'Amuleto', 'Botas'])} ${pick(['de la Luna', 'del Dragón', 'de Sombras', 'del Eclipse', 'del Alba'])}`; }),
  L('j', 'encuentro', 'skull', 'Encuentro aleatorio', 'Un enemigo con nivel y rasgo.', [], () => `Nv. ${rnd(1, 60)} ${pick(['Slime', 'Goblin', 'Lich', 'Wyvern', 'Orco', 'Espectro', 'Golem'])} ${pick(['furioso', 'ancestral', 'albino', 'corrupto', 'perezoso', 'legendario'])}\nRasgo: ${pick(['regenera vida', 'es inmune al fuego', 'invoca aliados', 'roba maná', 'habla en rimas'])}`),
  L('j', 'tarot', 'style', 'Tarot rápido', 'Tres cartas: pasado, presente y futuro.', [],
    () => { const c = shuffle(['El Loco', 'El Mago', 'La Sacerdotisa', 'La Emperatriz', 'El Emperador', 'Los Enamorados', 'El Carro', 'La Fuerza', 'El Ermitaño', 'La Rueda', 'La Justicia', 'El Colgado', 'La Muerte', 'La Templanza', 'La Torre', 'La Estrella', 'La Luna', 'El Sol']); return ['Pasado', 'Presente', 'Futuro'].map((x, i) => `${x}: ${c[i]}${Math.random() < .3 ? ' (invertida)' : ''}`).join('\n'); }),
  L('j', 'galleta', 'cookie', 'Galleta de la fortuna', 'Un mensaje del destino.', [], () => '🥠 ' + pick(['Pronto recibirás una buena noticia.', 'Alguien piensa en ti ahora mismo.', 'Hoy es buen día para empezar algo nuevo.', 'La paciencia traerá su recompensa.', 'Tu próximo capítulo será el mejor.', 'Una sorpresa llega por mensaje.'])),
  L('j', 'trabalenguas', 'record_voice_over', 'Trabalenguas', 'Repítelo rápido sin equivocarte.', [], () => pick(['Tres tristes tigres tragaban trigo en un trigal.', 'Pablito clavó un clavito, ¿qué clavito clavó Pablito?', 'El cielo está enladrillado, ¿quién lo desenladrillará?', 'Pepe Pecas pica papas con un pico, con un pico pica papas Pepe Pecas.', 'Como poco coco como, poco coco compro.', 'Erre con erre cigarro, erre con erre barril.'])),
  L('j', 'retodibujo', 'brush', 'Reto de dibujo', 'Un tema para dibujar hoy.', [], () => `Dibuja ${pick(['un gato', 'un dragón', 'tu personaje favorito', 'un robot', 'una bruja', 'un samurái'])} ${pick(['comiendo ramen', 'bajo la luna', 'en una batalla épica', 'en pijama', 'montando una nube', 'en estilo chibi'])}.`),
  L('j', 'rompehielo', 'ac_unit', 'Rompehielo', 'Preguntas para animar el grupo.', [], () => pick(['¿Cuál fue la última serie que viste de un tirón?', '¿Qué superpoder inútil te gustaría tener?', '¿Cuál es tu comida de consuelo?', '¿Qué personaje de ficción te cae mal y por qué?', '¿Cuál es tu mayor miedo irracional?', '¿Qué canción pondrías de banda sonora de tu vida?'])),
  L('j', 'conversa', 'chat', 'Tema de conversación', 'Cuando el chat está muerto.', [], () => pick(['¿Qué harías si ganaras un millón mañana?', 'Cuéntame tu peor cita.', '¿Qué manhwa recomendarías a un principiante?', '¿Cuál es tu opinión impopular?', '¿A qué época viajarías?', 'Si fueras villano, ¿cuál sería tu plan?'])),

  // ---- Dev y utilidades (14) ----
  L('k', 'json', 'data_object', 'Formatear JSON', 'Ordena o minimiza un JSON.', [I('JSON', '{"a":1,"b":[2,3]}'), O('Modo', 'Embellecer', 'Minificar')],
    (t, m) => { try { const o = JSON.parse(t || '{"a":1,"b":[2,3]}'); return m === 'Minificar' ? JSON.stringify(o) : JSON.stringify(o, null, 2); } catch (e) { return 'JSON no válido: ' + e.message; } }),
  L('k', 'hexrgb', 'colorize', 'HEX ↔ RGB', 'Convierte #7c4dff o 124,77,255.', [I('Color', '#7c4dff')],
    t => { t = t || '#7c4dff'; if (t.includes(',')) { const [r, g, b] = t.split(',').map(x => Math.min(255, Math.max(0, num(x) | 0))); return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase(); } const c = rgb2(t); return c.some(isNaN) ? 'Color no válido' : `rgb(${c.join(', ')})`; }),
  L('k', 'urlenc', 'link', 'Codificar URL', 'Codifica o decodifica un enlace.', [TX, O('Modo', 'Codificar', 'Decodificar')], (t, m) => { try { return m === 'Codificar' ? enc(t || 'hola mundo & más') : decodeURIComponent(t || 'hola%20mundo'); } catch (e) { return 'Entrada no válida'; } }),
  L('k', 'htmlesc', 'html', 'Escapar HTML', 'Convierte < > & en entidades y viceversa.', [TX, O('Modo', 'Escapar', 'Desescapar')],
    (t, m) => m === 'Escapar' ? (t || '<b>hola</b>').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : dec(t || '&lt;b&gt;hola&lt;/b&gt;')),
  L('k', 'timestamp', 'schedule', 'Timestamp Unix', 'Fecha ↔ segundos Unix (vacío = ahora).', [I('Valor o fecha', '1700000000')],
    t => { if (!t) return String(Math.floor(Date.now() / 1000)); if (/^\d+$/.test(t)) return new Date((t.length > 11 ? +t : t * 1000)).toLocaleString('es', { dateStyle: 'full', timeStyle: 'medium' }); const d = new Date(t); return isNaN(d) ? 'Fecha no válida' : String(Math.floor(d / 1000)); }),
  L('k', 'bases', 'pin', 'Conversor de bases', 'Decimal, binario, octal y hexadecimal.', [I('Número', '255', '255'), O('Base de entrada', 'Decimal', 'Binario', 'Octal', 'Hexadecimal')],
    (n, b) => { const v = parseInt(n || '255', { Decimal: 10, Binario: 2, Octal: 8, Hexadecimal: 16 }[b]); return isNaN(v) ? 'Número no válido' : `Decimal: ${v}\nBinario: ${v.toString(2)}\nOctal: ${v.toString(8)}\nHex: ${v.toString(16).toUpperCase()}`; }),
  L('k', 'regex', 'manage_search', 'Probar regex', 'Busca coincidencias con una expresión regular.', [TX, I('Patrón', '\\d+'), I('Flags', 'g', 'g')],
    (t, p, f) => { try { const m = [...(t || 'abc 123 def 45').matchAll(new RegExp(p || '\\d+', (f || 'g').includes('g') ? f : f + 'g'))]; return m.length ? `${m.length} coincidencias:\n` + m.map(x => x[0]).join('\n') : 'Sin coincidencias'; } catch (e) { return 'Regex no válida: ' + e.message; } }),
  L('k', 'idcorto', 'tag', 'ID corto', 'Identificadores tipo nanoid.', [I('Largo', '10', '10')],
    n => { const a = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', r = crypto.getRandomValues(new Uint8Array(Math.min(64, Math.max(4, num(n, 10) | 0)))); return Array.from(r, x => a[x % 62]).join(''); }),
  L('k', 'passfuerte', 'enhanced_encryption', 'Contraseña fuerte', 'Contraseña aleatoria con opciones.', [I('Largo', '16', '16'), O('Símbolos', 'Sí', 'No')],
    (n, s) => { const a = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789' + (s === 'Sí' ? '!@#$%&*?-_+' : ''), r = crypto.getRandomValues(new Uint8Array(Math.min(64, Math.max(6, num(n, 16) | 0)))); return Array.from(r, x => a[x % a.length]).join(''); }),
  L('k', 'fuerza', 'shield_lock', 'Fuerza de contraseña', 'Evalúa qué tan segura es (no se envía a ningún lado).', [I('Contraseña', 'MiClave123')],
    t => { t = t || 'MiClave123'; const pool = (/[a-z]/.test(t) ? 26 : 0) + (/[A-Z]/.test(t) ? 26 : 0) + (/\d/.test(t) ? 10 : 0) + (/[^\w]/.test(t) ? 32 : 0), bits = Math.round(t.length * Math.log2(pool || 1)); return `Entropía aprox.: ${bits} bits\n${bits < 40 ? '🔴 Débil' : bits < 60 ? '🟠 Aceptable' : bits < 80 ? '🟢 Buena' : '💪 Excelente'}`; }),
  L('k', 'contraste', 'contrast', 'Contraste de colores', 'Ratio de contraste WCAG.', [I('Texto (HEX)', '#ffffff', '#ffffff'), I('Fondo (HEX)', '#7c4dff', '#7c4dff')],
    (a, b) => { try { const x = lum(rgb2(a || '#fff')), y = lum(rgb2(b || '#7c4dff')), r = (Math.max(x, y) + .05) / (Math.min(x, y) + .05); return `Ratio: ${r.toFixed(2)}:1\nAA texto normal: ${r >= 4.5 ? '✅' : '❌'}\nAAA: ${r >= 7 ? '✅' : '❌'}`; } catch (e) { return 'Colores no válidos'; } }),
  L('k', 'pxrem', 'straighten', 'px ↔ rem', 'Convierte unidades CSS.', [I('Valor', '24', '24'), O('Conversión', 'px → rem', 'rem → px')], (v, c) => c === 'px → rem' ? `${num(v) / 16} rem` : `${num(v) * 16} px`),
  L('k', 'gradiente', 'gradient', 'Gradiente CSS', 'Un degradado aleatorio listo para copiar.', [], () => `background: linear-gradient(${rnd(0, 360)}deg, ${hex()}, ${hex()});`),
  L('k', 'sombracss', 'layers', 'Sombra CSS', 'Una box-shadow aleatoria.', [], () => `box-shadow: ${rnd(-12, 13)}px ${rnd(2, 20)}px ${rnd(8, 40)}px rgba(0, 0, 0, 0.${rnd(15, 40)});`),

  // ---- Mates y fechas (15) ----
  L('n', 'calc', 'calculate', 'Calculadora', 'Escribe una operación: (3+4)*2^3.', [I('Operación', '(3+4)*2^3')],
    t => { t = (t || '(3+4)*2^3').replace(/\^/g, '**').replace(/,/g, '.'); if (!/^[\d+\-*/().%\s]+$/.test(t)) return 'Solo números y + - * / ^ ( )'; try { const r = Function('"use strict";return (' + t + ')')(); return isFinite(r) ? String(+r.toPrecision(12)) : 'Resultado no válido'; } catch (e) { return 'Operación no válida'; } }),
  L('n', 'pctde', 'percent', 'X% de Y', 'Calcula un porcentaje de una cantidad.', [I('Porcentaje', '15', '15'), I('Cantidad', '200', '200')], (p, c) => `${num(p)}% de ${num(c)} = ${+(num(p) * num(c) / 100).toFixed(4)}`),
  L('n', 'variacion', 'show_chart', 'Variación porcentual', 'Cuánto subió o bajó un valor.', [I('Valor inicial', '80', '80'), I('Valor final', '100', '100')], (a, b) => num(a) ? `${((num(b) - num(a)) / num(a) * 100).toFixed(2)}% ${num(b) >= num(a) ? '↑' : '↓'}` : 'El valor inicial no puede ser 0'),
  L('n', 'regla3', 'functions', 'Regla de tres', 'Si A es a B, entonces C es a ?', [I('A', '2', '2'), I('B', '10', '10'), I('C', '5', '5')], (a, b, c) => num(a) ? `${+(num(b) * num(c) / num(a)).toFixed(4)}` : 'A no puede ser 0'),
  L('n', 'estadistica', 'analytics', 'Promedio, mediana y moda', 'Estadística de una lista de números.', [I('Números', '4, 8, 8, 15, 23')],
    t => { const a = list(t || '4, 8, 8, 15, 23').map(Number).filter(x => !isNaN(x)).sort((x, y) => x - y); if (!a.length) return 'Sin números'; const s = a.reduce((x, y) => x + y, 0), m = Math.floor(a.length / 2), f = {}; a.forEach(x => f[x] = (f[x] || 0) + 1); const mx = Math.max(...Object.values(f)); return `Suma: ${s}\nPromedio: ${+(s / a.length).toFixed(3)}\nMediana: ${a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2}\nModa: ${Object.keys(f).filter(k => f[k] === mx).join(', ')}\nMín/Máx: ${a[0]} / ${a[a.length - 1]}`; }),
  L('n', 'primo', 'tag', '¿Es primo?', 'Comprueba y factoriza un número.', [I('Número', '84', '84')],
    n => { n = Math.floor(num(n, 84)); if (n < 2 || n > 1e12) return 'Usa un entero entre 2 y 10¹²'; let x = n, f = []; for (let i = 2; i * i <= x; i++) while (x % i === 0) { f.push(i); x /= i; } if (x > 1) f.push(x); return f.length === 1 ? `${n} es primo ✅` : `${n} no es primo\nFactores: ${f.join(' × ')}`; }),
  L('n', 'mcdmcm', 'join_inner', 'MCD y MCM', 'Máximo común divisor y mínimo común múltiplo.', [I('A', '12', '12'), I('B', '18', '18')], (a, b) => { a = Math.floor(num(a, 12)); b = Math.floor(num(b, 18)); return `MCD: ${gcd(a, b)}\nMCM: ${a && b ? Math.abs(a * b) / gcd(a, b) : 0}`; }),
  L('n', 'fibo', 'timeline', 'Fibonacci', 'Los primeros N términos.', [I('Términos', '12', '12')], n => { const a = [0, 1]; for (let i = 2; i < Math.min(80, Math.max(2, num(n, 12) | 0)); i++) a.push(a[i - 1] + a[i - 2]); return a.join(', '); }),
  L('n', 'factorial', 'priority_high', 'Factorial', 'N! hasta 170.', [I('N', '10', '10')], n => { n = Math.floor(num(n, 10)); if (n < 0 || n > 170) return 'Usa un entero entre 0 y 170'; let r = 1n; for (let i = 2n; i <= BigInt(n); i++) r *= i; return `${n}! = ${r.toString()}`; }),
  L('n', 'romano', 'history_edu', 'Números romanos', 'Arábigo ↔ romano.', [I('Número o romano', '2026')],
    t => { t = (t || '2026').toUpperCase(); const R = [['M', 1000], ['CM', 900], ['D', 500], ['CD', 400], ['C', 100], ['XC', 90], ['L', 50], ['XL', 40], ['X', 10], ['IX', 9], ['V', 5], ['IV', 4], ['I', 1]]; if (/^\d+$/.test(t)) { let n = +t; if (n < 1 || n > 3999) return 'Usa 1 a 3999'; return R.reduce((s, [r, v]) => { while (n >= v) { s += r; n -= v; } return s; }, ''); } if (!/^[MDCLXVI]+$/.test(t)) return 'Entrada no válida'; let i = 0, s = 0; for (const [r, v] of R) while (t.startsWith(r, i)) { s += v; i += r.length; } return i === t.length ? String(s) : 'Romano no válido'; }),
  L('n', 'diasentre', 'date_range', 'Días entre dos fechas', 'Diferencia exacta entre fechas.', [I('Desde', '2026-01-01', '2026-01-01'), I('Hasta', '2026-12-31', '2026-12-31')],
    (a, b) => { const x = dateOf(a || '2026-01-01'), y = dateOf(b || '2026-12-31'); if (!x || !y) return 'Fecha no válida (AAAA-MM-DD)'; const d = Math.round((y - x) / 864e5); return `${Math.abs(d)} días (${(Math.abs(d) / 7).toFixed(1)} semanas)${d < 0 ? '\n(la segunda fecha es anterior)' : ''}`; }),
  L('n', 'diasemana', 'today', 'Día de la semana', '¿Qué día cae cierta fecha?', [I('Fecha', '2026-12-25', '2026-12-25')], t => { const d = dateOf(t || '2026-12-25'); return d ? DIAS[d.getDay()] : 'Fecha no válida (AAAA-MM-DD)'; }),
  L('n', 'sumardias', 'add_circle', 'Sumar días a una fecha', 'Qué fecha será dentro de N días.', [I('Fecha', fmtD(new Date()), fmtD(new Date())), I('Días (negativo = restar)', '30', '30')],
    (t, n) => { const d = dateOf(t || fmtD(new Date())); if (!d) return 'Fecha no válida'; d.setDate(d.getDate() + (num(n, 30) | 0)); return `${fmtD(d)} (${DIAS[d.getDay()]})`; }),
  L('n', 'cumple', 'celebration', 'Próximo cumpleaños', 'Días que faltan para tu cumple.', [I('Fecha de nacimiento', '2000-05-21', '2000-05-21')],
    t => { const b = dateOf(t || '2000-05-21'); if (!b) return 'Fecha no válida'; const n = new Date(); n.setHours(0, 0, 0, 0); let x = new Date(n.getFullYear(), b.getMonth(), b.getDate()); if (x < n) x.setFullYear(x.getFullYear() + 1); const d = Math.round((x - n) / 864e5); return d === 0 ? '¡Hoy es tu cumpleaños! 🎂' : `Faltan ${d} días · cumplirás ${x.getFullYear() - b.getFullYear()} años (${DIAS[x.getDay()]})`; }),
  L('n', 'interes', 'savings', 'Interés compuesto', 'Cuánto crece tu dinero capitalizando cada mes.', [I('Capital', '10000', '10000'), I('Tasa anual %', '8', '8'), I('Años', '5', '5')],
    (c, r, y) => { const m = num(c) * (1 + num(r) / 1200) ** (12 * num(y)); return `Monto final: $${m.toFixed(2)}\nGanancia: $${(m - num(c)).toFixed(2)}`; })
];

const extras2 = [...APIS2, ...FUNCS2];
extras.push(...extras2);
Object.assign(GN, { h: 'Texto avanzado', j: 'Juegos y dinámicas', k: 'Desarrollo y utilidades', n: 'Matemáticas y fechas', p: 'Clima, espacio y mundo (API)', r: 'Libros, cocina y arte (API)' });
NAVX.length = 0;
NAVX.push(...Object.keys(GN).map(k => [GN[k], extras.filter(t => t.g === k).map(t => t.id)]));

/* ============================================================
   Registro de herramientas
   ============================================================ */
const imageEditors = [
  imageEditor({ id: 'meme', icon: 'image', name: 'Creador de memes', desc: 'Sube una imagen y ponle texto arriba y abajo.', mode: 'meme' }),
  imageEditor({ id: 'cara', icon: 'face', name: 'Tu cara en meme', desc: 'Sube tu foto, quémala y ponle un emoji.', mode: 'cara' }),
  imageEditor({ id: 'sticker', icon: 'sticky_note_2', name: 'Stickers de WhatsApp', desc: 'Recorta en círculo, agrega texto y descarga en .webp (512×512).', mode: 'sticker' }),
  imageEditor({ id: 'edicion', icon: 'tune', name: 'Ediciones sencillas', desc: 'Filtros, formas y emojis para retocar tus fotos.', mode: 'edicion' })
];

const doomGames = {
  id: 'doom',
  icon: 'sports_esports',
  name: 'Juegos DOOM',
  desc: 'DOOM y mods clásicos disponibles desde el launcher oficial.',
  render(el) {
    el.innerHTML = `
      <div class="card">
        <div class="game-launcher">
          <article class="game-card featured">
            <h3>Pirate DOOM</h3>
            <p>Campaña pirata basada en DOOM, disponible desde el launcher de UZDoom WASM.</p>
            <div class="btn-row">
              <button class="btn filled" id="play-pirate">
                <span class="material-symbols-outlined">play_arrow</span>Jugar ahora
              </button>
              <a class="btn outlined" href="https://joeheyming.github.io/doom/" target="_blank" rel="noopener">
                <span class="material-symbols-outlined">open_in_new</span>Ver catálogo completo
              </a>
            </div>
          </article>
          ${[
            ['Freedoom', 'La aventura DOOM gratuita incluida en el launcher.'],
            ['Mario DOOM', 'Mod fan con temática de Mario.'],
            ['Metroid DOOM', 'Mod fan inspirado en Metroid.'],
            ['Castlevania DOOM', 'Mod fan basado en Castlevania.'],
            ['Sonic DOOM', 'Mod fan con personajes y ambientes de Sonic.'],
            ['Pokémon DOOM', 'Mod fan inspirado en Pokémon.'],
            ['Simpsons DOOM', 'Mod fan con personajes de Los Simpsons.'],
            ['Sigil y Sigil II', 'Capítulos adicionales creados por John Romero.']
          ].map(([name, desc]) => `
            <article class="game-card">
              <h3>${name}</h3>
              <p>${desc}</p>
              <div class="btn-row">
                <a class="btn tonal" href="https://joeheyming.github.io/doom/" target="_blank" rel="noopener">
                  <span class="material-symbols-outlined">play_arrow</span>Abrir launcher
                </a>
              </div>
            </article>`).join('')}
        </div>
      </div>
      <iframe class="game-frame" id="doom-frame" title="Launcher de DOOM" src="about:blank" hidden></iframe>
    `;

    $('#play-pirate', el).onclick = () => {
      const frame = $('#doom-frame', el);
      frame.src = 'https://joeheyming.github.io/doom/';
      frame.hidden = false;
      bump('doom', 'Juegos DOOM: Pirate DOOM');
      frame.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
  }
};

const T = [
  dinamicas,
  doomGames,
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
  ia,
  ...extras
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
  ['Juegos', ['doom', 'dinamicas', 'ruleta', 'dado', 'bingo']],
  ['Texto', ['frases', 'noticias', 'amarillismo', 'insultos', 'ship', 'horoscopo', 'titulos', 'nombres', 'reto', 'frasesapi']],
  ['Imagen y arte', ['meme', 'cara', 'sticker', 'edicion', 'personaje', 'dibujo', 'animacion']],
  ['APIs y generadores', ['memeapi', 'imagenia', 'avatares']],
  ['Utilidades', ['ia', 'password']],
  ...NAVX
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
