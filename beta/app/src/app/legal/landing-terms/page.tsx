'use client'

import Header from '@/components/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function LandingTermsPage() {
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
            <h1 className="text-3xl font-bold mb-2">LANDING PAGE TERMS AND PRIVACY POLICY</h1>
            <p className="text-sm text-gray-600">Effective Date: September 1, 2025</p>
            <p className="text-sm text-gray-600">For: caenhebo.com Landing Page</p>
          </div>
          
          <div className="prose prose-gray max-w-none">
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <p className="text-sm font-semibold text-blue-900">QUICK SUMMARY:</p>
              <p className="text-sm text-blue-800 mt-2">
                This policy applies when you submit your property information through our Web Summit 2025 property showcase form. 
                We respect your privacy and comply with GDPR requirements. Your information is used solely to evaluate your property 
                for our curated portfolio and to contact you about this opportunity.
              </p>
            </div>

            <h2>1. WHO WE ARE</h2>
            <p>
              <strong>Caenhebo Sociedade Imobiliária, Unipessoal LDA</strong> ("Caenhebo," "we," "us," or "our") is a Portuguese 
              real estate company that connects property owners with international investors, particularly focusing on the 
              tech community attending Web Summit 2025.
            </p>
            <p>
              <strong>Contact:</strong> support@caenhebo.com<br />
              <strong>Data Protection:</strong> privacy@caenhebo.com
            </p>

            <h2>2. INFORMATION WE COLLECT</h2>
            <p>When you submit your property through our landing page form, we collect:</p>
            <ul>
              <li><strong>Contact Information:</strong> Your name, email address, and phone number</li>
              <li><strong>Property Details:</strong> Property address, type, size, and asking price</li>
              <li><strong>Additional Information:</strong> Any comments or special details you provide about your property</li>
              <li><strong>Technical Data:</strong> IP address, browser type, and submission timestamp</li>
            </ul>

            <h2>3. HOW WE USE YOUR INFORMATION</h2>
            <p>We use your information exclusively for:</p>
            <ul>
              <li>Evaluating your property for inclusion in our Web Summit 2025 portfolio</li>
              <li>Contacting you about your property submission</li>
              <li>Arranging property viewings with qualified investors</li>
              <li>Providing our advisory services if you proceed</li>
              <li>Sending relevant updates about the Web Summit opportunity</li>
            </ul>

            <h2>4. LEGAL BASIS (GDPR)</h2>
            <p>We process your data based on:</p>
            <ul>
              <li><strong>Legitimate Interest:</strong> To evaluate your property and provide our services</li>
              <li><strong>Contract Performance:</strong> To fulfill our advisory services if you engage us</li>
              <li><strong>Consent:</strong> For marketing communications (you can opt-out anytime)</li>
            </ul>

            <h2>5. DATA SHARING</h2>
            <p>We share your information only with:</p>
            <ul>
              <li><strong>Our Team:</strong> Internal staff who evaluate and manage property submissions</li>
              <li><strong>Service Providers:</strong> Form processing (Tally.so) and email communications</li>
              <li><strong>Potential Buyers:</strong> Only with your explicit consent after initial evaluation</li>
            </ul>
            <p className="font-semibold">
              We NEVER sell your personal information or share it with unrelated third parties.
            </p>

            <h2>6. DATA SECURITY</h2>
            <p>
              We implement appropriate security measures including encryption, secure servers, and access controls 
              to protect your information from unauthorized access or disclosure.
            </p>

            <h2>7. DATA RETENTION</h2>
            <p>We retain your information for:</p>
            <ul>
              <li><strong>Active Inquiries:</strong> Until Web Summit 2025 concludes or you withdraw</li>
              <li><strong>Completed Services:</strong> 6 years for tax and legal compliance</li>
              <li><strong>Rejected Submissions:</strong> 6 months for quality improvement</li>
            </ul>

            <h2>8. YOUR RIGHTS UNDER GDPR</h2>
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Correct any inaccurate information</li>
              <li><strong>Erasure:</strong> Request deletion of your data (subject to legal requirements)</li>
              <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
              <li><strong>Object:</strong> Oppose processing for marketing purposes</li>
              <li><strong>Withdraw Consent:</strong> Opt-out of communications at any time</li>
            </ul>
            <p>
              To exercise these rights, email: <a href="mailto:privacy@caenhebo.com" className="text-blue-600 hover:underline">privacy@caenhebo.com</a>
            </p>

            <h2>9. COOKIES</h2>
            <p>
              Our landing page uses minimal cookies for functionality and analytics. These include:
            </p>
            <ul>
              <li>Essential cookies for form functionality</li>
              <li>Analytics cookies to improve our service (with consent)</li>
            </ul>

            <h2>10. INTERNATIONAL TRANSFERS</h2>
            <p>
              Some service providers (like form processing) may transfer data outside the EU. 
              We ensure appropriate safeguards are in place, including standard contractual clauses.
            </p>

            <h2>11. TERMS OF USE</h2>
            <p>By submitting your property information, you agree that:</p>
            <ul>
              <li>You have the legal right to market the property</li>
              <li>All information provided is accurate and truthful</li>
              <li>You understand our 3% advisory fee structure</li>
              <li>We act as advisors, not traditional real estate agents</li>
              <li>You consent to being contacted about your submission</li>
            </ul>

            <h2>12. NO GUARANTEED INCLUSION</h2>
            <p>
              Submitting your property does not guarantee inclusion in our Web Summit 2025 portfolio. 
              We carefully curate properties based on investor preferences and market conditions.
            </p>

            <h2>13. CHILDREN'S PRIVACY</h2>
            <p>
              Our services are not intended for individuals under 18. We do not knowingly collect 
              information from minors.
            </p>

            <h2>14. COMPLAINTS</h2>
            <p>
              If you have concerns about our data handling, you may lodge a complaint with:
            </p>
            <p>
              <strong>Portuguese Data Protection Authority (CNPD)</strong><br />
              Email: <a href="mailto:geral@cnpd.pt" className="text-blue-600 hover:underline">geral@cnpd.pt</a>
            </p>

            <h2>15. CHANGES TO THIS POLICY</h2>
            <p>
              We may update this policy occasionally. Any material changes will be posted on this page 
              with an updated effective date.
            </p>

            <h2>16. CONTACT US</h2>
            <div className="bg-gray-100 p-6 rounded-lg mt-6">
              <p className="font-semibold mb-3">Questions or Concerns?</p>
              <p>
                <strong>General Inquiries:</strong> <a href="mailto:support@caenhebo.com" className="text-blue-600 hover:underline">support@caenhebo.com</a><br />
                <strong>Privacy Matters:</strong> <a href="mailto:privacy@caenhebo.com" className="text-blue-600 hover:underline">privacy@caenhebo.com</a>
              </p>
              <p className="mt-4 text-sm text-gray-600">
                We typically respond within 48-72 hours.
              </p>
            </div>

            <div className="mt-12 p-4 bg-green-50 rounded-lg">
              <p className="text-center text-sm font-semibold text-green-800">
                Thank you for considering Caenhebo for your Web Summit 2025 property showcase opportunity!
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}