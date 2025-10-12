// src/app/privacy/page.tsx
import Link from 'next/link'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to Home Link */}
        <Link
          href="/"
          className="inline-flex items-center text-green-600 hover:text-green-700 mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Introduction</h2>
            <p className="text-gray-600 mb-4">
              MarketDZ ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">Personal Information</h3>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>Name and contact information (email, phone number)</li>
              <li>Profile information (bio, location, profile picture)</li>
              <li>Account credentials and authentication data</li>
              <li>Communication preferences</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">Usage Information</h3>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>Browsing behavior and interaction with our services</li>
              <li>Search queries and listing preferences</li>
              <li>Messages and communications through our platform</li>
              <li>Device information and IP addresses</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>To provide and maintain our marketplace services</li>
              <li>To facilitate communication between buyers and sellers</li>
              <li>To improve our platform and user experience</li>
              <li>To send notifications about your account and transactions</li>
              <li>To prevent fraud and ensure platform security</li>
              <li>To comply with legal obligations</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Information Sharing</h2>
            <p className="text-gray-600 mb-4">
              We do not sell, trade, or otherwise transfer your personal information to outside parties except:
            </p>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>With your explicit consent</li>
              <li>To facilitate transactions between users</li>
              <li>To comply with legal requirements</li>
              <li>To protect our rights and prevent fraud</li>
              <li>With trusted service providers who assist in operating our platform</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Data Security</h2>
            <p className="text-gray-600 mb-4">
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Your Rights</h2>
            <p className="text-gray-600 mb-2">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>Access and review your personal information</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Delete your account and associated data</li>
              <li>Opt-out of marketing communications</li>
              <li>Export your data in a portable format</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Cookies and Tracking</h2>
            <p className="text-gray-600 mb-4">
              We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and improve our services. You can control cookie settings through your browser preferences.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Third-Party Services</h2>
            <p className="text-gray-600 mb-4">
              Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-600 mb-4">
              Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. Changes to This Policy</h2>
            <p className="text-gray-600 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">11. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
              <p className="text-gray-700 mb-2"><strong>Email:</strong> privacy@marketdz.com</p>
              <p className="text-gray-700 mb-2"><strong>Address:</strong> MarketDZ Privacy Team, Algiers, Algeria</p>
              <p className="text-gray-700"><strong>Phone:</strong> +213 XXX XXX XXX</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
