# Cardiac performance scope

Generated source subset: 30 parts, 124,482 triangles, three lossless Meshopt GLBs,
1,793,124 bytes total. Actual per-package encoded/decoded sizes and counts are in
the manifest; these are not high-resolution or independently authored LODs.

| Package  | Encoded bytes | Decoded attribute/index bytes | Triangles |
| -------- | ------------: | ----------------------------: | --------: |
| External |       974,592 |                     1,769,160 |    69,718 |
| Internal |       582,744 |                       996,744 |    38,792 |
| Arterial |       235,788 |                       422,016 |    15,972 |

Expected default cardiac-only visible set: three wall source parts plus the
existing grid, with four cavity parts cached in the same external package but
hidden. Internal and arterial packages are requested only for enabled groups.
The initial application state requests **zero** cardiac GLBs. Existing venous
assets retain their own independent lazy loading and cache.

No cardiac `useFrame`, heartbeat timer or permanent render loop is introduced.
Source geometry is reused, not cloned per selection; locally created materials
are disposed. CPU picking rejects hidden, zero-opacity and clipped surfaces.

Browser tests measure demand-render idle frames, counts, request/cache reuse and
mobile layout. Test-run attachments record actual rendered views. Headless
software-renderer measurements do not establish physical mobile GPU FPS or a
clinical performance target. Texture maps, advanced detail LODs, measured real
device memory and motion packages remain future work.
