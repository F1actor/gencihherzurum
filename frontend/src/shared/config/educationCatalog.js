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

export const universities = {
  'Ataturk Universitesi': {
    'Muhendislik Fakultesi': ['Bilgisayar Muhendisligi', 'Biyomuhendislik', 'Cevre Muhendisligi', 'Elektrik-Elektronik Muhendisligi', 'Endustri Muhendisligi', 'Insaat Muhendisligi', 'Kimya Muhendisligi', 'Makine Muhendisligi', 'Metalurji ve Malzeme Muhendisligi'],
    'Fen Fakultesi': ['Biyoloji', 'Fizik', 'Istatistik', 'Kimya', 'Matematik'],
    'Edebiyat Fakultesi': ['Cografya', 'Ingiliz Dili ve Edebiyati', 'Psikoloji', 'Sanat Tarihi', 'Sosyoloji', 'Tarih', 'Turk Dili ve Edebiyati'],
    'Iktisadi ve Idari Bilimler Fakultesi': ['Ekonometri', 'Iktisat', 'Isletme', 'Kamu Yonetimi', 'Uluslararasi Iliskiler'],
    'Iletisim Fakultesi': ['Gazetecilik', 'Halkla Iliskiler ve Tanitim', 'Radyo, Televizyon ve Sinema'],
    'Ziraat Fakultesi': ['Bahce Bitkileri', 'Bitki Koruma', 'Tarim Ekonomisi', 'Tarla Bitkileri', 'Toprak Bilimi', 'Zootekni'],
    'Egitim Fakultesi': ['Okul Oncesi Ogretmenligi', 'Rehberlik ve Psikolojik Danismanlik', 'Sinif Ogretmenligi', 'Turkce Ogretmenligi'],
    'Ilahiyat Fakultesi': ['Ilahiyat'], 'Tip Fakultesi': ['Tip'], 'Dis Hekimligi Fakultesi': ['Dis Hekimligi'], 'Eczacilik Fakultesi': ['Eczacilik']
  },
  'Erzurum Teknik Universitesi': {
    'Muhendislik ve Mimarlik Fakultesi': ['Bilgisayar Muhendisligi', 'Biyomuhendislik', 'Cevre Muhendisligi', 'Elektrik-Elektronik Muhendisligi', 'Endustri Muhendisligi', 'Insaat Muhendisligi', 'Kimya Muhendisligi', 'Makine Muhendisligi', 'Mekatronik Muhendisligi', 'Mimarlik'],
    'Fen Fakultesi': ['Fizik', 'Kimya', 'Matematik', 'Molekuler Biyoloji ve Genetik'],
    'Iktisadi ve Idari Bilimler Fakultesi': ['Iktisat', 'Isletme', 'Siyaset Bilimi ve Kamu Yonetimi', 'Uluslararasi Ticaret ve Lojistik'],
    'Edebiyat Fakultesi': ['Ingiliz Dili ve Edebiyati', 'Psikoloji', 'Sosyoloji', 'Tarih', 'Turk Dili ve Edebiyati'],
    'Saglik Bilimleri Fakultesi': ['Beslenme ve Diyetetik', 'Hemsirelik']
  }
};

export function formatPhone(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  return [digits.slice(0, 4), digits.slice(4, 7), digits.slice(7, 11)].filter(Boolean).join(' ');
}
