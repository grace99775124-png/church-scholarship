import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'

interface SessionData {
  isLoggedIn: boolean
}

const sessionOptions = {
  password: process.env.SESSION_SECRET ?? 'church-scholarship-secret-key-2026-change-in-production',
  cookieName: 'church-scholarship-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // /admin/login은 인증 없이 접근 가능
  if (!pathname.startsWith('/admin') || pathname.startsWith('/admin/login')) {
    return NextResponse.next()
  }

  // /admin/* 경로는 로그인 필요
  const response = NextResponse.next()
  const session = await getIronSession<SessionData>(request, response, sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  return response
}
