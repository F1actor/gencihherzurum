const AppError = require('../../core/errors/AppError');

exports.validateApply = (req, res, next) => {
  const { childName, parentName, phoneNumber, grade } = req.body;
  if (!childName || !parentName || !phoneNumber || !grade) {
    return next(new AppError('Çocuk adı, veli adı, telefon ve sınıf zorunludur.', 400));
  }
  next();
};

exports.validateCreateClass = (req, res, next) => {
  const { name, ageGroup } = req.body;
  if (!name || !ageGroup) return next(new AppError('Sınıf adı ve yaş grubu zorunludur.', 400));
  next();
};
