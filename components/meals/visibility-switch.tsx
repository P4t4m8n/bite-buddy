import { Globe, Lock } from "lucide-react";
import { useId } from "react";

type VisibilitySwitchProps = {
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
};

export default function VisibilitySwitch({ isPublic, onChange }: VisibilitySwitchProps) {
  const id = useId();
  const Icon = isPublic ? Globe : Lock;

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-foreground/10 p-3">
      <div className="flex min-w-0 items-start gap-2">
        <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-foreground/60" />
        <div>
          <p id={`${id}-label`} className="text-sm font-medium">
            ארוחה ציבורית
          </p>
          <p id={`${id}-description`} className="text-xs text-foreground/60">
            {isPublic
              ? "כל המשתמשים יכולים לראות את הארוחה ולשמור עותק."
              : "רק אתם רואים את הארוחה."}
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isPublic}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-description`}
        onClick={() => onChange(!isPublic)}
        className={`flex h-7 w-12 shrink-0 items-center rounded-full p-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none ${
          isPublic ? "justify-end bg-brand" : "justify-start bg-foreground/20"
        }`}
      >
        <span aria-hidden className="size-6 rounded-full bg-white shadow" />
      </button>
    </div>
  );
}
