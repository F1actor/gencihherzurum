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
const categories = new Set(['Faaliyetler', 'Eğitim', 'Gönüllülük', 'Sosyal Sorumluluk', 'Başarılar', 'Duyurular']);
const canManage = (req, res, next) => {
  if (req.user.role === 'SUPER_ADMIN' || (req.user.role === 'UNIT_PRESIDENT' && req.user.assignedUnit === 'Tanıtım ve Medya Başkanı')) return next();
  return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
};
function imageExtension(buffer) {
  if (buffer?.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';
  if (buffer?.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return 'png';
  if (buffer?.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  return null;
}
function normalize(body) {
  return { caption: typeof body.caption === 'string' ? body.caption.trim() : '', instagramUrl: typeof body.instagramUrl === 'string' ? body.instagramUrl.trim() : '', category: typeof body.category === 'string' ? body.category.trim() : '' };
}
function validUrl(value) {
  if (!value) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && (url.hostname === 'instagram.com' || url.hostname === 'www.instagram.com'); } catch { return false; }
}

router.get('/', async (req, res, next) => {
  try { res.json(await query.all('SELECT id, caption, imagePath, instagramUrl, category, displayOrder, createdAt FROM public_posts ORDER BY displayOrder ASC, id DESC')); }
  catch (error) { next(error); }
});
router.post('/', authenticateToken, canManage, upload.single('image'), async (req, res, next) => {
  const post = normalize(req.body); const extension = imageExtension(req.file?.buffer);
  if (!post.caption || post.caption.length > 1000 || !extension || post.instagramUrl.length > 500 || !validUrl(post.instagramUrl) || !categories.has(post.category)) return res.status(400).json({ message: 'Açıklama, kategori ve JPEG, PNG veya WebP fotoğrafı gereklidir.' });
  const filename = `post-${crypto.randomUUID()}.${extension}`;
  try {
    await fs.mkdir(directory, { recursive: true }); await fs.writeFile(path.join(directory, filename), req.file.buffer, { flag: 'wx' });
    try { await query.run('INSERT INTO public_posts (caption, imagePath, instagramUrl, category) VALUES (?, ?, ?, ?)', [post.caption, `/uploads/${filename}`, post.instagramUrl || null, post.category]); }
    catch (error) { await fs.unlink(path.join(directory, filename)).catch(() => {}); throw error; }
    return res.status(201).json({ message: 'Fotoğraf yayınlandı.' });
  } catch (error) { next(error); }
});
router.put('/:id', authenticateToken, canManage, async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ message: 'Geçersiz kayıt.' });
  const post = normalize(req.body); const order = req.body.displayOrder;
  if (!post.caption || post.caption.length > 1000 || post.instagramUrl.length > 500 || !validUrl(post.instagramUrl) || !categories.has(post.category) || !Number.isInteger(order) || order < 0 || order > 100000) return res.status(400).json({ message: 'Açıklama, kategori, sıralama veya bağlantı geçersiz.' });
  try {
    const exists = await query.get('SELECT id FROM public_posts WHERE id = ?', [req.params.id]);
    if (!exists) return res.status(404).json({ message: 'Gönderi bulunamadı.' });
    await query.run('UPDATE public_posts SET caption = ?, instagramUrl = ?, category = ?, displayOrder = ? WHERE id = ?', [post.caption, post.instagramUrl || null, post.category, order, req.params.id]);
    return res.json({ message: 'Gönderi güncellendi.' });
  } catch (error) { next(error); }
});
router.delete('/:id', authenticateToken, canManage, async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ message: 'Geçersiz kayıt.' });
  try {
    const post = await query.get('SELECT imagePath FROM public_posts WHERE id = ?', [req.params.id]);
    if (!post) return res.status(404).json({ message: 'Gönderi bulunamadı.' });
    await query.run('DELETE FROM public_posts WHERE id = ?', [req.params.id]); await fs.unlink(path.join(directory, path.basename(post.imagePath))).catch(() => {});
    return res.json({ message: 'Gönderi kaldırıldı.' });
  } catch (error) { next(error); }
});
module.exports = router;
