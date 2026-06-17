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

  const backgroundEl = null;

  const backButton = null;

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F4F2] relative overflow-hidden">
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
              className="mt-4 px-6 py-3 bg-[#A16207] hover:bg-[#854D0E] text-white rounded-lg transition-all"
            >
              {t('signIn')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F4F2] relative overflow-hidden">
      {backgroundEl}

      <div className="relative z-10 max-w-6xl mx-auto p-4 pb-24 md:pb-4 min-h-screen">
        {/* Header */}
        <div className="mb-8 pt-8">
          <div className="mb-6">
            {backButton}
          </div>

          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">💬 {t('title')}</h1>
            <p className="text-gray-700">{t('subtitle')}</p>
          </div>
        </div>

        {/* Messages Container */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl p-6">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-slate-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">{t('errorLoading')}</h2>
              <p className="text-red-600 mb-6">{error}</p>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('empty')}</h2>
              <p className="text-gray-700 mb-6">
                {t('emptyDesc')}
              </p>
              <button
                onClick={() => router.push('/browse')}
                className="px-6 py-3 bg-[#A16207] hover:bg-[#854D0E] text-white rounded-lg transition-all duration-200 transform hover:scale-105 font-medium"
              >
                {t('browseListings')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800 mb-4">
                {t('conversations')} ({conversations.length})
              </h2>

              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => router.push(`/chat/${conversation.id}`)}
                  className="bg-white backdrop-blur-sm rounded-xl p-4 border border-slate-200 hover:bg-gray-100 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-full bg-[#A16207] flex items-center justify-center flex-shrink-0">
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
                        <h3 className="font-semibold text-slate-800 group-hover:text-[#A16207] transition-colors">
                          {conversation.other_user?.first_name} {conversation.other_user?.last_name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {conversation.listing_id ? t('aboutListing') : t('generalConversation')}
                        </p>
                      </div>
                    </div>

                    {/* Timestamp */}
                    <div className={isRtl ? 'text-start' : 'text-end'}>
                      <div className="text-slate-600 text-sm">
                        {new Date(conversation.last_message_at).toLocaleDateString()}
                      </div>
                      <div className="text-slate-500 text-xs">
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
