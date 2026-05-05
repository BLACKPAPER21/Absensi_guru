import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import * as faceapi from 'face-api.js';
import { API_BASE } from '../utils/api';

export default function DataGuru() {
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentTeacher, setCurrentTeacher] = useState({ id: '', nip: '', name: '', email: '', dept: '', password: '', faceDescriptor: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Face Extractor state
  const [faceImageBlob, setFaceImageBlob] = useState(null);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchTeachers();
    loadFaceModels();
  }, []);

  const loadFaceModels = async () => {
    try {
      await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
      setIsModelsLoaded(true);
    } catch (err) {
      console.error('Gagal memuat model Face-API:', err);
    }
  };

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/users/teachers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch teachers');
      setTeachers(data.teachers);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (mode, teacher = null) => {
    setModalMode(mode);
    if (mode === 'edit' && teacher) {
      setCurrentTeacher({ ...teacher, password: '', faceDescriptor: null });
    } else {
      setCurrentTeacher({ id: '', nip: '', name: '', email: '', dept: '', password: '', faceDescriptor: null });
    }
    setFaceImageBlob(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentTeacher({ id: '', nip: '', name: '', email: '', dept: '', password: '', faceDescriptor: null });
    setFaceImageBlob(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!isModelsLoaded) {
      alert("Model AI belum selesai dimuat, harap tunggu sebentar.");
      return;
    }

    setIsExtracting(true);
    try {
      // Proses foto menggunakan face-api
      const img = await faceapi.bufferToImage(file);
      const detections = await faceapi.detectAllFaces(img).withFaceLandmarks().withFaceDescriptors();

      if (detections.length === 0) {
        alert("AI Peringatan: Tidak ada wajah yang terdeteksi di foto ini! Pastikan foto jelas dan terang.");
        setFaceImageBlob(null);
        setCurrentTeacher({ ...currentTeacher, faceDescriptor: null });
      } else if (detections.length > 1) {
        alert("AI Peringatan: Terdeteksi lebih dari satu wajah! Harap gunakan pas foto sendiri.");
        setFaceImageBlob(null);
        setCurrentTeacher({ ...currentTeacher, faceDescriptor: null });
      } else {
        // Berhasil mendeteksi tepat 1 wajah
        const descriptorArray = Array.from(detections[0].descriptor);
        setCurrentTeacher({ ...currentTeacher, faceDescriptor: JSON.stringify(descriptorArray) });
        setFaceImageBlob(file); // Simpan untuk preview
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengekstrak wajah dari foto.");
    } finally {
      setIsExtracting(false);
      // Reset input file
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const token = localStorage.getItem('token');
      const url = modalMode === 'add' 
        ? `${API_BASE}/api/users/teachers`
        : `${API_BASE}/api/users/teachers/${currentTeacher.id}`;
      const method = modalMode === 'add' ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(currentTeacher)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save teacher');
      
      await fetchTeachers();
      handleCloseModal();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/api/users/teachers/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete teacher');
      
      fetchTeachers();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-headline-lg text-on-background mb-1">Manajemen Data Guru</h2>
          <p className="font-body-md text-on-surface-variant">Kelola daftar guru, departemen, dan akses sistem.</p>
        </div>
        <button onClick={() => handleOpenModal('add')} className="px-4 py-2 bg-secondary text-white rounded-lg font-label-md hover:bg-secondary/90 transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined">person_add</span> Tambah Guru
        </button>
      </div>

      {errorMsg && !isModalOpen && (
        <div className="mb-4 p-4 rounded-lg bg-error-container text-on-error-container text-label-md">
          {errorMsg}
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl border border-surface-variant shadow-sm overflow-hidden">
        <div className="p-4 border-b border-surface-variant flex justify-between items-center bg-surface-container-lowest/50">
          <div className="relative w-64">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
            <input 
              type="text" 
              placeholder="Cari nama atau NIP..." 
              className="w-full pl-9 pr-4 py-2 bg-surface-container border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-secondary"
            />
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {isLoading ? (
            <div className="p-8 text-center text-on-surface-variant">Memuat data guru...</div>
          ) : teachers.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant">Tidak ada data guru.</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider border-b border-surface-variant">NIP</th>
                  <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider border-b border-surface-variant">Nama Guru</th>
                  <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider border-b border-surface-variant">Email</th>
                  <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider border-b border-surface-variant">Departemen</th>
                  <th className="p-4 font-label-sm text-on-surface-variant uppercase tracking-wider border-b border-surface-variant text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t, idx) => (
                  <tr key={t.id} className={`hover:bg-surface-container transition-colors border-b border-surface-variant/50 ${idx % 2 !== 0 ? 'bg-slate-50/50' : ''}`}>
                    <td className="p-4 font-body-md text-on-background font-medium">{t.nip}</td>
                    <td className="p-4 font-body-md text-on-background">{t.name}</td>
                    <td className="p-4 font-body-md text-on-surface-variant">{t.email}</td>
                    <td className="p-4 font-body-md text-on-surface-variant">{t.dept || '-'}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenModal('edit', t)} className="p-1.5 text-secondary hover:bg-secondary-container rounded transition-colors" title="Edit">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => handleDelete(t.id, t.name)} className="p-1.5 text-error hover:bg-error-container rounded transition-colors" title="Hapus">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-outline-variant flex justify-between items-center">
              <h3 className="font-headline-sm text-on-background">{modalMode === 'add' ? 'Tambah Guru Baru' : 'Edit Data Guru'}</h3>
              <button onClick={handleCloseModal} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              {errorMsg && (
                <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-label-sm border border-error/20">
                  {errorMsg}
                </div>
              )}
              <form id="teacherForm" onSubmit={handleSave} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-on-surface">NIP</label>
                  <input required type="text" value={currentTeacher.nip} onChange={e => setCurrentTeacher({...currentTeacher, nip: e.target.value})} className="px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary" placeholder="Contoh: GURU-001" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-on-surface">Nama Lengkap</label>
                  <input required type="text" value={currentTeacher.name} onChange={e => setCurrentTeacher({...currentTeacher, name: e.target.value})} className="px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary" placeholder="Nama lengkap beserta gelar" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-on-surface">Email</label>
                  <input required type="email" value={currentTeacher.email} onChange={e => setCurrentTeacher({...currentTeacher, email: e.target.value})} className="px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary" placeholder="guru@sekolah.com" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-label-sm text-on-surface">Departemen / Mata Pelajaran</label>
                  <input type="text" value={currentTeacher.dept} onChange={e => setCurrentTeacher({...currentTeacher, dept: e.target.value})} className="px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary" placeholder="Contoh: Matematika" />
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <label className="font-label-sm text-on-surface flex justify-between">
                    Password
                    {modalMode === 'edit' && <span className="text-outline text-[10px] font-normal italic">(Kosongkan jika tidak ingin mengubah)</span>}
                  </label>
                  <input required={modalMode === 'add'} type="password" value={currentTeacher.password} onChange={e => setCurrentTeacher({...currentTeacher, password: e.target.value})} className="px-3 py-2 bg-surface border border-outline-variant rounded-lg focus:outline-none focus:border-secondary" placeholder="••••••••" />
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <label className="font-label-sm text-on-surface">Data Biometrik Wajah (Pas Foto)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isExtracting || !isModelsLoaded}
                      className="px-4 py-2 border border-secondary text-secondary rounded-lg font-label-md hover:bg-secondary-container transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {isExtracting ? 'hourglass_empty' : 'upload_file'}
                      </span>
                      {isExtracting ? 'Mengekstrak...' : (currentTeacher.faceDescriptor ? 'Ganti Foto' : 'Upload Pas Foto')}
                    </button>

                    {currentTeacher.faceDescriptor && !isExtracting && (
                      <span className="text-secondary flex items-center gap-1 text-sm font-medium">
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        Biometrik Tersimpan
                      </span>
                    )}
                  </div>
                  {faceImageBlob && (
                    <div className="mt-2 w-24 h-32 rounded-lg overflow-hidden border border-outline-variant bg-surface-container">
                      <img src={URL.createObjectURL(faceImageBlob)} alt="Face preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <p className="text-xs text-on-surface-variant mt-1">
                    *{modalMode === 'edit' ? 'Upload foto baru jika ingin memperbarui data biometrik.' : 'Upload pas foto guru. Sistem otomatis memindai wajah pada foto.'}
                  </p>
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-outline-variant bg-surface-container-low flex justify-end gap-3 rounded-b-xl">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-on-surface-variant font-label-md hover:bg-surface-container rounded-lg transition-colors">Batal</button>
              <button type="submit" form="teacherForm" disabled={isSubmitting} className="px-4 py-2 bg-secondary text-white font-label-md rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50">
                {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
