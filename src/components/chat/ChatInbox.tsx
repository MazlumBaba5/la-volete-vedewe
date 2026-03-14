'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

type ChatConversation = {
  id: string
  counterpartName: string
  counterpartRole: 'guest' | 'advisor'
  counterpartSlug: string | null
  counterpartAvatarUrl?: string | null
  advisorId: string
  lastMessageAt: string
  lastMessagePreview: string | null
  unreadCount: number
}

type ChatMessage = {
  id: string
  sender_profile_id: string
  sender_role: 'guest' | 'advisor'
  body: string
  created_at: string
  read_at: string | null
  optimistic?: boolean
}

type BlockState = {
  isBlocked: boolean
  blockedByRole: 'guest' | 'advisor' | null
  blockedByMe: boolean
}

type ConversationsResponse = {
  schema_ready?: boolean
  chatOpenForTesting?: boolean
  message?: string
  items: ChatConversation[]
}

type MessagesResponse = {
  conversationId: string
  messages: ChatMessage[]
  block?: BlockState
}

export default function ChatInbox({
  role,
  initialConversationId,
}: {
  role: 'guest' | 'advisor'
  initialConversationId?: string | null
}) {
  const hasLoadedConversationsRef = useRef(false)
  const messagesCacheRef = useRef<Record<string, ChatMessage[]>>({})
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [message, setMessage] = useState('')
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(initialConversationId ?? null)
  const [chatMeta, setChatMeta] = useState<{ schemaReady: boolean; chatOpenForTesting: boolean; message: string }>({
    schemaReady: true,
    chatOpenForTesting: false,
    message: '',
  })
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesError, setMessagesError] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [blockState, setBlockState] = useState<BlockState>({ isBlocked: false, blockedByRole: null, blockedByMe: false })
  const [sending, setSending] = useState(false)
  const [actionBusy, setActionBusy] = useState<'deleteConversation' | 'block' | 'unblock' | null>(null)
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const composerRef = useRef<HTMLTextAreaElement | null>(null)

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((part) => part.trim()[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  function Avatar({
    name,
    url,
    role: avatarRole,
    size = 44,
  }: {
    name: string
    url?: string | null
    role: 'guest' | 'advisor'
    size?: number
  }) {
    if (url) {
      return (
        <Image
          src={url}
          alt={name}
          width={size}
          height={size}
          className="rounded-2xl object-cover"
          style={{ width: size, height: size }}
          unoptimized
        />
      )
    }

    return (
      <div
        className="flex items-center justify-center rounded-2xl text-xs font-bold"
        style={{
          width: size,
          height: size,
          background: avatarRole === 'advisor' ? 'rgba(233,30,140,0.16)' : 'rgba(59,130,246,0.16)',
          color: avatarRole === 'advisor' ? '#f9a8d4' : '#bfdbfe',
          border: `1px solid ${avatarRole === 'advisor' ? 'rgba(233,30,140,0.24)' : 'rgba(59,130,246,0.24)'}`,
        }}
      >
        {getInitials(name)}
      </div>
    )
  }

  function formatConversationTime(value: string) {
    const date = new Date(value)
    const now = new Date()
    const sameDay = date.toDateString() === now.toDateString()
    if (sameDay) {
      return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(date)
    }
    return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' }).format(date)
  }

  function formatMessageTime(value: string) {
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value))
  }

  function DeliveryIndicator({ optimistic, readAt }: { optimistic?: boolean; readAt: string | null }) {
    if (optimistic) {
      return (
        <span className="text-[11px]" style={{ color: '#fde68a' }}>
          Sending...
        </span>
      )
    }

    if (readAt) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: '#60a5fa' }}>
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
            <path d="M1 5L3.2 7.2L6.8 3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5.2 5L7.4 7.2L13 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Seen
        </span>
      )
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden="true">
          <path d="M1 5L3.4 7.4L10.8 1.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Sent
      </span>
    )
  }

  const loadConversations = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background ?? false
    if (!background || !hasLoadedConversationsRef.current) {
      setLoading(true)
    }
    setListError('')
    try {
      const res = await fetch('/api/chat', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to load conversations')
      }

      const data = json as ConversationsResponse
      setConversations(data.items ?? [])
      setChatMeta({
        schemaReady: data.schema_ready !== false,
        chatOpenForTesting: Boolean(data.chatOpenForTesting),
        message: data.message ?? '',
      })

      setSelectedConversationId((current) => current ?? initialConversationId ?? data.items?.[0]?.id ?? null)
    } catch (error) {
      setListError(error instanceof Error ? error.message : 'Unable to load conversations')
    } finally {
      hasLoadedConversationsRef.current = true
      setLoading(false)
    }
  }, [initialConversationId])

  const loadMessages = useCallback(async (conversationId: string) => {
    const cachedMessages = messagesCacheRef.current[conversationId]
    if (cachedMessages) {
      setMessages(cachedMessages)
      setMessagesLoading(false)
    } else {
      setMessages([])
      setMessagesLoading(true)
    }
    setMessagesError('')
    try {
      const res = await fetch(`/api/chat/${conversationId}/messages`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to load messages')
      }
      const response = json as MessagesResponse
      const nextMessages = (response.messages as ChatMessage[]) ?? []
      setBlockState(response.block ?? { isBlocked: false, blockedByRole: null, blockedByMe: false })
      messagesCacheRef.current[conversationId] = nextMessages
      setMessages(nextMessages)
    } catch (error) {
      setMessagesError(error instanceof Error ? error.message : 'Unable to load messages')
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (!selectedConversationId && initialConversationId) {
      setSelectedConversationId(initialConversationId)
    }
  }, [initialConversationId, selectedConversationId])

  useEffect(() => {
    if (!selectedConversationId) {
      setMessages([])
      setBlockState({ isBlocked: false, blockedByRole: null, blockedByMe: false })
      return
    }

    void loadMessages(selectedConversationId)
  }, [loadMessages, selectedConversationId])

  useEffect(() => {
    if (selectedConversationId) {
      composerRef.current?.focus()
    }
  }, [selectedConversationId])

  useEffect(() => {
    if (!selectedConversationId) return

    requestAnimationFrame(() => {
      const container = messagesContainerRef.current
      if (!container) return
      container.scrollTo({ top: container.scrollHeight, behavior: 'auto' })
    })
  }, [selectedConversationId])

  useEffect(() => {
    const supabase = createClient()
    const selectedId = selectedConversationId

    const conversationChannel = supabase
      .channel(`chat-conversations-${role}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations' }, () => {
        void loadConversations({ background: true })
      })
      .subscribe()

    const messageChannel = selectedId
      ? supabase
          .channel(`chat-messages-${selectedId}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${selectedId}` }, () => {
            void loadMessages(selectedId)
            void loadConversations({ background: true })
          })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${selectedId}` }, () => {
            void loadMessages(selectedId)
            void loadConversations({ background: true })
          })
          .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${selectedId}` }, () => {
            void loadMessages(selectedId)
            void loadConversations({ background: true })
          })
          .subscribe()
      : null

    return () => {
      void supabase.removeChannel(conversationChannel)
      if (messageChannel) {
        void supabase.removeChannel(messageChannel)
      }
    }
  }, [loadConversations, loadMessages, role, selectedConversationId])

  async function sendCurrentMessage() {
    if (!selectedConversationId || !message.trim() || blockState.isBlocked) return

    setSending(true)
    setMessagesError('')
    const trimmedMessage = message.trim()
    const optimisticId = `temp-${Date.now()}`
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      sender_profile_id: 'me',
      sender_role: role,
      body: trimmedMessage,
      created_at: new Date().toISOString(),
      read_at: null,
      optimistic: true,
    }

    setMessages((current) => [...current, optimisticMessage])
    messagesCacheRef.current[selectedConversationId] = [
      ...(messagesCacheRef.current[selectedConversationId] ?? []),
      optimisticMessage,
    ]
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedConversationId
          ? {
              ...conversation,
              lastMessageAt: optimisticMessage.created_at,
              lastMessagePreview: trimmedMessage,
            }
          : conversation
      )
    )
    setMessage('')
    requestAnimationFrame(() => {
      const container = messagesContainerRef.current
      if (!container) return
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
    })

    try {
      const res = await fetch(`/api/chat/${selectedConversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: trimmedMessage }),
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to send message')
      }
      await loadMessages(selectedConversationId)
      await loadConversations({ background: true })
    } catch (error) {
      setMessages((current) => current.filter((entry) => entry.id !== optimisticId))
      messagesCacheRef.current[selectedConversationId] = (messagesCacheRef.current[selectedConversationId] ?? []).filter(
        (entry) => entry.id !== optimisticId
      )
      setMessage(trimmedMessage)
      setMessagesError(error instanceof Error ? error.message : 'Unable to send message')
    } finally {
      setSending(false)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    await sendCurrentMessage()
  }

  async function handleDeleteMessage(messageId: string) {
    if (!selectedConversationId) return
    setDeletingMessageId(messageId)
    setMessagesError('')
    try {
      const res = await fetch(`/api/chat/${selectedConversationId}/messages/${messageId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to delete message')
      }
      await loadMessages(selectedConversationId)
      await loadConversations({ background: true })
    } catch (error) {
      setMessagesError(error instanceof Error ? error.message : 'Unable to delete message')
    } finally {
      setDeletingMessageId(null)
    }
  }

  async function handleDeleteConversation() {
    if (!selectedConversationId) return
    const confirmed = window.confirm('Delete this conversation? This action cannot be undone.')
    if (!confirmed) return

    setActionBusy('deleteConversation')
    setMessagesError('')
    const conversationId = selectedConversationId
    try {
      const res = await fetch(`/api/chat/${conversationId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to delete conversation')
      }

      let nextSelectedId: string | null = null
      setConversations((current) => {
        const remaining = current.filter((conversation) => conversation.id !== conversationId)
        nextSelectedId = remaining[0]?.id ?? null
        return remaining
      })
      setSelectedConversationId((current) => (current === conversationId ? nextSelectedId : current))
      setMessages([])
      setBlockState({ isBlocked: false, blockedByRole: null, blockedByMe: false })
      await loadConversations({ background: true })
    } catch (error) {
      setMessagesError(error instanceof Error ? error.message : 'Unable to delete conversation')
    } finally {
      setActionBusy(null)
    }
  }

  async function handleToggleBlock() {
    if (!selectedConversationId) return
    const nextAction = blockState.blockedByMe ? 'unblock' : 'block'
    const confirmText = blockState.blockedByMe
      ? 'Unblock this user and allow messages again?'
      : 'Block this user? Messages will be disabled until you unblock.'
    const confirmed = window.confirm(confirmText)
    if (!confirmed) return

    setActionBusy(nextAction)
    setMessagesError('')
    try {
      const res = await fetch(`/api/chat/${selectedConversationId}/block`, {
        method: blockState.blockedByMe ? 'DELETE' : 'POST',
      })
      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error ?? 'Unable to update block status')
      }
      await loadMessages(selectedConversationId)
      await loadConversations({ background: true })
    } catch (error) {
      setMessagesError(error instanceof Error ? error.message : 'Unable to update block status')
    } finally {
      setActionBusy(null)
    }
  }

  const selectedConversation = conversations.find((item) => item.id === selectedConversationId) ?? null
  const filteredConversations = useMemo(() => {
    const term = searchQuery.trim().toLowerCase()
    if (!term) return conversations
    return conversations.filter((conversation) =>
      conversation.counterpartName.toLowerCase().includes(term) ||
      (conversation.lastMessagePreview ?? '').toLowerCase().includes(term)
    )
  }, [conversations, searchQuery])

  return (
    <div className="space-y-4">
      {chatMeta.chatOpenForTesting && (
        <div className="flex justify-end">
          <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ background: 'rgba(59,130,246,0.15)', color: '#bfdbfe', border: '1px solid rgba(59,130,246,0.28)' }}>
            Test mode
          </span>
        </div>
      )}

      {!chatMeta.schemaReady && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.28)', color: '#fde68a' }}>
          {chatMeta.message}
        </div>
      )}

      {listError && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.28)', color: '#fca5a5' }}>
          {listError}
        </div>
      )}

      <div
        className="overflow-hidden rounded-2xl border"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
          borderColor: 'var(--border)',
          boxShadow: '0 20px 45px rgba(0,0,0,0.32)',
        }}
      >
        <div className="grid gap-0 lg:grid-cols-[280px_minmax(0,1fr)] lg:h-[78vh] lg:max-h-[920px]">
          <div
            className="flex flex-col min-h-[300px] lg:min-h-0 lg:border-r"
            style={{ background: 'rgba(14,14,18,0.82)', borderColor: 'var(--border)' }}
          >
          <div className="px-4 py-4 border-b space-y-3" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white">Conversations</p>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{conversations.length}</span>
            </div>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="input-dark text-sm"
            />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 text-sm" style={{ color: 'var(--text-muted)' }}>Loading conversations...</div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setSelectedConversationId(conversation.id)}
                  className="w-full px-4 py-4 text-left border-b last:border-b-0 transition-colors"
                  style={{
                    borderColor: 'var(--border)',
                    background: selectedConversationId === conversation.id ? 'rgba(233,30,140,0.08)' : 'transparent',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Avatar
                      name={conversation.counterpartName}
                      url={conversation.counterpartAvatarUrl}
                      role={conversation.counterpartRole}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{conversation.counterpartName}</p>
                          <p className="mt-1 truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                            {conversation.lastMessagePreview || 'No messages yet'}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            {formatConversationTime(conversation.lastMessageAt)}
                          </p>
                          {conversation.unreadCount > 0 && (
                            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: 'rgba(233,30,140,0.16)', color: '#f9a8d4' }}>
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-6 text-sm" style={{ color: 'var(--text-muted)' }}>
                {searchQuery.trim()
                  ? 'No conversations match this search.'
                  : role === 'guest'
                  ? 'Open an advisor profile and start a chat to see it here.'
                  : 'Client conversations will appear here as soon as someone writes to you.'}
              </div>
            )}
          </div>
        </div>

        <div
          className="flex flex-col h-[72vh] min-h-[620px] max-h-[860px] lg:h-full lg:min-h-0 lg:max-h-none"
          style={{ background: 'linear-gradient(180deg, rgba(23,23,33,0.92), rgba(12,12,18,0.94))' }}
        >
          <div className="px-5 py-4 border-b flex items-center justify-between gap-4" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
              {selectedConversation && (
                <Avatar
                  name={selectedConversation.counterpartName}
                  url={selectedConversation.counterpartAvatarUrl}
                  role={selectedConversation.counterpartRole}
                />
              )}
              <div>
              <p className="font-semibold text-white">
                {selectedConversation ? selectedConversation.counterpartName : 'Select a conversation'}
              </p>
              {selectedConversation?.counterpartRole === 'advisor' && selectedConversation.counterpartSlug && (
                <Link href={`/profile/${selectedConversation.counterpartSlug}`} className="text-xs" style={{ color: '#f9a8d4' }}>
                  View public profile
                </Link>
              )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {selectedConversation && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {selectedConversation.unreadCount > 0 ? `${selectedConversation.unreadCount} unread` : 'Up to date'}
                </span>
              )}
              {selectedConversation && (
                <>
                  <button
                    type="button"
                    onClick={() => void handleToggleBlock()}
                    disabled={actionBusy !== null}
                    className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-60"
                  >
                    {actionBusy === 'block'
                      ? 'Blocking...'
                      : actionBusy === 'unblock'
                      ? 'Unblocking...'
                      : blockState.blockedByMe
                      ? 'Unblock user'
                      : 'Block user'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteConversation()}
                    disabled={actionBusy !== null}
                    className="btn-ghost px-3 py-1.5 text-xs disabled:opacity-60"
                    style={{ color: '#fca5a5' }}
                  >
                    {actionBusy === 'deleteConversation' ? 'Deleting...' : 'Delete chat'}
                  </button>
                </>
              )}
            </div>
          </div>

          {selectedConversation && blockState.isBlocked && (
            <div className="px-5 py-3 text-xs" style={{ background: 'rgba(245,158,11,0.1)', color: '#fde68a', borderBottom: '1px solid rgba(245,158,11,0.28)' }}>
              {blockState.blockedByMe
                ? 'You blocked this user. Unblock to send messages again.'
                : 'This conversation is blocked by the other user.'}
            </div>
          )}

          <div
            ref={messagesContainerRef}
            className="flex-1 min-h-0 overflow-y-auto px-5 py-5 space-y-3"
            style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))' }}
          >
            {!selectedConversation ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Select a conversation to read and send messages.</p>
            ) : messagesLoading ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading messages...</p>
            ) : messages.length > 0 ? (
              messages.map((entry) => {
                const mine = entry.sender_role === role
                return (
                  <div key={entry.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[85%] rounded-2xl px-4 py-3"
                      style={{
                        background: mine ? 'rgba(233,30,140,0.14)' : 'var(--bg-elevated)',
                        border: `1px solid ${mine ? 'rgba(233,30,140,0.28)' : 'var(--border)'}`,
                      }}
                    >
                      <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">{entry.body}</p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                          {formatMessageTime(entry.created_at)}
                        </p>
                        {mine && (
                          <div className="flex items-center gap-2">
                            <DeliveryIndicator optimistic={entry.optimistic} readAt={entry.read_at} />
                            {!entry.optimistic && (
                              <button
                                type="button"
                                disabled={deletingMessageId === entry.id}
                                onClick={() => void handleDeleteMessage(entry.id)}
                                className="text-[11px] hover:text-white disabled:opacity-60"
                                style={{ color: '#fca5a5' }}
                              >
                                {deletingMessageId === entry.id ? 'Deleting...' : 'Delete'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No messages yet. Start the conversation below.</p>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messagesError && (
            <div className="px-5 py-3 text-sm" style={{ color: '#fca5a5', borderTop: '1px solid var(--border)' }}>
              {messagesError}
            </div>
          )}

          <form onSubmit={handleSendMessage} className="px-5 py-4 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
            <textarea
              ref={composerRef}
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  if (!sending && selectedConversation && message.trim()) {
                    void sendCurrentMessage()
                  }
                }
              }}
              placeholder={selectedConversation ? 'Write your message...' : 'Select a conversation first'}
              disabled={!selectedConversation || sending || blockState.isBlocked}
              className="input-dark resize-none min-h-[118px]"
            />
            <div className="flex items-center justify-end gap-3">
              <button type="submit" disabled={!selectedConversation || sending || !message.trim() || blockState.isBlocked} className="btn-accent px-5 py-2 text-sm disabled:opacity-60">
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
      </div>
    </div>
  )
}
