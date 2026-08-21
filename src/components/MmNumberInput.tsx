import { useEffect, useState } from 'react';
import { Input } from './ui/input';

interface MmNumberInputProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
  suffixClassName?: string;
}

export function MmNumberInput({
  value,
  min,
  max,
  onChange,
  className,
  suffixClassName = 'text-[10px] font-bold text-indigo-600',
}: MmNumberInputProps) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setDraft(String(value));
    }
  }, [value, focused]);

  const commit = (raw: string) => {
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed) || raw.trim() === '') {
      setDraft(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, parsed));
    onChange(clamped);
    setDraft(String(clamped));
  };

  return (
    <div className="flex items-center gap-0.5">
      <Input
        type="text"
        inputMode="numeric"
        value={draft}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          commit(draft);
        }}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ''))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          }
        }}
        className={className}
      />
      <span className={suffixClassName}>mm</span>
    </div>
  );
}
