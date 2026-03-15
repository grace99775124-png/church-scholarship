import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-sm border p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-1">관리자 로그인</h1>
        <p className="text-sm text-gray-500 mb-6">교회 장학금 관리시스템</p>
        <LoginForm />
      </div>
    </div>
  )
}
