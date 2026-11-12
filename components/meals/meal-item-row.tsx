import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import { MAX_AMOUNT } from "@/lib/nutrition/amount";
import { UNIT_LABELS } from "@/lib/nutrition/format";

import { FoodImage } from "@/components/food/food-image";
import MacroLine from "@/components/meals/macro-line";

import type { MealFood } from "@/lib/meals/types";
import type { Nutrients } from "@/lib/nutrition/types";

type MealItemRowProps = {
  itemKey: string;
  food: MealFood;
  amountInput: string;
  invalid: boolean;
  nutrients: Nutrients;
  isFirst: boolean;
  isLast: boolean;
  onAmountChange: (value: string) => void;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
};

/** Move buttons have stable ids so focus can be restored after the row moves. */
export const moveButtonId = (itemKey: string, offset: -1 | 1) =>
  `meal-item-${itemKey}-${offset < 0 ? "up" : "down"}`;

export default function MealItemRow({
  itemKey,
  food,
  amountInput,
  invalid,
  nutrients,
  isFirst,
  isLast,
  onAmountChange,
  onMove,
  onRemove,
}: MealItemRowProps) {
  const inputId = `meal-item-${itemKey}-amount`;

  return (
    <li className="rounded-2xl border border-foreground/10 p-3">
      <div className="flex items-start gap-3">
        <FoodImage src={food.imageUrl} name={food.name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{food.name}</p>
          <MacroLine nutrients={nutrients} className="mt-0.5" />
        </div>
        <div className="flex shrink-0 items-center">
          <IconButton
            id={moveButtonId(itemKey, -1)}
            label={`הזזה למעלה: ${food.name}`}
            disabled={isFirst}
            onClick={() => onMove(-1)}
          >
            <ChevronUp className="size-4" />
          </IconButton>
          <IconButton
            id={moveButtonId(itemKey, 1)}
            label={`הזזה למטה: ${food.name}`}
            disabled={isLast}
            onClick={() => onMove(1)}
          >
            <ChevronDown className="size-4" />
          </IconButton>
          <IconButton label={`הסרה: ${food.name}`} onClick={onRemove} danger>
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 ps-[52px]">
        <label htmlFor={inputId} className="text-sm text-foreground/60">
          כמות
          <span className="sr-only">: {food.name}</span>
        </label>
        <input
          id={inputId}
          type="number"
          inputMode="decimal"
          min={0}
          max={MAX_AMOUNT}
          step="any"
          value={amountInput}
          onChange={(event) => onAmountChange(event.target.value)}
          aria-invalid={invalid || undefined}
          className="h-9 w-24 rounded-lg border border-foreground/15 bg-background px-2 text-end tabular-nums focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none aria-invalid:border-red-500"
        />
        <span className="text-sm text-foreground/60">{UNIT_LABELS[food.unit]}</span>
      </div>
    </li>
  );
}

type IconButtonProps = {
  id?: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

const IconButton = ({ id, label, disabled, danger, onClick, children }: IconButtonProps) => (
  <button
    id={id}
    type="button"
    aria-label={label}
    title={label}
    disabled={disabled}
    onClick={onClick}
    className={`flex size-9 items-center justify-center rounded-lg text-foreground/60 hover:bg-foreground/5 disabled:opacity-30 disabled:hover:bg-transparent ${
      danger ? "hover:text-red-600" : "hover:text-foreground"
    }`}
  >
    {children}
  </button>
);
