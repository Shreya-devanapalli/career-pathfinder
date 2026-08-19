import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import client from '../api/client'
import { btnPrimary, colors, fonts, page } from '../styles/theme'

export default function CareerMatches() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const recommendationId = params.get('recommendation')
  const [recommendation, setRecommendation] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadMatches() {
      try {
        const response = recommendationId
          ? await client.get(`/api/recommend/${recommendationId}`)
          : await client.get('/api/recommend/history')

        setRecommendation(
          recommendationId ? response.data : response.data?.[0] || null
        )
      } catch (requestError) {
        setError(
          requestError?.response?.data?.detail ||
            'Could not load your career matches.'
        )
      }
    }

    loadMatches()
  }, [recommendationId])

  const roles = recommendation?.job_roles || []

  return (
    <div style={page}>
      <header style={headerStyle}>
        <button onClick={() => navigate('/dashboard')} style={backButton}>
          ← Dashboard
        </button>
        <div>
          <div style={{ fontFamily: fonts.serif, fontSize: 22 }}>
            Career Pathfinder
          </div>
          <div style={eyebrow}>CAREER MATCHES</div>
        </div>
      </header>

      <main style={mainStyle}>
        <div style={eyebrow}>Your personalized ranking</div>
        <h1 style={titleStyle}>Career Matches</h1>
        <p style={introStyle}>
          Your ranking is based on the skills, proficiency levels, academic
          branch, and interests you shared in the assessment.
        </p>

        {error && <div style={errorStyle}>{error}</div>}

        {!error && !recommendation && (
          <div style={cardStyle}>Loading your career matches…</div>
        )}

        {roles.map((role, index) => {
          const percentage = role.matchPercentage ?? role.match_percentage ?? 0

          return (
            <article
              key={`${role.job_role}-${index}`}
              style={{
                ...cardStyle,
                borderColor: index === 0 ? colors.amber : colors.line,
              }}
            >
              <div style={roleHeader}>
                <div>
                  <div style={eyebrow}>#{index + 1} CAREER MATCH</div>
                  <h2 style={roleTitle}>{role.job_role}</h2>
                </div>
                <strong style={{ color: index === 0 ? colors.amber : colors.teal, fontFamily: fonts.mono, fontSize: 28 }}>
                  {percentage}%
                </strong>
              </div>
              <div style={progressTrack}>
                <div
                  style={{
                    width: `${percentage}%`,
                    height: '100%',
                    borderRadius: 99,
                    background: index === 0 ? colors.amber : colors.teal,
                  }}
                />
              </div>
              <p style={reasonStyle}>{role.reason}</p>
            </article>
          )
        })}

        {recommendation && (
          <button onClick={() => navigate('/assessment')} style={{ ...btnPrimary, marginTop: 12 }}>
            Take another assessment →
          </button>
        )}
      </main>
    </div>
  )
}

const headerStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 20,
  padding: '20px 32px',
  borderBottom: `1px solid ${colors.line}`,
}

const backButton = {
  background: 'transparent',
  border: `1px solid ${colors.line}`,
  borderRadius: 8,
  color: colors.paper,
  cursor: 'pointer',
  padding: '8px 14px',
}

const mainStyle = { maxWidth: 900, margin: '0 auto', padding: '48px 24px 80px', width: '100%' }
const eyebrow = { color: colors.teal, fontFamily: fonts.mono, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }
const titleStyle = { fontFamily: fonts.serif, fontSize: 42, margin: '8px 0' }
const introStyle = { color: colors.muted, lineHeight: 1.7, marginBottom: 34, maxWidth: 660 }
const cardStyle = { background: colors.panel, border: `1px solid ${colors.line}`, borderRadius: 16, marginBottom: 14, padding: 24 }
const roleHeader = { alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 16 }
const roleTitle = { fontFamily: fonts.serif, fontSize: 25, margin: '6px 0 0' }
const progressTrack = { background: colors.line, borderRadius: 99, height: 8, marginTop: 20, overflow: 'hidden' }
const reasonStyle = { color: colors.muted, lineHeight: 1.6, marginBottom: 0 }
const errorStyle = { ...cardStyle, borderColor: colors.coral, color: colors.coral }
