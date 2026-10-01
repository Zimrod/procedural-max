export const dynamic = 'force-dynamic';

import { Resend } from 'resend';
import { NextResponse } from 'next/server';

// We move the initialization inside the function to avoid build-time errors
export async function POST(request: Request) {
  // Check for the key inside the handler
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.error("RESEND_API_KEY is missing from environment variables.");
    return NextResponse.json({ error: "Configuration Error" }, { status: 500 });
  }

  const resend = new Resend(apiKey);

  try {
    const event = await request.json();

    if (event.type === 'email.received') {
      const emailId = event.data.email_id;
      const { data, error } = await resend.emails.get(emailId);

      if (error || !data) {
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
      }

      await resend.emails.send({
        from: 'admin@journey18miles.com', 
        to: 'tumaikr@gmail.com',
        subject: `Fwd: ${data.subject}`,
        html: `<p><strong>From:</strong> ${data.from}</p><hr />${data.html}`,
      });
    }

    return NextResponse.json({ processed: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}