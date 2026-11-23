/* Rise5 — logika prototypu (bez backendu, wszystko dzieje się w przeglądarce). */
(function () {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const S = {
    history: ['landing'],
    answers: {},
    qIndex: 0,
    sort: 'match',
    ranked: [],
    therapist: null,
    tab: 'visits',
    focusBooking: false,
    booking: null,          // { tid, date, hour }
    pick: { day: 0, hour: null },
    name: '',
    msgs: {}                // tid -> [{ text, time }]
  };

  /* ---------- nawigacja ---------- */
  function show(id, push) {
    $$('.screen').forEach(el => { el.hidden = el.id !== 's-' + id; });
    if (push !== false && S.history[S.history.length - 1] !== id) S.history.push(id);
    const el = $('#s-' + id);
    if (el) el.scrollTop = 0;
    if (id === 'prompt') $('#gptError').hidden = true;
    setHash(id === 'how' ? 'jak-dziala' : '');
  }
  function setHash(h) {
    try {
      if ((location.hash || '').replace('#', '') === h) return;
      if (h) location.hash = h;
      else if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    } catch (e) { /* podgląd bez dostępu do historii */ }
  }
  function startQuiz(fill) {
    S.fill = fill || null;
    S.qIndex = 0;
    if (!fill) S.answers = {};
    show('quiz');
    renderQuestion();
  }
  function back() {
    S.history.pop();
    show(S.history[S.history.length - 1] || 'landing', false);
  }
  document.addEventListener('click', e => {
    const go = e.target.closest('[data-go]');
    if (go) { if (go.dataset.go === 'quiz') startQuiz(); else show(go.dataset.go); return; }
    if (e.target.closest('[data-back]')) back();
  });

  let toastTimer;
  function toast(text) {
    const t = $('#toast');
    t.textContent = text; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
  }

  /* ---------- landing: mozaika i krążek odsłaniający twarze ---------- */
  function initHero() {
    const hero = $('#hero');
    const order = [0, 4, 1, 5, 2, 6, 3, 7, 4];
    const tiles = order.map(i => `<i style="background-image:url('${THERAPISTS[i].photo}')"></i>`).join('');
    $$('.mosaic', hero).forEach(m => { m.innerHTML = tiles; });
    $('#gScore').textContent = CONFIG.googleRating;
    $('#mediaList').innerHTML = Array.from({ length: CONFIG.mediaSlots }, () => '<li>logo</li>').join('');

    const pos = { x: 0, y: 0 };
    let target = null, targets = [], ti = 0, userUntil = 0, lastHop = 0;

    function measure() {
      const w = hero.clientWidth, h = hero.clientHeight;
      const card = $('#heroCard');
      const top = card.offsetTop, bottom = top + card.offsetHeight;
      targets = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        const x = (c + .5) * w / 3, y = (r + .33) * h / 3;
        if (y < top - 34 || (y > bottom + 34 && y < h - 96)) targets.push({ x, y });
      }
      if (!targets.length) targets = [{ x: w / 2, y: 60 }];
      // kolejność „przeskoków": po przekątnej, żeby krążek wędrował po całym kadrze
      targets.sort((a, b) => (a.y - b.y) || (a.x - b.x));
      const zig = [];
      for (let i = 0, j = targets.length - 1; i <= j; i++, j--) { zig.push(targets[i]); if (i !== j) zig.push(targets[j]); }
      targets = zig;
      if (!target) { target = targets[0]; pos.x = target.x; pos.y = target.y; apply(); }
    }
    function apply() {
      hero.style.setProperty('--sx', pos.x.toFixed(1) + 'px');
      hero.style.setProperty('--sy', pos.y.toFixed(1) + 'px');
    }
    function frame(t) {
      if ($('#s-landing').hidden) { requestAnimationFrame(frame); return; }
      if (t > userUntil && t - lastHop > 2300) {
        ti = (ti + 1) % targets.length; target = targets[ti]; lastHop = t;
      }
      pos.x += (target.x - pos.x) * .055;
      pos.y += (target.y - pos.y) * .055;
      apply();
      requestAnimationFrame(frame);
    }
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      target = { x: e.clientX - r.left, y: e.clientY - r.top };
      userUntil = performance.now() + 1800;
    });
    window.addEventListener('resize', () => { target = null; measure(); });
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { target = null; measure(); });
    if (!reducedMotion) requestAnimationFrame(frame);
  }

  /* ---------- landing: 833 kropki ---------- */
  function initDots() {
    const cv = $('#dots'), ctx = cv.getContext('2d');
    const total = CONFIG.totalTherapists, cols = 35, rows = Math.ceil(total / cols);
    // stała, pseudolosowa kolejność „odpadania"
    const rank = Array.from({ length: total }, (_, i) => i);
    let seed = 5;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = total - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [rank[i], rank[j]] = [rank[j], rank[i]]; }
    const place = new Array(total); rank.forEach((dot, k) => { place[dot] = k; });
    let lit = total;

    function draw() {
      const w = cv.clientWidth; if (!w) return;
      const cell = w / cols, h = cell * rows, dpr = Math.min(window.devicePixelRatio || 1, 3);
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < total; i++) {
        const on = place[i] < lit;
        ctx.beginPath();
        ctx.arc((i % cols + .5) * cell, (Math.floor(i / cols) + .5) * cell, on ? cell * (lit <= 8 ? .46 : .32) : cell * .2, 0, Math.PI * 2);
        ctx.fillStyle = on ? '#FFC533' : 'rgba(255,255,255,.16)';
        ctx.fill();
      }
    }
    $('#steps').addEventListener('click', e => {
      const b = e.target.closest('.step'); if (!b) return;
      $$('.step').forEach(s => s.setAttribute('aria-pressed', String(s === b)));
      lit = +b.dataset.n;
      $('#dotsCount').textContent = b.dataset.n;
      $('#dotsLabel').textContent = b.dataset.label;
      draw();
    });
    window.addEventListener('resize', draw);
    draw();
  }

  /* ---------- liczba pasujących terapeutów ---------- */
  function countFor(a) {
    let n = CONFIG.totalTherapists;
    if (a.modality && MODALITIES[a.modality]) n *= MODALITIES[a.modality].share;
    if (a.problems && a.problems.length) {
      n *= Math.max(...a.problems.map(p => PROBLEMS[p].share)) * Math.pow(.8, a.problems.length - 1);
    }
    const f = {
      gender: { f: .74, m: .26 }, age: { young: .3, mid: .42, senior: .28 },
      style: { directive: .4, exploratory: .38, mixed: .6 }, tone: { warm: .55, direct: .45 },
      time: { asap: .5, evenings: .6, weekends: .3 }
    };
    Object.keys(f).forEach(k => { if (a[k] && f[k][a[k]]) n *= f[k][a[k]]; });
    if (a.values) n *= Math.pow(.55, a.values.length);
    if (a.contexts) n *= Math.pow(.7, a.contexts.length);
    return Math.max(CONFIG.shortlist, Math.round(n));
  }

  /* ---------- quiz ---------- */
  // S.fill: po wklejeniu odpowiedzi czatu dopytujemy tylko o brakujące pola
  const activeQuestions = () => S.fill
    ? QUESTIONS.filter(q => S.fill.includes(q.id))
    : QUESTIONS.filter(q => !q.when || q.when(S.answers));

  function renderQuestion() {
    const list = activeQuestions();
    const q = list[S.qIndex];
    const a = S.answers[q.id];
    $('#qTitle').textContent = q.title;
    $('#qHint').textContent = q.hint || '';
    $('#qHint').hidden = !q.hint;
    const box = $('#qOpts');
    box.className = 'opts' + (q.layout === 'chips' ? ' opts--chips' : '');
    box.innerHTML = q.options.map(o => {
      const on = q.type === 'multi' ? (a || []).includes(o.v) : a === o.v;
      return `<button type="button" class="opt" data-v="${o.v}" aria-pressed="${on}"><b>${esc(o.label)}</b>${o.desc ? `<span>${esc(o.desc)}</span>` : ''}</button>`;
    }).join('');

    const s1 = list.filter(x => x.stage === 1), s2 = list.filter(x => x.stage === 2);
    const done1 = q.stage === 1 ? s1.indexOf(q) : s1.length;
    const done2 = q.stage === 2 ? s2.indexOf(q) : 0;
    $('#stage1 b').style.width = (s1.length ? done1 / s1.length * 100 : 100) + '%';
    $('#stage2 b').style.width = (s2.length ? done2 / s2.length * 100 : 0) + '%';
    $('#stage1').classList.toggle('is-on', q.stage === 1);
    $('#stage2').classList.toggle('is-on', q.stage === 2);
    $('#quizCount').textContent = countFor(S.answers);

    $('#qSkip').hidden = !q.skippable;
    const next = $('#qNext');
    next.hidden = q.type !== 'multi';
    next.disabled = q.type === 'multi' && !q.skippable && !(a && a.length);
    next.textContent = S.qIndex === list.length - 1 ? 'Pokaż terapeutów' : 'Dalej';
    $('#s-quiz').scrollTop = 0;
  }

  function nextQuestion() {
    const list = activeQuestions();
    if (S.qIndex >= list.length - 1) { startMatching(); return; }
    S.qIndex++; renderQuestion();
  }

  $('#qOpts').addEventListener('click', e => {
    const b = e.target.closest('.opt'); if (!b) return;
    const q = activeQuestions()[S.qIndex], v = b.dataset.v;
    if (q.type === 'multi') {
      const cur = new Set(S.answers[q.id] || []);
      if (cur.has(v)) cur.delete(v);
      else if (q.max && cur.size >= q.max) { toast('Wybierz najwyżej ' + q.max); return; }
      else cur.add(v);
      S.answers[q.id] = Array.from(cur);
      if (q.id === 'feel') {
        // odczucia tłumaczymy na obszary problemów, najwyżej 3
        const ps = [];
        FEELINGS.filter(f => cur.has(f.v)).forEach(f => f.problems.forEach(x => { if (!ps.includes(x)) ps.push(x); }));
        if (ps.length) S.answers.problems = ps.slice(0, 3); else delete S.answers.problems;
      }
      renderQuestion();
    } else {
      S.answers[q.id] = v;
      // zmiana ścieżki czyści odpowiedzi z drugiej gałęzi
      if (q.id === 'path') { delete S.answers.modality; delete S.answers.problems; delete S.answers.feel; }
      if (q.id === 'modality' && v !== 'unknown') delete S.answers.problems;
      renderQuestion();
      setTimeout(nextQuestion, reducedMotion ? 0 : 220);
    }
  });
  $('#qNext').addEventListener('click', nextQuestion);
  $('#qSkip').addEventListener('click', () => {
    const list = activeQuestions(), last = S.qIndex >= list.length - 1;
    delete S.answers[list[S.qIndex].id];
    if (last) startMatching(); else { S.qIndex++; renderQuestion(); }
  });
  $('#quizBack').addEventListener('click', () => {
    if (S.qIndex === 0) { if (S.fill) show('review', false); else back(); return; }
    S.qIndex--; renderQuestion();
  });

  /* ---------- dobór przez prompt ---------- */
  const norm = s => s.toLowerCase().replace(/ł/g, 'l').normalize('NFD').replace(/[̀-ͯ]/g, '');
  const RX = {
    problems: {
      adhd: /adhd/, anxiety: /\blek(u|iem|i|owe|owy)?\b|panik|niepok/, depression: /depres|nastroj/, trauma: /traum|ptsd/,
      relationships: /zwiaz|relacj/, burnout: /wypalen/, selfesteem: /samoocen|pewnosc siebie/, grief: /zalob/,
      eating: /odzywian|jedzeni/, addiction: /uzalezn|nalog/, sleep: /\bsen\b|\bsnu\b|bezsenn/, stress: /stres/
    },
    modality: {
      cbt: /cbt|poznawczo/, emdr: /emdr/, psychodynamic: /psychodynam/, schema: /schemat/,
      act: /\bact\b/, systemic: /systemow/, gestalt: /gestalt/, humanistic: /humanist/
    },
    gender: { f: /kobiet/, m: /mezczyzn/ },
    age: { young: /do 40/, mid: /40\s*.{1,3}\s*45/, senior: /powyzej 45|45\s*\+|po 45/ },
    style: { directive: /narzedzi|zadan/, exploratory: /rozmow|przyczyn/, mixed: /mieszan/ },
    tone: { warm: /ciepl|lagodn/, direct: /bezposredn|konkretn|wprost/ },
    values: { lgbt: /lgbt/, faith: /wiar|duchow/, secular: /swieck/, neuro: /neuroroz/, parenting: /rodzic/, corpo: /korpo/ },
    time: { asap: /najszybciej|pilnie|od zaraz/, evenings: /wieczor/, weekends: /weekend/ }
  };
  const hits = (text, map) => Object.keys(map).filter(k => map[k].test(text));

  const LABELS = {
    mood: 'samopoczuc', problems: 'problem', symptoms: 'objaw', goals: 'cele', modality: 'nurt', gender: 'plec', age: 'wiek',
    style: 'styl', tone: 'ton', who: 'kim jestem', values: 'wazne', history: 'doswiadczen', avoid: 'unikac',
    urgency: 'pilnosc', time: 'termin', summary: 'zdaniach'
  };
  // Dzieli odpowiedź czatu na pola. Znosi markdown (**POLE:**), listy i wartości w kilku liniach.
  function sections(raw) {
    const out = {}; let cur = null;
    raw.split('\n').forEach(line => {
      const clean = line.replace(/[*#_`>]/g, '').trim();
      const m = clean.match(/^[-\d.\s]*([^:]{2,40}):\s*(.*)$/);
      const key = m && Object.keys(LABELS).find(k => norm(m[1]).includes(LABELS[k]));
      if (key && !(key in out)) { cur = key; out[key] = m[2]; }
      else if (cur && clean) out[cur] += ' ' + clean;
    });
    return out;
  }

  function parseChatAnswer(raw) {
    const sec = sections(raw), all = norm(raw);
    const f = k => sec[k] != null ? norm(sec[k]) : null;
    const one = k => { const v = f(k); if (v == null) return null; const h = hits(v, RX[k]); return h.length === 1 ? h[0] : null; };
    const a = {};

    // problemy i nurt: z pola, a gdy czat zignorował format, z całej odpowiedzi
    let problems = hits(f('problems') != null ? f('problems') : all, RX.problems);
    if (problems.length > 4) problems = [];            // nieuzupełniony szablon
    if (problems.length) a.problems = problems.slice(0, 3);
    const mods = hits(f('modality') != null ? f('modality') : all, RX.modality);
    if (mods.length === 1) a.modality = mods[0];

    ['gender', 'age', 'style', 'tone', 'time'].forEach(k => { const v = one(k); if (v) a[k] = v; });
    if (f('values') != null) { const v = hits(f('values'), RX.values); if (v.length && v.length < 6) a.values = v; }

    // kontekst życiowy z całego tekstu: tu czat wie najwięcej
    const ctx = Object.keys(CONTEXTS).filter(k => CONTEXTS[k].rx.test(all));
    if (ctx.length) a.contexts = ctx;

    const num = k => { const m = (sec[k] || '').match(/[1-5](?:[.,]\d)?/); return m ? parseFloat(m[0].replace(',', '.')) : null; };
    const urgency = num('urgency');
    if (!a.time && urgency >= 4) a.time = 'asap';
    S.profile = { mood: num('mood'), urgency, goals: sec.goals || '', who: sec.who || '', avoid: sec.avoid || '', summary: sec.summary || '', fields: Object.keys(sec).length };
    return a;
  }

  $('#promptBox').textContent = GPT_PROMPT;
  $('#copyPrompt').addEventListener('click', () => {
    const fallback = () => {
      const r = document.createRange(); r.selectNodeContents($('#promptBox'));
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      toast('Zaznaczono. Skopiuj ręcznie');
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(GPT_PROMPT).then(() => toast('Skopiowano prompt'), fallback);
    } else fallback();
  });
  $('#gptSample').addEventListener('click', () => { $('#gptAnswer').value = GPT_SAMPLE; $('#gptError').hidden = true; });
  $('#gptSubmit').addEventListener('click', () => {
    const raw = $('#gptAnswer').value.trim();
    const err = $('#gptError');
    const a = raw ? parseChatAnswer(raw) : {};
    if (!a.problems && !a.modality) {
      err.textContent = raw
        ? 'Nie znaleźliśmy w tej odpowiedzi problemu ani nurtu. Wklej całą odpowiedź czatu albo wróć i odpowiedz na pytania.'
        : 'Wklej odpowiedź czatu, żebyśmy mogli dobrać terapeutę.';
      err.hidden = false; return;
    }
    err.hidden = true;
    S.answers = a;
    renderReview();
    show('review');
  });

  /* ---------- podsumowanie odpowiedzi czatu ---------- */
  const FOLLOW_UP = { gender: 'płeć terapeuty', age: 'wiek terapeuty', style: 'styl pracy', tone: 'ton rozmowy', time: 'terminy' };
  function renderReview() {
    const a = S.answers, p = S.profile || {};
    const group = (label, items) => items.length ? `<div class="rv"><p class="label">${label}</p><ul class="chips">${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>` : '';
    const quote = (label, text) => text ? `<div class="rv"><p class="label">${label}</p><p class="rv-quote">${esc(text.length > 260 ? text.slice(0, 257) + '…' : text)}</p></div>` : '';
    const stars = n => '★★★★★'.slice(0, Math.round(n)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(n));
    const missing = Object.keys(FOLLOW_UP).filter(k => !a[k]);
    S.missing = missing;
    $('#reviewBody').innerHTML =
      (p.mood ? `<div class="mood"><div><span class="mood-n">${String(p.mood).replace('.', ',')}</span><span class="mood-of">/ 5</span></div><span class="stars">${stars(p.mood)}</span><span class="mood-t">Tak oceniasz swoje samopoczucie. Szukamy kogoś, kto pomoże dojść do 5.</span></div>` : '') +
      group('Z czym przychodzisz', (a.problems || []).map(x => PROBLEMS[x].label)) +
      group('Nurt', a.modality ? [MODALITIES[a.modality].label] : []) +
      group('Jak chcesz pracować', [a.style && { directive: 'narzędzia i zadania', exploratory: 'spokojna rozmowa', mixed: 'styl mieszany' }[a.style], a.tone && (a.tone === 'warm' ? 'ciepły ton' : 'bezpośredni ton')].filter(Boolean)) +
      group('Szukamy doświadczenia w pracy z', (a.contexts || []).map(c => CONTEXTS[c].label).concat((a.values || []).map(v => VALUES[v].toLowerCase()))) +
      quote('Twoje cele', p.goals) + quote('Czego unikać', p.avoid) + quote('Własnymi słowami', p.summary);
    $('#reviewMissing').textContent = missing.length
      ? 'Czat nie wiedział: ' + missing.map(k => FOLLOW_UP[k]).join(', ') + '.'
      : 'Mamy komplet. Nie musisz niczego dopowiadać.';
    $('#reviewFill').hidden = !missing.length;
    $('#reviewFill').textContent = missing.length === 1 ? 'Doprecyzuj (1 pytanie)' : `Doprecyzuj (${missing.length} pytania)`;
    if (missing.length >= 5) $('#reviewFill').textContent = `Doprecyzuj (${missing.length} pytań)`;
    $('#reviewGo').className = missing.length ? 'btn btn-link' : 'btn btn-primary';
    $('#reviewGo').textContent = missing.length ? 'Pomiń i pokaż terapeutów' : 'Pokaż terapeutów';
  }
  $('#reviewFill').addEventListener('click', () => startQuiz(S.missing));
  $('#reviewGo').addEventListener('click', startMatching);

  /* ---------- terminy ---------- */
  const DAY = 86400000;
  const today = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
  const hash = s => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 9973; return h; };

  function slotsFor(t) {
    if (t._slots) return t._slots;
    const hours = t.evenings ? [16, 17, 18, 19, 20] : [9, 10, 11, 13, 14, 15];
    const days = [];
    for (let off = t.firstDay; days.length < 6 && off < 21; off++) {
      const date = new Date(today.getTime() + off * DAY), wd = date.getDay();
      const weekend = wd === 0 || wd === 6;
      if (weekend && !t.weekends) continue;
      const hs = (weekend ? [10, 11, 12, 13] : hours).filter(h => hash(t.id + off + ':' + h) % 5 > 1);
      if (hs.length) days.push({ date, hours: hs });
    }
    return (t._slots = days);
  }
  const firstSlot = t => { const d = slotsFor(t)[0]; return d.date.getTime() + d.hours[0] * 3600000; };
  const fmtDay = new Intl.DateTimeFormat('pl-PL', { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtWd = new Intl.DateTimeFormat('pl-PL', { weekday: 'short' });
  const fmtLong = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
  function slotLabel(date, hour) {
    const diff = Math.round((date.getTime() - today.getTime()) / DAY);
    const day = diff === 0 ? 'dziś' : diff === 1 ? 'jutro' : diff === 2 ? 'pojutrze' : fmtDay.format(date);
    return `${day}, ${hour}:00`;
  }
  const role = t => t.gender === 'f' ? 'psychoterapeutka' : 'psychoterapeuta';

  /* ---------- ranking ---------- */
  function scoreOf(t, a) {
    let s = 0; const why = [];
    if (a.modality && MODALITIES[a.modality] && t.modalities.includes(a.modality)) { s += 30; why.push(MODALITIES[a.modality].short); }
    (a.problems || []).forEach(p => { if (t.problems.includes(p)) { s += 14; why.push(PROBLEMS[p].label); } });
    if (a.gender && a.gender !== 'any' && t.gender === a.gender) s += 10;
    const band = t.age < 40 ? 'young' : t.age <= 45 ? 'mid' : 'senior';
    if (a.age && a.age !== 'any' && band === a.age) s += 6;
    if (a.style && (t.style === a.style || t.style === 'mixed')) { s += t.style === a.style ? 9 : 4; if (t.style === a.style && a.style !== 'mixed') why.push(a.style === 'directive' ? 'narzędzia i zadania' : 'spokojna rozmowa'); }
    if (a.tone && t.tone === a.tone) { s += 8; why.push(a.tone === 'warm' ? 'ciepły ton' : 'mówi wprost'); }
    (a.values || []).forEach(v => { if (t.values.includes(v)) { s += 6; why.push(VALUES[v].toLowerCase()); } });
    (a.contexts || []).forEach(c => { if (t.contexts.includes(c)) { s += 5; why.push(CONTEXTS[c].label); } });
    if (a.time === 'evenings' && t.evenings) { s += 7; why.push('wieczory'); }
    if (a.time === 'weekends' && t.weekends) { s += 7; why.push('weekendy'); }
    if (a.time === 'asap') s += Math.max(0, 8 - t.firstDay * 2);
    return { s: s + t.years / 100, why };
  }

  function rank() {
    const list = THERAPISTS.map(t => Object.assign({ t }, scoreOf(t, S.answers)));
    list.sort((x, y) => y.s - x.s);
    list.forEach((x, i) => { x.matchRank = i + 1; });
    list.slice().sort((x, y) => firstSlot(x.t) - firstSlot(y.t)).forEach((x, i) => { x.availRank = i + 1; });
    S.ranked = list;
  }

  function summaryChips(a) {
    const out = [];
    (a.problems || []).forEach(p => out.push(PROBLEMS[p].label));
    if (a.modality && MODALITIES[a.modality]) out.push(MODALITIES[a.modality].short);
    if (a.gender === 'f') out.push('kobieta'); if (a.gender === 'm') out.push('mężczyzna');
    if (a.age && a.age !== 'any') out.push({ young: 'do 40 lat', mid: '40–45 lat', senior: 'powyżej 45 lat' }[a.age]);
    if (a.style) out.push({ directive: 'narzędzia i zadania', exploratory: 'spokojna rozmowa', mixed: 'styl mieszany' }[a.style]);
    if (a.tone) out.push(a.tone === 'warm' ? 'ciepły ton' : 'bezpośredni ton');
    (a.values || []).forEach(v => out.push(VALUES[v].toLowerCase()));
    (a.contexts || []).forEach(c => out.push(CONTEXTS[c].label));
    if (a.time && a.time !== 'any') out.push({ asap: 'jak najszybciej', evenings: 'wieczory', weekends: 'weekendy' }[a.time]);
    return out;
  }

  function startMatching() {
    rank();
    S.sort = 'match';
    show('matching', false);
    $('#matchChips').innerHTML = summaryChips(S.answers).map(c => `<li>${esc(c)}</li>`).join('');
    const el = $('#matchN'), from = CONFIG.totalTherapists, to = CONFIG.shortlist;
    const dur = reducedMotion ? 300 : 1700, t0 = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(from - (from - to) * e);
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(() => { renderFeed(); show('feed'); }, reducedMotion ? 300 : 650);
    })(t0);
  }

  /* ---------- feed ---------- */
  function renderFeed() {
    const key = S.sort === 'match' ? 'matchRank' : 'availRank';
    const list = S.ranked.slice().sort((x, y) => x[key] - y[key]);
    const feed = $('#feedList');
    feed.innerHTML = list.map((x, i) => {
      const t = x.t, d = slotsFor(t)[0];
      const mods = t.modalities.map(m => MODALITIES[m].short).join(', ');
      return `<article class="tcard" data-id="${t.id}">
        <img class="tcard-photo" src="${t.photo}" alt="${esc(t.name)}, ${role(t)}" ${i ? 'loading="lazy"' : ''}>
        <div class="tcard-shade"></div>
        ${i === 0 ? `<span class="tcard-hint" aria-hidden="true">Przesuń w górę, zobacz ${list.length - 1} kolejnych ↑</span>` : ''}
        <div class="tcard-body">
          <div class="ranks">
            <span class="rank ${S.sort === 'match' ? 'is-on' : ''}">Dopasowanie: #${x.matchRank}</span>
            <span class="rank ${S.sort === 'avail' ? 'is-on' : ''}">Dostępność: #${x.availRank}</span>
          </div>
          <h2>${esc(t.name)}, ${t.age}</h2>
          <p class="tcard-role">${role(t)} · ${esc(mods)}</p>
          <p class="tcard-bio">${esc(t.bio)}</p>
          ${x.why.length ? `<ul class="chips">${x.why.slice(0, 4).map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : ''}
          <p class="tcard-slot">Najbliższy termin: ${slotLabel(d.date, d.hours[0])}</p>
          <button class="btn btn-primary" type="button" data-act="book">Zarezerwuj pierwszą sesję</button>
          <button class="btn btn-ghost" type="button" data-act="chat">Napisz do terapeuty</button>
        </div>
      </article>`;
    }).join('');
    $('#feedPos').innerHTML = list.map((_, i) => `<i class="${i ? '' : 'is-on'}"></i>`).join('');
    feed.scrollTop = 0;
    $$('.seg button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.sort === S.sort)));
  }
  $('.seg').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.dataset.sort === S.sort) return;
    S.sort = b.dataset.sort; renderFeed();
  });
  $('#feedList').addEventListener('scroll', () => {
    const f = $('#feedList'), i = Math.round(f.scrollTop / f.clientHeight);
    $$('#feedPos i').forEach((d, k) => d.classList.toggle('is-on', k === i));
  }, { passive: true });
  $('#feedList').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    S.therapist = THERAPISTS.find(t => t.id === b.closest('.tcard').dataset.id);
    openAccount(b.dataset.act === 'book' ? 'visits' : 'chat', b.dataset.act === 'book');
  });

  /* ---------- konto: wizyty i czat ---------- */
  function openAccount(tab, focusBooking) {
    S.tab = tab; S.focusBooking = !!focusBooking;
    S.pick = { day: 0, hour: null };
    show('app');
    renderAccount();
  }

  const miniCard = t => `<div class="tmini"><img src="${t.photo}" alt=""><div><b>${esc(t.name)}, ${t.age}</b><span>${role(t)} · ${t.years} lat praktyki</span></div></div>`;

  function renderAccount() {
    const t = S.therapist, body = $('#accBody');
    // zarezerwowaną wizytę pokazujemy zawsze, chyba że użytkownik właśnie rezerwuje u innego terapeuty
    const booked = S.booking && (!S.focusBooking || S.booking.tid === t.id) ? S.booking : null;
    const bt = booked && THERAPISTS.find(x => x.id === booked.tid);
    // rezerwacja prosto z feedu: bez dolnego menu, żeby nic nie odciągało od terminu
    const hideTabs = S.focusBooking && !booked;
    $('#tabs').hidden = hideTabs;
    $$('#tabs button').forEach(b => b.setAttribute('aria-current', String(b.dataset.tab === S.tab)));
    $('#composer').hidden = S.tab !== 'chat';

    if (S.tab === 'chat') {
      const msgs = S.msgs[t.id] || [];
      body.innerHTML = miniCard(t) + (msgs.length
        ? `<div class="msgs">${msgs.map(m => `<div class="msg">${esc(m.text)}</div>`).join('')}<span class="msg-meta">Wysłano ${msgs[msgs.length - 1].time}</span></div>
           <p class="chat-head">${esc(t.name)} odpowiada zwykle w ciągu kilku godzin. Powiadomimy Cię o odpowiedzi.</p>`
        : `<p class="chat-head">To początek rozmowy. Napisz, z czym przychodzisz, albo zacznij od gotowej wiadomości.</p>
           <div class="starters">
             <button type="button" class="starter">Dzień dobry, szukam terapeuty. Czy przyjmuje ${t.gender === 'f' ? 'Pani' : 'Pan'} nowe osoby?</button>
             <button type="button" class="starter">Jak wygląda pierwsza sesja?</button>
             <button type="button" class="starter">Czy pracuje ${t.gender === 'f' ? 'Pani' : 'Pan'} z osobami w mojej sytuacji? Opiszę ją w kilku zdaniach.</button>
           </div>`);
      body.scrollTop = body.scrollHeight;
      return;
    }

    if (booked) {
      body.innerHTML = `<h1>Twoje wizyty</h1>
        <div class="visit">
          <span class="visit-ok">✓ Pierwsza sesja zarezerwowana</span>
          <span class="visit-when">${fmtLong.format(booked.date)}, ${booked.hour}:00</span>
          ${miniCard(bt)}
          <button class="btn btn-ghost" type="button" data-act="to-chat">Napisz do terapeuty</button>
        </div>
        <button class="btn btn-link" type="button" data-act="rebook">Zmień termin</button>`;
      return;
    }

    if (!S.focusBooking) {
      body.innerHTML = `<div class="empty">
          <h1>Nie masz jeszcze wizyt</h1>
          <p>Pierwsza sesja to spokojne poznanie się. Wybierz termin, który Ci pasuje.</p>
          ${miniCard(t)}
          <button class="btn btn-primary" type="button" data-act="start-booking">Zarezerwuj pierwszą wizytę</button>
        </div>`;
      return;
    }

    const days = slotsFor(t), day = days[S.pick.day];
    body.innerHTML = `<h1>Wybierz termin pierwszej sesji</h1>
      ${miniCard(t)}
      <p class="label">Dzień</p>
      <div class="days">${days.map((d, i) => `<button type="button" class="day" data-day="${i}" aria-pressed="${i === S.pick.day}"><small>${fmtWd.format(d.date)}</small><b>${d.date.getDate()}</b></button>`).join('')}</div>
      <p class="label">Godzina</p>
      <div class="slots">${day.hours.map(h => `<button type="button" class="slot" data-hour="${h}" aria-pressed="${h === S.pick.hour}">${h}:00</button>`).join('')}</div>
      <button class="btn btn-primary" type="button" data-act="confirm" ${S.pick.hour == null ? 'disabled' : ''}>${S.pick.hour == null ? 'Wybierz godzinę' : 'Zarezerwuj: ' + slotLabel(day.date, S.pick.hour)}</button>`;
  }

  $('#accBody').addEventListener('click', e => {
    const t = S.therapist;
    const day = e.target.closest('.day'), slot = e.target.closest('.slot'), act = e.target.closest('[data-act]'), st = e.target.closest('.starter');
    if (day) { S.pick = { day: +day.dataset.day, hour: null }; renderAccount(); }
    else if (slot) { S.pick.hour = +slot.dataset.hour; renderAccount(); }
    else if (st) { $('#msgInput').value = st.textContent; $('#msgInput').focus(); }
    else if (act) {
      const a = act.dataset.act;
      const booked = S.booking && THERAPISTS.find(x => x.id === S.booking.tid);
      if (a === 'confirm') { S.booking = { tid: t.id, date: slotsFor(t)[S.pick.day].date, hour: S.pick.hour }; S.focusBooking = false; toast('Zarezerwowano'); }
      if (a === 'start-booking') S.focusBooking = true;
      if (a === 'rebook') { S.therapist = booked; S.booking = null; S.focusBooking = true; S.pick = { day: 0, hour: null }; }
      if (a === 'to-chat') { S.therapist = booked; S.tab = 'chat'; }
      renderAccount();
    }
  });
  $('#tabs').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    S.tab = b.dataset.tab;
    if (S.tab === 'visits') S.focusBooking = false;
    renderAccount();
  });
  $('#composer').addEventListener('submit', e => {
    e.preventDefault();
    const input = $('#msgInput'), text = input.value.trim(); if (!text) return;
    const now = new Date();
    (S.msgs[S.therapist.id] = S.msgs[S.therapist.id] || []).push({ text, time: now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0') });
    input.value = '';
    renderAccount();
  });
  $('#accClose').addEventListener('click', () => show('feed'));

  // imię i awatar do uzupełnienia
  function editName() {
    const input = $('#nameInput');
    $('#nameBtn').hidden = true; input.hidden = false; input.value = S.name; input.focus();
  }
  function saveName() {
    const input = $('#nameInput'); if (input.hidden) return;
    S.name = input.value.trim();
    input.hidden = true; $('#nameBtn').hidden = false;
    $('#nameBtn').textContent = S.name || 'Twoje imię';
    $('#accSub').textContent = S.name ? 'Dodaj zdjęcie, żeby dokończyć profil' : 'Uzupełnij profil';
  }
  $('#nameBtn').addEventListener('click', editName);
  $('#avatarBtn').addEventListener('click', editName);
  $('#nameInput').addEventListener('blur', saveName);
  $('#nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') e.target.blur(); });

  initHero();
  initDots();
  const route = () => { if ((location.hash || '') === '#jak-dziala') show('how'); };
  window.addEventListener('hashchange', route);
  route();
})();
