// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    const appUrl = (process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin).replace(/\/$/, '');

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (error || !user) {
      // Don't reveal if email exists – security best practice
      return NextResponse.json({ message: 'Check your email for a reset link.' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await supabase
      .from('users')
      .update({
        reset_token: resetToken,
        reset_token_expires: expiresAt,
      })
      .eq('id', user.id);

    // Send reset email
    await resend.emails.send({
      from: 'Journey 18 Miles <admin@journey18miles.com>',
      to: email,
      subject: 'Reset your password',
      html: `
        <p>Click the link below to reset your password:</p>
        <a href="${appUrl}/forgot-password?token=${encodeURIComponent(resetToken)}">
          Reset Password
        </a>
        <p>This link expires in 1 hour.</p>
      `,
    });

    return NextResponse.json({ message: 'Check your email for a reset link.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
