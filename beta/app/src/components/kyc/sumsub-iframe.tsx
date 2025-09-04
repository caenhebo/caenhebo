'use client'

import { useEffect, useState } from 'react'

interface SumSubIframeProps {
  token: string
}

export function SumSubIframe({ token }: SumSubIframeProps) {
  const [iframeUrl, setIframeUrl] = useState('')
  
  useEffect(() => {
    // Parse the JWT token to get the URL
    try {
      // Token format: _act-sbx-jwt-<header>.<payload>.<signature>
      const tokenParts = token.split('.')
      if (tokenParts.length >= 2) {
        // Decode the payload
        const payload = JSON.parse(atob(tokenParts[1].replace(/_/g, '/').replace(/-/g, '+')))
        console.log('[SumSub Iframe] Token payload:', payload)
        
        // The payload should contain the URL
        if (payload.url) {
          // Construct the iframe URL with the token
          const url = `${payload.url}?accessToken=${token}&lang=en`
          console.log('[SumSub Iframe] Iframe URL:', url)
          setIframeUrl(url)
        } else {
          // Try default SumSub URL
          const defaultUrl = `https://api.sumsub.com/idensic/l/#/sbx/${token}`
          console.log('[SumSub Iframe] Using default URL:', defaultUrl)
          setIframeUrl(defaultUrl)
        }
      }
    } catch (error) {
      console.error('[SumSub Iframe] Error parsing token:', error)
      // Fallback to direct iframe approach
      const fallbackUrl = `https://api.sumsub.com/idensic/l/#/sbx/${token}`
      setIframeUrl(fallbackUrl)
    }
  }, [token])
  
  if (!iframeUrl) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Preparing verification...</p>
      </div>
    )
  }
  
  return (
    <div style={{ width: '100%', height: '700px', position: 'relative' }}>
      <iframe
        src={iframeUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: '8px'
        }}
        allow="camera; microphone; geolocation; clipboard-read; clipboard-write"
        allowFullScreen
      />
    </div>
  )
}