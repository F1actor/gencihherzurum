const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbType = process.env.DB_TYPE || 'sqlite'; // 'sqlite' veya 'postgres'
let dbSqlite = null;
let pgPool = null;

// Veritabanı bağlantı ilklendirmesi
if (dbType === 'postgres') {
  console.log('PostgreSQL bağlantı havuzu oluşturuluyor...');
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
} else {
  console.log('SQLite veritabanı dosyası yükleniyor...');
  const dbPath = path.join(__dirname, '..', 'database.sqlite');
  dbSqlite = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('SQLite veritabanına bağlanılamadı:', err.message);
    } else {
      console.log('SQLite veritabanı bağlantısı başarılı.');
    }
  });
}

// SQL ve parametre dönüştürücü (SQLite -> PostgreSQL uyumluluğu)
function convertQuery(sql, params = []) {
  if (dbType !== 'postgres') {
    return { sql, params };
  }

  // 1. Soru işaretlerini ($1, $2...) formatına çevir
  let paramCount = 0;
  let postgresSql = sql.replace(/\?/g, () => {
    paramCount++;
    return `$${paramCount}`;
  });

  // 2. Tablo oluşturma komutlarındaki uyumsuzlukları gider
  postgresSql = postgresSql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
  postgresSql = postgresSql.replace(/datetime\('now',\s*'-1\s+day'\)/gi, "NOW() - INTERVAL '1 day'");
  postgresSql = postgresSql.replace(/datetime\('now',\s*'-14\s+days'\)/gi, "NOW() - INTERVAL '14 days'");

  return { sql: postgresSql, params };
}

function normalizeRow(row) {
  if (!row || dbType !== 'postgres') return row;
  const newRow = {};
  for (const key in row) {
    let newKey = key;
    if (key === 'fullname') newKey = 'fullName';
    else if (key === 'passwordhash') newKey = 'passwordHash';
    else if (key === 'assignedunit') newKey = 'assignedUnit';
    else if (key === 'isemailverified') newKey = 'isEmailVerified';
    else if (key === 'otpcode') newKey = 'otpCode';
    else if (key === 'otpexpiresat') newKey = 'otpExpiresAt';
    else if (key === 'createdat') newKey = 'createdAt';
    else if (key === 'routineid') newKey = 'routineId';
    else if (key === 'userid') newKey = 'userId';
    else if (key === 'eventdate') newKey = 'eventDate';
    else if (key === 'proofimagepath') newKey = 'proofImagePath';
    else if (key === 'pointsearned') newKey = 'pointsEarned';
    else if (key === 'logtype') newKey = 'logType';
    else if (key === 'dayofweek') newKey = 'dayOfWeek';
    else if (key === 'presidentname') newKey = 'presidentName';
    else if (key === 'phonenumber') newKey = 'phoneNumber';
    else if (key === 'targetunit') newKey = 'targetUnit';
    else if (key === 'isactive') newKey = 'isActive';
    else if (key === 'startdate') newKey = 'startDate';
    else if (key === 'enddate') newKey = 'endDate';
    else if (key === 'routinetarget') newKey = 'routineTarget';
    else if (key === 'extratarget') newKey = 'extraTarget';
    else if (key === 'presidentemail') newKey = 'presidentEmail';
    else if (key === 'routinetitle') newKey = 'routineTitle';
    
    newRow[newKey] = row[key];
  }
  return newRow;
}


const query = {
  async run(sql, params = []) {
    let converted = convertQuery(sql, params);
    
    if (dbType === 'postgres') {
      const isInsert = converted.sql.trim().toUpperCase().startsWith('INSERT');
      if (isInsert && !converted.sql.toUpperCase().includes('RETURNING')) {
        converted.sql += ' RETURNING id';
      }
      
      const res = await pgPool.query(converted.sql, converted.params);
      let lastID = null;
      if (isInsert && res.rows && res.rows.length > 0 && res.rows[0].id) {
        lastID = res.rows[0].id;
      }
      return { id: lastID, changes: res.rowCount };
    } else {
      return new Promise((resolve, reject) => {
        dbSqlite.run(converted.sql, converted.params, function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        });
      });
    }
  },

  async get(sql, params = []) {
    const converted = convertQuery(sql, params);

    if (dbType === 'postgres') {
      const res = await pgPool.query(converted.sql, converted.params);
      return normalizeRow(res.rows[0]) || null;
    } else {
      return new Promise((resolve, reject) => {
        dbSqlite.get(converted.sql, converted.params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    }
  },

  async all(sql, params = []) {
    const converted = convertQuery(sql, params);

    if (dbType === 'postgres') {
      const res = await pgPool.query(converted.sql, converted.params);
      return res.rows.map(normalizeRow);
    } else {
      return new Promise((resolve, reject) => {
        dbSqlite.all(converted.sql, converted.params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    }
  }
};

async function initDatabase() {
  try {
    // 1. Users Tablosu
    await query.run(`
      CREATE TABLE IF NOT EXISTS users (
        id ${dbType === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
        fullName TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'PENDING',
        assignedUnit TEXT,
        phoneNumber TEXT,
        isEmailVerified INTEGER DEFAULT 0,
        otpCode TEXT,
        otpExpiresAt TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration: Add phoneNumber column to users if it doesn't exist
    try {
      if (dbType === 'postgres') {
        await query.run('ALTER TABLE users ADD COLUMN IF NOT EXISTS phoneNumber TEXT');
      } else {
        await query.run('ALTER TABLE users ADD COLUMN phoneNumber TEXT');
      }
    } catch (migErr) {
      // Ignore if column already exists
    }

    // 2. Routines Tablosu
    await query.run(`
      CREATE TABLE IF NOT EXISTS routines (
        id ${dbType === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
        unit TEXT NOT NULL,
        title TEXT NOT NULL,
        dayOfWeek INTEGER NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Events Tablosu
    await query.run(`
      CREATE TABLE IF NOT EXISTS events (
        id ${dbType === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
        userId INTEGER NOT NULL,
        unit TEXT NOT NULL,
        type TEXT NOT NULL,
        routineId INTEGER,
        title TEXT NOT NULL,
        description TEXT,
        eventDate TEXT NOT NULL,
        proofImagePath TEXT,
        pointsEarned INTEGER NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Audits Tablosu
    await query.run(`
      CREATE TABLE IF NOT EXISTS audits (
        id ${dbType === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
        logType TEXT NOT NULL,
        message TEXT NOT NULL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Unit History Tablosu (Başkan değişikliği geçmişi)
    await query.run(`
      CREATE TABLE IF NOT EXISTS unit_history (
        id ${dbType === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
        unit TEXT NOT NULL,
        userId INTEGER,
        fullName TEXT NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT,
        reason TEXT DEFAULT 'İlk Atama',
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 6. Announcements Tablosu (Duyurular)
    await query.run(`
      CREATE TABLE IF NOT EXISTS announcements (
        id ${dbType === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        targetUnit TEXT,
        isActive INTEGER DEFAULT 1,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 7. Targets Tablosu (Aylık Hedefler)
    await query.run(`
      CREATE TABLE IF NOT EXISTS targets (
        id ${dbType === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
        unit TEXT NOT NULL,
        month TEXT NOT NULL,
        routineTarget INTEGER DEFAULT 0,
        extraTarget INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 8. Champions Tablosu (Geçmiş Şampiyonlar)
    await query.run(`
      CREATE TABLE IF NOT EXISTS champions (
        id ${dbType === 'postgres' ? 'SERIAL PRIMARY KEY' : 'INTEGER PRIMARY KEY AUTOINCREMENT'},
        month TEXT NOT NULL,
        unit TEXT NOT NULL,
        presidentName TEXT,
        points INTEGER DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration: events tablosuna status kolonu ekle
    try {
      if (dbType === 'postgres') {
        await query.run("ALTER TABLE events ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'APPROVED'");
      } else {
        await query.run("ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'APPROVED'");
      }
    } catch (e) { /* ignore if exists */ }

    // Migration: users tablosuna resetOtp ve resetOtpExpiresAt ekle
    try {
      if (dbType === 'postgres') {
        await query.run('ALTER TABLE users ADD COLUMN IF NOT EXISTS resetOtpCode TEXT');
        await query.run('ALTER TABLE users ADD COLUMN IF NOT EXISTS resetOtpExpiresAt TEXT');
      } else {
        await query.run('ALTER TABLE users ADD COLUMN resetOtpCode TEXT');
        await query.run('ALTER TABLE users ADD COLUMN resetOtpExpiresAt TEXT');
      }
    } catch (e) { /* ignore if exists */ }



    // --- SEEDING ---
    const adminExists = await query.get("SELECT * FROM users WHERE role = 'SUPER_ADMIN'");
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // PostgreSQL'de INSERT atarken id dönsün diye RETURNING ekliyoruz
      const insertSql = dbType === 'postgres' 
        ? `INSERT INTO users (fullName, email, passwordHash, role, isEmailVerified) 
           VALUES (?, ?, ?, 'SUPER_ADMIN', 1) RETURNING id`
        : `INSERT INTO users (fullName, email, passwordHash, role, isEmailVerified) 
           VALUES (?, ?, ?, 'SUPER_ADMIN', 1)`;

      await query.run(insertSql, ['Genç İHH Teşkilat Başkanı', 'admin@gencihh.org', hashedPassword]);
      console.log('Varsayılan Süper Admin oluşturuldu (admin@gencihh.org / admin123).');
    }

    const routinesCount = await query.get("SELECT COUNT(*) as count FROM routines");
    // count değeri postgresql ve sqlite'ta farklı objelerde dönebilir
    const countVal = routinesCount.count !== undefined ? parseInt(routinesCount.count) : parseInt(routinesCount.countVal || 0);

    if (countVal === 0) {
      const defaultRoutines = [
        { unit: 'Ortaokul Başkanı', title: 'Haftalık Kitap Okuma & Kitap Tahlili', dayOfWeek: 3 },
        { unit: 'Lise Başkanı', title: 'Haftalık Hasbihal ve Ders Programı', dayOfWeek: 6 },
        { unit: 'Üniversite Başkanı', title: 'Haftalık Üniversite Sohbeti (Tefsir Dersi)', dayOfWeek: 4 },
        { unit: 'Eğitim Başkanı', title: 'Birim İçi Haftalık Eğitim Semineri', dayOfWeek: 1 },
        { unit: 'İHH Çocuk Başkanı', title: 'Çocuk Kulübü Atölye Çalışmaları', dayOfWeek: 6 },
        { unit: 'Atom Başkanı', title: 'Genç Aktivite ve Atom Buluşması', dayOfWeek: 7 },
      ];

      for (const r of defaultRoutines) {
        const insertSql = dbType === 'postgres'
          ? `INSERT INTO routines (unit, title, dayOfWeek) VALUES (?, ?, ?) RETURNING id`
          : `INSERT INTO routines (unit, title, dayOfWeek) VALUES (?, ?, ?)`;
        await query.run(insertSql, [r.unit, r.title, r.dayOfWeek]);
      }
      console.log('Varsayılan rutin görevler veritabanına eklendi.');
    }

  } catch (error) {
    console.error('Veritabanı ilklendirilirken hata oluştu:', error);
  }
}

module.exports = {
  query,
  initDatabase,
  dbType
};
