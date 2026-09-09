import { NextResponse } from 'next/server';
const { Paynow } = require('paynow');

export async function POST() {
  try {
    const paynow = new Paynow(
      process.env.PAYNOW_INTEGRATION_ID!,
      process.env.PAYNOW_INTEGRATION_KEY!
    );

    // Dynamic callback URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    paynow.resultUrl = `${baseUrl}/api/paynow/update`;
    paynow.returnUrl = `${baseUrl}/payment-status`;

    // Create test payment with reference & test email
    const payment = paynow.createPayment(
      `TEST-ORDER-${Date.now()}`,
      'admin@journey18miles.com'
    );

    // Add a test item
    payment.add('Test Purchase Item', 1.00);

    // Initiate transaction
    const response = await paynow.send(payment);

    if (response.success) {
      return NextResponse.json({
        success: true,
        redirectUrl: response.redirectUrl,
        pollUrl: response.pollUrl,
      });
    }

    return NextResponse.json(
      { success: false, error: response.error || 'Failed to initialize payment' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}