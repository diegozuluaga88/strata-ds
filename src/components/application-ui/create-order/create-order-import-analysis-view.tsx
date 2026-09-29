import { Badge } from '../badge';
import { Button } from '../button';
import { DialogDescription, DialogHeader, DialogTitle } from '../../overlays/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table';
import { cn } from '@/utils';
import { ArrowLeft, CheckCircle, FileText } from 'lucide-react';
import type { ImportOrderAnalysisResult } from './types';
import { formatCurrency } from './utils';

export interface CreateOrderImportAnalysisViewProps {
  analysis: ImportOrderAnalysisResult;
  onBack: () => void;
  onClose: () => void;
  onTryDifferentFile: () => void;
  onContinueToOrderCreation: () => void;
}

export function CreateOrderImportAnalysisView({
  analysis,
  onBack,
  onTryDifferentFile,
  onContinueToOrderCreation,
}: CreateOrderImportAnalysisViewProps): React.ReactElement {
  return (
    <>
      <DialogHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 cursor-pointer text-foreground"
              onClick={onBack}
              aria-label="Back"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <DialogTitle className="text-foreground">Import Order From File</DialogTitle>
          </div>
        </div>
        <DialogDescription>
          Upload a PDF, CSV, or Excel file to auto-generate your order.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4 space-y-4 bg-card rounded-xl">
        {/* Analysis status card */}
        <div
          className={cn(
            'flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-border bg-card',
            'border-none',
          )}
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-500/20">
            <FileText className="size-5 text-green-400" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">Analysis Complete</p>
            <p className="text-sm text-muted-foreground">
              Extracted {analysis.itemCount} items from &quot;{analysis.fileName}&quot;
            </p>
          </div>
          <Badge variant="soft" className="shrink-0 gap-1 bg-green-500 dark:bg-green-900 p-2 rounded-full text-white">
            <CheckCircle className="size-3" aria-hidden />
            {analysis.confidence}
          </Badge>
        </div>

        {/* Detected customer and Order details: two columns */}
        <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-4 p-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Detected Customer
            </p>
            <p className="font-semibold text-foreground">{analysis.customerName}</p>
            <p className="text-sm text-muted-foreground">{analysis.address}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Order Details
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">PO Number:</span>
                <span className="font-semibold text-foreground">{analysis.poNumber}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Req. Date:</span>
                <span className="font-semibold text-foreground">{analysis.requestedDate}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line items table */}
        <div className="overflow-hidden pb-4">
          <Table>
            <TableHeader className="bg-foreground/15">
              <TableRow>
                <TableHead className="text-foreground uppercase text-xs">Item Description</TableHead>
                <TableHead className="text-foreground uppercase text-xs w-36">Qty</TableHead>
                <TableHead className="text-foreground uppercase text-xs w-46">Price</TableHead>
                <TableHead className="text-foreground uppercase text-xs w-60 text-center">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysis.lineItems.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium !text-foreground">{item.description}</TableCell>
                  <TableCell className="!text-foreground">{item.qty}</TableCell>
                  <TableCell className="!text-foreground">{formatCurrency(item.price)}</TableCell>
                  <TableCell className="flex items-center gap-1 text-center !text-foreground">
                    <div className="flex items-center justify-center w-full gap-2">
                      {formatCurrency(item.total)}
                      <CheckCircle className="size-4 shrink-0 text-emerald-500" aria-hidden />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

      </div>
      {/* Footer actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 justify-end">
        <Button
          type="button"
          variant="ghost"
          className="text-black dark:text-brand-400 border-brand-400 bg-brand-400/10 cursor-pointer"
          onClick={onTryDifferentFile}
        >
          Try a Different File
        </Button>
        <Button
          type="button"
          variant="default"
          className="cursor-pointer flex-1 sm:flex-none"
          onClick={onContinueToOrderCreation}
        >
          Continue to Order Creation
        </Button>
      </div>
    </>
  );
}
