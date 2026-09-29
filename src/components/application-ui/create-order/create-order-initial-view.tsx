import { Badge } from '../badge';
import { Button } from '../button';
import { Card, CardContent } from '../card';
import { DialogDescription, DialogHeader, DialogTitle } from '../../overlays/dialog';
import { ArrowRight, ArrowUpFromLine, Copy, Edit, FileText } from 'lucide-react';

export interface CreateOrderInitialViewProps {
  onSelectQuote: () => void;
  onSelectTemplate?: () => void;
  onSelectManualCreation: () => void;
  onSelectImportFile?: () => void;
  theme?: 'light' | 'dark';
}

export function CreateOrderInitialView({
  onSelectQuote,
  onSelectTemplate,
  onSelectManualCreation,
  onSelectImportFile,
}: CreateOrderInitialViewProps): React.ReactElement {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New Order</DialogTitle>
        <DialogDescription>
          Choose how you would like to start this order. Select the option that best fits your current workflow.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {/* Import Files */}
        <Card className="flex flex-col">
          <CardContent className="p-4 flex flex-col gap-3 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <ArrowUpFromLine className="size-10" />
              </div>
              <Badge variant="soft" className={`shrink-0 bg-white/10 dark:bg-black/10 rounded-xl px-2 py-1`}>
                3-5 minutes
              </Badge>
            </div>
            <h3 className="font-semibold text-foreground">Import Files</h3>
            <p className="text-sm text-muted-foreground">
              Import order data from Excel, CSV, or PDF files. Ideal for bulk orders or external sources.
            </p>
            <Button
              variant="default"
              className="mt-auto cursor-pointer w-full"
              onClick={() => onSelectImportFile?.()}
            >
              Upload Files
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>

        {/* From Quote */}
        <Card className="flex flex-col">
          <CardContent className="p-4 flex flex-col gap-3 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">
                <FileText className="size-10" />
              </div>
              <Badge variant="soft" className={`shrink-0 bg-white/10 dark:bg-black/10 rounded-xl px-2 py-1`}>
                2-3 minutes
              </Badge>
            </div>
            <h3 className="font-semibold text-foreground">From Quote</h3>
            <p className="text-sm text-muted-foreground">
              Convert an accepted quote directly into a purchase order. All details are automatically transferred.
            </p>
            <Button variant="default" className="mt-auto cursor-pointer w-full" onClick={onSelectQuote}>
              Select Quote
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>

        {/* From Template */}
        <Card className="flex flex-col">
          <CardContent className="p-4 flex flex-col gap-3 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400">
                <Copy className="size-10" />
              </div>
              <Badge variant="soft" className={`shrink-0 bg-white/10 dark:bg-black/10 rounded-xl px-2 py-1`}>
                5-8 minutes
              </Badge>
            </div>
            <h3 className="font-semibold text-foreground">From Template</h3>
            <p className="text-sm text-muted-foreground">
              Use a pre-configured template or previous order as a starting point. Perfect for recurring orders.
            </p>
            <Button
              variant="default"
              className="mt-auto cursor-pointer w-full"
              onClick={() => onSelectTemplate?.()}
            >
              Browse Templates
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Manual Creation */}
        <Card className="flex flex-col">
          <CardContent className="p-4 flex flex-col gap-3 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-zinc-500/20 text-zinc-600 dark:text-zinc-400">
                <Edit className="size-10" />
              </div>
              <Badge variant="soft" className={`shrink-0 bg-white/10 dark:bg-black/10 rounded-xl px-2 py-1`}>
                10-15 minutes
              </Badge>
            </div>
            <h3 className="font-semibold text-foreground">Manual Creation</h3>
            <p className="text-sm text-muted-foreground">
              Create an order from scratch by entering all details manually. Best for custom or unique orders.
            </p>
            <Button variant="default" className="mt-auto cursor-pointer w-full" onClick={onSelectManualCreation}>
              Start Manual Creation
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
