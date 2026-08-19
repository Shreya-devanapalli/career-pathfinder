import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import client from '../api/client'
import { colors, fonts, page, btnPrimary } from '../styles/theme'

export default function SkillGap() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const career = params.get('career')

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!career) {
      setError('No career was selected.')
      setLoading(false)
      return
    }

    loadSkillGap()
  }, [career])

  async function loadSkillGap() {
    try {
      setLoading(true)
      setError('')

      const { data: history } = await client.get(
        '/api/recommend/history'
      )

      if (!history || !history.length) {
        throw new Error(
          'No career recommendation was found. Please complete an assessment first.'
        )
      }

      const latest = history[0]

      const skills = Array.isArray(latest.skills)
        ? latest.skills
        : []

      const response = await client.post(
        '/api/skill-gap',
        {
          career,
          skills,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      setData(response.data)
    } catch (err) {
      console.error('Skill gap error:', err)

      const detail = err?.response?.data?.detail

      if (Array.isArray(detail)) {
        const messages = detail
          .map((item) => item?.msg)
          .filter(Boolean)

        setError(
          messages.length
            ? messages.join(', ')
            : 'Invalid skill gap request.'
        )
      } else if (typeof detail === 'string') {
        setError(detail)
      } else if (err?.message) {
        setError(err.message)
      } else {
        setError('Could not load the skill gap analysis.')
      }
    } finally {
      setLoading(false)
    }
  }

  const matchPercentage =
    Number(data?.skill_match_percentage) || 0

  const haveCount =
    data?.skills_you_have?.length || 0

  const missingCount =
    data?.missing_skills?.length || 0

  const requiredCount =
    data?.required_skills?.length || 0

  return (
    <div style={page}>
      <Header
        title="Skill Gap Analysis"
        onBack={() => navigate('/dashboard')}
      />

      <main
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '42px 24px 90px',
        }}
      >
        {/* HERO */}
        <section
          style={{
            marginBottom: 34,
            padding: '30px 32px',
            borderRadius: 22,
            background: `linear-gradient(135deg, ${colors.panel}, ${colors.panel})`,
            border: `1px solid ${colors.line}`,
            boxShadow: `0 12px 35px ${colors.shadow || 'rgba(0,0,0,0.05)'}`,
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 12px',
              borderRadius: 999,
              background: colors.tealSoft || colors.panel,
              border: `1px solid ${colors.line}`,
              color: colors.teal,
              fontFamily: fonts.mono,
              fontSize: 10,
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            <span>◈</span>
            Career development
          </div>

          <h1
            style={{
              fontFamily: fonts.serif,
              fontSize: 'clamp(32px, 5vw, 46px)',
              margin: '16px 0 8px',
              lineHeight: 1.1,
            }}
          >
            Your Skill Gap
          </h1>

          <p
            style={{
              color: colors.muted,
              maxWidth: 760,
              lineHeight: 1.7,
              margin: 0,
              fontSize: 15,
            }}
          >
            See where you stand today and what you need to
            learn to become a{' '}
            <strong style={{ color: colors.paper }}>
              {career}
            </strong>
            .
          </p>
        </section>

        {/* LOADING */}
        {loading && (
          <LoadingState />
        )}

        {/* ERROR */}
        {!loading && error && (
          <div
            style={{
              ...infoBox,
              borderColor: colors.coral,
              background: colors.panel,
            }}
          >
            <div
              style={{
                fontSize: 28,
                marginBottom: 12,
              }}
            >
              ⚠️
            </div>

            <strong
              style={{
                color: colors.coral,
                fontSize: 17,
              }}
            >
              Unable to load skill gap analysis
            </strong>

            <p
              style={{
                color: colors.muted,
                lineHeight: 1.6,
                marginBottom: 18,
              }}
            >
              {error}
            </p>

            <button
              onClick={loadSkillGap}
              style={btnPrimary}
            >
              Try again →
            </button>
          </div>
        )}

        {/* CONTENT */}
        {!loading && !error && data && (
          <>
            {/* TOP METRICS */}
            <section
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'minmax(240px, 0.85fr) 1.5fr',
                gap: 18,
                marginBottom: 24,
              }}
            >
              {/* SCORE CARD */}
              <div
                style={{
                  ...card,
                  position: 'relative',
                  overflow: 'hidden',
                  textAlign: 'center',
                  padding: 30,
                }}
              >
                <div style={label}>
                  CURRENT SKILL MATCH
                </div>

                <div
                  style={{
                    width: 150,
                    height: 150,
                    margin: '22px auto 18px',
                    borderRadius: '50%',
                    display: 'grid',
                    placeItems: 'center',
                    position: 'relative',
                    background: `conic-gradient(
                      ${matchPercentage >= 75
                        ? colors.teal
                        : colors.amber}
                      ${matchPercentage * 3.6}deg,
                      ${colors.line}
                      ${matchPercentage * 3.6}deg
                    )`,
                  }}
                >
                  <div
                    style={{
                      width: 122,
                      height: 122,
                      borderRadius: '50%',
                      background: colors.panel,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: fonts.serif,
                        fontSize: 38,
                        fontWeight: 600,
                        color:
                          matchPercentage >= 75
                            ? colors.teal
                            : colors.amber,
                      }}
                    >
                      {matchPercentage}%
                    </span>
                  </div>
                </div>

                <strong
                  style={{
                    display: 'block',
                    fontSize: 16,
                    marginBottom: 5,
                  }}
                >
                  {data.career || career}
                </strong>

                <span
                  style={{
                    color: colors.muted,
                    fontSize: 12,
                  }}
                >
                  Current profile alignment
                </span>
              </div>

              {/* SUMMARY CARD */}
              <div
                style={{
                  ...card,
                  padding: 28,
                }}
              >
                <div style={label}>
                  PROFILE SNAPSHOT
                </div>

                <h2
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 25,
                    margin: '9px 0 8px',
                  }}
                >
                  Where you stand
                </h2>

                <p
                  style={{
                    color: colors.muted,
                    lineHeight: 1.65,
                    marginTop: 0,
                  }}
                >
                  Your current profile covers{' '}
                  <strong
                    style={{ color: colors.paper }}
                  >
                    {haveCount}
                  </strong>{' '}
                  of{' '}
                  <strong
                    style={{ color: colors.paper }}
                  >
                    {requiredCount}
                  </strong>{' '}
                  identified skills for this career.
                </p>

                {/* PROGRESS */}
                <div style={{ marginTop: 22 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{ color: colors.muted }}
                    >
                      Skill coverage
                    </span>

                    <strong
                      style={{
                        color:
                          matchPercentage >= 75
                            ? colors.teal
                            : colors.amber,
                      }}
                    >
                      {matchPercentage}%
                    </strong>
                  </div>

                  <div
                    style={{
                      height: 9,
                      background: colors.line,
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(
                          matchPercentage,
                          100
                        )}%`,
                        height: '100%',
                        background:
                          matchPercentage >= 75
                            ? colors.teal
                            : colors.amber,
                        borderRadius: 999,
                        transition: 'width .6s ease',
                      }}
                    />
                  </div>
                </div>

                {/* MINI STATS */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(3, 1fr)',
                    gap: 10,
                    marginTop: 24,
                  }}
                >
                  <MiniStat
                    number={haveCount}
                    text="You have"
                    tone="teal"
                  />

                  <MiniStat
                    number={missingCount}
                    text="To develop"
                    tone="amber"
                  />

                  <MiniStat
                    number={requiredCount}
                    text="Required"
                    tone="normal"
                  />
                </div>
              </div>
            </section>

            {/* SKILL OVERVIEW */}
            <section
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(300px, 1fr))',
                gap: 18,
                marginBottom: 12,
              }}
            >
              <SkillPanel
                icon="✓"
                title="Skills you already have"
                subtitle="Your current strengths"
                skills={data.skills_you_have || []}
                type="good"
                emptyText="No matching skills were identified yet."
              />

              <SkillPanel
                icon="→"
                title="Skills to develop"
                subtitle="Your biggest opportunities"
                skills={data.missing_skills || []}
                type="missing"
                emptyText="Excellent! No required skills are currently missing."
              />
            </section>

            {/* REQUIRED SKILLS */}
            <Section
              eyebrow="TARGET PROFILE"
              title="Skills required for this career"
              description="These are the capabilities your target role expects."
            >
              <div
                style={{
                  ...card,
                  padding: 22,
                }}
              >
                {data.required_skills?.length ? (
                  <SkillChips
                    skills={data.required_skills}
                    type="normal"
                  />
                ) : (
                  <Empty>
                    No required skills have been mapped yet.
                  </Empty>
                )}
              </div>
            </Section>

            {/* LEARNING */}
            <Section
              eyebrow="YOUR NEXT STEPS"
              title="Recommended learning"
              description="Turn your missing skills into an actionable learning plan."
            >
              <ResourceGrid
                items={data.recommended_courses || []}
                buttonText="View course →"
                emptyText="No course is currently mapped to your missing skills."
                type="course"
              />
            </Section>

            {/* CERTIFICATIONS */}
            <Section
              eyebrow="CREDENTIALS"
              title="Recommended certifications"
              description="Optional credentials that can strengthen your career profile."
            >
              <ResourceGrid
                items={data.recommended_certifications || []}
                buttonText="View certification →"
                emptyText="No certification is currently mapped to your missing skills."
                type="certification"
              />
            </Section>

            {/* BOTTOM CTA */}
            <section
              style={{
                marginTop: 42,
                padding: 28,
                borderRadius: 20,
                background: colors.panel,
                border: `1px solid ${colors.line}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 20,
                flexWrap: 'wrap',
              }}
            >
              <div>
                <div style={label}>
                  READY FOR THE NEXT STEP?
                </div>

                <h2
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 24,
                    margin: '7px 0',
                  }}
                >
                  Build your career roadmap
                </h2>

                <p
                  style={{
                    color: colors.muted,
                    margin: 0,
                    fontSize: 13,
                  }}
                >
                  Follow a structured path from learning
                  to job readiness.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={() => navigate('/dashboard')}
                  style={secondaryButton}
                >
                  ← Dashboard
                </button>

                <button
                  onClick={() =>
                    navigate(
                      `/roadmap?career=${encodeURIComponent(
                        career
                      )}`
                    )
                  }
                  style={btnPrimary}
                >
                  View roadmap →
                </button>

                <button
                  onClick={() => {
                    const recommendationId =
                      params.get('recommendation')

                    if (recommendationId) {
                      navigate(
                        `/chat/${recommendationId}`
                      )
                    } else {
                      navigate('/dashboard')
                    }
                  }}
                  style={secondaryButton}
                >
                  Ask Career AI
                </button>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

/* ------------------------------------------------ */
/* Header */
/* ------------------------------------------------ */

function Header({ title, onBack }) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '18px 32px',
        borderBottom: `1px solid ${colors.line}`,
        background: colors.panel,
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <button
        onClick={onBack}
        style={secondaryButton}
      >
        ← Back
      </button>

      <div>
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 9,
            color: colors.teal,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          Career Pathfinder
        </div>

        <h1
          style={{
            fontFamily: fonts.serif,
            fontSize: 20,
            margin: '3px 0 0',
          }}
        >
          {title}
        </h1>
      </div>
    </header>
  )
}

/* ------------------------------------------------ */
/* Loading */
/* ------------------------------------------------ */

function LoadingState() {
  return (
    <div
      style={{
        ...infoBox,
        textAlign: 'center',
        padding: 45,
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          margin: '0 auto 16px',
          borderRadius: '50%',
          border: `3px solid ${colors.line}`,
          borderTopColor: colors.teal,
          animation: 'skillGapSpin 1s linear infinite',
        }}
      />

      <strong
        style={{
          display: 'block',
          fontSize: 16,
          marginBottom: 6,
        }}
      >
        Analyzing your skills
      </strong>

      <span
        style={{
          color: colors.muted,
          fontSize: 13,
        }}
      >
        Comparing your profile with the requirements for
        your target career...
      </span>

      <style>
        {`
          @keyframes skillGapSpin {
            to {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </div>
  )
}

/* ------------------------------------------------ */
/* Sections */
/* ------------------------------------------------ */

function Section({
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <section style={{ marginTop: 34 }}>
      <div style={{ marginBottom: 15 }}>
        {eyebrow && (
          <div
            style={{
              ...label,
              color: colors.teal,
              marginBottom: 5,
            }}
          >
            {eyebrow}
          </div>
        )}

        <h2
          style={{
            fontFamily: fonts.serif,
            fontSize: 25,
            margin: 0,
          }}
        >
          {title}
        </h2>

        {description && (
          <p
            style={{
              color: colors.muted,
              fontSize: 13,
              margin: '6px 0 0',
            }}
          >
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  )
}

/* ------------------------------------------------ */
/* Skill Panels */
/* ------------------------------------------------ */

function SkillPanel({
  icon,
  title,
  subtitle,
  skills,
  type,
  emptyText,
}) {
  return (
    <div
      style={{
        ...card,
        padding: 24,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 13,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 11,
            display: 'grid',
            placeItems: 'center',
            background:
              type === 'good'
                ? colors.tealSoft || colors.panel
                : colors.amberSoft || colors.panel,
            color:
              type === 'good'
                ? colors.teal
                : colors.amber,
            fontWeight: 800,
            fontSize: 17,
          }}
        >
          {icon}
        </div>

        <div>
          <h3
            style={{
              fontFamily: fonts.serif,
              fontSize: 19,
              margin: 0,
            }}
          >
            {title}
          </h3>

          <span
            style={{
              color: colors.muted,
              fontSize: 11,
            }}
          >
            {subtitle}
          </span>
        </div>
      </div>

      {skills.length ? (
        <SkillChips
          skills={skills}
          type={type}
        />
      ) : (
        <div
          style={{
            color: colors.muted,
            fontSize: 13,
            lineHeight: 1.6,
            padding: '12px 0',
          }}
        >
          {emptyText}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------ */
/* Skill Chips */
/* ------------------------------------------------ */

function SkillChips({
  skills = [],
  type,
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 9,
      }}
    >
      {skills.map((skill, index) => {
        let border = colors.line
        let color = colors.paper
        let background = 'transparent'
        let prefix = ''

        if (type === 'good') {
          border = colors.teal
          color = colors.teal
          background =
            colors.tealSoft || 'transparent'
          prefix = '✓ '
        }

        if (type === 'missing') {
          border = colors.amber
          color = colors.amber
          background =
            colors.amberSoft || 'transparent'
          prefix = '+ '
        }

        return (
          <span
            key={`${skill}-${index}`}
            style={{
              border: `1px solid ${border}`,
              color,
              background,
              borderRadius: 999,
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {prefix}
            {skill}
          </span>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------ */
/* Resources */
/* ------------------------------------------------ */

function ResourceGrid({
  items,
  buttonText,
  emptyText,
  type,
}) {
  if (!items?.length) {
    return (
      <Empty>
        {emptyText}
      </Empty>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(270px, 1fr))',
        gap: 16,
      }}
    >
      {items.map((item, index) => {
        const title =
          item.title ||
          item.course_name ||
          item.certification_name ||
          'Learning resource'

        const provider =
          item.provider || 'Provider'

        const skill =
          item.skill ||
          item.skills ||
          (type === 'course'
            ? 'COURSE'
            : 'CERTIFICATION')

        return (
          <div
            key={`${title}-${index}`}
            style={{
              ...card,
              padding: 22,
              display: 'flex',
              flexDirection: 'column',
              minHeight: 220,
              transition:
                'transform .2s ease, box-shadow .2s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              <span
                style={{
                  ...label,
                  color:
                    type === 'course'
                      ? colors.teal
                      : colors.amber,
                }}
              >
                {skill}
              </span>

              <span
                style={{
                  fontSize: 18,
                }}
              >
                {type === 'course'
                  ? '📚'
                  : '🏅'}
              </span>
            </div>

            <h3
              style={{
                fontFamily: fonts.serif,
                fontSize: 19,
                lineHeight: 1.35,
                margin: '12px 0 7px',
              }}
            >
              {title}
            </h3>

            <div
              style={{
                color: colors.muted,
                fontSize: 12,
                marginBottom: 8,
              }}
            >
              {provider}

              {item.level
                ? ` · ${item.level}`
                : ''}
            </div>

            {item.description && (
              <p
                style={{
                  color: colors.muted,
                  fontSize: 13,
                  lineHeight: 1.6,
                  marginTop: 5,
                  flex: 1,
                }}
              >
                {item.description}
              </p>
            )}

            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  marginTop: 14,
                  color: colors.teal,
                  fontFamily: fonts.mono,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {buttonText}
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------ */
/* Mini Stat */
/* ------------------------------------------------ */

function MiniStat({
  number,
  text,
  tone,
}) {
  const color =
    tone === 'teal'
      ? colors.teal
      : tone === 'amber'
        ? colors.amber
        : colors.paper

  return (
    <div
      style={{
        padding: '12px 10px',
        borderRadius: 11,
        background: colors.surface || colors.panel,
        border: `1px solid ${colors.line}`,
        textAlign: 'center',
      }}
    >
      <strong
        style={{
          display: 'block',
          fontFamily: fonts.serif,
          fontSize: 22,
          color,
        }}
      >
        {number}
      </strong>

      <span
        style={{
          display: 'block',
          marginTop: 3,
          color: colors.muted,
          fontSize: 10,
        }}
      >
        {text}
      </span>
    </div>
  )
}

/* ------------------------------------------------ */
/* Empty */
/* ------------------------------------------------ */

function Empty({ children }) {
  return (
    <div
      style={{
        ...card,
        color: colors.muted,
        fontSize: 13,
        lineHeight: 1.6,
      }}
    >
      {children}
    </div>
  )
}

/* ------------------------------------------------ */
/* Shared Styles */
/* ------------------------------------------------ */

const card = {
  background: colors.panel,
  border: `1px solid ${colors.line}`,
  borderRadius: 17,
  padding: 24,
}

const infoBox = {
  background: colors.panel,
  border: `1px solid ${colors.line}`,
  borderRadius: 17,
  padding: 24,
  color: colors.muted,
}

const label = {
  fontFamily: fonts.mono,
  fontSize: 9,
  color: colors.muted,
  letterSpacing: 1,
  textTransform: 'uppercase',
}

const secondaryButton = {
  background: 'transparent',
  border: `1px solid ${colors.line}`,
  color: colors.paper,
  borderRadius: 9,
  padding: '9px 14px',
  cursor: 'pointer',
  fontWeight: 600,
}