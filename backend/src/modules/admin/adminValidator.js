const AppError = require('../../core/errors/AppError');

exports.validateAssignUnit = (req, res, next) => {
  const { userId, unit, role } = req.body;
  if (!userId || !unit) return next(new AppError('Kullanıcı ID ve birim zorunludur.', 400));
  if (role && !['UNIT_PRESIDENT', 'MUHABBET_COORDINATOR', 'MUHABBET_TEACHER'].includes(role)) {
    return next(new AppError('Geçersiz rol.', 400));
  }
  next();
};

exports.validateCreateRoutine = (req, res, next) => {
  const { unit, title, dayOfWeek } = req.body;
  if (!unit || !title || !dayOfWeek) return next(new AppError('Birim, başlık ve gün zorunludur.', 400));
  next();
};
