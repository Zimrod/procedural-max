'use client';

import { useState } from 'react';
import { useAuth } from './AuthContext';

interface PayButtonProps {
  amount: number;
  title?: string;
}

export default function PayButton({
  amount,
  title = 'Purchase Item',
}: PayButtonProps) {
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const handlePayment = async () => {
    if (!user?.email) {
      alert('Please log in before making a payment.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, amount, title }),
      });

      const data = await res.json();

      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        alert(`Payment error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error connecting to payment endpoint.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading || authLoading}
      style={{
        padding: '4px 6px',
        backgroundColor: '#ffae00',
        color: '#2e2828',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: 'bold',
        fontSize: '12px',
      }}
    >
      {loading ? 'Processing...' : `$${amount.toFixed(2)}`}
    </button>
  );
}
