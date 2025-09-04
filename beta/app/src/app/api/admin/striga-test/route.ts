import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { strigaApiRequest } from '@/lib/striga'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // Test the connection by making a simple API call
    // Use the /ping endpoint to test authentication
    const testResponse = await strigaApiRequest('/ping', {
      method: 'POST',
      body: JSON.stringify({})
    })

    // Check if we got the expected "pong" response
    if (testResponse === 'pong') {
      return NextResponse.json({ 
        success: true,
        message: 'Connection successful! Striga API is working correctly.'
      })
    } else {
      throw new Error('Unexpected response from Striga API')
    }
  } catch (error: any) {
    console.error('Striga connection test failed:', error)
    
    // Provide helpful error messages
    if (error.message.includes('401')) {
      return NextResponse.json(
        { error: 'Invalid API credentials. Please check your API key and secret.' },
        { status: 401 }
      )
    } else if (error.message.includes('ECONNREFUSED')) {
      return NextResponse.json(
        { error: 'Cannot connect to Striga API. Please check the base URL.' },
        { status: 503 }
      )
    } else {
      return NextResponse.json(
        { error: `Connection failed: ${error.message}` },
        { status: 500 }
      )
    }
  }
}