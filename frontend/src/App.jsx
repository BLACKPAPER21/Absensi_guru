import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardGuru from './pages/DashboardGuru';
import RiwayatAbsensi from './pages/RiwayatAbsensi';
import FormIzin from './pages/FormIzin';
import DashboardAdmin from './pages/DashboardAdmin';
import LeaveManagementAdmin from './pages/LeaveManagementAdmin';
import DashboardKepsek from './pages/DashboardKepsek';
import DataGuru from './pages/DataGuru';
import Laporan from './pages/Laporan';
import SettingAdmin from './pages/SettingAdmin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Guru Routes */}
        <Route path="/guru" element={<DashboardGuru />} />
        <Route path="/guru/riwayat" element={<RiwayatAbsensi />} />
        <Route path="/guru/izin" element={<FormIzin />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<DashboardAdmin />} />
        <Route path="/admin/izin" element={<LeaveManagementAdmin />} />
        <Route path="/admin/guru" element={<DataGuru />} />
        <Route path="/admin/laporan" element={<Laporan />} />
        <Route path="/admin/setting" element={<SettingAdmin />} />

        {/* Kepsek Routes */}
        <Route path="/kepsek" element={<DashboardKepsek />} />

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
