require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./src/config/database');
const { initCronJobs } = require('./src/services/cronService');
const errorMiddleware = require('./src/middleware/errorMiddleware');

const authRoutes = require('./src/modules/auth/authRoutes');
const adminRoutes = require('./src/modules/admin/adminRoutes');
const eventRoutes = require('./src/modules/events/eventsRoutes');
const reportsRoutes = require('./src/modules/reports/reportsRoutes');
const systemRoutes = require('./src/modules/system/systemRoutes');
const llmRoutes = require('./src/modules/llm/llmRoutes');
const muhabbetRoutes = require('./src/modules/muhabbet/muhabbetRoutes');

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
  res.status(200).json({ status: 'OK', message: 'Genç İHH Backend çalışıyor.' });
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
