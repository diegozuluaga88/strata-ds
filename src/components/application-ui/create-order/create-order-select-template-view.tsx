import { Badge } from '../badge';
import { Button } from '../button';
import { Card, CardContent } from '../card';
import { DialogDescription, DialogHeader, DialogTitle } from '../../overlays/dialog';
import { Link } from '../link';
import { cn } from '@/utils';
import { formatCurrency } from './utils';
import { ArrowLeft, Copy } from 'lucide-react';
import type { OrderTemplate } from './types';

export interface CreateOrderSelectTemplateViewProps {
  templates: OrderTemplate[];
  onBack: () => void;
  onClose: () => void;
  onSelectTemplate: (template: OrderTemplate) => void;
}

export function CreateOrderSelectTemplateView({
  templates,
  onBack,
  onSelectTemplate,
}: CreateOrderSelectTemplateViewProps): React.ReactElement {

  return (
    <>
      <DialogHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 cursor-pointer"
              onClick={onBack}
              aria-label="Back"
            >
              <ArrowLeft className="size-4" />
            </Button>
            <DialogTitle>Select A Template</DialogTitle>
          </div>
        </div>
        <DialogDescription>
          Choose from your saved templates to quickly create a new order.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto scrollbar-none">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={cn(
              'cursor-pointer border-border bg-card transition-colors hover:bg-muted/50',
              'hover:bg-white/5 dark:hover:bg-black/5'
            )}
            onClick={() => onSelectTemplate(template)}
          >
            <CardContent className="p-4 flex flex-row items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-600 dark:text-violet-400">
                <Copy className="size-6" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="font-semibold text-foreground truncate">{template.name}</h3>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="soft" className={cn('rounded-md px-2 py-0.5 bg-white/10 dark:bg-black/10')}>
                    {template.category}
                  </Badge>
                  <span>{template.itemCount} items</span>
                  <span>Last used {template.lastUsed}</span>
                </div>
              </div>
              <div className="shrink-0 text-right font-medium text-foreground">
                {formatCurrency(template.totalValue)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <span className="text-sm text-muted-foreground">Showing {templates.length} templates</span>
        <Link
          href="#"
          className="cursor-pointer text-foreground hover:underline"
          onClick={(e) => {
            e.preventDefault();
            // Manage Templates – placeholder for future scope
          }}
        >
          Manage Templates
        </Link>
      </div>
    </>
  );
}
