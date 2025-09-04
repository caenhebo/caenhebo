'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Check, AlertCircle, RefreshCw, Users } from 'lucide-react'

export default function StrigaConfig() {
  const [config, setConfig] = useState({
    applicationId: '',
    apiKey: '',
    apiSecret: '',
    uiSecret: '',
    baseUrl: 'https://www.sandbox.striga.com/api/v1',
    webhookSecret: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [syncResults, setSyncResults] = useState<any[]>([])

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/striga-config')
      if (response.ok) {
        const data = await response.json()
        setConfig(data)
      }
    } catch (error) {
      console.error('Failed to fetch config:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)
    
    try {
      const response = await fetch('/api/admin/striga-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Striga API configuration saved successfully!' })
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.message || 'Failed to save configuration' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save configuration' })
    } finally {
      setIsSaving(false)
    }
  }

  const testConnection = async () => {
    setMessage(null)
    setIsSaving(true)
    
    try {
      const response = await fetch('/api/admin/striga-test', {
        method: 'POST',
      })

      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Connection successful! Striga API is working correctly.' })
      } else {
        setMessage({ type: 'error', text: data.error || 'Connection failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to test connection' })
    } finally {
      setIsSaving(false)
    }
  }

  const syncUsers = async () => {
    setMessage(null)
    setIsSyncing(true)
    setSyncResults([])
    
    try {
      const response = await fetch('/api/admin/sync-striga', {
        method: 'POST',
      })

      const data = await response.json()
      
      if (response.ok) {
        setSyncResults(data.results || [])
        const successCount = data.results.filter((r: any) => r.success).length
        const totalCount = data.results.length
        setMessage({ 
          type: 'success', 
          text: `Sync completed! ${successCount} of ${totalCount} users synced successfully.` 
        })
      } else {
        setMessage({ type: 'error', text: data.error || 'Sync failed' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to sync users' })
    } finally {
      setIsSyncing(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Striga API Configuration</CardTitle>
          <CardDescription>
            Configure your Striga API credentials for payment processing and KYC verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.type === 'success' ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="applicationId">Application ID</Label>
            <Input
              id="applicationId"
              type="text"
              placeholder="Enter your Striga Application ID"
              value={config.applicationId}
              onChange={(e) => setConfig({ ...config, applicationId: e.target.value })}
            />
            <p className="text-sm text-gray-500">Your Striga Application ID</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your Striga API key"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
            />
            <p className="text-sm text-gray-500">Your Striga API key for authentication</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiSecret">API Secret</Label>
            <Input
              id="apiSecret"
              type="password"
              placeholder="Enter your Striga API secret"
              value={config.apiSecret}
              onChange={(e) => setConfig({ ...config, apiSecret: e.target.value })}
            />
            <p className="text-sm text-gray-500">Your Striga API secret for signing requests</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="uiSecret">UI Secret</Label>
            <Input
              id="uiSecret"
              type="password"
              placeholder="Enter your Striga UI secret"
              value={config.uiSecret}
              onChange={(e) => setConfig({ ...config, uiSecret: e.target.value })}
            />
            <p className="text-sm text-gray-500">Your Striga UI secret for frontend integrations</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="baseUrl">API Base URL</Label>
            <Input
              id="baseUrl"
              type="url"
              placeholder="https://www.sandbox.striga.com/api/v1"
              value={config.baseUrl}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
            />
            <p className="text-sm text-gray-500">
              Use sandbox URL for testing: https://www.sandbox.striga.com/api/v1
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhookSecret">Webhook Secret</Label>
            <Input
              id="webhookSecret"
              type="password"
              placeholder="Enter your webhook secret"
              value={config.webhookSecret}
              onChange={(e) => setConfig({ ...config, webhookSecret: e.target.value })}
            />
            <p className="text-sm text-gray-500">Secret for verifying webhook signatures</p>
          </div>

          <div className="flex gap-4">
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </Button>
            
            <Button 
              onClick={testConnection}
              variant="secondary"
              disabled={isSaving || !config.apiKey || !config.apiSecret}
            >
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Configuration</CardTitle>
          <CardDescription>Configure Striga to send webhooks to your platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>Webhook URL</Label>
              <div className="mt-1 p-3 bg-gray-100 rounded-md font-mono text-sm">
                http://95.179.170.56:3019/api/webhooks/striga
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Add this URL to your Striga webhook configuration
              </p>
            </div>
            
            <div>
              <Label>Required Events</Label>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>• KYC Status Updates</li>
                <li>• Transaction Status Changes</li>
                <li>• Wallet Events</li>
                <li>• Payment Confirmations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Synchronization</CardTitle>
          <CardDescription>
            Sync local user data with Striga to ensure KYC status and user IDs are up to date
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={syncUsers}
              disabled={isSyncing}
              className="flex items-center gap-2"
            >
              {isSyncing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Syncing Users...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Sync Users with Striga
                </>
              )}
            </Button>
          </div>

          {syncResults.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Sync Results:</h4>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {syncResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg text-sm ${
                      result.success 
                        ? 'bg-green-50 border border-green-200 text-green-800'
                        : 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                    }`}
                  >
                    <div className="font-medium">{result.email}</div>
                    <div className="text-xs mt-1">{result.message}</div>
                    {result.details && result.details.strigaUserId && (
                      <div className="text-xs mt-1 font-mono">
                        ID: {result.details.strigaUserId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> This will check all users in the database against Striga. 
              Users must already exist in Striga for the sync to work. If a user doesn't have a 
              Striga ID, they need to complete the registration process first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}