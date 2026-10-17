require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./src/config/database');
const { initCronJobs } = require('./src/services/cronService');
const errorMiddleware = require('./src/middleware/errorMiddleware');
const { securityHeaders, createRateLimiter } = require('./src/middleware/securityMiddleware');

const authRoutes = require('./src/modules/auth/authRoutes');
const adminRoutes = require('./src/modules/admin/adminRoutes');
const eventRoutes = require('./src/modules/events/eventsRoutes');
const reportsRoutes = require('./src/modules/reports/reportsRoutes');
const systemRoutes = require('./src/modules/system/systemRoutes');
const llmRoutes = require('./src/modules/llm/llmRoutes');
const muhabbetRoutes = require('./src/modules/muhabbet/muhabbetRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CLIENT_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);

if (process.env.TRUST_PROXY === '1') app.set('trust proxy', 1);

// CORS Yapılandırması (React ön yüzü ile iletişim için)
app.use(cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  origin(origin, callback) {
    if (!origin || (!isProduction && allowedOrigins.length === 0) || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Bu origin için CORS izni yok.'));
  }
}));

// Middlewares
app.use(securityHeaders);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/auth', createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }));
app.use('/api/muhabbet/apply', createRateLimiter({ windowMs: 60 * 60 * 1000, max: 10 }));

// Uploads (kanıt resimleri) static olarak sun
app.use('/uploads', express.static(path.join(__dirname, 'src', 'modules', 'uploads')));

// API Rotaları
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/llm', llmRoutes);
app.use('/api/muhabbet', muhabbetRoutes);

// Sağlık kontrolü
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global Hata Yakalama Middleware'i (errorMiddleware)
app.use(errorMiddleware);

// Sunucuyu Başlat
async function startServer() {
  try {
    // 1. Veritabanını ilklendir
    await initDatabase();
    
    // 2. Cron Job'ları başlat
    initCronJobs();

    // 3. Portu dinle
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n=============================================================`);
      console.log(`🚀 Genç İHH Erzurum Portalı arka yüzü ${PORT} portunda yayında.`);
      console.log(`🔗 Sağlık Kontrolü: http://localhost:${PORT}/health`);
      console.log(`=============================================================\n`);
    });
  } catch (error) {
    console.error('Sunucu başlatılamadı:', error);
    process.exit(1);
  }
}

startServer();
