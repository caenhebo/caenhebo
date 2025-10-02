'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function SupportPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Redirect if not authenticated
  if (status === 'unauthenticated') {
    router.push('/auth/signin?callbackUrl=/support')
    return null
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!subject.trim() || !message.trim()) {
      setError('Please fill in all fields.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit support request')
      }

      setSuccess(true)
      setSubject('')
      setMessage('')

      // Redirect to home after 3 seconds
      setTimeout(() => {
        router.push('/')
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Contact Support</h1>
          <p className="mt-2 text-gray-600">
            We're here to help. Send us a message and we'll get back to you as soon as possible.
          </p>
        </div>

        <Card className="p-6 md:p-8">
          {success ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Message Sent Successfully!
              </h3>
              <p className="text-gray-600">
                Thank you for contacting us. We'll respond to your request shortly.
              </p>
              <p className="text-sm text-gray-500 mt-4">Redirecting to home page...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={session?.user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This is automatically filled from your account
                </p>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  maxLength={200}
                  required
                  placeholder="Brief description of your issue"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {subject.length}/200 characters
                </p>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={5000}
                  required
                  rows={8}
                  placeholder="Please describe your issue or question in detail..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="mt-1 text-xs text-gray-500">
                  {message.length}/5000 characters
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            You can also reach us directly at{' '}
            <a href="mailto:support@caenheborealestate.zendesk.com" className="text-blue-600 hover:underline">
              support@caenheborealestate.zendesk.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
