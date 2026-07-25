const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const env = require('./env');
const logger = require('./logger');

let pool;
let isSqlite = false;
let sqliteDb;

// Check if we should use SQLite
if (process.env.DB_TYPE === 'sqlite' || !process.env.DB_HOST || process.env.DB_HOST === 'localhost' && !process.env.DB_PASSWORD) {
  isSqlite = true;
}

if (isSqlite) {
  logger.info('Using SQLite database for deployment/fallback');
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  sqliteDb = new sqlite3.Database(dbPath);

  // Initialize SQLite database schema and seed data
  sqliteDb.serialize(() => {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        company TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        source TEXT,
        status TEXT NOT NULL DEFAULT 'New',
        assigned_user_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_id INTEGER NOT NULL,
        author_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id INTEGER NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Check if seeds need to be inserted
    sqliteDb.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (!err && row.count === 0) {
        logger.info('Seeding SQLite database...');
        const adminPass = bcrypt.hashSync('admin123', 10);
        const memberPass = bcrypt.hashSync('member123', 10);

        sqliteDb.run(`
          INSERT INTO users (name, email, password, role) VALUES 
          ('Admin User', 'admin@digitalheroes.com', ?, 'admin'),
          ('Member User', 'member@digitalheroes.com', ?, 'member')
        `, [adminPass, memberPass], function(err) {
          if (err) logger.error('Error seeding users:', err);
          
          sqliteDb.run(`
            INSERT INTO leads (name, company, email, phone, source, status, assigned_user_id) VALUES
            ('John Doe', 'Acme Corp', 'john@acme.com', '123-456-7890', 'Website', 'New', 2),
            ('Jane Smith', 'Globex', 'jane@globex.com', '098-765-4321', 'Referral', 'Contacted', 2)
          `, [], function(err) {
            if (err) logger.error('Error seeding leads:', err);
            
            sqliteDb.run(`
              INSERT INTO notes (lead_id, author_id, message) VALUES
              (1, 2, 'Left a voicemail.'),
              (2, 2, 'Interested in our enterprise plan.')
            `);
          });
        });
      }
    });
  });

  // Mock mysql2 promise pool interface
  pool = {
    execute: (sql, params = []) => {
      // Convert MySQL param placeholders if necessary (SQLite also uses ?)
      return new Promise((resolve, reject) => {
        // SELECT queries
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
          sqliteDb.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve([rows, []]);
          });
        } else {
          // INSERT, UPDATE, DELETE queries
          sqliteDb.run(sql, params, function(err) {
            if (err) return reject(err);
            // Return insertId / affectedRows in result object
            resolve([{ insertId: this.lastID, affectedRows: this.changes }, []]);
          });
        }
      });
    },
    query: (sql, params = []) => {
      // SQLite query behaves the same as execute in our mock
      return pool.execute(sql, params);
    },
    getConnection: async () => {
      return {
        release: () => {},
        execute: pool.execute,
        query: pool.query,
      };
    }
  };
} else {
  // MySQL implementation
  pool = mysql.createPool({
    host: env.db.host,
    user: env.db.user,
    password: env.db.password,
    database: env.db.database,
    port: env.db.port,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  pool.getConnection()
    .then((connection) => {
      logger.info(`Database connected successfully to MySQL ${env.db.host}:${env.db.port}/${env.db.database}`);
      connection.release();
    })
    .catch((err) => {
      logger.error('Database connection failed', err);
    });
}

module.exports = pool;
