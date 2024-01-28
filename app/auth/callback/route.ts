import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')

  if (code) {
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) throw error
    } catch (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(new URL('/error', req.url))
    }
  }

  return NextResponse.redirect(new URL('/account', req.url))
}