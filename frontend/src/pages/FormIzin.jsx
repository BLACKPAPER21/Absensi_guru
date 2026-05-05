import { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

export default function FormIzin() {
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submitMsg, setSubmitMsg] = useState({ text: '', type: '' });
  
  const [formData, setFormData] = useState({
    type: 'SAKIT',
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchLeaveHistory();
  }, []);

  const fetchLeaveHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/leave/my-requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setLeaveHistory(data.requests);
      }
    } catch (error) {
      console.error('Error fetching leave history:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitMsg({ text: '', type: '' });

    try {
      const token = localStorage.getItem('token');
      const data = new FormData();
      data.append('type', formData.type);
      data.append('startDate', formData.startDate);
      data.append('endDate', formData.endDate);
      data.append('reason', formData.reason);
      if (file) {
        data.append('attachment', file);
      }

      const res = await fetch('http://localhost:5000/api/leave/request', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: data
      });

      const result = await res.json();

      if (res.ok) {
        setSubmitMsg({ text: 'Pengajuan izin berhasil dikirim!', type: 'success' });
        setFormData({ type: 'SAKIT', startDate: '', endDate: '', reason: '' });
        setFile(null);
        fetchLeaveHistory(); // Refresh the list
      } else {
        setSubmitMsg({ text: result.message || 'Gagal mengirim pengajuan', type: 'error' });
      }
    } catch (error) {
      setSubmitMsg({ text: 'Kesalahan jaringan. Silakan coba lagi.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout userRole="guru">
      <div className="max-w-[1440px] mx-auto w-full">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 font-label-caps text-label-caps text-slate-400 mb-6 uppercase tracking-wider text-xs font-bold">
          <span className="hover:text-secondary cursor-pointer">AKADEMIK</span>
          <span className="material-symbols-outlined text-[12px]">chevron_right</span>
          <span className="text-secondary">PENGAJUAN IZIN</span>
        </nav>
        
        <header className="mb-10">
          <h2 className="font-headline-md text-headline-md text-on-background">Manajemen Izin Pegawai</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-2xl">Ajukan permintaan izin Anda untuk ditinjau oleh pihak administrasi. Pastikan untuk melampirkan dokumen pendukung untuk izin sakit atau dinas luar.</p>
        </header>

        <div className="grid grid-cols-12 gap-gutter">
          {/* Leave Request Form */}
          <div className="col-span-12 lg:col-span-7">
            <section className="bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(11,28,48,0.04)] border border-outline-variant overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/50 flex items-center justify-between">
                <h3 className="font-label-md text-label-md text-secondary">Buat Pengajuan Izin</h3>
                <span className="material-symbols-outlined text-secondary">edit_note</span>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {submitMsg.text && (
                  <div className={`p-4 rounded-lg font-label-md ${submitMsg.type === 'success' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-error-container text-on-error-container'}`}>
                    {submitMsg.text}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">TIPE IZIN</label>
                    <div className="relative">
                      <select 
                        name="type" 
                        value={formData.type} 
                        onChange={handleInputChange}
                        required
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none appearance-none cursor-pointer"
                      >
                        <option value="SAKIT">Izin Sakit</option>
                        <option value="PERSONAL">Izin Kepentingan Pribadi</option>
                        <option value="DINAS">Dinas Luar</option>
                        <option value="CUTI">Cuti Tahunan</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-sm">expand_more</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">TANGGAL MULAI</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none cursor-pointer" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">TANGGAL SELESAI</label>
                    <div className="relative">
                      <input 
                        type="date" 
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">ALASAN IZIN</label>
                  <textarea 
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-3 font-body-md text-body-md focus:border-secondary focus:ring-1 focus:ring-secondary transition-all outline-none resize-none" 
                    placeholder="Mohon berikan detail mengenai pengajuan izin Anda..." 
                    rows="4"
                  ></textarea>
                </div>

                <div className="space-y-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">DOKUMEN PENDUKUNG (PDF/JPG)</label>
                  <div className="border-2 border-dashed border-outline-variant rounded-xl p-8 flex flex-col items-center justify-center bg-surface-container hover:bg-surface-container-high transition-colors relative group">
                    <input 
                      type="file" 
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <span className="material-symbols-outlined text-secondary text-3xl mb-2 group-hover:scale-110 transition-transform">
                      {file ? 'draft' : 'cloud_upload'}
                    </span>
                    <p className="font-body-md text-body-md text-on-surface-variant text-center">
                      {file ? file.name : 'Klik untuk mengunggah atau seret dan lepas file Anda di sini'}
                    </p>
                    <p className="font-label-sm text-[10px] text-on-surface-variant mt-1 uppercase tracking-widest">MAKSIMAL UKURAN FILE: 10MB</p>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-secondary text-on-secondary font-label-md text-label-md py-4 rounded-lg hover:bg-on-secondary-fixed-variant active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    {isLoading ? 'MENGIRIM...' : 'KIRIM PENGAJUAN'}
                  </button>
                </div>
              </form>
            </section>
          </div>

          {/* My Leave Status */}
          <div className="col-span-12 lg:col-span-5 space-y-6">
            <section className="bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(11,28,48,0.04)] border border-outline-variant overflow-hidden">
              <div className="px-6 py-4 border-b border-outline-variant bg-surface-container-low/50 flex items-center justify-between">
                <h3 className="font-label-md text-label-md text-secondary">Status Izin Saya</h3>
                <span className="material-symbols-outlined text-secondary">history</span>
              </div>
              <div className="divide-y divide-surface-variant max-h-[600px] overflow-y-auto">
                {leaveHistory.length === 0 ? (
                  <div className="p-12 text-center text-on-surface-variant flex flex-col items-center gap-3">
                    <span className="material-symbols-outlined text-outline text-4xl mb-2">event_busy</span>
                    <p>Belum ada pengajuan izin.</p>
                  </div>
                ) : (
                  leaveHistory.map((req) => (
                    <div key={req.id} className={`p-6 hover:bg-surface-container transition-colors ${req.status === 'REJECTED' ? 'opacity-80' : ''}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-body-md font-semibold text-on-surface">
                            {req.type === 'SAKIT' ? 'Izin Sakit' : 
                             req.type === 'PERSONAL' ? 'Izin Pribadi' : 
                             req.type === 'DINAS' ? 'Dinas Luar' : 'Cuti'}
                          </h4>
                          <p className="font-label-sm text-xs text-on-surface-variant font-medium">
                            {new Date(req.startDate).toLocaleDateString('id-ID', {day:'numeric', month:'short'})} - {new Date(req.endDate).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}
                          </p>
                        </div>
                        {req.status === 'PENDING' && (
                          <span className="bg-[#fff8e1] text-[#b45309] border border-[#fde68a] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">pending</span> Menunggu
                          </span>
                        )}
                        {req.status === 'APPROVED' && (
                          <span className="bg-secondary-container text-on-secondary-container border border-secondary-fixed-dim/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">check_circle</span> Disetujui
                          </span>
                        )}
                        {req.status === 'REJECTED' && (
                          <span className="bg-error-container text-on-error-container border border-error/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">cancel</span> Ditolak
                          </span>
                        )}
                      </div>
                      <p className="font-body-sm text-sm text-on-surface-variant line-clamp-2 mb-3 italic">"{req.reason}"</p>
                      
                      {req.adminNote && (
                        <div className="bg-surface-variant/30 p-3 rounded-lg mb-3">
                          <p className="text-xs text-on-surface-variant leading-tight"><strong>Catatan Admin:</strong> {req.adminNote}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-[11px] text-on-surface-variant">
                        {req.attachment && (
                          <a href={`http://localhost:5000${req.attachment}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-secondary">
                            <span className="material-symbols-outlined text-[14px]">attach_file</span> Lihat Dokumen
                          </a>
                        )}
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span> 
                          Diajukan {new Date(req.createdAt).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
