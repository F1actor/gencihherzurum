const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbType = 'mysql';
const isProduction = process.env.NODE_ENV === 'production';

function getConnectionConfig() {
  if (process.env.DATABASE_URL) {
    const url = new URL(process.env.DATABASE_URL);
    if (!['mysql:', 'mysqls:'].includes(url.protocol)) throw new Error('DATABASE_URL MySQL URI olmalıdır.');
    return {
      host: url.hostname,
      port: Number(url.port || 3306),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ''),
      ssl: url.protocol === 'mysqls:' || process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
        : undefined
    };
  }

  const required = ['DB_HOST', 'DB_USER', 'DB_NAME'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length) throw new Error(`MySQL yapılandırması eksik: ${missing.join(', ')}`);
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : undefined
  };
}

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error('Canlı ortamda en az 32 karakterlik JWT_SECRET zorunludur.');
}

const pool = mysql.createPool({
  ...getConnectionConfig(),
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
  charset: 'utf8mb4'
});

const query = {
  async run(sql, params = []) {
    const [result] = await pool.execute(sql, params);
    return { id: result.insertId || null, changes: result.affectedRows || 0 };
  },
  async get(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  },
  async all(sql, params = []) {
    const [rows] = await pool.execute(sql, params);
    return rows;
  }
};

async function ensureColumn(tableName, columnName, definition) {
  const column = await query.get(
    'SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [tableName, columnName]
  );
  if (!column) await query.run(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
}

async function ensureIndex(tableName, indexName, columns) {
  const index = await query.get(
    'SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?',
    [tableName, indexName]
  );
  if (!index) await query.run(`CREATE INDEX \`${indexName}\` ON \`${tableName}\` (${columns})`);
}

async function initDatabase() {
  try {
    await pool.query('SELECT 1');

    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY, fullName VARCHAR(255) NOT NULL, email VARCHAR(255) NOT NULL UNIQUE,
        passwordHash VARCHAR(255) NOT NULL, role VARCHAR(50) NOT NULL DEFAULT 'PENDING', assignedUnit VARCHAR(255) NULL,
        phoneNumber VARCHAR(50) NULL, isEmailVerified TINYINT(1) NOT NULL DEFAULT 0, otpCode VARCHAR(20) NULL,
        otpExpiresAt VARCHAR(64) NULL, resetOtpCode VARCHAR(20) NULL, resetOtpExpiresAt VARCHAR(64) NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS units (
        id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL UNIQUE, isActive TINYINT(1) NOT NULL DEFAULT 1,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS routines (
        id INT AUTO_INCREMENT PRIMARY KEY, unit VARCHAR(255) NOT NULL, title VARCHAR(255) NOT NULL, dayOfWeek TINYINT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY, userId INT NOT NULL, unit VARCHAR(255) NOT NULL, type VARCHAR(30) NOT NULL,
        routineId INT NULL, targetId INT NULL, title VARCHAR(255) NOT NULL, description TEXT NULL, eventDate VARCHAR(10) NOT NULL,
        proofImagePath VARCHAR(500) NULL, pointsEarned INT NOT NULL, status VARCHAR(30) NOT NULL DEFAULT 'APPROVED',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS audits (
        id INT AUTO_INCREMENT PRIMARY KEY, logType VARCHAR(50) NOT NULL, message TEXT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS unit_history (
        id INT AUTO_INCREMENT PRIMARY KEY, unit VARCHAR(255) NOT NULL, userId INT NULL, fullName VARCHAR(255) NOT NULL,
        startDate VARCHAR(64) NOT NULL, endDate VARCHAR(64) NULL, reason VARCHAR(255) NOT NULL DEFAULT 'İlk Atama',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL, body TEXT NOT NULL, targetUnit VARCHAR(255) NULL,
        isActive TINYINT(1) NOT NULL DEFAULT 1, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS targets (
        id INT AUTO_INCREMENT PRIMARY KEY, unit VARCHAR(255) NOT NULL, month VARCHAR(7) NOT NULL, routineTarget INT NOT NULL DEFAULT 0,
        extraTarget INT NOT NULL DEFAULT 0, targetName VARCHAR(255) NULL, targetPoints INT NOT NULL DEFAULT 0,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS champions (
        id INT AUTO_INCREMENT PRIMARY KEY, month VARCHAR(7) NOT NULL, unit VARCHAR(255) NOT NULL, presidentName VARCHAR(255) NULL,
        points INT NOT NULL DEFAULT 0, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS public_posts (
        id INT AUTO_INCREMENT PRIMARY KEY, caption VARCHAR(1000) NOT NULL, imagePath VARCHAR(500) NOT NULL,
        instagramUrl VARCHAR(500) NULL, displayOrder INT NOT NULL DEFAULT 0, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS volunteer_applications (
        id INT AUTO_INCREMENT PRIMARY KEY, fullName VARCHAR(255) NOT NULL, phoneNumber VARCHAR(50) NOT NULL,
        university VARCHAR(255) NOT NULL, faculty VARCHAR(255) NOT NULL, grade VARCHAR(100) NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS muhabbet_students (
        id INT AUTO_INCREMENT PRIMARY KEY, childName VARCHAR(255) NOT NULL, parentName VARCHAR(255) NOT NULL, address TEXT NOT NULL,
        phoneNumber VARCHAR(50) NOT NULL, grade VARCHAR(100) NOT NULL, classId INT NULL, status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS muhabbet_classes (
        id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, ageGroup VARCHAR(100) NULL, teacherId INT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS muhabbet_menus (
        id INT AUTO_INCREMENT PRIMARY KEY, menuDate VARCHAR(10) NOT NULL, foodItems TEXT NOT NULL, activities TEXT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS muhabbet_attendance (
        id INT AUTO_INCREMENT PRIMARY KEY, studentId INT NOT NULL, classId INT NOT NULL, attendanceDate VARCHAR(10) NOT NULL,
        isPresent TINYINT(1) NOT NULL DEFAULT 0, createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS muhabbet_settings (
        id INT AUTO_INCREMENT PRIMARY KEY, settingKey VARCHAR(100) NOT NULL UNIQUE, settingValue TEXT NOT NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
    ];
    for (const sql of tables) await query.run(sql);

    await ensureColumn('public_posts', 'displayOrder', 'INT NOT NULL DEFAULT 0');

    await ensureColumn('users', 'phoneNumber', 'VARCHAR(50) NULL');
    await ensureColumn('users', 'resetOtpCode', 'VARCHAR(20) NULL');
    await ensureColumn('users', 'resetOtpExpiresAt', 'VARCHAR(64) NULL');
    await ensureColumn('events', 'status', "VARCHAR(30) NOT NULL DEFAULT 'APPROVED'");
    await ensureColumn('events', 'targetId', 'INT NULL');
    await ensureColumn('targets', 'targetName', 'VARCHAR(255) NULL');
    await ensureColumn('targets', 'targetPoints', 'INT NOT NULL DEFAULT 0');
    await ensureIndex('events', 'idx_events_user_date', '`userId`, `eventDate`');
    await ensureIndex('events', 'idx_events_unit_date', '`unit`, `eventDate`');
    await ensureIndex('muhabbet_attendance', 'idx_attendance_class_date', '`classId`, `attendanceDate`');

    const adminExists = await query.get("SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1");
    if (!adminExists && process.env.ALLOW_BOOTSTRAP_ADMIN === 'true') {
      const { BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD } = process.env;
      if (!BOOTSTRAP_ADMIN_NAME || !BOOTSTRAP_ADMIN_EMAIL || !BOOTSTRAP_ADMIN_PASSWORD || (BOOTSTRAP_ADMIN_PASSWORD.length < 12 && !(BOOTSTRAP_ADMIN_EMAIL.toLowerCase() === 'admin' && BOOTSTRAP_ADMIN_PASSWORD === '1234'))) {
        throw new Error('Bootstrap admin için ad, giriş adı ve geçerli parola zorunludur.');
      }
      const passwordHash = await bcrypt.hash(BOOTSTRAP_ADMIN_PASSWORD, 12);
      await query.run("INSERT INTO users (fullName, email, passwordHash, role, isEmailVerified) VALUES (?, ?, ?, 'SUPER_ADMIN', 1)", [BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL.toLowerCase(), passwordHash]);
      console.log('Bootstrap süper admin oluşturuldu. ALLOW_BOOTSTRAP_ADMIN değerini kapatın.');
    }
  } catch (error) {
    console.error('MySQL veritabanı ilklendirilirken hata oluştu:', error);
    throw error;
  }
}

module.exports = { query, initDatabase, dbType, pool };
