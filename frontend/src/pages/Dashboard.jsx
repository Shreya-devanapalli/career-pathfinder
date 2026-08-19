import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import client from '../api/client'
import { useAuth } from '../context/AuthContext'
import { colors, fonts, page, btnPrimary } from '../styles/theme'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadRecommendations()
  }, [])

  async function loadRecommendations() {
    try {
      const { data } = await client.get('/api/recommend/history')
      setRecommendations(data || [])
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          'Could not load your career recommendations.'
      )
    } finally {
      setLoading(false)
    }
  }

  const latest = recommendations[0]

  return (
    <div style={page}>
      <header style={headerStyle}>
        <div>
          <div style={brandStyle}>Career Pathfinder</div>
          <div style={eyebrowStyle}>YOUR CAREER DASHBOARD</div>
        </div>

        <div style={headerActions}>
          <span style={emailStyle}>{user?.email}</span>

          <button onClick={logout} style={secondaryButton}>
            Log out
          </button>
        </div>
      </header>

      <main style={mainStyle}>
        {loading && (
          <div style={infoBox}>
            Loading your career profile...
          </div>
        )}

        {error && (
          <div style={errorBox}>
            {error}
          </div>
        )}

        {!loading && !latest && (
          <EmptyState navigate={navigate} />
        )}

        {latest && (
          <>
            <section style={heroGrid}>
              <div style={heroCard}>
                <div style={eyebrowStyle}>
                  YOUR STRONGEST CAREER MATCH
                </div>

                <h1 style={heroTitle}>
                  {latest.recommended_career}
                </h1>

                <p style={heroDescription}>
                  {latest.match_reason}
                </p>

                <div style={heroActions}>
                  <button
                    onClick={() =>
                      navigate(
                        `/career-matches?recommendation=${latest.id}`
                      )
                    }
                    style={btnPrimary}
                  >
                    Explore career →
                  </button>

                  <button
                    onClick={() =>
                      navigate(`/chat/${latest.id}`)
                    }
                    style={secondaryButton}
                  >
                    Ask Career AI
                  </button>
                </div>
              </div>

              <MatchScore
                roles={latest.job_roles}
              />
            </section>

            <section style={quickGrid}>
              <ActionCard
                number="01"
                title="Career Matches"
                description="Explore your complete ranking and understand why each role matches your profile."
                button="View matches"
                onClick={() =>
                  navigate(
                    `/career-matches?recommendation=${latest.id}`
                  )
                }
              />

              <ActionCard
                number="02"
                title="Skill Gap"
                description="See which skills you already have and which ones will strengthen your target career."
                button="Analyze skills"
                onClick={() =>
                  navigate(
                    `/skill-gap?career=${encodeURIComponent(
                      latest.recommended_career
                    )}&recommendation=${latest.id}`
                  )
                }
              />

              <ActionCard
                number="03"
                title="Roadmap"
                description="Follow a structured journey from your current level toward job readiness."
                button="View roadmap"
                onClick={() =>
                  navigate(
                    `/roadmap?career=${encodeURIComponent(
                      latest.recommended_career
                    )}`
                  )
                }
              />

              <ActionCard
                number="04"
                title="Career AI"
                description="Ask personalized questions about skills, courses, certifications and your career path."
                button="Open assistant"
                onClick={() =>
                  navigate(`/chat/${latest.id}`)
                }
              />
            </section>

            <section style={sectionStyle}>
              <div style={sectionHeader}>
                <div>
                  <div style={eyebrowStyle}>
                    PERSONALIZED RANKING
                  </div>

                  <h2 style={sectionTitle}>
                    Your career matches
                  </h2>
                </div>

                <span style={countBadge}>
                  {latest.job_roles?.length || 0} roles
                </span>
              </div>

              <div style={rolesGrid}>
                {latest.job_roles?.map((role, index) => (
                  <CareerCard
                    key={`${role.job_role}-${index}`}
                    role={role}
                    index={index}
                  />
                ))}
              </div>
            </section>

            <section style={bottomCTA}>
              <div>
                <div style={eyebrowStyle}>WANT TO EXPLORE AGAIN?</div>
                <h3 style={ctaTitle}>
                  Your career interests can evolve.
                </h3>
                <p style={ctaText}>
                  Take another assessment whenever your skills or goals
                  change.
                </p>
              </div>

              <button
                onClick={() => navigate('/assessment')}
                style={btnPrimary}
              >
                Retake assessment →
              </button>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function MatchScore({ roles = [] }) {
  const score = roles?.[0]?.matchPercentage || 0

  return (
    <div style={scoreCard}>
      <div style={eyebrowStyle}>MATCH CONFIDENCE</div>

      <div style={scoreCircle}>
        <div>
          <strong style={scoreNumber}>{score}%</strong>
          <span style={scoreLabel}>match</span>
        </div>
      </div>

      <div style={scoreBottom}>
        <span>Profile alignment</span>
        <strong>
          {score >= 80
            ? 'Excellent'
            : score >= 65
              ? 'Strong'
              : 'Developing'}
        </strong>
      </div>
    </div>
  )
}

function CareerCard({ role, index }) {
  const score = Number(role.matchPercentage) || 0
  const isTop = index === 0

  return (
    <article
      style={{
        ...careerCard,
        ...(isTop ? topCareerCard : {}),
      }}
    >
      <div style={careerCardTop}>
        <div style={rankBadge(isTop)}>
          {isTop ? '★' : `#${index + 1}`}
        </div>

        <div style={{ flex: 1 }}>
          <div style={roleLabel}>
            {isTop ? 'BEST MATCH' : `CAREER OPTION ${index + 1}`}
          </div>

          <h3 style={roleTitle}>
            {role.job_role}
          </h3>
        </div>

        <div style={percentage(isTop)}>
          {score}%
        </div>
      </div>

      <div style={progressTrack}>
        <div
          style={{
            ...progressFill,
            width: `${Math.min(score, 100)}%`,
            background: isTop
              ? colors.amber
              : colors.teal,
          }}
        />
      </div>

      <p style={roleReason}>
        {role.reason}
      </p>

      {isTop && (
        <div style={bestMatchBadge}>
          Recommended starting point
        </div>
      )}
    </article>
  )
}

function ActionCard({
  number,
  title,
  description,
  button,
  onClick,
}) {
  return (
    <article style={actionCard}>
      <div style={actionNumber}>{number}</div>

      <h3 style={actionTitle}>{title}</h3>

      <p style={actionDescription}>
        {description}
      </p>

      <button
        onClick={onClick}
        style={smallButton}
      >
        {button} →
      </button>
    </article>
  )
}

function EmptyState({ navigate }) {
  return (
    <section style={emptyState}>
      <div style={emptyIcon}>✦</div>

      <div>
        <div style={eyebrowStyle}>
          YOUR JOURNEY STARTS HERE
        </div>

        <h2 style={emptyTitle}>
          Discover where your skills can take you.
        </h2>

        <p style={emptyText}>
          Complete the assessment and Career Pathfinder will
          analyze your background, skills and interests to find
          suitable career paths.
        </p>

        <button
          onClick={() => navigate('/assessment')}
          style={btnPrimary}
        >
          Start assessment →
        </button>
      </div>
    </section>
  )
}

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '18px 32px',
  borderBottom: `1px solid ${colors.line}`,
  background: colors.panel,
}

const brandStyle = {
  fontFamily: fonts.serif,
  fontSize: 22,
  fontWeight: 600,
}

const eyebrowStyle = {
  fontFamily: fonts.mono,
  fontSize: 10,
  color: colors.teal,
  textTransform: 'uppercase',
  letterSpacing: 1.2,
}

const headerActions = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
}

const emailStyle = {
  color: colors.muted,
  fontFamily: fonts.mono,
  fontSize: 11,
}

const secondaryButton = {
  background: 'transparent',
  border: `1px solid ${colors.line}`,
  color: colors.paper,
  borderRadius: 9,
  padding: '9px 14px',
  cursor: 'pointer',
  fontFamily: fonts.sans,
}

const mainStyle = {
  maxWidth: 1120,
  width: '100%',
  margin: '0 auto',
  padding: '42px 24px 70px',
}

const heroGrid = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.65fr) minmax(250px, .75fr)',
  gap: 18,
  marginBottom: 22,
}

const heroCard = {
  background: colors.panel,
  border: `1px solid ${colors.line}`,
  borderRadius: 22,
  padding: '34px 34px 30px',
  boxShadow: '0 12px 35px rgba(0,0,0,.08)',
}

const heroTitle = {
  fontFamily: fonts.serif,
  fontSize: 'clamp(34px, 5vw, 50px)',
  lineHeight: 1.05,
  margin: '10px 0 16px',
  color: colors.amber,
}

const heroDescription = {
  color: colors.muted,
  maxWidth: 720,
  lineHeight: 1.7,
  margin: 0,
}

const heroActions = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
  marginTop: 26,
}

const scoreCard = {
  background: colors.panel,
  border: `1px solid ${colors.line}`,
  borderRadius: 22,
  padding: 28,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: 270,
}

const scoreCircle = {
  width: 150,
  height: 150,
  borderRadius: '50%',
  margin: '12px auto',
  border: `10px solid ${colors.primarySoft || colors.line}`,
  outline: `2px solid ${colors.teal}`,
  outlineOffset: '-10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
}

const scoreNumber = {
  display: 'block',
  fontFamily: fonts.serif,
  fontSize: 38,
}

const scoreLabel = {
  color: colors.muted,
  fontSize: 11,
  display: 'block',
  fontFamily: fonts.mono,
}

const scoreBottom = {
  display: 'flex',
  justifyContent: 'space-between',
  borderTop: `1px solid ${colors.line}`,
  paddingTop: 14,
  color: colors.muted,
  fontSize: 12,
}

const quickGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 14,
  marginBottom: 52,
}

const actionCard = {
  background: colors.panel,
  border: `1px solid ${colors.line}`,
  borderRadius: 17,
  padding: 20,
  transition: 'transform .2s ease, border-color .2s ease',
}

const actionNumber = {
  fontFamily: fonts.mono,
  fontSize: 10,
  color: colors.amber,
  marginBottom: 14,
}

const actionTitle = {
  fontFamily: fonts.serif,
  fontSize: 20,
  margin: 0,
}

const actionDescription = {
  color: colors.muted,
  fontSize: 13,
  lineHeight: 1.6,
  minHeight: 62,
}

const smallButton = {
  background: colors.primary,
  color: colors.paper,
  border: 'none',
  borderRadius: 8,
  padding: '9px 12px',
  cursor: 'pointer',
  fontSize: 12,
}

const sectionStyle = {
  marginTop: 10,
}

const sectionHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'end',
  marginBottom: 18,
}

const sectionTitle = {
  fontFamily: fonts.serif,
  fontSize: 30,
  margin: '7px 0 0',
}

const countBadge = {
  color: colors.muted,
  border: `1px solid ${colors.line}`,
  borderRadius: 99,
  padding: '7px 11px',
  fontFamily: fonts.mono,
  fontSize: 10,
}

const rolesGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: 14,
}

const careerCard = {
  background: colors.panel,
  border: `1px solid ${colors.line}`,
  borderRadius: 17,
  padding: 20,
}

const topCareerCard = {
  borderColor: colors.amber,
}

const careerCardTop = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const rankBadge = (isTop) => ({
  width: 34,
  height: 34,
  borderRadius: 10,
  background: isTop
    ? colors.amber
    : colors.primarySoft || colors.line,
  color: isTop ? colors.ink : colors.teal,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: fonts.mono,
  fontSize: 11,
  flexShrink: 0,
})

const roleLabel = {
  fontFamily: fonts.mono,
  color: colors.muted,
  fontSize: 9,
  letterSpacing: .8,
}

const roleTitle = {
  fontFamily: fonts.serif,
  fontSize: 19,
  margin: '4px 0 0',
}

const percentage = (isTop) => ({
  fontFamily: fonts.mono,
  fontSize: 16,
  color: isTop ? colors.amber : colors.teal,
})

const progressTrack = {
  height: 7,
  background: colors.line,
  borderRadius: 99,
  marginTop: 17,
  overflow: 'hidden',
}

const progressFill = {
  height: '100%',
  borderRadius: 99,
  transition: 'width .7s ease',
}

const roleReason = {
  color: colors.muted,
  fontSize: 12,
  lineHeight: 1.6,
  marginBottom: 0,
}

const bestMatchBadge = {
  display: 'inline-block',
  marginTop: 14,
  padding: '6px 9px',
  borderRadius: 7,
  background: colors.primarySoft || colors.line,
  color: colors.teal,
  fontFamily: fonts.mono,
  fontSize: 9,
}

const bottomCTA = {
  marginTop: 28,
  background: colors.primarySoft || colors.panel,
  border: `1px solid ${colors.line}`,
  borderRadius: 18,
  padding: '22px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 20,
  flexWrap: 'wrap',
}

const ctaTitle = {
  fontFamily: fonts.serif,
  fontSize: 21,
  margin: '6px 0',
}

const ctaText = {
  color: colors.muted,
  margin: 0,
  fontSize: 13,
}

const emptyState = {
  display: 'flex',
  gap: 24,
  alignItems: 'center',
  background: colors.panel,
  border: `1px solid ${colors.line}`,
  borderRadius: 22,
  padding: 36,
}

const emptyIcon = {
  width: 58,
  height: 58,
  borderRadius: 16,
  background: colors.primarySoft || colors.line,
  color: colors.teal,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 25,
  flexShrink: 0,
}

const emptyTitle = {
  fontFamily: fonts.serif,
  fontSize: 28,
  margin: '7px 0 8px',
}

const emptyText = {
  color: colors.muted,
  lineHeight: 1.7,
  maxWidth: 650,
}

const infoBox = {
  background: colors.panel,
  border: `1px solid ${colors.line}`,
  borderRadius: 16,
  padding: 22,
  color: colors.muted,
}

const errorBox = {
  ...infoBox,
  borderColor: colors.coral,
  color: colors.coral,
}