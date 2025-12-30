import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, LockIcon, CheckCircleIcon } from 'lucide-react';
export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Simple validation
    if (!password || !confirmPassword) {
      setError('Please enter both password fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    // This is a mock submission - in a real app, you would call an API
    setSubmitted(true);
  };
  const handleReturn = () => {
    navigate('/login');
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-blue-50 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-soft p-8">
          <div className="mb-6">
            <Link to="/login" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              <ArrowLeftIcon size={16} className="mr-2" />
              Back to login
            </Link>
          </div>
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold mx-auto mb-4">
              DC
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reset Your Password
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Create a new password for your account
            </p>
          </div>
          {!submitted ? <>
              {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm dark:bg-red-900/30 dark:text-red-300">
                  {error}
                </div>}
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="password" className="label">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
                      <LockIcon size={18} />
                    </span>
                    <input id="password" type="password" className="input pl-10" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Password must be at least 8 characters
                  </p>
                </div>
                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="label">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 dark:text-gray-500">
                      <LockIcon size={18} />
                    </span>
                    <input id="confirmPassword" type="password" className="input pl-10" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                </div>
                <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-colors shadow-sm">
                  Reset Password
                </button>
              </form>
            </> : <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Password Reset Successfully
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                Your password has been successfully reset. You can now use your
                new password to log in to your account.
              </p>
              <button onClick={handleReturn} className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-colors shadow-sm">
                Return to Login
              </button>
            </div>}
        </div>
      </div>
    </div>;
};