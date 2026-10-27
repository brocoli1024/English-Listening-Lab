; Show the same reviewed terms for fresh installs and upgrades. The default
; electron-builder license page can be skipped by --updated, so use the
; unconditional welcome-page hook instead. No silent acceptance is implied.
!define LL_TERMS_FILE "${__FILEDIR__}\..\..\MICROSOFT_RUNTIME_TERMS.txt"
!macro customWelcomePage
  !define MUI_LICENSEPAGE_CHECKBOX
  !insertmacro MUI_PAGE_LICENSE "${LL_TERMS_FILE}"
!macroend
!macro customInit
  ${If} ${Silent}
    SetErrorLevel 2
    Quit
  ${EndIf}
!macroend
