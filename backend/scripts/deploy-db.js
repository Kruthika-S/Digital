const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: 'hopper.proxy.rlwy.net',
  port: 59886,
  user: 'root',
  password: 'wCJyGnXYKxbxbfjJtIdyKtHVVUTDeuNb',
  database: 'railway',
};

async function main() {
  console.log('Connecting to Railway MySQL database...');
  const connection = await mysql.createConnection(dbConfig);
  console.log('Connected successfully. Reading schema.sql...');

  const schemaPath = path.join(__dirname, '..', '..', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Splitting statements by semicolon followed by newline or EOF
  const statements = schemaSql
    .split(/;\s*[\r\n]+/g)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Executing ${statements.length} SQL statements...`);
  for (const statement of statements) {
    try {
      console.log(`Executing: ${statement.substring(0, 50).replace(/\n/g, ' ')}...`);
      await connection.query(statement);
    } catch (err) {
      console.error('Error executing statement:', err.message);
    }
  }

  await connection.end();
  console.log('Database deployment complete!');
}

main().catch(err => {
  console.error('Fatal error during DB deployment:', err);
  process.exit(1);
});
