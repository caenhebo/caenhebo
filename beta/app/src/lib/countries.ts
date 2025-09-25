import { countryCodes } from './country-codes'

// Convert our country codes to the format expected by the address selector
// Excluding Russia, China, Iran, Sudan, North Korea (already excluded in country-codes.ts)
export const countries = countryCodes.map(country => ({
  code: country.code,
  name: country.name,
  flag: country.flag,
  region: country.region
})).sort((a, b) => {
  // Sort alphabetically by name
  return a.name.localeCompare(b.name)
})

// Popular countries for quick access (same as phone codes)
export const popularCountries = [
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', region: 'Europe' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', region: 'Europe' },
  { code: 'FR', name: 'France', flag: '🇫🇷', region: 'Europe' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', region: 'Europe' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', region: 'Europe' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', region: 'Europe' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', region: 'Europe' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', region: 'Europe' },
  { code: 'US', name: 'United States', flag: '🇺🇸', region: 'Americas' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', region: 'Americas' },
]

// Helper to get country by code
export function getCountryByCode(code: string) {
  return countries.find(c => c.code === code)
}

// Helper to search countries
export function searchCountriesByName(query: string) {
  const lowerQuery = query.toLowerCase()
  return countries.filter(country =>
    country.name.toLowerCase().includes(lowerQuery) ||
    country.code.toLowerCase().includes(lowerQuery)
  )
}