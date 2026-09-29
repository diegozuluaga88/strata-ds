import { Badge } from '../badge';
import { Button } from '../button';
import { Card, CardContent } from '../card';
import { DialogDescription, DialogHeader, DialogTitle } from '../../overlays/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../table';
import { ArrowLeft, Copy, Edit, FileText } from 'lucide-react';
import type { ApprovedQuote } from './types';
import { formatCurrency } from './utils';

export interface CreateOrderDraftViewProps {
  selectedQuote: ApprovedQuote;
  onReviewAdapt: () => void;
  onConfirmCreate: () => void;
  onBack?: () => void;
  theme?: 'light' | 'dark';
}

export function CreateOrderDraftView({
  selectedQuote,
  onReviewAdapt,
  onConfirmCreate,
  onBack,
}: CreateOrderDraftViewProps): React.ReactElement {
  return (
    <>
      <DialogHeader>
        <DialogTitle>
          <div className="flex items-center gap-2">
            {onBack && (
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
            )}
            <span className="text-foreground">Select Approved Quote</span>
          </div>
        </DialogTitle>
        <DialogDescription>Choose an approved quote to convert into a purchase order.</DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 mb-1">
                <Copy className="size-5" />
              </div>
              <span className="text-lg font-medium uppercase text-foreground">CUSTOMER</span>
            </div>
            <span className="font-medium text-foreground">{selectedQuote.customer}</span>
            <span className="text-sm text-muted-foreground">{selectedQuote.project}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 mb-1">
                <Copy className="size-5" />
              </div>
              <span className="text-lg font-medium uppercase text-foreground">TOTAL VALUE</span>
            </div>
            <span className="font-medium text-foreground">{formatCurrency(selectedQuote.value)}</span>
            <span className="text-sm text-muted-foreground">PO-FROM-{selectedQuote.quoteId.toUpperCase()}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400 mb-1">
                <Copy className="size-5" />
              </div>
              <span className="text-lg font-medium uppercase text-foreground">REQUESTED DATE</span>
            </div>
            <span className="font-medium text-foreground">
              {selectedQuote.requestedDate ?? selectedQuote.date}
            </span>
            <span className="text-sm text-muted-foreground">{selectedQuote.deliveryType ?? '—'}</span>
          </CardContent>
        </Card>
      </div>
      <div className="mt-6">
        <div className="flex items-center justify-between gap-2 py-4 px-4 bg-card rounded-t-xl">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <FileText className="size-4" />
            Order Items
          </h3>
          <Badge variant="solid" color="green" className="bg-green-900 text-white rounded-xl">
            <span className="font-medium">All items in stock</span>
          </Badge>
        </div>
        <div className="rounded-b-lg border border-border overflow-hidden">
          <Table className="bg-card">
            <TableHeader className={`bg-white/10 dark:bg-black/10 text-foreground`}>
              <TableRow>
                <TableHead className="font-medium">DESCRIPTION</TableHead>
                <TableHead className="font-medium">QTY</TableHead>
                <TableHead className="font-medium">PRICE</TableHead>
                <TableHead className="font-medium text-right">TOTAL</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(selectedQuote.items ?? []).map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium text-foreground dark:text-foreground">
                    {item.description}
                  </TableCell>
                  <TableCell className="font-medium text-foreground dark:text-foreground">{item.qty}</TableCell>
                  <TableCell className="font-medium text-foreground dark:text-foreground">
                    {formatCurrency(item.price)}
                  </TableCell>
                  <TableCell className="font-medium text-foreground dark:text-foreground text-right">
                    {formatCurrency(item.total)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={4} className="font-medium text-foreground dark:text-foreground text-right">
                  Total {formatCurrency(selectedQuote.value)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 justify-end mt-6 pt-4 border-t border-border">
        <Button
          type="button"
          variant="ghost"
          className="text-black dark:text-brand-400 border-brand-400 bg-brand-400/10 cursor-pointer"
          onClick={onReviewAdapt}
        >
          <Edit className="size-4" />
          Review & Adapt Details
        </Button>
        <Button type="button" variant="default" className="cursor-pointer" onClick={onConfirmCreate}>
          Confirm & Create Order
        </Button>
      </div>
    </>
  );
}
