const express = require('express');
const multer = require('multer');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { query } = require('../../config/database');
const { authenticateToken } = require('../../middleware/authMiddleware');
const { uploadDirectory } = require('../../config/uploads');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
const directory = uploadDirectory;

function canManage(req, res, next) {
  if (req.user.role === 'SUPER_ADMIN' || (req.user.role === 'UNIT_PRESIDENT' && req.user.assignedUnit === 'Tanıtım ve Medya Başkanı')) return next();
  return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
}

function imageExtension(buffer) {
  if (buffer?.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer?.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return 'png';
  if (buffer?.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

function normalize(data) {
  return {
    title: typeof data.title === 'string' ? data.title.trim() : '',
    summary: typeof data.summary === 'string' ? data.summary.trim() : '',
    body: typeof data.body === 'string' ? data.body.trim() : '',
    category: typeof data.category === 'string' ? data.category.trim() : 'Haberler'
  };
}

function isValid(news) {
  return news.title.length > 2 && news.title.length <= 200
    && news.summary.length > 4 && news.summary.length <= 700
    && news.body.length > 4 && news.body.length <= 20000
    && news.category.length > 1 && news.category.length <= 80;
}

router.get('/', async (req, res, next) => {
  try {
    res.json(await query.all('SELECT id, title, summary, category, coverImagePath, createdAt, updatedAt FROM news ORDER BY createdAt DESC, id DESC'));
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ message: 'Geçersiz haber.' });
  try {
    const news = await query.get('SELECT id, title, summary, body, category, coverImagePath, createdAt, updatedAt FROM news WHERE id = ?', [req.params.id]);
    if (!news) return res.status(404).json({ message: 'Haber bulunamadı.' });
    return res.json(news);
  } catch (error) { next(error); }
});

router.post('/', authenticateToken, canManage, upload.single('coverImage'), async (req, res, next) => {
  const news = normalize(req.body);
  const extension = imageExtension(req.file?.buffer);
  if (!isValid(news) || !extension) return res.status(400).json({ message: 'Başlık, özet, içerik, kategori ve JPEG, PNG veya WebP kapak görseli gereklidir.' });
  const filename = `news-${crypto.randomUUID()}.${extension}`;
  try {
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, filename), req.file.buffer, { flag: 'wx' });
    try {
      const result = await query.run('INSERT INTO news (title, summary, body, category, coverImagePath, authorId) VALUES (?, ?, ?, ?, ?, ?)', [news.title, news.summary, news.body, news.category, `/uploads/${filename}`, req.user.id]);
      return res.status(201).json({ id: result.id, message: 'Haber yayınlandı.' });
    } catch (error) {
      await fs.unlink(path.join(directory, filename)).catch(() => {});
      throw error;
    }
  } catch (error) { next(error); }
});

router.put('/:id', authenticateToken, canManage, async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ message: 'Geçersiz haber.' });
  const news = normalize(req.body);
  if (!isValid(news)) return res.status(400).json({ message: 'Haber alanlarını kontrol edin.' });
  try {
    const exists = await query.get('SELECT id FROM news WHERE id = ?', [req.params.id]);
    if (!exists) return res.status(404).json({ message: 'Haber bulunamadı.' });
    await query.run('UPDATE news SET title = ?, summary = ?, body = ?, category = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [news.title, news.summary, news.body, news.category, req.params.id]);
    return res.json({ message: 'Haber güncellendi.' });
  } catch (error) { next(error); }
});

router.delete('/:id', authenticateToken, canManage, async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ message: 'Geçersiz haber.' });
  try {
    const news = await query.get('SELECT coverImagePath FROM news WHERE id = ?', [req.params.id]);
    if (!news) return res.status(404).json({ message: 'Haber bulunamadı.' });
    await query.run('DELETE FROM news WHERE id = ?', [req.params.id]);
    await fs.unlink(path.join(directory, path.basename(news.coverImagePath))).catch(() => {});
    return res.json({ message: 'Haber kaldırıldı.' });
  } catch (error) { next(error); }
});

module.exports = router;
