import {
  ArrowRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  CreditCardIcon,
  ClipboardDocumentCheckIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';
import type {
  ActionCenterActionConfigMap,
  ActionCenterActionHandler,
  Notification,
} from './types';
import { normalizeActionCenterActionKey } from './types';
import { clsx } from 'clsx';

// Decorative: the badge text names the type.
const iconProps = { className: 'w-4 h-4', 'aria-hidden': true } as const;

const PriorityIcon = ({ type }: { type: Notification['type'] }) => {
  if (type === 'discrepancy') return <ExclamationTriangleIcon {...iconProps} />;
  if (type === 'payment') return <CreditCardIcon {...iconProps} />;
  if (type === 'invoice') return <DocumentTextIcon {...iconProps} />;
  if (type === 'approval') return <ClipboardDocumentCheckIcon {...iconProps} />;
  if (type === 'shipping') return <TruckIcon {...iconProps} />;
  if (type === 'announcement') return <MegaphoneIcon {...iconProps} />;
  if (type === 'live_chat') return <ChatBubbleLeftRightIcon {...iconProps} />;

  return <InformationCircleIcon {...iconProps} />;
};

export const PriorityBadge = ({
  priority,
  type,
}: {
  priority: Notification['priority'];
  type: Notification['type'];
}) => {
  const colors = {
    high: 'text-foreground bg-status-error-soft border-status-error/30',
    medium: 'text-foreground bg-status-warning-soft border-status-warning/30',
    low: 'text-foreground bg-muted border-border',
  };

  const labels = {
    discrepancy: 'Discrepancy',
    invoice: 'Invoice',
    payment: 'Payment',
    approval: 'Approval',
    system: 'System',
    shipping: 'Shipping',
    announcement: 'Announcement',
    live_chat: 'Live Chat',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
        colors[priority]
      )}
    >
      <PriorityIcon type={type} />
      {labels[type]}
    </span>
  );
};

export default function NotificationItem({
  notification,
  actionConfigMap,
  onActionExecute,
  onOpenChat,
}: {
  notification: Notification;
  actionConfigMap?: ActionCenterActionConfigMap;
  onActionExecute?: ActionCenterActionHandler;
  onOpenChat?: () => void;
}) {
  const configuredActions = notification.actions
    .map((action) => {
      const actionKey = normalizeActionCenterActionKey(action.label);
      const config = actionConfigMap?.[actionKey];

      if (!config) {
        return null;
      }

      return {
        action,
        actionKey,
        displayLabel: config.label ?? action.label,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const handleActionClick = (actionKey: string) => {
    const action = notification.actions.find(
      (item) => normalizeActionCenterActionKey(item.label) === actionKey
    );

    if (!action) {
      return;
    }

    const result = onActionExecute?.({
      notification,
      action,
      actionKey,
    });

    if (result?.openView === 'chat') {
      onOpenChat?.();
      return;
    }

    if (!onActionExecute && actionKey === normalizeActionCenterActionKey('Reply')) {
      onOpenChat?.();
    }
  };

  return (
    <div className="group relative p-4 rounded-2xl bg-card border border-transparent hover:border-border hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <PriorityBadge priority={notification.priority} type={notification.type} />
            {notification.priority === 'high' && (
              <span className="px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-status-error-soft text-status-error">
                High
              </span>
            )}
            {notification.priority === 'medium' && (
              <span className="px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-status-warning-soft text-foreground">
                Medium
              </span>
            )}
            {notification.priority === 'low' && (
              <span className="px-1.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-muted text-muted-foreground">
                Low
              </span>
            )}
          </div>

          <h4 className="text-sm font-semibold text-foreground truncate">
            {notification.title}
          </h4>

          <p className="mt-0.5 text-xs text-muted-foreground">
            {notification.message}
          </p>

          <div className="mt-2 text-xs flex items-center gap-2 text-muted-foreground font-mono">
            <span>{notification.meta}</span>
            <span aria-hidden="true">•</span>
            <span>{notification.timestamp}</span>
          </div>
        </div>

        {configuredActions.map(({ action, actionKey, displayLabel }, i) => (
          <button
            type="button"
            key={`${notification.id}-${actionKey}-${i}`}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
              action.primary
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
            onClick={() => handleActionClick(actionKey)}
          >
            {displayLabel}
            <ArrowRightIcon className="w-3 h-3" aria-hidden="true" />
          </button>
        ))}
      </div>

      <div
        aria-hidden="true"
        className={clsx(
          'absolute left-0 top-4 bottom-4 w-1 rounded-r-full',
          notification.priority === 'high'
            ? 'bg-status-error'
            : notification.priority === 'medium'
              ? 'bg-status-warning'
              : 'bg-transparent'
        )}
      />
    </div>
  );
}
