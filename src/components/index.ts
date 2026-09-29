// App-level components barrel — re-exports all .tsx components and types (excludes .stories)

export * from './Navbar';
export * from './ThemeProvider';
// Removed: export * from './theme-tokens-provider';
// Audit (ds-component-map F22.B): no consumer project imports ThemeTokensProvider
// or useThemeTokens from strata-design-system. The file stays on disk for future
// use but is no longer surfaced via the public barrel. Re-add the line if a
// consumer needs the API.

// application-ui
export * from './application-ui/action-center';
export * from './application-ui/activity-timeline';
export * from './application-ui/aspect-ratio';
export * from './application-ui/avatar';
export * from './application-ui/badge';
export * from './application-ui/banner';
export * from './application-ui/breadcrumb';
export * from './application-ui/button';
export * from './application-ui/copy-button';
export * from './application-ui/calendar';
export * from './application-ui/card';
export * from './application-ui/carousel';
export * from './application-ui/chart';
export * from './application-ui/collapsible';
export * from './application-ui/command';
export * from './application-ui/company-greeting';
export * from './application-ui/divider';
export * from './application-ui/experiences-navbar';
export * from './application-ui/feature-section';
export * from './application-ui/filter-panel';
export * from './application-ui/filter-pills';
export * from './application-ui/data-list-toolbar';
export * from './application-ui/data-grid';
export * from './application-ui/data-list-table';
export * from './application-ui/data-list-card';
export * from './application-ui/editable-line-table';
export * from './application-ui/view-toggle';
export * from './application-ui/strata-top-bar';
export * from './application-ui/funnel-stepper';
export * from './application-ui/kanban-funnel';
export * from './application-ui/discrepancy-row';
export * from './application-ui/bulk-action-bar';
export * from './application-ui/heading';
export * from './application-ui/hero-section';
export * from './application-ui/hover-card';
export * from './application-ui/info-banner';
export * from './application-ui/kpi-card';
export { Label } from './application-ui/label';
export * from './application-ui/layout';
export * from './application-ui/link';
export * from './application-ui/list-toolbar';
export * from './application-ui/menubar';
export * from './application-ui/navbar';
export * from './application-ui/navigation-menu';
export * from './application-ui/page-header';
export * from './application-ui/page-layout';
export * from './application-ui/pagination';
export * from './application-ui/pricing';
export { PriorityBadge } from './application-ui/priority-badge';
export * from './application-ui/product-list';
export * from './application-ui/product-overview';
export * from './application-ui/progress';
export * from './application-ui/section-card';
export * from './application-ui/section-toolbar';
export * from './application-ui/separator';
export * from './application-ui/shared-catalog-card';
export * from './application-ui/shared-inventory-card';
export * from './application-ui/shared-order-card';
export * from './application-ui/shopping-cart';
export * from './application-ui/skeleton';
export * from './application-ui/stage-progress';
export * from './application-ui/status-badge';
export * from './application-ui/table';
export * from './application-ui/table-empty-state';
export * from './application-ui/tabs';
export * from './application-ui/text';
export * from './application-ui/toggle';
export * from './application-ui/toggle-group';
export * from './application-ui/tracking';

// application-ui/action-center subcomponents and types
export * from './application-ui/action-center/ActionCenter';
export * from './application-ui/action-center/ChatView';
export * from './application-ui/action-center/FilterTabs';
export * from './application-ui/action-center/NotificationItem';
export * from './application-ui/action-center/types';

// application-ui/create-order components and types
export * from './application-ui/create-order';
export * from './application-ui/create-order/create-order-dialog';
export * from './application-ui/create-order/create-order-draft-view';
export * from './application-ui/create-order/create-order-import-analysis-view';
export * from './application-ui/create-order/create-order-import-file-view';
export * from './application-ui/create-order/create-order-initial-view';
export * from './application-ui/create-order/create-order-manual-creation-view';
export * from './application-ui/create-order/create-order-processing-view';
export * from './application-ui/create-order/create-order-select-quote-view';
export * from './application-ui/create-order/create-order-select-template-view';
export * from './application-ui/create-order/line-items-card';
export * from './application-ui/create-order/order-file-dropzone';
export * from './application-ui/create-order/types';
export * from './application-ui/create-order/types/approved-quote';
export * from './application-ui/create-order/types/create-order-dialog';
export * from './application-ui/create-order/types/import-analysis';
export * from './application-ui/create-order/types/manual-order';
export * from './application-ui/create-order/types/order-template';

// forms
export * from './forms/checkbox';
export * from './forms/combobox';
export * from './forms/date-picker';
export { Field, FieldDescription, FieldError, FieldLabel, type FieldDescriptionProps, type FieldErrorProps, type FieldLabelProps, type FieldProps } from './forms/field';
export * from './forms/fieldset';
export * from './forms/form';
export * from './forms/input';
export * from './forms/input-otp';
export * from './forms/listbox';
export * from './forms/radio-group';
export * from './forms/searchable-multi-select';
export * from './forms/select';
export * from './forms/slider';
export * from './forms/switch';
export * from './forms/textarea';

// overlays
export * from './overlays/alert';
export * from './overlays/alert-dialog';
export * from './overlays/confirm-dialog';
export * from './overlays/context-menu';
export * from './overlays/dialog';
export * from './overlays/drawer';
export * from './overlays/dropdown-menu';
export * from './overlays/feedback-toast';
export * from './overlays/file-upload-modal';
export * from './overlays/document-review-modal';
export * from './overlays/split-pane-review-modal';
export * from './overlays/popover';
export * from './overlays/resizable';
export * from './overlays/scroll-area';
export * from './overlays/sheet';
export * from './overlays/sidebar';
export * from './overlays/slide-over';
export * from './overlays/sonner';
export * from './overlays/tooltip';

// data-visualization
export * from './data-visualization/accordion';
export * from './data-visualization/description-list';
export * from './data-visualization/disclosure';
export * from './data-visualization/shelf-view';
export * from './data-visualization/empty-state';
export * from './data-visualization/stacked-list';

// Contextos · el Storybook de Avanto los expone en su entrada publica y el
// experiences-navbar depende de useTenant. Aqui viajan por el barril, que es
// la entrada de la libreria en este repo.
export {
  TenantProvider,
  useTenant,
  type TenantProviderProps,
  type TenantDetails,
  type RoleDetails,
  type UserDetails,
  type TenantWithRoles,
} from '../contexts/TenantContext';
