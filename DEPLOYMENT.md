# Canlı Ortam Kontrol Listesi

## Ortam yapılandırması

1. `backend/.env.example` dosyasını temel alarak canlı ortam değişkenlerini tanımlayın.
2. `NODE_ENV=production`, MySQL biçimindeki `DATABASE_URL`, en az 32 karakterlik `JWT_SECRET`, SMTP bilgileri ve `CLIENT_ORIGINS` zorunludur.
3. İlk yönetici için yalnızca bir kez `ALLOW_BOOTSTRAP_ADMIN=true` ile birlikte `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL` ve `BOOTSTRAP_ADMIN_PASSWORD` verin. Örnek dosyadaki geçici giriş `admin` / `1234`, yalnızca süper yönetici bulunmayan veritabanında oluşturulur. Sonra bu değişkeni `false` yapın ve şifreyi panelden değiştirin. Bu hesapta gerçek e-posta bulunmadığından e-postayla şifre sıfırlama kullanılamaz.
4. Ön yüz için `VITE_API_URL=/api` kullanın. API farklı bir alan adında çalışacaksa tam `/api` adresini yazın.
5. `UPLOAD_DIR` değerini uygulama sürüm klasörü dışındaki, kalıcı ve yazma izni olan bir dizine ayarlayın. Örnek: `/home/CPANEL_KULLANICISI/app-data/gencihh-uploads`.

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

### cPanel Node.js uygulaması

`npm start` komutunu cPanel Terminal penceresinde açık bırakmak kalıcı bir yayın yöntemi değildir. cPanel'de **Setup Node.js App**, **Application Manager** veya **Websites & Apps** ekranından uygulama kökünü `app/backend`, başlangıç dosyasını `server.js` ve çalışma modunu `Production` olarak tanımlayın. Kod ya da ortam değişkeni güncellendiğinde uygulamayı **Redeploy/Restart** edin.

`frontend/public/.htaccess` dosyası build ile birlikte `frontend/dist/.htaccess` olarak üretilir. Bu dosya, `/haberler` gibi doğrudan açılan React sayfalarını `index.html` dosyasına döndürür. Apache `mod_rewrite` kapatılmışsa hosting desteğinden etkinleştirmesini isteyin.

Ters vekil `/api` ve `/uploads` isteklerini backend'e, diğer tüm istekleri `frontend/dist` içeriğine yönlendirmelidir. TLS sertifikası ters vekilde sonlandırılmalı ve uygulama yalnızca güvenilir proxy arkasındaysa `TRUST_PROXY=1` verilmelidir.

## Yayın sonrası kontroller

- `GET /health` yanıtı `status: ok` dönmeli.
- Yönetim panelinden ilk birim oluşturulmalı; sabit birim seed'i yoktur.
- Kayıt, OTP e-postası, parola sıfırlama, dosya yükleme ve rol bazlı erişim ayrı test edilmelidir.
- MySQL yedekleme, log toplama ve uptime izleme altyapısı sağlayıcı düzeyinde etkinleştirilmelidir.

## Instagram ve site fotoğrafları

- Tanıtım ve Medya Başkanı veya süper yönetici paneldeki **Site Fotoğrafları** alanından fotoğraf ve açıklama yayınlayabilir. Görseller `UPLOAD_DIR` dizininde tutulur; canlı ortamda bu dizin kalıcı depolama üzerinde olmalı ve veritabanıyla birlikte yedeklenmelidir.
- Fotoğraflar ve haber kapak görselleri panelden eklenir; Instagram hesabından otomatik içerik çekilmez.
