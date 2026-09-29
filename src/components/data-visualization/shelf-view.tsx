import './shelf-view.css';

export interface ShelfItem {
  name: string;
  binderLabel?: string;
  bgColor: string;
  textColor: string;
  docCount: number;
}

export interface ShelfViewProps {
  items: ShelfItem[];
  onSelect?: (item: ShelfItem) => void;
  bindersPerRow?: number;
}

function binderWidthClass(docCount: number): 'binder-regular' | 'binder-medium' | 'binder-large' {
  if (docCount <= 10) return 'binder-regular';
  if (docCount <= 20) return 'binder-medium';
  return 'binder-large';
}

interface BinderSpineProps {
  item: ShelfItem;
  onClick?: () => void;
}

function BinderSpine({ item, onClick }: BinderSpineProps) {
  const widthClass = binderWidthClass(item.docCount);
  const label = item.binderLabel ?? item.name;

  return (
    <button
      type="button"
      className={`group relative flex flex-col items-center cursor-pointer ${widthClass}`}
      onClick={onClick}
      aria-label={item.name}
      title={item.name}
    >
      {/* Binder body */}
      <div
        className="relative flex items-center justify-center w-full rounded-t-sm shadow-md transition-all duration-200 group-hover:scale-105 group-hover:shadow-xl group-hover:-translate-y-1"
        style={{ backgroundColor: item.bgColor, height: 192 }}
      >
        {/* Left binding strip */}
        <div
          className="absolute left-0 top-0 bottom-0 w-2 rounded-tl-sm opacity-30"
          style={{ backgroundColor: item.textColor }}
        />

        {/* Vertical text label */}
        <span
          className="text-[11px] font-semibold tracking-widest uppercase select-none leading-tight text-center px-1"
          style={{
            writingMode: 'vertical-lr',
            transform: 'rotate(180deg)',
            color: item.textColor,
            maxHeight: 160,
            overflow: 'hidden',
          }}
        >
          {label}
        </span>

        {/* Bottom decorative circle */}
        <div
          className="absolute bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 opacity-60"
          style={{ borderColor: item.textColor }}
        />
      </div>

      {/* Bottom tab */}
      <div
        className="w-full h-2 rounded-b-sm"
        style={{ backgroundColor: item.bgColor, filter: 'brightness(0.8)' }}
      />
    </button>
  );
}

export function ShelfView({ items, onSelect, bindersPerRow = 14 }: ShelfViewProps) {
  // Guard against 0 or negative bindersPerRow which would cause an infinite loop
  const safeBindersPerRow = Math.max(1, bindersPerRow);
  const rows: ShelfItem[][] = [];
  for (let i = 0; i < items.length; i += safeBindersPerRow) {
    rows.push(items.slice(i, i + safeBindersPerRow));
  }
  if (rows.length === 0) rows.push([]);

  return (
    <div className="bg-muted p-4 rounded-lg space-y-2">
      {rows.map((row, rowIdx) => (
        <div key={row[0]?.name ?? rowIdx} className="shelf-row relative">
          <div className="bg-muted/50 border border-border/60 rounded-lg px-6 pt-5 pb-2">
            <div className="flex items-end gap-1 flex-wrap min-h-[210px] relative z-10">
              {row.map((item, i) => (
                <BinderSpine
                  key={rowIdx * safeBindersPerRow + i}
                  item={item}
                  onClick={onSelect ? () => onSelect(item) : undefined}
                />
              ))}
            </div>
          </div>

          {/* Wooden shelf plank */}
          <div className="h-3 bg-gradient-to-b from-[#c8a96e] to-[#a07850] rounded-b-sm shadow-md" />
        </div>
      ))}
    </div>
  );
}
