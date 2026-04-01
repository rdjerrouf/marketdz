'use client'

import Link from 'next/link'
import { useState } from 'react'

type Lang = 'en' | 'fr' | 'ar'

const content = {
  en: {
    back: 'Back to Home',
    title: 'Terms of Service',
    updated: 'Last updated: March 26, 2026',
    sections: [
      {
        h: '1. Acceptance of Terms',
        p: 'By accessing and using DlalaDZ ("Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.',
      },
      {
        h: '2. Description of Service',
        p: 'DlalaDZ is an online marketplace that connects buyers and sellers in Algeria. We provide a platform for users to list items for sale, browse available products, and communicate with other users.',
      },
      {
        h: '3. User Accounts',
        subsections: [
          {
            h: 'Registration',
            items: [
              'You must be at least 18 years old to create an account',
              'You must provide accurate and complete information',
              'You are responsible for maintaining account security',
              'One person may not maintain multiple accounts',
            ],
          },
          {
            h: 'Account Responsibilities',
            items: [
              'Keep your login credentials secure',
              'Notify us immediately of any unauthorized use',
              'Update your information when necessary',
              'Comply with all applicable laws and regulations',
            ],
          },
        ],
      },
      {
        h: '4. Listing Guidelines',
        subsections: [
          {
            h: 'Permitted Items',
            items: [
              'Legal goods and services you own or have authority to sell',
              'Accurate descriptions and genuine photos',
              'Appropriate pricing and category selection',
            ],
          },
          {
            h: 'Prohibited Items',
            items: [
              'Illegal goods or services',
              'Stolen or counterfeit items',
              'Weapons, drugs, or hazardous materials',
              'Adult content or services',
              'Misleading or fraudulent listings',
            ],
          },
        ],
      },
      {
        h: '5. User Conduct',
        pre: 'Users agree not to:',
        items: [
          'Harass, abuse, or harm other users',
          'Post spam or irrelevant content',
          'Use automated tools or bots',
          'Infringe on intellectual property rights',
          'Engage in fraudulent activities',
        ],
      },
      {
        h: '6. Transactions',
        subsections: [
          {
            h: 'Platform Role',
            p: 'DlalaDZ acts as a platform connecting buyers and sellers. We do not participate in actual transactions and are not responsible for the quality, safety, or legality of items listed.',
          },
          {
            h: 'User Responsibility',
            items: [
              'Verify item condition before purchase',
              'Meet in safe, public locations',
              'Handle payments securely',
              'Resolve disputes directly with other party',
            ],
          },
        ],
      },
      {
        h: '7. Fees and Payments',
        p: 'Currently, DlalaDZ is free to use. We reserve the right to introduce fees for certain services with appropriate notice to users.',
      },
      {
        h: '8. Intellectual Property',
        p: 'The DlalaDZ platform, including its design, functionality, and content, is protected by intellectual property laws. Users retain rights to their own content but grant us license to use it on our platform.',
      },
      {
        h: '9. Privacy and Data',
        p: 'Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.',
      },
      {
        h: '10. Disclaimers',
        items: [
          'The service is provided "as is" without warranties',
          'We do not guarantee continuous or error-free operation',
          'Users assume all risks associated with transactions',
          'We are not liable for user-generated content',
        ],
      },
      {
        h: '11. Limitation of Liability',
        p: 'DlalaDZ shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.',
      },
      {
        h: '12. Termination',
        p: 'We reserve the right to terminate or suspend accounts that violate these terms. Users may also delete their accounts at any time through account settings.',
      },
      {
        h: '13. Governing Law',
        p: 'These terms are governed by the laws of Algeria. Any disputes will be resolved in Algerian courts.',
      },
      {
        h: '14. Changes to Terms',
        p: 'We may modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.',
      },
      {
        h: '15. Contact Information',
        p: 'If you have questions about these Terms of Service, please contact us:',
        contact: { email: 'legal@dlaladz.com', address: 'DlalaDZ Legal Team, Algiers, Algeria', phone: '+213 XXX XXX XXX' },
      },
    ],
  },
  fr: {
    back: 'Retour à l\'accueil',
    title: 'Conditions d\'utilisation',
    updated: 'Dernière mise à jour : 26 mars 2026',
    sections: [
      {
        h: '1. Acceptation des conditions',
        p: 'En accédant à DlalaDZ (« Service ») et en l\'utilisant, vous acceptez d\'être lié par les termes de cet accord. Si vous n\'acceptez pas ces conditions, veuillez ne pas utiliser ce service.',
      },
      {
        h: '2. Description du service',
        p: 'DlalaDZ est une marketplace en ligne qui met en relation acheteurs et vendeurs en Algérie. Nous fournissons une plateforme permettant aux utilisateurs de publier des annonces, de parcourir les produits disponibles et de communiquer entre eux.',
      },
      {
        h: '3. Comptes utilisateurs',
        subsections: [
          {
            h: 'Inscription',
            items: [
              'Vous devez avoir au moins 18 ans pour créer un compte',
              'Vous devez fournir des informations exactes et complètes',
              'Vous êtes responsable de la sécurité de votre compte',
              'Une personne ne peut pas gérer plusieurs comptes',
            ],
          },
          {
            h: 'Responsabilités du compte',
            items: [
              'Gardez vos identifiants de connexion en sécurité',
              'Informez-nous immédiatement de toute utilisation non autorisée',
              'Mettez à jour vos informations si nécessaire',
              'Respectez toutes les lois et réglementations applicables',
            ],
          },
        ],
      },
      {
        h: '4. Règles pour les annonces',
        subsections: [
          {
            h: 'Articles autorisés',
            items: [
              'Biens et services légaux que vous possédez ou êtes autorisé à vendre',
              'Descriptions précises et photos authentiques',
              'Prix et sélection de catégorie appropriés',
            ],
          },
          {
            h: 'Articles interdits',
            items: [
              'Biens ou services illégaux',
              'Articles volés ou contrefaits',
              'Armes, drogues ou matières dangereuses',
              'Contenu ou services pour adultes',
              'Annonces trompeuses ou frauduleuses',
            ],
          },
        ],
      },
      {
        h: '5. Conduite des utilisateurs',
        pre: 'Les utilisateurs s\'engagent à ne pas :',
        items: [
          'Harceler, abuser ou nuire à d\'autres utilisateurs',
          'Publier du spam ou du contenu non pertinent',
          'Utiliser des outils automatisés ou des bots',
          'Porter atteinte aux droits de propriété intellectuelle',
          'Se livrer à des activités frauduleuses',
        ],
      },
      {
        h: '6. Transactions',
        subsections: [
          {
            h: 'Rôle de la plateforme',
            p: 'DlalaDZ agit en tant que plateforme mettant en relation acheteurs et vendeurs. Nous ne participons pas aux transactions réelles et ne sommes pas responsables de la qualité, de la sécurité ou de la légalité des articles listés.',
          },
          {
            h: 'Responsabilité de l\'utilisateur',
            items: [
              'Vérifiez l\'état de l\'article avant l\'achat',
              'Rencontrez-vous dans des lieux publics et sûrs',
              'Gérez les paiements de manière sécurisée',
              'Résolvez les litiges directement avec l\'autre partie',
            ],
          },
        ],
      },
      {
        h: '7. Frais et paiements',
        p: 'Actuellement, DlalaDZ est gratuit. Nous nous réservons le droit d\'introduire des frais pour certains services moyennant un préavis approprié aux utilisateurs.',
      },
      {
        h: '8. Propriété intellectuelle',
        p: 'La plateforme DlalaDZ, y compris son design, ses fonctionnalités et son contenu, est protégée par les lois sur la propriété intellectuelle. Les utilisateurs conservent leurs droits sur leur propre contenu, mais nous accordent une licence pour l\'utiliser sur notre plateforme.',
      },
      {
        h: '9. Confidentialité et données',
        p: 'Votre vie privée est importante pour nous. Veuillez consulter notre Politique de confidentialité pour comprendre comment nous collectons, utilisons et protégeons vos informations.',
      },
      {
        h: '10. Avertissements',
        items: [
          'Le service est fourni « tel quel » sans garanties',
          'Nous ne garantissons pas un fonctionnement continu ou sans erreur',
          'Les utilisateurs assument tous les risques liés aux transactions',
          'Nous ne sommes pas responsables du contenu généré par les utilisateurs',
        ],
      },
      {
        h: '11. Limitation de responsabilité',
        p: 'DlalaDZ ne sera pas responsable des dommages indirects, accessoires, spéciaux, consécutifs ou punitifs résultant de votre utilisation du service.',
      },
      {
        h: '12. Résiliation',
        p: 'Nous nous réservons le droit de résilier ou de suspendre les comptes qui violent ces conditions. Les utilisateurs peuvent également supprimer leur compte à tout moment via les paramètres du compte.',
      },
      {
        h: '13. Droit applicable',
        p: 'Ces conditions sont régies par les lois algériennes. Tout litige sera résolu devant les tribunaux algériens.',
      },
      {
        h: '14. Modifications des conditions',
        p: 'Nous pouvons modifier ces conditions à tout moment. La poursuite de l\'utilisation du service après les modifications constitue une acceptation des nouvelles conditions.',
      },
      {
        h: '15. Informations de contact',
        p: 'Si vous avez des questions sur ces Conditions d\'utilisation, veuillez nous contacter :',
        contact: { email: 'legal@dlaladz.com', address: 'Équipe Juridique DlalaDZ, Alger, Algérie', phone: '+213 XXX XXX XXX' },
      },
    ],
  },
  ar: {
    back: 'العودة إلى الصفحة الرئيسية',
    title: 'شروط الاستخدام',
    updated: 'آخر تحديث: 26 مارس 2026',
    sections: [
      {
        h: '١. قبول الشروط',
        p: 'بالوصول إلى DlalaDZ ("الخدمة") واستخدامها، فإنك توافق على الالتزام بشروط هذه الاتفاقية. إذا لم توافق على هذه الشروط، يرجى عدم استخدام هذه الخدمة.',
      },
      {
        h: '٢. وصف الخدمة',
        p: 'DlalaDZ هو سوق إلكتروني يربط المشترين والبائعين في الجزائر. نوفر منصة للمستخدمين لنشر الإعلانات وتصفح المنتجات المتاحة والتواصل مع بعضهم.',
      },
      {
        h: '٣. حسابات المستخدمين',
        subsections: [
          {
            h: 'التسجيل',
            items: [
              'يجب أن يكون عمرك 18 عامًا على الأقل لإنشاء حساب',
              'يجب تقديم معلومات دقيقة وكاملة',
              'أنت مسؤول عن الحفاظ على أمان حسابك',
              'لا يجوز لشخص واحد الاحتفاظ بحسابات متعددة',
            ],
          },
          {
            h: 'مسؤوليات الحساب',
            items: [
              'حافظ على سرية بيانات تسجيل الدخول',
              'أخطرنا فورًا بأي استخدام غير مصرح به',
              'حدّث معلوماتك عند الضرورة',
              'الامتثال لجميع القوانين واللوائح المعمول بها',
            ],
          },
        ],
      },
      {
        h: '٤. إرشادات الإعلانات',
        subsections: [
          {
            h: 'العناصر المسموح بها',
            items: [
              'السلع والخدمات القانونية التي تمتلكها أو لديك صلاحية بيعها',
              'أوصاف دقيقة وصور حقيقية',
              'تسعير مناسب واختيار صحيح للفئة',
            ],
          },
          {
            h: 'العناصر المحظورة',
            items: [
              'السلع أو الخدمات غير القانونية',
              'العناصر المسروقة أو المقلدة',
              'الأسلحة والمخدرات والمواد الخطرة',
              'المحتوى أو الخدمات للبالغين',
              'الإعلانات المضللة أو الاحتيالية',
            ],
          },
        ],
      },
      {
        h: '٥. سلوك المستخدمين',
        pre: 'يوافق المستخدمون على عدم:',
        items: [
          'مضايقة أو إساءة أو إيذاء المستخدمين الآخرين',
          'نشر الرسائل المزعجة أو المحتوى غير ذي الصلة',
          'استخدام الأدوات الآلية أو البوتات',
          'انتهاك حقوق الملكية الفكرية',
          'الانخراط في أنشطة احتيالية',
        ],
      },
      {
        h: '٦. المعاملات',
        subsections: [
          {
            h: 'دور المنصة',
            p: 'تعمل DlalaDZ كمنصة تربط المشترين والبائعين. لا نشارك في المعاملات الفعلية ولسنا مسؤولين عن جودة العناصر المدرجة أو سلامتها أو قانونيتها.',
          },
          {
            h: 'مسؤولية المستخدم',
            items: [
              'تحقق من حالة العنصر قبل الشراء',
              'التقِ في أماكن عامة وآمنة',
              'تعامل مع المدفوعات بأمان',
              'حلّ النزاعات مباشرة مع الطرف الآخر',
            ],
          },
        ],
      },
      {
        h: '٧. الرسوم والمدفوعات',
        p: 'حاليًا، DlalaDZ مجاني الاستخدام. نحتفظ بالحق في تقديم رسوم لخدمات معينة مع إشعار مسبق مناسب للمستخدمين.',
      },
      {
        h: '٨. الملكية الفكرية',
        p: 'منصة DlalaDZ، بما في ذلك تصميمها ووظائفها ومحتواها، محمية بموجب قوانين الملكية الفكرية. يحتفظ المستخدمون بحقوقهم في المحتوى الخاص بهم لكنهم يمنحوننا ترخيصًا لاستخدامه على منصتنا.',
      },
      {
        h: '٩. الخصوصية والبيانات',
        p: 'خصوصيتك مهمة لنا. يرجى مراجعة سياسة الخصوصية الخاصة بنا لفهم كيفية جمع معلوماتك واستخدامها وحمايتها.',
      },
      {
        h: '١٠. إخلاء المسؤولية',
        items: [
          'تُقدَّم الخدمة "كما هي" دون ضمانات',
          'لا نضمن التشغيل المستمر أو الخالي من الأخطاء',
          'يتحمل المستخدمون جميع المخاطر المرتبطة بالمعاملات',
          'لسنا مسؤولين عن المحتوى الذي ينشئه المستخدمون',
        ],
      },
      {
        h: '١١. تحديد المسؤولية',
        p: 'لن تكون DlalaDZ مسؤولة عن أي أضرار غير مباشرة أو عرضية أو خاصة أو تبعية أو عقابية ناجمة عن استخدامك للخدمة.',
      },
      {
        h: '١٢. الإنهاء',
        p: 'نحتفظ بالحق في إنهاء أو تعليق الحسابات التي تنتهك هذه الشروط. يمكن للمستخدمين أيضًا حذف حساباتهم في أي وقت من خلال إعدادات الحساب.',
      },
      {
        h: '١٣. القانون الحاكم',
        p: 'تخضع هذه الشروط لقوانين الجزائر. سيتم حل أي نزاعات أمام المحاكم الجزائرية.',
      },
      {
        h: '١٤. التغييرات على الشروط',
        p: 'يجوز لنا تعديل هذه الشروط في أي وقت. استمرار استخدام الخدمة بعد التغييرات يُعدّ قبولًا للشروط الجديدة.',
      },
      {
        h: '١٥. معلومات الاتصال',
        p: 'إذا كانت لديك أسئلة حول شروط الاستخدام هذه، يرجى الاتصال بنا:',
        contact: { email: 'legal@dlaladz.com', address: 'الفريق القانوني في DlalaDZ، الجزائر العاصمة، الجزائر', phone: '+213 XXX XXX XXX' },
      },
    ],
  },
}

type Section = {
  h: string
  p?: string
  pre?: string
  items?: string[]
  subsections?: { h: string; p?: string; items?: string[] }[]
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
          {sub.p && <p className="text-gray-600 mb-4">{sub.p}</p>}
          {sub.items && (
            <ul className="list-disc list-inside text-gray-600 mb-4 space-y-1">
              {sub.items.map((item, j) => <li key={j}>{item}</li>)}
            </ul>
          )}
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
          <p className="text-gray-700"><strong>{isRtl ? 'العنوان' : 'Adresse'}:</strong> {section.contact.address}</p>
        </div>
      )}
    </div>
  )
}

export default function TermsOfServicePage() {
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
