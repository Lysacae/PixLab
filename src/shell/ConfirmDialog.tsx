import { Button } from '@/design-system';
import './ConfirmDialog.css';

type Props = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tertiaryLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  onTertiary?: () => void;
};

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Oui',
  cancelLabel = 'Non',
  tertiaryLabel,
  onConfirm,
  onCancel,
  onTertiary,
}: Props) {
  return (
    <div className="confirm-modal">
      <div className="confirm-modal__card" role="dialog" aria-modal>
        <h2 className="display-font">{title}</h2>
        <p>{message}</p>
        <div className="confirm-modal__actions">
          {tertiaryLabel && onTertiary ? (
            <Button variant="secondary" onClick={onTertiary}>
              {tertiaryLabel}
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
