import { useNavigate } from 'react-router-dom';
import { Layout } from './layout';
import type { ReactNode } from 'react';
import { ActionCenterActionConfigMap, ActionCenterActionHandler, ActionCenterDataState } from './action-center/types';


export interface NavItem {
  label: string;
  icon: ReactNode;
  path: string;
}

export interface PageLayoutProps {
  heading: ReactNode;
  subheading?: ReactNode;
  headerActions?: ReactNode;
  navItems?: NavItem[];
  /** Current active nav item label for sidebar highlighting. When not provided, derived from route. */
  activeTab?: string;
  logoLight?: string;
  logoDark?: string;
  headingClassName?: string;
  /** Custom className for content wrapper. Defaults to 'max-w-7xl mx-auto space-y-6' */
  contentClassName?: string;
  /** Custom className for container wrapper. Defaults to 'pt-20 lg:pt-24 bg-background px-4 sm:px-6 lg:px-8 min-h-screen' */
  containerClassName?: string;
  /** Custom className for the outer wrapper around navbar + content. Defaults to 'container mx-auto'. */
  outerContainerClassName?: string;
  children: ReactNode;
  onLogout?: () => void;
  onNavigateToWorkspace?: () => void;
  actionCenterActionConfigMap?: ActionCenterActionConfigMap;
  onActionCenterActionExecute?: ActionCenterActionHandler;
  actionCenterDataState?: ActionCenterDataState;
  /** Passed through to Layout / ExperiencesNavbar. */
  hideActionCenter?: boolean;
  /** Passed through to Layout / ExperiencesNavbar. */
  hideQuickActions?: boolean;
  /** Passed through to Layout / ExperiencesNavbar. */
  hideTenantSwitcher?: boolean;
  /** Current user's name. Passed through to Layout / ExperiencesNavbar. */
  userName?: string;
  /** Current user's role. Passed through to Layout / ExperiencesNavbar. */
  userRole?: string;
  /** Passed through to Layout / ExperiencesNavbar. When set, shows Change Password in the user menu. */
  onChangePassword?: () => void;
}

export function PageLayout({
  heading,
  subheading,
  headerActions,
  navItems = [],
  activeTab,
  logoLight,
  logoDark,
  headingClassName,
  contentClassName,
  containerClassName,
  outerContainerClassName,
  children,
  onLogout = () => {
    /* default no-op */
  },
  onNavigateToWorkspace = () => {
    /* default no-op */
  },
  actionCenterActionConfigMap,
  onActionCenterActionExecute,
  actionCenterDataState,
  hideActionCenter = false,
  hideQuickActions = false,
  hideTenantSwitcher = false,
  userName,
  userRole,
  onChangePassword,
}: PageLayoutProps) {
  const navigate = useNavigate();

  const handleNavigation = (page: string) => {
    // If the input is a path, navigate directly
    if (page.startsWith('/')) {
      navigate(page);
      return;
    }

    // Find the item by label
    const item = navItems.find((nav) => nav.label === page);
    if (item) {
      navigate(item.path);
    } else {
      console.warn(`Navigation item not found for label: ${page}`);
    }
  };

  return (
    <Layout
      heading={heading}
      headingClassName={headingClassName}
      contentClassName={contentClassName}
      containerClassName={containerClassName}
      outerContainerClassName={outerContainerClassName}
      subheading={subheading}
      headerActions={headerActions}
      navItems={navItems.map((item) => ({
        label: item.label,
        icon: item.icon,
        path: item.path,
      }))}
      activeTab={activeTab}
      onLogout={onLogout}
      onNavigateToWorkspace={onNavigateToWorkspace}
      onNavigate={handleNavigation}
      actionCenterActionConfigMap={actionCenterActionConfigMap}
      onActionCenterActionExecute={onActionCenterActionExecute}
      actionCenterDataState={actionCenterDataState}
      logoLight={logoLight}
      logoDark={logoDark}
      hideActionCenter={hideActionCenter}
      hideQuickActions={hideQuickActions}
      hideTenantSwitcher={hideTenantSwitcher}
      userName={userName}
      userRole={userRole}
      onChangePassword={onChangePassword}
    >
      {children}
    </Layout>
  );
}
