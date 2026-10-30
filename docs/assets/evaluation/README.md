# Isolated asset evaluation — pending authorized sample

This worktree starts at `1a2b6df1b01b51f38d3a148f20064e25a701c223`, the coverage
implementation backed up on `origin/codex/anatomy-coverage-completion`. The main
checkout stays on that branch. Experimental changes belong only to
`codex/licensed-asset-preview` in this separate working directory.

## Start the isolated baseline

```sh
pnpm install --frozen-lockfile --offline --ignore-scripts
pnpm dev:asset-preview
```

With that server running, `pnpm verify:asset-preview` checks the linked-worktree
and workspace-package boundaries, local-only model requests, actual source-bone
hover/isolation/hiding and cache counts. It leaves an ignored baseline screenshot
under `.private-asset-evaluation/`; this is the existing BodyParts3D scaphoid,
not a supplier sample. The check does not verify proprietary models or their rights.

Open <http://127.0.0.1:5180/>. This command binds only to loopback and fails if
5180 is occupied; it does not silently move onto the existing 5173 server.
The existing development server and production deployment are not changed.
The worktree has its own dependency installation and workspace aliases; do not
symlink its workspace packages to the main checkout. Do not link this worktree
to Vercel, copy production environment files, or deploy the evaluation.

The baseline is the existing BodyParts3D/Z-Anatomy viewer. **It is not a Catfish
model preview or evidence of their model quality.** No proprietary model has
been extracted, copied, reconstructed, registered, or rendered by this setup.

## Acceptance gate for one sample

1. Obtain a written evaluation grant for the exact sample and planned private
   localhost browser use, with conversion/adaptation and screenshot terms.
   An app purchase/subscription alone is not treated as an asset licence.
2. Keep any permitted sample and agreement in `.private-asset-evaluation/`,
   which is ignored by Git and outside the web public directory. A Git ignore
   rule is not access control: do not force-add, upload, or publicly serve it.
3. Record exact source, version, checksum, creator, license, attribution,
   evaluation expiry and redistribution limits before processing. Follow
   `anatomy-asset-audit`; unresolved rights stop the import.
4. Begin with one bone only. Keep fixed skeletal/muscular/neural assets,
   transforms, IDs and existing render modes intact. A future preview must be
   explicitly enabled, separate from accepted anatomical coverage, and clearly
   labelled unreviewed. This setup does not yet implement that importer.
5. Verify scale/orientation, registration, topology, anatomical identity,
   selection, hidden non-picking, cache/resource ownership and performance.
   Never invent geometry to conceal a missing or incompatible structure.
6. Compare against the baseline. Publish/merge only after the appropriate final
   license, source audit, technical checks, anatomical review and owner approval.

The prepared [sample request](CATFISH_DEMO_REQUEST.md) is a draft only. No message
has been sent to the supplier. No purchase, pull request, merge or deployment is
part of this setup. Worktrees share Git history and are not independent backups;
the separate GitHub coverage branch provides the committed-code backup.

## Baseline verification — 2026-10-29

Typecheck, lint, formatting, all 98 unit tests, anatomy/i18n validators and the
production build passed in this worktree. The browser smoke check passed on
5180: the skeleton GLB returned HTTP 200, no external origins or browser errors
were observed, source-bone hover/isolation/hiding worked, and geometry counts
returned to baseline after restoring visibility. Its screenshot was visually
checked. This was a targeted smoke check, not a new full E2E-suite run or a
medical validation. The primary checkout remained clean and its existing 5173
server stayed running; no production deployment was performed.
