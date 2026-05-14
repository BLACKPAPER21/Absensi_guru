import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import CameraCapture from '../components/CameraCapture';
import { API_BASE } from '../utils/api';

export default function DashboardGuru() {
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraAction, setCameraAction] = useState(null); // 'check-in' or 'check-out'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Dynamic Data States
  const [stats, setStats] = useState({ hadir: 0, terlambat: 0, izin: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [scheduleStatus, setScheduleStatus] = useState('none');
  const [scheduleDayName, setScheduleDayName] = useState('');

  useEffect(() => {
    // Live clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Fetch data
    fetchDashboardData();

    return () => clearInterval(timer);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch Attendance History
      const attRes = await fetch(`${API_BASE}/api/attendance/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const attData = await attRes.json();
      
      // Fetch Leave Requests
      const leaveRes = await fetch(`${API_BASE}/api/leave/my-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const leaveData = await leaveRes.json();

      const scheduleRes = await fetch(`${API_BASE}/api/schedules/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const scheduleData = await scheduleRes.json();

      let hadirCount = 0;
      let terlambatCount = 0;
      let izinCount = 0;

      if (attRes.ok && attData.history) {
        attData.history.forEach(record => {
          if (record.status === 'HADIR') hadirCount++;
          if (record.status === 'TERLAMBAT') terlambatCount++;
        });
        
        // Populate recent activity (take top 3)
        setRecentActivity(attData.history.slice(0, 3));
        
        // If checked in today, set the status
        // Ensure we use local date string (YYYY-MM-DD) instead of UTC to avoid timezone mismatch issues
        const todayStr = new Date().toLocaleDateString('en-CA'); 
        const todayRecord = attData.history.find(r => {
          const recordDateLocal = new Date(r.date).toLocaleDateString('en-CA');
          return recordDateLocal === todayStr;
        });
        if (todayRecord) {
          if (todayRecord.checkOut) {
            setAttendanceStatus('Checked Out');
          } else {
            setAttendanceStatus('Checked In');
          }
        }
      }

      if (leaveRes.ok && leaveData.requests) {
        izinCount = leaveData.requests.filter(r => r.status === 'APPROVED').length;
      }

      if (scheduleRes.ok) {
        setTodaySchedule(scheduleData.schedule || null);
        setScheduleStatus(scheduleData.status || 'none');
        setScheduleDayName(scheduleData.dayName || '');
      }

      setStats({ hadir: hadirCount, terlambat: terlambatCount, izin: izinCount });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const openCameraFor = (action) => {
    setErrorMsg('');
    setCameraAction(action);
    setShowCamera(true);
  };

  const processAttendance = async (photoBlob) => {
    setShowCamera(false);
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const position = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation is not supported by your browser'));
        } else {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
        }
      });

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      const formData = new FormData();
      formData.append('lat', lat);
      formData.append('lng', lng);
      formData.append('photo', photoBlob, 'attendance.jpg');

      const token = localStorage.getItem('token');
      if (!token) throw new Error('You are not logged in');

      const endpoint = cameraAction === 'check-in' 
        ? `${API_BASE}/api/attendance/check-in` 
        : `${API_BASE}/api/attendance/check-out`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit attendance');
      }

      setAttendanceStatus(cameraAction === 'check-in' ? 'Checked In' : 'Checked Out');
      fetchDashboardData(); // Refresh the stats
      
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to get location or submit data');
    } finally {
      setIsSubmitting(false);
      setCameraAction(null);
    }
  };

  return (
    <DashboardLayout userRole="guru">
      {showCamera && (
        <CameraCapture 
          onCapture={processAttendance} 
          onCancel={() => setShowCamera(false)} 
        />
      )}

      {/* Page Header */}
      <div>
        <h2 className="font-headline-lg text-headline-lg text-on-background">Selamat Pagi, Guru</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">Berikut adalah ringkasan akademik Anda untuk hari ini.</p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-gutter mt-8">
        {/* Check In/Out Widget */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-[0_4px_6px_-1px_rgba(11,28,48,0.04),0_2px_4px_-2px_rgba(11,28,48,0.04)] border border-surface-variant p-stack-lg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-container rounded-full blur-3xl opacity-20 -mr-20 -mt-20 pointer-events-none"></div>
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-sm border border-error/20 z-10 relative">
              {errorMsg}
            </div>
          )}

          <div className="flex justify-between items-start z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                <span className="font-label-md text-label-md text-on-surface-variant">Status GPS: Aktif</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-background">Absensi Langsung</h3>
              {attendanceStatus && (
                <span className="inline-block px-3 py-1 bg-primary-fixed text-on-primary-fixed rounded-full text-sm mt-2">
                  Status: {attendanceStatus === 'Checked In' ? 'Sudah Check In' : 'Sudah Check Out'}
                </span>
              )}
            </div>
            <div className="text-right">
              <p className="font-display-lg text-display-lg text-on-background tracking-tighter">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant">
                {currentTime.toLocaleDateString('id-ID', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex gap-4 mt-8 z-10 relative">
            <button 
              onClick={() => openCameraFor('check-in')}
              disabled={isSubmitting || attendanceStatus === 'Checked In' || attendanceStatus === 'Checked Out'}
              className="flex-1 bg-secondary text-on-secondary py-3 px-6 rounded-lg font-label-md text-label-md flex justify-center items-center gap-2 hover:bg-on-secondary-fixed-variant transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined">login</span>
              {isSubmitting && cameraAction === 'check-in' ? 'Memproses...' : 'Check In'}
            </button>
            <button 
              onClick={() => openCameraFor('check-out')}
              disabled={isSubmitting || attendanceStatus === null || attendanceStatus === 'Checked Out'}
              className="flex-1 border border-outline text-on-surface py-3 px-6 rounded-lg font-label-md text-label-md flex justify-center items-center gap-2 hover:bg-surface-container transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined">logout</span>
              {isSubmitting && cameraAction === 'check-out' ? 'Memproses...' : 'Check Out'}
            </button>
          </div>
        </div>

        {/* Quick Info / Upcoming */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-lowest rounded-xl shadow-[0_4px_6px_-1px_rgba(11,28,48,0.04)] border border-surface-variant p-stack-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">Kelas Berikutnya</h3>
            <button className="text-secondary hover:text-on-secondary-container transition-colors"><span className="material-symbols-outlined">more_horiz</span></button>
          </div>
          {todaySchedule ? (
            <>
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${scheduleStatus === 'ongoing' ? 'bg-[#dcfce7] text-[#166534]' : scheduleStatus === 'upcoming' ? 'bg-[#dbeafe] text-[#1d4ed8]' : 'bg-[#fef3c7] text-[#b45309]'}`}>
                    {scheduleStatus === 'ongoing' ? 'Sedang Berlangsung' : scheduleStatus === 'upcoming' ? 'Jadwal Berikutnya' : 'Jadwal Hari Ini'}
                  </span>
                  <span className="text-xs text-on-surface-variant">{scheduleDayName}</span>
                </div>
                <h4 className="font-headline-md text-headline-md text-on-background">{todaySchedule.subject}</h4>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">meeting_room</span> {todaySchedule.room}
                </p>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">schedule</span> {todaySchedule.startTime} - {todaySchedule.endTime} WIB
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-surface-variant">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">Siswa Diharapkan</span>
                  <span className="font-label-sm text-label-sm text-on-background font-bold">{todaySchedule.expectedStudents || 0}</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full mt-2 overflow-hidden">
                  <div className="bg-secondary h-full rounded-full" style={{ width: `${Math.min(todaySchedule.expectedStudents || 0, 30) / 30 * 100}%` }}></div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center text-center py-6">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">event_busy</span>
              <h4 className="font-headline-md text-headline-md text-on-background">
                {scheduleStatus === 'done' ? 'Semua jadwal hari ini selesai' : 'Belum ada jadwal hari ini'}
              </h4>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                {scheduleStatus === 'done'
                  ? 'Admin sudah mengatur jadwal, tetapi tidak ada kelas yang tersisa untuk saat ini.'
                  : (scheduleDayName ? `Hari ${scheduleDayName} belum diatur oleh admin.` : 'Admin belum mengatur jadwal untuk Anda.')}
              </p>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_6px_-1px_rgba(11,28,48,0.04)] border border-surface-variant p-stack-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Total Hadir</p>
              <p className="font-headline-lg text-headline-lg text-on-background">{stats.hadir} <span className="font-body-md text-body-md text-on-surface-variant ml-1">hari</span></p>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_6px_-1px_rgba(11,28,48,0.04)] border border-surface-variant p-stack-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>timer</span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Terlambat</p>
              <p className="font-headline-lg text-headline-lg text-on-background">{stats.terlambat} <span className="font-body-md text-body-md text-on-surface-variant ml-1">kali</span></p>
            </div>
          </div>
          <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_6px_-1px_rgba(11,28,48,0.04)] border border-surface-variant p-stack-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>edit_document</span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1">Izin / Cuti</p>
              <p className="font-headline-lg text-headline-lg text-on-background">{stats.izin} <span className="font-body-md text-body-md text-on-surface-variant ml-1">disetujui</span></p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-span-12 lg:col-span-12 bg-surface-container-lowest rounded-xl shadow-[0_4px_6px_-1px_rgba(11,28,48,0.04)] border border-surface-variant p-0 overflow-hidden flex flex-col">
          <div className="p-stack-lg border-b border-surface-variant flex justify-between items-center">
            <h3 className="font-headline-md text-headline-md text-on-background">Aktivitas Terkini</h3>
            <button onClick={fetchDashboardData} className="font-label-md text-label-md text-secondary hover:text-on-secondary-container transition-colors">Segarkan</button>
          </div>
          <div className="divide-y divide-surface-variant">
            {recentActivity.length === 0 ? (
              <div className="p-stack-lg text-on-surface-variant text-sm">Belum ada aktivitas.</div>
            ) : (
              recentActivity.map(record => (
                <div key={record.id} className="p-stack-lg flex items-start gap-4 hover:bg-surface-container-lowest transition-colors">
                  <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center mt-1 shrink-0">
                    <span className="material-symbols-outlined text-secondary text-sm">
                      {record.status === 'HADIR' ? 'how_to_reg' : 'alarm'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-body-md text-body-md text-on-background font-medium">
                      Absensi {record.status === 'HADIR' ? 'Tepat Waktu' : 'Terlambat'}
                    </p>
                    <p className="font-body-md text-body-md text-on-surface-variant text-sm mt-0.5">
                      Check-in pukul {new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}.
                    </p>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    {new Date(record.date).toLocaleDateString('id-ID')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
