import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import fs from 'fs/promises'
import path from 'path'

const CONFIG_FILE = path.join(process.cwd(), '.env')

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Read current configuration from environment
  const config = {
    applicationId: process.env.STRIGA_APPLICATION_ID || '',
    apiKey: process.env.STRIGA_API_KEY || '',
    apiSecret: process.env.STRIGA_API_SECRET || '',
    uiSecret: process.env.STRIGA_UI_SECRET || '',
    baseUrl: process.env.STRIGA_BASE_URL || 'https://www.sandbox.striga.com/api/v1',
    webhookSecret: process.env.STRIGA_WEBHOOK_SECRET || ''
  }

  // Mask sensitive data for display
  return NextResponse.json({
    applicationId: config.applicationId,
    apiKey: config.apiKey ? '••••••' + config.apiKey.slice(-4) : '',
    apiSecret: config.apiSecret ? '••••••' + config.apiSecret.slice(-4) : '',
    uiSecret: config.uiSecret ? '••••••' + config.uiSecret.slice(-4) : '',
    baseUrl: config.baseUrl,
    webhookSecret: config.webhookSecret ? '••••••' + config.webhookSecret.slice(-4) : ''
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const { applicationId, apiKey, apiSecret, uiSecret, baseUrl, webhookSecret } = await req.json()

    // Read existing .env file
    let envContent = ''
    try {
      envContent = await fs.readFile(CONFIG_FILE, 'utf-8')
    } catch (error) {
      // File doesn't exist, create new content
    }

    // Update or add Striga configuration
    const envLines = envContent.split('\n')
    const configMap = new Map()

    // Parse existing env vars
    envLines.forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        configMap.set(match[1], match[2])
      }
    })

    // Update Striga values
    if (applicationId) {
      configMap.set('STRIGA_APPLICATION_ID', `"${applicationId}"`)
    }
    if (apiKey && !apiKey.includes('••••')) {
      configMap.set('STRIGA_API_KEY', `"${apiKey}"`)
    }
    if (apiSecret && !apiSecret.includes('••••')) {
      configMap.set('STRIGA_API_SECRET', `"${apiSecret}"`)
    }
    if (uiSecret && !uiSecret.includes('••••')) {
      configMap.set('STRIGA_UI_SECRET', `"${uiSecret}"`)
    }
    if (baseUrl) {
      configMap.set('STRIGA_BASE_URL', `"${baseUrl}"`)
    }
    if (webhookSecret && !webhookSecret.includes('••••')) {
      configMap.set('STRIGA_WEBHOOK_SECRET', `"${webhookSecret}"`)
    }

    // Rebuild env file content
    let newEnvContent = ''
    configMap.forEach((value, key) => {
      newEnvContent += `${key}=${value}\n`
    })

    // Write updated content
    await fs.writeFile(CONFIG_FILE, newEnvContent.trim())

    // Update process.env for immediate use
    if (applicationId) process.env.STRIGA_APPLICATION_ID = applicationId
    if (apiKey && !apiKey.includes('••••')) process.env.STRIGA_API_KEY = apiKey
    if (apiSecret && !apiSecret.includes('••••')) process.env.STRIGA_API_SECRET = apiSecret
    if (uiSecret && !uiSecret.includes('••••')) process.env.STRIGA_UI_SECRET = uiSecret
    if (baseUrl) process.env.STRIGA_BASE_URL = baseUrl
    if (webhookSecret && !webhookSecret.includes('••••')) process.env.STRIGA_WEBHOOK_SECRET = webhookSecret

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to save configuration:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}