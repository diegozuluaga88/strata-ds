import type { ReactNode } from 'react';
import { PageHeader } from './page-header';
import { ExperiencesNavbar, ExperiencesNavItemProps } from './experiences-navbar';
import { ActionCenterActionConfigMap, ActionCenterActionHandler, ActionCenterDataState } from './action-center/types';
import { cn } from '@/utils';


export interface LayoutProps {
  heading: ReactNode;
  subheading?: ReactNode;
  headerActions?: ReactNode;
  navItems: ExperiencesNavItemProps[];
  children: ReactNode;
  onLogout: () => void;
  onNavigateToWorkspace: () => void;
  onNavigate: (page: string) => void;
  actionCenterActionConfigMap?: ActionCenterActionConfigMap;
  onActionCenterActionExecute?: ActionCenterActionHandler;
  actionCenterDataState?: ActionCenterDataState;
  activeTab?: string;
  /** Logo for light theme (e.g. logo-black.png). */
  logoLight?: string;
  /** Logo for dark theme (e.g. logo-white.png). */
  logoDark?: string;
  headingClassName?: string;
  /** Custom className for content wrapper. Defaults to 'max-w-7xl mx-auto space-y-6' */
  contentClassName?: string;
  /** Custom className for container wrapper. Defaults to 'pt-20 lg:pt-24 bg-background px-4 sm:px-6 lg:px-8 min-h-screen' */
  containerClassName?: string;
  /** Custom className for the outer wrapper around navbar + content. Defaults to 'container mx-auto'. */
  outerContainerClassName?: string;
  /** Passed through to ExperiencesNavbar. */
  hideActionCenter?: boolean;
  /** Passed through to ExperiencesNavbar. */
  hideQuickActions?: boolean;
  /** Passed through to ExperiencesNavbar. */
  hideTenantSwitcher?: boolean;
  /** Current user's name. Passed through to ExperiencesNavbar. */
  userName?: string;
  /** Current user's role. Passed through to ExperiencesNavbar. */
  userRole?: string;
  /** Passed through to ExperiencesNavbar. When set, shows Change Password in the user menu. */
  onChangePassword?: () => void;
}

export function Layout({
  heading,
  subheading,
  headerActions,
  navItems,
  children,
  onLogout,
  onNavigateToWorkspace,
  onNavigate,
  actionCenterActionConfigMap,
  onActionCenterActionExecute,
  actionCenterDataState,
  activeTab,
  logoLight,
  logoDark,
  headingClassName,
  contentClassName,
  containerClassName = 'pt-20 lg:pt-24 bg-background px-4 sm:px-6 lg:px-8 min-h-screen',
  outerContainerClassName = 'container mx-auto',
  hideActionCenter = false,
  hideQuickActions = false,
  hideTenantSwitcher = false,
  userName,
  userRole,
  onChangePassword,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-6">
      <div className={outerContainerClassName}>
        <ExperiencesNavbar
          navItems={navItems}
          onLogout={onLogout}
          onNavigateToWorkspace={onNavigateToWorkspace}
          onNavigate={onNavigate}
          actionCenterActionConfigMap={actionCenterActionConfigMap}
          onActionCenterActionExecute={onActionCenterActionExecute}
          actionCenterDataState={actionCenterDataState}
          activeTab={activeTab}
          logoLight={logoLight}
          logoDark={logoDark}
          hideActionCenter={hideActionCenter}
          hideQuickActions={hideQuickActions}
          hideTenantSwitcher={hideTenantSwitcher}
          userName={userName}
          userRole={userRole}
          onChangePassword={onChangePassword}
        />
        <div className={containerClassName}>
          <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between max-w-7xl mx-auto', headingClassName)}>
            <div>
              <PageHeader heading={heading} subheading={subheading ?? ''} />
            </div>
            {headerActions != null && (
              <div className="shrink-0 flex flex-col items-end gap-4">{headerActions}</div>
            )}
          </div>
          <div className={cn('max-w-7xl mx-auto space-y-6', contentClassName)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
