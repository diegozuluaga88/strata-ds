import * as React from 'react'
import { cn } from '@/utils';
export type StatusBadgeStatus =
  | 'active'
  | 'available'
  | 'in_progress'
  | 'pending'
  | 'completed'
  | 'maintenance'
  | 'warning'
  | 'error'
  | 'archived'

export type StatusBadgeAlias = 'in-progress' | 'in use' | 'failed'

export type StatusBadgeValue = StatusBadgeStatus | StatusBadgeAlias

const aliasMap: Record<StatusBadgeAlias, StatusBadgeStatus> = {
  'in-progress': 'in_progress',
  'in use': 'active',
  failed: 'error',
}

const statusClassMap: Record<StatusBadgeStatus, string> = {
  active: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400',
  available: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  in_progress: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  completed: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400',
  maintenance: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  error: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  archived: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
}

const statusLabelMap: Record<StatusBadgeStatus, string> = {
  active: 'Active',
  available: 'Available',
  in_progress: 'In Progress',
  pending: 'Pending',
  completed: 'Completed',
  maintenance: 'Maintenance',
  warning: 'Warning',
  error: 'Error',
  archived: 'Archived',
}

function resolveStatus(status: StatusBadgeValue): StatusBadgeStatus {
  if (status in aliasMap) {
    return aliasMap[status as StatusBadgeAlias]
  }

  return status as StatusBadgeStatus
}

const statusDotClassMap: Record<StatusBadgeStatus, string> = {
  active: 'bg-green-600 dark:bg-green-400',
  available: 'bg-emerald-600 dark:bg-emerald-400',
  in_progress: 'bg-blue-600 dark:bg-blue-400',
  pending: 'bg-amber-600 dark:bg-amber-400',
  completed: 'bg-green-600 dark:bg-green-400',
  maintenance: 'bg-indigo-600 dark:bg-indigo-400',
  warning: 'bg-amber-600 dark:bg-amber-400',
  error: 'bg-red-600 dark:bg-red-400',
  archived: 'bg-zinc-500 dark:bg-zinc-400',
}

export interface StatusBadgeProps extends React.ComponentProps<'span'> {
  status: StatusBadgeValue
  /**
   * Renders a small solid dot before the content, regardless of whether `children`
   * overrides the default label. If `children` itself renders a leading icon, that
   * icon will visually double up with the dot — don't combine the two.
   */
  dot?: boolean
}

export function StatusBadge({
  status,
  className,
  children,
  dot = false,
  ...props
}: StatusBadgeProps) {
  const canonicalStatus = resolveStatus(status)

  return (
    <span
      data-slot="status-badge"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        statusClassMap[canonicalStatus],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          data-slot="status-badge-dot"
          className={cn('h-1.5 w-1.5 rounded-full', statusDotClassMap[canonicalStatus])}
        />
      )}
      {children ?? statusLabelMap[canonicalStatus]}
    </span>
  )
}

export {
  resolveStatus as resolveStatusBadgeValue,
  statusClassMap as statusBadgeClassMap,
  statusDotClassMap,
}

