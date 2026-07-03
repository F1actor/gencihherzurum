require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./config/database');
const { initCronJobs } = require('./services/cronService');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const eventRoutes = require('./routes/events');
const reportsRoutes = require('./routes/reports');
const systemRoutes = require('./routes/system');
const llmRoutes = require('./routes/llm');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Yapılandırması (React ön yüzü ile iletişim için)
app.use(cors({
  origin: '*', // Geliştirme aşamasında her yerden gelen isteklere izin ver
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kanıt resimlerinin static olarak sunulması
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Rotaları
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/llm', llmRoutes);

// Sağlık kontrolü
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Genç İHH Backend çalışıyor.' });
});

// Hata Yakalama Middleware'i
app.use((err, req, res, next) => {
  console.error('Beklenmeyen bir hata oluştu:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Sunucuda beklenmeyen bir hata oluştu.'
  });
});

// Sunucuyu Başlat
async function startServer() {
  try {
    // 1. Veritabanını ilklendir
    await initDatabase();
    
    // 2. Cron Job'ları başlat
    initCronJobs();

    // 3. Portu dinle
    app.listen(PORT, () => {
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
