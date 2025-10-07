'use client';

import { useState, useEffect } from 'react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'sidebar' | 'mobile' | 'compact';
}

export default function PWAInstallButton({ className = '', variant = 'compact' }: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      console.log('📱 PWA: beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    const handleAppInstalled = () => {
      console.log('📱 PWA: App was installed');
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      console.log('📱 PWA: App is running in standalone mode');
      setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      console.log('📱 PWA: Manual trigger - checking install capability');
      if ('serviceWorker' in navigator) {
        if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
          alert('✅ Great! MarketDZ is already installed on your device.');
        } else {
          // More helpful instructions based on platform
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          if (isMobile) {
            alert('📱 To install MarketDZ:\n\n1. Tap the Share button (⋯ or ⬆️)\n2. Select "Add to Home Screen"\n3. Tap "Add" to confirm\n\nYou\'ll then be able to launch MarketDZ like a native app!');
          } else {
            alert('💻 To install MarketDZ:\n\n1. Look for the install icon (⊕) in your browser\'s address bar\n2. Click it and select "Install"\n\nOr use the browser menu and select "Install MarketDZ"');
          }
        }
      } else {
        alert('⚠️ Your browser doesn\'t support app installation. Please try using Chrome, Edge, or Safari.');
      }
      return;
    }

    console.log('📱 PWA: Showing install prompt');
    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;
    console.log(`📱 PWA: User response to install prompt: ${outcome}`);

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
        return `${base} px-4 py-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg border border-white/20`;
    }
  };

  return (
    <button 
      className={`${getButtonClasses()} ${className}`}
      onClick={handleInstallPWA}
    >
      <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      <span className="font-medium">Install App</span>
      {variant !== 'compact' && (
        <div className="ml-auto bg-gradient-to-r from-pink-400 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse shadow-lg">
          {deferredPrompt ? 'PWA' : 'TEST'}
        </div>
      )}
    </button>
  );
}