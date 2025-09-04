'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

declare global {
  interface Window {
    SumsubWebSdk: any
    idensic: any
  }
}

interface SumSubKycProps {
  token: string
  onComplete?: () => void
  onError?: (error: any) => void
}

export function SumSubKyc({ token, onComplete, onError }: SumSubKycProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sdkReady, setSdkReady] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // Check for SDK availability after script loads
  useEffect(() => {
    if (!scriptLoaded) return
    
    const checkSdk = setInterval(() => {
      console.log('[SumSub] Checking for SDK...', {
        SumsubWebSdk: typeof window.SumsubWebSdk,
        idensic: typeof window.idensic
      })
      
      if (window.SumsubWebSdk || window.idensic) {
        setSdkReady(true)
        clearInterval(checkSdk)
      }
    }, 100)
    
    // Stop checking after 5 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkSdk)
      console.error('[SumSub] SDK failed to load after 5 seconds')
      onError?.({ message: 'SumSub SDK failed to load' })
    }, 5000)

    return () => {
      clearInterval(checkSdk)
      clearTimeout(timeout)
    }
  }, [scriptLoaded, onError])

  useEffect(() => {
    if (!token || !sdkReady) return
    
    const SumsubWebSdk = window.SumsubWebSdk || window.idensic
    if (!SumsubWebSdk) {
      console.error('[SumSub] SDK not found on window')
      return
    }

    console.log('[SumSub] Initializing with token:', token)
    
    // Parse the token to check if it contains URL info
    try {
      // The token format is _act-sbx-jwt-<base64>.<base64>.<signature>
      const parts = token.split('.')
      if (parts.length >= 2) {
        const payload = JSON.parse(atob(parts[1]))
        console.log('[SumSub] Token payload:', payload)
      }
    } catch (e) {
      console.log('[SumSub] Could not parse token payload')
    }

    let sdk: any = null

    try {
      // Initialize SumSub SDK with access token
      const accessToken = token // Use token as-is
      
      sdk = SumsubWebSdk.init(
        token, // Use the full token as-is
        () => {
          console.log('[SumSub] Access token accepted')
        },
        () => {
          console.error('[SumSub] Access token rejected or expired')
          onError?.({ message: 'Token expired or invalid' })
        }
      )
        .withConf({
          lang: 'en',
          country: 'PT'
        })
        .withOptions({
          addViewportTag: false,
          adaptIframeHeight: true
        })
        .on('idCheck.onApplicantLoaded', () => {
          console.log('[SumSub] Applicant loaded')
        })
        .on('idCheck.onApplicantSubmitted', () => {
          console.log('[SumSub] Verification submitted')
          onComplete?.()
        })
        .on('idCheck.onError', (error: any) => {
          console.error('[SumSub] Verification error:', error)
          onError?.(error)
        })
        .on('idCheck.stepCompleted', (payload: any) => {
          console.log('[SumSub] Step completed:', payload)
        })
        .on('idCheck.applicantStatus', (status: any) => {
          console.log('[SumSub] Applicant status:', status)
        })
        .build()

      // Mount the SDK
      if (containerRef.current && sdk) {
        console.log('[SumSub] Launching SDK in container')
        sdk.launch('#sumsub-container')
          .then(() => {
            console.log('[SumSub] SDK launched successfully')
          })
          .catch((error: any) => {
            console.error('[SumSub] Failed to launch SDK:', error)
            onError?.(error)
          })
      } else {
        console.error('[SumSub] Missing container or SDK instance')
      }
    } catch (error) {
      console.error('[SumSub] Failed to initialize:', error)
      onError?.(error)
    }

    return () => {
      // Cleanup
      try {
        sdk?.destroy()
      } catch (e) {
        console.error('[SumSub] Error destroying SDK:', e)
      }
    }
  }, [token, sdkReady, onComplete, onError])

  return (
    <>
      <Script 
        src="https://static.sumsub.com/idensic/static/sns-websdk-builder.js"
        strategy="lazyOnload"
        onLoad={() => {
          console.log('[SumSub] Script loaded')
          setScriptLoaded(true)
        }}
        onError={(e) => {
          console.error('[SumSub] Failed to load script:', e)
          onError?.({ message: 'Failed to load SumSub SDK' })
        }}
      />
      <div id="sumsub-container" ref={containerRef} className="w-full min-h-[600px]">
        {!sdkReady && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading verification system...</p>
          </div>
        )}
      </div>
    </>
  )
}