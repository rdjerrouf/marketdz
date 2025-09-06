// src/app/help/page.tsx
import Link from 'next/link'

export default function HelpPage() {
  const faqs = [
    {
      question: "How do I create a listing?",
      answer: "To create a listing, sign in to your account and click the 'Add Listing' button. Fill in the required information including title, description, price, and upload photos. Choose the appropriate category and location, then submit your listing for review."
    },
    {
      question: "How do I contact a seller?",
      answer: "On any listing page, click the 'Contact Seller' button to send a message. You can ask questions about the item, negotiate prices, or arrange meetings. All communication is handled through our secure messaging system."
    },
    {
      question: "Is it safe to buy/sell on MarketDZ?",
      answer: "We prioritize user safety with features like user verification, secure messaging, and rating systems. Always meet in public places for transactions, verify items before purchasing, and report any suspicious activity to our support team."
    },
    {
      question: "How do I edit or delete my listing?",
      answer: "Go to your profile page and find the 'My Listings' section. From there, you can edit listing details, update photos, mark items as sold, or delete listings entirely."
    },
    {
      question: "What payment methods are supported?",
      answer: "Currently, MarketDZ facilitates connections between buyers and sellers. Payment arrangements are made directly between parties. We recommend cash transactions for local meetups or bank transfers for verified users."
    },
    {
      question: "How do I report inappropriate content?",
      answer: "Click the 'Report' button on any listing or user profile that violates our community guidelines. Our moderation team reviews all reports within 24 hours and takes appropriate action."
    }
  ]

  const categories = [
    {
      title: "Getting Started",
      links: [
        { text: "Creating Your First Listing", href: "#" },
        { text: "Setting Up Your Profile", href: "#" },
        { text: "Understanding Categories", href: "#" },
        { text: "Safety Guidelines", href: "#" }
      ]
    },
    {
      title: "Buying & Selling",
      links: [
        { text: "How to Buy Safely", href: "#" },
        { text: "Selling Best Practices", href: "#" },
        { text: "Price Negotiation Tips", href: "#" },
        { text: "Meeting Arrangements", href: "#" }
      ]
    },
    {
      title: "Account & Settings",
      links: [
        { text: "Managing Your Account", href: "/settings" },
        { text: "Privacy Settings", href: "#" },
        { text: "Notification Preferences", href: "/notifications" },
        { text: "Deleting Your Account", href: "#" }
      ]
    },
    {
      title: "Technical Support",
      links: [
        { text: "App Performance Issues", href: "#" },
        { text: "Photo Upload Problems", href: "#" },
        { text: "Login Difficulties", href: "#" },
        { text: "Browser Compatibility", href: "#" }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions and learn how to get the most out of MarketDZ
          </p>
        </div>

        {/* Search */}
        <div className="mb-12">
          <div className="relative max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search for help articles..."
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Quick Help Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {categories.map((category, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-4">{category.title}</h3>
              <ul className="space-y-2">
                {category.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link
                      href={link.href}
                      className="text-sm text-green-600 hover:text-green-700 hover:underline"
                    >
                      {link.text}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Need Help?</h2>
          <p className="text-gray-600 mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="mailto:support@marketdz.com"
              className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
            >
              Email Support
            </Link>
            <Link
              href="/chat"
              className="bg-white text-green-600 border border-green-600 px-6 py-3 rounded-md hover:bg-green-50 transition-colors font-medium"
            >
              Live Chat
            </Link>
          </div>
          
          <div className="mt-6 pt-6 border-t border-green-200">
            <p className="text-sm text-gray-500">
              Response time: Usually within 24 hours • Available: Monday - Friday, 9 AM - 6 PM
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
