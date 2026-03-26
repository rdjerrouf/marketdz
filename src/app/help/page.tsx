'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Settings, Bell, ChevronDown, ChevronUp } from 'lucide-react'

type Lang = 'en' | 'fr' | 'ar'

const content = {
  en: {
    back: 'Back to Home',
    title: 'Help Center',
    subtitle: 'Everything you need to know about DlalaDZ',
    faqTitle: 'Frequently Asked Questions',
    accountTitle: 'Account & Settings',
    contactTitle: 'Still need help?',
    contactDesc: 'Our support team is here for you.',
    contactBtn: 'Email Support',
    features: [
      { title: 'Manage your account', desc: 'Update your profile, change your password, manage account settings.', link: '/profile', linkText: 'Go to Profile' },
      { title: 'Notification preferences', desc: 'Control how and when you receive notifications about messages, favorites, and listing updates.', link: '/notifications', linkText: 'Manage Notifications' },
    ],
    faqs: [
      { q: 'Is it free to post a listing?', a: 'Yes, posting on DlalaDZ is completely free. Create an account and start listing in minutes.' },
      { q: 'How do payments work?', a: 'DlalaDZ does not process payments. Buyers and sellers agree on payment directly — cash in hand on pickup is the most common method in Algeria.' },
      { q: 'Is there delivery?', a: 'Delivery is arranged between buyers and sellers directly. Some sellers offer delivery, others require pickup. Always confirm before agreeing to a deal.' },
      { q: 'How do I contact a seller?', a: 'Click the "Send Message" button on any listing to start a conversation with the seller through our built-in messaging system.' },
      { q: 'How do I report a scammer or suspicious listing?', a: 'On any listing page, use the "Report" option. Our team reviews all reports within 24 hours. Never send money before seeing the item in person.' },
      { q: 'Can I edit or delete my listing?', a: 'Yes. Go to "My Listings" from your profile, find the listing, and use the edit or delete options.' },
      { q: 'Why was my listing removed?', a: 'Listings that violate our terms (counterfeit goods, prohibited items, duplicate posts) are removed. Contact support if you think it was a mistake.' },
      { q: 'Is my personal information safe?', a: 'Your phone number and email are never shown publicly. Only your display name and wilaya are visible to other users.' },
    ],
  },
  fr: {
    back: 'Retour à l\'accueil',
    title: 'Centre d\'aide',
    subtitle: 'Tout ce que vous devez savoir sur DlalaDZ',
    faqTitle: 'Questions fréquentes',
    accountTitle: 'Compte & Paramètres',
    contactTitle: 'Besoin d\'aide supplémentaire ?',
    contactDesc: 'Notre équipe de support est là pour vous.',
    contactBtn: 'Contacter le support',
    features: [
      { title: 'Gérer votre compte', desc: 'Modifiez votre profil, changez votre mot de passe, gérez vos paramètres.', link: '/profile', linkText: 'Aller au profil' },
      { title: 'Préférences de notifications', desc: 'Contrôlez comment et quand vous recevez des notifications sur les messages et les annonces.', link: '/notifications', linkText: 'Gérer les notifications' },
    ],
    faqs: [
      { q: 'Est-ce gratuit de publier une annonce ?', a: 'Oui, publier sur DlalaDZ est entièrement gratuit. Créez un compte et commencez à vendre en quelques minutes.' },
      { q: 'Comment fonctionnent les paiements ?', a: 'DlalaDZ ne traite pas les paiements. Acheteurs et vendeurs s\'accordent directement — le paiement en espèces à la remise est le plus courant en Algérie.' },
      { q: 'Y a-t-il une livraison ?', a: 'La livraison est organisée directement entre acheteurs et vendeurs. Certains vendeurs proposent la livraison, d\'autres exigent le retrait en main propre. Confirmez toujours avant de conclure.' },
      { q: 'Comment contacter un vendeur ?', a: 'Cliquez sur "Envoyer un message" sur n\'importe quelle annonce pour commencer une conversation via notre messagerie intégrée.' },
      { q: 'Comment signaler une arnaque ou une annonce suspecte ?', a: 'Sur la page de l\'annonce, utilisez l\'option "Signaler". Notre équipe examine tous les signalements sous 24h. Ne jamais envoyer d\'argent avant de voir l\'article en personne.' },
      { q: 'Puis-je modifier ou supprimer mon annonce ?', a: 'Oui. Allez dans "Mes annonces" depuis votre profil, trouvez l\'annonce et utilisez les options de modification ou de suppression.' },
      { q: 'Pourquoi mon annonce a-t-elle été supprimée ?', a: 'Les annonces qui violent nos conditions (contrefaçons, articles interdits, doublons) sont supprimées. Contactez le support si vous pensez que c\'est une erreur.' },
      { q: 'Mes informations personnelles sont-elles protégées ?', a: 'Votre numéro de téléphone et votre email ne sont jamais affichés publiquement. Seuls votre nom d\'affichage et votre wilaya sont visibles.' },
    ],
  },
  ar: {
    back: 'العودة إلى الصفحة الرئيسية',
    title: 'مركز المساعدة',
    subtitle: 'كل ما تحتاج معرفته عن DlalaDZ',
    faqTitle: 'الأسئلة الشائعة',
    accountTitle: 'الحساب والإعدادات',
    contactTitle: 'تحتاج مساعدة إضافية؟',
    contactDesc: 'فريق الدعم موجود لمساعدتك.',
    contactBtn: 'تواصل مع الدعم',
    features: [
      { title: 'إدارة حسابك', desc: 'عدّل ملفك الشخصي، غيّر كلمة المرور، وأدر إعدادات حسابك.', link: '/profile', linkText: 'الذهاب إلى الملف الشخصي' },
      { title: 'إعدادات الإشعارات', desc: 'تحكم في كيفية ووقت استقبال الإشعارات حول الرسائل والإعلانات.', link: '/notifications', linkText: 'إدارة الإشعارات' },
    ],
    faqs: [
      { q: 'هل نشر إعلان مجاني؟', a: 'نعم، النشر على DlalaDZ مجاني تماماً. أنشئ حساباً وابدأ البيع في دقائق.' },
      { q: 'كيف تتم عملية الدفع؟', a: 'DlalaDZ لا تعالج أي مدفوعات. يتفق المشتري والبائع مباشرة — الدفع نقداً عند الاستلام هو الأكثر شيوعاً في الجزائر.' },
      { q: 'هل يوجد توصيل؟', a: 'التوصيل يُنظَّم مباشرة بين المشتري والبائع. بعض البائعين يوفرون التوصيل والبعض الآخر يشترط الاستلام شخصياً. تأكد دائماً قبل إتمام الصفقة.' },
      { q: 'كيف أتواصل مع البائع؟', a: 'اضغط على "إرسال رسالة" في أي إعلان لبدء محادثة مع البائع عبر نظام المراسلة المدمج.' },
      { q: 'كيف أبلغ عن نصاب أو إعلان مشبوه؟', a: 'استخدم خيار "الإبلاغ" في صفحة الإعلان. يراجع فريقنا جميع البلاغات خلال 24 ساعة. لا ترسل أموالاً قبل رؤية السلعة شخصياً.' },
      { q: 'هل يمكنني تعديل أو حذف إعلاني؟', a: 'نعم. اذهب إلى "إعلاناتي" من ملفك الشخصي، ابحث عن الإعلان واستخدم خيارات التعديل أو الحذف.' },
      { q: 'لماذا تم حذف إعلاني؟', a: 'الإعلانات التي تنتهك شروط الاستخدام (بضائع مقلدة، مواد محظورة، إعلانات مكررة) يتم حذفها. تواصل مع الدعم إذا كنت تعتقد أن ذلك كان خطأً.' },
      { q: 'هل معلوماتي الشخصية آمنة؟', a: 'رقم هاتفك وبريدك الإلكتروني لا يظهران للعموم أبداً. فقط اسمك المعروض وولايتك مرئيان للمستخدمين الآخرين.' },
    ],
  },
}

function FAQItem({ q, a, isRtl }: { q: string; a: string; isRtl: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between p-5 text-left bg-white hover:bg-gray-50 transition-colors ${isRtl ? 'flex-row-reverse text-right' : ''}`}
      >
        <span className="font-medium text-gray-900 pr-4">{q}</span>
        {open ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className={`px-5 pb-5 bg-white text-gray-600 leading-relaxed ${isRtl ? 'text-right' : ''}`}>
          {a}
        </div>
      )}
    </div>
  )
}

export default function HelpPage() {
  const [lang, setLang] = useState<Lang>('fr')
  const t = content[lang]
  const isRtl = lang === 'ar'

  return (
    <div className={`min-h-screen bg-gray-50 py-8 ${isRtl ? 'dir-rtl' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        <Link href="/" className={`inline-flex items-center text-green-600 hover:text-green-700 mb-6 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}>
          <svg className={`w-5 h-5 ${isRtl ? 'ml-2 rotate-180' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t.back}
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{t.title}</h1>
          <p className="text-xl text-gray-600 mb-6">{t.subtitle}</p>

          {/* Language switcher */}
          <div className="inline-flex rounded-lg border border-gray-200 bg-white overflow-hidden">
            {(['fr', 'en', 'ar'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-5 py-2 text-sm font-medium transition-colors ${
                  lang === l
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {l === 'fr' ? 'Français' : l === 'en' ? 'English' : 'العربية'}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-10">
          <h2 className={`text-2xl font-bold text-gray-900 mb-5 ${isRtl ? 'text-right' : ''}`}>{t.faqTitle}</h2>
          <div className="space-y-3">
            {t.faqs.map((faq, i) => (
              <FAQItem key={i} q={faq.q} a={faq.a} isRtl={isRtl} />
            ))}
          </div>
        </div>

        {/* Account & Settings */}
        <div className="mb-10">
          <h2 className={`text-2xl font-bold text-gray-900 mb-5 ${isRtl ? 'text-right' : ''}`}>{t.accountTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {t.features.map((feature, index) => {
              const Icon = index === 0 ? Settings : Bell
              return (
                <div key={index} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                  <div className={`flex items-center mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className={`bg-green-100 p-3 rounded-lg ${isRtl ? 'ml-4' : 'mr-4'}`}>
                      <Icon className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  </div>
                  <p className={`text-gray-600 mb-4 text-sm leading-relaxed ${isRtl ? 'text-right' : ''}`}>{feature.desc}</p>
                  <Link
                    href={feature.link}
                    className={`inline-flex items-center text-green-600 hover:text-green-700 font-medium text-sm ${isRtl ? 'flex-row-reverse' : ''}`}
                  >
                    {feature.linkText}
                    <svg className={`w-4 h-4 ${isRtl ? 'mr-2 rotate-180' : 'ml-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

        {/* Contact */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{t.contactTitle}</h2>
          <p className="text-gray-600 mb-6">{t.contactDesc}</p>
          <Link
            href="mailto:support@dlaladz.com"
            className="inline-block bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            {t.contactBtn}
          </Link>
        </div>

      </div>
    </div>
  )
}
