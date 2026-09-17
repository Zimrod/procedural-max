// route.ts
import { NextResponse } from 'next/server';
const { Paynow } = require('paynow');

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const customerEmail = body.email;
    const rawAmount = Number(body.amount);
    const itemTitle = body.title || 'Purchase Item';

    // Validate payment amount
    if (isNaN(rawAmount) || rawAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'A valid payment amount is required.' },
        { status: 400 }
      );
    }

    const amount = Number(rawAmount.toFixed(2));
    const testMode = process.env.PAYNOW_TEST_MODE === 'true';
    const merchantAccountEmail = process.env.PAYNOW_MERCHANT_EMAIL;

    if (testMode && !merchantAccountEmail) {
      throw new Error('PAYNOW_MERCHANT_EMAIL is not configured');
    }

    if (!testMode && (!customerEmail || typeof customerEmail !== 'string')) {
      return NextResponse.json(
        { success: false, error: 'Customer email is required for checkout.' },
        { status: 400 }
      );
    }

    const paymentEmail = testMode ? merchantAccountEmail! : customerEmail;

    const paynow = new Paynow(
      process.env.PAYNOW_INTEGRATION_ID!,
      process.env.PAYNOW_INTEGRATION_KEY!
    );

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    paynow.resultUrl = `${baseUrl}/api/paynow/update`;
    paynow.returnUrl = `${baseUrl}/payment-status`;

    const payment = paynow.createPayment(
      `ORDER-${Date.now()}`,
      paymentEmail
    );

    // Pass dynamic title and amount
    payment.add(itemTitle, amount);

    const response = await paynow.send(payment);

    if (response.success) {
      return NextResponse.json({
        success: true,
        redirectUrl: response.redirectUrl,
        pollUrl: response.pollUrl,
        status: response.status,
        testMode,
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