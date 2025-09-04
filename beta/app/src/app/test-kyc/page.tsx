'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function TestKycPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const testStrigaConnection = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      const response = await fetch('/api/admin/striga-test', {
        method: 'POST'
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Connection test failed')
      }
      
      setResult({ success: true, message: 'Striga connection successful!' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed')
    } finally {
      setLoading(false)
    }
  }

  const createTestUser = async () => {
    setLoading(true)
    setError('')
    setResult(null)
    
    try {
      const testData = {
        firstName: 'Test',
        lastName: 'User',
        email: `test${Date.now()}@example.com`,
        phoneNumber: '+351 900 000 000',
        dateOfBirth: '1990-01-01',
        address: {
          addressLine1: 'Test Street 123',
          city: 'Lisbon',
          postalCode: '1000-000',
          country: 'PT'
        }
      }
      
      const response = await fetch('/api/kyc/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'User creation failed')
      }
      
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">KYC Test Page</h1>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Test Striga Connection</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={testStrigaConnection} disabled={loading}>
                {loading ? 'Testing...' : 'Test Connection'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Step 2: Create Test User & Start KYC</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={createTestUser} disabled={loading}>
                {loading ? 'Creating...' : 'Create Test User'}
              </Button>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Result</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-100 p-4 rounded overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}