import { Transition, Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { Fragment } from 'react'
import {
    HomeIcon, CubeIcon, ClipboardDocumentListIcon, ArrowTrendingUpIcon,
    Squares2X2Icon, SunIcon, MoonIcon, ChevronDownIcon,
    UserIcon, DocumentTextIcon, ChartBarIcon, ExclamationCircleIcon,
    CalendarIcon, EllipsisHorizontalIcon, ArrowRightOnRectangleIcon, BriefcaseIcon
} from '@heroicons/react/24/outline'
import { useCatalystTheme as useTheme } from '../hooks/useCatalystTheme'

function NavItem({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <button className={`relative flex items-center justify-center h-9 px-3 rounded-full transition-all duration-300 group overflow-hidden ${active ? 'bg-black/5 dark:bg-white/10 text-blue-600 dark:text-blue-400' : 'hover:bg-black/5 dark:hover:bg-white/5 text-gray-500 dark:text-gray-400'}`}>
            <span className="relative z-10">{icon}</span>
            <span className={`ml-2 text-sm font-medium whitespace-nowrap max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 transition-all duration-300 ease-in-out ${active ? 'max-w-xs opacity-100' : ''}`}>
                {label}
            </span>
        </button>
    )
}

interface NavbarProps {
    onLogout: () => void;
    activeTab?: 'Overview' | 'Inventory' | 'Production' | 'Orders';
    onNavigateToWorkspace: () => void;
}

interface AppNavItem {
    icon: React.ReactNode;
    label: string;
    color: string;
    bg: string;
    isHighlighted?: boolean;
    onClick?: () => void;
}

export default function Navbar({ onLogout, activeTab = 'Overview', onNavigateToWorkspace }: NavbarProps) {
    const { theme, toggleTheme } = useTheme()

    const apps: AppNavItem[] = [
        { icon: <BriefcaseIcon className="w-8 h-8" />, label: "My Work Space", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-100 dark:bg-blue-900/30", isHighlighted: true, onClick: onNavigateToWorkspace },
        { icon: <HomeIcon className="w-8 h-8" />, label: "Portal", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
        { icon: <UserIcon className="w-8 h-8" />, label: "CRM", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-500/10" },
        { icon: <DocumentTextIcon className="w-8 h-8" />, label: "Invoice", color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-500/10" },
        { icon: <CubeIcon className="w-8 h-8" />, label: "Inventory", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-500/10" },
        { icon: <ChartBarIcon className="w-8 h-8" />, label: "Analytics", color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-500/10" },
        { icon: <ExclamationCircleIcon className="w-8 h-8" />, label: "Support", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-500/10" },
        { icon: <Squares2X2Icon className="w-8 h-8" />, label: "Board", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
        { icon: <CalendarIcon className="w-8 h-8" />, label: "Calendar", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10" },
        { icon: <EllipsisHorizontalIcon className="w-8 h-8" />, label: "More", color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-800" },
    ]

    return (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
            <div className="flex items-center p-2 rounded-full gap-2 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-lg">

                {/* Logo */}
                <div className="px-4">
                    <img src="/logo-on-light.jpg" alt="Strata" className="h-5 w-auto block dark:hidden" />
                    <img src="/logo-on-dark.jpg" alt="Strata" className="h-5 w-auto hidden dark:block" />
                </div>

                <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>

                {/* Navigation Items */}
                <div className="flex items-center gap-1">
                    <NavItem icon={<HomeIcon className="w-4 h-4" />} label="Overview" active={activeTab === 'Overview'} />
                    <NavItem icon={<CubeIcon className="w-4 h-4" />} label="Inventory" active={activeTab === 'Inventory'} />
                    <NavItem icon={<ArrowTrendingUpIcon className="w-4 h-4" />} label="Production" active={activeTab === 'Production'} />
                    <NavItem icon={<ClipboardDocumentListIcon className="w-4 h-4" />} label="Orders" active={activeTab === 'Orders'} />
                </div>

                <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 pr-2">
                    <Popover className="relative">
                        <PopoverButton className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors outline-none">
                            <Squares2X2Icon className="w-4 h-4" />
                        </PopoverButton>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-200"
                            enterFrom="opacity-0 translate-y-1"
                            enterTo="opacity-100 translate-y-0"
                            leave="transition ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0"
                            leaveTo="opacity-0 translate-y-1"
                        >
                            <PopoverPanel className="fixed top-[90px] left-1/2 -translate-x-1/2 w-[400px] p-4 bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl z-[100] overflow-hidden">
                                <div className="grid grid-cols-3 gap-4">
                                    {apps.map((app, i) => (
                                        <button
                                            key={i}
                                            onClick={app.onClick}
                                            className={`flex flex-col items-center gap-3 p-3 rounded-2xl hover:bg-black/5 dark:hover:bg-white/10 transition-all group ${
                                                app.isHighlighted ? 'ring-2 ring-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10' : ''
                                                }`}>
                                            <div className={`p-3 rounded-2xl ${app.bg} ${app.color} group-hover:scale-110 transition-transform shadow-sm`}>
                                                {app.icon}
                                            </div>
                                            <span className={`text-xs font-semibold group-hover:text-gray-900 dark:group-hover:text-white ${
                                                app.isHighlighted ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'
                                                }`}>{app.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </PopoverPanel>
                        </Transition>
                    </Popover>

                    <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                        {theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
                    </button>

                    <div className="relative group">
                        <button className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                                JD
                            </div>
                            <div className="text-left hidden md:block">
                                <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-white">Jhon Doe</p>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">Admin</p>
                            </div>
                            <ChevronDownIcon className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                        </button>
                        {/* User Dropdown */}
                        <div className="absolute top-full right-0 mt-2 w-48 py-1 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/20 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right">
                            <div className="px-4 py-2 border-b border-gray-200 dark:border-white/10">
                                <p className="text-sm font-medium">Jhon Doe</p>
                                <p className="text-xs text-gray-500">Admin</p>
                            </div>
                            <button onClick={onLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-2">
                                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
