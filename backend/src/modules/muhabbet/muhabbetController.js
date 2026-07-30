const muhabbetService = require('./muhabbetService');

/**
 * Muhabbet Controller — Sadece HTTP katmanı.
 */

exports.getMyClass = async (req, res, next) => {
  try {
    const data = await muhabbetService.getMyClass(req.user.id);
    return res.json(data);
  } catch (err) { next(err); }
};

exports.apply = async (req, res, next) => {
  try {
    await muhabbetService.createApplication(req.body);
    return res.status(201).json({ message: 'Başvurunuz başarıyla alındı.' });
  } catch (err) { next(err); }
};

exports.getApplications = async (req, res, next) => {
  try {
    const data = await muhabbetService.getApplications();
    return res.json(data);
  } catch (err) { next(err); }
};

exports.updateApplication = async (req, res, next) => {
  try {
    await muhabbetService.updateApplication(req.params.id, req.body);
    return res.json({ message: 'Öğrenci güncellendi.' });
  } catch (err) { next(err); }
};

exports.deleteApplication = async (req, res, next) => {
  try {
    await muhabbetService.deleteApplication(req.params.id);
    return res.json({ message: 'Öğrenci silindi.' });
  } catch (err) { next(err); }
};

exports.createClass = async (req, res, next) => {
  try {
    await muhabbetService.createClass(req.body);
    return res.status(201).json({ message: 'Sınıf oluşturuldu.' });
  } catch (err) { next(err); }
};

exports.updateClass = async (req, res, next) => {
  try {
    await muhabbetService.updateClass(req.params.id, req.body);
    return res.json({ message: 'Sınıf güncellendi.' });
  } catch (err) { next(err); }
};

exports.deleteClass = async (req, res, next) => {
  try {
    await muhabbetService.deleteClass(req.params.id);
    return res.json({ message: 'Sınıf silindi.' });
  } catch (err) { next(err); }
};

exports.getClasses = async (req, res, next) => {
  try {
    const data = await muhabbetService.getClasses();
    return res.json(data);
  } catch (err) { next(err); }
};

exports.getMenus = async (req, res, next) => {
  try {
    const data = await muhabbetService.getMenus();
    return res.json(data);
  } catch (err) { next(err); }
};

exports.createMenu = async (req, res, next) => {
  try {
    await muhabbetService.createMenu(req.body);
    return res.status(201).json({ message: 'Menü oluşturuldu.' });
  } catch (err) { next(err); }
};

exports.getAttendance = async (req, res, next) => {
  try {
    const data = await muhabbetService.getAttendance(req.query);
    return res.json(data);
  } catch (err) { next(err); }
};

exports.saveAttendance = async (req, res, next) => {
  try {
    await muhabbetService.saveAttendance(req.body);
    return res.json({ message: 'Yoklama kaydedildi.' });
  } catch (err) { next(err); }
};

exports.getAttendanceReport = async (req, res, next) => {
  try {
    const data = await muhabbetService.getAttendanceReport(req.query);
    return res.json(data);
  } catch (err) { next(err); }
};

exports.getSettings = async (req, res, next) => {
  try {
    const data = await muhabbetService.getSettings();
    return res.json(data);
  } catch (err) { next(err); }
};

exports.updateSetting = async (req, res, next) => {
  try {
    await muhabbetService.updateSetting(req.body);
    return res.json({ message: 'Ayar güncellendi.' });
  } catch (err) { next(err); }
};

exports.getPortalInfo = async (req, res, next) => {
  try {
    const data = await muhabbetService.getPortalInfo();
    return res.json(data);
  } catch (err) { next(err); }
};
