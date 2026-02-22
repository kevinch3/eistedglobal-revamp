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

const existingUser = db.prepare('SELECT id FROM user WHERE username = ?').get(username);
if (!existingUser) {
  db.prepare('INSERT INTO user (username, password, name) VALUES (?, ?, ?)').run(username, hash, 'Administrador');
  console.log(`✓ User "${username}" created (password: ${plainPassword})`);
} else {
  console.log(`ℹ User "${username}" already exists`);
}

// Seed current edition (year)
const year = new Date().getFullYear();
const existingEdition = db.prepare('SELECT year FROM edition WHERE year = ?').get(year);
if (!existingEdition) {
  db.prepare('INSERT INTO edition (year) VALUES (?)').run(year);
  console.log(`✓ Edition ${year} created`);
}

// Seed categories
const categories = [
  { name: 'Canto Individual', name_welsh: 'Canu Unigol' },
  { name: 'Canto Grupal',     name_welsh: 'Canu Grŵp'  },
  { name: 'Recitado',         name_welsh: 'Adrodd'      },
  { name: 'Danza',            name_welsh: 'Dawns'       },
  { name: 'Instrumental',     name_welsh: 'Offerynnol'  },
  { name: 'Composición',      name_welsh: 'Cyfansoddi'  },
  { name: 'Artesanías',       name_welsh: 'Crefft'      },
];

const insertCat = db.prepare('INSERT OR IGNORE INTO category (name, name_welsh) VALUES (?, ?)');
for (const cat of categories) {
  insertCat.run(cat.name, cat.name_welsh);
}
console.log('✓ Categories seeded');

console.log('\nSeed complete.');
