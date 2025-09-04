'use client'

import Header from '@/components/header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { FileText, Shield, Scale, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function LegalPage() {
  const router = useRouter()
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <h1 className="text-3xl font-bold mb-8">Legal Documents</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/legal/terms">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Scale className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">Terms and Conditions</h2>
                    <p className="text-gray-600 text-sm mb-4">
                      Read our terms of service, user agreements, and platform rules
                    </p>
                    <p className="text-xs text-gray-500">
                      Last updated: September 1, 2025
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/legal/privacy">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Shield className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">Privacy Policy</h2>
                    <p className="text-gray-600 text-sm mb-4">
                      Learn how we collect, use, and protect your personal data
                    </p>
                    <p className="text-xs text-gray-500">
                      Last updated: September 1, 2025
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/legal/landing-terms">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">Landing Page Terms</h2>
                    <p className="text-gray-600 text-sm mb-4">
                      Simplified terms for Web Summit 2025 property submissions
                    </p>
                    <p className="text-xs text-gray-500">
                      Last updated: September 1, 2025
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <FileText className="h-6 w-6 text-gray-600 mt-1" />
              <div>
                <h3 className="text-lg font-semibold mb-2">Need Help?</h3>
                <p className="text-gray-600 mb-4">
                  If you have any questions about our legal documents or need clarification on any terms, 
                  please don't hesitate to contact us.
                </p>
                <p className="text-sm">
                  Email: <a href="mailto:support@caenhebo.com" className="text-blue-600 hover:underline">support@caenhebo.com</a>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}