import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function DashboardLayout({ children, userRole = 'guru' }) {
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close menus when clicking outside (simple logic: just close the other when one opens)
  const toggleProfile = () => {
    setShowProfileMenu(!showProfileMenu);
    if (!showProfileMenu) setShowNotificationMenu(false);
  };

  const toggleNotification = () => {
    setShowNotificationMenu(!showNotificationMenu);
    if (!showNotificationMenu) setShowProfileMenu(false);
  };
  
  const storedUser = localStorage.getItem('user');
  let currentRole = userRole;
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      currentRole = parsed.role.toLowerCase();
    } catch (e) {}
  }

  let navItems = [];
  if (currentRole === 'guru') {
    navItems = [
      { name: 'Dashboard', path: '/guru', icon: 'dashboard' },
      { name: 'Riwayat Absensi', path: '/guru/riwayat', icon: 'how_to_reg' },
      { name: 'Izin / Cuti', path: '/guru/izin', icon: 'edit_document' },
    ];
  } else if (currentRole === 'kepsek') {
    navItems = [
      { name: 'Executive Dashboard', path: '/kepsek', icon: 'dashboard' },
      { name: 'Data Guru', path: '/admin/guru', icon: 'manage_accounts' },
      { name: 'Laporan', path: '/admin/laporan', icon: 'analytics' },
    ];
  } else {
    navItems = [
      { name: 'Dashboard', path: '/admin', icon: 'dashboard' },
      { name: 'Data Guru', path: '/admin/guru', icon: 'manage_accounts' },
      { name: 'Manajemen Izin', path: '/admin/izin', icon: 'edit_document' },
      { name: 'Laporan', path: '/admin/laporan', icon: 'analytics' },
    ];
  }

  return (
    <div className="bg-background flex h-screen overflow-hidden font-body-md text-on-background">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* SideNavBar */}
      <aside className={`bg-slate-900 font-inter text-sm font-medium h-screen left-0 w-64 border-r border-slate-800 shadow-xl flex flex-col py-4 shrink-0 fixed md:static z-50 transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="px-6 mb-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-white">school</span>
            </div>
            <div>
              <h1 className="text-lg font-black text-white">SIGURU</h1>
              <p className="text-slate-400 text-xs">Sistem Akademik</p>
            </div>
          </div>
          <button 
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <nav className="flex-1 flex flex-col gap-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.name} 
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`rounded-md mx-2 px-4 py-3 flex items-center gap-3 transition-all duration-200 ${isActive ? 'bg-secondary text-white translate-x-1' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "" }}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto px-2 flex flex-col gap-1">
          <Link to="/login" className="text-slate-400 hover:text-white px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-all duration-200 rounded-md mx-2">
            <span className="material-symbols-outlined">logout</span>
            Keluar
          </Link>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TopAppBar */}
        <header className="bg-white/80 backdrop-blur-md font-inter text-sm font-medium z-30 border-b border-slate-200 shadow-sm flex justify-between items-center w-full px-4 md:px-6 h-16 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden text-slate-600 hover:bg-slate-50 p-2 rounded-full transition-colors flex items-center justify-center"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="text-xl font-bold tracking-tight text-slate-900 md:hidden">SIGURU</span>
            <div className="hidden md:flex items-center bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <span className="material-symbols-outlined text-slate-400 mr-2 text-sm">search</span>
              <input className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm p-0 w-64 text-slate-900 placeholder-slate-400" placeholder="Pencarian..." type="text"/>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button 
                onClick={toggleNotification}
                className={`text-slate-600 transition-colors p-2 rounded-full relative ${showNotificationMenu ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
              >
                <span className="material-symbols-outlined">notifications</span>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full border-2 border-white"></span>
              </button>

              {showNotificationMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-800">Notifikasi</p>
                    <button className="text-xs text-secondary hover:underline">Tandai semua dibaca</button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {/* Dummy Notification Item */}
                    <div className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 transition-colors opacity-60">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-secondary-container text-secondary flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[16px]">info</span>
                        </div>
                        <div>
                          <p className="text-sm text-slate-800 leading-tight">Sistem sedang dalam tahap pengembangan akhir. Data ini adalah contoh notifikasi.</p>
                          <p className="text-[10px] text-slate-400 mt-1">Sistem • 2 jam yang lalu</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-2 text-center border-t border-slate-100 mt-1">
                    <button className="text-xs text-slate-500 hover:text-secondary font-medium">Lihat semua notifikasi</button>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button 
                onClick={toggleProfile}
                className={`w-8 h-8 rounded-full border border-slate-200 overflow-hidden bg-surface-container flex justify-center items-center ml-2 transition-all cursor-pointer ${showProfileMenu ? 'ring-2 ring-secondary' : 'hover:ring-2 hover:ring-secondary/30'}`}
              >
                <span className="material-symbols-outlined text-secondary text-sm">person</span>
              </button>
              
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-800 line-clamp-1">
                      {storedUser ? JSON.parse(storedUser).name : 'Pengguna'}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">{currentRole}</p>
                  </div>
                  <Link to="/login" className="px-4 py-2 text-sm text-error hover:bg-error-container/50 flex items-center gap-2 mt-1 transition-colors">
                    <span className="material-symbols-outlined text-[16px]">logout</span> Keluar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Canvas Area */}
        <main className="flex-1 overflow-y-auto p-margin-page bg-background">
          <div className="max-w-container-max mx-auto flex flex-col gap-gutter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
