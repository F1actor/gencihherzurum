const nodemailer = require('nodemailer');

let transporter = null;

// E-posta göndericisini ilklendir
async function initTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && user && pass) {
    console.log('Tanımlı SMTP sunucusu kullanılıyor...');
    transporter = nodemailer.createTransport({
      host,
      port: parseInt(port) || 587,
      secure: port === '465',
      auth: { user, pass }
    });
  } else {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Canlı ortamda SMTP yapılandırması zorunludur.');
    }
    console.log('SMTP bilgileri eksik. Ethereal Test Mail sunucusu oluşturuluyor...');
    try {
      // Ethereal test hesabı oluştur
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log('Ethereal Test Hesabı Başarıyla Oluşturuldu.');
      console.log('User:', testAccount.user);
      console.log('Bunu test etmek için şu adresten gelen mailleri okuyabilirsiniz: https://ethereal.email');
    } catch (err) {
      console.error('Ethereal hesabı oluşturulurken hata:', err.message);
      // Fallback: Konsola log yazıp devam edeceğiz.
    }
  }
  return transporter;
}

// OTP E-postası gönder (type: 'verify' | 'reset')
async function sendOtpEmail(toEmail, fullName, otpCode, type = 'verify') {
  const isReset = type === 'reset';
  const subject = isReset
    ? 'Genç İHH Erzurum - Şifre Sıfırlama Kodu'
    : 'Genç İHH Erzurum - E-posta Doğrulama Kodu';
  const heading = isReset ? 'Şifre Sıfırlama' : 'E-posta Doğrulaması';
  const bodyText = isReset
    ? 'Şifrenizi sıfırlamak için bir talep aldık. Aşağıdaki kodu kullanarak yeni şifrenizi belirleyebilirsiniz:'
    : 'Genç İHH Erzurum Teşkilat Takip Portalına yaptığınız kayıt için e-posta adresinizi doğrulamanız gerekmektedir:';
  const warningText = isReset
    ? 'Bu şifre sıfırlama talebini siz yapmadıysanız lütfen bu e-postayı dikkate almayınız.'
    : 'Bu kaydı siz yapmadıysanız lütfen bu e-postayı dikkate almayınız.';

  try {
    const mailTransporter = await initTransporter();
    
    const emailHtml = `
      <div style="font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f9fa; padding: 40px 20px; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #eef2f5;">
          <div style="background-color: #1b5e20; padding: 30px; color: #ffffff; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px;">GENÇ İHH</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8; font-weight: 500;">Erzurum Teşkilat Yönetim Portalı</p>
          </div>
          <div style="padding: 40px 30px; color: #333333; text-align: left; line-height: 1.6;">
            <h2 style="margin-top: 0; font-size: 18px; font-weight: 600; color: #1b5e20;">${heading}</h2>
            <p style="font-size: 15px;">Merhaba <strong>${fullName}</strong>,</p>
            <p style="font-size: 15px;">${bodyText}</p>
            <div style="background-color: #f1f8e9; border-radius: 8px; padding: 15px; text-align: center; margin: 25px 0; border: 1px solid #c8e6c9;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #2e7d32;">${otpCode}</span>
            </div>
            <p style="font-size: 13px; color: #666666;">Bu kod 10 dakika boyunca geçerlidir. ${warningText}</p>
          </div>
          <div style="background-color: #fafafa; padding: 20px; border-top: 1px solid #eeeeee; font-size: 12px; color: #999999; text-align: center;">
            <p style="margin: 0;">© 2026 Genç İHH Erzurum Sekreterya. Tüm Hakları Saklıdır.</p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Genç İHH Erzurum" <no-reply@gencihh.org>',
      to: toEmail,
      subject,
      html: emailHtml
    };

    if (mailTransporter) {
      const info = await mailTransporter.sendMail(mailOptions);
      console.log(`E-posta başarıyla gönderildi: ${toEmail}`);
      if (nodemailer.getTestMessageUrl(info)) {
        console.log(`[TEST MAİL ÖNİZLEME LİNKİ]: ${nodemailer.getTestMessageUrl(info)}`);
      }
    }
  } catch (error) {
    console.error('E-posta gönderme hatası:', error.message);
  }
  
  if (process.env.NODE_ENV === 'production') return;
  console.log(`\n==============================================`);
  console.log(`[KONSOL MAİL LOGU] ${isReset ? 'ŞİFRE SIFIRLAMA' : 'DOĞRULAMA'}`);
  console.log(`Kullanıcı: ${fullName}`);
  console.log(`E-posta: ${toEmail}`);
  console.log(`Kod: ${otpCode}`);
  console.log(`==============================================\n`);
}

// Haftalık özet e-postası (admin'e)
async function sendWeeklySummaryEmail(toEmail, summaryData) {
  try {
    const mailTransporter = await initTransporter();
    const { activeCount, inactiveUnits, topUnit, weekRange } = summaryData;

    const inactiveList = inactiveUnits.length > 0
      ? inactiveUnits.map(u => `<li style="color:#c62828;">${u}</li>`).join('')
      : '<li style="color:#2e7d32;">Tüm birimler aktif! 🎉</li>';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; background-color: #f7f9fa; padding: 40px 20px; text-align: center;">
        <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #eee;">
          <div style="background-color: #1b5e20; padding: 25px; color: #fff;">
            <h1 style="margin:0;font-size:20px;">📊 Haftalık Özet Raporu</h1>
            <p style="margin:5px 0 0;opacity:.8;font-size:13px;">${weekRange}</p>
          </div>
          <div style="padding: 30px; text-align: left;">
            <p style="font-size:15px;">Bu hafta <strong>${activeCount}</strong> birim etkinlik bildirdi.</p>
            ${topUnit ? `<p style="font-size:15px;">🏆 Haftanın Lideri: <strong>${topUnit}</strong></p>` : ''}
            <h3 style="font-size:14px;color:#555;border-bottom:1px solid #eee;padding-bottom:8px;">Etkinlik Bildirmeyen Birimler:</h3>
            <ul>${inactiveList}</ul>
          </div>
          <div style="background:#fafafa;padding:15px;font-size:12px;color:#999;text-align:center;">
            © 2026 Genç İHH Erzurum Sekreterya
          </div>
        </div>
      </div>
    `;

    if (mailTransporter) {
      await mailTransporter.sendMail({
        from: process.env.SMTP_FROM || '"Genç İHH Erzurum" <no-reply@gencihh.org>',
        to: toEmail,
        subject: `Haftalık Özet | ${weekRange}`,
        html: emailHtml
      });
    }
  } catch (err) {
    console.error('Haftalık özet e-posta hatası:', err.message);
  }
}

module.exports = {
  sendOtpEmail,
  sendWeeklySummaryEmail
};

