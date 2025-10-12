// src/components/BrowserGuidanceBanner.tsx
'use client'

import { useState, useEffect } from 'react'
import { X, Copy, Share2 } from 'lucide-react'
import { detectBrowserInfo, getBrowserSwitchMessage, copyCurrentUrl, shareCurrentUrl } from '@/lib/browser-detection'
import toast from 'react-hot-toast'

const DISMISSAL_KEY = 'marketdz_browser_banner_dismissed'
const DISMISSAL_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

export default function BrowserGuidanceBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    // Check if banner was dismissed recently
    const dismissedUntil = localStorage.getItem(DISMISSAL_KEY)
    console.log('🎯 BrowserGuidanceBanner: dismissedUntil =', dismissedUntil)
    if (dismissedUntil) {
      const dismissedTime = parseInt(dismissedUntil, 10)
      if (Date.now() < dismissedTime) {
        console.log('🎯 BrowserGuidanceBanner: Banner was dismissed, hiding')
        setIsVisible(false)
        return
      }
    }

    // Detect browser and platform
    const browserInfo = detectBrowserInfo()
    console.log('🎯 BrowserGuidanceBanner: browserInfo =', browserInfo)

    // Only show banner if user needs to switch browsers
    if (browserInfo.needsBrowserSwitch) {
      const message = getBrowserSwitchMessage(browserInfo)
      console.log('🎯 BrowserGuidanceBanner: SHOWING BANNER with message:', message)
      setMessage(message)
      setIsVisible(true)
    } else {
      console.log('🎯 BrowserGuidanceBanner: NOT showing banner - needsBrowserSwitch is false')
    }

    // Check if Web Share API is available
    setCanShare(!!navigator.share)
  }, [])

  const handleDismiss = () => {
    // Store dismissal timestamp (7 days from now)
    const dismissUntil = Date.now() + DISMISSAL_DURATION
    localStorage.setItem(DISMISSAL_KEY, dismissUntil.toString())
    setIsVisible(false)
  }

  const handleCopyLink = async () => {
    const success = await copyCurrentUrl()
    if (success) {
      toast.success('Link copied! Open it in the recommended browser')
    } else {
      toast.error('Failed to copy link')
    }
  }

  const handleShare = async () => {
    const success = await shareCurrentUrl()
    if (!success) {
      // Fallback to copy if share fails
      handleCopyLink()
    }
  }

  if (!isVisible || !message) return null

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Message */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm text-gray-800 font-medium truncate">{message}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Share button (mobile only if supported) */}
          {canShare && (
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-white hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
              aria-label="Share link"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          {/* Copy button */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-white hover:bg-purple-50 rounded-lg transition-colors border border-purple-200"
            aria-label="Copy link"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Copy Link</span>
          </button>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
