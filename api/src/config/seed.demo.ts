/**
 * Demo seed — wipes the current DB and populates it with realistic mock data.
 * Run with: npm run seed:demo
 */
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { getDb } from './database';

faker.seed(42); // deterministic — same data every run

const db = getDb();

// ── 1. Wipe all tables (reverse FK order) ────────────────────────────────
db.exec(`
  DELETE FROM work;
  DELETE FROM registration;
  DELETE FROM upload;
  DELETE FROM participant;
  DELETE FROM competition;
  DELETE FROM category;
  DELETE FROM edition;
  DELETE FROM user;
`);
console.log('✓ Database cleared');

// ── 2. Admin user ────────────────────────────────────────────────────────
db.prepare('INSERT INTO user (username, password, name) VALUES (?, ?, ?)').run(
  'admin',
  bcrypt.hashSync('admin1234', 10),
  'Administrador',
);
console.log('✓ Admin user  →  admin / admin1234');

// ── 3. Categories ────────────────────────────────────────────────────────
const categories = [
  { name: 'Canto Individual', name_welsh: 'Canu Unigol'  },
  { name: 'Canto Grupal',     name_welsh: 'Canu Grŵp'   },
  { name: 'Recitado',         name_welsh: 'Adrodd'       },
  { name: 'Danza',            name_welsh: 'Dawns'        },
  { name: 'Instrumental',     name_welsh: 'Offerynnol'   },
  { name: 'Composición',      name_welsh: 'Cyfansoddi'   },
  { name: 'Artesanías',       name_welsh: 'Crefft'       },
];

const insertCat = db.prepare('INSERT INTO category (name, name_welsh) VALUES (?, ?)');
const catIds: number[] = categories.map(
  cat => Number(insertCat.run(cat.name, cat.name_welsh).lastInsertRowid),
);
console.log('✓ Categories seeded');

// ── 4. Editions (years) ──────────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - 3 + i);

const insertEdition = db.prepare('INSERT INTO edition (year, committee, presenters) VALUES (?, ?, ?)');
for (const year of YEARS) {
  const committee  = Array.from({ length: 5 }, () => faker.person.fullName()).join(', ');
  const presenters = [faker.person.fullName(), faker.person.fullName()].join(', ');
  insertEdition.run(year, committee, presenters);
}
console.log(`✓ Editions: ${YEARS.join(', ')}`);

// ── 5. Competitions ───────────────────────────────────────────────────────
interface CompDef {
  catIndex: number;
  desc:     string;
  language: string;
  type:     'IND' | 'GRU';
}

const compDefs: CompDef[] = [
  // Canto Individual
  { catIndex: 0, desc: 'Solo vocal — adultos (mayores de 18)',  language: 'Castellano', type: 'IND' },
  { catIndex: 0, desc: 'Solo vocal — juvenil (13–17 años)',      language: 'Cymraeg',    type: 'IND' },
  { catIndex: 0, desc: 'Solo vocal — infantil (hasta 12 años)', language: 'Castellano', type: 'IND' },
  // Canto Grupal
  { catIndex: 1, desc: 'Coro mixto — hasta 20 voces',          language: 'Cymraeg',    type: 'GRU' },
  { catIndex: 1, desc: 'Dúo o trío vocal',                     language: 'Castellano', type: 'GRU' },
  // Recitado
  { catIndex: 2, desc: 'Poesía en castellano',                 language: 'Castellano', type: 'IND' },
  { catIndex: 2, desc: 'Poesía en cymraeg',                    language: 'Cymraeg',    type: 'IND' },
  // Danza
  { catIndex: 3, desc: 'Danza tradicional galesa',             language: 'Castellano', type: 'GRU' },
  { catIndex: 3, desc: 'Danza folclórica argentina',           language: 'Castellano', type: 'GRU' },
  // Instrumental
  { catIndex: 4, desc: 'Piano — libre',                        language: 'Castellano', type: 'IND' },
  { catIndex: 4, desc: 'Cuerdas — libre',                      language: 'Castellano', type: 'IND' },
  // Composición
  { catIndex: 5, desc: 'Composición original — con letra',     language: 'Castellano', type: 'IND' },
  { catIndex: 5, desc: 'Composición original — instrumental',  language: 'Castellano', type: 'IND' },
  // Artesanías
  { catIndex: 6, desc: 'Tejido y bordado',                     language: 'Castellano', type: 'IND' },
  { catIndex: 6, desc: 'Cerámica y alfarería',                 language: 'Castellano', type: 'IND' },
];

interface CompEntry { id: string; type: 'IND' | 'GRU'; year: number }

const insertComp = db.prepare(`
  INSERT INTO competition (id, category_id, description, language, year, type, rank)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const allComps: CompEntry[] = [];
for (const year of YEARS) {
  compDefs.forEach((def, i) => {
    const id = `${year}-C${String(i + 1).padStart(2, '0')}`;
    insertComp.run(id, catIds[def.catIndex], def.desc, def.language, year, def.type, i + 1);
    allComps.push({ id, type: def.type, year });
  });
}
console.log(`✓ ${allComps.length} competitions seeded`);

// ── 6. Participants ───────────────────────────────────────────────────────
const CITIES        = ['Buenos Aires', 'Trelew', 'Gaiman', 'Puerto Madryn', 'Bariloche', 'Neuquén', 'Comodoro Rivadavia', 'Esquel'];
const NATIONALITIES = ['Argentina', 'Uruguay', 'Chile', 'Brasil', 'España', 'Gales'];
// Welsh-Argentine surnames typical of Patagonia
const WELSH_SURNAMES = ['Evans', 'Jones', 'Williams', 'Roberts', 'Davies', 'Hughes', 'Morgan', 'Lewis', 'Thomas', 'Jenkins', 'Price', 'Owen'];

const insertParticipant = db.prepare(`
  INSERT INTO participant (name, surname, document_id, birth_date, nationality, residence, email, phone, type, active)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
`);

interface ParticipantEntry { id: number; type: 'IND' | 'GRU' }
const allParticipants: ParticipantEntry[] = [];

function argPhone(): string {
  const area = faker.number.int({ min: 11, max: 99 });
  const a    = faker.number.int({ min: 1000, max: 9999 });
  const b    = faker.number.int({ min: 1000, max: 9999 });
  return `+54 9 ${area} ${a}-${b}`;
}

// Individual participants — 30 people
for (let i = 0; i < 30; i++) {
  const name    = faker.person.firstName();
  // Every 4th person gets a Welsh-Patagonian surname
  const surname = i % 4 === 0
    ? faker.helpers.arrayElement(WELSH_SURNAMES)
    : faker.person.lastName();
  const docId     = faker.number.int({ min: 20_000_000, max: 45_000_000 });
  const birthDate = faker.date.birthdate({ min: 8, max: 65, mode: 'age' }).toISOString().slice(0, 10);
  const nationality = faker.helpers.arrayElement(NATIONALITIES);
  const residence   = faker.helpers.arrayElement(CITIES);
  const email       = faker.internet.email({ firstName: name, lastName: surname }).toLowerCase();
  const r = insertParticipant.run(name, surname, String(docId), birthDate, nationality, residence, email, argPhone(), 'IND');
  allParticipants.push({ id: Number(r.lastInsertRowid), type: 'IND' });
}

// Groups — 6 ensembles/choirs/dance groups
const GROUP_NAMES = [
  'Coro Polifónico Patagónico',
  'Conjunto Folclórico Los Andes',
  'Ensemble Trelew',
  'Grupo de Danza Galesa del Chubut',
  'Trío Instrumental del Sur',
  'Coro Infantil Gaiman',
];
for (const name of GROUP_NAMES) {
  const residence = faker.helpers.arrayElement(CITIES);
  const email     = faker.internet.email();
  const r = insertParticipant.run(name, '', '', '', 'Argentina', residence, email, argPhone(), 'GRU');
  allParticipants.push({ id: Number(r.lastInsertRowid), type: 'GRU' });
}
console.log(`✓ ${allParticipants.length} participants seeded`);

// ── 7. Registrations ─────────────────────────────────────────────────────
const insertReg = db.prepare(`
  INSERT INTO registration (participant_id, competition_id, pseudonym, registered_at, year, dropped)
  VALUES (?, ?, ?, ?, ?, 0)
`);

interface RegEntry { participantId: number; compId: string; year: number }
const allRegs: RegEntry[] = [];
const regSet = new Set<string>(); // prevent duplicate (participant, competition) pairs

function randDate(year: number): string {
  const m = String(faker.number.int({ min: 1, max: 12 })).padStart(2, '0');
  const d = String(faker.number.int({ min: 1, max: 28 })).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

for (const year of YEARS) {
  const indComps = allComps.filter(c => c.year === year && c.type === 'IND');
  const gruComps = allComps.filter(c => c.year === year && c.type === 'GRU');

  for (const { id: participantId, type } of allParticipants) {
    const pool  = type === 'IND' ? indComps : gruComps;
    if (pool.length === 0) continue;

    const count  = faker.number.int({ min: 1, max: Math.min(3, pool.length) });
    const picked = faker.helpers.arrayElements(pool, count);

    for (const comp of picked) {
      const key = `${participantId}::${comp.id}`;
      if (regSet.has(key)) continue;
      regSet.add(key);

      const pseudonym = type === 'IND'
        ? `${faker.word.adjective()} ${faker.word.noun()}`
        : null;
      insertReg.run(participantId, comp.id, pseudonym, randDate(year), year);
      allRegs.push({ participantId, compId: comp.id, year });
    }
  }
}
console.log(`✓ ${allRegs.length} registrations seeded`);

// ── 8. Works (completed years only) ──────────────────────────────────────
const insertWork = db.prepare(`
  INSERT INTO work (participant_id, display_name, placement, competition_id, title, date)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// Typical Eisteddfod work titles for demo realism
const TITLE_PREFIXES = ['El', 'La', 'Un', 'Una', 'Vals de', 'Himno a', 'Oda a', 'Balada del', 'Canto al'];
const TITLE_SUBJECTS = ['Patagonia', 'los Andes', 'Gales', 'la primavera', 'el viento', 'la memoria', 'los sueños', 'la pampa', 'el mar', 'las montañas'];
const PLACEMENTS     = ['1', '2', '3', 'mencion', null] as const;

function mockTitle(): string {
  return `${faker.helpers.arrayElement(TITLE_PREFIXES)} ${faker.helpers.arrayElement(TITLE_SUBJECTS)}`;
}

// Only seed works for years that have already concluded (all except current year)
const pastYears = new Set(YEARS.slice(0, -1));

for (const { participantId, compId, year } of allRegs) {
  if (!pastYears.has(year)) continue;
  const placement = faker.helpers.arrayElement(PLACEMENTS);
  insertWork.run(participantId, 'Participante', placement, compId, mockTitle(), randDate(year));
}

const { n: workCount } = db.prepare('SELECT COUNT(*) as n FROM work').get() as { n: number };
console.log(`✓ ${workCount} works seeded for years ${[...pastYears].join(', ')}`);

console.log('\nDemo seed complete — ready to present!');
