import { OnboardingForm } from '@/components/onboarding/onboarding-form'

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            Welcome to Caenhebo Alpha
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Let's complete your profile to get started
          </p>
        </div>

        <OnboardingForm />

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            By completing this form, you agree to our partnership with Striga for secure payment processing.
            Your data is encrypted and handled according to European GDPR regulations.
          </p>
        </div>
      </div>
    </div>
  )
}