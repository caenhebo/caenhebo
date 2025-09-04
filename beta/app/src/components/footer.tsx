import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-gray-600 mb-4 md:mb-0">
            © 2025 Caenhebo Sociedade Imobiliária, Unipessoal LDA. All rights reserved.
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <Link 
              href="/legal/terms" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Terms & Conditions
            </Link>
            <span className="text-gray-300">|</span>
            <Link 
              href="/legal/privacy" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-300">|</span>
            <a 
              href="mailto:support@caenhebo.com" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Support
            </a>
            <span className="text-gray-300">|</span>
            <a 
              href="mailto:privacy@caenhebo.com" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Privacy
            </a>
          </div>
        </div>
        
        <div className="mt-4 text-center text-xs text-gray-500">
          Digital assets managed by <a href="https://striga.com" target="_blank" rel="noopener noreferrer" className="underline">Striga.com</a>
        </div>
      </div>
    </footer>
  )
}