import React, { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, Trophy, Users, HeartHandshake } from 'lucide-react';
import SiteLayout, { PageLink } from './SiteLayout';
import { API_URL, getAssetUrl } from '../../shared/config/api';

const date = value => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));

export default function PublicHome() {
  const [news, setNews] = useState([]);
  useEffect(() => { fetch(`${API_URL}/news`).then(res => res.ok ? res.json() : []).then(data => setNews(data.slice(0, 3))).catch(() => {}); }, []);
  return <SiteLayout>
    <section className="home-hero"><div className="home-hero-inner"><p>GENÇ İHH ERZURUM</p><h1>Bir iyilik hikâyesinin gençlik heyecanıyız biz!</h1><span>2025–26 döneminde yürüttüğümüz çalışmalarla Türkiye 1.’si olduk.</span><div><PageLink to="/basarilarimiz" className="hero-primary">Başarı hikâyemiz <ArrowRight size={18} /></PageLink><PageLink to="/basvuru" className="hero-secondary">Muhabbet Okulu</PageLink></div></div></section>
    <section className="home-highlight"><div><Trophy size={34} /><span><strong>Türkiye 1.’si</strong><small>2025–26 dönemi</small></span></div><p>Bu başarı; Erzurum’daki gençlerimizin, gönüllülerimizin ve tüm teşkilatımızın ortak emeğidir.</p><PageLink to="/basarilarimiz">Detayları incele <ArrowRight size={17} /></PageLink></section>
    <section className="home-sections"><article><Users size={30} /><h2>Gençlik çalışmaları</h2><p>Gençlerin sosyal, kültürel ve manevi gelişimini destekleyen programlar.</p><PageLink to="/calismalarimiz">Çalışmalarımız <ArrowRight size={17} /></PageLink></article><article><HeartHandshake size={30} /><h2>Gönüllü ol</h2><p>İyiliği çoğaltmak için bilgi, emek ve heyecanını bizimle paylaş.</p><PageLink to="/gonullu">Başvuru yap <ArrowRight size={17} /></PageLink></article><article><CalendarDays size={30} /><h2>Muhabbet Okulu</h2><p>Çocuklarımız için eğitim, kardeşlik ve etkinlikle dolu bir program.</p><PageLink to="/basvuru">Başvuru durumunu görüntüle <ArrowRight size={17} /></PageLink></article></section>
    <section className="home-news"><div className="section-heading"><div><p>GÜNCEL</p><h2>Son haberler</h2></div><PageLink to="/haberler">Tüm haberler <ArrowRight size={17} /></PageLink></div><div className="home-news-grid">{news.length === 0 ? <p className="news-empty">Haberler, tanıtım ve medya birimi tarafından yayımlandığında burada görünecek.</p> : news.map(item => <article key={item.id}><img src={getAssetUrl(item.coverImagePath)} alt="" /><div><span>{item.category}</span><h3>{item.title}</h3><p>{item.summary}</p><small><CalendarDays size={14} /> {date(item.createdAt)}</small><PageLink to={`/haberler/${item.id}`}>Haberi oku <ArrowRight size={16} /></PageLink></div></article>)}</div></section>
  </SiteLayout>;
}
