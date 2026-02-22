/**
 * Seed script — creates the default admin user and sample categories.
 * Run with: npm run seed
 */
import bcrypt from 'bcryptjs';
import { getDb } from './database';

const db = getDb();

// Default admin user
const username = 'admin';
const plainPassword = 'admin1234';
const hash = bcrypt.hashSync(plainPassword, 10);

const existingUser = db.prepare('SELECT id FROM usuario WHERE username = ?').get(username);
if (!existingUser) {
  db.prepare('INSERT INTO usuario (username, password, nombre) VALUES (?, ?, ?)').run(username, hash, 'Administrador');
  console.log(`✓ User "${username}" created (password: ${plainPassword})`);
} else {
  console.log(`ℹ User "${username}" already exists`);
}

// Seed anio (current year)
const year = new Date().getFullYear();
const existingAnio = db.prepare('SELECT id_anio FROM anio WHERE id_anio = ?').get(year);
if (!existingAnio) {
  db.prepare('INSERT INTO anio (id_anio) VALUES (?)').run(year);
  console.log(`✓ Year ${year} created`);
}

// Seed categories
const categorias = [
  { nombre: 'Canto Individual', nomcym: 'Canu Unigol' },
  { nombre: 'Canto Grupal', nomcym: 'Canu Grŵp' },
  { nombre: 'Recitado', nomcym: 'Adrodd' },
  { nombre: 'Danza', nomcym: 'Dawns' },
  { nombre: 'Instrumental', nomcym: 'Offerynnol' },
  { nombre: 'Composición', nomcym: 'Cyfansoddi' },
  { nombre: 'Artesanías', nomcym: 'Crefft' },
];

const insertCat = db.prepare('INSERT OR IGNORE INTO categoria (nombre, nomcym) VALUES (?, ?)');
for (const cat of categorias) {
  insertCat.run(cat.nombre, cat.nomcym);
}
console.log('✓ Categories seeded');

console.log('\nSeed complete.');
