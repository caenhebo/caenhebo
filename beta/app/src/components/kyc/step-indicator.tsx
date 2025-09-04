'use client'

import { CheckCircle, Circle } from 'lucide-react'

interface StepIndicatorProps {
  currentStep: 1 | 2 | 3 | 4
}

const steps = [
  { number: 1, title: 'Personal Information' },
  { number: 2, title: 'Email Verification' },
  { number: 3, title: 'Mobile Verification' },
  { number: 4, title: 'Identity Verification' }
]

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  step.number < currentStep
                    ? 'bg-green-500 border-green-500 text-white'
                    : step.number === currentStep
                    ? 'bg-primary border-primary text-white'
                    : 'bg-white border-gray-300 text-gray-500'
                }`}
              >
                {step.number < currentStep ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <span className="text-sm font-semibold">{step.number}</span>
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  step.number <= currentStep ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-full h-1 mx-2 transition-colors ${
                  step.number < currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
                style={{ minWidth: '50px', maxWidth: '150px' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}