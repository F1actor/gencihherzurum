# Canlı Ortam Kontrol Listesi

## Ortam yapılandırması

1. `backend/.env.example` dosyasını temel alarak canlı ortam değişkenlerini tanımlayın.
2. `NODE_ENV=production`, MySQL biçimindeki `DATABASE_URL`, en az 32 karakterlik `JWT_SECRET`, SMTP bilgileri ve `CLIENT_ORIGINS` zorunludur.
3. İlk yönetici için yalnızca bir kez `ALLOW_BOOTSTRAP_ADMIN=true` ile birlikte `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL` ve en az 12 karakterlik `BOOTSTRAP_ADMIN_PASSWORD` verin. Yönetici oluşturulduktan sonra bu değişkeni `false` yapın.
4. Ön yüz için `VITE_API_URL=/api` kullanın. API farklı bir alan adında çalışacaksa tam `/api` adresini yazın.

## Yayın akışı

```powershell
cd frontend
npm ci
npm run build

cd ../backend
npm ci
$env:NODE_ENV='production'
npm start
```

## Eski SQLite verisini taşıma

Kaynak SQLite dosyası bu projede `backend/database.sqlite` olarak bulunur. Hedef MySQL veritabanı boşken, `backend/.env` içindeki MySQL bağlantısını tanımlayıp aşağıdaki komutu bir kez çalıştırın:

```powershell
cd backend
$env:ALLOW_BOOTSTRAP_ADMIN='false'
npm run db:migrate:sqlite
```

Farklı bir kaynak konumu için `SQLITE_SOURCE_PATH` verin. Komut hedef tablolardan herhangi biri doluysa kayıtları birleştirmeden durur; önce yedek alın ve aynı hedefe ikinci kez çalıştırmayın.

Ters vekil `/api` ve `/uploads` isteklerini backend'e, diğer tüm istekleri `frontend/dist` içeriğine yönlendirmelidir. TLS sertifikası ters vekilde sonlandırılmalı ve uygulama yalnızca güvenilir proxy arkasındaysa `TRUST_PROXY=1` verilmelidir.

## Yayın sonrası kontroller

- `GET /health` yanıtı `status: ok` dönmeli.
- Yönetim panelinden ilk birim oluşturulmalı; sabit birim seed'i yoktur.
- Kayıt, OTP e-postası, parola sıfırlama, dosya yükleme ve rol bazlı erişim ayrı test edilmelidir.
- MySQL yedekleme, log toplama ve uptime izleme altyapısı sağlayıcı düzeyinde etkinleştirilmelidir.
