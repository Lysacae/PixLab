import './KeyCap.css';

type Props = {
  label: string;
  editing?: boolean;
  onClick?: () => void;
};

export function KeyCap({ label, editing, onClick }: Props) {
  return (
    <button
      type="button"
      className={['px-keycap', editing ? 'is-editing' : ''].filter(Boolean).join(' ')}
      onClick={onClick}
    >
      {editing ? '…' : label}
    </button>
  );
}
