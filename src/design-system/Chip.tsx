import './Chip.css';

type Props = {
  label: string;
  selected?: boolean;
  accent?: string;
  onClick?: () => void;
};

export function Chip({ label, selected, accent = 'var(--violet-magie)', onClick }: Props) {
  return (
    <button
      type="button"
      className={['px-chip', selected ? 'is-selected' : ''].filter(Boolean).join(' ')}
      style={selected ? { borderColor: accent, color: accent } : undefined}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
