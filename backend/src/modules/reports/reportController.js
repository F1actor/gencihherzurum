const reportService = require('./reportService');

/**
 * Report Controller — Sadece HTTP katmanı.
 */

exports.getLeaderboard = async (req, res, next) => {
  try {
    const data = await reportService.getLeaderboard();
    return res.status(200).json(data);
  } catch (err) { next(err); }
};

exports.getPerformanceMetrics = async (req, res, next) => {
  try {
    const data = await reportService.getPerformanceMetrics(req.query);
    return res.status(200).json(data);
  } catch (err) { next(err); }
};

exports.getAdminDashboardStats = async (req, res, next) => {
  try {
    const data = await reportService.getAdminDashboardStats();
    return res.status(200).json(data);
  } catch (err) { next(err); }
};

exports.exportToCSV = async (req, res, next) => {
  try {
    const csvData = await reportService.exportToCSV();
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="etkinlikler.csv"');
    return res.status(200).send('\uFEFF' + csvData); // BOM for Excel UTF-8
  } catch (err) { next(err); }
};

exports.getMonthlyReport = async (req, res, next) => {
  try {
    if (!req.query.year || !req.query.month) {
      return res.status(400).json({ message: 'Yıl ve ay parametreleri zorunludur.' });
    }
    const data = await reportService.getMonthlyReport(req.query);
    return res.status(200).json(data);
  } catch (err) { next(err); }
};

exports.getAnnualReport = async (req, res, next) => {
  try {
    const data = await reportService.getAnnualReport(req.query);
    return res.status(200).json(data);
  } catch (err) { next(err); }
};
