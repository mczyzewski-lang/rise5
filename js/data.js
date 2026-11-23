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

const QUESTIONS = [
  {
    id: 'path', stage: 1, type: 'single',
    title: 'Od czego zaczynamy?',
    hint: 'Terapeutę możesz dobrać przez rodzaj terapii albo przez to, z czym przychodzisz.',
    options: [
      { v: 'problem',  label: 'Zacznę od problemu', desc: 'Na przykład ADHD, lęk, wypalenie' },
      { v: 'modality', label: 'Wiem, jakiej terapii szukam', desc: 'Na przykład CBT, EMDR, psychodynamiczna' }
    ]
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
  { id: 't1', name: 'Anna', age: 41, gender: 'f', photo: 'assets/therapists/t1.jpg', years: 12,
    modalities: ['cbt', 'schema'], problems: ['adhd', 'anxiety', 'selfesteem', 'stress'],
    style: 'directive', tone: 'warm', values: ['neuro', 'lgbt', 'corpo'],
    evenings: true, weekends: false, firstDay: 3,
    bio: 'Pracuje z dorosłymi z ADHD i lękiem. Na sesjach dużo konkretu i ćwiczeń do wypróbowania w tygodniu.' },
  { id: 't2', name: 'Marta', age: 44, gender: 'f', photo: 'assets/therapists/t2.jpg', years: 15,
    modalities: ['psychodynamic'], problems: ['depression', 'relationships', 'grief', 'selfesteem'],
    style: 'exploratory', tone: 'warm', values: ['parenting', 'faith'],
    evenings: false, weekends: false, firstDay: 1,
    bio: 'Pomaga zrozumieć, skąd biorą się powtarzające się trudności w relacjach i nastroju.' },
  { id: 't3', name: 'Karolina', age: 38, gender: 'f', photo: 'assets/therapists/t3.jpg', years: 9,
    modalities: ['emdr', 'cbt'], problems: ['trauma', 'anxiety', 'sleep', 'stress'],
    style: 'mixed', tone: 'direct', values: ['secular', 'lgbt'],
    evenings: true, weekends: true, firstDay: 2,
    bio: 'Terapeutka EMDR. Pracuje z traumą, lękiem i problemami ze snem. Przyjmuje także w soboty.' },
  { id: 't4', name: 'Ewa', age: 46, gender: 'f', photo: 'assets/therapists/t4.jpg', years: 18,
    modalities: ['systemic', 'humanistic'], problems: ['relationships', 'burnout', 'grief', 'eating'],
    style: 'exploratory', tone: 'warm', values: ['parenting', 'corpo'],
    evenings: true, weekends: false, firstDay: 5,
    bio: 'Terapia par i terapia indywidualna. Spokojna rozmowa w Twoim tempie.' },
  { id: 't5', name: 'Tomasz', age: 42, gender: 'm', photo: 'assets/therapists/t5.jpg', years: 13,
    modalities: ['cbt', 'act'], problems: ['adhd', 'burnout', 'stress', 'addiction'],
    style: 'directive', tone: 'direct', values: ['neuro', 'corpo', 'secular'],
    evenings: true, weekends: false, firstDay: 1,
    bio: 'ADHD u dorosłych, wypalenie, uzależnienia behawioralne. Mówi wprost i pracuje na konkretnych celach.' },
  { id: 't6', name: 'Michał', age: 39, gender: 'm', photo: 'assets/therapists/t6.jpg', years: 8,
    modalities: ['gestalt', 'humanistic'], problems: ['selfesteem', 'relationships', 'depression', 'stress'],
    style: 'exploratory', tone: 'warm', values: ['lgbt', 'secular'],
    evenings: false, weekends: true, firstDay: 2,
    bio: 'Pracuje z samooceną i relacjami. Dużo uwagi na to, co dzieje się tu i teraz.' },
  { id: 't7', name: 'Piotr', age: 45, gender: 'm', photo: 'assets/therapists/t7.jpg', years: 17,
    modalities: ['psychodynamic', 'schema'], problems: ['depression', 'anxiety', 'trauma', 'grief'],
    style: 'mixed', tone: 'warm', values: ['faith', 'parenting'],
    evenings: true, weekends: false, firstDay: 4,
    bio: 'Depresja, lęk, żałoba. Łączy szukanie przyczyn z pracą nad schematami.' },
  { id: 't8', name: 'Jakub', age: 43, gender: 'm', photo: 'assets/therapists/t8.jpg', years: 14,
    modalities: ['cbt', 'emdr'], problems: ['anxiety', 'trauma', 'sleep', 'eating'],
    style: 'directive', tone: 'direct', values: ['secular', 'neuro'],
    evenings: false, weekends: false, firstDay: 1,
    bio: 'CBT i EMDR. Ataki paniki, bezsenność, trauma. Jasny plan od pierwszej sesji.' }
];

const GPT_PROMPT = `Na podstawie tego, co wiesz o mnie z naszych rozmów, pomóż mi dobrać psychoterapeutę w Rise5. Odpowiedz wyłącznie w poniższym formacie, bez dodatkowych komentarzy. Jeśli czegoś nie wiesz, wpisz „nie wiem”.

PROBLEMY: (maksymalnie 3 z listy: ADHD, lęk, depresja, trauma, związki, wypalenie, samoocena, żałoba, odżywianie, uzależnienia, sen, stres)
NURT: (CBT, EMDR, psychodynamiczna, schematów, ACT, systemowa, Gestalt, humanistyczna albo „nie wiem”)
PŁEĆ TERAPEUTY: (kobieta, mężczyzna albo bez znaczenia)
WIEK TERAPEUTY: (do 40, 40–45, powyżej 45 albo bez znaczenia)
STYL PRACY: (narzędzia i zadania, spokojna rozmowa i szukanie przyczyn albo mieszany)
TON: (ciepły i łagodny albo bezpośredni)
WAŻNE DLA MNIE: (dowolne z: LGBT+, wiara, podejście świeckie, neuroróżnorodność, rodzicielstwo, korporacja)
TERMINY: (jak najszybciej, wieczory, weekendy albo dowolnie)
W DWÓCH ZDANIACH: (z czym przychodzę i czego potrzebuję od terapeuty)`;

const GPT_SAMPLE = `PROBLEMY: ADHD, wypalenie, stres
NURT: CBT
PŁEĆ TERAPEUTY: bez znaczenia
WIEK TERAPEUTY: 40–45
STYL PRACY: narzędzia i zadania
TON: bezpośredni
WAŻNE DLA MNIE: neuroróżnorodność, korporacja
TERMINY: wieczory
W DWÓCH ZDANIACH: Od miesięcy nie domykam projektów i wracam z pracy bez sił. Potrzebuję kogoś, kto zna ADHD u dorosłych i da mi konkretne narzędzia.`;
