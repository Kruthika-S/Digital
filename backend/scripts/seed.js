/**
 * seed.js — Run this once to insert admin + member accounts into the DB.
 * Usage:  node scripts/seed.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const SALT_ROUNDS = 10;

const USERS = [
  { name: 'Admin User',  email: 'admin@digitalheroes.com',  password: 'password123', role: 'admin'  },
  { name: 'Member User', email: 'member@digitalheroes.com', password: 'password123', role: 'member' },
];

(async () => {
  const connection = await mysql.createConnection({
    host    : process.env.DB_HOST     || 'localhost',
    port    : process.env.DB_PORT     || 3306,
    user    : process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'digital_heroes',
  });

  console.log('✅ Connected to database:', process.env.DB_NAME || 'digital_heroes');

  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, SALT_ROUNDS);
    await connection.execute(
      `INSERT INTO users (name, email, password, role)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name     = VALUES(name),
         password = VALUES(password),
         role     = VALUES(role)`,
      [u.name, u.email, hash, u.role]
    );
    console.log(`✅ Upserted user: ${u.email}  (role: ${u.role})`);
  }

  await connection.end();
  console.log('\n🎉 Seed complete!\n');
  console.log('Login credentials:');
  console.log('  Admin  → admin@digitalheroes.com   / password123');
  console.log('  Member → member@digitalheroes.com  / password123');
})().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
