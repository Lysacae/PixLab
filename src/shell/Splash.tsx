import { useEffect, useState } from 'react';
import { splashartUrl } from '@/assets/brand';
import './Splash.css';

type Props = { onDone: () => void };

const STEPS = [
  'Chargement du noyau…',
  'Initialisation UI pixel…',
  'Preparation des codecs…',
  'Chargement des packages…',
  'Pret.',
];

export function Splash({ onDone }: Props) {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState(0);
  const [imgOk, setImgOk] = useState(true);

  useEffect(() => {
    let pct = 0;
    const timer = window.setInterval(() => {
      pct = Math.min(100, pct + 3 + Math.floor(Math.random() * 7));
      setProgress(pct);
      setStep(Math.min(STEPS.length - 1, Math.floor((pct / 100) * (STEPS.length - 1))));
      if (pct >= 100) {
        window.clearInterval(timer);
        window.setTimeout(onDone, 450);
      }
    }, 80);
    return () => window.clearInterval(timer);
  }, [onDone]);

  return (
    <div className="splash">
      {imgOk ? (
        <img
          className="splash__art"
          src={splashartUrl}
          alt=""
          draggable={false}
          onError={() => setImgOk(false)}
        />
      ) : (
        <div className="splash__fallback" />
      )}
      <div className="splash__overlay">
        <div className="splash__bar-wrap">
          <div className="splash__bar">
            <div className="splash__fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="splash__meta mono-font">
            <span>{STEPS[step]}</span>
            <span>{progress}%</span>
          </div>
          <div className="splash__label">Chargement…</div>
        </div>
      </div>
    </div>
  );
}
