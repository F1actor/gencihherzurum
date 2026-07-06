import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Bar, Line } from 'react-chartjs-2';
import { Download, Filter, Target, Award, CheckSquare, FileText, FileSpreadsheet } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';

export default function AnnualReportPanel() {
  const { fetchWithAuth, setLoadingScreen, theme } = useAuth();
  const { showNotification } = useNotification();
  
  const [reportData, setReportData] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState('Tüm Sistem');

  const validUnits = [
    'Tüm Sistem', 'İl Başkanı', 'Teşkilatlanma Başkanı', 'Eğitim Başkanı', 'Üniversite Başkanı',
    'Lise Başkanı', 'Ortaokul Başkanı', 'İHH Çocuk Başkanı', 'Tanıtım ve Medya Başkanı',
    'Çalışan Gençlik Başkanı', 'Sosyal Faaliyet Başkanı', 'Proje - Fon Başkanı', 'Atom Başkanı'
  ];

  const fetchAnnualReport = async () => {
    setLoadingScreen(true);
    try {
      const res = await fetchWithAuth(`/reports/annual-report?unit=${encodeURIComponent(selectedUnit)}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      } else {
        const errText = await res.text();
        console.error('Report fetch failed:', res.status, errText);
        showNotification(`Rapor yüklenemedi. Kod: ${res.status}`, 'error');
      }
    } catch (e) {
      console.error('Fetch exception:', e);
      showNotification('Rapor çekilirken hata oluştu.', 'error');
    }
    setLoadingScreen(false);
  };

  useEffect(() => {
    fetchAnnualReport();
  }, [selectedUnit]);

  const handleExportPDF = () => {
    const element = document.getElementById('annual-report-content');
    const opt = {
      margin: 0.5,
      filename: `Yillik_Rapor_${selectedUnit.replace(/\s+/g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1200, width: 1200 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleExportExcel = () => {
    if (!reportData) return;
    
    // Create worksheet for Unit Stats
    const wsData = [
      ['Birim Adı', 'Planlanan Rutin', 'Tamamlanan Rutin', 'Tamamlanan Ekstra', 'Tamamlanan Aylık Hedef', 'Başarı Oranı (%)']
    ];
    
    reportData.unitStats.forEach(u => {
      const successRate = u.routinesPlanned > 0 ? Math.round((u.routinesCompleted / u.routinesPlanned) * 100) : 0;
      wsData.push([
        u.unit,
        u.routinesPlanned,
        u.routinesCompleted,
        u.extrasCompleted,
        u.targetsCompleted,
        `${successRate}%`
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Yıllık İstatistikler");
    
    XLSX.writeFile(wb, `Yillik_Rapor_${selectedUnit.replace(/\s+/g, '_')}.xlsx`);
  };

  if (!reportData) return null;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        display: true, 
        position: 'bottom', 
        labels: { color: theme === 'dark' ? '#94a3b8' : '#475569' } 
      } 
    },
    scales: {
      y: { 
        grid: { color: theme === 'dark' ? '#1f2937' : '#e2e8f0' }, 
        ticks: { color: theme === 'dark' ? '#64748b' : '#94a3b8' } 
      },
      x: { 
        grid: { color: theme === 'dark' ? '#1f2937' : '#e2e8f0' }, 
        ticks: { color: theme === 'dark' ? '#64748b' : '#94a3b8' } 
      }
    }
  };

  const barChartData = {
    labels: reportData.unitStats.map(u => u.unit),
    datasets: [
      {
        label: 'Tamamlanan Rutin',
        data: reportData.unitStats.map(u => u.routinesCompleted),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
      },
      {
        label: 'Tamamlanan Ekstra',
        data: reportData.unitStats.map(u => u.extrasCompleted),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      },
      {
        label: 'Tamamlanan Aylık Hedef',
        data: reportData.unitStats.map(u => u.targetsCompleted),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
      }
    ]
  };

  const lineChartData = {
    labels: reportData.lineChartData.labels,
    datasets: [{
      label: 'Aylık Kazanılan Puan Trendi',
      data: reportData.lineChartData.data,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      tension: 0.4,
      fill: true
    }]
  };

  // Toplam İstatistik Hesaplamaları
  const totalRoutinesPlanned = reportData.unitStats.reduce((acc, curr) => acc + curr.routinesPlanned, 0);
  const totalRoutinesCompleted = reportData.unitStats.reduce((acc, curr) => acc + curr.routinesCompleted, 0);
  const totalExtrasCompleted = reportData.unitStats.reduce((acc, curr) => acc + curr.extrasCompleted, 0);
  const totalTargetsCompleted = reportData.unitStats.reduce((acc, curr) => acc + curr.targetsCompleted, 0);
  const overallSuccessRate = totalRoutinesPlanned > 0 ? Math.round((totalRoutinesCompleted / totalRoutinesPlanned) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Üst Kısım: Filtre ve Çıktı Butonları */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Filter size={20} className="text-primary" />
          <h2 style={{ fontSize: '16px', fontWeight: 'bold' }}>Değerlendirme Modu:</h2>
          <select 
            className="form-control" 
            style={{ width: '250px' }}
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
          >
            {validUnits.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportPDF} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', borderColor: '#ef4444' }}>
            <FileText size={18} /> PDF İndir
          </button>
          <button onClick={handleExportExcel} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', borderColor: '#10b981' }}>
            <FileSpreadsheet size={18} /> Excel İndir
          </button>
        </div>
      </div>

      {/* Rapor İçeriği (PDF'e yazdırılacak kısım) */}
      <div id="annual-report-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '10px' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {selectedUnit === 'Tüm Sistem' ? 'GENÇ İHH ERZURUM GENEL YILLIK RAPORU' : `${selectedUnit.toUpperCase()} YILLIK DEĞERLENDİRME RAPORU`}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Son 1 Yıllık Faaliyet ve Performans Özeti</p>
        </div>

        {/* Özet Kartları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '12px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: 'var(--radius-md)' }}>
              <CheckSquare size={24} />
            </div>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Rutin Tamamlama</p>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalRoutinesCompleted} / {totalRoutinesPlanned}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>% {overallSuccessRate} Başarı</p>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: 'var(--radius-md)' }}>
              <Award size={24} />
            </div>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Yapılan Ekstra</p>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalExtrasCompleted}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Etkinlik</p>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ padding: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderRadius: 'var(--radius-md)' }}>
              <Target size={24} />
            </div>
            <div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Aylık Hedef</p>
              <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{totalTargetsCompleted}</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tamamlandı</p>
            </div>
          </div>
        </div>

        {/* Grafikler */}
        <div style={{ display: 'grid', gridTemplateColumns: selectedUnit === 'Tüm Sistem' ? '1fr 1fr' : '1fr', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '1rem', fontWeight: 'bold' }}>Aylık Puan Gelişimi (Trend)</h3>
            <div style={{ height: '300px' }}>
              <Line data={lineChartData} options={chartOptions} />
            </div>
          </div>
          {selectedUnit === 'Tüm Sistem' && (
            <div className="card">
              <h3 style={{ fontSize: '16px', marginBottom: '1rem', fontWeight: 'bold' }}>Birimlerin Görev Karşılaştırması</h3>
              <div style={{ height: '300px' }}>
                <Bar data={barChartData} options={chartOptions} />
              </div>
            </div>
          )}
        </div>

        {/* Detay Tablosu */}
        <div className="card">
          <h3 style={{ fontSize: '16px', marginBottom: '1rem', fontWeight: 'bold' }}>Birim Bazlı Detay İstatistikleri</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '14px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px' }}>Birim Adı</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Planlanan Rutin</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Yapılan Rutin</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Ekstra Görev</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Aylık Hedef</th>
                  <th style={{ textAlign: 'center', padding: '12px' }}>Rutin Başarı Oranı</th>
                </tr>
              </thead>
              <tbody>
                {reportData.unitStats.map((u, idx) => {
                  const successRate = u.routinesPlanned > 0 ? Math.round((u.routinesCompleted / u.routinesPlanned) * 100) : 0;
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{u.unit}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>{u.routinesPlanned}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#3b82f6', fontWeight: 'bold' }}>{u.routinesCompleted}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#10b981', fontWeight: 'bold' }}>{u.extrasCompleted}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#f59e0b', fontWeight: 'bold' }}>{u.targetsCompleted}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold',
                          backgroundColor: successRate >= 80 ? 'rgba(16, 185, 129, 0.1)' : successRate >= 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: successRate >= 80 ? '#10b981' : successRate >= 50 ? '#f59e0b' : '#ef4444'
                        }}>
                          % {successRate}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
