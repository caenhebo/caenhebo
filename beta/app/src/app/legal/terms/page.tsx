'use client'

import Header from '@/components/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/legal">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Legal
            </Button>
          </Link>
        </div>
        
        <Card className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">TERMS AND CONDITIONS OF SERVICE</h1>
            <p className="text-sm text-gray-600">Effective Date: September 1, 2025</p>
            <p className="text-sm text-gray-600">Last Modified: September 1, 2025</p>
          </div>
          
          <div className="prose prose-gray max-w-none">
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm font-semibold text-blue-900">IMPORTANT NOTICE:</p>
              <p className="text-sm text-blue-800 mt-2">
                THESE TERMS CONTAIN BINDING ARBITRATION PROVISIONS AND A CLASS ACTION WAIVER. 
                PLEASE READ SECTION 16 (DISPUTE RESOLUTION) CAREFULLY AS IT AFFECTS YOUR LEGAL RIGHTS.
              </p>
            </div>

            <h2>1. DEFINITIONS AND INTERPRETATION</h2>
            
            <h3>1.1 Definitions</h3>
            <p>In these Terms and Conditions:</p>
            <ul>
              <li><strong>"Agreement"</strong> means these Terms and Conditions together with our Privacy Policy and any additional terms applicable to specific Services;</li>
              <li><strong>"Buyer"</strong> means any User registered on the Platform seeking to purchase Property;</li>
              <li><strong>"Company," "we," "us," or "our"</strong> means Caenhebo Sociedade Imobiliária, Unipessoal LDA, a company incorporated under the laws of Portugal;</li>
              <li><strong>"Cryptocurrency" or "Digital Assets"</strong> means Bitcoin (BTC), Ethereum (ETH), Binance Coin (BNB), Tether (USDT), and any other digital currencies supported by the Platform;</li>
              <li><strong>"Escrow Services"</strong> means the holding of funds by our third-party provider Striga pending completion of a Transaction;</li>
              <li><strong>"KYC"</strong> means Know Your Customer verification procedures;</li>
              <li><strong>"Platform"</strong> means the Caenhebo online platform accessible at caenhebo.com and any associated applications;</li>
              <li><strong>"Property"</strong> means real estate listed for sale on the Platform;</li>
              <li><strong>"Seller"</strong> means any User registered on the Platform offering Property for sale;</li>
              <li><strong>"Services"</strong> means all services provided through the Platform;</li>
              <li><strong>"Transaction"</strong> means any property purchase agreement facilitated through the Platform;</li>
              <li><strong>"User," "you," or "your"</strong> means any individual or entity accessing or using the Platform.</li>
            </ul>

            <h3>1.2 Interpretation</h3>
            <p>
              Unless the context requires otherwise: (a) words in the singular include the plural and vice versa; 
              (b) references to statutes include any amendments; (c) headings are for convenience only and do not affect interpretation.
            </p>

            <h2>2. ACCEPTANCE OF TERMS</h2>
            
            <h3>2.1 Binding Agreement</h3>
            <p>
              By accessing, browsing, or using the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms. 
              If you do not agree, you must immediately cease all use of the Platform.
            </p>

            <h3>2.2 Capacity and Authority</h3>
            <p>You represent and warrant that:</p>
            <ul>
              <li>You are at least 18 years of age;</li>
              <li>You have the legal capacity to enter into binding contracts;</li>
              <li>If acting on behalf of an entity, you have full authority to bind such entity;</li>
              <li>Your use of the Platform will not violate any applicable laws or regulations.</li>
            </ul>

            <h2>3. PLATFORM SERVICES</h2>
            
            <h3>3.1 Service Description</h3>
            <p>The Platform provides:</p>
            <ul>
              <li>Digital marketplace for real estate transactions in Portugal and other supported jurisdictions;</li>
              <li>Secure payment processing supporting both fiat currency and cryptocurrency;</li>
              <li>Identity verification and compliance services;</li>
              <li>Transaction facilitation and documentation;</li>
              <li>Digital wallet services through our partner Striga;</li>
              <li>Escrow services for secure fund handling;</li>
              <li>Communication tools between Buyers and Sellers.</li>
            </ul>

            <h3>3.2 Service Limitations</h3>
            <p>The Company:</p>
            <ul>
              <li>Acts solely as a facilitator and is not a party to property transactions;</li>
              <li>Does not provide legal, tax, or investment advice;</li>
              <li>Does not guarantee the condition, value, or legality of any Property;</li>
              <li>Does not act as a real estate agent or broker unless explicitly stated.</li>
            </ul>

            <h2>4. USER REGISTRATION AND ACCOUNTS</h2>
            
            <h3>4.1 Account Creation</h3>
            <p>To access certain Services, you must:</p>
            <ul>
              <li>Complete the registration process with accurate and current information;</li>
              <li>Choose between Buyer or Seller account type;</li>
              <li>Create a secure password and maintain its confidentiality;</li>
              <li>Complete all required identity verification procedures.</li>
            </ul>

            <h3>4.2 Account Security</h3>
            <p>You are responsible for:</p>
            <ul>
              <li>All activities conducted through your account;</li>
              <li>Maintaining the security of your login credentials;</li>
              <li>Immediately notifying us of any unauthorized access;</li>
              <li>Any losses resulting from unauthorized use of your account due to your negligence.</li>
            </ul>

            <h3>4.3 Account Suspension and Termination</h3>
            <p>We reserve the right to suspend or terminate accounts that:</p>
            <ul>
              <li>Violate these Terms or any applicable laws;</li>
              <li>Engage in fraudulent or suspicious activity;</li>
              <li>Fail to complete required verification procedures;</li>
              <li>Remain inactive for extended periods;</li>
              <li>Pose risks to other Users or the Platform.</li>
            </ul>

            <h2>5. IDENTITY VERIFICATION AND COMPLIANCE</h2>
            
            <h3>5.1 Mandatory KYC Verification</h3>
            <p>
              All Users must complete identity verification before engaging in Transactions. This process includes:
            </p>
            <ul>
              <li>Government-issued identification document verification;</li>
              <li>Proof of address documentation;</li>
              <li>Biometric verification (photograph/video);</li>
              <li>Source of funds verification for transactions exceeding regulatory thresholds;</li>
              <li>Any additional documentation required by law or our compliance policies.</li>
            </ul>

            <h3>5.2 Anti-Money Laundering (AML) Compliance</h3>
            <p>The Company maintains a zero-tolerance policy toward money laundering and terrorist financing. We:</p>
            <ul>
              <li>Monitor all transactions for suspicious activity;</li>
              <li>Report suspicious transactions to relevant authorities;</li>
              <li>Maintain transaction records as required by law;</li>
              <li>May freeze accounts pending investigation of suspicious activity;</li>
              <li>Cooperate fully with law enforcement agencies.</li>
            </ul>

            <h3>5.3 Sanctions Compliance</h3>
            <p>
              Users may not be residents of, or located in, countries subject to comprehensive sanctions, 
              including but not limited to: Iran, North Korea, Syria, Cuba, and the Crimea region.
            </p>

            <h2>6. FEES AND PAYMENT TERMS</h2>
            
            <h3>6.1 Transaction Fees</h3>
            <p>The Company charges the following fees:</p>
            <ul>
              <li><strong>Buyer Fee:</strong> 3% of the total transaction value;</li>
              <li><strong>Seller Fee:</strong> 3% of the total transaction value;</li>
              <li><strong>Currency Conversion:</strong> Market rate plus 0.5% for fiat-to-crypto conversions;</li>
              <li><strong>Withdrawal Fees:</strong> As specified in the Platform at time of withdrawal.</li>
            </ul>

            <h3>6.2 Fee Calculation and Payment</h3>
            <ul>
              <li>Fees are calculated on the total property purchase price;</li>
              <li>Fees are collected at the time of transaction completion;</li>
              <li>All fees are non-refundable unless otherwise required by law;</li>
              <li>Additional third-party fees (e.g., network fees for cryptocurrency) may apply.</li>
            </ul>

            <h3>6.3 Fee Modifications</h3>
            <p>
              The Company reserves the right to modify fees upon thirty (30) days' notice. 
              Continued use of the Platform after such notice constitutes acceptance of the new fees.
            </p>

            <h2>7. PROPERTY LISTINGS AND TRANSACTIONS</h2>
            
            <h3>7.1 Seller Responsibilities</h3>
            <p>Sellers represent and warrant that:</p>
            <ul>
              <li>They have legal authority to sell the Property;</li>
              <li>All information provided about the Property is accurate and complete;</li>
              <li>The Property is free from undisclosed liens or encumbrances;</li>
              <li>They will comply with all applicable real estate laws and regulations;</li>
              <li>They will promptly disclose any material changes to the Property's condition or status.</li>
            </ul>

            <h3>7.2 Buyer Responsibilities</h3>
            <p>Buyers acknowledge and agree that:</p>
            <ul>
              <li>They are responsible for conducting independent due diligence;</li>
              <li>They should obtain independent legal and tax advice;</li>
              <li>They must secure financing before making binding offers;</li>
              <li>They will comply with all applicable laws in their jurisdiction;</li>
              <li>The Company does not guarantee any Property's condition or value.</li>
            </ul>

            <h3>7.3 Transaction Process</h3>
            <p>Property transactions follow this general process:</p>
            <ol>
              <li>Buyer submits offer through the Platform;</li>
              <li>Seller accepts, rejects, or counters the offer;</li>
              <li>Upon agreement, funds are deposited into escrow;</li>
              <li>Due diligence period commences;</li>
              <li>Legal documentation is prepared and executed;</li>
              <li>Upon closing conditions being met, funds are released from escrow.</li>
            </ol>

            <h2>8. DIGITAL ASSET SERVICES</h2>
            
            <h3>8.1 Third-Party Provider</h3>
            <p>
              All cryptocurrency and digital wallet services are provided by Striga, a licensed electronic money institution. 
              By using these services, you agree to Striga's terms of service and privacy policy.
            </p>

            <h3>8.2 Cryptocurrency Risks</h3>
            <p>You acknowledge and accept that:</p>
            <ul>
              <li>Cryptocurrency values are highly volatile;</li>
              <li>Cryptocurrency transactions are generally irreversible;</li>
              <li>Loss of private keys may result in permanent loss of funds;</li>
              <li>Regulatory changes may affect cryptocurrency usage;</li>
              <li>Technical issues may temporarily prevent access to digital assets;</li>
              <li>The Company is not liable for cryptocurrency value fluctuations.</li>
            </ul>

            <h3>8.3 Wallet Security</h3>
            <p>
              While Striga maintains institutional-grade security, you remain responsible for account security 
              and any losses resulting from compromised credentials.
            </p>

            <h2>9. INTELLECTUAL PROPERTY RIGHTS</h2>
            
            <h3>9.1 Company Intellectual Property</h3>
            <p>
              All Platform content, including software, designs, graphics, text, and trademarks, 
              is owned by or licensed to the Company and protected by intellectual property laws.
            </p>

            <h3>9.2 Limited License</h3>
            <p>
              We grant you a limited, non-exclusive, non-transferable license to access and use the Platform 
              for its intended purpose. This license is revocable at any time.
            </p>

            <h3>9.3 User Content</h3>
            <p>
              By submitting content to the Platform, you grant us a worldwide, royalty-free license to use, 
              reproduce, and display such content for Platform operations and marketing purposes.
            </p>

            <h2>10. PROHIBITED CONDUCT</h2>
            
            <p>You agree not to:</p>
            <ul>
              <li>Provide false, misleading, or fraudulent information;</li>
              <li>Engage in money laundering or terrorist financing;</li>
              <li>Manipulate or artificially inflate property prices;</li>
              <li>Circumvent the Platform to avoid paying fees;</li>
              <li>Use the Platform for any illegal purpose;</li>
              <li>Attempt to hack, disrupt, or damage the Platform;</li>
              <li>Impersonate another person or entity;</li>
              <li>Harvest or collect User data without permission;</li>
              <li>Post spam, malware, or harmful content;</li>
              <li>Violate any third-party rights.</li>
            </ul>

            <h2>11. DISCLAIMERS AND LIMITATIONS OF LIABILITY</h2>
            
            <h3>11.1 Service Disclaimer</h3>
            <p>
              THE PLATFORM AND SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, 
              WHETHER EXPRESS, IMPLIED, OR STATUTORY. WE SPECIFICALLY DISCLAIM ALL IMPLIED WARRANTIES OF MERCHANTABILITY, 
              FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
            </p>

            <h3>11.2 Limitation of Liability</h3>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE COMPANY SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul>
              <li>Loss of profits, revenue, or business opportunities;</li>
              <li>Property defects or misrepresentations;</li>
              <li>Failed transactions or delayed settlements;</li>
              <li>Cryptocurrency value fluctuations;</li>
              <li>System downtime or technical failures;</li>
              <li>Third-party actions or omissions;</li>
              <li>Force majeure events.</li>
            </ul>

            <h3>11.3 Liability Cap</h3>
            <p>
              Our total cumulative liability shall not exceed the fees actually paid by you to the Company 
              in the twelve (12) months preceding the claim.
            </p>

            <h2>12. INDEMNIFICATION</h2>
            
            <p>
              You agree to defend, indemnify, and hold harmless the Company, its officers, directors, employees, 
              and agents from any claims, damages, losses, or expenses (including reasonable legal fees) arising from:
            </p>
            <ul>
              <li>Your breach of these Terms;</li>
              <li>Your violation of applicable laws or regulations;</li>
              <li>Your negligence or willful misconduct;</li>
              <li>Property disputes or transaction failures;</li>
              <li>Your tax obligations;</li>
              <li>Third-party claims related to your use of the Platform.</li>
            </ul>

            <h2>13. DATA PROTECTION AND PRIVACY</h2>
            
            <h3>13.1 Privacy Policy</h3>
            <p>
              Your use of the Platform is subject to our Privacy Policy, which is incorporated by reference. 
              We process personal data in compliance with the General Data Protection Regulation (GDPR) and applicable data protection laws.
            </p>

            <h3>13.2 Data Processing</h3>
            <p>By using the Platform, you consent to:</p>
            <ul>
              <li>Collection and processing of personal data for Service provision;</li>
              <li>Sharing of data with third-party service providers;</li>
              <li>Cross-border data transfers with appropriate safeguards;</li>
              <li>Data retention as required by legal and regulatory obligations.</li>
            </ul>

            <h2>14. TERM AND TERMINATION</h2>
            
            <h3>14.1 Term</h3>
            <p>
              These Terms commence upon your first use of the Platform and continue until terminated by either party.
            </p>

            <h3>14.2 Termination by User</h3>
            <p>
              You may terminate your account at any time by submitting a closure request. 
              Pending transactions must be completed or cancelled before account closure.
            </p>

            <h3>14.3 Termination by Company</h3>
            <p>
              We may terminate or suspend your account immediately for any breach of these Terms or for any other reason in our sole discretion.
            </p>

            <h3>14.4 Effect of Termination</h3>
            <p>Upon termination:</p>
            <ul>
              <li>Your access to the Platform will cease;</li>
              <li>Pending transactions may be cancelled;</li>
              <li>You remain liable for all obligations incurred prior to termination;</li>
              <li>Provisions that by their nature should survive will remain in effect.</li>
            </ul>

            <h2>15. GOVERNING LAW AND JURISDICTION</h2>
            
            <h3>15.1 Governing Law</h3>
            <p>
              These Terms are governed by and construed in accordance with the laws of Portugal, 
              without regard to conflict of law principles.
            </p>

            <h3>15.2 Jurisdiction</h3>
            <p>
              Subject to Section 16 (Dispute Resolution), the courts of Lisbon, Portugal shall have exclusive jurisdiction 
              over any disputes that cannot be resolved through arbitration.
            </p>

            <h2>16. DISPUTE RESOLUTION</h2>
            
            <h3>16.1 Informal Resolution</h3>
            <p>
              Before initiating formal proceedings, parties agree to attempt good faith resolution of disputes 
              by contacting support@caenhebo.com.
            </p>

            <h3>16.2 Binding Arbitration</h3>
            <p>
              Any dispute not resolved informally shall be finally settled by binding arbitration in Lisbon, Portugal, 
              under the rules of the Portuguese Center for Commercial Arbitration. The arbitration shall be conducted 
              in English by a single arbitrator.
            </p>

            <h3>16.3 Class Action Waiver</h3>
            <p className="font-semibold">
              YOU WAIVE ANY RIGHT TO PARTICIPATE IN CLASS ACTIONS, CLASS ARBITRATIONS, OR REPRESENTATIVE ACTIONS. 
              DISPUTES MUST BE BROUGHT ON AN INDIVIDUAL BASIS ONLY.
            </p>

            <h3>16.4 Injunctive Relief</h3>
            <p>
              Notwithstanding the above, either party may seek injunctive relief in any court of competent jurisdiction 
              to prevent irreparable harm.
            </p>

            <h2>17. GENERAL PROVISIONS</h2>
            
            <h3>17.1 Entire Agreement</h3>
            <p>
              These Terms, together with our Privacy Policy and any additional agreements for specific services, 
              constitute the entire agreement between you and the Company.
            </p>

            <h3>17.2 Amendments</h3>
            <p>
              We reserve the right to amend these Terms at any time. Material changes will be notified via email 
              or Platform notice at least thirty (30) days in advance. Continued use after such notice constitutes acceptance.
            </p>

            <h3>17.3 Severability</h3>
            <p>
              If any provision is deemed invalid or unenforceable, the remaining provisions shall continue in full force and effect.
            </p>

            <h3>17.4 Waiver</h3>
            <p>
              No waiver of any term shall be deemed a further or continuing waiver of such term or any other term.
            </p>

            <h3>17.5 Assignment</h3>
            <p>
              You may not assign your rights or obligations without our prior written consent. 
              We may assign our rights and obligations without restriction.
            </p>

            <h3>17.6 Force Majeure</h3>
            <p>
              Neither party shall be liable for delays or failures due to causes beyond their reasonable control, 
              including but not limited to acts of God, war, terrorism, pandemic, or government actions.
            </p>

            <h3>17.7 Notices</h3>
            <p>
              Legal notices must be sent to support@caenhebo.com or to the address provided in your account. 
              Notices are effective upon receipt.
            </p>

            <h3>17.8 Language</h3>
            <p>
              These Terms are drafted in English. Any translations are for convenience only; 
              the English version shall prevail in case of discrepancies.
            </p>

            <h2>18. CONTACT INFORMATION</h2>
            
            <div className="bg-gray-100 p-6 rounded-lg mt-8">
              <p className="font-semibold mb-3">Caenhebo Sociedade Imobiliária, Unipessoal LDA</p>
              <p>Email: <a href="mailto:support@caenhebo.com" className="text-blue-600 hover:underline">support@caenhebo.com</a></p>
              <p>Data Protection Officer: <a href="mailto:support@caenhebo.com" className="text-blue-600 hover:underline">support@caenhebo.com</a></p>
              <p className="mt-4">For support inquiries, please allow 48-72 hours for a response.</p>
            </div>

            <div className="mt-12 p-4 border-t-2 border-gray-300">
              <p className="text-center text-sm text-gray-600">
                By using the Caenhebo Platform, you acknowledge that you have read, understood, 
                and agree to be bound by these Terms and Conditions.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}