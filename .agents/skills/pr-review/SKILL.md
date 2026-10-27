---
name: pr-review
description: Review local or pull-request changes for this atlas when architectural, medical-data, localization, visibility, licensing, or 3D performance risks may be present.
---

# Atlas PR review

Read the applicable `AGENTS.md`, establish the exact diff, and inspect affected contracts before implementation details. Verify stable anatomy IDs, non-invented medical data, deterministic layer/raycast behavior, localization parity, error paths, asset provenance, React subscription scope, frame-loop behavior, allocation/disposal, and relevant tests. Run the smallest meaningful verification set; never claim an unexecuted check passed.

Report only actionable findings grouped as critical, high, then medium/low, with file and line, minimal fix, test status, residual risks, and a final recommendation. Do not duplicate formatter or linter feedback and never auto-approve medically sensitive content merely because tests pass.
