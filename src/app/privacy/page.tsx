'use client'

import Link from 'next/link'
import { useState } from 'react'

type Lang = 'en' | 'fr' | 'ar'

const content = {
  en: {
    back: 'Back to Home',
    title: 'Privacy Policy',
    updated: 'Last updated: March 26, 2026',
    sections: [
      {
        h: '1. Introduction',
        p: 'DlalaDZ ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.',
      },
      {
        h: '2. Information We Collect',
        subsections: [
          {
            h: 'Personal Information',
            items: [
              'Name and contact information (email, phone number)',
              'Profile information (bio, location, profile picture)',
              'Account credentials and authentication data',
              'Communication preferences',
            ],
          },
          {
            h: 'Usage Information',
            items: [
              'Browsing behavior and interaction with our services',
              'Search queries and listing preferences',
              'Messages and communications through our platform',
              'Device information and IP addresses',
            ],
          },
        ],
      },
      {
        h: '3. How We Use Your Information',
        items: [
          'To provide and maintain our marketplace services',
          'To facilitate communication between buyers and sellers',
          'To improve our platform and user experience',
          'To send notifications about your account and transactions',
          'To prevent fraud and ensure platform security',
          'To comply with legal obligations',
        ],
      },
      {
        h: '4. Information Sharing',
        p: 'We do not sell, trade, or otherwise transfer your personal information to outside parties except:',
        items: [
          'With your explicit consent',
          'To facilitate transactions between users',
          'To comply with legal requirements',
          'To protect our rights and prevent fraud',
          'With trusted service providers who assist in operating our platform',
        ],
      },
      {
        h: '5. Data Security',
        p: 'We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.',
      },
      {
        h: '6. Your Rights',
        pre: 'You have the right to:',
        items: [
          'Access and review your personal information',
          'Correct inaccurate or incomplete data',
          'Delete your account and associated data',
          'Opt-out of marketing communications',
          'Export your data in a portable format',
        ],
      },
      {
        h: '7. Cookies and Tracking',
        p: 'We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and improve our services. You can control cookie settings through your browser preferences.',
      },
      {
        h: '8. Third-Party Services',
        p: 'Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.',
      },
      {
        h: "9. Children's Privacy",
        p: 'Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected such information, we will take steps to delete it.',
      },
      {
        h: '10. Changes to This Policy',
        p: 'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.',
      },
      {
        h: '11. Contact Us',
        p: 'If you have any questions about this Privacy Policy or our data practices, please contact us:',
        contact: { email: 'privacy@dlaladz.com', address: 'DlalaDZ Privacy Team, Algiers, Algeria', phone: '+213 XXX XXX XXX' },
      },
    ],
  },
  fr: {
    back: 'Retour à l\'accueil',
    title: 'Politique de confidentialité',
    updated: 'Dernière mise à jour : 26 mars 2026',
    sections: [
      {
        h: '1. Introduction',
        p: 'DlalaDZ (« nous », « notre » ou « nos ») s\'engage à protéger votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons, divulguons et protégeons vos informations lorsque vous visitez notre site et utilisez nos services.',
      },
      {
        h: '2. Informations que nous collectons',
        subsections: [
          {
            h: 'Informations personnelles',
            items: [
              'Nom et coordonnées (email, numéro de téléphone)',
              'Informations de profil (biographie, localisation, photo de profil)',
              'Identifiants de compte et données d\'authentification',
              'Préférences de communication',
            ],
          },
          {
            h: 'Informations d\'utilisation',
            items: [
              'Comportement de navigation et interaction avec nos services',
              'Requêtes de recherche et préférences d\'annonces',
              'Messages et communications via notre plateforme',
              'Informations sur l\'appareil et adresses IP',
            ],
          },
        ],
      },
      {
        h: '3. Comment nous utilisons vos informations',
        items: [
          'Pour fournir et maintenir nos services de marketplace',
          'Pour faciliter la communication entre acheteurs et vendeurs',
          'Pour améliorer notre plateforme et l\'expérience utilisateur',
          'Pour envoyer des notifications sur votre compte et vos transactions',
          'Pour prévenir la fraude et assurer la sécurité de la plateforme',
          'Pour respecter nos obligations légales',
        ],
      },
      {
        h: '4. Partage des informations',
        p: 'Nous ne vendons, n\'échangeons ni ne transférons vos informations personnelles à des tiers, sauf :',
        items: [
          'Avec votre consentement explicite',
          'Pour faciliter les transactions entre utilisateurs',
          'Pour respecter les exigences légales',
          'Pour protéger nos droits et prévenir la fraude',
          'Avec des prestataires de confiance qui nous aident à exploiter notre plateforme',
        ],
      },
      {
        h: '5. Sécurité des données',
        p: 'Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos informations personnelles contre tout accès, modification, divulgation ou destruction non autorisés. Cependant, aucun mode de transmission sur Internet n\'est sécurisé à 100 %.',
      },
      {
        h: '6. Vos droits',
        pre: 'Vous avez le droit de :',
        items: [
          'Accéder à vos informations personnelles et les consulter',
          'Corriger les données inexactes ou incomplètes',
          'Supprimer votre compte et les données associées',
          'Vous désabonner des communications marketing',
          'Exporter vos données dans un format portable',
        ],
      },
      {
        h: '7. Cookies et suivi',
        p: 'Nous utilisons des cookies et des technologies de suivi similaires pour améliorer votre expérience, analyser les comportements d\'utilisation et améliorer nos services. Vous pouvez contrôler les paramètres des cookies via les préférences de votre navigateur.',
      },
      {
        h: '8. Services tiers',
        p: 'Notre plateforme peut contenir des liens vers des sites ou services tiers. Nous ne sommes pas responsables des pratiques de confidentialité de ces sites externes. Nous vous encourageons à consulter leurs politiques de confidentialité.',
      },
      {
        h: '9. Confidentialité des mineurs',
        p: 'Nos services ne sont pas destinés aux enfants de moins de 13 ans. Nous ne collectons pas sciemment d\'informations personnelles auprès d\'enfants de moins de 13 ans. Si nous apprenons avoir collecté de telles informations, nous prendrons des mesures pour les supprimer.',
      },
      {
        h: '10. Modifications de cette politique',
        p: 'Nous pouvons mettre à jour cette politique de confidentialité de temps à autre. Nous vous informerons de tout changement en publiant la nouvelle politique sur cette page et en mettant à jour la date de « Dernière mise à jour ».',
      },
      {
        h: '11. Nous contacter',
        p: 'Si vous avez des questions sur cette politique de confidentialité ou nos pratiques en matière de données, veuillez nous contacter :',
        contact: { email: 'privacy@dlaladz.com', address: 'Équipe Confidentialité DlalaDZ, Alger, Algérie', phone: '+213 XXX XXX XXX' },
      },
    ],
  },
  ar: {
    back: 'العودة إلى الصفحة الرئيسية',
    title: 'سياسة الخصوصية',
    updated: 'آخر تحديث: 26 مارس 2026',
    sections: [
      {
        h: '١. مقدمة',
        p: 'تلتزم DlalaDZ ("نحن" أو "لنا") بحماية خصوصيتك. توضح سياسة الخصوصية هذه كيفية جمع معلوماتك واستخدامها والإفصاح عنها وحمايتها عند زيارة موقعنا واستخدام خدماتنا.',
      },
      {
        h: '٢. المعلومات التي نجمعها',
        subsections: [
          {
            h: 'المعلومات الشخصية',
            items: [
              'الاسم ومعلومات الاتصال (البريد الإلكتروني، رقم الهاتف)',
              'معلومات الملف الشخصي (السيرة الذاتية، الموقع، الصورة الشخصية)',
              'بيانات اعتماد الحساب ومعلومات المصادقة',
              'تفضيلات التواصل',
            ],
          },
          {
            h: 'معلومات الاستخدام',
            items: [
              'سلوك التصفح والتفاعل مع خدماتنا',
              'استعلامات البحث وتفضيلات الإعلانات',
              'الرسائل والاتصالات عبر منصتنا',
              'معلومات الجهاز وعناوين IP',
            ],
          },
        ],
      },
      {
        h: '٣. كيف نستخدم معلوماتك',
        items: [
          'لتقديم خدمات السوق والحفاظ عليها',
          'لتسهيل التواصل بين المشترين والبائعين',
          'لتحسين منصتنا وتجربة المستخدم',
          'لإرسال إشعارات حول حسابك ومعاملاتك',
          'لمنع الاحتيال وضمان أمان المنصة',
          'للامتثال للالتزامات القانونية',
        ],
      },
      {
        h: '٤. مشاركة المعلومات',
        p: 'لا نبيع معلوماتك الشخصية أو نتداولها أو ننقلها إلى أطراف خارجية، إلا في الحالات التالية:',
        items: [
          'بموافقتك الصريحة',
          'لتسهيل المعاملات بين المستخدمين',
          'للامتثال للمتطلبات القانونية',
          'لحماية حقوقنا ومنع الاحتيال',
          'مع مزودي الخدمات الموثوقين الذين يساعدوننا في تشغيل المنصة',
        ],
      },
      {
        h: '٥. أمان البيانات',
        p: 'نطبق تدابير أمنية مناسبة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو التعديل أو الإفصاح أو الإتلاف. ومع ذلك، لا توجد طريقة نقل عبر الإنترنت آمنة بنسبة 100%.',
      },
      {
        h: '٦. حقوقك',
        pre: 'يحق لك:',
        items: [
          'الوصول إلى معلوماتك الشخصية ومراجعتها',
          'تصحيح البيانات غير الدقيقة أو غير المكتملة',
          'حذف حسابك والبيانات المرتبطة به',
          'إلغاء الاشتراك في الاتصالات التسويقية',
          'تصدير بياناتك بتنسيق قابل للنقل',
        ],
      },
      {
        h: '٧. ملفات تعريف الارتباط والتتبع',
        p: 'نستخدم ملفات تعريف الارتباط وتقنيات تتبع مماثلة لتحسين تجربتك وتحليل أنماط الاستخدام وتطوير خدماتنا. يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال تفضيلات متصفحك.',
      },
      {
        h: '٨. خدمات الطرف الثالث',
        p: 'قد تحتوي منصتنا على روابط لمواقع أو خدمات طرف ثالث. نحن لسنا مسؤولين عن ممارسات الخصوصية لهذه المواقع الخارجية. نشجعك على مراجعة سياسات الخصوصية الخاصة بها.',
      },
      {
        h: '٩. خصوصية الأطفال',
        p: 'خدماتنا غير موجهة للأطفال دون سن 13 عامًا. لا نجمع معلومات شخصية عن علم من أطفال دون سن 13 عامًا. إذا علمنا بجمع مثل هذه المعلومات، سنتخذ خطوات لحذفها.',
      },
      {
        h: '١٠. التغييرات على هذه السياسة',
        p: 'قد نحدّث سياسة الخصوصية هذه من وقت لآخر. سنخطرك بأي تغييرات من خلال نشر السياسة الجديدة على هذه الصفحة وتحديث تاريخ "آخر تحديث".',
      },
      {
        h: '١١. اتصل بنا',
        p: 'إذا كانت لديك أسئلة حول سياسة الخصوصية هذه أو ممارساتنا المتعلقة بالبيانات، يرجى الاتصال بنا:',
        contact: { email: 'privacy@dlaladz.com', address: 'فريق الخصوصية في DlalaDZ، الجزائر العاصمة، الجزائر', phone: '+213 XXX XXX XXX' },
      },
    ],
  },
}

type Section = {
  h: string
  p?: string
  pre?: string
  items?: string[]
  subsections?: { h: string; items: string[] }[]
  contact?: { email: string; address: string; phone: string }
}

function PolicySection({ section, isRtl }: { section: Section; isRtl: boolean }) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">{section.h}</h2>
      {section.p && <p className="text-gray-600 mb-4">{section.p}</p>}
      {section.pre && <p className="text-gray-600 mb-2">{section.pre}</p>}
      {section.subsections?.map((sub, i) => (
        <div key={i}>
          <h3 className="text-lg font-medium text-gray-900 mt-6 mb-3">{sub.h}</h3>
          <ul className={`list-disc text-gray-600 mb-4 space-y-1 ${isRtl ? 'list-inside pr-0' : 'list-inside'}`}>
            {sub.items.map((item, j) => <li key={j}>{item}</li>)}
          </ul>
        </div>
      ))}
      {section.items && (
        <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
          {section.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )}
      {section.contact && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
          <p className="text-gray-700 mb-2"><strong>Email:</strong> {section.contact.email}</p>
          <p className="text-gray-700"><strong>{isRtl ? 'العنوان' : 'Adresse' }:</strong> {section.contact.address}</p>
        </div>
      )}
    </div>
  )
}

export default function PrivacyPolicyPage() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = content[lang]
  const isRtl = lang === 'ar'

  return (
    <div className="min-h-screen bg-gray-50 py-8" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/" className={`inline-flex items-center text-green-600 hover:text-green-700 mb-6 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}>
          <svg className={`w-5 h-5 ${isRtl ? 'ml-2 rotate-180' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t.back}
        </Link>

        {/* Language switcher */}
        <div className={`flex mb-6 ${isRtl ? 'justify-end' : ''}`}>
          <div className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden">
            {(['fr', 'en', 'ar'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-5 py-2 text-sm font-medium transition-colors ${lang === l ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {l === 'fr' ? 'Français' : l === 'en' ? 'English' : 'العربية'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{t.title}</h1>
          <p className="text-sm text-gray-500 mb-8">{t.updated}</p>
          <div className={`prose prose-lg max-w-none ${isRtl ? 'text-right' : ''}`}>
            {t.sections.map((section, i) => (
              <PolicySection key={i} section={section as Section} isRtl={isRtl} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
