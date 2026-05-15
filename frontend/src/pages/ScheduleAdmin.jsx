import { useEffect, useMemo, useState } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { API_BASE } from '../utils/api';

const dayOptions = [
  { value: 1, label: 'Senin' },
  { value: 2, label: 'Selasa' },
  { value: 3, label: 'Rabu' },
  { value: 4, label: 'Kamis' },
  { value: 5, label: 'Jumat' },
  { value: 6, label: 'Sabtu' },
  { value: 0, label: 'Minggu' },
];

const initialForm = {
  userId: '',
  dayOfWeek: 1,
  subject: '',
  room: '',
  startTime: '09:00',
  endTime: '10:30',
  active: true,
};

const dayNameToNumber = {
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  sabtu: 6,
  minggu: 0,
};

const isValidTime = (timeStr) => {
  if (!/^\d{2}:\d{2}$/.test(timeStr)) return false;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
};

export default function ScheduleAdmin() {
  const [teachers, setTeachers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [bulkUserId, setBulkUserId] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [bulkActive, setBulkActive] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const dayLabelByValue = useMemo(() => {
    return dayOptions.reduce((acc, item) => {
      acc[item.value] = item.label;
      return acc;
    }, {});
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const [teacherRes, scheduleRes] = await Promise.all([
        fetch(`${API_BASE}/api/users/teachers`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/schedules`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const teacherData = await teacherRes.json();
      const scheduleData = await scheduleRes.json();

      if (teacherRes.ok) {
        setTeachers(teacherData.teachers || []);
      }

      if (scheduleRes.ok) {
        setSchedules(scheduleData.schedules || []);
      }
    } catch (error) {
      console.error('Error loading schedules:', error);
      setMessage({ text: 'Gagal memuat data jadwal', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEdit = (schedule) => {
    setEditingId(schedule.id);
    setForm({
      userId: schedule.userId,
      dayOfWeek: schedule.dayOfWeek,
      subject: schedule.subject,
      room: schedule.room,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      active: schedule.active
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm('Hapus jadwal ini?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal menghapus jadwal');
      }

      setMessage({ text: 'Jadwal berhasil dihapus', type: 'success' });
      fetchData();
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.userId) {
      setMessage({ text: 'Pilih guru terlebih dahulu', type: 'error' });
      return;
    }

    if (!form.subject || !form.room) {
      setMessage({ text: 'Mata pelajaran dan ruangan wajib diisi', type: 'error' });
      return;
    }

    if (!isValidTime(form.startTime) || !isValidTime(form.endTime)) {
      setMessage({ text: 'Format jam harus HH:mm', type: 'error' });
      return;
    }

    if (form.endTime <= form.startTime) {
      setMessage({ text: 'Jam selesai harus lebih besar dari jam mulai', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...form,
        dayOfWeek: Number(form.dayOfWeek)
      };

      const response = await fetch(
        editingId ? `${API_BASE}/api/schedules/${editingId}` : `${API_BASE}/api/schedules`,
        {
          method: editingId ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal menyimpan jadwal');
      }

      setMessage({ text: editingId ? 'Jadwal berhasil diperbarui' : 'Jadwal berhasil dibuat', type: 'success' });
      resetForm();
      fetchData();
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();

    if (!bulkUserId) {
      setMessage({ text: 'Pilih guru untuk input cepat', type: 'error' });
      return;
    }

    const lines = bulkInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setMessage({ text: 'Isi minimal satu baris jadwal', type: 'error' });
      return;
    }

    try {
      const entries = lines.map((line, idx) => {
        const parts = line.split('|').map((v) => v.trim());
        if (parts.length !== 5) {
          throw new Error(`Format baris ${idx + 1} salah. Gunakan: Hari|Mapel|Ruangan|Mulai|Selesai`);
        }

        const [dayName, subject, room, startTime, endTime] = parts;
        const dayOfWeek = dayNameToNumber[dayName.toLowerCase()];

        if (dayOfWeek === undefined) {
          throw new Error(`Hari di baris ${idx + 1} tidak valid`);
        }
        if (!subject || !room) {
          throw new Error(`Mapel/ruangan di baris ${idx + 1} tidak boleh kosong`);
        }
        if (!isValidTime(startTime) || !isValidTime(endTime)) {
          throw new Error(`Jam di baris ${idx + 1} harus format HH:mm`);
        }
        if (endTime <= startTime) {
          throw new Error(`Jam selesai di baris ${idx + 1} harus lebih besar dari jam mulai`);
        }

        return { dayOfWeek, subject, room, startTime, endTime };
      });

      setIsBulkSaving(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/schedules/bulk`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: bulkUserId,
          active: bulkActive,
          entries
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Gagal menambah jadwal cepat');
      }

      setMessage({ text: data.message || 'Jadwal cepat berhasil ditambahkan', type: 'success' });
      setBulkInput('');
      fetchData();
    } catch (error) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setIsBulkSaving(false);
    }
  };

  return (
    <DashboardLayout userRole="admin">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-headline-lg text-on-background mb-1">Jadwal Pelajaran</h2>
          <p className="font-body-md text-on-surface-variant">Atur kelas yang harus dihadiri guru hari ini dan seterusnya.</p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-surface-container border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-variant transition-colors flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Segarkan
        </button>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg border ${message.type === 'success' ? 'bg-[#dcfce7] border-[#bbf7d0] text-[#166534]' : 'bg-error-container text-on-error-container border-error/20'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-1 bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-variant bg-surface-container-low">
            <h3 className="font-headline-md text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">event_note</span>
              {editingId ? 'Ubah Jadwal' : 'Tambah Jadwal'}
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-on-surface">Guru</label>
              <select
                name="userId"
                value={form.userId}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-background focus:outline-none focus:border-secondary"
              >
                <option value="">Pilih guru</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} {teacher.dept ? `- ${teacher.dept}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-on-surface">Hari</label>
              <select
                name="dayOfWeek"
                value={form.dayOfWeek}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-background focus:outline-none focus:border-secondary"
              >
                {dayOptions.map((day) => (
                  <option key={day.value} value={day.value}>{day.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-on-surface">Mata Pelajaran</label>
              <input
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="Contoh: Matematika 101"
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-background focus:outline-none focus:border-secondary"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-on-surface">Ruangan</label>
              <input
                name="room"
                value={form.room}
                onChange={handleChange}
                placeholder="Contoh: Ruang 304 B"
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-background focus:outline-none focus:border-secondary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-on-surface">Mulai</label>
                <input
                  type="time"
                  name="startTime"
                  value={form.startTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-background focus:outline-none focus:border-secondary"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-on-surface">Selesai</label>
                <input
                  type="time"
                  name="endTime"
                  value={form.endTime}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-background focus:outline-none focus:border-secondary"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm text-on-surface">
              <input
                type="checkbox"
                name="active"
                checked={form.active}
                onChange={handleChange}
                className="w-4 h-4 accent-teal-700"
              />
              Jadwal aktif
            </label>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 bg-secondary text-white px-4 py-3 rounded-lg font-medium hover:bg-secondary/90 transition-colors disabled:opacity-60"
              >
                {isSaving ? 'Menyimpan...' : editingId ? 'Perbarui' : 'Simpan'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-3 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="xl:col-span-2 bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-variant bg-surface-container-low">
            <h3 className="font-headline-md text-on-background flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">schedule</span>
              Daftar Jadwal
            </h3>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-on-surface-variant">Memuat jadwal...</div>
          ) : schedules.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">Belum ada jadwal tersimpan.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low">
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-on-surface-variant">Guru</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-on-surface-variant">Hari</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-on-surface-variant">Mapel</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-on-surface-variant">Jam</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-on-surface-variant">Ruangan</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-on-surface-variant text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-variant">
                  {schedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-surface-container/30">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-on-background">{schedule.user?.name || '-'}</p>
                          <p className="text-xs text-on-surface-variant">{schedule.user?.dept || '-'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-on-background">{dayLabelByValue[schedule.dayOfWeek] || schedule.dayOfWeek}</td>
                      <td className="px-6 py-4 text-on-background">{schedule.subject}</td>
                      <td className="px-6 py-4 text-on-background">{schedule.startTime} - {schedule.endTime}</td>
                      <td className="px-6 py-4 text-on-background">{schedule.room}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(schedule)}
                            className="px-3 py-1.5 rounded-lg bg-secondary-container text-on-secondary-container text-sm hover:opacity-90"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(schedule.id)}
                            className="px-3 py-1.5 rounded-lg bg-error-container text-on-error-container text-sm hover:opacity-90"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-variant bg-surface-container-low">
          <h3 className="font-headline-md text-on-background flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">bolt</span>
            Input Cepat Banyak Jadwal
          </h3>
          <p className="text-sm text-on-surface-variant mt-1">Format per baris: Hari|Mapel|Ruangan|Mulai|Selesai</p>
        </div>

        <form onSubmit={handleBulkSubmit} className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-4 lg:col-span-1">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-on-surface">Guru</label>
              <select
                value={bulkUserId}
                onChange={(e) => setBulkUserId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-background focus:outline-none focus:border-secondary"
              >
                <option value="">Pilih guru</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} {teacher.dept ? `- ${teacher.dept}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <label className="flex items-center gap-3 text-sm text-on-surface">
              <input
                type="checkbox"
                checked={bulkActive}
                onChange={(e) => setBulkActive(e.target.checked)}
                className="w-4 h-4 accent-teal-700"
              />
              Semua jadwal aktif
            </label>

            <button
              type="submit"
              disabled={isBulkSaving}
              className="w-full bg-secondary text-white px-4 py-3 rounded-lg font-medium hover:bg-secondary/90 transition-colors disabled:opacity-60"
            >
              {isBulkSaving ? 'Menyimpan...' : 'Simpan Sekaligus'}
            </button>
          </div>

          <div className="lg:col-span-2 space-y-2">
            <label className="block text-sm font-medium text-on-surface">Daftar Jadwal</label>
            <textarea
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              rows={8}
              placeholder={"Senin|Matematika 101|Ruang 304 B|09:00|10:30\nSelasa|Fisika Dasar|Lab IPA 2|10:45|12:15\nRabu|Kimia|Lab Kimia|07:30|09:00"}
              className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest text-on-background focus:outline-none focus:border-secondary resize-y"
            />
            <p className="text-xs text-on-surface-variant">Hari yang didukung: Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu.</p>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
