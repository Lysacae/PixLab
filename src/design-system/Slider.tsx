import './Slider.css';

type Props = {
  min?: number;
  max?: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  accent?: string;
  labels?: string[];
  disabled?: boolean;
};

export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value,
  onChange,
  accent = 'var(--cyan)',
  labels,
  disabled,
}: Props) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className={`px-slider ${disabled ? 'is-disabled' : ''}`}>
      <div className="px-slider__track">
        <div className="px-slider__fill" style={{ width: `${pct}%`, background: accent }} />
        <input
          type="range"
          className="px-slider__input"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ ['--thumb-accent' as string]: accent }}
        />
      </div>
      {labels ? (
        <div className="px-slider__labels">
          {labels.map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
