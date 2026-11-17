import type { HTMLAttributes, ReactNode } from 'react';
import './Panel.css';

type Props = HTMLAttributes<HTMLDivElement> & {
  title?: string;
  inset?: boolean;
  children?: ReactNode;
};

export function Panel({ title, inset = false, className = '', children, ...rest }: Props) {
  return (
    <div className={['px-panel', inset ? 'px-panel--inset' : '', className].filter(Boolean).join(' ')} {...rest}>
      {title ? <div className="px-panel__title">{title}</div> : null}
      <div className="px-panel__body">{children}</div>
    </div>
  );
}
