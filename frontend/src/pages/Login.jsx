import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../utils/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user data
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === 'KEPSEK') {
        navigate('/kepsek');
      } else if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/guru');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen flex items-center justify-center p-margin-page">
      <div className="w-full max-w-[420px] bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(11,28,48,0.04)] border border-surface-container flex flex-col p-margin-page gap-stack-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-secondary"></div>
        <div className="flex flex-col items-center text-center gap-stack-sm mb-stack-md">
          <div className="w-16 h-16 rounded-lg bg-surface-container-low flex items-center justify-center mb-base border border-surface-variant overflow-hidden">
            <span className="material-symbols-outlined text-secondary text-4xl">school</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface">Selamat Datang di SIGURU</h1>
          <p className="font-body-md text-body-md text-on-surface-variant">Sistem Manajemen Akademik</p>
        </div>
        <form className="flex flex-col gap-stack-lg" onSubmit={handleLogin}>
          <div className="flex flex-col gap-stack-md">
            <div className="flex flex-col gap-stack-sm relative">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="email">Alamat Email</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline">mail</span>
                <input
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-surface border border-outline-variant text-on-surface font-body-md text-body-md focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                  id="email"
                  placeholder="admin@siguru.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex flex-col gap-stack-sm relative">
              <label className="font-label-md text-label-md text-on-surface" htmlFor="password">Kata Sandi</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-3 text-outline">lock</span>
                <input
                  className="w-full pl-10 pr-10 py-3 rounded-lg bg-surface border border-outline-variant text-on-surface font-body-md text-body-md focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary transition-colors"
                  id="password"
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  className="absolute right-3 text-outline hover:text-on-surface transition-colors flex items-center"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input className="w-4 h-4 rounded border-outline-variant text-secondary focus:ring-secondary bg-surface" id="remember" type="checkbox"/>
              <label className="font-label-md text-label-md text-on-surface-variant cursor-pointer" htmlFor="remember">Ingat Saya</label>
            </div>
            <a className="font-label-md text-label-md text-secondary hover:text-on-secondary-container transition-colors" href="#">Lupa Kata Sandi?</a>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-error-container text-on-error-container text-label-md font-label-md border border-error/20">
              {error}
            </div>
          )}

          <button
            className="w-full py-3 px-4 rounded-lg bg-secondary text-on-secondary font-label-md text-label-md hover:bg-on-secondary-container transition-colors mt-base flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Masuk...' : 'Masuk'}
            {!isLoading && <span className="material-symbols-outlined text-[20px]">arrow_forward</span>}
          </button>
        </form>
        <div className="mt-stack-md text-center">
          <p className="font-label-sm text-label-sm text-outline">
            Butuh bantuan untuk mengakses akun Anda? <a className="text-secondary hover:underline" href="#">Hubungi Dukungan</a>
          </p>
        </div>
      </div>
    </div>
  );
}
