import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { RegisterForm } from '@/components/auth/register-form'
import Header from '@/components/header'

export default async function RegisterPage() {
  // Check if user is already logged in
  const session = await getServerSession(authOptions)
  
  if (session?.user) {
    // Redirect based on user role
    if (session.user.role === 'ADMIN') {
      redirect('/admin')
    } else if (session.user.role === 'BUYER') {
      redirect('/buyer/dashboard')
    } else if (session.user.role === 'SELLER') {
      redirect('/seller/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Join Caenhebo Alpha
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          The future of real estate transactions in Portugal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <RegisterForm />
        
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                Already have an account?
              </span>
            </div>
          </div>

          <div className="mt-6">
            <a
              href="/auth/signin"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-blue-600 bg-white hover:bg-gray-50 border-gray-300"
            >
              Sign in to your account
            </a>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}