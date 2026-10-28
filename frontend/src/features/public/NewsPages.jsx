import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Trophy } from 'lucide-react';
import SiteLayout, { PageLink } from './SiteLayout';
import { API_URL, getAssetUrl } from '../../shared/config/api';

const formatDate = value => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));

export function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch(`${API_URL}/news`).then(res => res.ok ? res.json() : []).then(setNews).finally(() => setLoading(false)); }, []);
  return <SiteLayout><PageHero eyebrow="MEDYA MERKEZİ" title="Haberler" text="Genç İHH Erzurum'un faaliyetlerinden, programlarından ve başarılarından son gelişmeler." />
    <section className="content-section"><div className="news-grid">
      {loading ? <p>Haberler yükleniyor...</p> : news.length === 0 ? <p>Henüz yayımlanmış haber bulunmuyor.</p> : news.map(item => <article className="news-card" key={item.id}>
        <img src={getAssetUrl(item.coverImagePath)} alt="" />
        <div><span>{item.category}</span><h2>{item.title}</h2><p>{item.summary}</p><small><CalendarDays size={15} /> {formatDate(item.createdAt)}</small><PageLink to={`/haberler/${item.id}`} className="text-link">Haberi oku <ArrowRight size={16} /></PageLink></div>
      </article>)}
    </div></section></SiteLayout>;
}

export function NewsDetailPage() {
  const { id } = useParams(); const [item, setItem] = useState(); const [error, setError] = useState('');
  useEffect(() => { fetch(`${API_URL}/news/${id}`).then(async res => { if (!res.ok) throw new Error('Haber bulunamadı.'); return res.json(); }).then(setItem).catch(err => setError(err.message)); }, [id]);
  return <SiteLayout><main className="article-page"><PageLink to="/haberler" className="back-link"><ArrowLeft size={18} /> Haberler</PageLink>{error && <p>{error}</p>}{!item && !error && <p>Haber yükleniyor...</p>}{item && <article className="article-content"><p className="article-category">{item.category}</p><h1>{item.title}</h1><p className="article-date"><CalendarDays size={16} /> {formatDate(item.createdAt)}</p><img src={getAssetUrl(item.coverImagePath)} alt={item.title} /><p className="article-summary">{item.summary}</p><div className="article-body">{item.body.split('\n').filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></article>}</main></SiteLayout>;
}

export function StaticPage({ type }) {
  const content = {
    about: { eyebrow: 'KURUMSAL', title: 'İyiliğin geleceği gençlerimizin elinde', text: 'Genç İHH Erzurum; inanç, sorumluluk ve dayanışma bilinciyle gençlerin sosyal hayata aktif katılımını destekler.', blocks: [['Misyonumuz', 'İyiliğin yayılması için bilinçli, ahlaklı ve üretken nesiller yetiştirmek.'], ['Vizyonumuz', 'Erzurum’un her noktasında gençlerin gönüllülük ve dayanışma ruhunu güçlendirmek.']] },
    works: { eyebrow: 'FAALİYETLER', title: 'Çalışmalarımız', text: 'Eğitimden sosyal sorumluluk faaliyetlerine, gençlerin hayatına değer katan çalışmalar yürütüyoruz.', blocks: [['Eğitim programları', 'Muhabbet Okulu, okumalar, seminerler ve değerler eğitimi.'], ['Sosyal sorumluluk', 'İhtiyaç sahiplerine destek, ziyaretler ve gönüllü saha çalışmaları.'], ['Gençlik faaliyetleri', 'Kültürel geziler, spor, kardeşlik buluşmaları ve farkındalık çalışmaları.']] },
    achievements: { eyebrow: 'BAŞARILARIMIZ', title: '2025–26 Türkiye birincisi Genç İHH Erzurum', text: 'Yürüttüğümüz nitelikli çalışmalar, ekip ruhu ve gönüllülerimizin emeğiyle Türkiye genelinde birincilik elde ettik.', blocks: [['Türkiye birinciliği', '2025–26 döneminde yürüttüğümüz çalışmalarla Türkiye 1.’si olduk.'], ['Sahadan gelen güç', 'Bu başarı; her etkinliğe emek veren gençlerimizin, başkanlarımızın ve gönüllülerimizin ortak eseridir.']] }
  }[type];
  return <SiteLayout><PageHero eyebrow={content.eyebrow} title={content.title} text={content.text} /><section className="content-section institution-content">{type === 'achievements' && <div className="achievement-mark"><Trophy size={44} /><strong>Türkiye 1.’si</strong><span>2025–26</span></div>}<div className="institution-grid">{content.blocks.map(([title, text]) => <article key={title}><h2>{title}</h2><p>{text}</p></article>)}</div></section></SiteLayout>;
}

export function PageHero({ eyebrow, title, text, children }) { return <section className="page-hero"><div><p>{eyebrow}</p><h1>{title}</h1><span>{text}</span>{children}</div></section>; }
