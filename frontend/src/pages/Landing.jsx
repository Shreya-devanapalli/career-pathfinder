import { useNavigate } from 'react-router-dom'

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing-page">

      {/* NAVBAR */}
      <nav className="landing-navbar">
        <div className="landing-logo">
          <span className="landing-logo-icon">🤖</span>
          <span>Career Pathfinder</span>
        </div>

        <div className="landing-nav-actions">
  <button
    className="landing-login-btn"
    onClick={() => navigate('/login')}
  >
    Login
  </button>

  <button
    className="landing-signup-btn"
    onClick={() => navigate('/signup')}
  >
    Get Started
  </button>
</div>
      </nav>


      {/* HERO SECTION */}
      <main className="landing-hero">

        <div className="landing-hero-content">

          <div className="landing-badge">
            🤖 AI-Powered Career Guidance
          </div>

          <h1>
            Find the Career Path
            <span> That Fits You</span>
          </h1>

          <p>
            Discover careers that match your skills, interests, and
            academic background. Get personalized recommendations,
            identify your skill gaps, and build your roadmap to success.
          </p>

          <div className="landing-buttons">

            <button
              className="landing-primary-btn"
              onClick={() => navigate('/signup')}
            >
              Start Your Career Journey →
            </button>

          </div>

          <div className="landing-trust">
            <div>
              <strong>AI-Powered</strong>
              <span>Personalized guidance</span>
            </div>

            <div>
              <strong>Skill Analysis</strong>
              <span>Identify what to learn</span>
            </div>

            <div>
              <strong>Career Roadmap</strong>
              <span>Plan your next steps</span>
            </div>
          </div>

        </div>


        {/* HERO VISUAL */}
        <div className="landing-visual">

          <div className="career-card">

            <div className="career-card-header">
              <div className="robot-circle">
                🤖
              </div>

              <div>
                <small>YOUR CAREER MATCH</small>
                <h3>Data Analyst</h3>
              </div>
            </div>

            <div className="match-score">
              <div className="score-number">92%</div>

              <div>
                <strong>Career Match</strong>
                <p>Based on your skills & interests</p>
              </div>
            </div>

            <div className="skill-section">
              <div className="skill-title">
                <span>Your Skills</span>
                <span>✓</span>
              </div>

              <div className="skill-tags">
                <span>Python</span>
                <span>SQL</span>
                <span>Excel</span>
                <span>Statistics</span>
              </div>
            </div>

            <div className="next-step">
              <span>🎯</span>

              <div>
                <strong>Next Step</strong>
                <p>Learn Power BI & Data Visualization</p>
              </div>
            </div>

          </div>

        </div>

      </main>


      {/* FEATURES */}
      <section className="landing-features">

        <div className="section-heading">
          <span>HOW IT WORKS</span>
          <h2>Your Career Journey, Simplified</h2>
          <p>
            From discovering your strengths to building your career roadmap.
          </p>
        </div>

        <div className="feature-grid">

          <div className="feature-card">
            <div className="feature-icon">🧑‍🎓</div>
            <h3>Build Your Profile</h3>
            <p>
              Tell us about your academic background, skills,
              and areas of interest.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Get Career Matches</h3>
            <p>
              Our recommendation engine analyzes your profile
              and finds suitable career paths.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Find Your Skill Gaps</h3>
            <p>
              Understand which skills you already have and
              which skills you need to develop.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3>Follow Your Roadmap</h3>
            <p>
              Get courses, certifications, projects, and
              next steps to move toward your target career.
            </p>
          </div>

        </div>

      </section>


      {/* CTA */}
      <section className="landing-cta">

        <h2>Ready to Discover Your Career Path?</h2>

        <p>
          Let AI help you make a smarter career decision.
        </p>

        <button
          onClick={() => navigate('/signup')}
        >
          Get Started for Free →
        </button>

      </section>


      {/* FOOTER */}
      <footer className="landing-footer">
        <div>
          🤖 <strong>Career Pathfinder</strong>
        </div>

        <p>
          AI-powered personalized career guidance.
        </p>

        <span>
          © 2026 Career Pathfinder
        </span>
      </footer>

    </div>
  )
}