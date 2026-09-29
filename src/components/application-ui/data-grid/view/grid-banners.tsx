"use client";
import * as React from 'react';
import { Button } from '@/components/application-ui/button';
import { Alert, AlertDescription } from '@/components/overlays/alert';
import { DataGridFindBar } from '../DataGridFindBar';

export interface GridBannersProps {
  /** True when "select all N matching" is offered: serverSide + a numeric totalRowCount. */
  canSelectAllMatching: boolean;
  /** True once the user took that offer. */
  allMatchingSelected: boolean;
  /** Rows checked on the current page. */
  selectedCount: number;
  /** True when every selectable row on this page is checked. */
  pageFullySelected: boolean;
  totalRowCount?: number;
  onSelectAllMatching: () => void;
  onClearSelection: () => void;
  findOpen: boolean;
  enableFind: boolean;
  findQuery: string;
  findMatchCount: number;
  findActiveMatchIndex: number;
  onFindQueryChange: (query: string) => void;
  onFindNext: () => void;
  onFindPrevious: () => void;
  onFindClose: () => void;
  viewSaveError?: string;
  viewPartialRestoreNotice?: string[];
  onDismissViewPartialRestoreNotice?: () => void;
}

export function GridBanners({
  canSelectAllMatching,
  allMatchingSelected,
  selectedCount,
  pageFullySelected,
  totalRowCount,
  onSelectAllMatching,
  onClearSelection,
  findOpen,
  enableFind,
  findQuery,
  findMatchCount,
  findActiveMatchIndex,
  onFindQueryChange,
  onFindNext,
  onFindPrevious,
  onFindClose,
  viewSaveError,
  viewPartialRestoreNotice,
  onDismissViewPartialRestoreNotice,
}: GridBannersProps) {
  return (
    <>
      {viewPartialRestoreNotice && viewPartialRestoreNotice.length > 0 && (
        <Alert variant="warning" className="mx-4 mt-2">
          <AlertDescription>
            This view was restored without {viewPartialRestoreNotice.length} column
            {viewPartialRestoreNotice.length === 1 ? '' : 's'} that no longer exist: {viewPartialRestoreNotice.join(', ')}.
            {onDismissViewPartialRestoreNotice && (
              <Button variant="ghost" size="sm" onClick={onDismissViewPartialRestoreNotice} className="ml-2">
                Dismiss
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
      {viewSaveError && (
        <Alert variant="destructive" className="mx-4 mt-2">
          <AlertDescription>{viewSaveError}</AlertDescription>
        </Alert>
      )}
      {canSelectAllMatching && !allMatchingSelected && selectedCount > 0 && pageFullySelected && (
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2 text-sm">
          <span>{selectedCount} on this page selected.</span>
          <Button variant="link" size="sm" className="h-auto p-0" onClick={onSelectAllMatching}>
            Select all {totalRowCount} matching
          </Button>
        </div>
      )}
      {allMatchingSelected && (
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2 text-sm">
          <span>All {totalRowCount} matching records selected.</span>
          <Button variant="link" size="sm" className="h-auto p-0" onClick={onClearSelection}>
            Clear selection
          </Button>
        </div>
      )}
      {findOpen && enableFind && (
        <DataGridFindBar
          query={findQuery}
          matchCount={findMatchCount}
          activeMatchIndex={findActiveMatchIndex}
          onQueryChange={onFindQueryChange}
          onNext={onFindNext}
          onPrevious={onFindPrevious}
          onClose={onFindClose}
        />
      )}
    </>
  );
}
