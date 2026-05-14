import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { API_BASE } from '../utils/api';

export default function Laporan() {
  const [month, setMonth] = useState('2026-05');
  const [isLoading, setIsLoading] = useState(false);
  const [recentReports, setRecentReports] = useState([]);
  const [showArchive, setShowArchive] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(true);

  useEffect(() => {
    fetchRecentReports();
  }, []);

  const fetchRecentReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/reports/recent`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok && data.reports) {
        setRecentReports(data.reports);
      }
    } catch (error) {
      console.error('Error fetching recent reports:', error);
    } finally {
      setArchiveLoading(false);
    }
  };

  const handleDownloadReport = async (reportMonth, format) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = format === 'pdf' 
        ? `${API_BASE}/api/reports/monthly/pdf?month=${reportMonth}`
        : `${API_BASE}/api/reports/monthly?month=${reportMonth}`;

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal generate laporan');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'pdf' ? `Rekap_Absensi_${reportMonth}.pdf` : `Rekap_Absensi_${reportMonth}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      a.remove();
      
    } catch (error) {
      console.error('Download error:', error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (format) => {
    await handleDownloadReport(month, format);
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-headline-lg text-on-background mb-1">Cetak Laporan</h2>
          <p className="font-body-md text-on-surface-variant">Generate dan unduh laporan absensi bulanan guru.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm p-6 flex flex-col gap-4">
          <h3 className="font-headline-md text-lg text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">date_range</span> 
            Pilih Periode
          </h3>
          <div className="flex flex-col gap-2">
            <label className="font-label-md text-on-surface-variant">Bulan Laporan</label>
            <input 
              type="month" 
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-4 py-3 bg-surface-container border border-outline-variant rounded-lg text-on-background focus:outline-none focus:border-secondary" 
            />
          </div>
          
          <div className="flex gap-3 mt-4">
            <button 
              onClick={() => handleGenerate('pdf')}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-secondary text-white rounded-lg font-label-md hover:bg-secondary/90 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined">{isLoading ? 'hourglass_empty' : 'picture_as_pdf'}</span> 
              {isLoading ? 'Memproses...' : 'Download PDF'}
            </button>
            <button 
              onClick={() => handleGenerate('excel')}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-[#166534] text-white rounded-lg font-label-md hover:bg-[#166534]/90 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined">{isLoading ? 'hourglass_empty' : 'table'}</span> 
              {isLoading ? 'Memproses...' : 'Export Excel'}
            </button>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl border border-surface-variant p-6 flex flex-col justify-center items-center text-center">
          <span className="material-symbols-outlined text-[64px] text-outline-variant mb-4">folder_open</span>
          <h3 className="font-headline-md text-on-background mb-2">Arsip Laporan</h3>
          <p className="font-body-md text-on-surface-variant mb-6">
            {recentReports.length > 1 
              ? `Tersedia ${recentReports.length} bulan laporan` 
              : 'Tidak ada arsip laporan'}
          </p>
          {recentReports.length > 0 && (
            <button 
              onClick={() => setShowArchive(!showArchive)}
              className="px-4 py-2 border border-secondary text-secondary rounded-lg font-label-md hover:bg-secondary-container transition-colors"
            >
              {showArchive ? 'Sembunyikan Arsip' : 'Lihat Arsip'}
            </button>
          )}
        </div>
      </div>

      {/* Archive Section */}
      {showArchive && (
        <div className="mt-6 bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="material-symbols-outlined text-secondary">archive</span>
            <h3 className="font-headline-md text-on-background">Daftar Arsip Laporan</h3>
          </div>

          {archiveLoading ? (
            <div className="text-center py-8 text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl opacity-50 mb-2">hourglass_empty</span>
              <p>Memuat arsip...</p>
            </div>
          ) : recentReports.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant">
              <p>Tidak ada laporan tersedia</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentReports.map((report) => (
                <div 
                  key={report.month}
                  className="bg-surface-container-lowest border border-surface-variant rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-label-md text-on-background">{report.monthName}</p>
                      <p className="text-label-sm text-on-surface-variant">{report.month}</p>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-lg">description</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadReport(report.month, 'pdf')}
                      disabled={isLoading}
                      className="flex-1 px-3 py-2 text-sm bg-secondary/10 text-secondary rounded hover:bg-secondary/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                      title="Download sebagai PDF"
                    >
                      <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                      PDF
                    </button>
                    <button
                      onClick={() => handleDownloadReport(report.month, 'excel')}
                      disabled={isLoading}
                      className="flex-1 px-3 py-2 text-sm bg-[#166534]/10 text-[#166534] rounded hover:bg-[#166534]/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                      title="Download sebagai Excel"
                    >
                      <span className="material-symbols-outlined text-sm">table_chart</span>
                      Excel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
