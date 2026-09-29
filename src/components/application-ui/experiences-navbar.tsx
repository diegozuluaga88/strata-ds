import { createElement, type ReactNode } from 'react';
import { useLocation, Link } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../overlays/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../overlays/popover';
import {
  HomeIcon,
  Squares2X2Icon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  EllipsisHorizontalIcon,
  ArrowRightOnRectangleIcon,
  BriefcaseIcon,
  CheckIcon,
  BookOpenIcon,
  CalculatorIcon,
  WrenchScrewdriverIcon,
  PhotoIcon,
  CreditCardIcon,
  BanknotesIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from '../../hooks/useTheme';
import { useTenant } from '../../contexts/TenantContext'; // el canonico no tiene src/index.ts: aqui la ruta directa es la correcta
import StrataLogoLight from '@/components/assets/logos/logo-light-brand.png';
import StrataLogoDark from '@/components/assets/logos/logo-dark-brand.png';
import ActionCenter from './action-center/ActionCenter';
import type {
  ActionCenterActionConfigMap,
  ActionCenterActionHandler,
  ActionCenterDataState,
} from './action-center/types';

// Update supported tabs
export type ExperiencesNavTab = 'Overview' | 'Inventory' | 'Catalogs' | 'MAC' | 'Transactions' | 'CRM' | 'Pricing';

/** Normalize icon so it's always a renderable ReactNode created with the current React. Avoids "Objects are not valid as a React child" from cross-React or ForwardRef. */
function normalizeNavIcon(icon: ReactNode): ReactNode {
    if (icon == null) return null;
    if (typeof icon === 'function') {
        return createElement(icon as React.ComponentType<{ className?: string }>, { className: 'w-4 h-4' });
    }
    const o = icon as unknown as Record<string, unknown>;
    if (typeof o === 'object' && o !== null && !Array.isArray(o)) {
        if ('render' in o && typeof o.render === 'function') {
            return createElement(icon as unknown as React.ComponentType<{ className?: string }>, { className: 'w-4 h-4' });
        }
        if ('type' in o && 'props' in o && o.type != null) {
            return createElement(o.type as React.ComponentType<{ className?: string }>, {
                ...(typeof o.props === 'object' && o.props !== null ? (o.props as object) : {}),
                className: 'w-4 h-4',
            });
        }
    }
    return createElement(icon as unknown as React.ComponentType<{ className?: string }>, { className: 'w-4 h-4' });
}

function ExperiencesNavItem({ icon, label, active = false, to }: { icon: React.ReactNode, label: string, active?: boolean, to: string }) {
    const resolvedIcon = normalizeNavIcon(icon);
    return (
        <Link
            to={to}
            className={`relative flex items-center justify-center h-9 px-2 rounded-full transition-all duration-300 group overflow-hidden cursor-pointer focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${active ? 'bg-brand-300 dark:bg-brand-500 text-black' : 'hover:bg-muted text-muted-foreground'}`}
        >
            <span className="relative z-10 shrink-0 w-4 h-4 flex items-center justify-center">{resolvedIcon}</span>
            <span className={`text-sm font-medium whitespace-nowrap transition-all duration-300 ease-in-out ${active ? 'ml-2 max-w-xs opacity-100' : 'ml-2 max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100'}`}>
                {label}
            </span>
        </Link>
    )
}

export interface ExperiencesNavItemProps {
    label: string;
    icon: React.ReactNode;
    path?: string;
}

export interface ExperiencesNavbarProps {
    navItems: ExperiencesNavItemProps[];
    onLogout: () => void;
    activeTab?: ExperiencesNavTab | string; // Allow string for flexibility
    onNavigateToWorkspace: () => void;
    onNavigate: (page: string) => void;
    actionCenterActionConfigMap?: ActionCenterActionConfigMap;
    onActionCenterActionExecute?: ActionCenterActionHandler;
    actionCenterDataState?: ActionCenterDataState;
    /** Logo for light theme (e.g. logo-black.png). Falls back to StrataLogoLight when not provided. */
    logoLight?: string;
    /** Logo for dark theme (e.g. logo-white.png). Falls back to StrataLogoDark when not provided. */
    logoDark?: string;
    /** When true, the action center trigger is not rendered. Default: show action center. */
    hideActionCenter?: boolean;
    /**
     * When true, suppresses only the app-grid/desktop-shortcuts sections of the quick-actions
     * popover. The popover itself (and its mobile-only nav list) still renders whenever
     * `navItems` is non-empty -- on small screens it's the only path to the main nav, so it
     * is never gated by this prop alone. Its trigger button becomes `lg:hidden` in this case:
     * with the app-grid content suppressed, the only thing left inside is the mobile nav list,
     * which is itself `lg:hidden` -- without this the trigger would still render on desktop and
     * open a visibly empty popover there.
     */
    hideQuickActions?: boolean;
    /** When true, show current tenant only and disable tenant switching UI. */
    hideTenantSwitcher?: boolean;
    /** Current user's name. Falls back to "Jhon Doe" when not provided. */
    userName?: string;
    /** Current user's role. Falls back to "Admin" when not provided. */
    userRole?: string;
    /** When set, shows a "Change Password" item above Sign Out in the user menu. */
    onChangePassword?: () => void;
}

export function ExperiencesNavbar({
    navItems,
    onLogout,
    activeTab: activeTabProp,
    onNavigateToWorkspace,
    onNavigate,
    actionCenterActionConfigMap,
    onActionCenterActionExecute,
    actionCenterDataState,
    logoLight,
    logoDark,
    hideActionCenter = false,
    hideQuickActions = false,
    hideTenantSwitcher = false,
    userName = 'Jhon Doe',
    userRole = 'Admin',
    onChangePassword,
}: ExperiencesNavbarProps) {
    const { theme, toggleTheme } = useTheme()
    const { currentTenant, tenants, setTenant } = useTenant()
    const { pathname } = useLocation()

    // Generate user initials from userName
    const userInitials = userName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'JD'

    const derivedActiveTab =
        activeTabProp ??
        (() => {
            const candidates = navItems.filter(
                (item) =>
                    item.path &&
                    (pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path)))
            );
            const match = candidates.sort(
                (a, b) => (b.path?.length ?? 0) - (a.path?.length ?? 0)
            )[0];
            return match?.label ?? navItems[0]?.label ?? 'Overview';
        })();

    const activeTab = derivedActiveTab;

    return (
        <div className="sticky top-2 lg:top-6 mx-auto z-50 max-lg:w-fit lg:min-w-0 lg:max-w-7xl lg:w-[80vw]">
            <div
                className="relative flex items-center lg:justify-between px-3 py-2 rounded-full gap-1 bg-navbar/80 backdrop-blur-xl border border-border shadow-lg dark:shadow-glow-md"
            >

                {/* Left Group (Logo + Tenant) */}
                <div className="flex items-center gap-1">
                    {/* Logo - light and dark via CSS */}
                    <div className="px-2 shrink-0">
                        <img
                            src={theme === 'dark' ? (logoDark ?? StrataLogoDark) : (logoLight ?? StrataLogoLight)}
                            alt="Strata"
                            className="h-8 w-20 object-contain"
                        />
                    </div>

                    <div className="h-6 w-px bg-border mx-1 hidden lg:block"></div>

                    {/* Tenant Selector */}
                    <div className="relative hidden lg:block">
                        {hideTenantSwitcher ? (
                            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-none">Tenant</span>
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm font-bold text-foreground leading-tight">{currentTenant}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors outline-hidden cursor-pointer">
                                        <div className="flex flex-col items-start text-left">
                                            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-none">Tenant</span>
                                            <div className="flex items-center gap-1">
                                                <span className="text-sm font-bold text-foreground leading-tight">{currentTenant}</span>
                                                <ChevronDownIcon className="w-3 h-3 text-muted-foreground" />
                                            </div>
                                        </div>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-48 rounded-xl shadow-xl ring-1 ring-black/5">
                                    {tenants.map((tenant) => (
                                        <DropdownMenuItem key={tenant} onClick={() => setTenant(tenant)}>
                                            {tenant}
                                            {currentTenant === tenant && <CheckIcon className="ml-auto w-4 h-4 text-foreground" />}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {/* Center Group (Nav Items) */}
                <div className="hidden lg:!flex items-center gap-1 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    {navItems.map(item => (
                        <ExperiencesNavItem
                            key={item.label}
                            icon={item.icon}
                            label={item.label}
                            active={activeTab === item.label}
                            to={item.path ?? item.label.toLowerCase()}
                        />
                    ))}
                </div>

                {/* Right Group (Actions) */}
                <div className="flex items-center gap-1 max-lg:ml-auto">
                    {!hideActionCenter && (
                        <ActionCenter
                            actionConfigMap={actionCenterActionConfigMap}
                            onActionExecute={onActionCenterActionExecute}
                            dataState={actionCenterDataState}
                        />
                    )}

                    {(navItems.length > 0 || !hideQuickActions) && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button aria-label="Navigation menu" className={`p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors outline-none cursor-pointer${hideQuickActions ? ' lg:hidden' : ''}`}>
                                <Squares2X2Icon className="w-5 h-5" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-[320px] p-3"
                        >
                            <div className="space-y-4">
                                {/* Mobile Navigation List - Hidden on Desktop. Always rendered when
                                    navItems exist: on small screens this popover is the ONLY path to
                                    the main nav (the "Center Group" above is `hidden` below `lg`), so
                                    it must not be gated by hideQuickActions -- that prop only controls
                                    the app-grid/desktop-shortcuts sections below, never navigation
                                    itself (ST-940 grid-bugfixes: hideQuickActions used to hide this
                                    whole popover, which silently removed all nav on small screens for
                                    any caller -- e.g. dealer-hub -- that sets it without realizing the
                                    coupling). */}
                                {navItems.length > 0 && (
                                <div className="lg:hidden space-y-1">
                                    <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">Navigation</h3>
                                    {navItems.map((item, i) => (
                                        <Link
                                            key={i}
                                            to={item.path ?? item.label.toLowerCase()}
                                            className={`flex items-center gap-3 w-full p-2 rounded-xl text-sm font-medium transition-colors cursor-pointer focus-visible:outline focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${activeTab === item.label ? 'bg-accent text-foreground' : 'hover:bg-muted text-foreground'}`}
                                        >
                                            {normalizeNavIcon(item.icon)}
                                            {item.label}
                                        </Link>
                                    ))}
                                    <div className="h-px bg-border my-2 mx-1"></div>
                                </div>
                                )}

                                {!hideQuickActions && (
                                <>
                                {/* Mobile View: Categorized Grid */}
                                <div className="lg:hidden space-y-4">
                                    {[
                                        {
                                            title: "Platform",
                                            apps: [
                                                { icon: BriefcaseIcon, label: "My Work Space", color: "text-zinc-900", bg: "bg-brand-500", isHighlighted: true, onClick: onNavigateToWorkspace },
                                                { icon: HomeIcon, label: "Portal", color: "text-zinc-900 dark:text-brand-500", bg: "bg-brand-500/10", onClick: () => onNavigate('dashboard') },
                                            ]
                                        },
                                        {
                                            title: "Sales Tools",
                                            apps: [
                                                { icon: CalculatorIcon, label: "Quoting", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                                                { icon: WrenchScrewdriverIcon, label: "Configurator", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
                                                { icon: PhotoIcon, label: "Marketing", color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-500/10" },
                                            ]
                                        },
                                        {
                                            title: "Finance",
                                            apps: [
                                                { icon: CreditCardIcon, label: "Credit", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
                                                { icon: DocumentTextIcon, label: "Invoices", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
                                                { icon: BanknotesIcon, label: "Rebates", color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/10" },
                                            ]
                                        },
                                        {
                                            title: "Support",
                                            apps: [
                                                { icon: BookOpenIcon, label: "Academy", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-500/10" },
                                                { icon: ExclamationCircleIcon, label: "Service", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10" },
                                            ]
                                        }
                                    ].map((category, idx) => (
                                        <div key={idx}>
                                            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">{category.title}</h3>
                                            <div className="grid grid-cols-3 gap-2">
                                                {category.apps.map((app, i) => (
                                                    <button
                                                        key={i}
                                                        // @ts-expect-error - onClick is optional
                                                        onClick={app.onClick}
                                                        className={`relative flex flex-col items-center gap-2 p-2 rounded-2xl transition-all group outline-hidden focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-500 cursor-pointer ${
                                                            // @ts-expect-error - isHighlighted is optional
                                                            app.isHighlighted
                                                                ? 'ring-1 ring-gray-200 dark:ring-zinc-700 hover:bg-brand-600 hover:text-zinc-950 dark:hover:bg-brand-600 hover:shadow-md hover:ring-0'
                                                                : 'hover:bg-brand-600 hover:text-zinc-950 dark:hover:bg-brand-600 hover:shadow-md'
                                                            }`}>
                                                        {/* Badge */}
                                                        {/* @ts-expect-error - isHighlighted is optional */}
                                                        {app.isHighlighted && (
                                                            <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-white/20 text-zinc-900 text-[9px] font-bold shadow-sm backdrop-blur-sm">
                                                                New
                                                            </span>
                                                        )}
                                                        <div className={`p-2 rounded-2xl transition-all shadow-xs ${
                                                            // @ts-expect-error - isHighlighted is optional
                                                            app.isHighlighted
                                                                ? 'bg-brand-500 text-zinc-900 dark:bg-brand-500 dark:text-zinc-900 group-hover:bg-transparent group-hover:text-zinc-950'
                                                                : `${app.bg} ${app.color} group-hover:bg-transparent group-hover:text-zinc-950 group-hover:shadow-none`
                                                            }`}>
                                                            {normalizeNavIcon(app.icon as unknown as ReactNode)}
                                                        </div>
                                                        <span className={`text-[10px] font-semibold ${
                                                            // @ts-expect-error - isHighlighted is optional
                                                            app.isHighlighted
                                                                ? 'text-zinc-900'
                                                                : 'text-muted-foreground group-hover:text-zinc-950'
                                                            }`}>{app.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop View: Unified Grid without Titles - visibility via .navbar-desktop-quick-actions in libs/ui styles */}
                                <div className="navbar-desktop-quick-actions">
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { icon: BriefcaseIcon, label: "My Work Space", color: "text-zinc-900", bg: "bg-brand-500", isHighlighted: true, onClick: onNavigateToWorkspace },
                                            { icon: HomeIcon, label: "Portal", color: "text-zinc-900 dark:text-brand-500", bg: "bg-brand-500/10", onClick: () => onNavigate('dashboard') },
                                            { icon: CalculatorIcon, label: "Quoting", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                                            { icon: WrenchScrewdriverIcon, label: "Configurator", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-500/10" },
                                            { icon: PhotoIcon, label: "Marketing", color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-500/10" },
                                            { icon: CreditCardIcon, label: "Credit", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10" },
                                            { icon: DocumentTextIcon, label: "Invoices", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
                                            { icon: BanknotesIcon, label: "Rebates", color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-500/10" },
                                            { icon: BookOpenIcon, label: "Academy", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-500/10" },
                                            { icon: ExclamationCircleIcon, label: "Service", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-500/10" },
                                        ]
                                            .map((app, i) => (
                                                <button
                                                    key={i}
                                                    onClick={app.onClick}
                                                    className={`relative flex flex-col items-center gap-2 p-2 rounded-2xl transition-all group outline-hidden focus:ring-2 focus:ring-brand-600 dark:focus:ring-brand-500 cursor-pointer ${app.isHighlighted
                                                            ? 'ring-1 ring-gray-200 dark:ring-zinc-700 hover:bg-brand-600 hover:text-zinc-950 dark:hover:bg-brand-600 hover:shadow-md hover:ring-0'
                                                            : 'hover:bg-brand-600 hover:text-zinc-950 dark:hover:bg-brand-600 hover:shadow-md'
                                                        }`}>
                                                    {/* Badge */}
                                                    {app.isHighlighted && (
                                                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md bg-foreground text-background text-[9px] font-bold shadow-sm">
                                                            New
                                                        </span>
                                                    )}
                                                    <div className={`p-2 rounded-2xl ${app.bg} ${app.color} transition-all shadow-xs ${app.isHighlighted
                                                            ? 'bg-brand-500 text-zinc-900 dark:bg-brand-500 dark:text-zinc-900 group-hover:bg-transparent group-hover:text-zinc-950'
                                                            : 'group-hover:bg-transparent group-hover:text-zinc-950 group-hover:shadow-none'
                                                        }`}>
                                                        {normalizeNavIcon(app.icon as unknown as ReactNode)}
                                                    </div>
                                                    <span className={`text-[10px] font-semibold ${app.isHighlighted
                                                            ? 'text-zinc-900'
                                                            : 'text-muted-foreground group-hover:text-zinc-950'
                                                        }`}>{app.label}</span>
                                                </button>
                                            ))}
                                        {/* More Button - Desktop Only */}
                                        <button className="relative flex flex-col items-center gap-2 p-2 rounded-2xl transition-all group outline-hidden hover:bg-brand-600 hover:text-zinc-950 dark:hover:bg-brand-600 hover:shadow-md cursor-pointer">
                                            <div className="p-2 rounded-2xl bg-muted text-muted-foreground group-hover:bg-transparent group-hover:text-zinc-950 transition-all shadow-xs">
                                                <EllipsisHorizontalIcon className="w-6 h-6" />
                                            </div>
                                            <span className="text-[10px] font-semibold text-muted-foreground group-hover:text-zinc-950">More</span>
                                        </button>
                                    </div>
                                </div>
                                </>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                    )}

                    <button onClick={toggleTheme} className="hidden !flex p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                        {theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
                    </button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-muted transition-colors text-left outline-hidden cursor-pointer"
                            >
                                <div className="mr-1 hidden max-w-[140px] flex-col items-end sm:flex lg:hidden">
                                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-none">Tenant</span>
                                    <span className="w-full truncate text-right text-sm font-bold leading-tight text-foreground">{currentTenant}</span>
                                </div>
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 text-xs font-bold text-white shadow-sm">
                                    {userInitials}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{userName}</p>
                                    <p className="text-xs text-muted-foreground">{userRole}</p>
                                </div>
                                <ChevronDownIcon className="h-3 w-3 text-muted-foreground" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            sideOffset={8}
                            className="w-56 rounded-xl border border-border bg-navbar/95 p-0 text-foreground shadow-xl backdrop-blur-xl"
                        >
                            <DropdownMenuLabel className="border-b border-border px-4 py-2 font-normal">
                                <p className="text-sm font-medium">{userName}</p>
                                <p className="text-xs text-muted-foreground">{userRole}</p>
                            </DropdownMenuLabel>

                            {!hideTenantSwitcher && (
                                <>
                                    <div className="px-2 py-1 lg:hidden">
                                        <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Switch Tenant</p>
                                        {tenants.map((tenant) => (
                                            <DropdownMenuItem
                                                key={tenant}
                                                className="flex cursor-pointer items-center justify-between gap-2 text-xs"
                                                onSelect={() => setTenant(tenant)}
                                            >
                                                <span>{tenant}</span>
                                                {currentTenant === tenant && (
                                                    <CheckIcon className="h-3 w-3 shrink-0 text-brand-600 dark:text-brand-500" />
                                                )}
                                            </DropdownMenuItem>
                                        ))}
                                    </div>

                                    <DropdownMenuSeparator className="my-1 bg-border lg:hidden" />
                                </>
                            )}

                            <DropdownMenuItem className="cursor-pointer text-xs lg:hidden" onSelect={() => toggleTheme()}>
                                {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
                                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                            </DropdownMenuItem>

                            {onChangePassword != null && (
                                <>
                                    <DropdownMenuItem
                                        className="cursor-pointer text-sm"
                                        onSelect={() => onChangePassword()}
                                    >
                                        <KeyIcon className="h-4 w-4" />
                                        Change Password
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="my-1 bg-border" />
                                </>
                            )}

                            <DropdownMenuItem
                                variant="destructive"
                                className="cursor-pointer text-sm"
                                onSelect={() => onLogout()}
                            >
                                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                                Sign Out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
