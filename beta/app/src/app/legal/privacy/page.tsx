'use client'

import Header from '@/components/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
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
            <h1 className="text-3xl font-bold mb-2">PRIVACY POLICY</h1>
            <p className="text-sm text-gray-600">Effective Date: September 1, 2025</p>
            <p className="text-sm text-gray-600">Last Modified: September 1, 2025</p>
          </div>
          
          <div className="prose prose-gray max-w-none">
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <p className="text-sm font-semibold text-green-900">GDPR COMPLIANCE NOTICE:</p>
              <p className="text-sm text-green-800 mt-2">
                This Privacy Policy complies with the General Data Protection Regulation (EU) 2016/679 ("GDPR") 
                and applicable data protection laws. We are committed to protecting your personal data and respecting your privacy rights.
              </p>
            </div>

            <h2>1. INTRODUCTION AND SCOPE</h2>
            
            <h3>1.1 Our Commitment</h3>
            <p>
              Caenhebo Sociedade Imobiliária, Unipessoal LDA ("Caenhebo," "we," "us," or "our") respects your privacy 
              and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, share, 
              and safeguard information when you use our real estate transaction platform at caenhebo.com ("Platform").
            </p>

            <h3>1.2 Scope of Policy</h3>
            <p>This Privacy Policy applies to:</p>
            <ul>
              <li>All users of our Platform, including buyers, sellers, and visitors;</li>
              <li>Personal data collected through our Platform, mobile applications, and communications;</li>
              <li>Personal data we receive from third parties, including our service providers;</li>
              <li>Processing activities conducted by us as data controller.</li>
            </ul>

            <h3>1.3 Third-Party Services</h3>
            <p>
              Our Platform integrates with Striga for digital asset management and payment services. 
              When using Striga's services, their privacy policy also applies. We encourage you to review 
              Striga's privacy policy separately.
            </p>

            <h2>2. DATA CONTROLLER INFORMATION</h2>
            
            <h3>2.1 Identity and Contact Details</h3>
            <p><strong>Data Controller:</strong></p>
            <ul>
              <li>Company Name: Caenhebo Sociedade Imobiliária, Unipessoal LDA</li>
              <li>Registered Address: [Company Address in Portugal]</li>
              <li>Registration Number: [Portuguese Company Registration Number]</li>
              <li>Email: <a href="mailto:support@caenhebo.com" className="text-blue-600 hover:underline">support@caenhebo.com</a></li>
            </ul>

            <h3>2.2 Data Protection Contact</h3>
            <p>
              For all privacy-related inquiries or to exercise your rights under GDPR, please contact our 
              Data Protection Officer at: <a href="mailto:privacy@caenhebo.com" className="text-blue-600 hover:underline">privacy@caenhebo.com</a>
            </p>

            <h2>3. LEGAL BASIS FOR PROCESSING</h2>
            
            <h3>3.1 Lawful Grounds</h3>
            <p>We process personal data only when we have a lawful basis under GDPR Article 6:</p>
            
            <h4>(a) Contract Performance (Article 6(1)(b))</h4>
            <ul>
              <li>Creating and managing your user account;</li>
              <li>Facilitating property transactions between buyers and sellers;</li>
              <li>Processing payments and managing digital wallets;</li>
              <li>Providing customer support and Platform services.</li>
            </ul>

            <h4>(b) Legal Obligations (Article 6(1)(c))</h4>
            <ul>
              <li>Complying with anti-money laundering (AML) and know-your-customer (KYC) requirements;</li>
              <li>Reporting suspicious transactions to authorities;</li>
              <li>Maintaining records for tax and regulatory compliance;</li>
              <li>Responding to lawful requests from authorities.</li>
            </ul>

            <h4>(c) Legitimate Interests (Article 6(1)(f))</h4>
            <ul>
              <li>Preventing fraud and ensuring Platform security;</li>
              <li>Improving our services through analytics;</li>
              <li>Enforcing our Terms and Conditions;</li>
              <li>Protecting users and third parties from harm.</li>
            </ul>

            <h4>(d) Consent (Article 6(1)(a))</h4>
            <ul>
              <li>Sending marketing communications (where not based on legitimate interest);</li>
              <li>Placing certain cookies on your device;</li>
              <li>Processing special categories of data (where applicable).</li>
            </ul>

            <h2>4. CATEGORIES OF PERSONAL DATA</h2>
            
            <h3>4.1 Identity and Contact Data</h3>
            <ul>
              <li>Full legal name, including former names;</li>
              <li>Date and place of birth;</li>
              <li>Nationality and citizenship status;</li>
              <li>Government-issued identification numbers and documents;</li>
              <li>Residential and business addresses;</li>
              <li>Email addresses and telephone numbers;</li>
              <li>Photographic identification and biometric data for verification.</li>
            </ul>

            <h3>4.2 Financial and Transaction Data</h3>
            <ul>
              <li>Bank account details and payment card information;</li>
              <li>Cryptocurrency wallet addresses;</li>
              <li>Transaction history and payment records;</li>
              <li>Source of funds documentation;</li>
              <li>Income and wealth verification documents;</li>
              <li>Tax identification numbers;</li>
              <li>Credit reference information (where applicable).</li>
            </ul>

            <h3>4.3 Property Transaction Data</h3>
            <ul>
              <li>Property listings created or viewed;</li>
              <li>Offers made or received;</li>
              <li>Purchase agreements and related documentation;</li>
              <li>Communication between buyers and sellers;</li>
              <li>Due diligence documentation;</li>
              <li>Escrow and settlement records.</li>
            </ul>

            <h3>4.4 Technical and Usage Data</h3>
            <ul>
              <li>IP addresses and device identifiers;</li>
              <li>Browser type, version, and settings;</li>
              <li>Operating system and platform information;</li>
              <li>Login data and access timestamps;</li>
              <li>Clickstream data and page interactions;</li>
              <li>Error reports and performance data;</li>
              <li>Location data (with appropriate consent).</li>
            </ul>

            <h3>4.5 Compliance and Risk Data</h3>
            <ul>
              <li>KYC verification results and documentation;</li>
              <li>AML screening results;</li>
              <li>Sanctions and politically exposed persons (PEP) checks;</li>
              <li>Risk assessment scores and profiles;</li>
              <li>Suspicious activity reports and investigations;</li>
              <li>Correspondence with regulatory authorities.</li>
            </ul>

            <h2>5. PURPOSES OF PROCESSING</h2>
            
            <h3>5.1 Service Provision</h3>
            <p>We process personal data to:</p>
            <ul>
              <li>Create and authenticate user accounts;</li>
              <li>Enable property listings and searches;</li>
              <li>Facilitate offers, negotiations, and agreements;</li>
              <li>Process payments in fiat and cryptocurrency;</li>
              <li>Manage escrow services for secure transactions;</li>
              <li>Provide customer support and respond to inquiries;</li>
              <li>Send transaction updates and service notifications.</li>
            </ul>

            <h3>5.2 Legal and Regulatory Compliance</h3>
            <ul>
              <li>Verify user identities per KYC requirements;</li>
              <li>Screen against sanctions and PEP lists;</li>
              <li>Monitor transactions for suspicious activity;</li>
              <li>Report to financial intelligence units as required;</li>
              <li>Maintain audit trails and compliance records;</li>
              <li>Comply with tax reporting obligations;</li>
              <li>Respond to lawful information requests.</li>
            </ul>

            <h3>5.3 Platform Security and Integrity</h3>
            <ul>
              <li>Detect and prevent fraudulent activity;</li>
              <li>Investigate security incidents and breaches;</li>
              <li>Enforce Terms and Conditions violations;</li>
              <li>Protect against automated attacks and abuse;</li>
              <li>Ensure business continuity and disaster recovery;</li>
              <li>Conduct security audits and assessments.</li>
            </ul>

            <h3>5.4 Service Improvement and Analytics</h3>
            <ul>
              <li>Analyze usage patterns and user behavior;</li>
              <li>Improve user experience and interface design;</li>
              <li>Develop new features and services;</li>
              <li>Conduct market research and surveys;</li>
              <li>Generate aggregated statistical insights;</li>
              <li>Test and optimize Platform performance.</li>
            </ul>

            <h2>6. DATA SHARING AND RECIPIENTS</h2>
            
            <h3>6.1 Service Providers</h3>
            <p>We share personal data with carefully selected service providers who assist us in operating the Platform:</p>
            
            <h4>(a) Striga (Digital Asset Services)</h4>
            <ul>
              <li>Purpose: KYC verification, wallet management, payment processing;</li>
              <li>Data shared: Identity data, financial information, transaction records;</li>
              <li>Location: European Union;</li>
              <li>Safeguards: Contractual clauses, regulatory oversight.</li>
            </ul>

            <h4>(b) Cloud Infrastructure Providers</h4>
            <ul>
              <li>Purpose: Data hosting, storage, and processing;</li>
              <li>Data shared: All categories as necessary for service provision;</li>
              <li>Safeguards: Data processing agreements, security certifications.</li>
            </ul>

            <h4>(c) Professional Service Providers</h4>
            <ul>
              <li>Legal advisors, accountants, and auditors;</li>
              <li>Data shared: As necessary for professional services;</li>
              <li>Safeguards: Professional confidentiality obligations.</li>
            </ul>

            <h3>6.2 Transaction Counterparties</h3>
            <p>
              In facilitating property transactions, certain information is shared between buyers and sellers as necessary 
              to complete the transaction. This may include contact information and transaction-specific details.
            </p>

            <h3>6.3 Legal and Regulatory Disclosures</h3>
            <p>We may disclose personal data to:</p>
            <ul>
              <li>Law enforcement agencies and courts;</li>
              <li>Financial intelligence units;</li>
              <li>Tax authorities;</li>
              <li>Financial regulators;</li>
              <li>Other authorities as required by law.</li>
            </ul>

            <h3>6.4 Business Transfers</h3>
            <p>
              In the event of a merger, acquisition, or asset sale, personal data may be transferred to the acquiring entity. 
              We will notify you of such transfers and any choices you may have.
            </p>

            <h2>7. INTERNATIONAL DATA TRANSFERS</h2>
            
            <h3>7.1 Transfer Mechanisms</h3>
            <p>
              When we transfer personal data outside the European Economic Area (EEA), we ensure appropriate safeguards:
            </p>
            <ul>
              <li><strong>Adequacy Decisions:</strong> Transfers to countries deemed adequate by the European Commission;</li>
              <li><strong>Standard Contractual Clauses:</strong> EU-approved model contracts for data transfers;</li>
              <li><strong>Binding Corporate Rules:</strong> For transfers within corporate groups;</li>
              <li><strong>Your Consent:</strong> Where explicitly provided for specific transfers.</li>
            </ul>

            <h3>7.2 Specific Transfer Scenarios</h3>
            <ul>
              <li>Cryptocurrency transactions may involve global blockchain networks;</li>
              <li>International property transactions may require cross-border data sharing;</li>
              <li>Cloud services may process data in multiple jurisdictions;</li>
              <li>Customer support may be provided from various locations.</li>
            </ul>

            <h2>8. DATA SECURITY MEASURES</h2>
            
            <h3>8.1 Technical Safeguards</h3>
            <ul>
              <li>End-to-end encryption for data in transit (TLS 1.3);</li>
              <li>Encryption at rest for sensitive data (AES-256);</li>
              <li>Multi-factor authentication for account access;</li>
              <li>Regular security penetration testing;</li>
              <li>Intrusion detection and prevention systems;</li>
              <li>Secure key management practices;</li>
              <li>Regular security patches and updates.</li>
            </ul>

            <h3>8.2 Organizational Safeguards</h3>
            <ul>
              <li>Access controls based on least privilege principle;</li>
              <li>Regular employee security training;</li>
              <li>Confidentiality agreements for all staff;</li>
              <li>Incident response and breach notification procedures;</li>
              <li>Regular security audits and assessments;</li>
              <li>Vendor security due diligence;</li>
              <li>Business continuity planning.</li>
            </ul>

            <h3>8.3 Breach Notification</h3>
            <p>
              In the event of a personal data breach likely to result in high risk to your rights and freedoms, 
              we will notify you without undue delay and within 72 hours of becoming aware, as required by GDPR Article 34.
            </p>

            <h2>9. DATA RETENTION PERIODS</h2>
            
            <h3>9.1 Retention Criteria</h3>
            <p>We retain personal data for the minimum period necessary, considering:</p>
            <ul>
              <li>Legal and regulatory requirements;</li>
              <li>Contractual obligations;</li>
              <li>Limitation periods for legal claims;</li>
              <li>Business necessity and legitimate interests;</li>
              <li>Your rights and expectations.</li>
            </ul>

            <h3>9.2 Specific Retention Periods</h3>
            <ul>
              <li><strong>Transaction Records:</strong> 7 years from transaction completion (tax and AML requirements);</li>
              <li><strong>KYC Documentation:</strong> 5 years after relationship termination (AML requirements);</li>
              <li><strong>Financial Records:</strong> 6 years (accounting and tax requirements);</li>
              <li><strong>Marketing Preferences:</strong> Until consent withdrawn or 3 years of inactivity;</li>
              <li><strong>Technical Logs:</strong> 90 days (security and performance monitoring);</li>
              <li><strong>Cookies:</strong> As specified in our Cookie Policy.</li>
            </ul>

            <h3>9.3 Deletion and Anonymization</h3>
            <p>
              After retention periods expire, we securely delete personal data or anonymize it for statistical purposes. 
              Deletion methods ensure data cannot be reconstructed.
            </p>

            <h2>10. YOUR RIGHTS UNDER GDPR</h2>
            
            <h3>10.1 Right of Access (Article 15)</h3>
            <p>You have the right to:</p>
            <ul>
              <li>Confirm whether we process your personal data;</li>
              <li>Access your personal data and receive a copy;</li>
              <li>Receive information about processing purposes, categories, and recipients;</li>
              <li>Know retention periods and your rights.</li>
            </ul>

            <h3>10.2 Right to Rectification (Article 16)</h3>
            <p>
              You can request correction of inaccurate personal data or completion of incomplete data. 
              We will notify third parties of rectifications where feasible.
            </p>

            <h3>10.3 Right to Erasure/"Right to be Forgotten" (Article 17)</h3>
            <p>You may request deletion of personal data when:</p>
            <ul>
              <li>Data is no longer necessary for original purposes;</li>
              <li>You withdraw consent (where consent is the legal basis);</li>
              <li>You object to processing based on legitimate interests;</li>
              <li>Data was unlawfully processed;</li>
              <li>Deletion is required by law.</li>
            </ul>
            <p>Note: This right is subject to legal retention requirements and other exemptions.</p>

            <h3>10.4 Right to Restriction (Article 18)</h3>
            <p>You can request restriction of processing when:</p>
            <ul>
              <li>You contest data accuracy (during verification);</li>
              <li>Processing is unlawful but you oppose deletion;</li>
              <li>We no longer need data but you need it for legal claims;</li>
              <li>You object to processing (pending legitimate interest assessment).</li>
            </ul>

            <h3>10.5 Right to Data Portability (Article 20)</h3>
            <p>
              For data processed based on consent or contract, you can receive your data in a structured, 
              commonly used, machine-readable format and transmit it to another controller.
            </p>

            <h3>10.6 Right to Object (Article 21)</h3>
            <ul>
              <li>You can object to processing based on legitimate interests;</li>
              <li>You can object to direct marketing at any time;</li>
              <li>We must stop processing unless we demonstrate compelling legitimate grounds.</li>
            </ul>

            <h3>10.7 Rights Regarding Automated Decision-Making (Article 22)</h3>
            <p>
              You have the right not to be subject to purely automated decisions with legal or significant effects. 
              Where we use automated decision-making, you can request human intervention and challenge decisions.
            </p>

            <h3>10.8 Right to Withdraw Consent</h3>
            <p>
              Where processing is based on consent, you can withdraw consent at any time. 
              This does not affect the lawfulness of processing before withdrawal.
            </p>

            <h3>10.9 Exercising Your Rights</h3>
            <p>To exercise any rights:</p>
            <ul>
              <li>Email: <a href="mailto:privacy@caenhebo.com" className="text-blue-600 hover:underline">privacy@caenhebo.com</a></li>
              <li>Include proof of identity for security;</li>
              <li>Specify which rights you wish to exercise;</li>
              <li>We will respond within one month (extendable by two months for complex requests).</li>
            </ul>

            <h2>11. COOKIES AND TRACKING TECHNOLOGIES</h2>
            
            <h3>11.1 Types of Cookies</h3>
            <ul>
              <li><strong>Essential Cookies:</strong> Required for Platform functionality;</li>
              <li><strong>Performance Cookies:</strong> Analyze usage and improve services;</li>
              <li><strong>Functionality Cookies:</strong> Remember preferences and settings;</li>
              <li><strong>Marketing Cookies:</strong> Deliver relevant advertisements (with consent).</li>
            </ul>

            <h3>11.2 Cookie Management</h3>
            <p>
              You can manage cookie preferences through your browser settings or our cookie consent tool. 
              Disabling certain cookies may affect Platform functionality.
            </p>

            <h3>11.3 Other Tracking Technologies</h3>
            <ul>
              <li>Web beacons and pixels for email tracking;</li>
              <li>Local storage for user preferences;</li>
              <li>Session replay for troubleshooting (anonymized);</li>
              <li>Analytics tools for aggregated insights.</li>
            </ul>

            <h2>12. CHILDREN'S PRIVACY</h2>
            
            <p>
              Our Platform is not directed at individuals under 18 years of age. We do not knowingly collect personal data 
              from minors. If we become aware of such collection, we will promptly delete the data and terminate the account.
            </p>

            <h2>13. MARKETING COMMUNICATIONS</h2>
            
            <h3>13.1 Marketing Preferences</h3>
            <p>With appropriate legal basis, we may send:</p>
            <ul>
              <li>Platform updates and new features;</li>
              <li>Property recommendations based on your interests;</li>
              <li>Market insights and industry news;</li>
              <li>Partner offers (with explicit consent).</li>
            </ul>

            <h3>13.2 Opt-Out Rights</h3>
            <p>
              You can opt out of marketing communications at any time via unsubscribe links in emails 
              or by contacting us. Transactional communications necessary for service provision will continue.
            </p>

            <h2>14. SUPERVISORY AUTHORITY</h2>
            
            <h3>14.1 Right to Lodge Complaints</h3>
            <p>
              If you believe our processing violates data protection laws, you have the right to lodge a complaint with:
            </p>
            <ul>
              <li>
                <strong>Portuguese Data Protection Authority (CNPD)</strong><br />
                Comissão Nacional de Proteção de Dados<br />
                Av. D. Carlos I, 134, 1º<br />
                1200-651 Lisboa, Portugal<br />
                Email: <a href="mailto:geral@cnpd.pt" className="text-blue-600 hover:underline">geral@cnpd.pt</a>
              </li>
              <li>Your local data protection authority (if different)</li>
            </ul>

            <h3>14.2 Internal Complaint Handling</h3>
            <p>
              We encourage you to contact us first at <a href="mailto:privacy@caenhebo.com" className="text-blue-600 hover:underline">privacy@caenhebo.com</a> so 
              we can address your concerns directly.
            </p>

            <h2>15. CHANGES TO THIS PRIVACY POLICY</h2>
            
            <h3>15.1 Policy Updates</h3>
            <p>
              We may update this Privacy Policy to reflect changes in our practices, technologies, legal requirements, 
              or other factors. Material changes will be notified via email or Platform notice.
            </p>

            <h3>15.2 Version Control</h3>
            <p>
              Each version will be dated. The "Last Modified" date at the top indicates the most recent revision. 
              Continued use after changes constitutes acceptance of the updated policy.
            </p>

            <h2>16. CONTACT INFORMATION</h2>
            
            <div className="bg-gray-100 p-6 rounded-lg mt-8">
              <h3 className="font-semibold mb-3">Data Protection Inquiries</h3>
              <p>
                <strong>Caenhebo Sociedade Imobiliária, Unipessoal LDA</strong><br />
                Data Protection Officer<br />
                Email: <a href="mailto:privacy@caenhebo.com" className="text-blue-600 hover:underline">privacy@caenhebo.com</a><br />
                General Support: <a href="mailto:support@caenhebo.com" className="text-blue-600 hover:underline">support@caenhebo.com</a>
              </p>
              <p className="mt-4">
                For data protection inquiries, please allow 72 hours for an initial response. 
                Complex requests may require additional time as permitted by GDPR.
              </p>
            </div>

            <div className="mt-12 p-4 border-t-2 border-gray-300">
              <p className="text-center text-sm text-gray-600">
                This Privacy Policy forms part of our commitment to protecting your personal data 
                and ensuring transparency in our processing activities.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}