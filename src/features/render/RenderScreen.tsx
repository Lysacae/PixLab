import { Badge, Button, IconCheck, IconNote, Panel, Progress } from '@/design-system';
import { useRenderQueueStore } from '@/stores/renderQueueStore';
import type { RenderJob } from '@/stores/types';
import './RenderScreen.css';

function sourceLabel(source: RenderJob['source']) {
  if (source === 'video') return 'Onglet Video';
  if (source === 'image') return 'Onglet Image';
  return 'Onglet Musique';
}

function Thumb({ job }: { job: RenderJob }) {
  if (job.source === 'music') {
    return (
      <div className="render-thumb render-thumb--music">
        <IconNote />
      </div>
    );
  }
  if (job.thumbnailUrl) {
    return (
      <div className="render-thumb">
        <img src={job.thumbnailUrl} alt="" />
      </div>
    );
  }
  return (
    <div className={`render-thumb render-thumb--${job.source}`}>
      <span />
    </div>
  );
}

export function RenderScreen() {
  const jobs = useRenderQueueStore((s) => s.jobs);
  const selectedId = useRenderQueueStore((s) => s.selectedId);
  const select = useRenderQueueStore((s) => s.select);
  const cancel = useRenderQueueStore((s) => s.cancel);
  const removeJob = useRenderQueueStore((s) => s.removeJob);
  const selected = jobs.find((j) => j.id === selectedId) ?? jobs[0];

  const openOutput = async (path: string) => {
    const api = window.pixlab;
    if (!api) return;
    const res = await api.openPath(path);
    if (!res.ok) {
      // Essaie le dossier parent
      const parts = path.replace(/\//g, '\\').split('\\');
      parts.pop();
      const parent = parts.join('\\');
      if (parent) await api.openPath(parent);
    }
  };

  return (
    <div className="render-screen">
      <Panel title="FILE D'ATTENTE" className="render-screen__queue">
        <div className="render-list">
          {jobs.length === 0 ? (
            <p className="render-note">File vide. Lancez un rendu depuis Video, Image ou Musique.</p>
          ) : null}
          {jobs.map((job) => (
            <button
              key={job.id}
              type="button"
              className={['render-row', selected?.id === job.id ? 'is-selected' : ''].join(' ')}
              onClick={() => select(job.id)}
            >
              <Thumb job={job} />
              <div className="render-row__meta">
                <div className="render-row__name">{job.projectName}</div>
                <div className="render-row__src">Source : {sourceLabel(job.source)}</div>
                <div className="render-row__progress">
                  {job.status === 'waiting' ? (
                    <Progress value={0} tone="empty" showLabel={false} />
                  ) : job.status === 'done' ? (
                    <div className="render-done">
                      <Progress value={100} tone={job.error ? 'orange' : 'green'} />
                      {!job.error ? <IconCheck /> : null}
                    </div>
                  ) : (
                    <Progress value={job.progress} tone="orange" />
                  )}
                </div>
              </div>
              <Badge
                tone={job.status === 'done' ? 'done' : job.status === 'running' ? 'running' : 'waiting'}
              />
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="DETAILS" className="render-screen__details">
        {selected ? (
          <>
            <div className="render-details-thumb">
              <Thumb job={selected} />
            </div>
            <dl className="render-details">
              <div>
                <dt>Projet</dt>
                <dd>{selected.projectName}</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>{sourceLabel(selected.source)}</dd>
              </div>
              <div>
                <dt>Format</dt>
                <dd>{selected.format}</dd>
              </div>
              <div>
                <dt>Duree</dt>
                <dd>{selected.durationLabel}</dd>
              </div>
              <div>
                <dt>Date</dt>
                <dd>{selected.dateLabel}</dd>
              </div>
              <div>
                <dt>Destination</dt>
                <dd className="mono-font" style={{ wordBreak: 'break-all' }}>
                  {selected.outputPath}
                </dd>
              </div>
              {selected.error ? (
                <div>
                  <dt>Erreur</dt>
                  <dd>{selected.error}</dd>
                </div>
              ) : null}
            </dl>
            <div className="render-details-actions">
              <Button
                variant="danger"
                disabled={selected.status === 'done'}
                onClick={() => cancel(selected.id)}
              >
                Annuler
              </Button>
              <Button variant="danger" onClick={() => removeJob(selected.id)}>
                Retirer de la file
              </Button>
              <Button
                variant="secondary"
                disabled={selected.status !== 'done' || Boolean(selected.error)}
                onClick={() => void openOutput(selected.outputPath)}
              >
                Ouvrir le fichier
              </Button>
            </div>
            <p className="render-note">Retirer n&apos;efface pas le fichier sur le PC.</p>
            <p className="render-note">Les rendus s&apos;effectuent un par un.</p>
          </>
        ) : (
          <p className="render-note">Aucun job selectionne.</p>
        )}
      </Panel>
    </div>
  );
}
