import { forwardRef, type InputHTMLAttributes } from 'react';
import './TextField.css';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, className = '', ...rest },
  ref,
) {
  return (
    <label className={`px-field ${className}`}>
      {label ? <span className="px-field__label">{label}</span> : null}
      <input ref={ref} className="px-field__input mono-font" {...rest} />
    </label>
  );
});
