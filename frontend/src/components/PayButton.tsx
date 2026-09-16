'use client';

import { useState } from 'react';

export default function PayButton() {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', { method: 'POST' });
      const data = await res.json();

      if (data.success && data.redirectUrl) {
        // Redirect browser to Paynow hosted payment page
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
      {loading ? '+...' : '+'}
    </button>
  );
}