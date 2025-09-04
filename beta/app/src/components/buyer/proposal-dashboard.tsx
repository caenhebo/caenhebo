'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Calculator,
  FileText,
  Loader2,
  Download,
  Euro,
  Bitcoin,
  CreditCard,
  Info
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PricingSuggestion {
  property: {
    id: string
    code: string
    listPrice: number
    pricePerSqm: number | null
  }
  marketAnalysis: {
    similarPropertiesAnalyzed: number
    averageDiscount: number
    currentOffers: number
    marketCondition: 'hot' | 'active' | 'normal'
    avgPricePerSqm: number | null
  }
  buyerProfile: {
    previousPurchases: number
    typicalOfferRatio: number
    isExperiencedBuyer: boolean
  }
  pricingSuggestions: {
    conservative: {
      amount: number
      description: string
      percentOfAsking: number
    }
    competitive: {
      amount: number
      description: string
      percentOfAsking: number
    }
    aggressive: {
      amount: number
      description: string
      percentOfAsking: number
    }
  }
  insights: string[]
}

interface ProposalDashboardProps {
  propertyId: string
  propertyPrice: number
  onOfferSubmit?: () => void
}

export default function ProposalDashboard({ propertyId, propertyPrice, onOfferSubmit }: ProposalDashboardProps) {
  const router = useRouter()
  const [pricingSuggestion, setPricingSuggestion] = useState<PricingSuggestion | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showOfferDialog, setShowOfferDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Offer form state
  const [offerPrice, setOfferPrice] = useState('')
  const [message, setMessage] = useState('')
  const [terms, setTerms] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'FIAT' | 'CRYPTO' | 'HYBRID'>('FIAT')
  const [cryptoPercentage, setCryptoPercentage] = useState(50)
  const [fiatPercentage, setFiatPercentage] = useState(50)

  useEffect(() => {
    fetchPricingSuggestion()
  }, [propertyId])

  const fetchPricingSuggestion = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/properties/${propertyId}/pricing-suggestion`)
      
      if (response.ok) {
        const data = await response.json()
        setPricingSuggestion(data)
      }
    } catch (error) {
      console.error('Error fetching pricing suggestion:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOfferSubmit = async () => {
    try {
      setIsSubmitting(true)
      
      const offerData = {
        propertyId,
        offerPrice: parseFloat(offerPrice),
        message,
        terms,
        paymentMethod,
        cryptoPercentage: paymentMethod === 'HYBRID' ? cryptoPercentage : null,
        fiatPercentage: paymentMethod === 'HYBRID' ? fiatPercentage : null
      }

      const response = await fetch('/api/transactions/create-offer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(offerData)
      })

      if (response.ok) {
        const result = await response.json()
        setShowOfferDialog(false)
        if (onOfferSubmit) {
          onOfferSubmit()
        }
        router.push(`/transactions/${result.transaction.id}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit offer')
      }
    } catch (error) {
      console.error('Error submitting offer:', error)
      alert('Failed to submit offer')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getMarketConditionBadge = (condition: string) => {
    const variants: Record<string, string> = {
      hot: 'bg-red-100 text-red-800',
      active: 'bg-orange-100 text-orange-800',
      normal: 'bg-green-100 text-green-800'
    }
    
    return (
      <Badge className={variants[condition] || variants.normal}>
        {condition.charAt(0).toUpperCase() + condition.slice(1)} Market
      </Badge>
    )
  }

  const selectPricingSuggestion = (amount: number) => {
    setOfferPrice(amount.toString())
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Analyzing market data...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {pricingSuggestion && (
        <>
          {/* Market Analysis Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Market Analysis
              </CardTitle>
              <CardDescription>
                Real-time insights based on {pricingSuggestion.marketAnalysis.similarPropertiesAnalyzed} similar properties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {pricingSuggestion.marketAnalysis.averageDiscount}%
                  </div>
                  <div className="text-sm text-gray-600">Average Discount</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {pricingSuggestion.marketAnalysis.currentOffers}
                  </div>
                  <div className="text-sm text-gray-600">Active Offers</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-center mb-2">
                    {getMarketConditionBadge(pricingSuggestion.marketAnalysis.marketCondition)}
                  </div>
                  <div className="text-sm text-gray-600">Market Status</div>
                </div>
              </div>

              {pricingSuggestion.insights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-700">Key Insights:</h4>
                  {pricingSuggestion.insights.map((insight, index) => (
                    <Alert key={index} className="py-2">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">{insight}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Suggestions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Smart Pricing Suggestions
              </CardTitle>
              <CardDescription>
                Personalized recommendations based on your profile and market conditions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Conservative Offer */}
                <div className="border rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
                     onClick={() => selectPricingSuggestion(pricingSuggestion.pricingSuggestions.conservative.amount)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Conservative</span>
                    <Badge variant="outline" className="text-xs">
                      {pricingSuggestion.pricingSuggestions.conservative.percentOfAsking}% of asking
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {formatCurrency(pricingSuggestion.pricingSuggestions.conservative.amount)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {pricingSuggestion.pricingSuggestions.conservative.description}
                  </p>
                </div>

                {/* Competitive Offer */}
                <div className="border-2 border-blue-500 rounded-lg p-4 hover:bg-blue-50 transition-colors cursor-pointer relative"
                     onClick={() => selectPricingSuggestion(pricingSuggestion.pricingSuggestions.competitive.amount)}>
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white">Recommended</Badge>
                  </div>
                  <div className="flex items-center justify-between mb-2 mt-2">
                    <span className="text-sm font-medium text-gray-600">Competitive</span>
                    <Badge variant="outline" className="text-xs">
                      {pricingSuggestion.pricingSuggestions.competitive.percentOfAsking}% of asking
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {formatCurrency(pricingSuggestion.pricingSuggestions.competitive.amount)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {pricingSuggestion.pricingSuggestions.competitive.description}
                  </p>
                </div>

                {/* Aggressive Offer */}
                <div className="border rounded-lg p-4 hover:border-green-500 transition-colors cursor-pointer"
                     onClick={() => selectPricingSuggestion(pricingSuggestion.pricingSuggestions.aggressive.amount)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Aggressive</span>
                    <Badge variant="outline" className="text-xs">
                      {pricingSuggestion.pricingSuggestions.aggressive.percentOfAsking}% of asking
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-2">
                    {formatCurrency(pricingSuggestion.pricingSuggestions.aggressive.amount)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {pricingSuggestion.pricingSuggestions.aggressive.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Make Offer Dialog */}
      <Dialog open={showOfferDialog} onOpenChange={setShowOfferDialog}>
        <DialogTrigger asChild>
          <Button size="lg" className="w-full">
            Make an Offer
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Your Offer</DialogTitle>
            <DialogDescription>
              Enter your offer details below. The seller will be notified immediately.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="offerPrice">Offer Price (€)</Label>
              <Input
                id="offerPrice"
                type="number"
                value={offerPrice}
                onChange={(e) => setOfferPrice(e.target.value)}
                placeholder={propertyPrice.toString()}
                min="1"
                required
              />
              {offerPrice && (
                <p className="text-sm text-gray-600 mt-1">
                  {Math.round((parseFloat(offerPrice) / propertyPrice) * 100)}% of asking price
                </p>
              )}
            </div>

            <div>
              <Label>Payment Method</Label>
              <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <div className="flex items-center space-x-2 mt-2">
                  <RadioGroupItem value="FIAT" id="fiat" />
                  <Label htmlFor="fiat" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Traditional Bank Transfer
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <RadioGroupItem value="CRYPTO" id="crypto" />
                  <Label htmlFor="crypto" className="flex items-center gap-2">
                    <Bitcoin className="h-4 w-4" />
                    Cryptocurrency
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <RadioGroupItem value="HYBRID" id="hybrid" />
                  <Label htmlFor="hybrid" className="flex items-center gap-2">
                    <Euro className="h-4 w-4" />
                    Hybrid (Crypto + Fiat)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {paymentMethod === 'HYBRID' && (
              <div>
                <Label>Payment Split</Label>
                <div className="space-y-3 mt-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Cryptocurrency: {cryptoPercentage}%</span>
                      <span>Fiat: {fiatPercentage}%</span>
                    </div>
                    <Slider
                      value={[cryptoPercentage]}
                      onValueChange={([value]) => {
                        setCryptoPercentage(value)
                        setFiatPercentage(100 - value)
                      }}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="message">Message to Seller (Optional)</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Introduce yourself and explain your interest in the property..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="terms">Additional Terms (Optional)</Label>
              <Textarea
                id="terms"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Any specific conditions or requirements..."
                rows={2}
              />
            </div>

            <Button 
              onClick={handleOfferSubmit} 
              disabled={!offerPrice || parseFloat(offerPrice) <= 0 || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Offer'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}