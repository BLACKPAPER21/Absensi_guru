import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { API_BASE } from '../utils/api';

export default function SettingAdmin() {
  const [config, setConfig] = useState({
    lateThresholdTime: '07:30',
    checkOutThresholdTime: '16:00'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/attendance/config`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (response.ok && data.config) {
        setConfig({
          lateThresholdTime: data.config.lateThresholdTime,
          checkOutThresholdTime: data.config.checkOutThresholdTime
        });
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      setMessage({ text: 'Gagal memuat pengaturan', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateTimeFormat = (timeStr) => {
    if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) {
      return false;
    }
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Validate time formats
    if (!validateTimeFormat(config.lateThresholdTime)) {
      setMessage({ text: 'Format jam datang tidak valid. Gunakan HH:mm (contoh: 07:30)', type: 'error' });
      return;
    }

    if (!validateTimeFormat(config.checkOutThresholdTime)) {
      setMessage({ text: 'Format jam pulang tidak valid. Gunakan HH:mm (contoh: 16:00)', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/attendance/config`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lateThresholdTime: config.lateThresholdTime,
          checkOutThresholdTime: config.checkOutThresholdTime
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: 'Pengaturan berhasil disimpan!', type: 'success' });
        setConfig({
          lateThresholdTime: data.config.lateThresholdTime,
          checkOutThresholdTime: data.config.checkOutThresholdTime
        });
        // Auto clear success message after 3 seconds
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      } else {
        setMessage({ text: data.message || 'Gagal menyimpan pengaturan', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ text: 'Terjadi kesalahan', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout userRole="admin">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-headline-lg text-on-background mb-1">Pengaturan Sistem</h2>
          <p className="font-body-md text-on-surface-variant">Kelola konfigurasi absensi dan sistem akademik.</p>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">
              {message.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span className="font-label-md">{message.text}</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm p-8 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-4xl opacity-50 block mb-2">hourglass_empty</span>
          Memuat pengaturan...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Form */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-variant bg-surface-container-low">
              <h3 className="font-headline-md text-on-background flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">schedule</span>
                Pengaturan Absensi
              </h3>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-6">
              {/* Late Threshold Time Setting */}
              <div className="space-y-2">
                <label className="block font-label-md text-on-background">
                  🌅 Batas Waktu Datang (Jam Terlambat)
                </label>
                <p className="text-label-sm text-on-surface-variant mb-3">
                  Guru yang datang setelah jam ini akan ditandai sebagai "TERLAMBAT"
                </p>
                <div className="flex gap-3 items-center">
                  <input
                    type="time"
                    name="lateThresholdTime"
                    value={config.lateThresholdTime}
                    onChange={handleInputChange}
                    className="px-4 py-2 border border-outline-variant rounded-lg font-body-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary bg-surface-container-lowest"
                  />
                  <div className="flex-1">
                    <p className="text-label-md text-on-background">
                      Jam: <span className="font-semibold text-secondary">{config.lateThresholdTime}</span>
                    </p>
                    <p className="text-label-sm text-on-surface-variant">
                      {config.lateThresholdTime &&
                        `Guru datang sebelum ${config.lateThresholdTime} = HADIR`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Check-Out Threshold Time Setting */}
              <div className="space-y-2 pt-4 border-t border-surface-variant">
                <label className="block font-label-md text-on-background">
                  🌆 Batas Waktu Pulang (Indikator Pulang Awal)
                </label>
                <p className="text-label-sm text-on-surface-variant mb-3">
                  Guru yang pulang sebelum jam ini akan ditandai sebagai "PULANG AWAL" (informasi saja, tidak ada penalti)
                </p>
                <div className="flex gap-3 items-center">
                  <input
                    type="time"
                    name="checkOutThresholdTime"
                    value={config.checkOutThresholdTime}
                    onChange={handleInputChange}
                    className="px-4 py-2 border border-outline-variant rounded-lg font-body-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary bg-surface-container-lowest"
                  />
                  <div className="flex-1">
                    <p className="text-label-md text-on-background">
                      Jam: <span className="font-semibold text-secondary">{config.checkOutThresholdTime}</span>
                    </p>
                    <p className="text-label-sm text-on-surface-variant">
                      {config.checkOutThresholdTime &&
                        `Guru pulang sebelum ${config.checkOutThresholdTime} = PULANG AWAL`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Format Info */}
              <div className="mt-4 p-3 bg-secondary-container/30 rounded-lg border border-secondary-container/50">
                <p className="text-label-sm text-on-surface-variant flex items-start gap-2">
                  <span className="material-symbols-outlined text-sm mt-0.5">info</span>
                  <span>
                    <strong>Format:</strong> Gunakan format 24 jam (HH:mm).
                    Contoh: 07:30 untuk jam 7:30 pagi, 16:00 untuk jam 4:00 sore
                  </span>
                </p>
              </div>

              {/* Save Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-secondary text-on-secondary px-6 py-2.5 rounded-lg font-label-md hover:bg-secondary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">save</span>
                      Simpan Pengaturan
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={fetchConfig}
                  className="px-6 py-2.5 rounded-lg font-label-md border border-outline-variant text-on-background hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                </button>
              </div>
            </form>
          </div>

          {/* Info Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-secondary-fixed/20 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined">help</span>
                </div>
                <h4 className="font-label-md text-on-background">Bagaimana Cara Kerjanya?</h4>
              </div>
              <div className="space-y-3 text-label-sm text-on-surface-variant">
                <div>
                  <p className="font-semibold text-on-background mb-1">1. Check-in Datang</p>
                  <p>Sebelum threshold = HADIR, Setelah = TERLAMBAT</p>
                </div>
                <div>
                  <p className="font-semibold text-on-background mb-1">2. Check-out Pulang</p>
                  <p>Sebelum threshold = Pulang Awal (info), Sesudah = Normal</p>
                </div>
                <div>
                  <p className="font-semibold text-on-background mb-1">3. Perubahan Langsung</p>
                  <p>Perubahan berlaku untuk check-in/out berikutnya</p>
                </div>
              </div>
            </div>

            {/* Current Status Card */}
            <div className="bg-primary-fixed/10 rounded-xl border border-primary-fixed/30 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="material-symbols-outlined text-primary">schedule</span>
                <h4 className="font-label-md text-on-background">Status Saat Ini</h4>
              </div>
              <div className="space-y-3 text-label-sm">
                <div className="flex justify-between items-center pb-3 border-b border-primary-fixed/20">
                  <span className="text-on-surface-variant">🌅 Batas Datang:</span>
                  <span className="font-semibold text-on-background text-base">{config.lateThresholdTime}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-on-surface-variant">🌆 Batas Pulang:</span>
                  <span className="font-semibold text-on-background text-base">{config.checkOutThresholdTime}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
