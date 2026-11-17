import { useCallback, useState } from 'react';
import { AppShell } from './shell/AppShell';
import { Splash } from './shell/Splash';

export default function App() {
  const [ready, setReady] = useState(false);
  const onDone = useCallback(() => setReady(true), []);

  return (
    <div className="app-root">
      {!ready ? <Splash onDone={onDone} /> : null}
      {ready ? <AppShell /> : null}
    </div>
  );
}
