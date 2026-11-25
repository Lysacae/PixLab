import { Button } from '@/design-system';
import './ConfirmDialog.css';

export type UpdateInfo = {
  version: string;
  releaseNotes: string;
  downloadUrl?: string;
};

type Props = {
  info: UpdateInfo;
  currentVersion: string;
  downloading?: boolean;
  progress?: number;
  onInstall: () => void;
  onLater: () => void;
};

export function UpdateDialog({
  info,
  currentVersion,
  downloading,
  progress = 0,
  onInstall,
  onLater,
}: Props) {
  return (
    <div className="confirm-modal">
      <div className="confirm-modal__card confirm-modal__card--wide" role="dialog" aria-modal>
        <h2 className="display-font">MISE A JOUR DISPONIBLE</h2>
        <p>
          Vous avez la version <span className="mono-font">{currentVersion}</span>. La version{' '}
          <span className="mono-font">{info.version}</span> est disponible.
        </p>
        <div className="np-label">Notes de version</div>
        <pre className="update-notes mono-font">{info.releaseNotes || 'Corrections et ameliorations.'}</pre>
        {downloading ? (
          <p className="mono-font">Telechargement… {Math.round(progress)}%</p>
        ) : null}
        <div className="confirm-modal__actions">
          <Button variant="primary" onClick={onInstall} disabled={downloading}>
            {downloading ? 'Installation…' : 'Installer'}
          </Button>
          <Button variant="secondary" onClick={onLater} disabled={downloading}>
            Plus tard
          </Button>
        </div>
      </div>
    </div>
  );
}
