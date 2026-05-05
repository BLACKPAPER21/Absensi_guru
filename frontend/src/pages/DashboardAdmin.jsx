import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

export default function DashboardAdmin() {
  const [todayRecords, setTodayRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [totalTeachers, setTotalTeachers] = useState(0);

  useEffect(() => {
    fetchTodayAttendance();
    fetchTotalTeachers();
  }, []);

  const fetchTotalTeachers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/users/teachers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.teachers) {
        setTotalTeachers(data.teachers.length);
      }
    } catch (err) {
      console.error('Failed to fetch total teachers:', err);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/attendance/today', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch attendance');
      }

      setTodayRecords(data.records || []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout userRole="admin">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-headline-lg text-on-background mb-1">Absensi Langsung Hari Ini</h2>
          <p className="font-body-md text-on-surface-variant">Ikhtisar waktu-nyata dari semua check-in guru.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchTodayAttendance} className="px-4 py-2 bg-surface-container border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-variant transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">refresh</span> Segarkan
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg bg-error-container text-on-error-container text-label-md">
          {errorMsg}
        </div>
      )}

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-[24px] mb-6">
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-variant shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">school</span>
            </div>
          </div>
          <div>
            <p className="font-label-sm text-on-surface-variant uppercase tracking-wide">Total Guru</p>
            <h3 className="font-display-lg text-on-background leading-tight">{totalTeachers}</h3>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-variant shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-secondary-fixed/20 flex items-center justify-center text-on-secondary-container">
              <span className="material-symbols-outlined">group</span>
            </div>
          </div>
          <div>
            <p className="font-label-sm text-on-surface-variant uppercase tracking-wide">Total Hadir</p>
            <h3 className="font-display-lg text-on-background leading-tight">{todayRecords.length}</h3>
          </div>
        </div>
        <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-variant shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center text-on-error-container">
              <span className="material-symbols-outlined">schedule</span>
            </div>
          </div>
          <div>
            <p className="font-label-sm text-on-surface-variant uppercase tracking-wide">Terlambat</p>
            <h3 className="font-display-lg text-on-background leading-tight">
              {todayRecords.filter(r => r.status === 'TERLAMBAT').length}
            </h3>
          </div>
        </div>
      </div>

      {/* Action List: Real-time Check-ins */}
      <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-surface-variant flex justify-between items-center bg-surface-container-lowest/50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">list_alt</span>
            <h3 className="font-headline-md text-on-background text-lg">Check-in Langsung</h3>
          </div>
        </div>
        <div className="flex-1 overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-on-surface-variant">Memuat data absensi...</div>
          ) : todayRecords.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">Belum ada check-in hari ini.</div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold border-b border-surface-variant">Guru</th>
                  <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold border-b border-surface-variant">Foto Hadir</th>
                  <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold border-b border-surface-variant">Waktu Hadir</th>
                  <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold border-b border-surface-variant">Status</th>
                  <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold border-b border-surface-variant text-right">Lokasi GPS</th>
                </tr>
              </thead>
              <tbody>
                {todayRecords.map((record, idx) => (
                  <tr key={record.id} className={`hover:bg-surface-container-lowest transition-colors border-b border-surface-variant/50 ${idx % 2 !== 0 ? 'bg-slate-50/50' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-label-md text-on-background font-semibold">{record.user.name}</p>
                          <p className="font-label-sm text-on-surface-variant">{record.user.nip} • {record.user.dept || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {record.photoIn ? (
                        <a href={`http://localhost:5000${record.photoIn}`} target="_blank" rel="noreferrer" className="block w-12 h-12 rounded-lg overflow-hidden border border-outline-variant hover:opacity-80 transition-opacity">
                          <img src={`http://localhost:5000${record.photoIn}`} alt="Selfie" className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant border border-outline-variant">
                          <span className="material-symbols-outlined text-sm">no_photography</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-body-md text-on-surface-variant">
                      {new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        record.status === 'HADIR' ? 'bg-primary-fixed text-on-primary-fixed' : 
                        record.status === 'TERLAMBAT' ? 'bg-error-container text-on-error-container' : 'bg-surface-variant text-on-surface'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {record.lat && record.lng ? (
                        <a 
                          href={`https://www.google.com/maps?q=${record.lat},${record.lng}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3 py-1.5 border border-outline rounded-full font-label-sm text-secondary hover:bg-secondary-container transition-colors inline-flex items-center gap-1"
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
