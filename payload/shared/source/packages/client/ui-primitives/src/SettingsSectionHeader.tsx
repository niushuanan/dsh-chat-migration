import type { ReactNode } from 'react'
import css from './SettingsSectionHeader.module.css'

export interface SettingsSectionHeaderProps {
  title: ReactNode
  titleAdornment?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  titleId?: string
  className?: string | undefined
}

/** Shared title block for one top-level Settings page. */
export function SettingsSectionHeader({
  title, titleAdornment, description, actions, titleId, className,
}: SettingsSectionHeaderProps) {
  return (
    <header
      className={className === undefined ? css.header : `${css.header} ${className}`}
      data-settings-section-header="true"
    >
      <div className={css.copy}>
        <div className={css.titleRow}>
          <h2 id={titleId}>{title}</h2>
          {titleAdornment}
        </div>
        {description === undefined ? null : <p>{description}</p>}
      </div>
      {actions === undefined ? null : <div className={css.actions}>{actions}</div>}
    </header>
  )
}
