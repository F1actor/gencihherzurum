export const educationStatuses = [
  ['UNIVERSITY_STUDENT', 'Lisans öğrencisiyim'], ['UNIVERSITY_GRADUATE', 'Üniversite mezunuyum'],
  ['ASSOCIATE_STUDENT', 'Ön lisans okuyorum'], ['OPEN_EDUCATION', 'Açıköğretim okuyorum'],
  ['DISTANCE_EDUCATION', 'Uzaktan öğretim okuyorum'], ['MASTERS', 'Yüksek lisans yapıyorum'],
  ['DOCTORATE', 'Doktora yapıyorum'], ['NON_UNIVERSITY', 'Üniversite okumuyorum']
];

export const grades = ['Hazırlık', '1. sınıf', '2. sınıf', '3. sınıf', '4. sınıf', '5. sınıf', '6. sınıf'];
const universityStatuses = new Set(['UNIVERSITY_STUDENT', 'UNIVERSITY_GRADUATE', 'ASSOCIATE_STUDENT', 'OPEN_EDUCATION', 'DISTANCE_EDUCATION', 'MASTERS', 'DOCTORATE']);
const graduateStatuses = new Set(['UNIVERSITY_GRADUATE']);
export const needsUniversityDetails = status => universityStatuses.has(status);
export const needsEmploymentStatus = status => graduateStatuses.has(status);
export const needsGrade = status => ['UNIVERSITY_STUDENT', 'ASSOCIATE_STUDENT', 'OPEN_EDUCATION', 'DISTANCE_EDUCATION', 'MASTERS', 'DOCTORATE'].includes(status);
export const educationDetailTitle = status => needsEmploymentStatus(status) ? 'Mezuniyet bilgileri' : 'Üniversite bilgileri';
export const universityFieldLabel = status => needsEmploymentStatus(status) ? 'Mezun olduğun üniversite' : 'Üniversite';

// Atatürk Üniversitesi fakülte listesi resmî fakülteler sayfasına göre güncellenmiştir.
export const universities = {
  'Atatürk Üniversitesi': {
    'Açık ve Uzaktan Öğretim Fakültesi': ['Açıköğretim Programları', 'Uzaktan Öğretim Programları'],
    'Diş Hekimliği Fakültesi': ['Diş Hekimliği'], 'Eczacılık Fakültesi': ['Eczacılık'],
    'Edebiyat Fakültesi': ['Arkeoloji', 'Coğrafya', 'Çağdaş Türk Lehçeleri ve Edebiyatları', 'Felsefe', 'İngiliz Dili ve Edebiyatı', 'Psikoloji', 'Sanat Tarihi', 'Sosyoloji', 'Tarih', 'Türk Dili ve Edebiyatı'],
    'Fen Fakültesi': ['Biyoloji', 'Fizik', 'İstatistik', 'Kimya', 'Matematik', 'Moleküler Biyoloji ve Genetik'],
    'Güzel Sanatlar Fakültesi': ['Fotoğraf', 'Geleneksel Türk Sanatları', 'Grafik Sanatlar', 'Heykel', 'Müzikoloji', 'Resim', 'Sahne Sanatları', 'Seramik', 'Tekstil ve Moda Tasarımı'],
    'Hemşirelik Fakültesi': ['Hemşirelik'], 'Hukuk Fakültesi': ['Hukuk'],
    'İktisadi ve İdari Bilimler Fakültesi': ['Çalışma Ekonomisi ve Endüstri İlişkileri', 'Ekonometri', 'İktisat', 'İşletme', 'Kamu Yönetimi', 'Uluslararası İlişkiler', 'Uluslararası Ticaret ve Lojistik', 'Yönetim Bilişim Sistemleri'],
    'İlahiyat Fakültesi': ['İlahiyat'],
    'İletişim Fakültesi': ['Gazetecilik', 'Halkla İlişkiler ve Tanıtım', 'Radyo, Televizyon ve Sinema'],
    'Kazım Karabekir Eğitim Fakültesi': ['Bilgisayar ve Öğretim Teknolojileri Eğitimi', 'Fen Bilgisi Öğretmenliği', 'İlköğretim Matematik Öğretmenliği', 'İngilizce Öğretmenliği', 'Okul Öncesi Öğretmenliği', 'Özel Eğitim Öğretmenliği', 'Rehberlik ve Psikolojik Danışmanlık', 'Sınıf Öğretmenliği', 'Sosyal Bilgiler Öğretmenliği', 'Türkçe Öğretmenliği'],
    'Mimarlık ve Tasarım Fakültesi': ['Mimarlık', 'Şehir ve Bölge Planlama', 'Endüstriyel Tasarım', 'İç Mimarlık'],
    'Mühendislik Fakültesi': ['Bilgisayar Mühendisliği', 'Biyomühendislik', 'Çevre Mühendisliği', 'Elektrik-Elektronik Mühendisliği', 'Endüstri Mühendisliği', 'İnşaat Mühendisliği', 'Kimya Mühendisliği', 'Makine Mühendisliği', 'Metalurji ve Malzeme Mühendisliği'],
    'Oltu Beşeri ve Sosyal Bilimler Fakültesi': ['Bankacılık ve Finans', 'İşletme', 'Maliye', 'Sosyal Hizmet', 'Siyaset Bilimi ve Kamu Yönetimi'],
    'Sağlık Bilimleri Fakültesi': ['Beslenme ve Diyetetik', 'Ebelik', 'Fizyoterapi ve Rehabilitasyon', 'Sosyal Hizmet'],
    'Spor Bilimleri Fakültesi': ['Antrenörlük Eğitimi', 'Beden Eğitimi ve Spor Öğretmenliği', 'Spor Yöneticiliği'],
    'Su Ürünleri Fakültesi': ['Su Ürünleri Mühendisliği'], 'Tıp Fakültesi': ['Tıp'],
    'Turizm Fakültesi': ['Gastronomi ve Mutfak Sanatları', 'Turizm İşletmeciliği', 'Turizm Rehberliği'],
    'Uygulamalı Bilimler Fakültesi': ['Acil Yardım ve Afet Yönetimi', 'Bankacılık ve Finans', 'Muhasebe ve Finans Yönetimi', 'Uluslararası Ticaret ve Lojistik'],
    'Veteriner Fakültesi': ['Veterinerlik'],
    'Ziraat Fakültesi': ['Bahçe Bitkileri', 'Bitki Koruma', 'Biyosistem Mühendisliği', 'Gıda Mühendisliği', 'Peyzaj Mimarlığı', 'Tarım Ekonomisi', 'Tarla Bitkileri', 'Toprak Bilimi ve Bitki Besleme', 'Zootekni']
  },
  'Erzurum Teknik Üniversitesi': {
    'Mühendislik ve Mimarlık Fakültesi': ['Bilgisayar Mühendisliği', 'Biyomühendislik', 'Çevre Mühendisliği', 'Elektrik-Elektronik Mühendisliği', 'Endüstri Mühendisliği', 'İnşaat Mühendisliği', 'Kimya Mühendisliği', 'Makine Mühendisliği', 'Mekatronik Mühendisliği', 'Mimarlık'],
    'Fen Fakültesi': ['Fizik', 'Kimya', 'Matematik', 'Moleküler Biyoloji ve Genetik'],
    'İktisadi ve İdari Bilimler Fakültesi': ['İktisat', 'İşletme', 'Siyaset Bilimi ve Kamu Yönetimi', 'Uluslararası Ticaret ve Lojistik'],
    'Edebiyat Fakültesi': ['İngiliz Dili ve Edebiyatı', 'Psikoloji', 'Sosyoloji', 'Tarih', 'Türk Dili ve Edebiyatı'],
    'Sağlık Bilimleri Fakültesi': ['Beslenme ve Diyetetik', 'Hemşirelik']
  }
};

export function formatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 11)].filter(Boolean).join(' ');
}
