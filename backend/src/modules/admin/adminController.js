const adminService = require('./adminService');

/**
 * Admin Controller — Sadece HTTP katmanı.
 */

exports.getPendingUsers = async (req, res, next) => {
  try {
    const users = await adminService.getPendingUsers();
    return res.status(200).json(users);
  } catch (err) { next(err); }
};

exports.assignUnit = async (req, res, next) => {
  try {
    const message = await adminService.assignUnit({ ...req.body, requesterId: req.user.id });
    return res.status(200).json({ message });
  } catch (err) { next(err); }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await adminService.getUsers();
    return res.status(200).json(users);
  } catch (err) { next(err); }
};

exports.getRoutines = async (req, res, next) => {
  try {
    const routines = await adminService.getRoutines();
    return res.status(200).json(routines);
  } catch (err) { next(err); }
};

exports.createRoutine = async (req, res, next) => {
  try {
    const routine = await adminService.createRoutine(req.body);
    return res.status(201).json({ message: 'Rutin görev başarıyla oluşturuldu.', routine });
  } catch (err) { next(err); }
};

exports.deleteRoutine = async (req, res, next) => {
  try {
    await adminService.deleteRoutine(req.params.id);
    return res.status(200).json({ message: 'Rutin görev başarıyla silindi.' });
  } catch (err) { next(err); }
};

exports.getAudits = async (req, res, next) => {
  try {
    const audits = await adminService.getAudits();
    return res.status(200).json(audits);
  } catch (err) { next(err); }
};

exports.runManualAudit = async (req, res, next) => {
  try {
    const cronService = require('../../services/cronService');
    await cronService.checkUnitActivity();
    await cronService.calculateMonthlyChampion();
    return res.status(200).json({ message: 'Manuel denetim başarıyla tamamlandı. Uyarılar ve şampiyonlar güncellendi.' });
  } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    await adminService.deleteUser({ userId: req.params.id, requesterId: req.user.id });
    return res.status(200).json({ message: 'Kullanıcı başarıyla silindi.' });
  } catch (err) { next(err); }
};

exports.getAllEventsWithProofs = async (req, res, next) => {
  try {
    const events = await adminService.getAllEventsWithProofs();
    return res.status(200).json(events);
  } catch (err) { next(err); }
};
