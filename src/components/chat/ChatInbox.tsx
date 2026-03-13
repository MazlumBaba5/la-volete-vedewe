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

type ConversationsResponse = {
  schema_ready?: boolean
  chatOpenForTesting?: boolean
  message?: string
  items: ChatConversation[]
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
  const [sending, setSending] = useState(false)
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
      const nextMessages = (json.messages as ChatMessage[]) ?? []
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
    if (!selectedConversationId || !message.trim()) return

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
    <div className="space-y-5">
      <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(135deg, rgba(233,30,140,0.08), rgba(59,130,246,0.08))', border: '1px solid var(--border)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>Live chat</p>
            <h2 className="mt-2 text-2xl font-black text-white">Inbox</h2>
          </div>
          {chatMeta.chatOpenForTesting && (
            <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]" style={{ background: 'rgba(59,130,246,0.15)', color: '#bfdbfe', border: '1px solid rgba(59,130,246,0.28)' }}>
              Test mode
            </span>
          )}
        </div>
        <p className="mt-3 text-sm" style={{ color: '#d1d5db' }}>
          {chatMeta.message || 'Exchange private messages between registered client accounts and advisors.'}
        </p>
      </div>

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

      <div className="grid gap-4 lg:grid-cols-[340px_1fr] lg:h-[680px]">
        <div className="rounded-xl overflow-hidden flex flex-col min-h-[320px] lg:min-h-0" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
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

        <div className="rounded-xl overflow-hidden flex flex-col h-[620px] lg:h-full min-h-0" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
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
            {selectedConversation && (
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {selectedConversation.unreadCount > 0 ? `${selectedConversation.unreadCount} unread` : 'Up to date'}
              </span>
            )}
          </div>

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
                const isLastMessage = messages[messages.length - 1]?.id === entry.id
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
                          <span className="text-[11px]" style={{ color: entry.optimistic ? '#fde68a' : entry.read_at && isLastMessage ? '#86efac' : 'var(--text-muted)' }}>
                            {entry.optimistic ? 'Sending...' : entry.read_at && isLastMessage ? 'Seen' : 'Sent'}
                          </span>
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
              rows={3}
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
              disabled={!selectedConversation || sending}
              className="input-dark resize-none"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Press `Enter` to send. Use `Shift+Enter` for a new line.
              </p>
              <button type="submit" disabled={!selectedConversation || sending || !message.trim()} className="btn-accent px-5 py-2 text-sm disabled:opacity-60">
                {sending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
