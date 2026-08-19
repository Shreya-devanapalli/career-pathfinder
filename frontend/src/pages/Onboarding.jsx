import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import client from '../api/client'
import { colors, fonts, page, btnPrimary } from '../styles/theme'

/* =========================================================
   BRANCH → INTERESTS
   ========================================================= */

const BRANCH_INTERESTS = {
  'computer science': [
    'AI / Machine Learning',
    'Data Analytics',
    'Web Development',
    'Software Development',
    'Cloud / DevOps',
    'Cybersecurity',
    'Databases',
    'Business Analytics',
  ],

  'information technology': [
    'Software Development',
    'Web Development',
    'Cloud / DevOps',
    'Cybersecurity',
    'Databases',
    'Data Analytics',
    'Business Analytics',
  ],

  'data science': [
    'AI / Machine Learning',
    'Data Analytics',
    'Business Analytics',
    'Databases',
    'Software Development',
  ],

  'artificial intelligence': [
    'AI / Machine Learning',
    'Data Analytics',
    'Software Development',
    'Computer Vision',
    'Robotics',
  ],

  'mechanical engineering': [
    'Mechanical Design',
    'Automotive',
    'Manufacturing',
    'Thermodynamics',
    'Robotics',
    'Mechatronics',
    'CAD / CAE',
  ],

  'civil engineering': [
    'Structural Engineering',
    'Construction',
    'Transportation',
    'Geotechnical Engineering',
    'Environmental Engineering',
    'Urban Planning',
    'Surveying',
  ],

  'electrical and electronics engineering': [
    'Power Systems',
    'Electrical Design',
    'Electronics',
    'Control Systems',
    'Renewable Energy',
    'Embedded Systems',
    'Automation',
  ],

  'electrical engineering': [
    'Power Systems',
    'Electrical Design',
    'Electronics',
    'Control Systems',
    'Renewable Energy',
    'Embedded Systems',
    'Automation',
  ],

  'electronics and communication engineering': [
    'Embedded Systems',
    'Electronics',
    'Communication Systems',
    'VLSI',
    'IoT',
    'Signal Processing',
    'Robotics',
  ],

  'electronics engineering': [
    'Embedded Systems',
    'Electronics',
    'Communication Systems',
    'VLSI',
    'IoT',
    'Automation',
  ],

  'chemical engineering': [
    'Process Engineering',
    'Chemical Manufacturing',
    'Petrochemicals',
    'Pharmaceuticals',
    'Energy',
    'Environmental Engineering',
  ],

  biotechnology: [
    'Biotechnology',
    'Bioinformatics',
    'Pharmaceuticals',
    'Genetics',
    'Microbiology',
    'Research',
  ],

  'information science': [
    'Software Development',
    'Web Development',
    'Data Analytics',
    'Databases',
    'Cloud / DevOps',
    'Cybersecurity',
  ],

  'aerospace engineering': [
    'Aerospace Design',
    'Aerodynamics',
    'Propulsion',
    'Avionics',
    'Robotics',
    'Manufacturing',
  ],
}

const DEFAULT_INTERESTS = [
  'AI / Machine Learning',
  'Data Analytics',
  'Web Development',
  'Software Development',
  'Cloud / DevOps',
  'Cybersecurity',
  'Databases',
  'Business Analytics',
]

/* =========================================================
   INTEREST → SKILLS
   ========================================================= */

const SKILLS = {
  'AI / Machine Learning': [
    'Python',
    'Machine Learning',
    'Deep Learning',
    'NLP',
    'Computer Vision',
    'TensorFlow',
    'PyTorch',
  ],

  'Data Analytics': [
    'Python',
    'SQL',
    'Statistics',
    'Excel',
    'Pandas',
    'NumPy',
    'Power BI',
    'Tableau',
    'Data Visualization',
  ],

  'Web Development': [
    'HTML',
    'CSS',
    'JavaScript',
    'React',
    'Node.js',
    'FastAPI',
    'SQL',
    'MongoDB',
    'PostgreSQL',
  ],

  'Software Development': [
    'Python',
    'Java',
    'C++',
    'Data Structures',
    'Algorithms',
    'OOP',
    'Git',
    'SQL',
  ],

  'Cloud / DevOps': [
    'Linux',
    'Git',
    'Cloud Computing',
    'AWS',
    'Azure',
    'Google Cloud',
    'Docker',
    'Kubernetes',
    'Terraform',
    'CI/CD',
  ],

  Cybersecurity: [
    'Networking',
    'Linux',
    'Cybersecurity',
    'Python',
    'Ethical Hacking',
    'Cryptography',
    'SIEM',
  ],

  Databases: [
    'SQL',
    'PostgreSQL',
    'MySQL',
    'MongoDB',
    'Database Management',
    'Database Security',
  ],

  'Business Analytics': [
    'Excel',
    'SQL',
    'Statistics',
    'Power BI',
    'Tableau',
    'Data Analysis',
    'Data Visualization',
    'Business Strategy',
  ],

  'Computer Vision': [
    'Python',
    'OpenCV',
    'Computer Vision',
    'Deep Learning',
    'TensorFlow',
    'PyTorch',
    'Image Processing',
  ],

  'Mechanical Design': [
    'CAD',
    'SolidWorks',
    'AutoCAD',
    'Mechanical Design',
    '3D Modeling',
    'Engineering Drawing',
    'GD&T',
  ],

  Automotive: [
    'CAD',
    'Automotive Engineering',
    'Thermodynamics',
    'Fluid Mechanics',
    'Vehicle Dynamics',
    'Manufacturing',
  ],

  Manufacturing: [
    'CAD',
    'SolidWorks',
    'Manufacturing Processes',
    'CNC',
    'Production Planning',
    'Quality Control',
    'Lean Manufacturing',
  ],

  Thermodynamics: [
    'Thermodynamics',
    'Heat Transfer',
    'Fluid Mechanics',
    'HVAC',
    'Energy Systems',
  ],

  Robotics: [
    'Robotics',
    'Python',
    'C++',
    'Control Systems',
    'Sensors',
    'Automation',
    'Computer Vision',
  ],

  Mechatronics: [
    'Mechatronics',
    'Robotics',
    'Control Systems',
    'PLC',
    'Sensors',
    'Automation',
    'Embedded Systems',
  ],

  'CAD / CAE': [
    'CAD',
    'SolidWorks',
    'AutoCAD',
    'ANSYS',
    '3D Modeling',
    'Finite Element Analysis',
  ],

  'Structural Engineering': [
    'Structural Analysis',
    'AutoCAD',
    'STAAD Pro',
    'ETABS',
    'Revit',
    'Structural Design',
    'Concrete Design',
  ],

  Construction: [
    'Construction Management',
    'Project Management',
    'AutoCAD',
    'Quantity Surveying',
    'Estimation',
    'Building Materials',
    'Site Management',
  ],

  Transportation: [
    'Transportation Engineering',
    'Highway Design',
    'Traffic Engineering',
    'AutoCAD',
    'GIS',
    'Road Safety',
  ],

  'Geotechnical Engineering': [
    'Soil Mechanics',
    'Foundation Engineering',
    'Geotechnical Analysis',
    'Site Investigation',
    'GeoStudio',
    'Civil 3D',
  ],

  'Environmental Engineering': [
    'Environmental Engineering',
    'Water Treatment',
    'Waste Management',
    'Air Pollution Control',
    'Environmental Impact Assessment',
  ],

  'Urban Planning': [
    'Urban Planning',
    'GIS',
    'AutoCAD',
    'City Planning',
    'Land Use Planning',
    'Transportation Planning',
  ],

  Surveying: [
    'Land Surveying',
    'Total Station',
    'AutoCAD',
    'GIS',
    'GPS',
    'Civil 3D',
  ],

  'Power Systems': [
    'Power Systems',
    'Electrical Machines',
    'Power Electronics',
    'Electrical Protection',
    'MATLAB',
    'ETAP',
  ],

  'Electrical Design': [
    'Electrical Design',
    'AutoCAD Electrical',
    'Electrical Machines',
    'Circuit Design',
    'MATLAB',
    'Power Systems',
  ],

  Electronics: [
    'Circuit Design',
    'Digital Electronics',
    'Analog Electronics',
    'PCB Design',
    'Microcontrollers',
    'Embedded Systems',
  ],

  'Control Systems': [
    'Control Systems',
    'MATLAB',
    'Simulink',
    'Automation',
    'PLC',
    'Instrumentation',
  ],

  'Renewable Energy': [
    'Solar Energy',
    'Wind Energy',
    'Power Electronics',
    'Energy Systems',
    'Electrical Machines',
    'Power Systems',
  ],

  'Embedded Systems': [
    'C',
    'C++',
    'Microcontrollers',
    'Arduino',
    'Raspberry Pi',
    'Embedded C',
    'RTOS',
  ],

  Automation: [
    'PLC',
    'SCADA',
    'Industrial Automation',
    'Control Systems',
    'Robotics',
    'Sensors',
  ],

  'Communication Systems': [
    'Digital Communication',
    'Wireless Communication',
    'Signal Processing',
    'Networking',
    'RF Engineering',
    'MATLAB',
  ],

  VLSI: [
    'Digital Electronics',
    'Verilog',
    'VHDL',
    'CMOS',
    'ASIC Design',
    'FPGA',
    'RTL Design',
  ],

  IoT: [
    'IoT',
    'Arduino',
    'Raspberry Pi',
    'Sensors',
    'Python',
    'Embedded Systems',
    'MQTT',
  ],

  'Signal Processing': [
    'Digital Signal Processing',
    'MATLAB',
    'Python',
    'Signal Processing',
    'Fourier Transform',
    'Image Processing',
  ],

  'Process Engineering': [
    'Process Design',
    'Process Control',
    'Chemical Process Simulation',
    'Aspen Plus',
    'Thermodynamics',
    'Heat Transfer',
  ],

  'Chemical Manufacturing': [
    'Chemical Processes',
    'Process Control',
    'Quality Control',
    'Production Planning',
    'Industrial Safety',
  ],

  Petrochemicals: [
    'Petroleum Engineering',
    'Process Engineering',
    'Refinery Operations',
    'Process Safety',
    'Thermodynamics',
  ],

  Pharmaceuticals: [
    'Pharmaceutical Manufacturing',
    'Bioprocessing',
    'Quality Control',
    'Process Validation',
    'Laboratory Research',
  ],

  Energy: [
    'Energy Systems',
    'Thermodynamics',
    'Renewable Energy',
    'Process Engineering',
    'Energy Management',
  ],

  Biotechnology: [
    'Biotechnology',
    'Cell Biology',
    'Molecular Biology',
    'Bioprocessing',
    'Laboratory Techniques',
    'Research',
  ],

  Bioinformatics: [
    'Python',
    'R',
    'Bioinformatics',
    'Genomics',
    'Data Analysis',
    'Biostatistics',
  ],

  Genetics: [
    'Genetics',
    'Molecular Biology',
    'Genomics',
    'DNA Sequencing',
    'Bioinformatics',
  ],

  Microbiology: [
    'Microbiology',
    'Cell Culture',
    'Molecular Biology',
    'Laboratory Techniques',
    'Biotechnology',
  ],

  Research: [
    'Research Methods',
    'Data Analysis',
    'Scientific Writing',
    'Laboratory Techniques',
    'Statistics',
  ],

  'Aerospace Design': [
    'Aerospace Design',
    'CAD',
    'CATIA',
    'SolidWorks',
    'Aircraft Design',
    'Engineering Drawing',
  ],

  Aerodynamics: [
    'Aerodynamics',
    'Fluid Mechanics',
    'CFD',
    'MATLAB',
    'ANSYS',
    'Aircraft Design',
  ],

  Propulsion: [
    'Propulsion Systems',
    'Thermodynamics',
    'Fluid Mechanics',
    'Gas Turbines',
    'Combustion',
  ],

  Avionics: [
    'Avionics',
    'Embedded Systems',
    'Control Systems',
    'Electronics',
    'Communication Systems',
  ],
}

/* =========================================================
   BRANCH → WORK PREFERENCES
   ========================================================= */

const BRANCH_WORK_PREFERENCES = {
  'computer science': [
    'Building AI / ML systems',
    'Analyzing data and finding insights',
    'Building web applications',
    'Building backend systems',
    'Working with cloud infrastructure',
    'Cybersecurity and security',
    'Software engineering',
    'Research and experimentation',
  ],

  'information technology': [
    'Building web applications',
    'Building backend systems',
    'Working with cloud infrastructure',
    'Cybersecurity and security',
    'Database systems',
    'Software engineering',
    'IT infrastructure',
  ],

  'data science': [
    'Analyzing data and finding insights',
    'Building AI / ML systems',
    'Building dashboards and reports',
    'Statistical analysis',
    'Machine learning',
    'Research and experimentation',
  ],

  'artificial intelligence': [
    'Building AI / ML systems',
    'Machine learning',
    'Computer vision',
    'Natural language processing',
    'Robotics and intelligent systems',
    'Research and experimentation',
  ],

  'mechanical engineering': [
    'Mechanical design and CAD',
    'Automotive engineering',
    'Manufacturing and production',
    'Robotics and automation',
    'Thermal and energy systems',
    'Product design',
    'Research and experimentation',
  ],

  'civil engineering': [
    'Structural design',
    'Construction management',
    'Transportation engineering',
    'Geotechnical engineering',
    'Environmental engineering',
    'Urban planning',
    'Surveying and infrastructure',
  ],

  'electrical engineering': [
    'Power systems',
    'Electrical design',
    'Control systems',
    'Renewable energy',
    'Automation',
    'Embedded systems',
    'Electrical infrastructure',
  ],

  'electronics and communication engineering': [
    'Embedded systems',
    'Electronics design',
    'Communication systems',
    'VLSI design',
    'IoT systems',
    'Signal processing',
    'Robotics and automation',
  ],

  'electronics engineering': [
    'Embedded systems',
    'Electronics design',
    'Communication systems',
    'VLSI design',
    'IoT systems',
    'Automation',
    'Robotics',
  ],

  'chemical engineering': [
    'Process engineering',
    'Chemical manufacturing',
    'Petrochemical systems',
    'Pharmaceutical processes',
    'Energy systems',
    'Environmental engineering',
    'Research and experimentation',
  ],

  biotechnology: [
    'Biotechnology research',
    'Bioinformatics',
    'Pharmaceutical research',
    'Genetic engineering',
    'Microbiology',
    'Laboratory research',
    'Research and experimentation',
  ],

  'information science': [
    'Building web applications',
    'Building backend systems',
    'Analyzing data and finding insights',
    'Database systems',
    'Working with cloud infrastructure',
    'Cybersecurity and security',
    'Software engineering',
  ],

  'aerospace engineering': [
    'Aerospace design',
    'Aerodynamics',
    'Propulsion systems',
    'Avionics',
    'Robotics and automation',
    'Aircraft manufacturing',
    'Research and experimentation',
  ],
}

const DEFAULT_WORK_PREFERENCES = [
  'Building AI / ML systems',
  'Analyzing data and finding insights',
  'Building web applications',
  'Building backend systems',
  'Working with cloud infrastructure',
  'Cybersecurity and security',
  'Building dashboards and reports',
  'Software engineering',
  'Research and experimentation',
]

/* =========================================================
   OTHER OPTIONS
   ========================================================= */

const PROFICIENCY = [
  {
    value: 'Beginner',
    description: 'I know the basics and can do simple tasks.',
  },
  {
    value: 'Intermediate',
    description: 'I can build projects and solve problems independently.',
  },
  {
    value: 'Advanced',
    description: 'I am confident using this skill in complex projects.',
  },
]

const EXPERIENCE = [
  'Only coursework / learning',
  'Academic projects',
  'Personal projects',
  'Hackathons',
  'Internship experience',
  'Real-world / professional experience',
]

const GOALS = [
  'Internship',
  'Placement / full-time job',
  'Higher studies',
  'Explore career options',
  'Build project skills',
  'Switch to a new domain',
]

const TIMELINES = [
  'Within 3 months',
  'Within 6 months',
  'Within 1 year',
  'No specific timeline',
]

/* =========================================================
   COMPONENT
   ========================================================= */

export default function Onboarding() {
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    branch: '',
    graduation_year: '2027',

    interests: [],

    skills: [],
    proficiency: {},

    experience: [],

    work_preferences: [],

    goal: '',
    timeline: '',
  })

  const totalSteps = 7

  /* =======================================================
     BRANCH NORMALIZATION
     ======================================================= */

  function getBranchKey(branchValue) {
    const branch = branchValue.trim().toLowerCase()

    if (!branch) {
      return null
    }

    if (BRANCH_INTERESTS[branch]) {
      return branch
    }

    const matchedBranch = Object.keys(BRANCH_INTERESTS).find(
      (key) => branch.includes(key) || key.includes(branch)
    )

    if (matchedBranch) {
      return matchedBranch
    }

    if (branch.includes('cse') || branch.includes('computer')) {
      return 'computer science'
    }

    if (
      branch.includes('data science') ||
      branch.includes('data analytics')
    ) {
      return 'data science'
    }

    if (
      branch.includes('artificial intelligence') ||
      branch.includes('ai engineering')
    ) {
      return 'artificial intelligence'
    }

    if (branch.includes('mech')) {
      return 'mechanical engineering'
    }

    if (branch.includes('civil')) {
      return 'civil engineering'
    }

    if (branch.includes('ece')) {
      return 'electronics and communication engineering'
    }

    if (
      branch.includes('eee') ||
      branch.includes('electrical')
    ) {
      return 'electrical engineering'
    }

    if (
      branch === 'it' ||
      branch.includes('information technology')
    ) {
      return 'information technology'
    }

    if (branch.includes('information science')) {
      return 'information science'
    }

    if (branch.includes('chemical')) {
      return 'chemical engineering'
    }

    if (
      branch.includes('biotech') ||
      branch.includes('biotechnology')
    ) {
      return 'biotechnology'
    }

    if (branch.includes('aerospace')) {
      return 'aerospace engineering'
    }

    return null
  }

  /* =======================================================
     UPDATE FORM
     ======================================================= */

  function update(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function updateBranch(value) {
    const previousBranchKey = getBranchKey(form.branch)
    const newBranchKey = getBranchKey(value)

    if (
      previousBranchKey &&
      newBranchKey &&
      previousBranchKey !== newBranchKey
    ) {
      setForm((prev) => ({
        ...prev,
        branch: value,
        interests: [],
        skills: [],
        proficiency: {},
        work_preferences: [],
      }))

      return
    }

    setForm((prev) => ({
      ...prev,
      branch: value,
    }))
  }

  function toggleArray(field, value) {
    setForm((prev) => {
      const current = prev[field] || []

      return {
        ...prev,
        [field]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      }
    })
  }

  /* =======================================================
     AVAILABLE INTERESTS
     ======================================================= */

  const availableInterests = useMemo(() => {
    const branchKey = getBranchKey(form.branch)

    if (branchKey && BRANCH_INTERESTS[branchKey]) {
      return BRANCH_INTERESTS[branchKey]
    }

    return DEFAULT_INTERESTS
  }, [form.branch])

  /* =======================================================
     AVAILABLE SKILLS
     ======================================================= */

  const availableSkills = useMemo(() => {
    const result = []

    form.interests.forEach((interest) => {
      ;(SKILLS[interest] || []).forEach((skill) => {
        if (!result.includes(skill)) {
          result.push(skill)
        }
      })
    })

    return result
  }, [form.interests])

  /* =======================================================
     AVAILABLE WORK PREFERENCES
     ======================================================= */

  const availableWorkPreferences = useMemo(() => {
    const branchKey = getBranchKey(form.branch)

    if (
      branchKey &&
      BRANCH_WORK_PREFERENCES[branchKey]
    ) {
      return BRANCH_WORK_PREFERENCES[branchKey]
    }

    return DEFAULT_WORK_PREFERENCES
  }, [form.branch])

  /* =======================================================
     SKILLS
     ======================================================= */

  function toggleSkill(skill) {
    setForm((prev) => {
      const exists = prev.skills.includes(skill)

      const skills = exists
        ? prev.skills.filter((item) => item !== skill)
        : [...prev.skills, skill]

      const proficiency = { ...prev.proficiency }

      if (exists) {
        delete proficiency[skill]
      }

      return {
        ...prev,
        skills,
        proficiency,
      }
    })
  }

  function setProficiency(skill, level) {
    setForm((prev) => ({
      ...prev,
      proficiency: {
        ...prev.proficiency,
        [skill]: level,
      },
    }))
  }

  /* =======================================================
     VALIDATION
     ======================================================= */

  function canContinue() {
    if (step === 1) {
      return form.branch.trim() !== ''
    }

    if (step === 2) {
      return form.interests.length > 0
    }

    if (step === 3) {
      return form.skills.length > 0
    }

    if (step === 4) {
      return form.skills.every(
        (skill) => form.proficiency[skill]
      )
    }

    if (step === 5) {
      return form.experience.length > 0
    }

    if (step === 6) {
      return form.work_preferences.length > 0
    }

    if (step === 7) {
      return Boolean(form.goal && form.timeline)
    }

    return true
  }

  /* =======================================================
     NEXT
     ======================================================= */

  async function next() {
    setError('')

    if (loading) {
      return
    }

    if (!canContinue()) {
      setError(
        'Please complete this step before continuing.'
      )
      return
    }

    if (step < totalSteps) {
      setStep((value) => value + 1)
      return
    }

    await submitAssessment()
  }

  /* =======================================================
     BACK
     ======================================================= */

  function back() {
    setError('')

    if (loading) {
      return
    }

    if (step > 1) {
      setStep((value) => value - 1)
    }
  }

  /* =======================================================
     SUBMIT
     ======================================================= */

  async function submitAssessment() {
    setLoading(true)
    setError('')

    const payload = {
      branch: form.branch.trim(),
      graduation_year: Number(form.graduation_year),

      interests: form.interests,

      skills: form.skills,

      skill_proficiency: form.proficiency,

      experience: form.experience,

      work_preferences: form.work_preferences,

      career_goal: form.goal,

      job_ready_timeline: form.timeline,
    }

    try {
      const response = await client.post(
        '/api/recommend',
        payload
      )

      navigate('/dashboard')
    } catch (err) {
      const status = err?.response?.status
      const detail = err?.response?.data?.detail

      if (Array.isArray(detail)) {
        const messages = detail.map((item) => {
          const location = Array.isArray(item?.loc)
            ? item.loc.join(' → ')
            : 'field'

          return `${location}: ${
            item?.msg || 'Invalid value'
          }`
        })

        setError(
          `API Error ${status || ''}: ${messages.join(
            ' | '
          )}`
        )
      } else if (typeof detail === 'string') {
        setError(
          `API Error ${status || ''}: ${detail}`
        )
      } else if (status === 404) {
        setError(
          'API endpoint not found (404). Check that your backend has POST /api/recommend.'
        )
      } else if (status === 422) {
        setError(
          'The backend rejected the assessment data (422). Check the API request fields.'
        )
      } else if (status === 500) {
        setError(
          'The backend returned an internal error (500). Check the FastAPI terminal for the actual error.'
        )
      } else if (!err?.response) {
        setError(
          `Could not connect to the backend. ${
            err?.message || 'Network error'
          }`
        )
      } else {
        setError(
          `API request failed${
            status ? ` (${status})` : ''
          }. ${
            err?.message ||
            'Please check the backend.'
          }`
        )
      }
    } finally {
      setLoading(false)
    }
  }

  /* =======================================================
     UI
     ======================================================= */

  return (
    <div style={page}>
      <header
        style={{
          padding: '24px 32px',
          borderBottom: `1px solid ${colors.line}`,
        }}
      >
        <div
          style={{
            fontFamily: fonts.serif,
            fontSize: 23,
          }}
        >
          Career Pathfinder
        </div>

        <div
          style={{
            color: colors.muted,
            fontFamily: fonts.mono,
            fontSize: 11,
            marginTop: 5,
          }}
        >
          CAREER ASSESSMENT
        </div>
      </header>

      <main
        style={{
          maxWidth: 850,
          margin: '0 auto',
          padding: '42px 24px 60px',
        }}
      >
        {/* PROGRESS */}

        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: colors.muted,
              fontFamily: fonts.mono,
              fontSize: 11,
            }}
          >
            <span>
              STEP {step} OF {totalSteps}
            </span>

            <span>
              {Math.round(
                (step / totalSteps) * 100
              )}
              %
            </span>
          </div>

          <div
            style={{
              height: 5,
              background: colors.line,
              borderRadius: 99,
              marginTop: 10,
            }}
          >
            <div
              style={{
                width: `${
                  (step / totalSteps) * 100
                }%`,
                height: '100%',
                background: colors.teal,
                borderRadius: 99,
                transition: 'width 0.25s ease',
              }}
            />
          </div>
        </div>

        {/* =================================================
            STEP 1
        ================================================= */}

        {step === 1 && (
          <Step
            eyebrow="01 · BACKGROUND"
            title="Tell us about your academic background."
            description="This helps us personalize interests, skills, and career options for your educational path."
          >
            <FieldLabel>
              Branch / specialization
            </FieldLabel>

            <input
              value={form.branch}
              onChange={(e) =>
                updateBranch(e.target.value)
              }
              placeholder="e.g. Computer Science / Mechanical Engineering"
              style={inputStyle}
            />

            <FieldLabel>
              Graduation year
            </FieldLabel>

            <select
              value={form.graduation_year}
              onChange={(e) =>
                update(
                  'graduation_year',
                  e.target.value
                )
              }
              style={inputStyle}
            >
              <option value="2026">2026</option>
              <option value="2027">2027</option>
              <option value="2028">2028</option>
              <option value="2029">2029</option>
              <option value="2030">2030</option>
            </select>
          </Step>
        )}

        {/* =================================================
            STEP 2
        ================================================= */}

        {step === 2 && (
          <Step
            eyebrow="02 · INTERESTS"
            title="Which areas genuinely interest you?"
            description="These interests are personalized according to your academic branch."
          >
            <ChoiceGrid
              items={availableInterests}
              selected={form.interests}
              onClick={(item) =>
                toggleArray('interests', item)
              }
            />
          </Step>
        )}

        {/* =================================================
            STEP 3
        ================================================= */}

        {step === 3 && (
          <Step
            eyebrow="03 · SKILLS"
            title="Which skills have you actually worked with?"
            description="The skills below are selected based on your academic branch and interests."
          >
            <div
              style={{
                color: colors.teal,
                fontSize: 13,
                marginBottom: 18,
              }}
            >
              {availableSkills.length} relevant skills
              found
            </div>

            {availableSkills.length === 0 ? (
              <div
                style={{
                  padding: 18,
                  borderRadius: 12,
                  background: colors.panel,
                  border: `1px solid ${colors.line}`,
                  color: colors.muted,
                }}
              >
                No skills are available for the
                selected interests yet.
              </div>
            ) : (
              <ChoiceGrid
                items={availableSkills}
                selected={form.skills}
                onClick={toggleSkill}
              />
            )}
          </Step>
        )}

        {/* =================================================
            STEP 4
        ================================================= */}

        {step === 4 && (
          <Step
            eyebrow="04 · PROFICIENCY"
            title="How strong are you in these skills?"
            description="Be honest. Your proficiency affects your career match."
          >
            {form.skills.map((skill) => (
              <div
                key={skill}
                style={{
                  background: colors.panel,
                  border: `1px solid ${colors.line}`,
                  borderRadius: 14,
                  padding: 18,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    fontFamily: fonts.serif,
                    fontSize: 19,
                    marginBottom: 14,
                  }}
                >
                  {skill}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      'repeat(3, 1fr)',
                    gap: 8,
                  }}
                >
                  {PROFICIENCY.map((level) => (
                    <button
                      type="button"
                      key={level.value}
                      onClick={() =>
                        setProficiency(
                          skill,
                          level.value
                        )
                      }
                      style={{
                        ...choiceStyle,
                        borderColor:
                          form.proficiency[skill] ===
                          level.value
                            ? colors.teal
                            : colors.line,
                        color:
                          form.proficiency[skill] ===
                          level.value
                            ? colors.teal
                            : colors.paper,
                      }}
                    >
                      <strong>
                        {level.value}
                      </strong>

                      <small
                        style={{
                          display: 'block',
                          marginTop: 5,
                          color: colors.muted,
                          lineHeight: 1.3,
                        }}
                      >
                        {level.description}
                      </small>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </Step>
        )}

        {/* =================================================
            STEP 5
        ================================================= */}

        {step === 5 && (
          <Step
            eyebrow="05 · EXPERIENCE"
            title="Where have you applied your skills?"
            description="Select everything that represents your experience."
          >
            <ChoiceGrid
              items={EXPERIENCE}
              selected={form.experience}
              onClick={(item) =>
                toggleArray('experience', item)
              }
            />
          </Step>
        )}

        {/* =================================================
            STEP 6
        ================================================= */}

        {step === 6 && (
          <Step
            eyebrow="06 · WORK STYLE"
            title="What kind of work would you enjoy?"
            description="These options are personalized according to your academic branch."
          >
            <ChoiceGrid
              items={availableWorkPreferences}
              selected={form.work_preferences}
              onClick={(item) =>
                toggleArray(
                  'work_preferences',
                  item
                )
              }
            />
          </Step>
        )}

        {/* =================================================
            STEP 7
        ================================================= */}

        {step === 7 && (
          <Step
            eyebrow="07 · CAREER GOAL"
            title="What are you working toward?"
            description="This helps us prioritize careers that match your actual goal."
          >
            <FieldLabel>
              Primary goal
            </FieldLabel>

            <ChoiceGrid
              items={GOALS}
              selected={
                form.goal ? [form.goal] : []
              }
              onClick={(item) =>
                update('goal', item)
              }
            />

            <FieldLabel>
              When do you want to be job-ready?
            </FieldLabel>

            <ChoiceGrid
              items={TIMELINES}
              selected={
                form.timeline
                  ? [form.timeline]
                  : []
              }
              onClick={(item) =>
                update('timeline', item)
              }
            />
          </Step>
        )}

        {/* ERROR */}

        {error && (
          <div
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 10,
              border: `1px solid ${colors.coral}`,
              color: colors.coral,
              background: colors.panel,
              lineHeight: 1.5,
              fontSize: 13,
            }}
          >
            <strong>
              Assessment submission failed
            </strong>

            <div style={{ marginTop: 6 }}>
              {error}
            </div>
          </div>
        )}

        {/* NAVIGATION */}

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 30,
          }}
        >
          <button
            type="button"
            onClick={back}
            disabled={step === 1 || loading}
            style={{
              ...secondaryButton,
              opacity:
                step === 1 || loading
                  ? 0.4
                  : 1,
              cursor:
                step === 1 || loading
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={next}
            disabled={loading}
            style={{
              ...btnPrimary,
              opacity: loading ? 0.7 : 1,
              cursor: loading
                ? 'wait'
                : 'pointer',
            }}
          >
            {loading
              ? 'Analyzing...'
              : step === totalSteps
              ? 'Analyze my career →'
              : 'Continue →'}
          </button>
        </div>
      </main>
    </div>
  )
}

/* ======================
   STEP COMPONENT
   ======================= */

function Step({
  eyebrow,
  title,
  description,
  children,
}) {
  return (
    <>
      <div
        style={{
          marginBottom: 28,
        }}
      >
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 11,
            color: colors.teal,
            letterSpacing: 1,
          }}
        >
          {eyebrow}
        </div>

        <h1
          style={{
            fontFamily: fonts.serif,
            fontSize: 38,
            margin: '8px 0',
          }}
        >
          {title}
        </h1>

        <p
          style={{
            color: colors.muted,
            lineHeight: 1.6,
            maxWidth: 680,
          }}
        >
          {description}
        </p>
      </div>

      {children}
    </>
  )
}

/* ======================
   CHOICE GRID
    =====================*/

function ChoiceGrid({
  items,
  selected,
  onClick,
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns:
          'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 12,
      }}
    >
      {items.map((item) => {
        const active = selected.includes(item)

        return (
          <button
            type="button"
            key={item}
            onClick={() => onClick(item)}
            style={{
              ...choiceStyle,
              borderColor: active
                ? colors.teal
                : colors.line,
              color: active
                ? colors.teal
                : colors.paper,
              background: active
                ? colors.primarySoft
                : colors.panel,
            }}
          >
            {active ? '✓ ' : ''}
            {item}
          </button>
        )
      })}
    </div>
  )
}

/* =================
   FIELD LABEL
   ====================== */

function FieldLabel({ children }) {
  return (
    <div
      style={{
        fontFamily: fonts.mono,
        fontSize: 11,
        color: colors.muted,
        textTransform: 'uppercase',
        margin: '22px 0 8px',
      }}
    >
      {children}
    </div>
  )
}

/* =========================================================
   STYLES
   ========================================================= */

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: colors.panel,
  color: colors.paper,
  border: `1px solid ${colors.line}`,
  borderRadius: 10,
  padding: '13px 14px',
  fontSize: 14,
  outline: 'none',
}

const choiceStyle = {
  background: colors.panel,
  border: `1px solid ${colors.line}`,
  borderRadius: 12,
  padding: '15px 14px',
  cursor: 'pointer',
  textAlign: 'left',
  fontSize: 13,
  minHeight: 55,
}

const secondaryButton = {
  background: 'transparent',
  border: `1px solid ${colors.line}`,
  color: colors.paper,
  borderRadius: 9,
  padding: '11px 17px',
  cursor: 'pointer',
}