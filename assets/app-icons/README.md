# Android App Icon Artwork

Source mapping:

| CMS key | Artwork file |
| --- | --- |
| default | default.png (Main RP Logo) |
| navratri | navratri.png (Navratri Logo) |
| dasera | dasera.png (Dasera Logo) |
| diwali | diwali.jpg (Diwali Logo) |

To update artwork, replace the corresponding source file here and run from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/export-android-app-icons.ps1
```

The exporter produces 48/72/96/144/192px launcher PNGs and 108/162/216/324/432px
adaptive foreground layers. The artwork is centered inside the adaptive layer's 66dp safe area.
Adaptive XML uses a dedicated foreground and matching solid background for each supplied icon.
Default round-icon resources are also regenerated. These are Android resources only.

Rebuild and reinstall the Android app after changing bundled artwork; Metro refresh alone
cannot update launcher resources. CMS campaigns select the bundled keys, not image URLs.
Use `navratri`, `dasera`, or `diwali` for scheduled artwork and `default` to restore Main RP Logo.
Eid, Christmas, Holi, and Independence Day still use the earlier placeholder resources.
