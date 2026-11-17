import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

type Variant = 'primary' | 'secondary' | 'tool' | 'danger' | 'ghost';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  selected?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
};

export function Button({
  variant = 'secondary',
  selected = false,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: Props) {
  const classes = [
    'px-btn',
    `px-btn--${variant}`,
    selected ? 'is-selected' : '',
    disabled ? 'is-disabled' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type="button" className={classes} disabled={disabled} {...rest}>
      {icon ? <span className="px-btn__icon">{icon}</span> : null}
      {children ? <span className="px-btn__label">{children}</span> : null}
    </button>
  );
}
