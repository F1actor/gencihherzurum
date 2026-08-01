const { GoogleGenerativeAI } = require('@google/generative-ai');
const AppError = require('../../core/errors/AppError');

const SYSTEM_INSTRUCTION = `
Sen Genç İHH Erzurum Teşkilat Portalı için geliştirilmiş resmi, akıllı, yardımsever ve doğal konuşan asistan botusun.
Sisteme giriş yapan birim başkanlarına, yöneticilere ve üyelere hem günlük sohbetlerde (nasılsın, merhaba vb.) sıcak cevaplar verir hem de web uygulaması kullanımı hakkında rehberlik edersin.

Sistem Hakkında Detaylı Bilgiler:
- **Genel Yapı:** Bu sistem Genç İHH Erzurum şubesindeki teşkilat yapısını yönetmek, birimlerin performansını ölçmek ve etkinlikleri takip etmek için tasarlanmıştır.
- **Birimler:** Sistemde Üniversite, Lise, Ortaokul, İHH Çocuk, Eğitim, Tanıtım ve Medya, Çalışan Gençlik ve Sosyal Faaliyet gibi farklı birimler bulunur.
- **Etkinlikler & Puanlama:** Birimler sisteme etkinlik girer. Etkinlik türleri: Rutin Görev (10 Puan), Ekstra Görev (20 Puan), Aylık Hedef (Değişken Puan). Etkinlikler kanıt fotoğrafı (medya) ile eklenir.
- **Performans Raporları:** Son 30 günlük rutin başarı oranları, genel liderlik tabloları ve haftalık özet istatistikler sistem tarafından hesaplanır.
- **Muhabbet Okulu:** Yaz okulu kapsamında öğrenci kayıtları alınır, öğrenciler yaş gruplarına göre sınıflara atanır, hocalar atanır ve online günlük yoklama işlemleri yürütülür.

Kesin Kurallar:
1. Normal muhabbet etmeyi, insan gibi doğal ve sıcakkanlı cevaplar vermeyi unutma. "Nasılsın", "günaydın" gibi sorulara içten ve resmiyetle karışık tatlı bir dille cevap ver.
2. Sistemin çalışması, menüler ve nasıl kullanılacağı hakkında sorulan sorulara rehberlik et.
3. KESİNLİKLE KÜFÜR, ARGO VEYA HAKARET İÇEREN MESAJLARA CEVAP VERME. Eğer kullanıcı küfür, argo veya uygunsuz bir dil kullanırsa, sohbeti derhal kes ve şu uyarıyı ver: "Lütfen üslubunuza dikkat edin. Genç İHH ahlakına ve teşkilat adabına uygun olmayan kelimeler kullandığınız için bu mesaja cevap veremiyorum." Bu kural esnetilemez.
`;

/**
 * Doğal ve Zengin Konuşma & Sistem Rehberliği Motoru
 */
function generateNaturalReply(userMessage) {
  const msg = userMessage.toLowerCase().trim();

  // 0. Küfür ve Argo Kontrolü
  const swearWords = ['amk', 'aq', 'siktir', 'piç', 'oç', 'yavşak', 'sik', 'göt', 'ibne', 'pezevenk', 'şerefsiz', 'aptal', 'salak', 'mal'];
  const containsSwear = swearWords.some(word => msg.includes(word));
  if (containsSwear) {
    return 'Lütfen üslubunuza dikkat edin. Genç İHH ahlakına ve teşkilat adabına uygun olmayan kelimeler kullandığınız için bu mesaja cevap veremiyorum.';
  }

  // 1. Günlük Sohbet & Hal Hatır
  if (msg.includes('nasılsın') || msg.includes('nasilsin') || msg.includes('naber') || msg.includes('keyifler')) {
    return 'Elhamdülillah, çok iyiyim! Siz nasılsınız? Genç İHH Erzurum Teşkilat Portalı\'nda size yardımcı olmak için buradayım. Bugün hangi konuda bilgi almak istersiniz?';
  }
  if (msg.includes('iyiyim') || msg.includes('iyi ol') || msg.includes('bende iyi') || msg.includes('elhamdülillah')) {
    return 'Allah daim etsin, iyiliğinizi artırsın! Teşkilat çalışmalarınızda veya web portali kullanımında takıldığınız bir yer olursa sormaktan çekinmeyin.';
  }
  if (msg.includes('selam') || msg.includes('sa') || msg.includes('merhaba') || msg.includes('günaydın') || msg.includes('hayırlı')) {
    return 'Ve Aleykümselam! Genç İHH Erzurum Akıllı Asistanına hoş geldiniz. Size ve biriminize nasıl yardımcı olabilirim?';
  }
  if (msg.includes('teşekkür') || msg.includes('tesekkur') || msg.includes('sağol') || msg.includes('sagol') || msg.includes('eyvallah')) {
    return 'Rica ederim, ne demek! Çalışmalarınızda kolaylıklar ve muvaffakiyetler dilerim. Başka bir sorunuz olursa her zaman buradayım.';
  }
  if (msg.includes('kimsin') || msg.includes('sen kim')) {
    return 'Ben Genç İHH Erzurum Teşkilat Portalı resmi akıllı asistanıyım! Birim başkanlarımızın ve yöneticilerimizin portalı en verimli şekilde kullanmasına rehberlik ediyorum.';
  }

  // 2. Web Uygulaması ve Sistem Bilgileri
  if (msg.includes('sistem') || msg.includes('nedir') || msg.includes('program') || msg.includes('uygulama') || msg.includes('ne işe')) {
    return 'Genç İHH Erzurum Teşkilat Portalı; il başkanlığımız, birim başkanlarımız ve üyelerimizin tüm teşkilat faaliyetlerini, rutin görevlerini, aylık hedeflerini ve Muhabbet Okulu çalışmalarını dijital ortamda şeffaf ve puanlı olarak takip etmelerini sağlayan web uygulamasıdır.';
  }
  if (msg.includes('özellik') || msg.includes('neler var') || msg.includes('menü') || msg.includes('panel')) {
    return 'Web uygulamamızda şu ana modüller yer almaktadır:\n\n' +
      '• 📊 **Genel Panel:** Birim başkanları, toplam etkinlik sayıları ve özet istatistikler.\n' +
      '• 👥 **Birim Başkanları:** Üye onayları, yetkilendirme ve birim atama işlemleri.\n' +
      '• 📈 **Raporlar:** Haftalık, aylık ve genel liderlik tabloları, grafiksel analizler ve CSV/PDF indirme.\n' +
      '• 📝 **Görevler & Hedefler:** Haftalık rutin görevler ve aylık belirlenen hedefler.\n' +
      '• 🏫 **Muhabbet Okulu:** Yaz okulu öğrenci başvuruları, sınıf/hoca tanımlama, yemek menüsü ve günlük yoklama.\n' +
      '• 🖼️ **Etkinlik Medyası:** Birimlerin sisteme yüklediği kanıt fotoğrafları galerisi.';
  }
  if (msg.includes('etkinlik') || msg.includes('puan') || msg.includes('nasıl eklenir')) {
    return 'Etkinlik eklemek için:\n1. Giriş yaptıktan sonra sol menüdeki panelinize gidin.\n2. "Yeni Etkinlik Ekle" formunu doldurun (Başlık, Tarih, Açıklama).\n3. Etkinlik türünü seçin (Rutin: 10 puan, Ekstra: 20 puan, Aylık Hedef: Belirlenen hedef puanı).\n4. Kanıt fotoğrafını yükleyip kaydedin!';
  }
  if (msg.includes('muhabbet') || msg.includes('yaz okulu') || msg.includes('öğrenci') || msg.includes('ogrenci')) {
    return 'Muhabbet Okulu modülü ile öğrencilerin online başvuruları toplanır, onaylanan öğrenciler yaş gruplarına göre sınıflara dağıtılır, hocalar atanır ve günlük yoklama takibi yapılır.';
  }
  if (msg.includes('rapor') || msg.includes('pdf') || msg.includes('excel') || msg.includes('liderlik')) {
    return 'Raporlar ekranından teşkilatın genel performansını ve birim sıralamalarını görebilir, tek tıkla Excel (CSV) veya resmi PDF rapor dosyası oluşturabilirsiniz.';
  }
  if (msg.includes('yardım') || msg.includes('yardim') || msg.includes('nasıl')) {
    return 'Size yardımcı olmaktan mutluluk duyarım! Öğrenmek istediğiniz konuyu yazabilirsiniz (Örn: "etkinlik nasıl eklenir", "sistemde neler var", "muhabbet okulu kullanımı", "nasılsın").';
  }

  // 3. Genel Bilinmeyen Mesajlar İçin Esnek ve Rastgele Yanıtlar
  const fallbackResponses = [
    'Anlıyorum, sizi dinliyorum. Genç İHH çalışmalarıyla ilgili sormak istediğiniz belirli bir konu var mı?',
    'Bu konuda size tam olarak nasıl yardımcı olabilirim? İsterseniz sistem özelliklerinden veya etkinlik ekleme adımlarından bahsedebilirim.',
    'Harika! Sohbet etmek her zaman güzel. Teşkilat işleri nasıl gidiyor, yardımcı olabileceğim bir şey var mı?',
    'Sizi çok iyi anlıyorum. Genç İHH Erzurum ekibi olarak çok yoğun çalışıyorsunuz, bu süreçte size destek olmak benim görevim. Sormak istediğiniz bir şey olursa buradayım.',
    'Ne güzel söylediniz! Konuyu biraz daha açmak ister misiniz? Sistemin kullanımı hakkında takıldığınız bir yer varsa onu da seve seve anlatabilirim.'
  ];
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

exports.chatWithAI = async ({ message, history }) => {
  if (!message) throw new AppError('Mesaj boş olamaz.', 400);

  const apiKey = process.env.GEMINI_API_KEY;

  // Eğer geçerli bir API anahtarı varsa Google Gemini API'yi çağır
  if (apiKey && apiKey.trim() !== '' && apiKey !== 'MOCK_KEY') {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-pro'];

      let formattedHistory = (history || []).map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
        formattedHistory.shift();
      }

      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: SYSTEM_INSTRUCTION
          });

          const chat = model.startChat({
            history: formattedHistory,
            generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
          });

          const result = await chat.sendMessage([{ text: message }]);
          if (result && result.response) {
            return result.response.text();
          }
        } catch (e) {
          // sonraki modeli dene
        }
      }
    } catch (err) {
      console.warn('[Gemini API] Çağrı yapılamadı, doğal yanıt motoruna geçildi:', err.message);
    }
  }

  // API çağrısı yapılamazsa zengin ve doğal yanıt motoru devreye girer
  return generateNaturalReply(message);
};
