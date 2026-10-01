// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and new password are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    // 1. Fetch user by valid token that has not expired
    const { data: user, error } = await supabase
      .from('users')
      .select('id, reset_token_expires')
      .eq('reset_token', token)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid or expired reset token.' }, { status: 400 });
    }

    // 2. Check token expiration
    if (new Date(user.reset_token_expires).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Reset token has expired. Please request a new one.' }, { status: 400 });
    }

    // 3. Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Update password and clear reset token fields
    const { error: updateError } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expires: null,
      })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update password.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully!' });
  } catch (err) {
    console.error('Reset password route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}