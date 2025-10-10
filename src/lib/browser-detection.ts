// src/lib/browser-detection.ts
// Browser and platform detection for optimal PWA installation

export interface BrowserInfo {
  platform: 'ios' | 'android' | 'desktop' | 'other'
  currentBrowser: 'safari' | 'chrome' | 'edge' | 'firefox' | 'other'
  recommendedBrowser: 'safari' | 'chrome'
  isOptimalBrowser: boolean
  isInstalled: boolean
  needsBrowserSwitch: boolean
  installInstructions: string
}

/**
 * Detects user's platform, browser, and provides PWA installation guidance
 */
export function detectBrowserInfo(): BrowserInfo {
  // Default values for SSR
  if (typeof window === 'undefined') {
    return {
      platform: 'other',
      currentBrowser: 'other',
      recommendedBrowser: 'chrome',
      isOptimalBrowser: false,
      isInstalled: false,
      needsBrowserSwitch: false,
      installInstructions: '',
    }
  }

  const userAgent = navigator.userAgent.toLowerCase()

  // Detect platform first
  const isIOS = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream
  const isAndroid = /android/.test(userAgent)
  const isDesktop = !isIOS && !isAndroid

  const platform: BrowserInfo['platform'] = isIOS
    ? 'ios'
    : isAndroid
    ? 'android'
    : isDesktop
    ? 'desktop'
    : 'other'

  // CRITICAL: Check if already installed BEFORE browser detection
  // Use BOTH methods (industry best practice)
  const isInstalled =
    (navigator as any).standalone === true || // iOS-specific (works since iOS 2.0)
    window.matchMedia('(display-mode: standalone)').matches // Cross-platform

  // Detect browser in CORRECT ORDER (most specific first)
  let currentBrowser: BrowserInfo['currentBrowser'] = 'other'

  if (isIOS) {
    // iOS browser detection - check specific markers FIRST
    if (/crios/.test(userAgent)) {
      currentBrowser = 'chrome' // iOS Chrome
    } else if (/fxios/.test(userAgent)) {
      currentBrowser = 'firefox' // iOS Firefox
    } else if (/edgios/.test(userAgent)) {
      currentBrowser = 'edge' // iOS Edge
    } else if (/safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent)) {
      // iOS Safari - MUST NOT contain other browser markers
      currentBrowser = 'safari'
    }
  } else if (isAndroid) {
    // Android browser detection
    if (/edg/.test(userAgent)) {
      currentBrowser = 'edge'
    } else if (/chrome/.test(userAgent) && !/edg/.test(userAgent)) {
      currentBrowser = 'chrome'
    } else if (/firefox/.test(userAgent)) {
      currentBrowser = 'firefox'
    }
  } else {
    // Desktop browser detection
    if (/edg/.test(userAgent)) {
      currentBrowser = 'edge'
    } else if (/chrome/.test(userAgent) && !/edg/.test(userAgent)) {
      currentBrowser = 'chrome'
    } else if (/firefox/.test(userAgent)) {
      currentBrowser = 'firefox'
    } else if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
      currentBrowser = 'safari'
    }
  }

  // Determine recommended browser based on platform
  const recommendedBrowser: BrowserInfo['recommendedBrowser'] = isIOS ? 'safari' : 'chrome'

  // Check if user is on optimal browser
  const isOptimalBrowser =
    (isIOS && currentBrowser === 'safari') ||
    (isAndroid && currentBrowser === 'chrome') ||
    (isDesktop && (currentBrowser === 'chrome' || currentBrowser === 'edge'))

  // Determine if user needs to switch browsers
  const needsBrowserSwitch = !isOptimalBrowser && !isInstalled && (isIOS || isAndroid)

  // Platform-specific install instructions
  let installInstructions = ''

  if (isIOS && currentBrowser === 'safari') {
    installInstructions = `To install MarketDZ:

1. Tap the Share button ⬆️ at the bottom
2. Scroll and tap "Add to Home Screen"
3. Tap "Add"

You'll have MarketDZ like a native app! 🎉`
  } else if (isIOS && currentBrowser !== 'safari') {
    installInstructions = `For easy installation, please open this page in Safari:

1. Copy the link below
2. Open Safari
3. Paste and open the link
4. Tap Share ⬆️ → "Add to Home Screen"

Safari is required for installing apps on iPhone.`
  } else if (isAndroid && currentBrowser === 'chrome') {
    installInstructions = `To install MarketDZ:

1. Tap the menu (⋮) button
2. Select "Add to Home Screen" or "Install app"
3. Tap "Install"

Or simply tap the "Install App" button when prompted!`
  } else if (isAndroid && currentBrowser !== 'chrome') {
    installInstructions = `For the best installation experience, please open this page in Chrome:

1. Copy the link below
2. Open Chrome browser
3. Paste and open the link
4. Tap "Install" when prompted

Chrome provides the easiest way to install apps on Android.`
  } else if (isDesktop) {
    installInstructions = `To install MarketDZ on your computer:

1. Look for the install icon (⊕) in your browser's address bar
2. Click it and select "Install"

Or use your browser menu and select "Install MarketDZ"`
  }

  // Debug logging
  console.log('🔍 Browser Detection:', {
    platform,
    currentBrowser,
    isOptimalBrowser,
    isInstalled,
    needsBrowserSwitch,
    userAgent: userAgent.substring(0, 100) + '...'
  })

  return {
    platform,
    currentBrowser,
    recommendedBrowser,
    isOptimalBrowser,
    isInstalled,
    needsBrowserSwitch,
    installInstructions,
  }
}

/**
 * Get a friendly browser switch message
 */
export function getBrowserSwitchMessage(browserInfo: BrowserInfo): string {
  if (!browserInfo.needsBrowserSwitch) return ''

  if (browserInfo.platform === 'ios') {
    return '📱 Tip: Open in Safari to install the app'
  }

  if (browserInfo.platform === 'android') {
    return '📱 Tip: Open in Chrome to install the app'
  }

  return ''
}

/**
 * Copy current URL to clipboard
 */
export async function copyCurrentUrl(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(window.location.href)
    return true
  } catch (error) {
    console.error('Failed to copy URL:', error)
    return false
  }
}

/**
 * Share current URL using native share API
 */
export async function shareCurrentUrl(): Promise<boolean> {
  if (!navigator.share) return false

  try {
    await navigator.share({
      title: 'MarketDZ - Marketplace Algeria',
      text: 'Check out MarketDZ marketplace',
      url: window.location.href,
    })
    return true
  } catch (error) {
    // User cancelled share or error occurred
    console.log('Share cancelled or failed:', error)
    return false
  }
}
