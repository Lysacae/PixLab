import './Badge.css';

type Tone = 'waiting' | 'running' | 'done' | 'muted';

const LABELS: Record<Tone, string> = {
  waiting: 'En attente',
  running: 'En cours',
  done: 'Termine',
  muted: '',
};

export function Badge({ tone, label }: { tone: Tone; label?: string }) {
  return <span className={`px-badge px-badge--${tone}`}>{label ?? LABELS[tone]}</span>;
}
