// app/api/user/credits/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const JWT_SECRET = process.env.JWT_SECRET!;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const { data: user, error } = await supabase
      .from('users')
      .select('credits, ai_tokens') // 👈 Added ai_tokens here
      .eq('id', decoded.userId)
      .maybeSingle();

    if (error || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      credits: user.credits ?? 0,
      ai_tokens: user.ai_tokens ?? 50 // 👈 Return ai_tokens in payload
    });
  } catch (error) {
    console.error('Credits error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}