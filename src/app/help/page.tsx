// src/app/help/page.tsx
import Link from 'next/link'
import { Settings, Bell } from 'lucide-react'

export default function HelpPage() {
  const implementedFeatures = [
    {
      icon: Settings,
      title: "Manage your account",
      description: "Update your profile information, change your password, and manage your account settings.",
      link: "/profile",
      linkText: "Go to Profile"
    },
    {
      icon: Bell,
      title: "Notification preferences",
      description: "Control how and when you receive notifications about messages, favorites, and listing updates.",
      link: "/notifications",
      linkText: "Manage Notifications"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600">
            Quick access to your account features
          </p>
        </div>

        {/* Implemented Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {implementedFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-3 rounded-lg mr-4">
                    <Icon className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">{feature.description}</p>
                <Link
                  href={feature.link}
                  className="inline-flex items-center text-green-600 hover:text-green-700 font-medium"
                >
                  {feature.linkText}
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )
          })}
        </div>

        {/* Contact Support */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need More Help?</h2>
          <p className="text-gray-600 mb-6">
            Our support team is here to assist you.
          </p>
          <Link
            href="mailto:support@marketdz.com"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            Email Support
          </Link>
        </div>
      </div>
    </div>
  )
}
