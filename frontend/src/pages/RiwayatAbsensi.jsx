import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { API_BASE } from '../utils/api';

export default function RiwayatAbsensi() {
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/attendance/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setRecords(data.history || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--:--';
    return new Date(isoString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
  };

  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout userRole="guru">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-background tracking-tight">Riwayat Absensi</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Tinjau log check-in dan check-out terbaru Anda.</p>
        </div>
      </div>

      {/* Bento Style Data Table Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(11,28,48,0.04)] border border-surface-variant flex flex-col overflow-hidden">
        {/* Card Controls Bar */}
        <div className="p-6 border-b border-surface-variant flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low/50">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-headline-sm text-headline-sm text-on-surface mr-4">Daftar Kehadiran</h3>
            <button onClick={fetchHistory} className="px-4 py-2 bg-white border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2 shadow-sm">
              <span className="material-symbols-outlined text-[18px] text-secondary">refresh</span> Segarkan Data
            </button>
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto w-full">
          {isLoading ? (
            <div className="p-12 text-center text-on-surface-variant flex flex-col items-center gap-3">
              <span className="material-symbols-outlined animate-spin text-secondary text-3xl">hourglass_empty</span>
              <p>Memuat riwayat...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-on-surface-variant flex flex-col items-center gap-3">
              <span className="material-symbols-outlined text-outline text-4xl mb-2">event_busy</span>
              <p>Belum ada riwayat absensi.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest border-b border-surface-variant">
                  <th className="font-label-sm text-label-sm text-on-surface-variant px-6 py-5 whitespace-nowrap uppercase tracking-wider">Tanggal</th>
                  <th className="font-label-sm text-label-sm text-on-surface-variant px-6 py-5 whitespace-nowrap uppercase tracking-wider text-center">Waktu Hadir</th>
                  <th className="font-label-sm text-label-sm text-on-surface-variant px-6 py-5 whitespace-nowrap uppercase tracking-wider text-center">Waktu Pulang</th>
                  <th className="font-label-sm text-label-sm text-on-surface-variant px-6 py-5 whitespace-nowrap uppercase tracking-wider text-center">Bukti Foto</th>
                  <th className="font-label-sm text-label-sm text-on-surface-variant px-6 py-5 whitespace-nowrap uppercase tracking-wider text-center">Status</th>
                  <th className="font-label-sm text-label-sm text-on-surface-variant px-6 py-5 whitespace-nowrap uppercase tracking-wider text-right">Lokasi GPS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant bg-surface-container-lowest">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-surface-container-low/30 transition-colors group">
                    <td className="font-body-md text-body-md text-on-background px-6 py-5 whitespace-nowrap font-medium">
                      {formatDate(record.date)}
                    </td>
                    <td className="font-body-md text-body-md text-on-background px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-secondary">login</span>
                        {formatTime(record.checkIn)}
                      </div>
                    </td>
                    <td className="font-body-md text-body-md text-on-background px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-outline">logout</span>
                        {formatTime(record.checkOut)}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap flex justify-center gap-3 items-center">
                      {record.photoIn ? (
                        <a href={`${API_BASE}${record.photoIn}`} target="_blank" rel="noreferrer" className="relative block group/img">
                          <img src={`${API_BASE}${record.photoIn}`} alt="Check In" className="w-12 h-12 rounded-lg object-cover border border-outline-variant group-hover/img:border-secondary transition-all" />
                          <div className="absolute -bottom-2 -right-2 bg-secondary text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">IN</div>
                        </a>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-surface-container border border-dashed border-outline-variant flex items-center justify-center text-on-surface-variant text-[10px] font-medium text-center leading-tight">Belum<br/>Hadir</div>
                      )}
                      
                      {record.photoOut ? (
                        <a href={`${API_BASE}${record.photoOut}`} target="_blank" rel="noreferrer" className="relative block group/img">
                          <img src={`${API_BASE}${record.photoOut}`} alt="Check Out" className="w-12 h-12 rounded-lg object-cover border border-outline-variant group-hover/img:border-secondary transition-all" />
                          <div className="absolute -bottom-2 -right-2 bg-outline text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm">OUT</div>
                        </a>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-surface-container border border-dashed border-outline-variant flex items-center justify-center text-on-surface-variant text-[10px] font-medium text-center leading-tight">Belum<br/>Pulang</div>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-center">
                      {record.status === 'HADIR' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-[10px] uppercase font-bold tracking-wider border bg-[#dcfce7] text-[#166534] border-[#bbf7d0]">
                          HADIR
                        </span>
                      )}
                      {record.status === 'TERLAMBAT' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-[10px] uppercase font-bold tracking-wider border bg-[#fee2e2] text-[#991b1b] border-[#fecaca]">
                          TERLAMBAT
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      {record.lat && record.lng ? (
                        <a 
                          href={`https://www.google.com/maps?q=${record.lat},${record.lng}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-end gap-1 text-secondary text-sm hover:underline"
                        >
                          <span className="material-symbols-outlined text-[16px]">pin_drop</span> Peta
                        </a>
                      ) : (
                        <span className="text-on-surface-variant text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
