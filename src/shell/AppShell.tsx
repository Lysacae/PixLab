import { useCallback, useEffect, useState, type DragEvent } from 'react';
import { TitleBar } from './TitleBar';
import { MenuBar, type MenuAction } from './MenuBar';
import { TabBar } from './TabBar';
import { StatusBar } from './StatusBar';
import { ConfirmDialog } from './ConfirmDialog';
import { NewProjectDialog, type NewProjectParams } from './NewProjectDialog';
import { UpdateDialog, type UpdateInfo } from './UpdateDialog';
import { VideoScreen } from '@/features/video/VideoScreen';
import { ImageScreen } from '@/features/image/ImageScreen';
import { MusicScreen } from '@/features/music/MusicScreen';
import { RenderScreen } from '@/features/render/RenderScreen';
import { SettingsScreen } from '@/features/settings/SettingsScreen';
import { useUiStore } from '@/stores/uiStore';
import { useProjectStore } from '@/stores/projectStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { bootstrapRenderQueue, useRenderQueueStore } from '@/stores/renderQueueStore';
import { eventMatchesCombo, useShortcutsStore } from '@/stores/shortcutsStore';
import { downloadProjectFile, loadProjectLocal, saveProjectLocal } from '@/stores/persist';
import { resolveExportFilePath } from '@/lib/exportPath';
import { importMedia } from '@/stubs/importMedia';
import type { MediaAsset } from '@/stores/types';
import './AppShell.css';

function formatTimecode(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function AppShell() {
  const tab = useUiStore((s) => s.tab);
  const setTab = useUiStore((s) => s.setTab);
  const setStatusText = useUiStore((s) => s.setStatusText);
  const uiScale = useUiStore((s) => s.uiScale);
  const autoSave = useUiStore((s) => s.autoSave);
  const autoSaveIntervalSec = useUiStore((s) => s.autoSaveIntervalSec);
  const project = useProjectStore();
  const dirty = useProjectStore((s) => s.dirty);
  const addToLibrary = useLibraryStore((s) => s.add);
  const enqueue = useRenderQueueStore((s) => s.enqueue);
  const jobs = useRenderQueueStore((s) => s.jobs);
  const bindings = useShortcutsStore((s) => s.bindings);
  const [dragging, setDragging] = useState(false);
  const [closePrompt, setClosePrompt] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [updateDownloading, setUpdateDownloading] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);

  const doSave = useCallback(() => {
    saveProjectLocal();
    downloadProjectFile();
    setStatusText(`Projet sauvegarde — ${useProjectStore.getState().projectName}.pxl`);
  }, [setStatusText]);

  const requestClose = useCallback(() => {
    if (useProjectStore.getState().dirty) {
      setClosePrompt(true);
      return;
    }
    void window.pixlab?.forceClose();
  }, []);

  useEffect(() => {
    bootstrapRenderQueue();
    loadProjectLocal();
    void window.pixlab?.setScale(uiScale);
  }, [uiScale]);

  useEffect(() => {
    const off = window.pixlab?.onCloseRequested?.(() => {
      if (useProjectStore.getState().dirty) setClosePrompt(true);
      else void window.pixlab?.forceClose();
    });
    return () => off?.();
  }, []);

  useEffect(() => {
    const api = window.pixlab;
    if (!api?.checkForUpdates) return;
    const offAvail = api.onUpdateAvailable?.((info) => {
      setUpdateInfo({
        version: info.version,
        releaseNotes: info.releaseNotes || 'Corrections et ameliorations.',
      });
    });
    const offProg = api.onUpdateProgress?.((pct) => {
      setUpdateDownloading(true);
      setUpdateProgress(pct);
    });
    const offDone = api.onUpdateDownloaded?.(() => {
      setUpdateDownloading(false);
      setUpdateProgress(100);
      // Propose l'install immediate via le meme dialogue (bouton Installer)
    });
    void api.checkForUpdates();
    return () => {
      offAvail?.();
      offProg?.();
      offDone?.();
    };
  }, []);

  useEffect(() => {
    if (!autoSave) return;
    const id = window.setInterval(() => {
      if (useProjectStore.getState().dirty) {
        saveProjectLocal();
        setStatusText(`Sauvegarde auto — ${useProjectStore.getState().projectName}.pxl`);
      }
    }, autoSaveIntervalSec * 1000);
    return () => window.clearInterval(id);
  }, [autoSave, autoSaveIntervalSec, setStatusText]);

  useEffect(() => {
    if (tab === 'video') {
      setStatusText(`${project.projectName}.pxl    Zoom ${project.zoom}%    24 fps`);
    } else if (tab === 'image') {
      setStatusText(
        `${project.projectName}.pxl    Sortie ${project.imageOutW}x${project.imageOutH}    Ratio ${project.imageRatio}`,
      );
    } else if (tab === 'music') {
      if (!project.musicAsset) {
        setStatusText(`${project.projectName}.pxl    Aucun audio`);
      } else {
        const sr = project.musicAsset.sampleRate ?? 44100;
        const ch = (project.musicAsset.channels ?? 2) === 2 ? 'Stereo' : 'Mono';
        setStatusText(`${project.projectName}.pxl    ${(sr / 1000).toFixed(1)} kHz    ${ch}`);
      }
    } else if (tab === 'render') {
      const running = jobs.filter((j) => j.status === 'running').length;
      const waiting = jobs.filter((j) => j.status === 'waiting').length;
      const done = jobs.filter((j) => j.status === 'done').length;
      setStatusText(`${running} en cours    ${waiting} en attente    ${done} termine`);
    } else {
      setStatusText(`Parametres    ${bindings.length} raccourcis`);
    }
  }, [
    tab,
    project.projectName,
    project.zoom,
    project.imageOutW,
    project.imageOutH,
    project.imageRatio,
    project.musicAsset,
    jobs,
    bindings.length,
    setStatusText,
  ]);

  const ingestAsset = useCallback(
    async (asset: MediaAsset, prefer?: 'video' | 'image' | 'music') => {
      addToLibrary(asset);
      const kind = prefer ?? (asset.kind === 'audio' ? 'music' : asset.kind);
      if (kind === 'video' || asset.kind === 'video') {
        project.setVideoAsset(asset);
        setTab('video');
      } else if (kind === 'image' || asset.kind === 'image') {
        project.setImageAsset(asset);
        setTab('image');
      } else {
        await project.setMusicAsset(asset);
        setTab('music');
      }
    },
    [addToLibrary, project, setTab],
  );

  const pickFile = (accept: string, kind: 'video' | 'image' | 'music') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files ?? []);
      for (const file of files) {
        const asset = await importMedia(file);
        addToLibrary(asset);
        if (kind === 'video' && asset.kind === 'video') project.setVideoAsset(asset);
        else if (kind === 'image' && asset.kind === 'image') project.setImageAsset(asset);
        else if (kind === 'music' && asset.kind === 'audio') await project.setMusicAsset(asset);
        else if (kind === 'video' && asset.kind === 'audio') {
          project.addClip({
            track: 'audio1',
            label: asset.name,
            startSec: project.currentTime,
            durationSec: asset.durationSec,
            assetId: asset.id,
            color: 'var(--or)',
          });
        } else if (kind === 'video' && asset.kind === 'image') {
          project.addClip({
            track: 'images',
            label: asset.name,
            startSec: project.currentTime,
            durationSec: 5,
            assetId: asset.id,
            color: 'var(--bronze)',
          });
        }
      }
    };
    input.click();
  };

  const handleRender = async () => {
    if (tab === 'video') {
      if (!project.videoAsset && project.clips.length === 0) return;
      const format = project.videoExportFormat || 'MP4 1080p';
      const outputPath = await resolveExportFilePath({
        projectName: project.projectName,
        source: 'video',
        format,
        fileName: `${project.projectName}`,
      });
      if (!outputPath) return;
      enqueue({
        projectName: project.projectName,
        source: 'video',
        thumbnailUrl: project.videoAsset?.objectUrl ?? null,
        format,
        durationLabel: formatTimecode(project.duration()).slice(3),
        outputPath,
        sourceUrl: project.videoAsset?.objectUrl ?? null,
      });
      setTab('render');
    } else if (tab === 'image') {
      if (!project.imageAsset) return;
      const fileName = project.outputName || `${project.projectName}.png`;
      const outputPath = await resolveExportFilePath({
        projectName: project.projectName,
        source: 'image',
        format: 'PNG',
        fileName,
      });
      if (!outputPath) return;
      enqueue({
        projectName: fileName.replace(/\.[^.]+$/, ''),
        source: 'image',
        thumbnailUrl: project.imageUpscaledUrl ?? project.imageAsset.objectUrl,
        format: 'PNG',
        durationLabel: '--:--',
        outputPath,
        sourceUrl: project.imageUpscaledUrl ?? project.imageAsset.objectUrl,
      });
      setTab('render');
    } else if (tab === 'music') {
      if (!project.musicAsset) return;
      const dur = project.audioFx.outSec - project.audioFx.inSec;
      const outputPath = await resolveExportFilePath({
        projectName: project.projectName,
        source: 'music',
        format: 'WAV 44.1kHz',
        fileName: `${project.projectName}.wav`,
      });
      if (!outputPath) return;
      enqueue({
        projectName: project.projectName,
        source: 'music',
        thumbnailUrl: null,
        format: 'WAV 44.1kHz',
        durationLabel: formatTimecode(dur).slice(3),
        outputPath,
        sourceUrl: project.musicAsset.objectUrl,
        audioFx: { ...project.audioFx },
      });
      setTab('render');
    }
  };

  const createProject = (p: NewProjectParams) => {
    useLibraryStore.getState().clear();
    project.applyNewProject(p);
    setNewProjectOpen(false);
    setTab('video');
    setStatusText(`${p.name}.pxl · ${p.width}x${p.height}`);
  };

  const onMenu = (action: MenuAction) => {
    switch (action) {
      case 'new':
        setNewProjectOpen(true);
        break;
      case 'importVideo':
        pickFile('video/*', 'video');
        break;
      case 'importImage':
        pickFile('image/*', 'image');
        break;
      case 'importAudio':
        pickFile('audio/*', 'music');
        break;
      case 'save':
        doSave();
        break;
      case 'render':
        if (tab === 'render') break;
        handleRender();
        break;
      case 'quit':
        requestClose();
        break;
      case 'settings':
      case 'help':
        setTab('settings');
        break;
      case 'about':
        setTab('settings');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (useShortcutsStore.getState().editingKey) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        if (e.key !== 'Escape') return;
      }

      const match = (action: string, group?: string) =>
        bindings.some(
          (b) => b.action === action && (!group || b.group === group) && eventMatchesCombo(e, b.combo),
        );

      if (match('settings', 'global')) {
        e.preventDefault();
        setTab('settings');
        return;
      }
      if (match('render', 'global')) {
        e.preventDefault();
        handleRender();
        return;
      }
      if (match('import', 'global')) {
        e.preventDefault();
        if (tab === 'image') pickFile('image/*', 'image');
        else if (tab === 'music') pickFile('audio/*', 'music');
        else pickFile('video/*,image/*,audio/*', 'video');
        return;
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onMenu('new');
        return;
      }

      if (tab === 'video') {
        if (match('playPause', 'video')) {
          e.preventDefault();
          project.togglePlay();
        } else if (match('crop', 'video')) {
          e.preventDefault();
          project.setActiveTool('crop');
          project.setInspector({ type: 'crop' });
        } else if (match('cut', 'video')) {
          e.preventDefault();
          project.setActiveTool('cut');
        } else if (match('mute', 'video')) {
          e.preventDefault();
          project.toggleMuteSource();
        } else if (match('zoomIn', 'video')) {
          e.preventDefault();
          project.zoomIn();
        } else if (match('zoomOut', 'video')) {
          e.preventDefault();
          project.zoomOut();
        } else if (match('addText', 'video')) {
          e.preventDefault();
          project.addTextOverlay();
        } else if (match('addImage', 'video')) {
          e.preventDefault();
          pickFile('image/*', 'video');
        } else if (match('addAudio', 'video')) {
          e.preventDefault();
          pickFile('audio/*', 'video');
        }
      }

      if (tab === 'image') {
        if (match('upscale', 'image')) {
          e.preventDefault();
          project.setImageScale(project.imageScale === 2 ? 4 : 2);
        } else if (match('autoCrop', 'image')) {
          e.preventDefault();
          const ratios = ['1:1', '4:3', '3:2', '16:9', '9:16', '21:9', '4:5', '2:3', '5:4', 'Libre'] as const;
          const i = ratios.indexOf(project.imageRatio);
          project.setImageRatio(ratios[(i + 1) % ratios.length]);
        } else if (match('sendToVideo', 'image')) {
          e.preventDefault();
          project.sendImageToVideo();
          setTab('video');
        } else if (match('rename', 'image')) {
          e.preventDefault();
          project.setRenameFocused(true);
        }
      }

      if (tab === 'music') {
        if (match('playPause', 'music') || match('playPause', 'video')) {
          e.preventDefault();
          project.toggleMusicPlay();
        } else if (match('reverb', 'music')) {
          e.preventDefault();
          project.setMusicFocus('reverb');
        } else if (match('pitch', 'music')) {
          e.preventDefault();
          project.setMusicFocus('pitch');
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, bindings, project]);

  const onDragOver = (e: DragEvent) => {
    // Uniquement les vrais fichiers OS — ignore le drag interne d'une <img>
    if (![...e.dataTransfer.types].includes('Files')) return;
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);
  const onDrop = async (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;
    for (const file of files) {
      if (!file.type.match(/^(video|audio|image)\//)) continue;
      const asset = await importMedia(file);
      const prefer =
        tab === 'music' ? 'music' : tab === 'image' ? 'image' : file.type.startsWith('video/') ? 'video' : undefined;
      await ingestAsset(asset, prefer as 'video' | 'image' | 'music' | undefined);
    }
  };

  return (
    <div
      className={`app-shell ${dragging ? 'is-dropping' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <TitleBar onRequestClose={requestClose} />
      <MenuBar onAction={onMenu} />
      <TabBar onRender={handleRender} />
      <main className="app-shell__main">
        {tab === 'video' && (
          <VideoScreen
            onImport={() => pickFile('video/*,image/*,audio/*', 'video')}
            onImportAudio={() => pickFile('audio/*', 'video')}
            onImportImage={() => pickFile('image/*', 'video')}
          />
        )}
        {tab === 'image' && <ImageScreen onImport={() => pickFile('image/*', 'image')} />}
        {tab === 'music' && <MusicScreen onImport={() => pickFile('audio/*', 'music')} />}
        {tab === 'render' && <RenderScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </main>
      <StatusBar />
      {dragging ? <div className="drop-overlay">Deposer les medias ici</div> : null}
      {closePrompt ? (
        <ConfirmDialog
          title="Projet non sauvegarde"
          message={`Le projet "${project.projectName}" a des modifications non enregistrees (${dirty ? 'oui' : 'non'}). Sauvegarder avant de quitter ?`}
          confirmLabel="Sauvegarder"
          cancelLabel="Annuler"
          tertiaryLabel="Ne pas sauvegarder"
          onConfirm={() => {
            doSave();
            setClosePrompt(false);
            void window.pixlab?.forceClose();
          }}
          onCancel={() => setClosePrompt(false)}
          onTertiary={() => {
            setClosePrompt(false);
            void window.pixlab?.forceClose();
          }}
        />
      ) : null}
      {newProjectOpen ? (
        <NewProjectDialog onConfirm={createProject} onCancel={() => setNewProjectOpen(false)} />
      ) : null}
      {updateInfo ? (
        <UpdateDialog
          info={updateInfo}
          downloading={updateDownloading}
          progress={updateProgress}
          onLater={() => setUpdateInfo(null)}
          onInstall={() => {
            if (updateProgress >= 100) {
              void window.pixlab?.quitAndInstall();
              return;
            }
            setUpdateDownloading(true);
            void window.pixlab?.downloadUpdate();
          }}
        />
      ) : null}
    </div>
  );
}
