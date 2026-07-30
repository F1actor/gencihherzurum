import React from 'react';
import { Award, TrendingUp, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

const PerformancePanel = ({ 
  performance, 
  theme, 
  getUnitPresidentName, 
  prepareSuccessRateChartData, 
  handleExportCSV 
}) => {

  const handleExportPDF = () => {
    const element = document.getElementById('performance-report-content');
    const opt = {
      margin: 0.5,
      filename: 'Performans_Raporu.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1200, width: 1200 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleExportExcel = () => {
    if (!performance || performance.length === 0) return;
    
    const wsData = [
      ['Birim Başkanlığı', 'Planlanan Rutin', 'Tamamlanan Rutin', 'Rutin Başarı Oranı (%)', 'Ekstra Efor Skoru', 'Toplam Etkinlik']
    ];
    
    performance.forEach(p => {
      wsData.push([
        `${p.unit} ${getUnitPresidentName(p.unit) ? `(${getUnitPresidentName(p.unit).trim()})` : ''}`,
        p.routinesPlanned,
        p.routinesCompleted,
        p.routineSuccessRate,
        p.extraEffortScore,
        p.totalEvents
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Performans_Raporu");
    
    XLSX.writeFile(wb, 'Performans_Raporu.xlsx');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Performans ve Liderlik Raporları</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleExportPDF} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', borderColor: '#ef4444' }}>
            <FileText size={18} /> PDF İndir
          </button>
          <button onClick={handleExportExcel} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', borderColor: '#10b981' }}>
            <FileSpreadsheet size={18} /> Excel İndir
          </button>
        </div>
      </div>

      <div id="performance-report-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* KPI Description */}
          <div className="card" style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} /> Performans Metrikleri Nasıl Hesaplanır?
            </h3>
            <ul style={{ paddingLeft: '20px', fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li><strong>Rutin Başarı Oranı (%):</strong> Birimin son 30 gün içinde yapması planlanan toplam rutin derslerin, tamamlanan derslere oranıdır.</li>
              <li><strong>Etkinlik Puanları:</strong> Rutin görevler her zaman <strong>10 Puan</strong>, Ekstra görevler <strong>20 Puan</strong>, Aylık Hedef etkinlikleri ise <strong>atanan puan</strong> kadar kazandırır.</li>
            </ul>
          </div>

          {/* KPI Graph Chart */}
          <div className="card" style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} /> Birimlerin Rutin Görev Başarı Oranları (%)
            </h3>
            <div style={{ height: '180px', position: 'relative' }}>
              {performance.length > 0 ? (
                <Bar 
                  data={prepareSuccessRateChartData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: { min: 0, max: 100, ticks: { color: theme === 'dark' ? '#64748b' : '#94a3b8' }, grid: { color: theme === 'dark' ? '#1f2937' : '#e2e8f0' } },
                      x: { ticks: { color: theme === 'dark' ? '#64748b' : '#94a3b8' }, grid: { display: false } }
                    }
                  }}
                />
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                  Yükleniyor...
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance KPI Table */}
        <div className="card" style={{ textAlign: 'left' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '1.5rem' }}>Birim Performans Detayları (Son 30 Gün)</h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '12px 10px', textAlign: 'left' }}>Birim Başkanlığı</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>Planlanan Rutin</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>Tamamlanan Rutin</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>Rutin Başarı Oranı</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>Ekstra Efor Skoru</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center' }}>Toplam Etkinlik</th>
                </tr>
              </thead>
              <tbody>
                {performance.map(p => (
                  <tr key={p.unit} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '14px 10px', fontWeight: '700' }}>{p.unit}{getUnitPresidentName(p.unit)}</td>
                    <td style={{ padding: '14px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>{p.routinesPlanned}</td>
                    <td style={{ padding: '14px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>{p.routinesCompleted}</td>
                    <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: 'var(--radius-full)', fontWeight: 'bold', fontSize: '12px',
                        backgroundColor: p.routineSuccessRate >= 80 ? 'rgba(91, 128, 54, 0.1)' : p.routineSuccessRate >= 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: p.routineSuccessRate >= 80 ? 'var(--status-success)' : p.routineSuccessRate >= 50 ? 'var(--status-warning)' : 'var(--status-danger)',
                      }}>
                        %{p.routineSuccessRate}
                      </span>
                    </td>
                    <td style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                      +{p.extraEffortScore} P
                    </td>
                    <td style={{ padding: '14px 10px', textAlign: 'center', fontWeight: '600' }}>{p.totalEvents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformancePanel;
