// src/app/[locale]/chat/[conversationId]/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useConversationMessages } from '@/hooks/useSimpleMessages';
import { useUser } from '@/hooks/useUser';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('messages.chat');
  const tMsg = useTranslations('messages');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const { user } = useUser();
  const conversationId = params.conversationId as string;

  const { messages, loading, error, sending, sendMessage, refetch } = useConversationMessages(conversationId);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const success = await sendMessage(newMessage);
    if (success) {
      setNewMessage('');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen relative overflow-hidden flex items-center justify-center" style={{ background: '#F2DA85' }}>
        <div className="text-center bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-slate-200 dark:border-white/20">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">{t('authRequired')}</h1>
          <p className="text-purple-600 dark:text-purple-200 mb-6">{t('authRequiredDesc')}</p>
          <button
            onClick={() => router.push('/signin')}
            className="px-6 py-3 bg-[#7c3f00] hover:bg-[#5f2e00] text-white rounded-lg transition-all"
          >
            {tMsg('signIn')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#F2DA85' }}>
      {/* Header */}
      <div className="bg-white/80 dark:bg-white/10 backdrop-blur-md border-b border-slate-200 dark:border-white/20 p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/messages')}
              className="text-slate-700 dark:text-white hover:text-purple-600 dark:hover:text-purple-200 transition-colors"
            >
              {isRtl ? '→' : '←'} {t('backToMessages')}
            </button>
            <h1 className="text-xl font-bold text-slate-800 dark:text-white">{t('title')}</h1>
          </div>

          <button
            onClick={refetch}
            disabled={loading}
            className="px-4 py-2 bg-white/50 dark:bg-white/20 text-slate-700 dark:text-white rounded-lg hover:bg-white/70 dark:hover:bg-white/30 transition-all disabled:opacity-50"
          >
            {loading ? t('loading') : t('refresh')}
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-4 h-[calc(100vh-200px)] flex flex-col">
        {/* Messages Area */}
        <div className="flex-1 bg-white/80 dark:bg-white/10 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/20 overflow-hidden flex flex-col">

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 dark:border-white"></div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-red-600 dark:text-red-300 mb-2">{t('errorLoading')}</div>
                <div className="text-sm text-red-500 dark:text-red-200">{error}</div>
                <button
                  onClick={refetch}
                  className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  {t('tryAgain')}
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">💬</div>
                <div className="text-slate-800 dark:text-white text-lg mb-2">{t('noMessages')}</div>
                <div className="text-purple-600 dark:text-purple-200">{t('noMessagesDesc')}</div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, index) => {
                  const isMyMessage = message.sender_id === user.id;
                  const messageDate = new Date(message.created_at);
                  const prevMessage = index > 0 ? messages[index - 1] : null;
                  const prevMessageDate = prevMessage ? new Date(prevMessage.created_at) : null;

                  const showDateSeparator = !prevMessageDate ||
                    messageDate.toDateString() !== prevMessageDate.toDateString();

                  // In RTL: sent messages appear on the left, received on the right
                  const sentAlign = isRtl ? 'justify-start' : 'justify-end';
                  const receivedAlign = isRtl ? 'justify-end' : 'justify-start';

                  return (
                    <div key={message.id}>
                      {/* Date Separator */}
                      {showDateSeparator && (
                        <div className="flex justify-center my-4">
                          <div className="px-3 py-1 bg-slate-300 dark:bg-white/30 text-slate-600 dark:text-white text-xs rounded-full">
                            {messageDate.toDateString() === new Date().toDateString()
                              ? t('today')
                              : messageDate.toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-FR' : 'en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })
                            }
                          </div>
                        </div>
                      )}

                      {/* Message */}
                      <div className={`flex ${isMyMessage ? sentAlign : receivedAlign}`}>
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            isMyMessage
                              ? 'bg-[#7c3f00] text-white'
                              : 'bg-slate-200 dark:bg-white/20 text-slate-800 dark:text-white'
                          }`}
                        >
                          {!isMyMessage && message.sender && (
                            <div className="text-xs text-purple-600 dark:text-purple-200 mb-1">
                              {message.sender.first_name} {message.sender.last_name}
                            </div>
                          )}
                          <div className="break-words">{message.content}</div>
                          <div className={`text-xs mt-1 ${isMyMessage ? 'text-purple-200' : 'text-purple-600 dark:text-purple-300'}`}>
                            {messageDate.toLocaleDateString(locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-FR' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })} {messageDate.toLocaleTimeString(locale === 'ar' ? 'ar-DZ' : locale === 'fr' ? 'fr-FR' : 'en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: locale !== 'ar'
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="border-t border-slate-200 dark:border-white/20 p-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={t('typeMessage')}
                disabled={sending}
                className="flex-1 px-4 py-3 bg-white dark:bg-white/20 text-slate-800 dark:text-white placeholder-slate-500 dark:placeholder-purple-200 rounded-xl border border-slate-300 dark:border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="px-6 py-3 bg-[#7c3f00] hover:bg-[#5f2e00] text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? t('sending') : t('send')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
