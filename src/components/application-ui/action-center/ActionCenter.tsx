import {
  Popover,
  PopoverButton,
  PopoverPanel,
  Transition,
} from '@headlessui/react';
import {
  BellIcon,
  MagnifyingGlassIcon,
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
  actionConfigMap?: ActionCenterActionConfigMap;
  onActionExecute?: ActionCenterActionHandler;
  dataState?: ActionCenterDataState;
}

export function ActionPanelContent({
  className,
  actionConfigMap,
  onActionExecute,
  dataState,
}: {
  className?: string;
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
        activeBg: 'bg-zinc-800 dark:bg-white/10',
        activeText: 'text-white',
        activeBorder: 'border-white/10',
        badgeBg: 'bg-white/20',
        badgeText: 'text-white',
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
        activeBg: 'bg-red-500/15',
        activeText: 'text-red-500',
        activeBorder: 'border-red-500/20',
        badgeBg: 'bg-red-500/20',
        badgeText: 'text-red-500',
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
        activeBg: 'bg-orange-500/15',
        activeText: 'text-orange-500',
        activeBorder: 'border-orange-500/20',
        badgeBg: 'bg-orange-500/20',
        badgeText: 'text-orange-500',
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
        activeBg: 'bg-cyan-500/15',
        activeText: 'text-cyan-500',
        activeBorder: 'border-cyan-500/20',
        badgeBg: 'bg-cyan-500/20',
        badgeText: 'text-cyan-500',
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
        activeBg: 'bg-green-500/15',
        activeText: 'text-green-500',
        activeBorder: 'border-green-500/20',
        badgeBg: 'bg-green-500/20',
        badgeText: 'text-green-500',
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
        activeBg: 'bg-purple-500/15',
        activeText: 'text-purple-500',
        activeBorder: 'border-purple-500/20',
        badgeBg: 'bg-purple-500/20',
        badgeText: 'text-purple-500',
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
        activeBg: 'bg-indigo-500/15',
        activeText: 'text-indigo-500',
        activeBorder: 'border-indigo-500/20',
        badgeBg: 'bg-indigo-500/20',
        badgeText: 'text-indigo-500',
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
        'bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[80vh]',
        className
      )}
    >
      {currentView === 'chat' ? (
        <ChatView onBack={() => setCurrentView('list')} />
      ) : (
        <>
          <div className="px-5 pt-5 pb-3 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Action Center
              </h3>
              <div className="flex items-center gap-2">
                <button className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors">
                  <MagnifyingGlassIcon className="w-5 h-5" />
                </button>
                <button className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
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
              <div className="flex flex-col items-center justify-center py-12 text-center text-gray-500 dark:text-gray-400">
                <BellIcon className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-medium">No updates found</p>
                <p className="text-xs mt-1">You're all caught up!</p>
              </div>
            )}
          </div>

          {!isLoading && !isError && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 backdrop-blur-md flex items-center justify-between shrink-0">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {filteredNotifications.length} actions
              </p>
              <p className="text-xs font-bold text-red-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
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
            className={clsx(
              'relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors outline-none',
              open
                ? 'bg-black/5 dark:bg-white/10 text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <BellIcon className="w-5 h-5" />
            {totalCount > 0 && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2"
                style={{
                  backgroundColor: 'var(--color-red-400)',
                  boxShadow: '0 0 0 2px var(--color-background)',
                }}
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
            <PopoverPanel className="fixed top-[90px] left-1/2 -translate-x-1/2 w-[95vw] max-h-[85vh] lg:w-[600px] lg:fixed lg:left-1/2 lg:-translate-x-1/2 p-0 z-50 focus:outline-none">
              <ActionPanelContent
                actionConfigMap={actionConfigMap}
                onActionExecute={onActionExecute}
                dataState={resolvedDataState}
              />
            </PopoverPanel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
