import React from 'react'

type Props = {
  label?: string
  className?: string
}

export const LoadingDots: React.FC<Props> = ({ label = 'Loading cities', className = '' }) => {
  return (
    <div
      className={className}
      role="status"
      aria-live="polite"
      aria-label={`${label}…`}
      style={{ textAlign: 'center', padding: 20 }}
    >
      {label}
      <span className="ld-dots">
        <span className="ld-dot">.</span>
        <span className="ld-dot">.</span>
        <span className="ld-dot">.</span>
      </span>
    </div>
  )
}
