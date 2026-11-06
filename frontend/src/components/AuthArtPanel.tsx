import './AuthArtPanel.css'

const WORKFLOW = [
  { number: '01', title: 'Receive', detail: 'Record incoming stock' },
  { number: '02', title: 'Manage', detail: 'Keep inventory current' },
  { number: '03', title: 'Deliver', detail: 'Follow each order' },
]

export function AuthArtPanel() {
  return (
    <div className="auth-art">
      <div className="auth-art__topline">
        <span className="auth-art__signal" aria-hidden="true" />
        GLASSRAM OPERATIONS
      </div>

      <div className="auth-art__content">
        <div className="auth-art__visual" aria-hidden="true">
          <div className="auth-art__visual-glow" />
          <div className="auth-art__glass auth-art__glass--back" />
          <div className="auth-art__glass auth-art__glass--middle" />
          <div className="auth-art__glass auth-art__glass--front" />
          <div className="auth-art__visual-label">
            <span className="auth-art__visual-dot" />
            ONE CONNECTED WORKFLOW
          </div>
        </div>

        <div className="auth-art__copy">
          <p className="auth-art__eyebrow">STOCK TO DELIVERY</p>
          <h2>Know what’s moving.<br />Keep work moving.</h2>
          <p className="auth-art__description">
            A shared view of products, customer orders, and delivery progress for the Glassram team.
          </p>
        </div>
      </div>

      <ol className="auth-art__workflow" aria-label="SmartStock workflow">
        {WORKFLOW.map((step) => (
          <li className="auth-art__step" key={step.number}>
            <span className="auth-art__step-number">{step.number}</span>
            <span className="auth-art__step-copy">
              <strong>{step.title}</strong>
              <span>{step.detail}</span>
            </span>
          </li>
        ))}
      </ol>

      <footer className="auth-art__footer">
        <span>SmartStock</span>
        <span>Inventory · Orders · Delivery</span>
      </footer>
    </div>
  )
}
