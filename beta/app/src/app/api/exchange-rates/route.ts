import { NextResponse } from 'next/server'
import { strigaApiRequest } from '@/lib/striga'

export async function GET() {
  try {
    const rates = await strigaApiRequest<any>('/trade/rates', {
      method: 'POST',
      body: JSON.stringify({})
    })

    return NextResponse.json(rates)
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    )
  }
}