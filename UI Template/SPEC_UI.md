# PIXLAB — Spécification d’interface (pixel art)

Document de direction artistique et de spécification UI destiné à une autre IA (ou un·e développeur·se) pour **implémenter l’interface** de l’application de gestion / montage **vidéo, image et musique**. Les maquettes et cette spec font foi. En cas de contradiction entre une typo visible sur une maquette et ce document, **suivre ce document**.

Nom de l’application : **PIXLAB**  
Langue de l’interface : **français**  
Plateforme cible : **application desktop** (fenêtre paysage 16:9, largeur de référence 1280×720, scalable uniquement par facteurs entiers).

Fichiers de référence (même dossier) :

| Fichier | Rôle |
|---|---|
| `00_croquis_layouts.png` | Planche de croquis / structure des 5 écrans |
| `01_guide_de_style.png` | Guide de style : typo, boutons, contrôles, onglets, icônes, curseurs |
| `01b_palette_exacte.png` | Nuancier **hex exacts** (19 couleurs, à respecter à la lettre) |
| `02_ecran_video.png` | Maquette plein écran — onglet Vidéo |
| `03_ecran_image.png` | Maquette plein écran — onglet Image |
| `04_ecran_musique.png` | Maquette plein écran — onglet Musique |
| `05_ecran_rendu.png` | Maquette plein écran — onglet Rendu |
| `06_ecran_parametres.png` | Maquette plein écran — onglet Paramètres (raccourcis éditables) |

---

## 1. Direction artistique

Toute l’interface est de la **pixel art 16-bit** (esthétique SNES / Game Boy Advance / RPG rétro). Boutons, panneaux, icônes, sliders, knobs, cases à cocher, onglets, cadres, typographie, curseur souris, barres de progression : **tout est pixelisé**. Ce n’est pas un habillage “rétro” posé sur une UI plate moderne : c’est une UI construite comme un écran de jeu 16-bit.

### 1.1 Grille

- Unité de base : **4 px**.
- Tout se cale sur cette grille (positions, tailles, marges, épaisseurs).
- Le chrome important (barre de titre, onglets, boutons primaires) s’aligne plutôt sur **8 px**.
- Le facteur d’échelle de la fenêtre n’accepte que des multiples entiers : `1×`, `2×`, `3×`, `4×`. Jamais de scale fractionnaire (1,5×, etc.).
- Icônes : set cohérent **24×24 px** (dessiné en 24×24, affiché en nearest-neighbor).
- Curseurs souris : flèche, I-beam, loupe, tous en pixel art, affichés en nearest-neighbor.

### 1.2 Palette (obligatoire, 19 couleurs uniquement)

N’utiliser **aucune autre couleur**. Pas de dégradé lisse, pas de couleur “presque” identique, pas d’alpha flou. Un tramage (dithering) 2 couleurs de la palette est autorisé si un fondu est vraiment nécessaire.

| Hex | Nom | Usage |
|---|---|---|
| `#0E0C16` | Encre | Fond de l’application / fond de fenêtre |
| `#1C1730` | Prune sombre | Panneaux principaux, onglets inactifs |
| `#261F3D` | Prune | Panneau alternatif, onglet actif, fonds de cartes |
| `#12101C` | Puits | Zones inset (preview, pistes, champs, waveform) |
| `#E8DCC8` | Ivoire | Bordures claires, filets, highlight haut/gauche |
| `#8B7A63` | Bronze | Bordures médianes, lunette des knobs, bouton réduire |
| `#F5EFE0` | Parchemin | Texte principal, icônes monochromes |
| `#9A8F7A` | Sable | Texte secondaire, labels muets, statuts “En attente” |
| `#FF5A7A` | Rose pixel | Bouton primaire, CTA **Rendre**, **Enregistrer** |
| `#FF8AA0` | Rose clair | État survol (hover) des CTA |
| `#5EFF9F` | Vert phosphor | Lecture, succès, badge **Terminé**, bouton agrandir |
| `#5EC8FF` | Cyan 16-bit | Sélection, playhead, poignées de crop, accent onglet Vidéo |
| `#FFC857` | Or | Pistes audio, accent onglet Musique, titres de groupe |
| `#C77DFF` | Violet magie | IA / upscale, pistes texte, accent onglet Image |
| `#FF9F43` | Orange | Rendu en cours, barre de progression, accent onglet Rendu |
| `#4A4560` | Gris pierre | Boutons désactivés, pistes vides, éléments inactifs |
| `#E83B3B` | Rouge | Fermer la fenêtre, danger, **Annuler**, muet |
| `#05040A` | Ombre | Ombre portée dure 4 px, jamais de flou |
| `#FFF8EE` | Blanc chaud | Highlight 1–2 px des bevels, texte sur bouton sombre si besoin |

Accents d’onglet actif (soulignement 4 px sous l’onglet sélectionné) :

- Vidéo → `#5EC8FF`
- Image → `#C77DFF`
- Musique → `#FFC857`
- Rendu → `#FF9F43`
- Paramètres → `#E8DCC8`

### 1.3 Typographie

Polices bitmap recommandées (Google Fonts / OFL) :

| Rôle | Police | Tailles autorisées |
|---|---|---|
| Titres, nom de l’app, boutons primaires, libellés d’onglets | **Press Start 2P** | Uniquement des multiples de 8 : 8, 16, 24, 32 |
| Labels d’interface, corps, barre de statut, chips de ratio | **Silkscreen** | 12, 16, 24 |
| Données mono (timecode, chemins, fréquences, logs) | **VT323** | 16, 24, 32 |

Règles :

- Désactiver tout anti-aliasing de police (`font-smooth: never`, `-webkit-font-smoothing: none`, `text-rendering: optimizeSpeed`).
- Press Start 2P **ne doit jamais** être rendue à une taille qui n’est pas un multiple de 8 (sinon les glyphes se déforment : un `8` peut ressembler à un `S`).
- Pas d’italique, pas de graisse synthétique, pas d’ombre de texte floue. Un décalage dur d’1–2 px `#05040A` est autorisé sur les titres de fenêtre.
- Les labels restent en français, courts, lisibles. On peut omettre les accents si la police pixel le impose (`Parametres`, `Apercu`, `Duree`) — mais le wording officiel dans le code et l’accessibilité conserve l’orthographe correcte (`Paramètres`, `Aperçu`, `Durée`).

### 1.4 Bordures, bevels, ombres

- Cadres de panneau : 2 px, bevel 16-bit.
  - Haut + gauche : `#E8DCC8` (ivoire).
  - Bas + droite : `#8B7A63` (bronze) ou `#05040A` pour un inset.
- Puits inset (preview, champs, pistes) : l’inverse du bevel (sombre en haut/gauche, ivoire en bas/droite) pour donner un effet “enfoncé”.
- Ombres portées : **4 px × 4 px, couleur `#05040A`, blur = 0**, jamais d’ombre CSS floue.
- Pas de coins arrondis anti-aliasés. Un arrondi “pixel” de 2–4 px (escalier franc) est acceptable sur les gros boutons.
- Interdit : `box-shadow` flou, `blur()`, dégradés CSS linéaires/radiaux, `border-radius` large anti-aliasé, glassmorphism, Material / Fluent / macOS Big Sur.

### 1.5 Rendu graphique (CSS / moteur)

```css
html, body, #app, canvas, img, video, svg, .pixel {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
* {
  font-smooth: never;
  -webkit-font-smoothing: none;
  -moz-osx-font-smoothing: unset;
}
```

- Toutes les bitmaps (icônes, curseurs, timelines, waveforms) s’affichent en **nearest-neighbor**.
- Les previews de médias réels (photo / vidéo importées par l’utilisateur) s’affichent dans le puits de preview ; l’UI autour reste 100 % pixel. Ne pas “pixéliser de force” le média source, sauf option utilisateur.

### 1.6 Composants de base (voir `01_guide_de_style.png`)

**Bouton primaire (CTA)** — label ex. `RENDRE`, `ENREGISTRER`  
- Normal : fond `#FF5A7A`, texte `#F5EFE0`, bevel 2 px.  
- Survol : fond `#FF8AA0`.  
- Pressé : inset, décalage 2 px vers le bas, bevel inversé.  
- Désactivé : fond `#4A4560`, texte `#9A8F7A`, pas de shine.

**Bouton secondaire** — ex. `IMPORTER`, `Ouvrir le dossier`, `Réinitialiser`  
- Fond `#1C1730`, bordure ivoire, texte parchemin.

**Bouton outil (toggle)** — barre d’outils Vidéo  
- Inactif : fond `#1C1730`, icône + label.  
- Sélectionné : fond `#261F3D`, contour 2 px `#5EC8FF`.

**Slider** — piste `#12101C`, remplissage `#5EC8FF` (ou l’accent du contexte), curseur carré 12×12 avec bord ivoire.

**Knob rotatif** — lunette bronze, disque `#12101C`, encoche ivoire, valeur numérique à droite (ex. `30%`, `0 st`).

**Case à cocher / radio** — carré 12–16 px, bevel inset, check `#5EFF9F`.

**Barre de progression** — cadre ivoire, piste `#12101C`, fill `#FF9F43` (en cours) ou `#5EFF9F` (terminé), label `45%` en VT323.

**Champ texte** — puits `#12101C`, bord inset, caret **bloc** 8×12 qui clignote, texte parchemin.

**Onglets** — inactifs `#1C1730` + texte sable ; actif `#261F3D` + texte parchemin + soulignement 4 px de l’accent d’onglet.

**Fenêtre / cadre titré** — barre de titre avec logo 16×16 (carré rose `#FF5A7A` et monogramme blanc), nom `PIXLAB`, titre du projet en sable, puis 3 boutons carrés à droite : réduire bronze, agrandir vert phosphor, fermer rouge.

**Iconographie 24×24** (à reprendre du guide) : Lecture, Pause, Couper, Recadrer, Muet, Texte, Image, Audio, Zoom +, Zoom −, Rendre, Note de musique, Paramètres (engrenage), Dossier / Importer.

---

## 2. Chrome commun à tous les écrans

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [logo] PIXLAB    Nom_du_projet                          [_] [□] [X]     │  barre de titre
├──────────────────────────────────────────────────────────────────────────┤
│ [Vidéo] [Image] [Musique] [Rendu] [⚙ Paramètres]              [RENDRE]   │  onglets + CTA
├────────────┬─────────────────────────────────────────────────────────────┤
│            │                                                             │
│  zone      │                   zone de travail                           │
│  contextuelle                                                           │
│            │                                                             │
├────────────┴─────────────────────────────────────────────────────────────┤
│ barre de statut (projet .pxl, infos techniques, zoom / sample rate…)     │
└──────────────────────────────────────────────────────────────────────────┘
```

- Les 5 onglets sont **toujours visibles**. Un seul est actif.
- Le bouton **Rendre** est visible sur Vidéo, Image et Musique (en haut à droite de la barre d’onglets). Sur l’onglet Rendu et Paramètres il peut être masqué (on n’envoie pas un réglage dans la file).
- Clic sur **Rendre** : le projet courant est **ajouté à la file d’attente** de l’onglet Rendu (il n’est pas encodé immédiatement s’il y a déjà un job en cours). Les rendus s’exécutent **un par un**, jamais en parallèle.
- La barre de statut affiche le fichier projet, puis 2–3 métadonnées utiles au contexte.
- Raccourci pour ouvrir Paramètres : voir § 8.

---

## 3. Écran Vidéo

Référence : `02_ecran_video.png`. Accent cyan `#5EC8FF`.

### 3.1 Layout

1. **Colonne gauche (~18 %)** — panneau `OUTILS`  
   Boutons icône + texte, empilés :
   - **Importer** (dossier) — importe une vidéo et/ou des images.
   - **Recadrer** (crop) — active les poignées de recadrage sur la preview.
   - **Couper** — coupe la timeline aux points choisis (playhead ou marqueurs).
   - **Retirer le son** — mute / supprime la piste audio de la vidéo source.
   - **Ajouter piste audio** — ajoute une piste audio (fichier ou depuis l’onglet Musique).
   - **Ajouter texte** — ajoute un calque texte sur la piste Texte.
   - **Ajouter image** — ajoute une image en overlay sur la piste Images.
2. **Centre** — panneau `PREVIEW`  
   - Puits 16:9 avec l’image courante de la vidéo.  
   - Poignées de crop cyan aux 4 coins quand l’outil Recadrer est actif.  
   - Barre de transport sous la preview : **Lecture**, **Pause**, timecode `00:00:12 / 00:01:24` (VT323).  
   - Contrôles de zoom à droite : bouton loupe **−**, indicateur `100%`, bouton loupe **+**.  
   - Mention discrète : `Molette pour zoomer`.
3. **Bas (~28 %)** — panneau `TIMELINE`  
   - Règle temporelle.  
   - Playhead vertical cyan.  
   - Cinq pistes nommées, de haut en bas : **Vidéo** (clips cyan), **Audio 1** (forme d’onde or), **Audio 2** (puits vide tant qu’aucune 2ᵉ piste n’est ajoutée), **Texte** (clip violet, ex. `Titre`), **Images** (clip miniature).  
   - Un bouton `+` à gauche de chaque piste permet d’ajouter un clip.
4. **Statut** : `Projet_Vacances.pxl    Zoom 100%    24 fps`

### 3.2 Interactions

- **Zoom preview** : boutons loupe + / −, **et molette de la souris** quand le pointeur est au-dessus de la preview (palier 25 % : 25, 50, 75, 100, 125, 150, 200, 300, 400). Le zoom n’affecte que l’aperçu, pas la résolution de sortie.
- Lecture / pause : bouton ou `Espace`.
- Couper : place une coupe au playhead (outil Couper ou touche `C`).
- Recadrer : l’utilisateur ajuste les poignées ; un ratio libre ou calé (optionnel) est possible.
- Retirer le son : bascule, l’état se lit sur la piste Audio (muet / clip retiré).
- Ajouter texte / image / audio : crée un clip sur la piste correspondante, sélectionné pour édition.
- **Rendre** envoie ce projet dans la file (onglet Rendu), avec une miniature extraite de la preview.

---

## 4. Écran Image

Référence : `03_ecran_image.png`. Accent violet `#C77DFF`.

### 4.1 Layout

1. **Colonne gauche (~28 %)** — `OUTILS IMAGE`, 4 blocs :
   - **IA UPSCALE** — label `Qualité IA`. Deux bascules : **×2** (sélectionnée par défaut, fill violet) et **×4**.
   - **AUTO CROP** — label `Ratio`. Grille de chips : **1:1**, **4:3**, **3:2**, **16:9**, **9:16**, **21:9**, **4:5**, **2:3**, **5:4**, **Libre**. Le chip actif a un contour cyan ou violet.
   - **Renommer** — label `Nom de sortie`, champ texte (ex. `portrait_x2.png`) avec caret bloc. (Sur la maquette le titre de section peut apparaître “RENOMER” : l’intitulé correct est **Renommer**.)
   - Bouton large **Envoyer vers Vidéo** (fond / contour violet, icône image) : importe l’image (déjà upscalée / recadrée) dans l’onglet Vidéo comme overlay ou média source.
2. **Centre** — preview **AVANT | APRÈS**, deux puits égaux.  
   - `AVANT` : image source.  
   - `APRÈS` : résultat upscale + crop, badge `×2` ou `×4` en violet.  
   - Un rectangle de crop du ratio choisi est superposé sur les deux vues.
3. **Statut** : `Portrait_upscale.pxl    Sortie 2048×1152    Ratio 16:9`

### 4.2 Interactions

- Changer ×2 / ×4 relance l’aperçu “Après”.
- Choisir un ratio relance l’auto-crop et met à jour le rectangle + la résolution de sortie dans la barre de statut.
- Le nom de sortie est éditable à tout moment ; il sera utilisé au rendu.
- **Envoyer vers Vidéo** bascule sur l’onglet Vidéo et pose l’image sur la piste Images (ou l’offre comme nouveau calque).
- **Rendre** ajoute un job de type Image dans la file, miniature = aperçu “Après”.

---

## 5. Écran Musique

Référence : `04_ecran_musique.png`. Accent or `#FFC857`.

### 5.1 Layout

1. **Gauche** — bouton / zone **Importer** (dossier).
2. **Centre** — panneau `FORME D'ONDE`  
   - Grande waveform pixel (or + cyan) dans un puits `#12101C`.  
   - Règle temporelle (ex. `00:00` → `02:14`).  
   - Poignées de coupe **IN** et **OUT** (barres verticales or avec poignées carrées), région retenue légèrement mise en avant, hors-région atténuée.  
   - Playhead cyan.  
   - Timestamps sous les poignées et sous le playhead.  
   - Transport : Lecture, Pause, Stop, Boucle, timecode `00:00:32 / 00:02:14`, légende `Aperçu lecture`.
3. **Droite** — panneau `EFFETS`  
   - **Vitesse** : slider `0.5×` – `1.0×` – `1.5×` – `2.0×`. Légende obligatoire : **Sans déformation du pitch** (time-stretch, pas un simple resample).  
   - **REVERB** : knob + valeur `30%`.  
   - **PITCH** : knob + valeur en demi-tons `0 st`, boutons `−` / `+`.
4. **Statut** : `Theme_lofi.pxl    44.1 kHz    Stéréo`

### 5.2 Interactions

- Glisser IN / OUT pour couper (la sortie ne contient que l’intervalle IN–OUT).
- L’aperçu lecture tient compte de la vitesse (time-stretch), de la reverb et du pitch, en temps réel ou quasi réel.
- Le slider Vitesse **ne doit pas** modifier le pitch ; le knob Pitch est indépendant.
- **Rendre** ajoute un job de type Musique dans la file. **Miniature obligatoire : icône pixel “note de musique”** (or sur puits sombre), jamais une photo ni une waveform comme vignette de liste.

---

## 6. Écran Rendu

Référence : `05_ecran_rendu.png`. Accent orange `#FF9F43`.

### 6.1 Layout

1. **Liste principale** — `FILE D'ATTENTE`  
   Chaque ligne affiche :
   - une **miniature 48×48** :
     - projet Vidéo : frame extraite de la preview ;
     - projet Image : aperçu “Après” ;
     - projet Musique : **icône note de musique** pixel art (`#FFC857` sur `#12101C`) ;
   - le **nom du projet** ;
   - une ligne de détail `Source : Onglet Vidéo | Image | Musique` ;
   - le **statut** : badge `En attente` (sable), `En cours` (orange), `Terminé` (vert) ;
   - une barre de progression pixel : vide (attente), fill orange + pourcentage (en cours), fill vert `100%` + coche (terminé).
2. **Panneau droit** — `DÉTAILS` du job sélectionné : grande miniature, champs `Projet`, `Source`, `Format`, `Durée`, `Date`, boutons **Annuler** (rouge, actif seulement si En attente ou En cours) et **Ouvrir le dossier** (secondaire). Mention en bas : `Les rendus s'effectuent un par un.`
3. **Statut** : `1 en cours    2 en attente    1 terminé`

### 6.2 Règles de file

- On peut empiler **autant de jobs que l’on veut**.
- Un seul job passe à `En cours` à la fois. Les suivants restent `En attente`.
- Quand un job passe à `Terminé`, le suivant démarre automatiquement.
- Annuler un job `En cours` interrompt l’encodage et démarre le suivant ; annuler un `En attente` le retire de la liste.

---

## 7. Écran Paramètres

Référence : `06_ecran_parametres.png`. Accent ivoire `#E8DCC8`.

### 7.1 Layout

1. **Liste de gauche** — catégories : **Raccourcis** (sélectionnée par défaut), **Apparence**, **Général**, **À propos**. (Le titre de liste “OUTILS” éventuellement visible sur la maquette est une typo : utiliser **Catégories** ou aucun titre.)
2. **Panneau principal** quand Raccourcis est actif :
   - Titre : `Raccourcis clavier`
   - Sous-titre : `Cliquez sur une touche pour la redéfinir.`
   - Groupes (en-têtes or) : **Global**, **Vidéo**, **Image**, **Musique**.
   - Chaque ligne : **nom de l’action** | **touche (key cap pixel)** | bouton **Modifier**.
   - Une ligne en cours d’édition a un contour cyan sur le key cap et la légende `Appuyez sur une touche…`
   - Boutons bas : **Réinitialiser** (secondaire, restaure les défauts) et **Enregistrer** (CTA rose).
3. **Apparence** (à prévoir, même si non maquetté en détail) : facteur d’échelle 1×/2×/3×/4×, éventuellement intensité CRT (off / léger scanline), toujours dans la palette.
4. **Statut** : `Paramètres    22 raccourcis`

### 7.2 Rebinding

- Clic sur le key cap ou sur **Modifier** : entre en mode saisie, la prochaine touche (avec éventuellement Ctrl / Shift / Alt) remplace le raccourci.
- Conflit : si la combinaison est déjà prise, afficher un dialogue pixel `Cette touche est déjà utilisée par [action]. Remplacer ?` — Oui / Non.
- Échap annule la saisie en cours.
- Les raccourcis s’appliquent globalement dès **Enregistrer** (ou immédiatement, au choix, mais l’UI montre clairement l’état).

---

## 8. Raccourcis clavier par défaut

Tous sont éditables dans Paramètres.

### Global

| Action | Défaut |
|---|---|
| Importer | `Ctrl+I` |
| Rendre | `Ctrl+R` |
| Annuler | `Ctrl+Z` |
| Rétablir | `Ctrl+Y` |
| Enregistrer le projet | `Ctrl+S` |
| Ouvrir Paramètres | `Ctrl+,` |

### Vidéo (et transport partagé)

| Action | Défaut |
|---|---|
| Lecture / Pause | `Espace` |
| Couper | `C` |
| Recadrer | `R` |
| Retirer le son / Muet | `M` |
| Zoom avant | `+` (également molette haut sur la preview) |
| Zoom arrière | `-` (également molette bas sur la preview) |
| Ajouter texte | `T` |
| Ajouter image | `I` |
| Ajouter audio | `A` |

### Image

| Action | Défaut |
|---|---|
| Upscale | `U` |
| Auto crop | `X` |
| Envoyer vers Vidéo | `Ctrl+E` |
| Renommer (focus champ) | `F2` |

### Musique

| Action | Défaut |
|---|---|
| Couper audio (poser / confirmer IN–OUT) | `C` |
| Lecture / Pause | `Espace` |
| Reverb (focus knob) | `V` |
| Pitch (focus knob) | `P` |

---

## 9. Interactions transverses

- **Rendre** depuis Vidéo, Image ou Musique pousse un job vers l’onglet Rendu, sans bloquer l’édition. Un petit flash / badge numérique sur l’onglet Rendu indique le nombre de jobs en attente + en cours.
- **Envoyer vers Vidéo** (Image) ne lance pas de rendu : il copie le média traité dans le projet Vidéo courant (ou en crée un s’il n’y en a pas).
- Les fichiers projet internes utilisent l’extension `.pxl`.
- Curseurs : flèche par défaut, I-beam dans les champs texte, loupe au survol de la preview Vidéo (quand le zoom molette est disponible), poignée de redimensionnement sur IN/OUT et crop.
- Focus clavier visible : contour 2 px cyan sur le composant focus.

---

## 10. Ce qu’il ne faut pas faire

- Pas d’anti-aliasing sur l’UI, pas de flou, pas de dégradés lisses, pas d’ombres douces.
- Pas de typographie vectorielle lissée (Inter, Roboto, SF Pro, etc.).
- Pas de palette hors des 19 hex. Pas de mode clair.
- Pas de rendus encodés en parallèle.
- Pas de vignette photo ou waveform pour un projet Musique dans la file : uniquement la **note de musique** pixel.
- Ne pas “improviser” des labels anglais. Toute l’UI est en français.
- En cas de doute sur un détail visuel, copier les maquettes et le guide de style plutôt que d’inventer un composant plat.

---

## 11. Prompt prêt à coller pour une autre IA

Copier le bloc ci-dessous tel quel pour générer / implémenter l’UI.

```
Tu dois implémenter l’interface desktop de PIXLAB, une application de montage / gestion vidéo, image et musique. La direction artistique est 100 % pixel art 16-bit (SNES / GBA), grille 4 px, aucun anti-aliasing, aucun flou, aucun dégradé lisse, aucune ombre douce, aucun style Material / Fluent. image-rendering: pixelated partout. Typo : Press Start 2P (titres / boutons / onglets, tailles 8/16/24/32 uniquement), Silkscreen (labels), VT323 (timecodes). Langue de tous les labels : français.

Palette exclusive (19 couleurs) :
#0E0C16 Encre (fond), #1C1730 Prune sombre (panneaux), #261F3D Prune (onglet actif), #12101C Puits (insets), #E8DCC8 Ivoire (bord clair), #8B7A63 Bronze (bord médian, knobs), #F5EFE0 Parchemin (texte), #9A8F7A Sable (texte muet), #FF5A7A Rose pixel (CTA Rendre), #FF8AA0 Rose clair (hover), #5EFF9F Vert phosphor (play / succès / Terminé), #5EC8FF Cyan 16-bit (sélection, playhead, accent Vidéo), #FFC857 Or (audio, accent Musique), #C77DFF Violet magie (IA, texte, accent Image), #FF9F43 Orange (rendu en cours, accent Rendu), #4A4560 Gris pierre (désactivé), #E83B3B Rouge (fermer, danger), #05040A Ombre (drop shadow dur 4px 0 blur), #FFF8EE Blanc chaud (highlight de bevel).

Chrome commun : barre de titre (logo carré rose 16×16 + PIXLAB + nom du projet + boutons réduire / agrandir / fermer), barre d’onglets toujours visible (Vidéo, Image, Musique, Rendu, Paramètres), bouton RENDRE en haut à droite sur les onglets Vidéo / Image / Musique, barre de statut en bas. Bevel 2 px ivoire haut-gauche / bronze bas-droite. Ombres 4×4 px #05040A sans flou.

Écran Vidéo : outils à gauche (Importer, Recadrer, Couper, Retirer le son, Ajouter piste audio, Ajouter texte, Ajouter image), preview centrale 16:9 avec poignées de crop, transport play/pause + timecode, zoom loupe + / − et zoom à la molette, timeline en bas avec pistes Vidéo, Audio 1, Audio 2, Texte, Images et playhead cyan.

Écran Image : IA Upscale ×2 / ×4, auto crop avec TOUS les ratios 1:1, 4:3, 3:2, 16:9, 9:16, 21:9, 4:5, 2:3, 5:4, Libre, champ Renommer (nom de sortie), bouton Envoyer vers Vidéo, preview AVANT / APRÈS.

Écran Musique : waveform avec poignées de coupe IN / OUT, aperçu lecture, slider Vitesse en time-stretch SANS déformer le pitch (0.5× à 2.0×), knob Reverb, knob Pitch (demi-tons).

Écran Rendu : file d’attente, un seul job « En cours » à la fois, les autres « En attente », puis « Terminé ». Chaque ligne : miniature 48×48 (frame vidéo ou image ; pour un projet musique : icône pixel note de musique, jamais une photo), nom du projet, source (onglet d’origine), statut, barre de progression pixel. Panneau Détails à droite.

Écran Paramètres : liste éditable de TOUS les raccourcis, groupés Global / Vidéo / Image / Musique, chaque ligne action + touche + bouton Modifier, mode « Appuyez sur une touche… » pour rebinder. Défauts : Importer Ctrl+I, Rendre Ctrl+R, Annuler Ctrl+Z, Rétablir Ctrl+Y, Enregistrer Ctrl+S, Lecture Espace, Couper C, Recadrer R, Muet M, Zoom + / −, Ajouter texte T, Ajouter image I, Ajouter audio A, Upscale U, Auto crop X, Envoyer vers Vidéo Ctrl+E, Renommer F2, Reverb V, Pitch P. Molette souris = zoom de la preview Vidéo.

Suis fidèlement les maquettes et le guide de style fournis (00_croquis_layouts.png, 01_guide_de_style.png, 01b_palette_exacte.png, 02 à 06_ecran_*.png) et le fichier SPEC_UI.md. Si une typo apparaît sur une maquette (ex. RENOMER, OUTILS dans Paramètres), suis l’orthographe de la spec (Renommer, catégories Paramètres).
```

---

## 12. Notes de relecture des maquettes

Petites divergences à ignorer au profit de cette spec :

- Les logos de barre de titre varient légèrement d’une maquette à l’autre : le logo officiel est un **carré 16×16 rose `#FF5A7A`** avec un monogramme clair.
- Onglet Image : le bloc s’intitule **Renommer** (pas “RENOMER”).
- Onglet Paramètres : la liste de gauche s’appelle **Catégories** (pas “OUTILS”). Les key caps colorés de la maquette sont acceptables, mais un key cap monochrome ivoire/prune + bouton **Modifier** est le pattern à implémenter en priorité.
- Les poignées IN/OUT de la maquette Musique doivent visuellement coïncider avec les labels IN et OUT (barres aux extrémités de la région retenue).
- Les polices pixel des maquettes générées approximant Press Start 2P : en production, utiliser les vrais fichiers `PressStart2P`, `Silkscreen` et `VT323`.

Fin du document.
