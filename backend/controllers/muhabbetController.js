const { query, dbType } = require('../config/database');

exports.getMyClass = async (req, res) => {
  try {
    const classData = await query.get('SELECT * FROM muhabbet_classes WHERE teacherId = ?', [req.user.id]);
    if (!classData) return res.status(404).json({ message: 'Atanmış sınıf bulunamadı.' });
    
    // Get students for this class
    const students = await query.all("SELECT * FROM muhabbet_students WHERE classId = ? AND status = 'APPROVED'", [classData.id]);
    
    res.json({ classInfo: classData, students });
  } catch (error) {
    res.status(500).json({ message: 'Sınıf bilgisi alınamadı.' });
  }
};

// Public: Apply
exports.apply = async (req, res) => {
  try {
    const { childName, parentName, address, phoneNumber, grade } = req.body;
    
    // Validate if applications are open
    const settings = await query.get("SELECT settingValue FROM muhabbet_settings WHERE settingKey = 'isApplicationsOpen'");
    if (settings && settings.settingValue === 'false') {
      return res.status(400).json({ message: 'Başvurular şu anda kapalıdır.' });
    }

    const insertSql = dbType === 'postgres'
      ? `INSERT INTO muhabbet_students (childName, parentName, address, phoneNumber, grade) VALUES (?, ?, ?, ?, ?) RETURNING id`
      : `INSERT INTO muhabbet_students (childName, parentName, address, phoneNumber, grade) VALUES (?, ?, ?, ?, ?)`;

    await query.run(insertSql, [childName, parentName, address, phoneNumber, grade]);

    res.status(201).json({ message: 'Başvurunuz başarıyla alındı.' });
  } catch (error) {
    console.error('Başvuru hatası:', error);
    res.status(500).json({ message: 'Başvuru sırasında bir hata oluştu.' });
  }
};

// Admin/Coordinator: Get Applications
exports.getApplications = async (req, res) => {
  try {
    const applications = await query.all('SELECT * FROM muhabbet_students ORDER BY createdAt DESC');
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: 'Başvurular alınamadı.' });
  }
};

// Admin/Coordinator: Assign to class or Update student
exports.updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    // Check if we are just updating classId and status (assignment) or updating full info
    if (Object.keys(req.body).length === 2 && 'classId' in req.body && 'status' in req.body) {
      const { classId, status } = req.body;
      await query.run('UPDATE muhabbet_students SET classId = ?, status = ? WHERE id = ?', [classId, status, id]);
    } else {
      const { childName, parentName, phoneNumber, grade, address, classId, status } = req.body;
      await query.run(
        'UPDATE muhabbet_students SET childName = ?, parentName = ?, phoneNumber = ?, grade = ?, address = ?, classId = ?, status = ? WHERE id = ?',
        [childName, parentName, phoneNumber, grade, address, classId || null, status || 'PENDING', id]
      );
    }
    res.json({ message: 'Öğrenci güncellendi.' });
  } catch (error) {
    res.status(500).json({ message: 'Güncelleme başarısız.' });
  }
};

// Admin/Coordinator: Delete student
exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    // Öğrencinin yoklamalarını da siliyoruz
    await query.run('DELETE FROM muhabbet_attendance WHERE studentId = ?', [id]);
    await query.run('DELETE FROM muhabbet_students WHERE id = ?', [id]);
    res.json({ message: 'Öğrenci silindi.' });
  } catch (error) {
    res.status(500).json({ message: 'Silme işlemi başarısız.' });
  }
};

// Admin/Coordinator: Create Class
exports.createClass = async (req, res) => {
  try {
    const { name, ageGroup, teacherId } = req.body;
    const insertSql = dbType === 'postgres'
      ? `INSERT INTO muhabbet_classes (name, ageGroup, teacherId) VALUES (?, ?, ?) RETURNING id`
      : `INSERT INTO muhabbet_classes (name, ageGroup, teacherId) VALUES (?, ?, ?)`;
      
    await query.run(insertSql, [name, ageGroup, teacherId]);

    // Make sure the assigned user has the MUHABBET_TEACHER role
    if (teacherId) {
      await query.run("UPDATE users SET role = 'MUHABBET_TEACHER', assignedUnit = 'Yaz Okulu Hocası' WHERE id = ? AND role != 'SUPER_ADMIN'", [teacherId]);
    }

    res.status(201).json({ message: 'Sınıf oluşturuldu.' });
  } catch (error) {
    res.status(500).json({ message: 'Sınıf oluşturulamadı.' });
  }
};

// Get Classes
exports.getClasses = async (req, res) => {
  try {
    const classes = await query.all(`
      SELECT c.*, u.fullName as teacherName 
      FROM muhabbet_classes c 
      LEFT JOIN users u ON c.teacherId = u.id
      ORDER BY c.createdAt DESC
    `);
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Sınıflar alınamadı.' });
  }
};

// Admin/Coordinator: Update Class
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, ageGroup, teacherId } = req.body;
    await query.run(
      'UPDATE muhabbet_classes SET name = ?, ageGroup = ?, teacherId = ? WHERE id = ?',
      [name, ageGroup, teacherId, id]
    );

    // Make sure the assigned user has the MUHABBET_TEACHER role
    if (teacherId) {
      await query.run("UPDATE users SET role = 'MUHABBET_TEACHER', assignedUnit = 'Yaz Okulu Hocası' WHERE id = ? AND role != 'SUPER_ADMIN'", [teacherId]);
    }

    res.json({ message: 'Sınıf güncellendi.' });
  } catch (error) {
    res.status(500).json({ message: 'Sınıf güncellenemedi.' });
  }
};

// Admin/Coordinator: Delete Class
exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    // Remove classId from students
    await query.run('UPDATE muhabbet_students SET classId = NULL, status = ? WHERE classId = ?', ['PENDING', id]);
    // Delete attendance records for this class
    await query.run('DELETE FROM muhabbet_attendance WHERE classId = ?', [id]);
    // Delete class
    await query.run('DELETE FROM muhabbet_classes WHERE id = ?', [id]);
    res.json({ message: 'Sınıf silindi.' });
  } catch (error) {
    res.status(500).json({ message: 'Sınıf silinemedi.' });
  }
};

// Admin/Coordinator: Add Menu
exports.addMenu = async (req, res) => {
  try {
    const { menuDate, foodItems, activities } = req.body;
    const insertSql = dbType === 'postgres'
      ? `INSERT INTO muhabbet_menus (menuDate, foodItems, activities) VALUES (?, ?, ?) RETURNING id`
      : `INSERT INTO muhabbet_menus (menuDate, foodItems, activities) VALUES (?, ?, ?)`;
      
    await query.run(insertSql, [menuDate, foodItems, activities]);
    res.status(201).json({ message: 'Menü eklendi.' });
  } catch (error) {
    console.error('Menu add error:', error);
    res.status(500).json({ message: 'Menü eklenemedi.' });
  }
};

// Admin/Coordinator: Update Menu
exports.updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { menuDate, foodItems, activities } = req.body;
    await query.run(
      'UPDATE muhabbet_menus SET menuDate = ?, foodItems = ?, activities = ? WHERE id = ?',
      [menuDate, foodItems, activities, id]
    );
    res.json({ message: 'Menü güncellendi.' });
  } catch (error) {
    res.status(500).json({ message: 'Menü güncellenemedi.' });
  }
};

// Admin/Coordinator: Delete Menu
exports.deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    await query.run('DELETE FROM muhabbet_menus WHERE id = ?', [id]);
    res.json({ message: 'Menü silindi.' });
  } catch (error) {
    res.status(500).json({ message: 'Menü silinemedi.' });
  }
};

// Public/Admin/Teacher: Get Menus
exports.getMenus = async (req, res) => {
  try {
    const menus = await query.all('SELECT * FROM muhabbet_menus ORDER BY menuDate DESC');
    res.json(menus);
  } catch (error) {
    console.error('Menu get error:', error);
    res.status(500).json({ message: 'Menüler alınamadı.' });
  }
};

// Admin: Toggle applications open/close
exports.updateSettings = async (req, res) => {
  try {
    const { isApplicationsOpen } = req.body;
    
    await query.run("DELETE FROM muhabbet_settings WHERE settingKey = 'isApplicationsOpen'");
    
    const insertSql = dbType === 'postgres'
      ? `INSERT INTO muhabbet_settings (settingKey, settingValue) VALUES ('isApplicationsOpen', ?) RETURNING id`
      : `INSERT INTO muhabbet_settings (settingKey, settingValue) VALUES ('isApplicationsOpen', ?)`;
      
    await query.run(insertSql, [isApplicationsOpen ? 'true' : 'false']);
    
    res.json({ message: 'Ayar güncellendi.' });
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ message: 'Ayar güncellenemedi.' });
  }
};

// Public: Get Settings
exports.getSettings = async (req, res) => {
  try {
    const settings = await query.get("SELECT settingValue FROM muhabbet_settings WHERE settingKey = 'isApplicationsOpen'");
    res.json({ isApplicationsOpen: settings ? settings.settingValue === 'true' : true }); // Default true
  } catch (error) {
    console.error('Settings get error:', error);
    res.status(500).json({ message: 'Ayarlar alınamadı.' });
  }
};

// Teacher: Take attendance
exports.takeAttendance = async (req, res) => {
  try {
    const { attendanceDate, classId, students } = req.body; // students: [{id, isPresent: 1/0}]
    
    for (let s of students) {
      const existing = await query.get('SELECT id FROM muhabbet_attendance WHERE studentId = ? AND attendanceDate = ?', [s.id, attendanceDate]);
      if (existing) {
        await query.run('UPDATE muhabbet_attendance SET isPresent = ? WHERE id = ?', [s.isPresent, existing.id]);
      } else {
        const insertSql = dbType === 'postgres'
          ? `INSERT INTO muhabbet_attendance (studentId, classId, attendanceDate, isPresent) VALUES (?, ?, ?, ?) RETURNING id`
          : `INSERT INTO muhabbet_attendance (studentId, classId, attendanceDate, isPresent) VALUES (?, ?, ?, ?)`;
        await query.run(insertSql, [s.id, classId, attendanceDate, s.isPresent]);
      }
    }
    
    res.json({ message: 'Yoklama kaydedildi.' });
  } catch (error) {
    res.status(500).json({ message: 'Yoklama alınamadı.' });
  }
};

// Admin/Teacher: Get Attendance
exports.getAttendance = async (req, res) => {
  try {
    const { date, classId } = req.query;
    
    let sql = `
      SELECT a.*, s.childName, s.parentName, s.phoneNumber 
      FROM muhabbet_attendance a 
      JOIN muhabbet_students s ON a.studentId = s.id 
      WHERE 1=1
    `;
    const params = [];
    
    if (date) {
      sql += ` AND a.attendanceDate = ?`;
      params.push(date);
    }
    if (classId) {
      sql += ` AND a.classId = ?`;
      params.push(classId);
    }
    
    const records = await query.all(sql, params);
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Yoklama alınamadı.' });
  }
};
