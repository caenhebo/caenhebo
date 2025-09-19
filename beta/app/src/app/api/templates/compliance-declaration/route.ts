import { NextRequest, NextResponse } from 'next/server'

const COMPLIANCE_DECLARATION_TEMPLATE = `PROPERTY COMPLIANCE DECLARATION FORM
DECLARAÇÃO DE CONFORMIDADE DO IMÓVEL

================================================================================

PROPERTY DETAILS / DETALHES DO IMÓVEL

Property Address / Endereço do Imóvel:
______________________________________________________________________________

Property Registration Number / Número de Registo Predial:
______________________________________________________________________________

Tax Registration Number / Número de Inscrição Matricial:
______________________________________________________________________________

Property Type / Tipo de Imóvel:
[ ] Apartment / Apartamento
[ ] House / Moradia
[ ] Villa / Vivenda
[ ] Land / Terreno
[ ] Commercial / Comercial
[ ] Other / Outro: _______________

Construction Year / Ano de Construção: _______________

Total Area / Área Total: _______________ m²

================================================================================

OWNER/SELLER DECLARATION / DECLARAÇÃO DO PROPRIETÁRIO/VENDEDOR

Full Name / Nome Completo:
______________________________________________________________________________

ID/Passport Number / Número de BI/Passaporte:
______________________________________________________________________________

Tax Number (NIF) / Número de Contribuinte:
______________________________________________________________________________

================================================================================

COMPLIANCE DECLARATION / DECLARAÇÃO DE CONFORMIDADE

I hereby declare that / Declaro que:

1. LEGAL STATUS / SITUAÇÃO LEGAL
   [ ] The property is free from any legal encumbrances, liens, or disputes
       O imóvel está livre de quaisquer ónus, penhoras ou litígios

   [ ] All property taxes are paid up to date
       Todos os impostos sobre o imóvel estão pagos até à data

   [ ] There are no pending legal proceedings affecting the property
       Não existem processos judiciais pendentes que afetem o imóvel

2. DOCUMENTATION / DOCUMENTAÇÃO
   [ ] I possess all original property documentation
       Possuo toda a documentação original do imóvel

   [ ] The property registration is current and accurate
       O registo predial está atualizado e correto

   [ ] All construction/renovation permits are valid and documented
       Todas as licenças de construção/renovação são válidas e documentadas

3. STRUCTURAL CONDITION / CONDIÇÃO ESTRUTURAL
   [ ] The property has no significant structural damage
       O imóvel não tem danos estruturais significativos

   [ ] All utilities (water, electricity, gas, sewage) are functioning properly
       Todos os serviços (água, eletricidade, gás, esgotos) funcionam corretamente

   [ ] There are no known environmental hazards (asbestos, mold, etc.)
       Não existem perigos ambientais conhecidos (amianto, mofo, etc.)

4. ENERGY CERTIFICATION / CERTIFICAÇÃO ENERGÉTICA
   [ ] Valid energy certificate exists (Certificate Number: _______________)
       Existe certificado energético válido (Número: _______________)

   [ ] Energy Rating / Classificação Energética: _______________

5. MUNICIPAL COMPLIANCE / CONFORMIDADE MUNICIPAL
   [ ] Property has valid habitation license (License Number: _______________)
       O imóvel tem licença de habitação válida (Número: _______________)

   [ ] All municipal taxes (IMI) are paid
       Todos os impostos municipais (IMI) estão pagos

   [ ] Property complies with local zoning regulations
       O imóvel cumpre os regulamentos de zonamento local

6. CONDOMINIUM (if applicable) / CONDOMÍNIO (se aplicável)
   [ ] All condominium fees are paid up to date
       Todas as taxas de condomínio estão pagas até à data

   [ ] No outstanding obligations to the condominium
       Não existem obrigações pendentes para com o condomínio

================================================================================

ADDITIONAL DECLARATIONS / DECLARAÇÕES ADICIONAIS

Are there any undisclosed defects or issues? / Existem defeitos ou problemas não
divulgados?
[ ] No / Não
[ ] Yes / Sim (please specify / especifique):
______________________________________________________________________________
______________________________________________________________________________
______________________________________________________________________________

Any pending repairs or maintenance? / Reparações ou manutenção pendentes?
[ ] No / Não
[ ] Yes / Sim (please specify / especifique):
______________________________________________________________________________
______________________________________________________________________________
______________________________________________________________________________

================================================================================

FALSE DECLARATION WARNING / AVISO DE DECLARAÇÃO FALSA

I understand that providing false or misleading information in this declaration
may result in:
- Legal prosecution / Processo judicial
- Contract cancellation / Cancelamento do contrato
- Financial penalties / Penalidades financeiras
- Civil and criminal liability / Responsabilidade civil e criminal

Compreendo que fornecer informações falsas ou enganosas nesta declaração pode
resultar em processo judicial, cancelamento do contrato, penalidades financeiras
e responsabilidade civil e criminal.

================================================================================

SIGNATURE / ASSINATURA

I declare that all information provided above is true and complete to the best
of my knowledge.

Declaro que todas as informações fornecidas acima são verdadeiras e completas,
tanto quanto é do meu conhecimento.

Owner/Seller Signature / Assinatura do Proprietário/Vendedor:

______________________________________________________________________________

Date / Data: ____/____/________

Place / Local: ________________________________________________________________

================================================================================

WITNESS / TESTEMUNHA (Recommended / Recomendado)

Name / Nome:
______________________________________________________________________________

ID Number / Número de BI:
______________________________________________________________________________

Signature / Assinatura:
______________________________________________________________________________

Date / Data: ____/____/________

================================================================================

IMPORTANT NOTES / NOTAS IMPORTANTES:

1. This form must be completed truthfully and in its entirety.
   Este formulário deve ser preenchido com veracidade e na sua totalidade.

2. Attach copies of all relevant documentation mentioned.
   Anexe cópias de toda a documentação relevante mencionada.

3. Keep a signed copy for your records.
   Guarde uma cópia assinada para os seus registos.

4. This declaration is valid for 90 days from the date of signature.
   Esta declaração é válida por 90 dias a partir da data de assinatura.

================================================================================
`

export async function GET(request: NextRequest) {
  try {
    // Return the template as a text file that can be downloaded
    return new NextResponse(COMPLIANCE_DECLARATION_TEMPLATE, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="compliance-declaration-form.txt"',
      },
    })
  } catch (error) {
    console.error('Failed to generate template:', error)
    return NextResponse.json(
      { error: 'Failed to generate template' },
      { status: 500 }
    )
  }
}