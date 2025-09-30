'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DollarSign, ArrowDownToLine, CheckCircle2, Clock, Sparkles } from 'lucide-react'

interface FundProtectionSellerProps {
  transactionId: string
}

export function FundProtectionSeller({ transactionId }: FundProtectionSellerProps) {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [converting, setConverting] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [confirming, setConfirming] = useState(false)

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

  const handleConvertToEur = async () => {
    setConverting(true)
    try {
      const response = await fetch(`/api/transactions/${transactionId}/fund-protection/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Conversion failed')
      }

      alert(`Conversion completed! EUR Amount: €${result.eurAmount} (Rate: ${result.conversionRate})`)
      fetchStatus()
    } catch (error: any) {
      console.error('Conversion failed:', error)
      alert(error.message || 'Conversion failed')
    } finally {
      setConverting(false)
    }
  }

  const handleTransferToBank = async () => {
    setTransferring(true)
    try {
      const response = await fetch(`/api/transactions/${transactionId}/fund-protection/bank-transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Transfer failed')
      }

      alert('Transfer to your bank account completed successfully!')
      if (result.allStepsComplete) {
        alert('All payment steps complete! Transaction moving to closing stage.')
      }
      fetchStatus()
    } catch (error: any) {
      console.error('Transfer failed:', error)
      alert(error.message || 'Transfer failed')
    } finally {
      setTransferring(false)
    }
  }

  const handleConfirmFiatReceipt = async () => {
    setConfirming(true)
    try {
      const response = await fetch(`/api/transactions/${transactionId}/fund-protection/confirm-fiat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Confirmation failed')
      }

      alert('Fiat receipt confirmed!')
      if (result.allStepsComplete) {
        alert('All payment steps complete! Transaction moving to closing stage.')
      }
      fetchStatus()
    } catch (error: any) {
      console.error('Confirmation failed:', error)
      alert(error.message || 'Confirmation failed')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading payment status...</div>
  }

  if (!status) {
    return (
      <Card className="border-2 border-blue-500">
        <CardHeader className="bg-blue-50">
          <CardTitle className="flex items-center gap-3">
            <Clock className="h-6 w-6 animate-pulse text-blue-600" />
            Loading Payment Information...
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-gray-600">Please wait while we load your payment details.</p>
        </CardContent>
      </Card>
    )
  }

  if (status.steps.length === 0) {
    return (
      <Card className="border-4 border-green-500 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardTitle className="text-2xl flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-green-600" />
            🎉 Payment Process Starting!
          </CardTitle>
          <CardDescription className="text-lg mt-2">
            Great news! The buyer is about to send you the payment.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <Alert className="bg-blue-50 border-blue-300 border-2">
            <AlertDescription className="text-blue-900">
              <strong className="text-lg block mb-3">📋 Here's What Happens Next:</strong>
              <div className="space-y-3 text-base">
                <div className="flex gap-3">
                  <span className="font-bold text-blue-600">1.</span>
                  <p>The <strong>buyer will transfer €{parseFloat(status.transaction?.agreedPrice || '0').toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</strong> to your bank account</p>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-blue-600">2.</span>
                  <p>They will upload proof of the bank transfer (screenshot or receipt)</p>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-blue-600">3.</span>
                  <p><strong>You will check your bank account</strong> to confirm you received the money</p>
                </div>
                <div className="flex gap-3">
                  <span className="font-bold text-blue-600">4.</span>
                  <p>Once confirmed, you click a button to confirm receipt</p>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {status.sellerBankDetails && (
            <Card className="border-2 border-purple-300 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                  Your Bank Account (Where Money Will Arrive)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {status.sellerBankDetails.iban && (
                  <div className="bg-white p-3 rounded border-2 border-purple-200">
                    <div className="text-xs text-gray-600 mb-1">IBAN</div>
                    <div className="font-mono text-sm font-bold">{status.sellerBankDetails.iban}</div>
                  </div>
                )}
                {status.sellerBankDetails.accountHolderName && (
                  <div className="bg-white p-3 rounded border-2 border-purple-200">
                    <div className="text-xs text-gray-600 mb-1">Account Holder</div>
                    <div className="font-medium">{status.sellerBankDetails.accountHolderName}</div>
                  </div>
                )}
                <div className="bg-white p-3 rounded border-2 border-purple-200">
                  <div className="text-xs text-gray-600 mb-1">Expected Amount</div>
                  <div className="text-2xl font-bold text-green-600">
                    €{parseFloat(status.transaction?.agreedPrice || '0').toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Alert className="bg-yellow-50 border-yellow-300 border-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <AlertDescription className="text-yellow-900">
              <strong className="text-lg block mb-2">⏳ Current Status: Waiting for Buyer</strong>
              <p className="text-base">
                The buyer is now preparing to send the bank transfer to your account.
                You'll be notified when they upload the payment proof, and then you can check your bank and confirm.
              </p>
              <p className="text-sm mt-3 font-semibold">
                💡 Tip: Keep checking your bank account for incoming transfers!
              </p>
            </AlertDescription>
          </Alert>

          <div className="text-center pt-4">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-100 text-blue-800 font-medium">
              <Clock className="h-5 w-5 animate-pulse" />
              <span>No action needed from you right now</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentStep = status.currentStep
  const progress = status.progress

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Progress</CardTitle>
          <CardDescription>
            {progress.completed} of {progress.total} steps completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress.percentage} className="h-2" />
          <p className="text-sm text-gray-500 mt-2">{progress.percentage}% complete</p>
        </CardContent>
      </Card>

      {/* Waiting for Buyer Message */}
      {!status.needsUserAction && currentStep && (
        <Card className="border-yellow-500 border-2">
          <CardHeader className="bg-yellow-50">
            <div className="flex items-center gap-3">
              <Clock className="h-6 w-6 text-yellow-600" />
              <div>
                <CardTitle className="text-yellow-900">Waiting for Buyer</CardTitle>
                <CardDescription className="text-yellow-700">
                  The buyer needs to complete their payment steps first. You'll be notified when it's your turn.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-sm text-gray-600">
              The buyer is currently completing the payment. Once they're done, you'll see clear instructions on what to do next.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Current Action Required */}
      {status.needsUserAction && currentStep && (
        <Card className="border-green-500 border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-600">Action Required</CardTitle>
              <Badge className="bg-green-500">Step {currentStep.stepNumber}</Badge>
            </div>
            <CardDescription>{currentStep.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentStep.stepType === 'CRYPTO_CONVERT' && (
              <div className="space-y-4">
                <Alert className="bg-green-50 border-green-200">
                  <Sparkles className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-900">
                    <strong>Digital Assets Received:</strong> €{currentStep.amount}
                  </AlertDescription>
                </Alert>

                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Convert to EUR
                  </p>
                  <p className="text-xs text-gray-600 mb-3">
                    Your digital assets have been received. Convert them to EUR in your digital IBAN account.
                  </p>
                  <ul className="list-disc list-inside text-xs text-gray-700 space-y-1 mb-4">
                    <li>Instant conversion to EUR</li>
                    <li>Funds available in your digital IBAN</li>
                    <li>No additional fees</li>
                  </ul>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  size="lg"
                  onClick={handleConvertToEur}
                  disabled={converting}
                >
                  {converting ? (
                    'Converting...'
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Convert Digital Assets to EUR
                    </>
                  )}
                </Button>
              </div>
            )}

            {currentStep.stepType === 'IBAN_TRANSFER' && (
              <div className="space-y-4">
                <Alert>
                  <DollarSign className="h-4 w-4" />
                  <AlertDescription>
                    €{currentStep.amount} available in your digital IBAN
                  </AlertDescription>
                </Alert>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Final Step:</strong>
                  </p>
                  <p className="text-xs text-blue-800 mt-2">
                    Transfer the funds from your digital IBAN to your personal bank account.
                    This transfer is instant and secure.
                  </p>
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleTransferToBank}
                  disabled={transferring}
                >
                  <ArrowDownToLine className="h-4 w-4 mr-2" />
                  {transferring ? 'Processing...' : `Transfer €${currentStep.amount} to Your Bank`}
                </Button>
              </div>
            )}

            {currentStep.stepType === 'FIAT_CONFIRM' && (
              <div className="space-y-6">
                <Alert className="bg-green-50 border-green-300 border-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <AlertDescription className="text-green-900">
                    <strong className="text-lg block mb-2">✅ Buyer Has Sent Payment Proof!</strong>
                    <p className="text-base">
                      The buyer uploaded a screenshot showing they transferred <strong>€{parseFloat(currentStep.amount).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</strong> to your bank account.
                    </p>
                  </AlertDescription>
                </Alert>

                {/* Payment Proof Document */}
                {status.uploadedProof && (
                  <Card className="border-4 border-blue-500 shadow-lg">
                    <CardHeader className="bg-blue-50">
                      <CardTitle className="text-xl flex items-center gap-3">
                        📄 Payment Proof Document
                      </CardTitle>
                      <CardDescription className="text-base">
                        View or download the buyer's payment receipt
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-4">
                      <Alert className="bg-blue-50 border-blue-200">
                        <AlertDescription className="text-blue-900">
                          <strong>Important:</strong> This is the proof uploaded by the buyer. Review it, then check your actual bank account to verify the money arrived.
                        </AlertDescription>
                      </Alert>

                      <div className="flex gap-3">
                        <Button
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                          size="lg"
                          onClick={() => window.open(status.uploadedProof, '_blank')}
                        >
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Payment Proof
                        </Button>

                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = status.uploadedProof
                            link.download = `payment-proof-${transactionId}.pdf`
                            link.click()
                          }}
                        >
                          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </Button>
                      </div>

                      <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                        <strong>File:</strong> Payment Proof PDF/Image
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-2 border-blue-300 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="text-lg">📋 What You Need To Do:</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-3">
                      <span className="font-bold text-blue-600 text-lg">1.</span>
                      <p className="text-base">Open your online banking or bank app</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold text-blue-600 text-lg">2.</span>
                      <p className="text-base">Check if you received <strong>€{parseFloat(currentStep.amount).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</strong> from the buyer</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="font-bold text-blue-600 text-lg">3.</span>
                      <p className="text-base">If the money is there, click the big green button below</p>
                    </div>
                  </CardContent>
                </Card>

                {status.sellerBankDetails && (
                  <Card className="border-2 border-purple-300 bg-purple-50">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-purple-600" />
                        Your Bank Account (Check This One)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {status.sellerBankDetails.iban && (
                        <div className="bg-white p-2 rounded border">
                          <div className="text-xs text-gray-600">IBAN</div>
                          <div className="font-mono text-sm font-bold">{status.sellerBankDetails.iban}</div>
                        </div>
                      )}
                      <div className="bg-white p-2 rounded border">
                        <div className="text-xs text-gray-600">Expected Amount</div>
                        <div className="text-xl font-bold text-green-600">
                          €{parseFloat(currentStep.amount).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Alert variant="destructive" className="bg-red-50 border-red-300">
                  <AlertDescription className="text-red-900">
                    <strong>⚠️ Important:</strong> Only click "Confirm Receipt" if you have actually received the money in your bank account.
                    Do not confirm based on the screenshot alone.
                  </AlertDescription>
                </Alert>

                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="lg"
                  onClick={handleConfirmFiatReceipt}
                  disabled={confirming}
                >
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  {confirming ? 'Confirming...' : `✅ Yes, I Received €${parseFloat(currentStep.amount).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* All Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {status.steps.filter((s: any) => s.userType === 'SELLER').map((step: any, index: number) => (
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
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{step.description}</p>
                  {step.amount && (
                    <p className="text-xs text-gray-500">
                      €{step.amount}
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