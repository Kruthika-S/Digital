const mysql = require('mysql2/promise');
const env = require('./env');
const logger = require('./logger');

const pool = mysql.createPool({
  host: env.db.host,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  port: env.db.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test the connection
pool.getConnection()
  .then((connection) => {
    logger.info(`Database connected successfully to ${env.db.host}:${env.db.port}/${env.db.database}`);
    connection.release();
  })
  .catch((err) => {
    logger.error('Database connection failed', err);
  });

module.exports = pool;
