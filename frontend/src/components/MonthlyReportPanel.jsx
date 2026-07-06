import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Award, TrendingUp, FileText, FileSpreadsheet, Calendar as CalendarIcon, Loader } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

const MonthlyReportPanel = ({ getUnitPresidentName, theme }) => {
  const { fetchWithAuth, setLoadingScreen } = useAuth();
  const { showNotification } = useNotification();

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMonthlyReport = async (monthStr) => {
    const [year, month] = monthStr.split('-');
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/reports/monthly-report?year=${year}&month=${parseInt(month, 10)}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      } else {
        showNotification('Aylık rapor yüklenemedi.', 'error');
      }
    } catch (e) {
      showNotification('Rapor çekilirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyReport(selectedMonth);
  }, [selectedMonth]);

  const handleExportPDF = () => {
    const element = document.getElementById('monthly-report-content');
    const opt = {
      margin: 0.5,
      filename: `Aylik_Rapor_${selectedMonth}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, windowWidth: 1200, width: 1200 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'landscape' }
    };
    html2pdf().set(opt).from(element).save();
  };

  const handleExportExcel = () => {
    if (!reportData || !reportData.unitStats) return;

    const wsData = [
      ['Birim Başkanlığı', 'Başkan Adı', 'Planlanan Rutin', 'Tamamlanan Rutin', 'Rutin Başarı Oranı (%)', 'Ekstra Tamamlanan', 'Ekstra Puan', 'Aylık Görev', 'Toplam Puan', 'Toplam Etkinlik']
    ];

    reportData.unitStats.forEach(p => {
      const presidentName = getUnitPresidentName ? getUnitPresidentName(p.unit) : '';
      wsData.push([
        p.unit,
        presidentName ? presidentName.trim().replace('(', '').replace(')', '') : '-',
        p.routinesPlanned,
        p.routinesCompleted,
        `${p.routineSuccessRate}%`,
        p.extrasCompleted,
        p.extraEffortScore,
        p.targetsCompleted,
        p.totalPoints,
        p.totalEventsCount
      ]);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, `Aylik_${selectedMonth}`);
    XLSX.writeFile(wb, `Aylik_Rapor_${selectedMonth}.xlsx`);
  };

  const prepareSuccessRateChartData = () => {
    if (!reportData || !reportData.unitStats) return { labels: [], datasets: [] };
    return {
      labels: reportData.unitStats.map(p => p.unit.replace(' Başkanı', '').replace(' Başkanlığı', '')),
      datasets: [{
        label: 'Rutin Başarı Oranı (%)',
        data: reportData.unitStats.map(p => p.routineSuccessRate),
        backgroundColor: reportData.unitStats.map(p =>
          p.routineSuccessRate >= 80 ? 'rgba(91, 128, 54, 0.8)' :
          p.routineSuccessRate >= 50 ? 'rgba(245, 158, 11, 0.8)' :
          'rgba(239, 68, 68, 0.8)'
        ),
        borderRadius: 6,
      }]
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Aylık Performans Raporları</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <CalendarIcon size={16} color="var(--text-secondary)" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)',
                fontFamily: 'inherit', fontSize: '14px', fontWeight: 'bold'
              }}
            />
          </div>
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

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', gap: '12px', color: 'var(--text-secondary)' }}>
          <Loader size={24} className="spin" />
          <span>Rapor yükleniyor...</span>
        </div>
      ) : !reportData ? null : (
        <div id="monthly-report-content" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Month Label */}
          <div style={{ textAlign: 'center', paddingBottom: '0.5rem' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent-primary)' }}>
              {reportData.monthLabel} Dönemi Performans Raporu
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* KPI Description */}
            <div className="card" style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} /> Performans Metrikleri Nasıl Hesaplanır?
              </h3>
              <ul style={{ paddingLeft: '20px', fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <li><strong>Rutin Başarı Oranı (%):</strong> Birimin seçili ay içinde yapması planlanan toplam rutin etkinliklerin, tamamlanan etkinliklere oranıdır.</li>
                <li><strong>Etkinlik Puanları:</strong> Rutin görevler her zaman <strong>10 Puan</strong>, Ekstra görevler <strong>20 Puan</strong> kazandırır.</li>
                <li><strong>Toplam Puan:</strong> Birimin seçili ay içinde kazandığı toplam puandır.</li>
              </ul>
            </div>

            {/* Bar Chart */}
            <div className="card" style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={20} /> {reportData.monthLabel} — Rutin Başarı Oranları (%)
              </h3>
              <div style={{ height: '180px', position: 'relative' }}>
                {reportData.unitStats.length > 0 ? (
                  <Bar
                    data={prepareSuccessRateChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        y: { min: 0, max: 100, ticks: { color: theme === 'dark' ? '#64748b' : '#94a3b8' }, grid: { color: theme === 'dark' ? '#1f2937' : '#e2e8f0' } },
                        x: { ticks: { color: theme === 'dark' ? '#64748b' : '#94a3b8', maxRotation: 45 }, grid: { display: false } }
                      }
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    Bu ay için veri bulunamadı.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Performance KPI Table */}
          <div className="card" style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '1.5rem' }}>Birim Performans Detayları — {reportData.monthLabel}</h3>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)' }}>
                    <th style={{ padding: '12px 10px', textAlign: 'left' }}>Birim Başkanlığı</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center' }}>Planlanan</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center' }}>Tamamlanan</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center' }}>Başarı Oranı</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center' }}>Ekstra</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center' }}>Aylık Görev</th>
                    <th style={{ padding: '12px 10px', textAlign: 'center' }}>Toplam Puan</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.unitStats.map((p, idx) => (
                    <tr key={p.unit} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}>
                      <td style={{ padding: '14px 10px', fontWeight: '700' }}>
                        {p.unit}
                        {getUnitPresidentName && <span style={{ fontWeight: '400', color: 'var(--text-secondary)', fontSize: '12px' }}>{getUnitPresidentName(p.unit)}</span>}
                      </td>
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
                      <td style={{ padding: '14px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>{p.extrasCompleted}</td>
                      <td style={{ padding: '14px 10px', textAlign: 'center', color: 'var(--text-secondary)' }}>{p.targetsCompleted}</td>
                      <td style={{ padding: '14px 10px', textAlign: 'center', fontWeight: '700', color: 'var(--accent-primary)' }}>{p.totalPoints} P</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyReportPanel;
