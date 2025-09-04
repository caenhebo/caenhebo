import { NextRequest, NextResponse } from 'next/server'

const OWNER_AUTHORIZATION_TEMPLATE = `OWNER AUTHORIZATION FORM
FORMULÁRIO DE AUTORIZAÇÃO DO PROPRIETÁRIO

================================================================================

PROPERTY DETAILS / DETALHES DO IMÓVEL

Property Address / Endereço do Imóvel:
______________________________________________________________________________

Property Registration Number / Número de Registo Predial:
______________________________________________________________________________

Tax Registration Number / Número de Inscrição Matricial:
______________________________________________________________________________

================================================================================

OWNER INFORMATION / INFORMAÇÃO DO PROPRIETÁRIO

Full Name / Nome Completo:
______________________________________________________________________________

ID/Passport Number / Número de BI/Passaporte:
______________________________________________________________________________

Tax Number (NIF) / Número de Contribuinte:
______________________________________________________________________________

Address / Morada:
______________________________________________________________________________

Phone Number / Número de Telefone:
______________________________________________________________________________

Email:
______________________________________________________________________________

================================================================================

AUTHORIZATION / AUTORIZAÇÃO

I, the undersigned, as the legal owner of the above-mentioned property, hereby 
authorize:

Eu, abaixo assinado, na qualidade de proprietário legal do imóvel acima 
mencionado, autorizo:

CAENHEBO PLATFORM

To / Para:
• List my property for sale on the Caenhebo platform
  Listar o meu imóvel para venda na plataforma Caenhebo

• Market and advertise the property to potential buyers
  Comercializar e publicitar o imóvel a potenciais compradores

• Facilitate viewings and negotiations with interested parties
  Facilitar visitas e negociações com partes interessadas

• Process offers and manage the sales transaction
  Processar ofertas e gerir a transação de venda

• Handle all necessary documentation related to the sale
  Tratar de toda a documentação necessária relacionada com a venda

Asking Price / Preço Pedido: EUR _______________

Commission Agreement / Acordo de Comissão: ________%

This authorization is valid for / Esta autorização é válida por:
[ ] 6 months / 6 meses
[ ] 12 months / 12 meses
[ ] Other / Outro: _______________

================================================================================

TERMS AND CONDITIONS / TERMOS E CONDIÇÕES

1. I confirm that I am the legal owner of the property and have the right to 
   sell it.
   Confirmo que sou o proprietário legal do imóvel e tenho o direito de 
   vendê-lo.

2. I agree to provide all necessary documentation for the sale process.
   Concordo em fornecer toda a documentação necessária para o processo de venda.

3. I understand that Caenhebo will charge the agreed commission upon successful 
   sale.
   Compreendo que a Caenhebo cobrará a comissão acordada após a venda 
   bem-sucedida.

4. I authorize Caenhebo to share property information with potential buyers.
   Autorizo a Caenhebo a partilhar informações do imóvel com potenciais 
   compradores.

================================================================================

SIGNATURE / ASSINATURA

Owner's Signature / Assinatura do Proprietário:

______________________________________________________________________________

Date / Data: ____/____/________

Place / Local: ________________________________________________________________

================================================================================

WITNESS / TESTEMUNHA (Optional / Opcional)

Name / Nome:
______________________________________________________________________________

Signature / Assinatura:
______________________________________________________________________________

Date / Data: ____/____/________

================================================================================

This form must be signed and submitted along with a copy of the owner's 
identification document.

Este formulário deve ser assinado e enviado juntamente com uma cópia do 
documento de identificação do proprietário.
`

export async function GET(request: NextRequest) {
  try {
    // Return the template as a text file that can be downloaded
    return new NextResponse(OWNER_AUTHORIZATION_TEMPLATE, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="owner-authorization-form.txt"',
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