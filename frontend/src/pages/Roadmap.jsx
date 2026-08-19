import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import client from '../api/client'
import { colors, fonts, page, btnPrimary } from '../styles/theme'

export default function Roadmap() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const career = params.get('career')

  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!career) {
      setError('No career was selected.')
      setLoading(false)
      return
    }

    loadRoadmap()
  }, [career])

  async function loadRoadmap() {
    try {
      setLoading(true)
      setError('')

      const response = await client.get(
        `/api/roadmap?career=${encodeURIComponent(career)}`
      )

      console.log('ROADMAP API RESPONSE:',JSON.stringify(response.data, null, 2)
    )
      setRoadmap(response.data)
    } catch (err) {
      console.error('Roadmap error:', err)

      const detail = err?.response?.data?.detail

      if (Array.isArray(detail)) {
        setError(
          detail
            .map((item) => item?.msg)
            .filter(Boolean)
            .join(', ') || 'Invalid roadmap request.'
        )
      } else if (typeof detail === 'string') {
        setError(detail)
      } else {
        setError(
          err?.message ||
            'Could not load the career roadmap.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={page}>
      <header style={header}>
        <button
          onClick={() => navigate('/dashboard')}
          style={secondaryButton}
        >
          ← Dashboard
        </button>

        <div>
          <div style={eyebrow}>CAREER PATHWAY</div>
          <h1 style={headerTitle}>Roadmap</h1>
        </div>

        <div style={{ width: 90 }} />
      </header>

      <main style={main}>
        <section style={intro}>
          <div>
            <div style={eyebrow}>YOUR TARGET CAREER</div>

            <h1 style={careerTitle}>
              {career || 'Career Roadmap'}
            </h1>

            <p style={introText}>
              A structured path from foundational knowledge to
              practical experience and job readiness.
            </p>
          </div>

          {!loading && roadmap && (
            <div style={stageCount}>
              <strong>
                {getStages(roadmap).length}
              </strong>
              <span>learning stages</span>
            </div>
          )}
        </section>

        {loading && (
          <div style={infoBox}>
            Building your learning path...
          </div>
        )}

        {!loading && error && (
          <div style={errorBox}>
            <strong>Unable to load roadmap</strong>

            <p>{error}</p>

            <button
              onClick={loadRoadmap}
              style={btnPrimary}
            >
              Try again →
            </button>
          </div>
        )}

        {!loading && !error && roadmap && (
          <RoadmapContent roadmap={roadmap} />
        )}
      </main>
    </div>
  )
}

function getStages(roadmap) {
  return (
    roadmap.stages ||
    roadmap.roadmap ||
    roadmap.steps ||
    roadmap.phases ||
    []
  )
}

function RoadmapContent({ roadmap }) {
  const stages = getStages(roadmap)

  if (!Array.isArray(stages) || stages.length === 0) {
    return (
      <div style={infoBox}>
        <strong>
          Roadmap data was found, but no learning stages
          are available yet.
        </strong>

        <p>
          Add roadmap stages for this career to your
          <code> roadmaps.json</code>.
        </p>
      </div>
    )
  }

  return (
    <div style={timeline}>
      {stages.map((stage, index) => (
        <RoadmapStage
          key={index}
          stage={stage}
          index={index}
          total={stages.length}
        />
      ))}
    </div>
  )
}

function RoadmapStage({ stage, index, total }) {
  const title =
    stage.title ||
    stage.name ||
    stage.phase ||
    `Stage ${index + 1}`

  const description =
    stage.description ||
    stage.goal ||
    stage.summary ||
    ''

  const skills =
    stage.skills ||
    stage.topics ||
    stage.learn ||
    []

  const projects =
    stage.projects ||
    stage.project_ideas ||
    []

  const resources =
    stage.resources ||
    stage.courses ||
    []

  return (
    <section style={stageWrapper}>
      <div style={markerColumn}>
        <div style={marker}>
          {index + 1}
        </div>

        {index < total - 1 && (
          <div style={connector} />
        )}
      </div>

      <article style={stageCard}>
        <div style={stageTop}>
          <div>
            <div style={stageLabel}>
              STAGE {String(index + 1).padStart(2, '0')}
            </div>

            <h2 style={stageTitle}>
              {title}
            </h2>
          </div>

          <div style={statusBadge}>
            {index === 0
              ? 'START HERE'
              : index === total - 1
                ? 'FINAL STAGE'
                : 'UP NEXT'}
          </div>
        </div>

        {description && (
          <p style={descriptionStyle}>
            {description}
          </p>
        )}

        <div style={contentGrid}>
          {skills.length > 0 && (
            <RoadmapBlock
              icon="◇"
              title="Learn"
              items={skills}
            />
          )}

          {projects.length > 0 && (
            <RoadmapBlock
              icon="◆"
              title="Practice"
              items={projects}
            />
          )}

          {resources.length > 0 && (
            <RoadmapBlock
              icon="↗"
              title="Resources"
              items={resources}
            />
          )}
        </div>
      </article>
    </section>
  )
}

function RoadmapBlock({ icon, title, items }) {
  return (
    <div style={roadmapBlock}>
      <div style={blockHeader}>
        <span style={blockIcon}>{icon}</span>
        <span>{title}</span>
      </div>

      <div style={itemList}>
        {items.map((item, index) => {
          const text =
            typeof item === 'string'
              ? item
              : item.title ||
                item.name ||
                item.skill ||
                item.topic ||
                JSON.stringify(item)

          return (
            <div key={index} style={itemRow}>
              <span style={itemDot}>•</span>
              <span>{text}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const header = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 20,
  padding: '18px 32px',
  borderBottom: `1px solid ${colors.line}`,
  background: colors.panel,
}

const headerTitle = {
  fontFamily: fonts.serif,
  fontSize: 21,
  margin: '3px 0 0',
}

const eyebrow = {
  fontFamily: fonts.mono,
  fontSize: 10,
  color: colors.teal,
  letterSpacing: 1.1,
}

const main = {
  maxWidth: 1080,
  width: '100%',
  margin: '0 auto',
  padding: '42px 24px 80px',
}

const intro = {
  display: 'flex',
  alignItems: 'end',
  justifyContent: 'space-between',
  gap: 30,
  marginBottom: 38,
}

const careerTitle = {
  fontFamily: fonts.serif,
  fontSize: 'clamp(34px, 5vw, 48px)',
  margin: '8px 0 10px',
  color: colors.amber,
}

const introText = {
  color: colors.muted,
  lineHeight: 1.7,
  maxWidth: 680,
  margin: 0,
}

const stageCount = {
  minWidth: 130,
  padding: 16,
  border: `1px solid ${colors.line}`,
  borderRadius: 14,
  background: colors.panel,
  textAlign: 'center',
}

const timeline = {
  position: 'relative',
}

const stageWrapper = {
  display: 'grid',
  gridTemplateColumns: '54px minmax(0, 1fr)',
  gap: 16,
  position: 'relative',
  marginBottom: 18,
}

const markerColumn = {
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
}

const marker = {
  width: 40,
  height: 40,
  borderRadius: 13,
  background: colors.amber,
  color: colors.ink,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: fonts.mono,
  fontSize: 12,
  fontWeight: 600,
  zIndex: 2,
}

const connector = {
  position: 'absolute',
  top: 40,
  bottom: -18,
  width: 2,
  background: colors.line,
}

const stageCard = {
  background: colors.panel,
  border: `1px solid ${colors.line}`,
  borderRadius: 18,
  padding: '23px 25px',
  boxShadow: '0 8px 28px rgba(0,0,0,.05)',
}

const stageTop = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'start',
  gap: 15,
}

const stageLabel = {
  fontFamily: fonts.mono,
  color: colors.muted,
  fontSize: 9,
  letterSpacing: 1,
}

const stageTitle = {
  fontFamily: fonts.serif,
  fontSize: 25,
  margin: '6px 0 0',
}

const statusBadge = {
  background: colors.primarySoft || colors.line,
  color: colors.teal,
  borderRadius: 99,
  padding: '6px 9px',
  fontFamily: fonts.mono,
  fontSize: 8,
  whiteSpace: 'nowrap',
}

const descriptionStyle = {
  color: colors.muted,
  lineHeight: 1.7,
  fontSize: 13,
  marginBottom: 20,
}

const contentGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
  gap: 10,
}

const roadmapBlock = {
  background: colors.primarySoft || colors.line,
  borderRadius: 12,
  padding: 14,
}

const blockHeader = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: fonts.mono,
  fontSize: 10,
  color: colors.teal,
  textTransform: 'uppercase',
  letterSpacing: .7,
  marginBottom: 10,
}

const blockIcon = {
  color: colors.amber,
  fontSize: 13,
}

const itemList = {
  display: 'grid',
  gap: 7,
}

const itemRow = {
  display: 'flex',
  gap: 8,
  color: colors.paper,
  fontSize: 12,
  lineHeight: 1.5,
}

const itemDot = {
  color: colors.teal,
}

const secondaryButton = {
  background: 'transparent',
  border: `1px solid ${colors.line}`,
  color: colors.paper,
  borderRadius: 9,
  padding: '9px 14px',
  cursor: 'pointer',
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
}