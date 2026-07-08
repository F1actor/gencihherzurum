const { GoogleGenerativeAI } = require('@google/generative-ai');

// Genç İHH için özel bir sistem komutu (sistem talimatı) hazırlıyoruz.
const SYSTEM_INSTRUCTION = `
Sen Genç İHH Erzurum için geliştirilmiş resmi, akıllı ve yardımsever bir asistan botusun.
Sisteme giriş yapan birim başkanlarına, yöneticilere ve diğer kullanıcılara Genç İHH sistemi hakkında yardımcı olmak için tasarlandın.
Görevlerin:
1. Kullanıcılara nazik, motive edici ve İslami/Ahlaki değerlere uygun bir üslupla cevap vermek.
2. Soru sorulduğunda veya yardım istendiğinde net, anlaşılır ve kısa cevaplar üretmek.
3. Genç İHH Erzurum teşkilatının kurumsal dilini yansıtmak (Selamlaşırken "Selamun Aleyküm", vedalaşırken "Allah'a emanet olun" gibi ifadeler kullanabilirsin).
4. Kullanıcılara teknik sistem (Etkinlik ekleme, puan durumu vb.) hakkında genel rehberlik yapmak.
`;

exports.chatWithAI = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Mesaj boş olamaz.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'MOCK_KEY' || apiKey.trim() === '') {
      return res.status(200).json({ 
        reply: 'Şu anda sistem yöneticisi tarafından geçerli bir Yapay Zeka API Anahtarı girilmediği için hizmet veremiyorum. Lütfen yöneticiye başvurarak sunucu ayarlarına (veya .env dosyasına) GEMINI_API_KEY eklemesini rica edin.'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Gemini 2.5 Flash kullanıyoruz (hızlı ve ücretsiz paket için ideal)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION
    });

    // Sohbet geçmişini Gemini formatına çeviriyoruz
    let formattedHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // ÖNEMLİ: Gemini API, sohbet geçmişinin MUTLAKA 'user' (kullanıcı) rolüyle başlamasını şart koşar.
    // İlk mesaj botun varsayılan selamlama mesajıysa bunu geçmişten çıkarıyoruz.
    while (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
      formattedHistory.shift();
    }

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage([{ text: message }]);
    const replyText = result.response.text();

    return res.status(200).json({ reply: replyText });
  } catch (error) {
    console.error('Yapay Zeka (LLM) Hatası:', error);
    
    // API Hatası ise daha düzgün bir mesaj gösterelim
    if (error.message && error.message.includes('API key not valid')) {
      return res.status(500).json({ message: 'Yapay zeka sistemi için tanımlanan API anahtarı geçersiz. Lütfen yöneticinize bildirin.' });
    }
    
    return res.status(500).json({ message: 'Yapay zeka ile iletişim kurulurken bir hata oluştu. Daha sonra tekrar deneyin.' });
  }
};
