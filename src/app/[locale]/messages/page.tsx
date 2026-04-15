// src/app/[locale]/messages/page.tsx
'use client';

import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useConversations } from '@/hooks/useSimpleMessages';
import { useUser } from '@/hooks/useUser';

export default function MessagesPage() {
  const router = useRouter();
  const t = useTranslations('messages');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { user } = useUser();
  const { conversations, loading, error, refetch } = useConversations();

  const backgroundEl = (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:2s]"></div>
      <div className="absolute top-40 left-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse [animation-delay:4s]"></div>
    </div>
  );

  const backButton = (
    <button
      onClick={() => router.push('/')}
      className="flex items-center text-white hover:text-white/80 transition-colors group"
    >
      <svg className={`w-5 h-5 me-2 ${isRtl ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'} transition-transform`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      {t('backToHome')}
    </button>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-[#06402B] relative overflow-hidden">
        {backgroundEl}

        <div className="relative z-10 p-4 pt-8">
          {backButton}
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)]">
          <div className="text-center bg-white/80 backdrop-blur-sm p-8 rounded-xl border border-slate-200">
            <h1 className="text-2xl font-bold mb-4 text-black">{t('pleaseSignIn')}</h1>
            <p className="text-black">{t('signInRequired')}</p>
            <button
              onClick={() => router.push('/signin')}
              className="mt-4 px-6 py-3 bg-[#7c3f00] hover:bg-[#5f2e00] text-white rounded-lg transition-all"
            >
              {t('signIn')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#06402B] relative overflow-hidden">
      {backgroundEl}

      <div className="relative z-10 max-w-6xl mx-auto p-4 pb-24 md:pb-4 min-h-screen">
        {/* Header */}
        <div className="mb-8 pt-8">
          <div className="mb-6">
            {backButton}
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">💬 {t('title')}</h1>
            <p className="text-purple-200">{t('subtitle')}</p>
          </div>
        </div>

        {/* Messages Container */}
        <div className="bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/20 shadow-2xl p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-600 dark:border-white"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('errorLoading')}</h2>
              <p className="text-red-600 dark:text-red-300 mb-6">{error}</p>
              <button
                onClick={refetch}
                className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                {t('tryAgain')}
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('empty')}</h2>
              <p className="text-purple-600 dark:text-purple-200 mb-6">
                {t('emptyDesc')}
              </p>
              <button
                onClick={() => router.push('/browse')}
                className="px-6 py-3 bg-[#7c3f00] hover:bg-[#5f2e00] text-white rounded-lg transition-all duration-200 transform hover:scale-105 font-medium"
              >
                {t('browseListings')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                {t('conversations')} ({conversations.length})
              </h2>

              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => router.push(`/chat/${conversation.id}`)}
                  className="bg-white/50 dark:bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-slate-200 dark:border-white/20 hover:bg-white/70 dark:hover:bg-white/20 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                        {conversation.other_user?.avatar_url ? (
                          <img
                            src={conversation.other_user.avatar_url}
                            alt="User"
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold">
                            {conversation.other_user?.first_name?.[0]}{conversation.other_user?.last_name?.[0]}
                          </span>
                        )}
                      </div>

                      {/* Conversation Info */}
                      <div>
                        <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-200 transition-colors">
                          {conversation.other_user?.first_name} {conversation.other_user?.last_name}
                        </h3>
                        <p className="text-purple-600 dark:text-purple-300 text-sm">
                          {conversation.listing_id ? t('aboutListing') : t('generalConversation')}
                        </p>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className={isRtl ? 'text-start' : 'text-end'}>
                      <div className="text-slate-600 dark:text-purple-200 text-sm">
                        {new Date(conversation.last_message_at).toLocaleDateString()}
                      </div>
                      <div className="text-slate-500 dark:text-purple-300 text-xs">
                        {new Date(conversation.last_message_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
