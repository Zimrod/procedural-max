import { NextResponse } from 'next/server';
const { Paynow } = require('paynow');

/** Receives Paynow's asynchronous transaction status notification. */
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const values: Record<string, string> = {};
    form.forEach((value, key) => {
      values[key] = value.toString();
    });

    const paynow = new Paynow(
      process.env.PAYNOW_INTEGRATION_ID!,
      process.env.PAYNOW_INTEGRATION_KEY!
    );

    if (!paynow.verifyHash(values)) {
      return new NextResponse('Invalid hash', { status: 400 });
    }

    // TODO: Persist values.reference/status in the order table when orders are
    // added. For now this confirms that Paynow's callback reached the app.
    console.info('Paynow transaction update', {
      reference: values.reference,
      status: values.status,
      paynowReference: values.paynowreference,
    });

    return new NextResponse('OK');
  } catch (error) {
    console.error('Paynow callback failed', error);
    return new NextResponse('Invalid callback', { status: 400 });
  }
}
