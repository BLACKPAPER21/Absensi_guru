import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import { API_BASE } from '../utils/api';

export default function LeaveManagementAdmin() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/leave/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openRejectModal = (request) => {
    setSelectedRequest(request);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const closeRejectModal = () => {
    if (isSubmitting) return;
    setRejectModalOpen(false);
    setSelectedRequest(null);
    setRejectReason('');
  };

  const handleUpdateStatus = async (id, status, adminNote = '') => {
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem('token');

      const res = await fetch(`${API_BASE}/api/leave/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, adminNote })
      });

      if (res.ok) {
        setMsg({ text: `Request successfully ${status.toLowerCase()}`, type: 'success' });
        closeRejectModal();
        fetchRequests(); // Refresh data
        setTimeout(() => setMsg({ text: '', type: '' }), 3000);
      } else {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }));
        setMsg({ text: err.message || 'Unknown error', type: 'error' });
      }
    } catch (error) {
      setMsg({ text: 'Network error', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    await handleUpdateStatus(selectedRequest.id, 'REJECTED', rejectReason.trim());
  };

  // Stats
  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
  const approvedCount = requests.filter(r => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter(r => r.status === 'REJECTED').length;

  return (
    <DashboardLayout userRole="admin">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="font-headline-md text-headline-md text-on-surface">Manajemen Izin & Cuti</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Tinjau dan kelola permohonan izin guru.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchRequests} className="px-4 py-2 bg-surface-container border border-outline-variant rounded-lg font-label-md text-on-surface hover:bg-surface-variant transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">refresh</span> Segarkan
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`mb-6 p-4 rounded-lg font-label-md ${msg.type === 'success' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-error-container text-on-error-container'}`}>
          {msg.text}
        </div>
      )}

      {/* Bento Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-fixed/20 text-on-secondary-container rounded-lg">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>pending_actions</span>
            </div>
          </div>
          <p className="text-display-lg font-display-lg text-on-background">{pendingCount}</p>
          <p className="text-label-caps font-label-caps text-on-surface-variant">MENUNGGU KONFIRMASI</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-secondary-fixed/30 text-secondary-fixed-dim rounded-lg">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            </div>
          </div>
          <p className="text-display-lg font-display-lg text-secondary-fixed-dim">{approvedCount}</p>
          <p className="text-label-caps font-label-caps text-on-surface-variant">DISETUJUI</p>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-error-container text-on-error-container rounded-lg">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>cancel</span>
            </div>
          </div>
          <p className="text-display-lg font-display-lg text-error">{rejectedCount}</p>
          <p className="text-label-caps font-label-caps text-on-surface-variant">DITOLAK</p>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-variant bg-surface-container-low flex justify-between items-center">
          <h3 className="font-label-md text-label-md text-on-surface">Daftar Permohonan</h3>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-on-surface-variant">Memuat data...</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">Tidak ada permohonan izin.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low">
                  <th className="px-6 py-4 text-label-caps font-label-caps text-on-surface-variant border-b border-surface-variant">NAMA GURU</th>
                  <th className="px-6 py-4 text-label-caps font-label-caps text-on-surface-variant border-b border-surface-variant">TIPE IZIN</th>
                  <th className="px-6 py-4 text-label-caps font-label-caps text-on-surface-variant border-b border-surface-variant">TANGGAL</th>
                  <th className="px-6 py-4 text-label-caps font-label-caps text-on-surface-variant border-b border-surface-variant">ALASAN & LAMPIRAN</th>
                  <th className="px-6 py-4 text-label-caps font-label-caps text-on-surface-variant border-b border-surface-variant">STATUS</th>
                  <th className="px-6 py-4 text-label-caps font-label-caps text-on-surface-variant border-b border-surface-variant text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-variant">
                {requests.map((req, idx) => (
                  <tr key={req.id} className={`hover:bg-surface-container/40 transition-colors duration-150 ${req.status !== 'PENDING' ? 'opacity-80' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface-variant font-bold text-xs">
                          {req.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-body-sm text-sm font-semibold text-on-background">{req.user.name}</p>
                          <p className="font-label-sm text-[11px] text-on-surface-variant">{req.user.nip} • {req.user.dept || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-[10px] uppercase font-bold tracking-wider border bg-surface-container text-on-surface border-outline-variant">
                        {req.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-on-background">
                        <p className="font-body-sm font-medium">{new Date(req.startDate).toLocaleDateString('id-ID')} - {new Date(req.endDate).toLocaleDateString('id-ID')}</p>
                        <p className="font-label-sm text-[11px] text-on-surface-variant">
                          Diajukan: {new Date(req.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-body-sm text-sm text-on-surface-variant truncate mb-1">"{req.reason}"</p>
                      {req.attachment && (
                        <a href={`${API_BASE}${req.attachment}`} target="_blank" rel="noreferrer" className="text-[11px] text-secondary hover:underline flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">attach_file</span> Lihat Dokumen
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {req.status === 'PENDING' && <span className="font-label-sm text-xs text-[#b45309] font-bold">MENUNGGU</span>}
                      {req.status === 'APPROVED' && <span className="font-label-sm text-xs text-secondary font-bold">DISETUJUI</span>}
                      {req.status === 'REJECTED' && <span className="font-label-sm text-xs text-error font-bold">DITOLAK</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                            className="px-4 py-1.5 bg-secondary text-on-secondary font-label-sm text-xs font-bold rounded-lg hover:bg-on-secondary-fixed-variant transition-all active:scale-95"
                          >
                            Setujui
                          </button>
                          <button 
                            onClick={() => openRejectModal(req)}
                            className="px-4 py-1.5 bg-error-container text-on-error-container font-label-sm text-xs font-bold rounded-lg hover:bg-error/20 transition-all active:scale-95"
                          >
                            Tolak
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-on-surface-variant">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {rejectModalOpen && selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm px-4"
          onClick={closeRejectModal}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-surface-variant bg-surface-container-lowest shadow-[0_24px_80px_rgba(15,23,42,0.35)] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 p-6 border-b border-surface-variant bg-gradient-to-r from-error-container/70 to-surface-container-lowest">
              <div className="w-11 h-11 rounded-xl bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">cancel</span>
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-[0.18em] text-on-surface-variant font-semibold">Tolak Permohonan</p>
                <h3 className="text-xl font-headline-md text-on-background mt-1">{selectedRequest.user?.name}</h3>
                <p className="text-sm text-on-surface-variant mt-1">
                  {selectedRequest.type} • {new Date(selectedRequest.startDate).toLocaleDateString('id-ID')} - {new Date(selectedRequest.endDate).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="p-6 space-y-5">
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-900">
                Alasan penolakan bersifat opsional, tetapi akan tersimpan sebagai catatan admin untuk guru.
              </div>

              <div className="space-y-2">
                <label htmlFor="rejectReason" className="font-label-md text-on-surface">Alasan Penolakan</label>
                <textarea
                  id="rejectReason"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Contoh: Dokumen pendukung belum lengkap / jadwal bertabrakan / alasan tidak sesuai ketentuan"
                  rows={5}
                  className="w-full rounded-xl border border-outline-variant bg-surface-container px-4 py-3 text-on-background placeholder:text-on-surface-variant focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeRejectModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg border border-outline-variant bg-surface-container text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-error text-white hover:bg-error/90 transition-colors flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isSubmitting ? 'hourglass_empty' : 'send'}
                  </span>
                  {isSubmitting ? 'Menyimpan...' : 'Tolak Permohonan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
