import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Header from "@/components/header"

export default async function Home() {
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-6xl">
            The Future of Real Estate
            <span className="text-blue-600"> Transactions</span>
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Secure, transparent, and efficient property transactions in Portugal using 
            cryptocurrency, traditional banking, or hybrid payments.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <Link href="/auth/register">
              <Button size="lg" className="px-8 py-3 text-lg">
                Start Buying
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="lg" variant="outline" className="px-8 py-3 text-lg">
                Start Selling
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900">Why Choose Caenhebo Alpha?</h3>
          <p className="mt-4 text-lg text-gray-600">
            Revolutionary features that make real estate transactions simple and secure
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">🔐 Secure Escrow</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Multi-step escrow system with admin approvals ensures your funds are safe 
                throughout the entire transaction process.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">💰 Flexible Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Pay with cryptocurrency, traditional banking, or a hybrid of both. 
                We support BTC, ETH, BNB, USDT, and EUR.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">📋 Full Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Automated property compliance checking, document verification, 
                and KYC processes ensure legal compliance.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">🔍 Property Search</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Find properties by unique codes, browse detailed information, 
                and connect directly with sellers.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">⚡ Fast Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Complete real estate transactions in days, not months. 
                Digital signing and automated processes speed up everything.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">🌍 International</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Buy Portuguese real estate from anywhere in the world with 
                international payment support and multi-language interface.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold text-gray-900">How It Works</h3>
            <p className="mt-4 text-lg text-gray-600">
              Simple steps to buy or sell property with Caenhebo Alpha
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold mb-2">Register</h4>
              <p className="text-sm text-gray-600">Create account and complete KYC verification</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold mb-2">List/Search</h4>
              <p className="text-sm text-gray-600">Sellers list properties, buyers search by code</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold mb-2">Negotiate</h4>
              <p className="text-sm text-gray-600">Propose terms and payment conditions</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                4
              </div>
              <h4 className="font-semibold mb-2">Escrow</h4>
              <p className="text-sm text-gray-600">Secure multi-step escrow process</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                5
              </div>
              <h4 className="font-semibold mb-2">Payment</h4>
              <p className="text-sm text-gray-600">Complete payment via crypto or fiat</p>
            </div>

            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                6
              </div>
              <h4 className="font-semibold mb-2">Transfer</h4>
              <p className="text-sm text-gray-600">Property ownership transfer completed</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Real Estate Experience?
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join the future of property transactions in Portugal. 
            Secure, fast, and transparent.
          </p>
          <Link href="/auth/register">
            <Button size="lg" variant="secondary" className="px-8 py-3 text-lg">
              Get Started Today
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">Caenhebo Alpha</h4>
              <p className="text-gray-400">
                Revolutionizing real estate transactions in Portugal through 
                blockchain technology and secure escrow services.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/security">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help">Help Center</Link></li>
                <li><Link href="/contact">Contact Us</Link></li>
                <li><Link href="/status">Status</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/terms">Terms of Service</Link></li>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/compliance">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Caenhebo Alpha. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}