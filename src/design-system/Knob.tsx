import { useRef, type PointerEvent } from 'react';
import './Knob.css';

type Props = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  display: string;
  onChange: (value: number) => void;
};

export function Knob({ label, value, min = 0, max = 100, step = 1, display, onChange }: Props) {
  const startY = useRef(0);
  const startVal = useRef(0);

  const angle = ((value - min) / (max - min)) * 270 - 135;

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    startY.current = e.clientY;
    startVal.current = value;
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const dy = startY.current - e.clientY;
    const range = max - min;
    const next = Math.round((startVal.current + (dy / 100) * range) / step) * step;
    onChange(Math.max(min, Math.min(max, next)));
  };

  return (
    <div className="px-knob">
      <div className="px-knob__label">{label}</div>
      <div className="px-knob__row">
        <div
          className="px-knob__dial"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          tabIndex={0}
        >
          <div className="px-knob__disc">
            <div className="px-knob__notch" style={{ transform: `rotate(${angle}deg)` }} />
          </div>
        </div>
        <span className="px-knob__value mono-font">{display}</span>
      </div>
    </div>
  );
}
