export default function PaymentStatusPage() {
  return (
    <main
      style={{
        maxWidth: 640,
        margin: '80px auto',
        padding: '0 24px',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
      }}
    >
      <h1>Payment returned successfully</h1>
      <p>
        Paynow has returned you to the application. The final payment status
        is confirmed by Paynow&apos;s server callback, not by this page alone.
      </p>
      <a href="/">Return to the application</a>
    </main>
  );
}
