const express = require('express');
const multer = require('multer');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { query } = require('../../config/database');
const { authenticateToken } = require('../../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
const directory = path.join(__dirname, '..', 'uploads');
const canManage = (req, res, next) => {
  if (req.user.role === 'SUPER_ADMIN' || (req.user.role === 'UNIT_PRESIDENT' && req.user.assignedUnit === 'Tanıtım ve Medya Başkanı')) return next();
  return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
};
function imageExtension(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return 'png';
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}

router.get('/', async (req, res, next) => {
  try { res.json(await query.all('SELECT id, caption, imagePath, instagramUrl, displayOrder, createdAt FROM public_posts ORDER BY displayOrder ASC, id DESC')); }
  catch (error) { next(error); }
});
router.post('/', authenticateToken, canManage, upload.single('image'), async (req, res, next) => {
  const caption = typeof req.body.caption === 'string' ? req.body.caption.trim() : '';
  const instagramUrl = typeof req.body.instagramUrl === 'string' ? req.body.instagramUrl.trim() : '';
  const extension = req.file && imageExtension(req.file.buffer);
  let validUrl = !instagramUrl;
  if (instagramUrl) { try { const url = new URL(instagramUrl); validUrl = url.protocol === 'https:' && (url.hostname === 'instagram.com' || url.hostname === 'www.instagram.com'); } catch { validUrl = false; } }
  if (!caption || caption.length > 1000 || !extension || instagramUrl.length > 500 || !validUrl) return res.status(400).json({ message: 'Açıklama ve JPEG, PNG veya WebP fotoğrafı gerekli. Bağlantı varsa geçerli bir Instagram adresi olmalı.' });
  const filename = `post-${crypto.randomUUID()}.${extension}`;
  const filePath = path.join(directory, filename);
  try {
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(filePath, req.file.buffer, { flag: 'wx' });
    try { await query.run('INSERT INTO public_posts (caption, imagePath, instagramUrl) VALUES (?, ?, ?)', [caption, `/uploads/${filename}`, instagramUrl || null]); }
    catch (error) { await fs.unlink(filePath).catch(() => {}); throw error; }
    res.status(201).json({ message: 'Fotoğraf yayınlandı.' });
  } catch (error) { next(error); }
});
router.put('/:id', authenticateToken, canManage, async (req, res, next) => {
  const caption = typeof req.body.caption === 'string' ? req.body.caption.trim() : '';
  const instagramUrl = typeof req.body.instagramUrl === 'string' ? req.body.instagramUrl.trim() : '';
  const order = req.body.displayOrder;
  let validUrl = !instagramUrl;
  if (instagramUrl) { try { const url = new URL(instagramUrl); validUrl = url.protocol === 'https:' && (url.hostname === 'instagram.com' || url.hostname === 'www.instagram.com'); } catch { validUrl = false; } }
  if (!/^\d+$/.test(req.params.id) || !caption || caption.length > 1000 || instagramUrl.length > 500 || !validUrl || !Number.isInteger(order) || order < 0 || order > 100000) return res.status(400).json({ message: 'Lütfen açıklamayı, sıralamayı ve Instagram bağlantısını kontrol edin.' });
  try {
    const post = await query.get('SELECT id FROM public_posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ message: 'Gönderi bulunamadı.' });
    await query.run('UPDATE public_posts SET caption = ?, instagramUrl = ?, displayOrder = ? WHERE id = ?', [caption, instagramUrl || null, order, req.params.id]);
    res.json({ message: 'Gönderi güncellendi.' });
  } catch (error) { next(error); }
});
router.delete('/:id', authenticateToken, canManage, async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ message: 'Geçersiz kayıt.' });
  try {
    const post = await query.get('SELECT imagePath FROM public_posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ message: 'Gönderi bulunamadı.' });
    await query.run('DELETE FROM public_posts WHERE id = ?', [req.params.id]);
    await fs.unlink(path.join(directory, path.basename(post.imagePath))).catch(() => {});
    res.json({ message: 'Gönderi kaldırıldı.' });
  } catch (error) { next(error); }
});
module.exports = router;
