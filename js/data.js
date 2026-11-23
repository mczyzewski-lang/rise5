/* Rise5 — dane demonstracyjne prototypu.
   Terapeuci, zdjęcia i liczby poniżej są przykładowe. Podmień je na dane z bazy. */

const CONFIG = {
  totalTherapists: 833,
  shortlist: 8,
  googleRating: '4,9',          // DO PODMIANY: aktualna ocena Risify w Google
  mediaSlots: 4                 // DO PODMIANY: logotypy mediów
};

const MODALITIES = {
  cbt:           { label: 'Poznawczo-behawioralna (CBT)', short: 'CBT', desc: 'Praca z myślami i nawykami, konkretne ćwiczenia', share: 0.38 },
  emdr:          { label: 'EMDR', short: 'EMDR', desc: 'Przepracowanie trudnych wspomnień i traumy', share: 0.09 },
  psychodynamic: { label: 'Psychodynamiczna', short: 'psychodynamiczna', desc: 'Szukanie źródeł w relacjach i własnej historii', share: 0.24 },
  schema:        { label: 'Terapia schematów', short: 'terapia schematów', desc: 'Powtarzające się wzorce wyniesione z dzieciństwa', share: 0.12 },
  act:           { label: 'ACT', short: 'ACT', desc: 'Akceptacja i działanie zgodne z wartościami', share: 0.08 },
  systemic:      { label: 'Systemowa', short: 'systemowa', desc: 'Relacje, para, rodzina', share: 0.14 },
  gestalt:       { label: 'Gestalt', short: 'Gestalt', desc: 'Tu i teraz, kontakt z emocjami', share: 0.07 },
  humanistic:    { label: 'Humanistyczna', short: 'humanistyczna', desc: 'Rozmowa w Twoim tempie, bez oceniania', share: 0.10 }
};

const PROBLEMS = {
  adhd:          { label: 'ADHD', share: 0.115 },
  anxiety:       { label: 'Lęk i ataki paniki', share: 0.52 },
  depression:    { label: 'Obniżony nastrój, depresja', share: 0.48 },
  trauma:        { label: 'Trauma, PTSD', share: 0.20 },
  relationships: { label: 'Związek i relacje', share: 0.35 },
  burnout:       { label: 'Wypalenie i praca', share: 0.28 },
  selfesteem:    { label: 'Samoocena', share: 0.40 },
  grief:         { label: 'Żałoba i strata', share: 0.15 },
  eating:        { label: 'Relacja z jedzeniem', share: 0.10 },
  addiction:     { label: 'Uzależnienia', share: 0.09 },
  sleep:         { label: 'Sen', share: 0.12 },
  stress:        { label: 'Stres', share: 0.45 }
};

const VALUES = {
  lgbt:      'Przyjazny osobom LGBT+',
  faith:     'Szanuje moją wiarę',
  secular:   'Podejście świeckie',
  neuro:     'Zna neuroróżnorodność',
  parenting: 'Rozumie rodzicielstwo',
  corpo:     'Zna realia korporacji'
};

// Kontekst życiowy: w quizie jako pytanie, w odpowiedzi czatu wyłapywany z całego tekstu (rx działa na tekście bez polskich znaków).
const CONTEXTS = {
  entrepreneur: { label: 'przedsiębiorcy', q: 'Prowadzę firmę', rx: /przedsiebior|wlasn\w* firm|biznes|founder|startup/ },
  parent:       { label: 'rodzice', q: 'Jestem rodzicem', rx: /rodzic|dziec|zyci\w* rodzinn/ },
  highfunc:     { label: 'wysokie wymagania wobec siebie', q: 'Dużo od siebie wymagam', rx: /wysoko funkcjonuj|ambicj|perfekcjon|wymagam od siebie/ },
  worklife:     { label: 'równowaga praca–dom', q: 'Nie umiem wyłączyć pracy', rx: /rownowag|wylaczyc myslen|pracoholi|work.?life/ },
  beliefs:      { label: 'praca z przekonaniami', q: 'Chcę, żeby ktoś podważał moje przekonania', rx: /przekonan|kwestionow|podwaza/ },
  firsttime:    { label: 'pierwsza terapia', q: 'To moja pierwsza terapia', rx: /pierwszy raz|pierwsza terapi|nigdy nie byl/ },
  meds:         { label: 'współpraca z psychiatrą', q: 'Jestem pod opieką psychiatry', rx: /psychiatr|farmakoter|\bleki\b|\blekach\b/ }
};

// Ścieżka „nie wiem": codzienne odczucia, które sami tłumaczymy na obszary problemów.
const FEELINGS = [
  { v: 'worry',   label: 'Ciągle się zamartwiam albo czuję napięcie', problems: ['anxiety', 'stress'] },
  { v: 'low',     label: 'Nic mnie nie cieszy, brakuje mi sił', problems: ['depression'] },
  { v: 'focus',   label: 'Nie mogę się skupić, wszystko odkładam', problems: ['adhd'] },
  { v: 'work',    label: 'Praca mnie wykańcza', problems: ['burnout'] },
  { v: 'close',   label: 'Kłócę się z bliskimi albo się od nich oddalam', problems: ['relationships'] },
  { v: 'harsh',   label: 'Bardzo surowo siebie oceniam', problems: ['selfesteem'] },
  { v: 'memory',  label: 'Wracają do mnie trudne wspomnienia', problems: ['trauma'] },
  { v: 'loss',    label: 'Przeżywam stratę', problems: ['grief'] },
  { v: 'sleep',   label: 'Źle śpię', problems: ['sleep'] },
  { v: 'food',    label: 'Jedzenie zajmuje mi za dużo myśli', problems: ['eating'] },
  { v: 'control', label: 'Coś wymyka mi się spod kontroli: alkohol, telefon, hazard', problems: ['addiction'] },
  { v: 'vague',   label: 'Trudno to nazwać, po prostu jest mi źle', problems: [] }
];

const QUESTIONS = [
  {
    id: 'path', stage: 1, type: 'single',
    title: 'Od czego zaczynamy?',
    hint: 'Wybierz to, co jest Ci najbliższe. Każda z trzech dróg prowadzi do dopasowanych terapeutów.',
    options: [
      { v: 'problem',  label: 'Zacznę od problemu', desc: 'Na przykład ADHD, lęk, wypalenie' },
      { v: 'modality', label: 'Wiem, jakiej terapii szukam', desc: 'Na przykład CBT, EMDR, psychodynamiczna' },
      { v: 'unsure',   label: 'Nie wiem, od czego zacząć', desc: 'Zaznaczysz, jak się czujesz, a my nazwiemy to za Ciebie' }
    ]
  },
  {
    id: 'feel', stage: 1, type: 'multi', max: 3,
    when: a => a.path === 'unsure',
    title: 'Co ostatnio najbardziej Ci doskwiera?',
    hint: 'Wybierz do 3 zdań. Nie musisz znać nazw ani diagnoz. W nagłym kryzysie zadzwoń pod 112 albo na bezpłatny telefon wsparcia 116 123.',
    options: FEELINGS.map(f => ({ v: f.v, label: f.label }))
  },
  {
    id: 'modality', stage: 1, type: 'single',
    when: a => a.path === 'modality',
    title: 'Jakiego rodzaju terapii szukasz?',
    options: Object.entries(MODALITIES).map(([v, m]) => ({ v, label: m.label, desc: m.desc }))
      .concat([{ v: 'unknown', label: 'Nie mam pewności', desc: 'Dobierzemy nurt do problemu' }])
  },
  {
    id: 'problems', stage: 1, type: 'multi', max: 3, layout: 'chips',
    when: a => a.path === 'problem' || a.modality === 'unknown',
    title: 'Z czym przychodzisz?',
    hint: 'Wybierz do 3 obszarów.',
    options: Object.entries(PROBLEMS).map(([v, p]) => ({ v, label: p.label }))
  },
  {
    id: 'gender', stage: 2, type: 'single', skippable: true,
    title: 'Z kim łatwiej będzie Ci rozmawiać?',
    options: [
      { v: 'f', label: 'Z kobietą' },
      { v: 'm', label: 'Z mężczyzną' },
      { v: 'any', label: 'Bez znaczenia' }
    ]
  },
  {
    id: 'age', stage: 2, type: 'single', skippable: true,
    title: 'W jakim wieku ma być terapeuta?',
    options: [
      { v: 'young',  label: 'Do 40 lat' },
      { v: 'mid',    label: '40–45 lat' },
      { v: 'senior', label: 'Powyżej 45 lat' },
      { v: 'any',    label: 'Bez znaczenia' }
    ]
  },
  {
    id: 'style', stage: 2, type: 'single', skippable: true,
    title: 'Jak chcesz pracować na sesjach?',
    options: [
      { v: 'directive',   label: 'Konkretne narzędzia i zadania', desc: 'Plan, ćwiczenia między sesjami' },
      { v: 'exploratory', label: 'Spokojna rozmowa i szukanie przyczyn', desc: 'Bez pośpiechu, w głąb' },
      { v: 'mixed',       label: 'Trochę jednego i drugiego' }
    ]
  },
  {
    id: 'tone', stage: 2, type: 'single', skippable: true,
    title: 'Jaki ton Ci odpowiada?',
    options: [
      { v: 'warm',   label: 'Ciepły i łagodny', desc: 'Najpierw poczucie bezpieczeństwa' },
      { v: 'direct', label: 'Bezpośredni i konkretny', desc: 'Mów mi wprost, co widzisz' }
    ]
  },
  {
    id: 'values', stage: 2, type: 'multi', layout: 'chips', skippable: true,
    title: 'Co jeszcze jest dla Ciebie ważne?',
    hint: 'Przekonania i doświadczenie terapeuty. Możesz wybrać kilka albo pominąć.',
    options: Object.entries(VALUES).map(([v, label]) => ({ v, label }))
  },
  {
    id: 'contexts', stage: 2, type: 'multi', layout: 'chips', skippable: true,
    title: 'Co warto o Tobie wiedzieć?',
    hint: 'Dobierzemy kogoś, kto zna taką sytuację z gabinetu.',
    options: Object.entries(CONTEXTS).map(([v, c]) => ({ v, label: c.q }))
  },
  {
    id: 'time', stage: 2, type: 'single', skippable: true,
    title: 'Kiedy chcesz zacząć?',
    options: [
      { v: 'asap',     label: 'Jak najszybciej' },
      { v: 'evenings', label: 'Wieczorami, po pracy' },
      { v: 'weekends', label: 'W weekendy' },
      { v: 'any',      label: 'Dowolnie' }
    ]
  }
];

const THERAPISTS = [
  { id: 't1', contexts: ['highfunc', 'firsttime', 'meds'], name: 'Anna', age: 41, gender: 'f', photo: 'assets/therapists/t1.jpg', years: 12,
    modalities: ['cbt', 'schema'], problems: ['adhd', 'anxiety', 'selfesteem', 'stress'],
    style: 'directive', tone: 'warm', values: ['neuro', 'lgbt', 'corpo'],
    evenings: true, weekends: false, firstDay: 3,
    bio: 'Pracuje z dorosłymi z ADHD i lękiem. Na sesjach dużo konkretu i ćwiczeń do wypróbowania w tygodniu.' },
  { id: 't2', contexts: ['parent', 'firsttime'], name: 'Marta', age: 44, gender: 'f', photo: 'assets/therapists/t2.jpg', years: 15,
    modalities: ['psychodynamic'], problems: ['depression', 'relationships', 'grief', 'selfesteem'],
    style: 'exploratory', tone: 'warm', values: ['parenting', 'faith'],
    evenings: false, weekends: false, firstDay: 1,
    bio: 'Pomaga zrozumieć, skąd biorą się powtarzające się trudności w relacjach i nastroju.' },
  { id: 't3', contexts: ['meds', 'firsttime'], name: 'Karolina', age: 38, gender: 'f', photo: 'assets/therapists/t3.jpg', years: 9,
    modalities: ['emdr', 'cbt'], problems: ['trauma', 'anxiety', 'sleep', 'stress'],
    style: 'mixed', tone: 'direct', values: ['secular', 'lgbt'],
    evenings: true, weekends: true, firstDay: 2,
    bio: 'Terapeutka EMDR. Pracuje z traumą, lękiem i problemami ze snem. Przyjmuje także w soboty.' },
  { id: 't4', contexts: ['parent', 'worklife'], name: 'Ewa', age: 46, gender: 'f', photo: 'assets/therapists/t4.jpg', years: 18,
    modalities: ['systemic', 'humanistic'], problems: ['relationships', 'burnout', 'grief', 'eating'],
    style: 'exploratory', tone: 'warm', values: ['parenting', 'corpo'],
    evenings: true, weekends: false, firstDay: 5,
    bio: 'Terapia par i terapia indywidualna. Spokojna rozmowa w Twoim tempie.' },
  { id: 't5', contexts: ['entrepreneur', 'highfunc', 'worklife', 'beliefs', 'parent'], name: 'Tomasz', age: 42, gender: 'm', photo: 'assets/therapists/t5.jpg', years: 13,
    modalities: ['cbt', 'act'], problems: ['adhd', 'burnout', 'stress', 'addiction'],
    style: 'directive', tone: 'direct', values: ['neuro', 'corpo', 'secular'],
    evenings: true, weekends: false, firstDay: 1,
    bio: 'ADHD u dorosłych, wypalenie, uzależnienia behawioralne. Mówi wprost i pracuje na konkretnych celach.' },
  { id: 't6', contexts: ['firsttime', 'highfunc'], name: 'Michał', age: 39, gender: 'm', photo: 'assets/therapists/t6.jpg', years: 8,
    modalities: ['gestalt', 'humanistic'], problems: ['selfesteem', 'relationships', 'depression', 'stress'],
    style: 'exploratory', tone: 'warm', values: ['lgbt', 'secular'],
    evenings: false, weekends: true, firstDay: 2,
    bio: 'Pracuje z samooceną i relacjami. Dużo uwagi na to, co dzieje się tu i teraz.' },
  { id: 't7', contexts: ['parent', 'beliefs'], name: 'Piotr', age: 45, gender: 'm', photo: 'assets/therapists/t7.jpg', years: 17,
    modalities: ['psychodynamic', 'schema'], problems: ['depression', 'anxiety', 'trauma', 'grief'],
    style: 'mixed', tone: 'warm', values: ['faith', 'parenting'],
    evenings: true, weekends: false, firstDay: 4,
    bio: 'Depresja, lęk, żałoba. Łączy szukanie przyczyn z pracą nad schematami.' },
  { id: 't8', contexts: ['beliefs', 'meds', 'highfunc'], name: 'Jakub', age: 43, gender: 'm', photo: 'assets/therapists/t8.jpg', years: 14,
    modalities: ['cbt', 'emdr'], problems: ['anxiety', 'trauma', 'sleep', 'eating'],
    style: 'directive', tone: 'direct', values: ['secular', 'neuro'],
    evenings: false, weekends: false, firstDay: 1,
    bio: 'CBT i EMDR. Ataki paniki, bezsenność, trauma. Jasny plan od pierwszej sesji.' }
];

const GPT_PROMPT = `Na podstawie wszystkiego, co wiesz o mnie z naszych rozmów, przygotuj mój profil do doboru psychoterapeuty w Rise5.

Zasady:
- Odpowiedz wyłącznie w poniższym formacie, każde pole w nowej linii, bez wstępu i bez komentarza na końcu.
- Nie pisz „nie wiem”. Jeśli nie masz pewności, wybierz najbardziej prawdopodobną odpowiedź i dopisz w nawiasie (przypuszczam).
- Pisz konkretnie, moimi słowami i na przykładach z naszych rozmów.

SAMOPOCZUCIE: (jedna liczba od 1 do 5: jak się ostatnio czuję, np. 2,5)
PROBLEMY: (maksymalnie 3 z listy, od najważniejszego: ADHD, lęk, depresja, trauma, związki, wypalenie, samoocena, żałoba, odżywianie, uzależnienia, sen, stres)
OBJAWY NA CO DZIEŃ: (3 konkretne sytuacje, w których to widać)
CELE: (3 rzeczy, które chcę zmienić dzięki terapii)
NURT: (jeden z: CBT, EMDR, psychodynamiczna, schematów, ACT, systemowa, Gestalt, humanistyczna. Jeśli nigdy o tym nie mówiłem, dobierz najlepszy do problemów)
STYL PRACY: (narzędzia i zadania, spokojna rozmowa i szukanie przyczyn albo mieszany)
TON: (ciepły i łagodny albo bezpośredni)
KIM JESTEM: (praca i rola, rodzina, etap życia. 1–2 zdania)
WAŻNE DLA MNIE: (dowolne z: LGBT+, wiara, podejście świeckie, neuroróżnorodność, rodzicielstwo, korporacja)
DOŚWIADCZENIE Z TERAPIĄ: (pierwszy raz albo byłem wcześniej: co działało, a co nie. Dopisz, jeśli biorę leki lub jestem pod opieką psychiatry)
CZEGO UNIKAĆ: (co zniechęci mnie do terapeuty)
PILNOŚĆ: (jedna liczba od 1 do 5, gdzie 5 to „potrzebuję wizyty w tym tygodniu”)
W TRZECH ZDANIACH: (z czym przychodzę i jakiego terapeuty potrzebuję)`;

const GPT_SAMPLE = `SAMOPOCZUCIE: 2,7
PROBLEMY: ADHD, stres, lęk
OBJAWY NA CO DZIEŃ: Zaczynam pięć projektów naraz i żadnego nie domykam. Wieczorem przy dzieciach dalej odpisuję na maile. Budzę się o 4 rano z listą zadań w głowie.
CELE: Wyłączać pracę po 18. Domykać to, co zaczynam. Mniej napięcia w domu.
NURT: CBT (przypuszczam)
STYL PRACY: narzędzia i zadania
TON: bezpośredni
KIM JESTEM: Przedsiębiorca, prowadzę własną firmę od 8 lat. Mąż i ojciec dwójki dzieci.
WAŻNE DLA MNIE: neuroróżnorodność, rodzicielstwo
DOŚWIADCZENIE Z TERAPIĄ: Pierwszy raz. Próbowałem coachingu, ale kończyło się na motywacji bez narzędzi.
CZEGO UNIKAĆ: Ogólników i samego słuchania bez informacji zwrotnej.
PILNOŚĆ: 3
W TRZECH ZDANIACH: Mam ADHD i dużą potrzebę działania, ale nie umiem wyłączyć myślenia o pracy. Szukam terapeuty, który rozumie ADHD u wysoko funkcjonujących dorosłych i potrafi kwestionować moje przekonania. Ma mówić wprost i dawać konkretne narzędzia.`;
