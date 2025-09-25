export type DocumentCategory = 'PERSONAL' | 'PROPERTY'

export const PERSONAL_DOCUMENT_TYPES = [
  'OWNER_AUTHORIZATION',
  'COMPLIANCE_DECLARATION',
  'PERSONAL_ID'
]

export const PROPERTY_DOCUMENT_TYPES = [
  'ENERGY_CERTIFICATE',
  'MUNICIPAL_LICENSE',
  'PREDIAL_REGISTRATION',
  'CADERNETA_PREDIAL_URBANA',
  'REPRESENTATION_DOCUMENT',
  'MEDIATION_AGREEMENT',
  'PURCHASE_AGREEMENT',
  'PAYMENT_PROOF',
  'NOTARIZED_DOCUMENT',
  'TITLE_DEED',
  'CERTIFICATE',
  'PHOTO',
  'FLOOR_PLAN',
  'OTHER',
  'USAGE_LICENSE',
  'LAND_REGISTRY',
  'TAX_REGISTER',
  'CONTRACT',
  'PROOF_OF_PAYMENT',
  'LEGAL_DOCUMENT'
]

export function getDocumentCategory(documentType: string): DocumentCategory {
  return PERSONAL_DOCUMENT_TYPES.includes(documentType) ? 'PERSONAL' : 'PROPERTY'
}

export function categorizeDocuments<T extends { documentType: string }>(documents: T[]): {
  personal: T[]
  property: T[]
} {
  return {
    personal: documents.filter(doc => getDocumentCategory(doc.documentType) === 'PERSONAL'),
    property: documents.filter(doc => getDocumentCategory(doc.documentType) === 'PROPERTY')
  }
}

export const getDocumentTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    // Personal Documents
    COMPLIANCE_DECLARATION: '📋 Compliance Declaration',
    OWNER_AUTHORIZATION: '✍️ Owner Authorization',
    PERSONAL_ID: '🆔 Personal ID',

    // Property Documents
    ENERGY_CERTIFICATE: '⚡ Energy Certificate',
    USAGE_LICENSE: '📜 Usage License',
    LAND_REGISTRY: '🏛 Land Registry Certificate',
    TAX_REGISTER: '📄 Tax Register',
    FLOOR_PLAN: '📐 Floor Plan',
    TITLE_DEED: '📑 Title Deed',
    PHOTO: '📷 Photo',
    MUNICIPAL_LICENSE: '🏢 Municipal License',
    PREDIAL_REGISTRATION: '📋 Predial Registration',
    CADERNETA_PREDIAL_URBANA: '🏘 Urban Property Register',
    REPRESENTATION_DOCUMENT: '📃 Representation Document',
    MEDIATION_AGREEMENT: '🤝 Mediation Agreement',
    PURCHASE_AGREEMENT: '📝 Purchase Agreement',
    PAYMENT_PROOF: '💳 Payment Proof',
    NOTARIZED_DOCUMENT: '📜 Notarized Document',
    CERTIFICATE: '🏆 Certificate',
    CONTRACT: '📄 Contract',
    PROOF_OF_PAYMENT: '💰 Proof of Payment',
    LEGAL_DOCUMENT: '⚖️ Legal Document',
    OTHER: '📎 Other'
  }
  return labels[type] || type
}