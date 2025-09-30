'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Wallet, ArrowRight, Check, Clock, Upload, Copy, CheckCheck, DollarSign, CheckCircle2 } from 'lucide-react'

interface FundProtectionBuyerProps {
  transactionId: string
}

export function FundProtectionBuyer({ transactionId }: FundProtectionBuyerProps) {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const [isTransferring, setIsTransferring] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10000) // Poll every 10 seconds
    return () => clearInterval(interval)
  }, [transactionId])

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/transactions/${transactionId}/fund-protection/status`)
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Failed to fetch status:', error)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedAddress(true)
    setTimeout(() => setCopiedAddress(false), 2000)
  }

  const handleTransferToSeller = async () => {
    setIsTransferring(true)
    try {
      const response = await fetch(`/api/transactions/${transactionId}/fund-protection/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Transfer failed')
      }

      alert('Transfer completed successfully!')
      fetchStatus() // Refresh status
    } catch (error: any) {
      console.error('Transfer error:', error)
      alert(error.message || 'Transfer failed')
    } finally {
      setIsTransferring(false)
    }
  }

  const handleUploadProof = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png,image/jpg,application/pdf'

    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return

      setIsUploading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch(`/api/transactions/${transactionId}/fund-protection/upload-fiat`, {
          method: 'POST',
          body: formData
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Upload failed')
        }

        alert('Proof uploaded successfully!')
        fetchStatus() // Refresh status
      } catch (error: any) {
        console.error('Upload error:', error)
        alert(error.message || 'Upload failed')
      } finally {
        setIsUploading(false)
      }
    }

    input.click()
  }

  if (loading) {
    return <div className="text-center py-8">Loading fund protection status...</div>
  }

  // If no status data yet
  if (!status) {
    return <div className="text-center py-8">Loading payment information...</div>
  }

  // If no steps exist, show currency selection for crypto payment
  if (status.steps.length === 0) {
    // For FIAT-only, show bank details immediately and let them upload
    if (status.paymentMethod === 'FIAT') {
      const agreedPrice = parseFloat(status.transaction?.agreedPrice || '0')

      return (
        <div className="space-y-6">
          {/* Overall Process Explanation */}
          <Card className="border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-white">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-3">
                <Wallet className="h-8 w-8 text-blue-600" />
                💰 Bank Transfer Payment
              </CardTitle>
              <CardDescription className="text-base mt-2">
                Transfer the money to the seller's bank account, then upload proof
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 mb-1">Transfer Money</h4>
                      <p className="text-sm text-gray-600">
                        Make a bank transfer to the seller's account using the IBAN below
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-900 mb-1">Upload Proof</h4>
                      <p className="text-sm text-gray-600">
                        Take a screenshot of your transfer confirmation and upload it here
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seller Bank Details */}
          {status.sellerBankDetails && (
            <Card className="border-4 border-green-500 shadow-lg">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-xl flex items-center gap-2">
                  <DollarSign className="h-6 w-6 text-green-600" />
                  💳 Seller's Bank Account
                </CardTitle>
                <CardDescription>Transfer funds to this account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {status.sellerBankDetails.iban && (
                  <div className="bg-white p-4 rounded border-2 border-green-300">
                    <div className="text-xs text-gray-600 mb-2 font-semibold">IBAN</div>
                    <div className="font-mono text-lg font-bold flex items-center justify-between">
                      <span className="break-all">{status.sellerBankDetails.iban}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="ml-3 flex-shrink-0"
                        onClick={() => {
                          copyToClipboard(status.sellerBankDetails.iban)
                        }}
                      >
                        {copiedAddress ? <CheckCheck className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}

                {status.sellerBankDetails.accountHolderName && (
                  <div className="bg-white p-4 rounded border-2 border-green-300">
                    <div className="text-xs text-gray-600 mb-2 font-semibold">Account Holder</div>
                    <div className="font-medium text-base">{status.sellerBankDetails.accountHolderName}</div>
                  </div>
                )}

                {status.sellerBankDetails.bankName && (
                  <div className="bg-white p-4 rounded border-2 border-green-300">
                    <div className="text-xs text-gray-600 mb-2 font-semibold">Bank Name</div>
                    <div className="font-medium text-base">{status.sellerBankDetails.bankName}</div>
                  </div>
                )}

                <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded border-2 border-green-400">
                  <div className="text-xs text-gray-600 mb-2 font-semibold">Amount to Transfer</div>
                  <div className="text-3xl font-bold text-green-600">
                    €{agreedPrice.toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Alert className="bg-yellow-50 border-yellow-300 border-2">
            <AlertDescription className="text-yellow-900 text-sm">
              <strong className="block mb-2 text-base">📝 Instructions:</strong>
              <ol className="list-decimal list-inside space-y-2">
                <li>Log into your online banking</li>
                <li>Make a transfer to the IBAN above for the exact amount</li>
                <li>Take a screenshot of the confirmation screen</li>
                <li>Click the button below to upload your proof</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Upload Button */}
          <Card className="border-2 border-purple-400">
            <CardHeader className="bg-purple-50">
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-purple-600" />
                Step 2: Upload Payment Proof
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <Button
                className="w-full"
                size="lg"
                onClick={handleUploadProof}
                disabled={isUploading}
              >
                <Upload className="h-5 w-5 mr-2" />
                {isUploading ? 'Uploading...' : 'Upload Payment Proof'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    // For CRYPTO or HYBRID - show currency selection
    const availableCurrencies = status.buyerWallets?.filter((w: any) =>
      ['BTC', 'ETH', 'USDT', 'USDC'].includes(w.currency)
    ) || []

    if (availableCurrencies.length === 0) {
      return (
        <Alert variant="destructive">
          <AlertDescription>
            No cryptocurrency wallets found. Please contact support.
          </AlertDescription>
        </Alert>
      )
    }

    const handleInitializePayment = async () => {
      if (!selectedCurrency) {
        alert('Please select a cryptocurrency')
        return
      }

      setIsInitializing(true)
      try {
        const response = await fetch(`/api/transactions/${transactionId}/fund-protection/initialize`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currency: selectedCurrency })
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error || 'Failed to initialize')
        }

        alert('Payment initialized! You can now proceed.')
        fetchStatus()
      } catch (error: any) {
        alert(error.message || 'Failed to initialize payment')
      } finally {
        setIsInitializing(false)
      }
    }

    return (
      <div className="space-y-6">
        <Alert className="bg-blue-50 border-blue-500 border-2">
          <Wallet className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong className="text-lg block mb-2">🔹 STEP 1: Choose Your Payment Currency</strong>
            <p className="text-sm">
              You need to pay <strong>50% in cryptocurrency and 50% via bank transfer</strong>.<br/>
              First, select which cryptocurrency you want to use for your payment below.
            </p>
          </AlertDescription>
        </Alert>

        <Card className="border-2 border-blue-300">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-xl">Select Cryptocurrency</CardTitle>
            <CardDescription>
              Click on one of the options below to choose your payment currency
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-2 gap-4">
              {availableCurrencies.map((wallet: any) => (
                <Button
                  key={wallet.currency}
                  variant={selectedCurrency === wallet.currency ? 'default' : 'outline'}
                  className={`h-24 flex flex-col justify-center ${
                    selectedCurrency === wallet.currency
                      ? 'bg-blue-600 hover:bg-blue-700 border-4 border-blue-400'
                      : 'border-2'
                  }`}
                  onClick={() => setSelectedCurrency(wallet.currency)}
                >
                  <span className="text-xl font-bold">{wallet.currency}</span>
                  <span className="text-sm mt-1">Your Balance: {wallet.balance || '0'}</span>
                </Button>
              ))}
            </div>

            {selectedCurrency && (
              <div className="pt-4 border-t-2">
                <Alert className="bg-green-50 border-green-300 mb-4">
                  <AlertDescription className="text-green-900">
                    ✅ You selected <strong>{selectedCurrency}</strong>. Click the button below to continue.
                  </AlertDescription>
                </Alert>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                  onClick={handleInitializePayment}
                  disabled={isInitializing}
                >
                  {isInitializing ? 'Setting up payment...' : `Continue with ${selectedCurrency}`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentStep = status.currentStep
  const progress = status.progress

  // For buyer, count only BUYER steps (they don't wait for seller confirmation)
  const buyerSteps = status.steps.filter((s: any) => s.userType === 'BUYER')
  const buyerCompletedSteps = buyerSteps.filter((s: any) => s.status === 'COMPLETED')
  const buyerProgress = buyerSteps.length > 0 ? Math.round((buyerCompletedSteps.length / buyerSteps.length) * 100) : 0
  const allBuyerStepsDone = buyerCompletedSteps.length === buyerSteps.length

  return (
    <div className="space-y-6">
      {/* Overall Process Explanation */}
      <Card className="border-2 border-blue-400 bg-gradient-to-r from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-3">
            <Wallet className="h-8 w-8 text-blue-600" />
            💰 Payment Process Overview
          </CardTitle>
          <CardDescription className="text-base mt-2">
            Here's what you need to do to complete this payment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className={`bg-white p-4 rounded-lg border-2 shadow-sm ${buyerSteps[0]?.status === 'COMPLETED' ? 'border-green-400 bg-green-50' : 'border-blue-200'}`}>
              <div className="flex items-start gap-3">
                <div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0 ${buyerSteps[0]?.status === 'COMPLETED' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                  {buyerSteps[0]?.status === 'COMPLETED' ? '✓' : '1'}
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 mb-1">Transfer Money</h4>
                  <p className="text-sm text-gray-600">
                    Make a bank transfer to the seller's account using the IBAN provided below
                  </p>
                </div>
              </div>
            </div>
            <div className={`bg-white p-4 rounded-lg border-2 shadow-sm ${buyerSteps[0]?.status === 'COMPLETED' ? 'border-green-400 bg-green-50' : 'border-blue-200'}`}>
              <div className="flex items-start gap-3">
                <div className={`rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0 ${buyerSteps[0]?.status === 'COMPLETED' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                  {buyerSteps[0]?.status === 'COMPLETED' ? '✓' : '2'}
                </div>
                <div>
                  <h4 className="font-bold text-blue-900 mb-1">Upload Proof</h4>
                  <p className="text-sm text-gray-600">
                    Take a screenshot of your transfer confirmation and upload it here
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Overview - Buyer specific */}
      <Card className={allBuyerStepsDone ? 'border-2 border-green-500' : ''}>
        <CardHeader>
          <CardTitle className={allBuyerStepsDone ? 'text-green-700' : ''}>
            {allBuyerStepsDone ? '✅ Your Steps Complete!' : 'Your Progress'}
          </CardTitle>
          <CardDescription>
            {allBuyerStepsDone
              ? 'You\'ve completed all required steps'
              : `${buyerCompletedSteps.length} of ${buyerSteps.length} steps completed`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={buyerProgress} className={`h-2 ${allBuyerStepsDone ? 'bg-green-200' : ''}`} />
          <p className={`text-sm mt-2 ${allBuyerStepsDone ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
            {buyerProgress}% complete
          </p>
        </CardContent>
      </Card>

      {/* Waiting for Seller Confirmation */}
      {!status.needsUserAction && currentStep && currentStep.userType === 'SELLER' && (
        <Card className="border-4 border-green-500 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
              <div>
                <CardTitle className="text-2xl text-green-700">✅ Receipt Uploaded Successfully!</CardTitle>
                <CardDescription className="text-lg mt-1">
                  Your payment proof has been sent to the seller
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <Alert className="bg-blue-50 border-blue-300 border-2">
              <AlertDescription className="text-blue-900">
                <strong className="text-lg block mb-3">📋 What Happens Next:</strong>
                <div className="space-y-3 text-base">
                  <div className="flex gap-3">
                    <span className="font-bold text-blue-600">1.</span>
                    <p>The <strong>seller will receive a notification</strong> that you uploaded the payment proof</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-blue-600">2.</span>
                    <p>The seller will <strong>check their bank account</strong> to confirm they received your transfer</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-blue-600">3.</span>
                    <p>Once confirmed, the seller will click a button to <strong>confirm receipt of payment</strong></p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-blue-600">4.</span>
                    <p>The transaction will then <strong>move to the closing stage</strong></p>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Card className="border-2 border-yellow-300 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  ⏳ Current Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-900 font-medium">
                  Waiting for seller to confirm they received the €{currentStep.amount} payment in their bank account.
                </p>
                <p className="text-sm text-yellow-700 mt-2">
                  💡 This usually takes a few minutes to a few hours depending on when the seller checks their account.
                </p>
              </CardContent>
            </Card>

            <div className="text-center pt-4">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-green-100 text-green-800 font-medium">
                <CheckCircle2 className="h-5 w-5" />
                <span>No further action needed from you</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Action Required */}
      {status.needsUserAction && currentStep && (
        <Card className="border-blue-500 border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-blue-600">Action Required</CardTitle>
              <Badge className="bg-blue-500">Step {currentStep.stepNumber}</Badge>
            </div>
            <CardDescription>{currentStep.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStep.stepType === 'CRYPTO_DEPOSIT' && (
              <div className="space-y-4">
                <Alert className="bg-blue-50 border-blue-300">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <strong className="text-lg">STEP 1: Send Payment</strong><br/>
                    Send exactly <strong>{parseFloat(currentStep.amount).toFixed(8)} {currentStep.currency}</strong> from your personal crypto wallet to the address below.
                  </AlertDescription>
                </Alert>

                {(() => {
                  const matchingWallet = status.buyerWallets?.find((w: any) =>
                    w.currency === currentStep.currency
                  )

                  if (!matchingWallet || !matchingWallet.address) {
                    return (
                      <Alert variant="destructive">
                        <AlertDescription>
                          No {currentStep.currency} wallet address found. Please contact support.
                        </AlertDescription>
                      </Alert>
                    )
                  }

                  return (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <p className="font-medium">Your {currentStep.currency} Platform Wallet:</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-white p-2 rounded border text-xs break-all">
                          {matchingWallet.address}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(matchingWallet.address)}
                        >
                          {copiedAddress ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )
                })()}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Instructions:</strong>
                  </p>
                  <ol className="list-decimal list-inside text-sm text-blue-800 mt-2 space-y-1">
                    <li>Send {parseFloat(currentStep.amount).toFixed(8)} {currentStep.currency} from your external wallet</li>
                    <li>To the address shown above</li>
                    <li>We'll automatically detect the transfer</li>
                    <li>Wait for confirmation (usually 10-30 minutes)</li>
                  </ol>
                </div>
              </div>
            )}

            {currentStep.stepType === 'CRYPTO_TRANSFER' && (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-300">
                  <ArrowRight className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900">
                    <strong className="text-lg">STEP 2: Transfer to Seller</strong><br/>
                    Your deposit was received! Now click the button below to securely transfer <strong>{parseFloat(currentStep.amount).toFixed(8)} {currentStep.currency}</strong> to the seller.
                  </AlertDescription>
                </Alert>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-900">
                    <strong>What happens next:</strong>
                  </p>
                  <ul className="list-disc list-inside text-sm text-green-800 mt-2 space-y-1">
                    <li>Your platform wallet has sufficient balance</li>
                    <li>Click the button below to transfer to seller</li>
                    <li>Transfer is instant and secure</li>
                    <li>Seller will be notified immediately</li>
                  </ul>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleTransferToSeller}
                  disabled={isTransferring}
                >
                  {isTransferring ? 'Processing...' : `Transfer ${currentStep.amount} ${currentStep.currency} to Seller`}
                </Button>
              </div>
            )}

            {currentStep.stepType === 'FIAT_UPLOAD' && (
              <div className="space-y-4">
                <Alert className="bg-purple-50 border-purple-300">
                  <Upload className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-900">
                    <strong className="text-lg">Bank Transfer Required</strong><br/>
                    Transfer <strong>€{currentStep.amount}</strong> to the seller's bank account, then upload proof of payment.
                  </AlertDescription>
                </Alert>

                {/* Show Seller's Bank Details */}
                {status.sellerBankDetails && (
                  <Card className="border-2 border-blue-300 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-lg">Seller's Bank Details</CardTitle>
                      <CardDescription>Transfer the funds to this account</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {status.sellerBankDetails.iban && (
                        <div className="bg-white p-3 rounded border">
                          <div className="text-xs text-gray-600 mb-1">IBAN</div>
                          <div className="font-mono text-sm font-bold flex items-center justify-between">
                            <span>{status.sellerBankDetails.iban}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(status.sellerBankDetails.iban)
                                alert('IBAN copied to clipboard!')
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {status.sellerBankDetails.accountHolderName && (
                        <div className="bg-white p-3 rounded border">
                          <div className="text-xs text-gray-600 mb-1">Account Holder</div>
                          <div className="font-medium">{status.sellerBankDetails.accountHolderName}</div>
                        </div>
                      )}

                      {status.sellerBankDetails.bankName && (
                        <div className="bg-white p-3 rounded border">
                          <div className="text-xs text-gray-600 mb-1">Bank Name</div>
                          <div className="font-medium">{status.sellerBankDetails.bankName}</div>
                        </div>
                      )}

                      <div className="bg-white p-3 rounded border">
                        <div className="text-xs text-gray-600 mb-1">Amount to Transfer</div>
                        <div className="text-2xl font-bold text-green-600">€{currentStep.amount}</div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Alert className="bg-yellow-50 border-yellow-300">
                  <AlertDescription className="text-yellow-900 text-sm">
                    <strong>Instructions:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Make a bank transfer to the account above</li>
                      <li>Take a screenshot of the confirmation</li>
                      <li>Upload it using the button below</li>
                      <li>Wait for seller to confirm receipt</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleUploadProof}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload Payment Proof'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Steps */}
      <Card>
        <CardHeader>
          <CardTitle>All Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {status.steps.filter((s: any) => s.userType === 'BUYER').map((step: any) => (
              <div
                key={step.id}
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  step.status === 'COMPLETED'
                    ? 'bg-green-50 border-green-200'
                    : step.stepNumber === currentStep?.stepNumber
                    ? 'bg-blue-50 border-blue-300'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step.status === 'COMPLETED'
                      ? 'bg-green-500 text-white'
                      : step.stepNumber === currentStep?.stepNumber
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {step.status === 'COMPLETED' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.stepNumber
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{step.description}</p>
                  {step.amount && (
                    <p className="text-xs text-gray-500">
                      {step.amount} {step.currency}
                    </p>
                  )}
                </div>
                {step.status === 'COMPLETED' && (
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    Completed
                  </Badge>
                )}
                {step.stepNumber === currentStep?.stepNumber && (
                  <Badge className="bg-blue-500">Active</Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}