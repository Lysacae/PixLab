import { useUiStore } from '@/stores/uiStore';
import './StatusBar.css';

export function StatusBar() {
  const statusText = useUiStore((s) => s.statusText);
  return (
    <footer className="statusbar">
      <span className="statusbar__text">{statusText}</span>
    </footer>
  );
}
