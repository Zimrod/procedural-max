// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';
import crypto from 'crypto';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;
    const appUrl = (process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin).replace(/\/$/, '');

    // 1️⃣ Validate input parameters
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // 2️⃣ Check if user already exists (Selecting email_verified to check status)
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email, email_verified, credits')
      .eq('email', email)
      .maybeSingle();

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }

    // Initialize Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    // 3️⃣ Scenario A: User exists but is UNVERIFIED. 
    // Trigger fresh token link generation without showing "User already exists".
    if (existingUser && !existingUser.email_verified) {
      console.log(`✉️ Resending verification link for existing unverified user: ${email}`);
      
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Update the unverified user with the new token details
      const { error: updateError } = await supabase
        .from('users')
        .update({
          verification_token: verificationToken,
          verification_token_expires: expiresAt.toISOString(),
        })
        .eq('id', existingUser.id);

      if (updateError) {
        console.error('Supabase token update error:', updateError);
        return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 });
      }

      // Dispatch the email through Resend
      await resend.emails.send({
        from: 'Journey 18 Miles <admin@journey18miles.com>',
        to: email,
        subject: 'Verify your email',
        html: `
          <p>Thanks for signing up!</p>
          <p>Click the link below to verify your email address:</p>
          <a href="${appUrl}/verify?token=${encodeURIComponent(verificationToken)}">
            Verify Email
          </a>
          <p>This link expires in 24 hours.</p>
        `,
      });

      return NextResponse.json(
        { 
          success: true, 
          status: 'UNVERIFIED_RESENT', 
          message: 'A fresh verification link has been sent to your email address.' 
        }, 
        { status: 200 }
      );
    }

    // 4️⃣ Scenario B: User exists and is ALREADY VERIFIED. Reject registration.
    if (existingUser && existingUser.email_verified) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      );
    }

    // 5️⃣ Scenario C: Brand new signup workflow
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert new user profile immediately with its corresponding token verification properties
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name: name || null,
        email_verified: false,
        verification_token: verificationToken,
        verification_token_expires: expiresAt.toISOString(),
        created_at: new Date().toISOString(),
      })
      .select('id, email, name')
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Send verification email to the new user via Resend
    await resend.emails.send({
      from: 'Journey 18 Miles <admin@journey18miles.com>',
      to: email,
      subject: 'Verify your email',
      html: `
        <p>Thanks for signing up!</p>
        <p>Click the link below to verify your email address:</p>
        <a href="${appUrl}/verify?token=${encodeURIComponent(verificationToken)}">
          Verify Email
        </a>
        <p>This link expires in 24 hours.</p>
      `,
    });

    return NextResponse.json(
      {
        success: true,
        status: 'NEW_REGISTRATION',
        message: 'Registration successful! Please check your email to verify your account.',
        user: { id: newUser.id, email: newUser.email },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration processing exception caught:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
