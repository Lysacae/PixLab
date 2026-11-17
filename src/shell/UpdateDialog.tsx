import { Button } from '@/design-system';
import './ConfirmDialog.css';

export type UpdateInfo = {
  version: string;
  releaseNotes: string;
  downloadUrl?: string;
};

type Props = {
  info: UpdateInfo;
  downloading?: boolean;
  progress?: number;
  onInstall: () => void;
  onLater: () => void;
};

export function UpdateDialog({ info, downloading, progress = 0, onInstall, onLater }: Props) {
  return (
    <div className="confirm-modal">
      <div className="confirm-modal__card confirm-modal__card--wide" role="dialog" aria-modal>
        <h2 className="display-font">MISE A JOUR DISPONIBLE</h2>
        <p>
          PIXLAB <span className="mono-font">{info.version}</span> est pret a etre installe.
        </p>
        <div className="np-label">Notes de version</div>
        <pre className="update-notes mono-font">{info.releaseNotes || 'Corrections et ameliorations.'}</pre>
        {downloading ? (
          <p className="mono-font">Telechargement… {Math.round(progress)}%</p>
        ) : null}
        <div className="confirm-modal__actions">
          <Button variant="secondary" onClick={onLater} disabled={downloading}>
            Plus tard
          </Button>
          <Button variant="primary" onClick={onInstall} disabled={downloading}>
            Installer
          </Button>
        </div>
      </div>
    </div>
  );
}
