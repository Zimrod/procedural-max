'use client';

import { useState } from 'react';

interface PayButtonProps {
  amount: number;
  title?: string;
  email?: string;
}

export default function PayButton({
  amount,
  title = 'Purchase Item',
  email = 'customer@example.com',
}: PayButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount, title }),
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
      disabled={loading}
      style={{
        padding: '12px 24px',
        backgroundColor: '#00875A',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: 'bold',
      }}
    >
      {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
    </button>
  );
}