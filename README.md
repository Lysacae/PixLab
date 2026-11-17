# PIXLAB

Application desktop de montage / gestion **vidéo, image et musique**, interface 100 % pixel art 16-bit.

## Stack

- Electron + Vite + React + TypeScript
- Zustand pour l’état
- Traitements média stubbés (UI fidèle d’abord)

## Lancer (dev)

```bash
npm install
npm run dev
```

## Builds Windows (.exe)

```bash
npm run dist
```

Sorties dans `release/` :
- **Installateur** NSIS : `PIXLAB-0.1.0-x64.exe` (installe aussi un **désinstalleur** + raccourci « Desinstaller PIXLAB »)
- **Portable** (sans installation) : `PIXLAB-0.1.0-portable.exe`
- **Win unpacked** (test direct) : `release/win-unpacked/PIXLAB.exe`

Scripts : `npm run dist` · `npm run dist:installer` · `npm run dist:portable` · `npm run dist:dir`

## Direction artistique

Voir [`UI Template/SPEC_UI.md`](UI%20Template/SPEC_UI.md).
