const { query } = require('../../config/database');
const AppError = require('../../core/errors/AppError');

/**
 * Muhabbet Service — Muhabbet Okulu iş mantığı katmanı.
 */

exports.checkApplicationsOpen = async () => {
  const settings = await query.get("SELECT settingValue FROM muhabbet_settings WHERE LOWER(settingKey) = 'isapplicationsopen'");
  const val = settings?.settingValue ?? settings?.settingvalue;
  if (val !== 'true' && val !== '1') throw new AppError('Başvurular şu anda kapalıdır.', 403);
};

exports.createApplication = async ({ childName, parentName, address, phoneNumber, grade }) => {
  await exports.checkApplicationsOpen();
  const insertSql = 'INSERT INTO muhabbet_students (childName, parentName, address, phoneNumber, grade) VALUES (?, ?, ?, ?, ?)';
  return query.run(insertSql, [childName, parentName, address, phoneNumber, grade]);
};

exports.getApplications = async () => {
  return query.all('SELECT * FROM muhabbet_students ORDER BY createdAt DESC');
};

exports.updateApplication = async (id, body) => {
  if (Object.keys(body).length === 2 && 'classId' in body && 'status' in body) {
    await query.run('UPDATE muhabbet_students SET classId = ?, status = ? WHERE id = ?', [body.classId, body.status, id]);
  } else {
    const { childName, parentName, phoneNumber, grade, address, classId, status } = body;
    await query.run(
      'UPDATE muhabbet_students SET childName = ?, parentName = ?, phoneNumber = ?, grade = ?, address = ?, classId = ?, status = ? WHERE id = ?',
      [childName, parentName, phoneNumber, grade, address, classId || null, status || 'PENDING', id]
    );
  }
};

exports.deleteApplication = async (id) => {
  await query.run('DELETE FROM muhabbet_attendance WHERE studentId = ?', [id]);
  await query.run('DELETE FROM muhabbet_students WHERE id = ?', [id]);
};

exports.getMyClass = async (teacherId) => {
  const classData = await query.get('SELECT * FROM muhabbet_classes WHERE teacherId = ?', [teacherId]);
  if (!classData) throw new AppError('Atanmış sınıf bulunamadı.', 404);
  const students = await query.all("SELECT * FROM muhabbet_students WHERE classId = ? AND status = 'APPROVED'", [classData.id]);
  return { classInfo: classData, students };
};

exports.assertClassAccess = async (user, classId) => {
  if (['SUPER_ADMIN', 'MUHABBET_COORDINATOR'].includes(user.role)) return;
  if (user.role !== 'MUHABBET_TEACHER') throw new AppError('Bu sınıfa erişim yetkiniz yok.', 403);
  const classData = await query.get('SELECT id FROM muhabbet_classes WHERE id = ? AND teacherId = ?', [classId, user.id]);
  if (!classData) throw new AppError('Bu sınıfa erişim yetkiniz yok.', 403);
};

exports.createClass = async ({ name, ageGroup, teacherId }) => {
  const insertSql = 'INSERT INTO muhabbet_classes (name, ageGroup, teacherId) VALUES (?, ?, ?)';
  await query.run(insertSql, [name, ageGroup, teacherId || null]);
  if (teacherId) {
    await query.run("UPDATE users SET role = 'MUHABBET_TEACHER', assignedUnit = 'Yaz Okulu Hocası' WHERE id = ? AND role != 'SUPER_ADMIN'", [teacherId]);
  }
};

exports.updateClass = async (id, { name, ageGroup, teacherId }) => {
  await query.run('UPDATE muhabbet_classes SET name = ?, ageGroup = ?, teacherId = ? WHERE id = ?', [name, ageGroup, teacherId || null, id]);
  if (teacherId) {
    await query.run("UPDATE users SET role = 'MUHABBET_TEACHER', assignedUnit = 'Yaz Okulu Hocası' WHERE id = ? AND role != 'SUPER_ADMIN'", [teacherId]);
  }
};

exports.deleteClass = async (id) => {
  await query.run('UPDATE muhabbet_students SET classId = NULL WHERE classId = ?', [id]);
  await query.run('DELETE FROM muhabbet_attendance WHERE classId = ?', [id]);
  await query.run('DELETE FROM muhabbet_classes WHERE id = ?', [id]);
};

exports.getClasses = async () => {
  const rows = await query.all(`
    SELECT mc.*, u.fullName as teacherName,
           (SELECT COUNT(id) FROM muhabbet_students WHERE classId = mc.id AND status = 'APPROVED') as studentCount
    FROM muhabbet_classes mc
    LEFT JOIN users u ON mc.teacherId = u.id
    ORDER BY mc.id ASC
  `);
  return rows.map(r => ({
    ...r,
    teacherName: r.teacherName || r.teachername || null,
    studentCount: parseInt(r.studentCount || r.studentcount || 0)
  }));
};

exports.getMenus = async () => {
  return query.all('SELECT * FROM muhabbet_menus ORDER BY menuDate DESC LIMIT 10');
};

exports.createMenu = async ({ menuDate, foodItems, activities }) => {
  if (!menuDate || !foodItems || !activities) throw new AppError('Menü tarihi, yemek ve etkinlik alanları zorunludur.', 400);
  const insertSql = 'INSERT INTO muhabbet_menus (menuDate, foodItems, activities) VALUES (?, ?, ?)';
  return query.run(insertSql, [menuDate, foodItems, activities]);
};

exports.updateMenu = async (id, { menuDate, foodItems, activities }) => {
  if (!menuDate || !foodItems || !activities) throw new AppError('Menü tarihi, yemek ve etkinlik alanları zorunludur.', 400);
  const menu = await query.get('SELECT id FROM muhabbet_menus WHERE id = ?', [id]);
  if (!menu) throw new AppError('Menü bulunamadı.', 404);
  await query.run('UPDATE muhabbet_menus SET menuDate = ?, foodItems = ?, activities = ? WHERE id = ?', [menuDate, foodItems, activities, id]);
};

exports.deleteMenu = async (id) => {
  const result = await query.run('DELETE FROM muhabbet_menus WHERE id = ?', [id]);
  if (result.changes === 0) throw new AppError('Menü bulunamadı.', 404);
};

exports.getAttendance = async ({ classId, attendanceDate, date }) => {
  const targetDate = attendanceDate || date;
  return query.all('SELECT * FROM muhabbet_attendance WHERE classId = ? AND attendanceDate = ?', [classId, targetDate]);
};

exports.saveAttendance = async ({ classId, attendanceDate, date, attendanceList, students }) => {
  const targetDate = attendanceDate || date;
  const list = attendanceList || students || [];
  await query.run('DELETE FROM muhabbet_attendance WHERE classId = ? AND attendanceDate = ?', [classId, targetDate]);
  for (const entry of list) {
    const studentId = entry.studentId || entry.id;
    const isPresent = (entry.isPresent === 1 || entry.isPresent === true || entry.status === 'Geldi') ? 1 : 0;
    if (studentId) {
      const insertSql = 'INSERT INTO muhabbet_attendance (studentId, classId, attendanceDate, isPresent) VALUES (?, ?, ?, ?)';
      await query.run(insertSql, [studentId, classId, targetDate, isPresent]);
    }
  }
};

exports.getAttendanceReport = async ({ classId, date }) => {
  let sql = `
    SELECT ma.*, ms.childName, ms.parentName, ms.phoneNumber, mc.name as className
    FROM muhabbet_attendance ma
    LEFT JOIN muhabbet_students ms ON ma.studentId = ms.id
    LEFT JOIN muhabbet_classes mc ON ma.classId = mc.id
    WHERE 1=1
  `;
  const params = [];
  if (classId && classId !== 'ALL') {
    sql += ` AND ma.classId = ?`;
    params.push(classId);
  }
  if (date) {
    sql += ` AND ma.attendanceDate = ?`;
    params.push(date);
  }
  sql += ` ORDER BY ma.attendanceDate DESC, ms.childName ASC`;
  const rows = await query.all(sql, params);
  return rows.map(r => ({
    ...r,
    childName: r.childName || r.childname || 'Bilinmeyen Öğrenci',
    parentName: r.parentName || r.parentname || '-',
    phoneNumber: r.phoneNumber || r.phonenumber || '-',
    className: r.className || r.classname || 'Sınıfsız',
    isPresent: r.isPresent === 1 || r.ispresent === 1
  }));
};

exports.getSettings = async () => {
  const rows = await query.all('SELECT * FROM muhabbet_settings');
  const result = { isApplicationsOpen: false };
  rows.forEach(r => {
    const key = r.settingKey || r.settingkey;
    const val = r.settingValue ?? r.settingvalue;
    if (key === 'isApplicationsOpen') {
      result.isApplicationsOpen = val === 'true' || val === '1' || val === true;
    } else if (key) {
      result[key] = val;
    }
  });
  return result;
};

exports.updateSetting = async (body) => {
  const pairs = [];
  if (body && body.settingKey !== undefined) {
    pairs.push({ key: body.settingKey, value: String(body.settingValue) });
  } else if (body) {
    Object.entries(body).forEach(([k, v]) => {
      pairs.push({ key: k, value: String(v) });
    });
  }

  for (const { key, value } of pairs) {
    const existing = await query.get('SELECT id FROM muhabbet_settings WHERE LOWER(settingKey) = LOWER(?)', [key]);

    if (existing) {
      await query.run('UPDATE muhabbet_settings SET settingValue = ? WHERE LOWER(settingKey) = LOWER(?)', [value, key]);
    } else {
      const insertSql = 'INSERT INTO muhabbet_settings (settingKey, settingValue) VALUES (?, ?)';
      await query.run(insertSql, [key, value]);
    }
  }
};

exports.getPortalInfo = async () => {
  const settings = await query.all('SELECT * FROM muhabbet_settings');
  const menus = await query.all('SELECT * FROM muhabbet_menus ORDER BY menuDate DESC LIMIT 5');
  return { settings, menus };
};
