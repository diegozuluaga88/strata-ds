/**
 * RecipeDetailView — single-recipe surface for the sidebar's "Recipes" section.
 *
 * Each recipe is a real-world composition (extracted from production UI-Dealer /
 * inbound-outbound code, re-implemented LAWS-compliant) demonstrating how to
 * combine multiple DS primitives into a functional layout. Unlike the previous
 * ExamplesView (tab-based), this view renders exactly one recipe driven by the
 * sidebar nav id (`recipe-<slug>`).
 */

import type * as React from 'react';
import {
  TransactionsListWithFiltersExample,
  DashboardKpiGridExample,
  AckReconciliationModalExample,
  SifGeneratorExample,
} from '@/examples';

interface RecipeEntry {
  id: string;
  title: string;
  description: string;
  combines: string[];
  source: string;
  Component: () => React.JSX.Element;
}

const RECIPES: Record<string, RecipeEntry> = {
  'sif-generator': {
    id: 'sif-generator',
    title: 'SIF Generator (Quote Converter)',
    description:
      'Full document-processing view: status filter pills, search toolbar, document table, multi-step upload modal, and document review modal with field sections. Promoted from inbound-outbound F26.A primitives.',
    combines: [
      'FilterPills',
      'FileUploadModal',
      'DocumentReviewModal',
      'FieldSection',
      'ConfidenceIndicator',
      'Badge',
      'Input',
      'Button',
    ],
    source: 'inbound-outbound/src/QuoteConverter.tsx',
    Component: SifGeneratorExample,
  },
  'transactions-list': {
    id: 'transactions-list',
    title: 'Transactions list with filters',
    description:
      'Table with status pills, search, multi-select, bulk actions, and pagination. The canonical "data list" pattern across operational views.',
    combines: ['Table', 'Badge', 'Input', 'Checkbox', 'Button'],
    source: 'UI-Dealer/src/Transactions.tsx',
    Component: TransactionsListWithFiltersExample,
  },
  'ack-reconciliation': {
    id: 'ack-reconciliation',
    title: 'ACK Reconciliation modal',
    description:
      'Multi-step modal (Dialog + Stepper + Table + Form). Reference for any wizard or workflow with discrete progress states.',
    combines: ['Dialog', 'Button', 'Table', 'Input', 'Badge'],
    source: 'UI-Dealer/src/components/AckReconciliationModal.tsx',
    Component: AckReconciliationModalExample,
  },
  'dashboard-kpi': {
    id: 'dashboard-kpi',
    title: 'Dashboard KPI grid',
    description:
      'Responsive 4-column KPI grid with trend deltas (Card + status icon container + brand numbers + Badge for recent activity).',
    combines: ['Card', 'Badge', 'Button'],
    source: 'UI-Dealer/src/Dashboard.tsx',
    Component: DashboardKpiGridExample,
  },
};

export function RecipeDetailView({ id }: { id: string }) {
  const recipe = RECIPES[id];

  if (!recipe) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-status-warning">
          Recipe not found
        </p>
        <h1 className="text-3xl font-bold text-foreground">"{id}"</h1>
        <p className="text-muted-foreground">
          This recipe is not registered. Available ids:{' '}
          {Object.keys(RECIPES).map((k) => (
            <code key={k} className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground mr-1">
              {k}
            </code>
          ))}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-status-ai">
          Composed pattern · LAWS-compliant
        </p>
        <h1 className="font-brand text-4xl font-bold text-foreground">{recipe.title}</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">{recipe.description}</p>
      </header>

      {/* Metadata */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <article className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pattern
          </h2>
          <p className="text-sm text-foreground">{recipe.title}</p>
        </article>
        <article className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Combines
          </h2>
          <div className="flex flex-wrap gap-1">
            {recipe.combines.map((c) => (
              <code
                key={c}
                className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground"
              >
                {c}
              </code>
            ))}
          </div>
        </article>
        <article className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Source
          </h2>
          <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">
            {recipe.source}
          </code>
        </article>
      </section>

      {/* Live preview */}
      <article className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        <recipe.Component />
      </article>

      {/* Footer */}
      <footer className="bg-muted rounded-lg px-4 py-3 text-xs text-muted-foreground">
        Source code:{' '}
        <code className="font-mono bg-card px-1.5 py-0.5 rounded text-foreground">
          src/examples/{recipe.id}.tsx
        </code>{' '}
        — copy as a starting point for your own composition.
      </footer>
    </div>
  );
}
