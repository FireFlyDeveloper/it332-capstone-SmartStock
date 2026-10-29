/**
 * AuthArtPanel - ambient brand surface rendered on the right pane at
 * desktop widths. Purely decorative; the parent should mark it
 * aria-hidden.
 *
 * Three floating stat tiles + one short tagline. Uses --radius-card,
 * --mono, and a local frosted-glass treatment that degrades under
 * prefers-reduced-transparency.
 *
 * Author: Hazel
 * Last touched: 2026-07-07
 */

import './AuthArtPanel.css'

interface Feature {
  name: string
  description: string
  className?: string
}

const FEATURES: Feature[] = [
  { name: 'Inventory', description: 'Products and stock levels' },
  { name: 'Orders', description: 'Customer order records', className: 'auth-art__stat--offset' },
  { name: 'Delivery', description: 'Delivery status', className: 'auth-art__stat--bottom' },
]

export function AuthArtPanel() {
  return (
    <div className="auth-art">
      <div className="auth-art__grid" />
      <div className="auth-art__grain" />
      {FEATURES.map((feature) => (
        <div
          key={feature.name}
          className={`auth-art__stat ${feature.className ?? ''}`.trim()}
        >
          <span className="auth-art__stat-num">{feature.name}</span>
          <span className="auth-art__stat-label">{feature.description}</span>
        </div>
      ))}
      <div className="auth-art__quote">
        <p>From receiving bay to delivery truck, one count.</p>
      </div>
      <div className="auth-art__footer" aria-hidden="true">
        SmartStock · Inventory and order management
      </div>
    </div>
  )
}
