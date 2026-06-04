import { UNIVERSE_ICONS } from '@/lib/universe-icons';
import { cn } from '@/lib/utils';

interface IconPickerProps {
  value?: string;
  onChange: (name: string | undefined) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="grid grid-cols-8 gap-2">
      {UNIVERSE_ICONS.map(({ name, label, Icon }) => {
        const isSelected = value === name;
        return (
          <button
            key={name}
            type="button"
            onClick={() => onChange(isSelected ? undefined : name)}
            title={label}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-md border transition-colors',
              isSelected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}
