'use client'

import { useEffect } from 'react'

interface SumSubSimpleProps {
  token: string
}

export function SumSubSimple({ token }: SumSubSimpleProps) {
  useEffect(() => {
    // Add SumSub script dynamically
    const script = document.createElement('script')
    script.src = 'https://static.sumsub.com/idensic/static/sns-websdk-builder.js'
    script.async = true
    
    script.onload = () => {
      console.log('[SumSub Simple] Script loaded')
      
      // Try multiple ways to access the SDK
      const SumsubWebSdk = (window as any).SumsubWebSdk || (window as any).idensic || (window as any).SNS
      
      console.log('[SumSub Simple] Available globals:', {
        SumsubWebSdk: !!(window as any).SumsubWebSdk,
        idensic: !!(window as any).idensic,
        SNS: !!(window as any).SNS,
        snsWebSdk: !!(window as any).snsWebSdk,
        windowKeys: Object.keys(window).filter(k => k.toLowerCase().includes('sum') || k.toLowerCase().includes('iden') || k.toLowerCase().includes('sns')),
        allNewKeys: Object.keys(window).slice(-20) // Show last 20 keys added to window
      })
      
      if (!SumsubWebSdk) {
        console.error('[SumSub Simple] No SDK found after script load')
        return
      }
      
      try {
        console.log('[SumSub Simple] Initializing with token:', token)
        
        const snsWebSdkInstance = SumsubWebSdk.init(
          token,
          // Success callback
          () => {
            console.log('[SumSub Simple] Token accepted, SDK initialized')
          },
          // Error callback  
          (error: any) => {
            console.error('[SumSub Simple] Token error:', error)
          }
        )
          .withConf({
            lang: 'en',
            country: 'PT'
          })
          .withOptions({ addViewportTag: false, adaptIframeHeight: true })
          .on('idCheck.onApplicantLoaded', () => {
            console.log('[SumSub Simple] Applicant loaded')
          })
          .on('idCheck.onApplicantSubmitted', () => {
            console.log('[SumSub Simple] Applicant submitted')
          })
          .on('idCheck.onError', (error: any) => {
            console.error('[SumSub Simple] Error:', error)
          })
          .build()
          
        // Launch the SDK
        snsWebSdkInstance.launch('#sumsub-container')
      } catch (error) {
        console.error('[SumSub Simple] Failed to initialize:', error)
      }
    }
    
    script.onerror = () => {
      console.error('[SumSub Simple] Failed to load script')
    }
    
    document.head.appendChild(script)
    
    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [token])
  
  return (
    <div id="sumsub-container" style={{ width: '100%', minHeight: '600px' }}>
      <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
        Loading verification system...
      </p>
    </div>
  )
}