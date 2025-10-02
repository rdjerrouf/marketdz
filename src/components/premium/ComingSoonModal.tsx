'use client'

import { X, Sparkles, Zap, TrendingUp, Award } from 'lucide-react'

interface ComingSoonModalProps {
  isOpen: boolean
  onClose: () => void
  featureName: string
  featureIcon?: React.ReactNode
  benefits?: string[]
}

export default function ComingSoonModal({
  isOpen,
  onClose,
  featureName,
  featureIcon,
  benefits = []
}: ComingSoonModalProps) {
  if (!isOpen) return null

  const defaultBenefits = [
    'Boost your listings to the top',
    'Get 3x more visibility',
    'Sell faster with premium badges',
    'Stand out from the competition'
  ]

  const displayBenefits = benefits.length > 0 ? benefits : defaultBenefits

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 rounded-3xl border border-purple-500/30 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:1s]"></div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 z-10 group"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Content */}
        <div className="relative p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-2xl shadow-lg animate-pulse">
              {featureIcon || <Sparkles className="w-12 h-12 text-white" />}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-center mb-3 bg-gradient-to-r from-white via-purple-200 to-pink-200 bg-clip-text text-transparent">
            {featureName}
          </h2>

          {/* Coming Soon Badge */}
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-4 py-2 rounded-full text-sm font-bold flex items-center shadow-lg">
              <Zap className="w-4 h-4 mr-2" />
              Coming Soon
            </div>
          </div>

          {/* Description */}
          <p className="text-white/80 text-center mb-8 leading-relaxed">
            This premium feature is under development. We're working hard to bring you powerful tools to boost your listings!
          </p>

          {/* Benefits */}
          {displayBenefits.length > 0 && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <Award className="w-5 h-5 mr-2 text-purple-400" />
                What to Expect:
              </h3>
              <ul className="space-y-3">
                {displayBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-start text-white/70">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-1 mr-3 mt-0.5 flex-shrink-0">
                      <TrendingUp className="w-3 h-3 text-white" />
                    </div>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CTA Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            Got it, Thanks!
          </button>

          {/* Footer note */}
          <p className="text-white/40 text-xs text-center mt-4">
            Stay tuned for updates on new features
          </p>
        </div>
      </div>
    </div>
  )
}
