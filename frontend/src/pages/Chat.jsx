import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { colors, fonts, page, btnPrimary } from '../styles/theme'

export default function Chat() {
  const { recommendationId } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [recommendation, setRecommendation] = useState(null)

  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const [historyOpen, setHistoryOpen] = useState(true)

  const bottomRef = useRef(null)

  /*
   * Load recommendation + chat history
   */
  useEffect(() => {
    loadData()
  }, [recommendationId])

  /*
   * Scroll to newest message
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, sending])

  async function loadData() {
    setLoading(true)
    setError('')

    try {
      const [recommendationResponse, historyResponse] =
        await Promise.all([
          client.get(`/api/recommend/${recommendationId}`),
          client.get(`/api/chat/${recommendationId}`),
        ])

      setRecommendation(recommendationResponse.data)
      setMessages(historyResponse.data || [])
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Could not load your career conversation.'
      )
    } finally {
      setLoading(false)
    }
  }

  /*
   * Send message
   */
  async function sendMessage() {
    const text = input.trim()

    if (!text || sending) return

    setInput('')
    setSending(true)
    setError('')

    const temporaryMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: text,
    }

    setMessages((prev) => [
      ...prev,
      temporaryMessage,
    ])

    try {
      const { data } = await client.post(
        '/api/chat',
        {
          recommendation_id: recommendationId,
          message: text,
        }
      )

      setMessages((prev) => [
        ...prev,
        {
          id: data.id || `bot-${Date.now()}`,
          role: data.role || 'bot',
          content: data.content,
          created_at: data.created_at,
        },
      ])
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Could not send your message.'
      )
    } finally {
      setSending(false)
    }
  }

  /*
   * Navigate to Skill Gap
   */
  function openSkillGap() {
    if (!recommendation) return

    navigate(
      `/skill-gap?career=${encodeURIComponent(
        recommendation.recommended_career
      )}&recommendation=${recommendation.id}`
    )
  }

  /*
   * Navigate to Roadmap
   */
  function openRoadmap() {
    if (!recommendation) return

    navigate(
      `/roadmap?career=${encodeURIComponent(
        recommendation.recommended_career
      )}`
    )
  }

  /*
   * Quick question
   */
  function askQuestion(question) {
    setInput(question)

    setTimeout(() => {
      document
        .getElementById('career-chat-input')
        ?.focus()
    }, 50)
  }

  return (
    <div
      style={{
        ...page,
        minHeight: '100vh',
      }}
    >
      {/* ================= HEADER ================= */}

      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 20,
          padding: '18px 28px',
          borderBottom: `1px solid ${colors.line}`,
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: colors.ink,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <button
            onClick={() => navigate('/dashboard')}
            style={secondaryButton}
          >
            ← Dashboard
          </button>

          <div>
            <div
              style={{
                fontFamily: fonts.serif,
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              Career Pathfinder
            </div>

            <div
              style={{
                color: colors.muted,
                fontFamily: fonts.mono,
                fontSize: 10,
                marginTop: 3,
              }}
            >
              CAREER AI
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span
            style={{
              color: colors.muted,
              fontFamily: fonts.mono,
              fontSize: 11,
            }}
          >
            {user?.email}
          </span>

          <button
            onClick={logout}
            style={secondaryButton}
          >
            Log out
          </button>
        </div>
      </header>

      {/* ================= MAIN ================= */}

      <main
        style={{
          maxWidth: 1250,
          margin: '0 auto',
          padding: '28px 20px 50px',
        }}
      >
        {/* ================= CAREER SUMMARY ================= */}

        {recommendation && (
          <section
            style={{
              background: colors.panel,
              border: `1px solid ${colors.line}`,
              borderRadius: 16,
              padding: 22,
              marginBottom: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 20,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div
                  style={{
                    color: colors.teal,
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  Your recommended career
                </div>

                <h1
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 32,
                    color: colors.amber,
                    margin: '6px 0',
                  }}
                >
                  {recommendation.recommended_career}
                </h1>

                <p
                  style={{
                    color: colors.muted,
                    fontSize: 13,
                    margin: 0,
                  }}
                >
                  Ask questions, analyze your skill gaps,
                  or follow your personalized roadmap.
                </p>
              </div>

              <div
                style={{
                  textAlign: 'center',
                  minWidth: 110,
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.mono,
                    color: colors.muted,
                    fontSize: 10,
                  }}
                >
                  MATCH
                </div>

                <div
                  style={{
                    fontFamily: fonts.serif,
                    color: colors.teal,
                    fontSize: 34,
                    marginTop: 2,
                  }}
                >
                  {getTopMatch(
                    recommendation
                  )}
                  %
                </div>
              </div>
            </div>

            {/* FEATURE NAVIGATION */}

            <div
              style={{
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
                marginTop: 20,
                paddingTop: 18,
                borderTop: `1px solid ${colors.line}`,
              }}
            >
              <FeatureButton
                active
                icon="💬"
                title="AI Chat"
                onClick={() => {}}
              />

              <FeatureButton
                icon="📊"
                title="Skill Gap"
                onClick={openSkillGap}
              />

              <FeatureButton
                icon="🗺️"
                title="Career Roadmap"
                onClick={openRoadmap}
              />

              <FeatureButton
                icon="📈"
                title="Dashboard"
                onClick={() => navigate('/dashboard')}
              />
            </div>
          </section>
        )}

        {error && (
          <div
            style={{
              background: colors.dangerSoft,
              border: `1px solid ${colors.coral}`,
              color: colors.coral,
              borderRadius: 10,
              padding: 14,
              marginBottom: 18,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* ================= CHAT WORKSPACE ================= */}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: historyOpen
              ? '250px minmax(0, 1fr)'
              : 'minmax(0, 1fr)',
            gap: 18,
            alignItems: 'stretch',
          }}
        >
          {/* ================= HISTORY SIDEBAR ================= */}

          {historyOpen && (
            <aside
              style={{
                background: colors.panel,
                border: `1px solid ${colors.line}`,
                borderRadius: 16,
                padding: 16,
                minHeight: 620,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 11,
                    color: colors.muted,
                    letterSpacing: 1,
                  }}
                >
                  CHAT HISTORY
                </div>

                <button
                  onClick={() =>
                    setHistoryOpen(false)
                  }
                  style={iconButton}
                  title="Hide history"
                >
                  ×
                </button>
              </div>

              {loading ? (
                <p
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                  }}
                >
                  Loading history...
                </p>
              ) : messages.length === 0 ? (
                <p
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                    lineHeight: 1.6,
                  }}
                >
                  Your conversations will appear
                  here.
                </p>
              ) : (
                <div>
                  <div
                    style={{
                      color: colors.teal,
                      fontFamily: fonts.mono,
                      fontSize: 10,
                      marginBottom: 10,
                    }}
                  >
                    CURRENT CONVERSATION
                  </div>

                  <div
                    style={{
                      border: `1px solid ${colors.teal}`,
                      borderRadius: 10,
                      padding: 12,
                      background:
                        'rgba(79,179,169,0.07)',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: fonts.serif,
                        fontSize: 14,
                        marginBottom: 5,
                      }}
                    >
                      Career guidance
                    </div>

                    <div
                      style={{
                        color: colors.muted,
                        fontSize: 11,
                      }}
                    >
                      {messages.length} message
                      {messages.length !== 1
                        ? 's'
                        : ''}
                    </div>
                  </div>
                </div>
              )}

              {/* HISTORY INFO */}

              <div
                style={{
                  marginTop: 24,
                  paddingTop: 18,
                  borderTop: `1px solid ${colors.line}`,
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 10,
                    color: colors.muted,
                    marginBottom: 8,
                  }}
                >
                  YOUR DATA
                </div>

                <p
                  style={{
                    color: colors.muted,
                    fontSize: 11,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  Your conversation is saved to your
                  account so you can continue your
                  career guidance later.
                </p>
              </div>
            </aside>
          )}

          {/* ================= CHAT ================= */}

          <section
            style={{
              background: colors.panel,
              border: `1px solid ${colors.line}`,
              borderRadius: 16,
              minHeight: 620,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              minWidth: 0,
            }}
          >
            {/* CHAT HEADER */}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                paddingBottom: 16,
                borderBottom: `1px solid ${colors.line}`,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 22,
                  }}
                >
                  Career AI
                </div>

                <div
                  style={{
                    color: colors.muted,
                    fontSize: 11,
                    marginTop: 3,
                  }}
                >
                  Personalized guidance based on your
                  profile
                </div>
              </div>

              {!historyOpen && (
                <button
                  onClick={() =>
                    setHistoryOpen(true)
                  }
                  style={secondaryButton}
                >
                  🕘 History
                </button>
              )}
            </div>

            {/* QUICK ACTIONS */}

            {!loading && messages.length === 0 && (
              <div
                style={{
                  padding: '35px 10px 15px',
                }}
              >
                <h2
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 25,
                    marginBottom: 8,
                  }}
                >
                  How can I help with your career?
                </h2>

                <p
                  style={{
                    color: colors.muted,
                    fontSize: 13,
                    lineHeight: 1.6,
                    maxWidth: 600,
                  }}
                >
                  Ask about your recommended role,
                  missing skills, learning strategy,
                  projects, placements or career
                  decisions.
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginTop: 20,
                  }}
                >
                  <QuickQuestion
                    text="Why is this my best career match?"
                    onClick={askQuestion}
                  />

                  <QuickQuestion
                    text="What skills am I missing?"
                    onClick={askQuestion}
                  />

                  <QuickQuestion
                    text="What should I learn first?"
                    onClick={askQuestion}
                  />

                  <QuickQuestion
                    text="How should I prepare for placements?"
                    onClick={askQuestion}
                  />
                </div>
              </div>
            )}

            {/* MESSAGES */}

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 4px',
                minHeight: 330,
                maxHeight: 560,
              }}
            >
              {loading && (
                <div
                  style={{
                    color: colors.muted,
                    textAlign: 'center',
                    padding: 50,
                  }}
                >
                  Loading your conversation...
                </div>
              )}

              {messages.map((message, index) => (
                <MessageBubble
                  key={
                    message.id ||
                    `${message.role}-${index}`
                  }
                  message={message}
                />
              ))}

              {sending && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      background: colors.ink,
                      border: `1px solid ${colors.line}`,
                      borderRadius:
                        '5px 16px 16px 16px',
                      padding: '12px 15px',
                      color: colors.muted,
                      fontFamily: fonts.mono,
                      fontSize: 11,
                    }}
                  >
                    Career AI is thinking...
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* INPUT */}

            <div
              style={{
                borderTop: `1px solid ${colors.line}`,
                paddingTop: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                }}
              >
                <input
                  id="career-chat-input"
                  value={input}
                  onChange={(e) =>
                    setInput(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === 'Enter' &&
                      !e.shiftKey
                    ) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Ask about your career..."
                  disabled={sending}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: colors.ink,
                    border: `1px solid ${colors.line}`,
                    borderRadius: 10,
                    padding: '13px 14px',
                    color: colors.paper,
                    outline: 'none',
                    fontFamily: fonts.sans,
                    fontSize: 13,
                  }}
                />

                <button
                  onClick={sendMessage}
                  disabled={sending}
                  style={{
                    ...btnPrimary,
                    opacity: sending ? 0.6 : 1,
                  }}
                >
                  Send →
                </button>
              </div>

              <div
                style={{
                  color: colors.muted,
                  fontSize: 10,
                  marginTop: 8,
                }}
              >
                Press Enter to send
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

/* =========================================================
   COMPONENTS
========================================================= */

function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser
          ? 'flex-end'
          : 'flex-start',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          maxWidth: '78%',
        }}
      >
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 9,
            color: colors.muted,
            marginBottom: 5,
            textAlign: isUser
              ? 'right'
              : 'left',
          }}
        >
          {isUser ? 'YOU' : 'CAREER AI'}
        </div>

        <div
          style={{
            padding: '13px 16px',
            borderRadius: isUser
              ? '16px 5px 16px 16px'
              : '5px 16px 16px 16px',
            background: isUser
              ? colors.primarySoft
              : colors.ink,
            border: `1px solid ${
              isUser
                ? colors.teal
                : colors.line
            }`,
            color: colors.paper,
            fontSize: 14,
            lineHeight: 1.65,
            whiteSpace: 'pre-wrap',
          }}
        >
          {message.content}
        </div>
      </div>
    </div>
  )
}

function FeatureButton({
  icon,
  title,
  active,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 14px',
        borderRadius: 9,
        border: `1px solid ${
          active ? colors.teal : colors.line
        }`,
        background: active
          ? 'rgba(79,179,169,0.10)'
          : 'transparent',
        color: active
          ? colors.teal
          : colors.paper,
        cursor: 'pointer',
        fontFamily: fonts.mono,
        fontSize: 11,
      }}
    >
      <span>{icon}</span>
      {title}
    </button>
  )
}

function QuickQuestion({ text, onClick }) {
  return (
    <button
      onClick={() => onClick(text)}
      style={{
        background: 'transparent',
        border: `1px solid ${colors.line}`,
        color: colors.muted,
        borderRadius: 999,
        padding: '8px 13px',
        cursor: 'pointer',
        fontSize: 11,
      }}
    >
      {text}
    </button>
  )
}

function getTopMatch(recommendation) {
  const roles = recommendation?.job_roles || []

  if (!roles.length) return 0

  const top = roles[0]

  return (
    top.matchPercentage ??
    top.match_percentage ??
    0
  )
}

const secondaryButton = {
  background: 'transparent',
  border: `1px solid ${colors.line}`,
  color: colors.paper,
  borderRadius: 8,
  padding: '8px 12px',
  cursor: 'pointer',
  fontSize: 12,
}

const iconButton = {
  background: 'transparent',
  border: 'none',
  color: colors.muted,
  cursor: 'pointer',
  fontSize: 18,
}