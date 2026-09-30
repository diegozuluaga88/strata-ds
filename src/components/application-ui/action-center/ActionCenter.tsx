import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';
import {
  BellIcon,
  XMarkIcon,
  Squares2X2Icon,
  ExclamationTriangleIcon,
  CreditCardIcon,
  ClipboardDocumentCheckIcon,
  TruckIcon,
  MegaphoneIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import { Fragment, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { mockNotifications } from './data';
import FilterTabs from './FilterTabs';
import NotificationItem from './NotificationItem';
import ChatView from './ChatView';
import type {
  ActionCenterActionConfigMap,
  ActionCenterActionHandler,
  ActionCenterDataState,
  Notification,
  NotificationTab,
} from './types';

const EMPTY_NOTIFICATIONS: Notification[] = [];

export interface ActionCenterProps {
  /** Accessible name of the bell. The unread count is appended ("Notifications, 3 unread"). */
  label?: string;
  actionConfigMap?: ActionCenterActionConfigMap;
  onActionExecute?: ActionCenterActionHandler;
  dataState?: ActionCenterDataState;
}

export function ActionPanelContent({
  className,
  actionConfigMap,
  onActionExecute,
  dataState,
  onClose,
}: {
  className?: string;
  /** Renders a close button when provided (ActionCenter passes the popover's close). */
  onClose?: () => void;
  actionConfigMap?: ActionCenterActionConfigMap;
  onActionExecute?: ActionCenterActionHandler;
  dataState?: ActionCenterDataState;
}) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'list' | 'chat'>('list');

  const resolvedDataState: ActionCenterDataState =
    dataState ?? {
      status: 'success',
      items: mockNotifications,
    };

  const isLoading = resolvedDataState.status === 'loading';
  const isError = resolvedDataState.status === 'error';
  const notifications =
    resolvedDataState.status === 'success'
      ? resolvedDataState.items
      : EMPTY_NOTIFICATIONS;

  const tabs: NotificationTab[] = [
    {
      id: 'all',
      label: 'All',
      count: notifications.filter((n) => n.unread).length,
      icon: Squares2X2Icon,
      colorTheme: {
        activeBg: 'bg-foreground',
        activeText: 'text-background',
        activeBorder: 'border-foreground',
        badgeBg: 'bg-background/20',
        badgeText: 'text-background',
      },
      filter: () => true,
    },
    {
      id: 'discrepancy',
      label: 'Discrepancies',
      count: notifications.filter((n) => n.type === 'discrepancy' && n.unread)
        .length,
      icon: ExclamationTriangleIcon,
      colorTheme: {
        activeBg: 'bg-status-error-soft',
        activeText: 'text-foreground',
        activeBorder: 'border-status-error/30',
        badgeBg: 'bg-foreground/10',
        badgeText: 'text-foreground',
      },
      filter: (n) => n.type === 'discrepancy',
    },
    {
      id: 'payment',
      label: 'Payments',
      count: notifications.filter((n) => n.type === 'payment' && n.unread)
        .length,
      icon: CreditCardIcon,
      colorTheme: {
        activeBg: 'bg-status-warning-soft',
        activeText: 'text-foreground',
        activeBorder: 'border-status-warning/30',
        badgeBg: 'bg-foreground/10',
        badgeText: 'text-foreground',
      },
      filter: (n) => n.type === 'payment',
    },
    {
      id: 'approval',
      label: 'Approvals',
      count: notifications.filter((n) => n.type === 'approval' && n.unread)
        .length,
      icon: ClipboardDocumentCheckIcon,
      colorTheme: {
        activeBg: 'bg-status-info-soft',
        activeText: 'text-foreground',
        activeBorder: 'border-status-info/30',
        badgeBg: 'bg-foreground/10',
        badgeText: 'text-foreground',
      },
      filter: (n) => n.type === 'approval',
    },
    {
      id: 'shipping',
      label: 'Shipping',
      count: notifications.filter((n) => n.type === 'shipping' && n.unread)
        .length,
      icon: TruckIcon,
      colorTheme: {
        activeBg: 'bg-status-success-soft',
        activeText: 'text-foreground',
        activeBorder: 'border-status-success/30',
        badgeBg: 'bg-foreground/10',
        badgeText: 'text-foreground',
      },
      filter: (n) => n.type === 'shipping',
    },
    {
      id: 'announcement',
      label: 'Announcements',
      count: notifications.filter((n) => n.type === 'announcement' && n.unread)
        .length,
      icon: MegaphoneIcon,
      colorTheme: {
        activeBg: 'bg-status-ai-soft',
        activeText: 'text-foreground',
        activeBorder: 'border-status-ai/30',
        badgeBg: 'bg-foreground/10',
        badgeText: 'text-foreground',
      },
      filter: (n) => n.type === 'announcement',
    },
    {
      id: 'live_chat',
      label: 'Live Chat',
      count: notifications.filter((n) => n.type === 'live_chat' && n.unread)
        .length,
      icon: ChatBubbleLeftRightIcon,
      colorTheme: {
        activeBg: 'bg-status-info-soft',
        activeText: 'text-foreground',
        activeBorder: 'border-status-info/30',
        badgeBg: 'bg-foreground/10',
        badgeText: 'text-foreground',
      },
      filter: (n) => n.type === 'live_chat',
    },
  ];

  const filteredNotifications = useMemo(() => {
    if (isLoading || isError) {
      return [];
    }

    const currentTab = tabs.find((t) => t.id === activeTab);
    return notifications
      .filter((n) => currentTab?.filter(n))
      .filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.meta.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [activeTab, isError, isLoading, notifications, searchQuery, tabs]);

  const urgentCount = notifications.filter((n) => n.priority === 'high').length;

  return (
    <div
      className={clsx(
        'bg-popover text-popover-foreground border border-border shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[80vh]',
        className
      )}
    >
      {currentView === 'chat' ? (
        <ChatView onBack={() => setCurrentView('list')} />
      ) : (
        <>
          <div className="px-5 pt-5 pb-3 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-foreground">
                Action Center
              </h3>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close notifications"
                  className="p-1 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <XMarkIcon className="w-5 h-5" aria-hidden="true" />
                </button>
              )}
            </div>

            {!isLoading && !isError && (
              <FilterTabs
                tabs={tabs}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            )}
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 px-5 pb-4 space-y-3 scrollbar-minimal">
            {!isLoading &&
              !isError &&
              filteredNotifications.length > 0 &&
              filteredNotifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  actionConfigMap={actionConfigMap}
                  onActionExecute={onActionExecute}
                  onOpenChat={() => setCurrentView('chat')}
                />
              ))}

            {!isLoading && !isError && filteredNotifications.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <BellIcon className="w-12 h-12 mb-3 text-muted-foreground/50" aria-hidden="true" />
                <p className="text-sm font-medium">No updates found</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            )}
          </div>

          {!isLoading && !isError && (
            <div className="px-5 py-3 border-t border-border bg-muted/50 flex items-center justify-between shrink-0">
              <p className="text-xs font-medium text-muted-foreground">
                {filteredNotifications.length} actions
              </p>
              <p className={clsx('text-xs font-bold flex items-center gap-1.5', urgentCount > 0 ? 'text-status-error' : 'text-muted-foreground')}>
                {urgentCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-status-error motion-safe:animate-pulse" aria-hidden="true" />}
                {urgentCount} urgent
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ActionCenter({
  label = 'Notifications',
  actionConfigMap,
  onActionExecute,
  dataState,
}: ActionCenterProps) {
  const resolvedDataState: ActionCenterDataState =
    dataState ?? {
      status: 'success',
      items: mockNotifications,
    };
  const totalCount =
    resolvedDataState.status === 'success'
      ? resolvedDataState.items.filter((n) => n.unread).length
      : 0;

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <PopoverButton
            aria-label={totalCount > 0 ? `${label}, ${totalCount} unread` : label}
            className={clsx(
              'relative p-2 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
              open
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <BellIcon className="w-5 h-5" aria-hidden="true" />
            {totalCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-status-error ring-2 ring-background"
              />
            )}
          </PopoverButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-2 scale-95"
            enterTo="opacity-100 translate-y-0 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0 scale-100"
            leaveTo="opacity-0 translate-y-2 scale-95"
          >
            <PopoverPanel className="fixed top-[90px] left-1/2 -translate-x-1/2 w-[95vw] max-h-[85vh] lg:w-[600px] lg:fixed lg:left-1/2 lg:-translate-x-1/2 p-0 z-50">
              {({ close }) => (
                <ActionPanelContent
                  actionConfigMap={actionConfigMap}
                  onActionExecute={onActionExecute}
                  dataState={resolvedDataState}
                  onClose={() => close()}
                />
              )}
            </PopoverPanel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
