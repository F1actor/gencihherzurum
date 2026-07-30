const eventService = require('./eventService');

/**
 * Event Controller — Sadece HTTP katmanı.
 */

exports.createEvent = async (req, res, next) => {
  try {
    const proofImagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const event = await eventService.createEvent({ ...req.body, proofImagePath, user: req.user });
    return res.status(201).json({ message: 'Etkinlik başarıyla kaydedildi.', event });
  } catch (err) { next(err); }
};

exports.getMyEvents = async (req, res, next) => {
  try {
    const events = await eventService.getMyEvents(req.user.id);
    return res.status(200).json(events);
  } catch (err) { next(err); }
};

exports.getMyRoutines = async (req, res, next) => {
  try {
    const routines = await eventService.getMyRoutines(req.user.assignedUnit);
    return res.status(200).json(routines);
  } catch (err) { next(err); }
};

exports.getAllEvents = async (req, res, next) => {
  try {
    const events = await eventService.getAllEvents(req.query);
    return res.status(200).json(events);
  } catch (err) { next(err); }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const proofImagePath = req.file ? `/uploads/${req.file.filename}` : null;
    await eventService.updateEvent({ id: req.params.id, ...req.body, proofImagePath, user: req.user });
    return res.status(200).json({ message: 'Etkinlik başarıyla güncellendi.' });
  } catch (err) { next(err); }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    await eventService.deleteEvent({ id: req.params.id, user: req.user });
    return res.status(200).json({ message: 'Etkinlik başarıyla silindi.' });
  } catch (err) { next(err); }
};
