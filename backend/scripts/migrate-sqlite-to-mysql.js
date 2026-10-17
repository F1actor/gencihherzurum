require('dotenv').config();

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { initDatabase, pool } = require('../src/config/database');

const sourcePath = process.env.SQLITE_SOURCE_PATH || path.join(__dirname, '..', 'database.sqlite');
const tables = [
  'users', 'units', 'routines', 'events', 'audits', 'unit_history', 'announcements', 'targets', 'champions',
  'muhabbet_students', 'muhabbet_classes', 'muhabbet_menus', 'muhabbet_attendance', 'muhabbet_settings'
];

function sqliteAll(database, sql, params = []) {
  return new Promise((resolve, reject) => database.all(sql, params, (error, rows) => error ? reject(error) : resolve(rows)));
}

function identifier(value) {
  return `\`${value.replace(/`/g, '``')}\``;
}

async function migrateTable(connection, sourceDb, tableName) {
  const sourceTables = await sqliteAll(sourceDb, "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?", [tableName]);
  if (sourceTables.length === 0) return 0;

  const [targetCountRows] = await connection.query(`SELECT COUNT(*) AS count FROM ${identifier(tableName)}`);
  if (Number(targetCountRows[0].count) > 0) {
    throw new Error(`${tableName} MySQL tablosu boş değil. Veri karışmasını önlemek için taşıma durduruldu.`);
  }

  const sourceColumns = (await sqliteAll(sourceDb, `PRAGMA table_info(${identifier(tableName)})`)).map(column => column.name);
  const [targetColumns] = await connection.query(`DESCRIBE ${identifier(tableName)}`);
  const targetColumnNames = new Set(targetColumns.map(column => column.Field));
  const columns = sourceColumns.filter(column => targetColumnNames.has(column));
  if (columns.length === 0) return 0;

  const rows = await sqliteAll(sourceDb, `SELECT ${columns.map(identifier).join(', ')} FROM ${identifier(tableName)}`);
  if (rows.length === 0) return 0;

  const insertSql = `INSERT INTO ${identifier(tableName)} (${columns.map(identifier).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
  for (const row of rows) {
    await connection.execute(insertSql, columns.map(column => row[column]));
  }
  return rows.length;
}

async function main() {
  if (!fs.existsSync(sourcePath)) throw new Error(`SQLite kaynak dosyası bulunamadı: ${sourcePath}`);
  if (process.env.ALLOW_BOOTSTRAP_ADMIN === 'true') {
    throw new Error('Taşıma sırasında ALLOW_BOOTSTRAP_ADMIN=false olmalıdır.');
  }

  await initDatabase();
  const sourceDb = new sqlite3.Database(sourcePath);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const tableName of tables) {
      const count = await migrateTable(connection, sourceDb, tableName);
      if (count) console.log(`${tableName}: ${count} kayıt aktarıldı.`);
    }
    await connection.commit();
    console.log('SQLite → MySQL veri taşıması tamamlandı.');
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    sourceDb.close();
    connection.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error('Taşıma başarısız:', error.message);
  process.exitCode = 1;
});
