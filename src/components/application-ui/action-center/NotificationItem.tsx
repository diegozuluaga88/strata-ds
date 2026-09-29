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

const PriorityIcon = ({ type }: { type: Notification['type'] }) => {
  if (type === 'discrepancy') return <ExclamationTriangleIcon className="w-4 h-4" />;
  if (type === 'payment') return <CreditCardIcon className="w-4 h-4" />;
  if (type === 'invoice') return <DocumentTextIcon className="w-4 h-4" />;
  if (type === 'approval') return <ClipboardDocumentCheckIcon className="w-4 h-4" />;
  if (type === 'shipping') return <TruckIcon className="w-4 h-4" />;
  if (type === 'announcement') return <MegaphoneIcon className="w-4 h-4" />;
  if (type === 'live_chat') return <ChatBubbleLeftRightIcon className="w-4 h-4" />;

  return <InformationCircleIcon className="w-4 h-4" />;
};

export const PriorityBadge = ({
  priority,
  type,
}: {
  priority: Notification['priority'];
  type: Notification['type'];
}) => {
  const colors = {
    high: 'text-red-500 dark:text-red-400 bg-red-500/10 border-red-500/20',
    medium: 'text-orange-500 dark:text-orange-400 bg-orange-500/10 border-orange-500/20',
    low: 'text-zinc-400 dark:text-zinc-300 bg-zinc-500/10 border-zinc-500/20',
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
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border',
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
    <div className="group relative p-4 rounded-2xl bg-white dark:bg-black/20 border border-transparent hover:border-gray-200 dark:hover:border-white/10 hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <PriorityBadge priority={notification.priority} type={notification.type} />
            {notification.priority === 'high' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                High
              </span>
            )}
            {notification.priority === 'medium' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">
                Medium
              </span>
            )}
            {notification.priority === 'low' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary">
                Low
              </span>
            )}
          </div>

          <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
            {notification.title}
          </h4>

          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {notification.message}
          </p>

          <div className="mt-2 text-[10px] flex items-center gap-2 text-gray-400 dark:text-gray-500 font-mono">
            <span>{notification.meta}</span>
            <span>•</span>
            <span>{notification.timestamp}</span>
          </div>
        </div>

        {configuredActions.map(({ action, actionKey, displayLabel }, i) => (
          <button
            key={`${notification.id}-${actionKey}-${i}`}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm',
              action.primary
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-white/20'
            )}
            onClick={() => handleActionClick(actionKey)}
          >
            {displayLabel}
            <ArrowRightIcon className="w-3 h-3" />
          </button>
        ))}
      </div>

      <div
        className={clsx(
          'absolute left-0 top-4 bottom-4 w-1 rounded-r-full',
          notification.priority === 'high'
            ? 'bg-red-500'
            : notification.priority === 'medium'
              ? 'bg-orange-500'
              : 'bg-transparent'
        )}
      />
    </div>
  );
}
