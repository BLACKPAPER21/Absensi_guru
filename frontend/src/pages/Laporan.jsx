import { useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { API_BASE } from '../utils/api';

export default function Laporan() {
  const [month, setMonth] = useState('2026-05');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (format) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = format === 'pdf' 
        ? `${API_BASE}/api/reports/monthly/pdf?month=${month}`
        : `${API_BASE}/api/reports/monthly?month=${month}`;

      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal generate laporan');
      }

      // Convert the response to a Blob (Binary Large Object)
      const blob = await response.blob();
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary anchor element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'pdf' ? `Rekap_Absensi_${month}.pdf` : `Rekap_Absensi_${month}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      a.remove();
      
    } catch (error) {
      console.error('Download error:', error);
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
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
          <h3 className="font-headline-md text-on-background mb-2">Arsip Laporan Terakhir</h3>
          <p className="font-body-md text-on-surface-variant mb-6">Laporan bulan sebelumnya (April 2026) telah diarsipkan.</p>
          <button className="px-4 py-2 border border-secondary text-secondary rounded-lg font-label-md hover:bg-secondary-container transition-colors">
            Lihat Arsip April
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
