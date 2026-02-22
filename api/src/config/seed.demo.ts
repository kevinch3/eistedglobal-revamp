/**
 * Demo seed — wipes the current DB and populates it with realistic mock data.
 * The real data is preserved in api/data/eistedglobal.real.db
 * Run with: npm run seed:demo
 */
import bcrypt from 'bcryptjs';
import { faker } from '@faker-js/faker';
import { getDb } from './database';

faker.seed(42); // deterministic — same data every run

const db = getDb();

// ── 1. Wipe all tables (reverse FK order) ────────────────────────────────
db.exec(`
  DELETE FROM obra;
  DELETE FROM inscriptos;
  DELETE FROM subida;
  DELETE FROM persona;
  DELETE FROM competencia;
  DELETE FROM categoria;
  DELETE FROM anio;
  DELETE FROM usuario;
`);
console.log('✓ Database cleared');

// ── 2. Admin user ────────────────────────────────────────────────────────
db.prepare('INSERT INTO usuario (username, password, nombre) VALUES (?, ?, ?)').run(
  'admin',
  bcrypt.hashSync('admin1234', 10),
  'Administrador',
);
console.log('✓ Admin user  →  admin / admin1234');

// ── 3. Categories ────────────────────────────────────────────────────────
const categorias = [
  { nombre: 'Canto Individual', nomcym: 'Canu Unigol'  },
  { nombre: 'Canto Grupal',     nomcym: 'Canu Grŵp'   },
  { nombre: 'Recitado',         nomcym: 'Adrodd'       },
  { nombre: 'Danza',            nomcym: 'Dawns'        },
  { nombre: 'Instrumental',     nomcym: 'Offerynnol'   },
  { nombre: 'Composición',      nomcym: 'Cyfansoddi'   },
  { nombre: 'Artesanías',       nomcym: 'Crefft'       },
];

const insertCat = db.prepare('INSERT INTO categoria (nombre, nomcym) VALUES (?, ?)');
const catIds: number[] = categorias.map(
  cat => Number(insertCat.run(cat.nombre, cat.nomcym).lastInsertRowid),
);
console.log('✓ Categories seeded');

// ── 4. Years ─────────────────────────────────────────────────────────────
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR - 3 + i);

const insertAnio = db.prepare('INSERT INTO anio (id_anio, comision, presentadores) VALUES (?, ?, ?)');
for (const year of YEARS) {
  const comision      = Array.from({ length: 5 }, () => faker.person.fullName()).join(', ');
  const presentadores = [faker.person.fullName(), faker.person.fullName()].join(', ');
  insertAnio.run(year, comision, presentadores);
}
console.log(`✓ Years: ${YEARS.join(', ')}`);

// ── 5. Competencias ───────────────────────────────────────────────────────
interface CompDef {
  catIndex: number;
  desc:     string;
  idioma:   string;
  grupind:  'IND' | 'GRU';
}

const compDefs: CompDef[] = [
  // Canto Individual
  { catIndex: 0, desc: 'Solo vocal — adultos (mayores de 18)',  idioma: 'Castellano', grupind: 'IND' },
  { catIndex: 0, desc: 'Solo vocal — juvenil (13–17 años)',      idioma: 'Cymraeg',    grupind: 'IND' },
  { catIndex: 0, desc: 'Solo vocal — infantil (hasta 12 años)', idioma: 'Castellano', grupind: 'IND' },
  // Canto Grupal
  { catIndex: 1, desc: 'Coro mixto — hasta 20 voces',          idioma: 'Cymraeg',    grupind: 'GRU' },
  { catIndex: 1, desc: 'Dúo o trío vocal',                     idioma: 'Castellano', grupind: 'GRU' },
  // Recitado
  { catIndex: 2, desc: 'Poesía en castellano',                 idioma: 'Castellano', grupind: 'IND' },
  { catIndex: 2, desc: 'Poesía en cymraeg',                    idioma: 'Cymraeg',    grupind: 'IND' },
  // Danza
  { catIndex: 3, desc: 'Danza tradicional galesa',             idioma: 'Castellano', grupind: 'GRU' },
  { catIndex: 3, desc: 'Danza folclórica argentina',           idioma: 'Castellano', grupind: 'GRU' },
  // Instrumental
  { catIndex: 4, desc: 'Piano — libre',                        idioma: 'Castellano', grupind: 'IND' },
  { catIndex: 4, desc: 'Cuerdas — libre',                      idioma: 'Castellano', grupind: 'IND' },
  // Composición
  { catIndex: 5, desc: 'Composición original — con letra',     idioma: 'Castellano', grupind: 'IND' },
  { catIndex: 5, desc: 'Composición original — instrumental',  idioma: 'Castellano', grupind: 'IND' },
  // Artesanías
  { catIndex: 6, desc: 'Tejido y bordado',                     idioma: 'Castellano', grupind: 'IND' },
  { catIndex: 6, desc: 'Cerámica y alfarería',                 idioma: 'Castellano', grupind: 'IND' },
];

interface CompEntry { id: string; grupind: 'IND' | 'GRU'; anio: number }

const insertComp = db.prepare(`
  INSERT INTO competencia (id_comp, categoria, descripcion, idioma, fk_anio, grupind, rank)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const allComps: CompEntry[] = [];
for (const year of YEARS) {
  compDefs.forEach((def, i) => {
    const id = `${year}-C${String(i + 1).padStart(2, '0')}`;
    insertComp.run(id, catIds[def.catIndex], def.desc, def.idioma, year, def.grupind, i + 1);
    allComps.push({ id, grupind: def.grupind, anio: year });
  });
}
console.log(`✓ ${allComps.length} competitions seeded`);

// ── 6. Personas (participants) ───────────────────────────────────────────
const CIUDADES    = ['Buenos Aires', 'Trelew', 'Gaiman', 'Puerto Madryn', 'Bariloche', 'Neuquén', 'Comodoro Rivadavia', 'Esquel'];
const NACS        = ['Argentina', 'Uruguay', 'Chile', 'Brasil', 'España', 'Gales'];
// Welsh-Argentine surnames typical of Patagonia
const WELSH_SURNAMES = ['Evans', 'Jones', 'Williams', 'Roberts', 'Davies', 'Hughes', 'Morgan', 'Lewis', 'Thomas', 'Jenkins', 'Price', 'Owen'];

const insertPersona = db.prepare(`
  INSERT INTO persona (nombre, apellido, dni, fecha_nac, nacionalidad, residencia, email, telefono, tipo)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

interface PersonaEntry { id: number; tipo: 'IND' | 'GRU' }
const allPersonas: PersonaEntry[] = [];

function argPhone(): string {
  const area = faker.number.int({ min: 11, max: 99 });
  const a    = faker.number.int({ min: 1000, max: 9999 });
  const b    = faker.number.int({ min: 1000, max: 9999 });
  return `+54 9 ${area} ${a}-${b}`;
}

// Individual participants — 30 people
for (let i = 0; i < 30; i++) {
  const nombre   = faker.person.firstName();
  // Every 4th person gets a Welsh-Patagonian surname
  const apellido = i % 4 === 0
    ? faker.helpers.arrayElement(WELSH_SURNAMES)
    : faker.person.lastName();
  const dni      = faker.number.int({ min: 20_000_000, max: 45_000_000 });
  const fechaNac = faker.date.birthdate({ min: 8, max: 65, mode: 'age' }).toISOString().slice(0, 10);
  const nac      = faker.helpers.arrayElement(NACS);
  const res      = faker.helpers.arrayElement(CIUDADES);
  const email    = faker.internet.email({ firstName: nombre, lastName: apellido }).toLowerCase();
  const r = insertPersona.run(nombre, apellido, String(dni), fechaNac, nac, res, email, argPhone(), 'IND');
  allPersonas.push({ id: Number(r.lastInsertRowid), tipo: 'IND' });
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
for (const nombre of GROUP_NAMES) {
  const res   = faker.helpers.arrayElement(CIUDADES);
  const email = faker.internet.email();
  const r = insertPersona.run(nombre, '', '', '', 'Argentina', res, email, argPhone(), 'GRU');
  allPersonas.push({ id: Number(r.lastInsertRowid), tipo: 'GRU' });
}
console.log(`✓ ${allPersonas.length} participants seeded`);

// ── 7. Inscriptos ────────────────────────────────────────────────────────
const insertInsc = db.prepare(`
  INSERT INTO inscriptos (fk_persona, fk_comp, seudonimo, fecha_inscrip, anio_insc, baja)
  VALUES (?, ?, ?, ?, ?, 0)
`);

interface InscEntry { personaId: number; compId: string; anio: number }
const allInscs: InscEntry[] = [];
const inscSet = new Set<string>(); // prevent duplicate (persona, comp) pairs

function randDate(year: number): string {
  const m = String(faker.number.int({ min: 1, max: 12 })).padStart(2, '0');
  const d = String(faker.number.int({ min: 1, max: 28 })).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

for (const year of YEARS) {
  const indComps = allComps.filter(c => c.anio === year && c.grupind === 'IND');
  const gruComps = allComps.filter(c => c.anio === year && c.grupind === 'GRU');

  for (const { id: personaId, tipo } of allPersonas) {
    const pool  = tipo === 'IND' ? indComps : gruComps;
    if (pool.length === 0) continue;

    const count  = faker.number.int({ min: 1, max: Math.min(3, pool.length) });
    const picked = faker.helpers.arrayElements(pool, count);

    for (const comp of picked) {
      const key = `${personaId}::${comp.id}`;
      if (inscSet.has(key)) continue;
      inscSet.add(key);

      const seudonimo = tipo === 'IND'
        ? `${faker.word.adjective()} ${faker.word.noun()}`
        : null;
      insertInsc.run(personaId, comp.id, seudonimo, randDate(year), year);
      allInscs.push({ personaId, compId: comp.id, anio: year });
    }
  }
}
console.log(`✓ ${allInscs.length} registrations seeded`);

// ── 8. Obras (completed years only) ─────────────────────────────────────
const insertObra = db.prepare(`
  INSERT INTO obra (fk_particip, mod_particip, puesto, competencia, nom_obra, fecha)
  VALUES (?, ?, ?, ?, ?, ?)
`);

// Typical Eisteddfod work titles for demo realism
const OBRA_PREFIXES = ['El', 'La', 'Un', 'Una', 'Vals de', 'Himno a', 'Oda a', 'Balada del', 'Canto al'];
const OBRA_SUBJECTS = ['Patagonia', 'los Andes', 'Gales', 'la primavera', 'el viento', 'la memoria', 'los sueños', 'la pampa', 'el mar', 'las montañas'];
const PUESTOS       = ['1', '2', '3', 'mencion', null] as const;

function mockObraName(): string {
  const prefix  = faker.helpers.arrayElement(OBRA_PREFIXES);
  const subject = faker.helpers.arrayElement(OBRA_SUBJECTS);
  return `${prefix} ${subject}`;
}

// Only seed obras for years that have already concluded (all except current year)
const pastYears = new Set(YEARS.slice(0, -1));

for (const { personaId, compId, anio } of allInscs) {
  if (!pastYears.has(anio)) continue;
  const puesto = faker.helpers.arrayElement(PUESTOS);
  insertObra.run(personaId, 'Participante', puesto, compId, mockObraName(), randDate(anio));
}

const { n: obraCount } = db.prepare('SELECT COUNT(*) as n FROM obra').get() as { n: number };
console.log(`✓ ${obraCount} works (obras) seeded for years ${[...pastYears].join(', ')}`);

console.log('\nDemo seed complete — ready to present!');
