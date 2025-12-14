'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/lib/services';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <header className="px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="Nexus" className="w-10 h-10" />
            <span className="text-xl font-bold text-[#e60023]">Nexus</span>
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-3">Check your email</h1>
              <p className="text-gray-600">
                We sent password reset instructions to <strong>{email}</strong>
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl mb-6">
              <p className="text-sm text-gray-700 mb-2">Didn't receive the email?</p>
              <ul className="text-sm text-gray-600 text-left space-y-1">
                <li>• Check your spam folder</li>
                <li>• Verify the email address is correct</li>
                <li>• Wait a few minutes and try again</li>
              </ul>
            </div>

            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-gray-900 font-semibold hover:text-gray-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-4 py-6">
        <Link href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/logo.svg" alt="Nexus" className="w-10 h-10" />
          <span className="text-xl font-bold text-[#e60023]">Nexus</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">Forgot password?</h1>
            <p className="text-gray-600">Enter your email to reset your password</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#e60023] focus:ring-4 focus:ring-[#e60023]/10 transition-all"
                placeholder="Email address"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#e60023] hover:bg-[#ad081b] disabled:bg-[#e60023]/50 text-white font-semibold rounded-full transition-colors disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Back to login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
