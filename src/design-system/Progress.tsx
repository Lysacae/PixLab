import './Progress.css';

type Props = {
  value: number;
  tone?: 'orange' | 'green' | 'empty';
  showLabel?: boolean;
};

export function Progress({ value, tone = 'orange', showLabel = true }: Props) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={`px-progress px-progress--${tone}`}>
      <div className="px-progress__track">
        <div className="px-progress__fill" style={{ width: `${clamped}%` }} />
      </div>
      {showLabel ? <span className="px-progress__label mono-font">{clamped}%</span> : null}
    </div>
  );
}
