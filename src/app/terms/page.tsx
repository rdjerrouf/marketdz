// src/app/terms/page.tsx
export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing and using MarketDZ ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-600 mb-4">
              MarketDZ is an online marketplace that connects buyers and sellers in Algeria. We provide a platform for users to list items for sale, browse available products, and communicate with other users.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">Registration</h3>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>You must be at least 18 years old to create an account</li>
              <li>You must provide accurate and complete information</li>
              <li>You are responsible for maintaining account security</li>
              <li>One person may not maintain multiple accounts</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">Account Responsibilities</h3>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>Keep your login credentials secure</li>
              <li>Notify us immediately of any unauthorized use</li>
              <li>Update your information when necessary</li>
              <li>Comply with all applicable laws and regulations</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Listing Guidelines</h2>
            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">Permitted Items</h3>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>Legal goods and services you own or have authority to sell</li>
              <li>Accurate descriptions and genuine photos</li>
              <li>Appropriate pricing and category selection</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">Prohibited Items</h3>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>Illegal goods or services</li>
              <li>Stolen or counterfeit items</li>
              <li>Weapons, drugs, or hazardous materials</li>
              <li>Adult content or services</li>
              <li>Misleading or fraudulent listings</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. User Conduct</h2>
            <p className="text-gray-600 mb-2">Users agree not to:</p>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>Harass, abuse, or harm other users</li>
              <li>Post spam or irrelevant content</li>
              <li>Attempt to circumvent platform fees</li>
              <li>Use automated tools or bots</li>
              <li>Infringe on intellectual property rights</li>
              <li>Engage in fraudulent activities</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Transactions</h2>
            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">Platform Role</h3>
            <p className="text-gray-600 mb-4">
              MarketDZ acts as a platform connecting buyers and sellers. We do not participate in actual transactions and are not responsible for the quality, safety, or legality of items listed.
            </p>

            <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">User Responsibility</h3>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>Verify item condition before purchase</li>
              <li>Meet in safe, public locations</li>
              <li>Handle payments securely</li>
              <li>Resolve disputes directly with other party</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Fees and Payments</h2>
            <p className="text-gray-600 mb-4">
              Currently, MarketDZ is free to use. We reserve the right to introduce fees for certain services with appropriate notice to users.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">8. Intellectual Property</h2>
            <p className="text-gray-600 mb-4">
              The MarketDZ platform, including its design, functionality, and content, is protected by intellectual property laws. Users retain rights to their own content but grant us license to use it on our platform.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">9. Privacy and Data</h2>
            <p className="text-gray-600 mb-4">
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">10. Disclaimers</h2>
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              <li>The service is provided "as is" without warranties</li>
              <li>We do not guarantee continuous or error-free operation</li>
              <li>Users assume all risks associated with transactions</li>
              <li>We are not liable for user-generated content</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">11. Limitation of Liability</h2>
            <p className="text-gray-600 mb-4">
              MarketDZ shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">12. Termination</h2>
            <p className="text-gray-600 mb-4">
              We reserve the right to terminate or suspend accounts that violate these terms. Users may also delete their accounts at any time through account settings.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">13. Governing Law</h2>
            <p className="text-gray-600 mb-4">
              These terms are governed by the laws of Algeria. Any disputes will be resolved in Algerian courts.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">14. Changes to Terms</h2>
            <p className="text-gray-600 mb-4">
              We may modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">15. Contact Information</h2>
            <p className="text-gray-600 mb-4">
              If you have questions about these Terms of Service, please contact us:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
              <p className="text-gray-700 mb-2"><strong>Email:</strong> legal@marketdz.com</p>
              <p className="text-gray-700 mb-2"><strong>Address:</strong> MarketDZ Legal Team, Algiers, Algeria</p>
              <p className="text-gray-700"><strong>Phone:</strong> +213 XXX XXX XXX</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
