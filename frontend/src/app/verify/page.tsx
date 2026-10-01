// app/verify/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          setMessage('Email verified! You can now log in.');
          setTimeout(() => router.push('/'), 3000);
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed.');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      });
  }, [token, router]);

  return (
    <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
      <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
      {status === 'loading' && <p>Verifying your email…</p>}
      {status === 'success' && <p className="text-green-600">{message}</p>}
      {status === 'error' && <p className="text-red-600">{message}</p>}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Suspense
        fallback={
          <div className="bg-white p-8 rounded-xl shadow-md max-w-md w-full text-center">
            <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
            <p className="text-gray-500">Loading verification details…</p>
          </div>
        }
      >
        <VerifyContent />
      </Suspense>
    </div>
  );
}