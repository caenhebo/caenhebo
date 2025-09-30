# Document Requirements Update - September 30, 2025

## Changes Made

Updated the property document requirements in Caenhebo Beta to comply with Portuguese real estate regulations.

### Files Modified

1. `/root/Caenhebo/beta/app/src/app/seller/properties/[id]/documents/page.tsx`
2. `/root/Caenhebo/beta/app/src/app/api/properties/[id]/documents/upload/route.ts`

### New Required Documents (10 total)

The following documents are now **REQUIRED** for property listings:

1. **Caderneta Predial (CP)** - Tax registration certificate from Autoridade Tributária - Serviço de Finanças (Tax Office)
2. **Certidão do Registo Predial** - Real estate registry certificate from Conservatória do Registo Predial (Registry Office)
3. **Licença de Utilização** - Usage license from Câmara Municipal (City Council)
4. **Planta do Imóvel** - Property floor plans
5. **Certificado Energético** - Energy certificate issued by a qualified technician
6. **Ficha Técnica da Habitação (FTH)** - Technical datasheet prepared by engineers/architects
7. **Direito de Preferência da Câmara Municipal** - Preference rights application addressed to City Council
8. **Declaração de Não Dívida do Condomínio** - Non-debt certificate issued by condominium management
9. **Declaração de Conformidade** - Compliance Declaration Form
10. **Personal ID** - Passport or National ID of property owner

### Recommended Documents (Optional)

These documents are **RECOMMENDED** but not required:

1. **Owner Authorization Form (Autorização do Proprietário)** - Written authorization from property owner
2. **Title Deed (Escritura)** - Property title deed
3. **Property Photos (Fotografias do Imóvel)** - Visual documentation
4. **Other Documents (Outros Documentos)** - Any additional relevant documentation

## User Interface Changes

- Required documents now clearly marked with red asterisk (*)
- Document categories reorganized with required documents listed first
- Compliance status card shows checklist of all required documents
- Missing document alerts prominently displayed
- All required documents must be uploaded before property can be reviewed

## File Type Restrictions

Each document type has specific allowed file formats:

- **PDF documents**: `.pdf` only for certificates
- **Mixed formats**: `.pdf`, `.doc`, `.docx` for most documents
- **Floor plans/ID**: Also accepts images (`.jpg`, `.jpeg`, `.png`)

## Deployment

Changes deployed to production on September 30, 2025 at 16:00 UTC.

Application restarted in production mode on port 3019.

## Testing

Visit: http://95.179.170.56:3019/seller/properties/[property-id]/documents

The document upload page now reflects all new requirements with proper categorization.
