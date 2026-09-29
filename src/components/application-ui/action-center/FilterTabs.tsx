import type { NotificationTab } from './types';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterTabsProps {
    tabs: NotificationTab[];
    activeTab: string;
    onTabChange: (id: string) => void;
}

export default function FilterTabs({ tabs, activeTab, onTabChange }: FilterTabsProps) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto py-2 scrollbar-none px-1">
            <AnimatePresence mode="popLayout">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={clsx(
                                "relative flex items-center justify-center rounded-xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                                isActive
                                    ? clsx(
                                        "px-3 py-2 border",
                                        tab.colorTheme.activeBg,
                                        tab.colorTheme.activeBorder
                                    )
                                    : "p-2 hover:bg-black/5 dark:hover:bg-white/5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <tab.icon className={clsx(
                                    "w-5 h-5 transition-colors",
                                    isActive ? tab.colorTheme.activeText : "currentColor"
                                )} />

                                {isActive && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className={clsx("text-sm font-medium whitespace-nowrap hidden lg:inline-block", tab.colorTheme.activeText)}
                                    >
                                        {tab.label}
                                    </motion.span>
                                )}

                                {isActive && tab.count > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className={clsx(
                                            "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                                            tab.colorTheme.badgeBg,
                                            tab.colorTheme.badgeText
                                        )}
                                    >
                                        {tab.count}
                                    </motion.span>
                                )}
                            </div>

                            {/* Collapsed Badge (Notification Dot) */}
                            {!isActive && tab.count > 0 && (
                                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold border-2 border-white dark:border-zinc-900">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
