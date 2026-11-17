; PIXLAB — extras NSIS (désinstalleur + raccourci)
!macro customInstall
  ; Raccourci désinstallation dans le menu Démarrer
  CreateDirectory "$SMPROGRAMS\PIXLAB"
  CreateShortCut "$SMPROGRAMS\PIXLAB\Desinstaller PIXLAB.lnk" "$INSTDIR\Uninstall PIXLAB.exe"
!macroend

!macro customUnInstall
  Delete "$SMPROGRAMS\PIXLAB\Desinstaller PIXLAB.lnk"
  RMDir "$SMPROGRAMS\PIXLAB"
!macroend
