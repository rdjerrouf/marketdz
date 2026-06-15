'use client';

import { useState, useEffect } from 'react';
import { detectBrowserInfo } from '@/lib/browser-detection';
import toast from 'react-hot-toast';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'sidebar' | 'mobile' | 'compact';
}

export default function PWAInstallButton({ className = '', variant = 'compact' }: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const browserInfo = detectBrowserInfo();
    console.log('📱 PWAInstallButton: browserInfo =', browserInfo);

    // Hide button if already installed
    if (browserInfo.isInstalled) {
      console.log('📱 PWAInstallButton: App is already installed - HIDING button');
      setShowInstallButton(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: any) => {
      console.log('📱 PWAInstallButton: beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      console.log('📱 PWAInstallButton: App was installed');
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show button for iOS Safari (doesn't fire beforeinstallprompt)
    if (browserInfo.platform === 'ios' && browserInfo.currentBrowser === 'safari') {
      console.log('📱 PWAInstallButton: iOS Safari detected - SHOWING install button');
      setShowInstallButton(true);
    } else {
      console.log('📱 PWAInstallButton: NOT iOS Safari - platform:', browserInfo.platform, 'browser:', browserInfo.currentBrowser);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    const browserInfo = detectBrowserInfo();

    // Check if already installed
    if (browserInfo.isInstalled) {
      toast.success('✅ DlalaDZ is already installed on your device!');
      return;
    }

    // If no deferred prompt, show platform-specific instructions
    if (!deferredPrompt) {
      console.log('📱 PWA: Manual trigger - showing instructions');

      // Show custom alert with platform-specific instructions
      alert(browserInfo.installInstructions || '⚠️ Your browser doesn\'t support app installation. Please try using Chrome, Edge, or Safari.');
      return;
    }

    // Show native install prompt (Chrome/Edge on Android)
    console.log('📱 PWA: Showing install prompt');
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log(`📱 PWA: User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      toast.success('🎉 Thanks for installing DlalaDZ!');
    }

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  const getButtonClasses = () => {
    const base = "flex items-center transition-all duration-300 group";
    
    switch (variant) {
      case 'sidebar':
        return `${base} w-full p-4 text-white/70 rounded-2xl hover:bg-gradient-to-r hover:from-pink-500/10 hover:to-purple-500/10 hover:text-pink-300 border border-pink-500/20`;
      case 'mobile':
        return `${base} w-full p-4 text-white/70 rounded-2xl hover:bg-gradient-to-r hover:from-pink-500/10 hover:to-purple-500/10 hover:text-pink-300 border border-pink-500/20`;
      case 'compact':
      default:
        return `${base} px-4 py-2 text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 backdrop-blur-sm rounded-lg border border-gray-200`;
    }
  };

  // Don't show button if already installed
  if (!showInstallButton) return null;

  return (
    <button
      className={`${getButtonClasses()} ${className}`}
      onClick={handleInstallPWA}
    >
      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      <span className="font-medium">Install App</span>
      {variant !== 'compact' && deferredPrompt && (
        <div className="ml-auto bg-gradient-to-r from-pink-400 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse shadow-lg">
          READY
        </div>
      )}
    </button>
  );
}