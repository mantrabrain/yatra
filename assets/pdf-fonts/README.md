# Yatra PDF Fonts

This directory holds TTF/OTF font files that `PdfService` auto-registers
with Dompdf at render time. The plugin ships with Noto Sans Devanagari
so Nepali/Hindi/Marathi/Sanskrit PDFs render correctly out of the box —
Dompdf's only bundled Unicode font (DejaVu Sans) does not include the
Devanagari script, so without these the glyphs come out as empty
rectangles.

## Adding a font for another script

1. Drop the regular weight as `<Family>-Regular.ttf` (e.g.
   `NotoSansArabic-Regular.ttf`).
2. Drop bold/italic variants as `<Family>-Bold.ttf`,
   `<Family>-Italic.ttf`, `<Family>-BoldItalic.ttf` if you have them —
   missing weights are auto-filled from the regular variant.
3. Add the family name to the `font-family` chain in
   `templates/pdf/*.php` so Dompdf knows to consult it.

The PDF templates ship with the following fallback chain:

```
font-family: "Noto Sans Devanagari", "Noto Sans Arabic",
             "Noto Sans CJK", "DejaVu Sans", sans-serif;
```

For a per-site override (e.g. a corporate font), site admins can drop
TTFs into `wp-content/uploads/yatra-pdf-fonts/` — they are scanned the
same way and override anything bundled here.

## Filters

- `yatra_pdf_default_font` — change the resolved family Dompdf uses as
  its `defaultFont` for the current locale.
- `yatra_pdf_fonts_dir` — change the upload directory scanned in
  addition to this bundled one.
- `yatra_pdf_extra_fonts` — register fonts imperatively. Returns an
  array of `[ 'Family Name' => [ 'normal' => '/abs/path.ttf', 'bold' =>
  '/abs/path.ttf', 'italic' => …, 'bold_italic' => … ] ]`.

## Font sources

The bundled Noto Sans Devanagari is from the
[google/fonts](https://github.com/googlefonts/noto-fonts) repository,
SIL Open Font License 1.1. See
`https://github.com/googlefonts/noto-fonts/blob/main/LICENSE`.
