import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LabelList } from 'recharts';

const mockTrendData = [
  { name: '1 Mei', hadir: 45, terlambat: 5 },
  { name: '2 Mei', hadir: 42, terlambat: 8 },
  { name: '3 Mei', hadir: 48, terlambat: 2 },
  { name: '4 Mei', hadir: 46, terlambat: 4 },
  { name: '5 Mei', hadir: 49, terlambat: 1 },
];

const mockDeptData = [
  { name: 'Matematika', kedisiplinan: 98 },
  { name: 'IPA', kedisiplinan: 95 },
  { name: 'Bahasa', kedisiplinan: 92 },
  { name: 'Olahraga', kedisiplinan: 88 },
];

export default function DashboardKepsek() {
  const [stats, setStats] = useState({
    totalRecords: 0,
    hadir: 0,
    terlambat: 0,
    onTimePercentage: 100,
    totalTeachers: 0
  });
  const [todayRecords, setTodayRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch Stats
      const statsRes = await fetch('http://localhost:5000/api/attendance/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const statsData = await statsRes.json();
      
      // Fetch Today's list
      const todayRes = await fetch('http://localhost:5000/api/attendance/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const todayData = await todayRes.json();

      if (!statsRes.ok || !todayRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      setStats(statsData.stats);
      setTodayRecords(todayData.records || []);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout userRole="kepsek">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-headline-lg text-on-background mb-1">Executive Dashboard</h2>
          <p className="font-body-md text-on-surface-variant">Monthly performance overview and today's live attendance.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="px-4 py-2 bg-surface-container border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-variant transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">refresh</span> Refresh
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-lg bg-error-container text-on-error-container text-label-md">
          {errorMsg}
        </div>
      )}

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-[24px] mb-6">
        <div className="bg-secondary p-5 rounded-xl border border-secondary shadow-sm flex flex-col justify-between text-on-secondary">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-white">school</span>
            </div>
          </div>
          <div>
            <p className="font-label-sm uppercase tracking-wide opacity-80">Total Guru</p>
            <h3 className="font-display-lg leading-tight">{stats.totalTeachers}</h3>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-variant shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-secondary-fixed/20 flex items-center justify-center text-on-secondary-container">
              <span className="material-symbols-outlined">event_available</span>
            </div>
          </div>
          <div>
            <p className="font-label-sm text-on-surface-variant uppercase tracking-wide">Bulan Ini: Hadir</p>
            <h3 className="font-display-lg text-on-background leading-tight">{stats.hadir}</h3>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-variant shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-error-container flex items-center justify-center text-on-error-container">
              <span className="material-symbols-outlined">schedule</span>
            </div>
          </div>
          <div>
            <p className="font-label-sm text-on-surface-variant uppercase tracking-wide">Bulan Ini: Terlambat</p>
            <h3 className="font-display-lg text-on-background leading-tight">{stats.terlambat}</h3>
          </div>
        </div>

        <div className="bg-surface-container-lowest p-5 rounded-xl border border-surface-variant shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-full bg-[#dcfce7] flex items-center justify-center text-[#166534]">
              <span className="material-symbols-outlined">monitoring</span>
            </div>
          </div>
          <div>
            <p className="font-label-sm text-on-surface-variant uppercase tracking-wide">Tingkat Kedisiplinan</p>
            <div className="flex items-end gap-2">
              <h3 className="font-display-lg text-on-background leading-tight">{stats.onTimePercentage}%</h3>
              {stats.onTimePercentage >= 90 ? (
                <span className="material-symbols-outlined text-sm text-[#166534] mb-1">trending_up</span>
              ) : (
                <span className="material-symbols-outlined text-sm text-error mb-1">trending_down</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Charts */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Main Trend Chart */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-surface-variant bg-surface-container-lowest/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">insights</span>
                <h3 className="font-headline-md text-on-background text-lg">Tren Kehadiran (30 Hari Terakhir)</h3>
              </div>
            </div>
            <div className="p-6 h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#166534" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#166534" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTelat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#991b1b" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#991b1b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="hadir" stroke="#166534" fillOpacity={1} fill="url(#colorHadir)" name="Tepat Waktu" />
                  <Area type="monotone" dataKey="terlambat" stroke="#991b1b" fillOpacity={1} fill="url(#colorTelat)" name="Terlambat" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Department Performance */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-surface-variant bg-surface-container-lowest/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">donut_large</span>
                <h3 className="font-headline-md text-on-background text-lg">Performa Berdasarkan Departemen</h3>
              </div>
            </div>
            <div className="p-6 h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockDeptData} margin={{ top: 0, right: 30, left: 0, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="kedisiplinan" fill="#006a61" radius={[0, 4, 4, 0]} name="Tingkat Kedisiplinan (%)">
                    <LabelList dataKey="kedisiplinan" position="right" formatter={(val) => `${val}%`} style={{ fill: '#475569', fontSize: 12, fontWeight: 500 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* System Alerts / Notes */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm flex flex-col">
            <div className="p-5 border-b border-surface-variant bg-surface-container-lowest/50">
              <h3 className="font-headline-md text-on-background text-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">campaign</span> Ringkasan & Tindakan
              </h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-secondary-container text-on-secondary-container p-4 rounded-lg flex items-start gap-3">
                <span className="material-symbols-outlined">info</span>
                <div>
                  <h4 className="font-label-md font-bold">Laporan Akhir Bulan</h4>
                  <p className="font-body-sm mt-1 opacity-90">Laporan absensi bulan ini siap untuk direview dan dicetak.</p>
                  <button className="mt-3 w-full bg-secondary text-white py-2 rounded font-label-sm text-xs hover:bg-secondary/90 transition flex justify-center items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">download</span> UNDUH PDF
                  </button>
                </div>
              </div>
              
              <div className={`border p-4 rounded-lg flex items-start gap-3 ${stats.onTimePercentage >= 95 ? 'bg-[#f0fdf4] border-[#bbf7d0]' : 'bg-[#fff1f2] border-[#fecdd3]'}`}>
                <span className={`material-symbols-outlined ${stats.onTimePercentage >= 95 ? 'text-[#166534]' : 'text-[#e11d48]'}`}>rule</span>
                <div>
                  <h4 className={`font-label-md font-bold ${stats.onTimePercentage >= 95 ? 'text-[#166534]' : 'text-[#e11d48]'}`}>Target Disiplin: 95%</h4>
                  <p className="font-body-sm text-on-surface-variant mt-1">Saat ini di {stats.onTimePercentage}%. {stats.onTimePercentage >= 95 ? 'Target tercapai! Pertahankan.' : 'Masih di bawah target, mohon berikan himbauan.'}</p>
                </div>
              </div>

              <div className="border border-outline-variant p-4 rounded-lg flex items-start gap-3 bg-surface-container-low">
                <span className="material-symbols-outlined text-amber-600">warning</span>
                <div>
                  <h4 className="font-label-md font-bold text-on-surface">Guru Sering Terlambat</h4>
                  <p className="font-body-sm text-on-surface-variant mt-1 mb-2">3 Guru memiliki tingkat keterlambatan di atas 20% bulan ini.</p>
                  <a href="#" className="text-secondary font-label-sm text-xs hover:underline flex items-center gap-1">Lihat Detail <span className="material-symbols-outlined text-[14px]">arrow_forward</span></a>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Mini */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm flex flex-col p-5">
            <h3 className="font-headline-md text-on-background text-base mb-4 font-semibold">Cuti & Izin Aktif</h3>
            <div className="flex justify-between items-center py-2 border-b border-outline-variant">
              <span className="font-body-md text-on-surface-variant">Sakit</span>
              <span className="font-label-md bg-surface-container px-3 py-1 rounded-full">2 Guru</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-outline-variant">
              <span className="font-body-md text-on-surface-variant">Dinas Luar</span>
              <span className="font-label-md bg-surface-container px-3 py-1 rounded-full">1 Guru</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="font-body-md text-on-surface-variant">Cuti Tahunan</span>
              <span className="font-label-md bg-surface-container px-3 py-1 rounded-full">0 Guru</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
