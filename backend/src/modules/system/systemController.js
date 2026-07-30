const systemService = require('./systemService');

/**
 * System Controller — Sadece HTTP katmanı.
 */

exports.getUnits = async (req, res, next) => {
  try {
    const data = await systemService.getUnits();
    return res.status(200).json(data);
  } catch (err) { next(err); }
};

exports.getAnnouncements = async (req, res, next) => {
  try {
    const data = await systemService.getAnnouncements();
    return res.status(200).json(data);
  } catch (err) { next(err); }
};

exports.getAnnouncementsForUnit = async (req, res, next) => {
  try {
    const data = await systemService.getAnnouncementsForUnit(req.user.assignedUnit);
    return res.status(200).json(data);
  } catch (err) { next(err); }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const result = await systemService.createAnnouncement(req.body);
    return res.status(201).json({ message: 'Duyuru oluşturuldu.', id: result.id });
  } catch (err) { next(err); }
};

exports.deleteAnnouncement = async (req, res, next) => {
  try {
    await systemService.deleteAnnouncement(req.params.id);
    return res.status(200).json({ message: 'Duyuru silindi.' });
  } catch (err) { next(err); }
};

exports.getTargets = async (req, res, next) => {
  try {
    const data = await systemService.getTargets(req.query);
    return res.status(200).json(data);
  } catch (err) { next(err); }
};

exports.getTargetForUnit = async (req, res, next) => {
  try {
    const data = await systemService.getTargetForUnit(req.user.assignedUnit);
    return res.status(200).json(data);
  } catch (err) { next(err); }
};

exports.setTarget = async (req, res, next) => {
  try {
    await systemService.setTarget(req.body);
    return res.status(200).json({ message: 'Hedef başarıyla ayarlandı.' });
  } catch (err) { next(err); }
};

exports.deleteTarget = async (req, res, next) => {
  try {
    await systemService.deleteTarget(req.params.id);
    return res.status(200).json({ message: 'Hedef silindi.' });
  } catch (err) { next(err); }
};

exports.getChampions = async (req, res, next) => {
  try {
    const data = await systemService.getChampions();
    return res.status(200).json(data);
  } catch (err) { next(err); }
};

exports.addChampion = async (req, res, next) => {
  try {
    await systemService.addChampion(req.body);
    return res.status(201).json({ message: 'Şampiyon kaydedildi.' });
  } catch (err) { next(err); }
};

exports.getUnitHistory = async (req, res, next) => {
  try {
    const data = await systemService.getUnitHistory();
    return res.status(200).json(data);
  } catch (err) { next(err); }
};

exports.transferUnit = async (req, res, next) => {
  try {
    await systemService.transferUnit(req.body);
    return res.status(200).json({ message: 'Birim devri gerçekleştirildi.' });
  } catch (err) { next(err); }
};
