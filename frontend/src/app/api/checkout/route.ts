// route.ts
import { NextResponse } from 'next/server';
const { Paynow } = require('paynow');

export async function POST(request: Request) {
  try {
    const paynow = new Paynow(
      process.env.PAYNOW_INTEGRATION_ID!,
      process.env.PAYNOW_INTEGRATION_KEY!
    );

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    paynow.resultUrl = `${baseUrl}/api/paynow/update`;
    paynow.returnUrl = `${baseUrl}/payment-status`;

    // In test mode this must be the email address used to log into Paynow.
    // Do not silently fall back to an address: Paynow will reject fake payments
    // when authemail does not belong to the merchant account being tested.
    const merchantAccountEmail = process.env.PAYNOW_MERCHANT_EMAIL;
    if (!merchantAccountEmail) {
      throw new Error('PAYNOW_MERCHANT_EMAIL is not configured');
    }

    const payment = paynow.createPayment(
      `TEST-ORDER-${Date.now()}`,
      merchantAccountEmail
    );

    payment.add('Test Purchase Item', 1.00);

    const testMode = process.env.PAYNOW_TEST_MODE === 'true';

    // Hosted checkout is the correct default for testing. The VMC express
    // endpoint requires Paynow to explicitly permit tokenized transactions
    // for the merchant, so do not use it unless Paynow has enabled that flag.
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
