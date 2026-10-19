'use client';

import * as React from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from '../application-ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  /**
   * Qué clase de confirmación es. `destructive` por defecto, que es como
   * nació: triángulo rojo y botón rojo.
   *
   * No toda confirmación destruye algo. Preguntar antes de una acción
   * reversible y vestirla de borrado le dice a quien la lee que va a perder
   * algo, y entonces la duda que el diálogo venía a resolver la empeora.
   */
  tone?: 'destructive' | 'default';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  tone = 'destructive',
}: ConfirmDialogProps): React.ReactElement {
  const destructivo = tone === 'destructive';
  const handleConfirm = (): void => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-md !bg-card">
        <DialogHeader className="flex flex-row items-center gap-4 text-left">
          <div
            className={cn(
              'flex shrink-0 items-center justify-center rounded-full p-4',
              destructivo ? 'bg-destructive/30' : 'bg-foreground/10',
            )}
            aria-hidden
          >
            {destructivo ? (
              <AlertTriangle className="size-5 text-destructive" aria-hidden />
            ) : (
              <Info className="size-5 text-foreground" aria-hidden />
            )}
          </div>
          <DialogTitle className="text-lg font-semibold leading-6 text-foreground">
            {title}
          </DialogTitle>
        </DialogHeader>
        <DialogDescription className="text-sm text-muted-foreground">
          {description}
        </DialogDescription>
        {/*
          Sólo el `gap`: el apilado lo pone `DialogFooter`.

          Antes esto traía `flex flex-row justify-end`, que por tailwind-merge
          ganaba al `flex-col-reverse` del pie y lo anulaba. Resultado: en una
          pantalla estrecha los dos botones no se apilaban — se apretaban en una
          fila, que es justo lo que el pie del sistema venía a evitar.

          Con el apilado puesto, en estrecho queda el destructivo arriba y el de
          cancelar abajo. Y eso es lo que se quiere: en un móvil el pulgar
          descansa abajo, así que quien cierra diálogos por reflejo pulsa el de
          abajo. Ahí tiene que estar el que no rompe nada.
        */}
        <DialogFooter className="gap-3">
          <Button variant="secondary" onClick={onClose} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            variant={destructivo ? 'destructive' : 'default'}
            onClick={handleConfirm}
            className="cursor-pointer"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
