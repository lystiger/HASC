// frontend/src/pages/LoginPage.tsx
import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { loginWithPassword } from '../api/authService';
import { clearStoredAccessToken, getStoredUserRole, setStoredAccessToken } from '../utils/auth';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const next = params.get('next') || '/admin/categories';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!email || !password) {
      setError(t('auth.error_required', { defaultValue: 'Email and password are required.' }));
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await loginWithPassword(email, password);
      setStoredAccessToken(result.access_token);
      const role = getStoredUserRole();
      if (role !== 'ADMIN') {
        clearStoredAccessToken();
        setError(t('auth.error_not_admin', { defaultValue: 'This account is not an admin.' }));
        return;
      }
      navigate(next, { replace: true });
    } catch (err) {
      setError((err as Error).message || t('auth.error_login', { defaultValue: 'Login failed.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-10 max-w-screen-sm font-sans">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-industrial">
          {t('auth.title', { defaultValue: 'Admin Login' })}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {t('auth.subtitle', { defaultValue: 'Sign in to manage categories.' })}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="text-sm text-slate-600">
            {t('auth.email', { defaultValue: 'Email' })}
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
              required
            />
          </label>

          <label className="text-sm text-slate-600">
            {t('auth.password', { defaultValue: 'Password' })}
            <div className="mt-2 flex items-center gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="inline-flex items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300"
                aria-label={
                  showPassword
                    ? t('auth.hide_password', { defaultValue: 'Hide' })
                    : t('auth.show_password', { defaultValue: 'Show' })
                }
              >
                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
              </button>
            </div>
          </label>

          {error && <p className="text-xs text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-md border border-orange-600 bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:border-orange-700 hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting
              ? t('auth.signing_in', { defaultValue: 'Signing in...' })
              : t('auth.sign_in', { defaultValue: 'Sign In' })}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
