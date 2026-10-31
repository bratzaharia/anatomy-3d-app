# Arterial performance and resource budgets

Actual real source geometry, not fixtures. Measurements are local Chromium
diagnostics; a software/headless renderer is not a representative clinical
workstation or physical mobile GPU benchmark.

| Scope                                            |       Transfer bytes |  Triangles | Draw calls including grid |
| ------------------------------------------------ | -------------------: | ---------: | ------------------------: |
| Before arterial activation                       | 0 arterial GLB bytes | 0 arterial |                 unchanged |
| Default major subset (55 records)                |            2,303,316 |    177,590 |                        56 |
| Complete available arterial subset (219 records) |            7,439,916 |    540,614 |                       220 |
| New arterial files only (10 packets)             |            7,204,128 |    524,642 |                212 meshes |
| Full arteries + default three cardiac walls      | shared packet reused |    603,384 |                       223 |

Decoded buffer footprint of the ten new packets: 13,184,712 bytes; shared cardiac
arterial packet adds 422,016 bytes. This is buffer data, **not measured peak GPU
memory**. Texture/program/geometry counters, idle frames and per-object raycast
timing are exposed only with `?diagnostics`. No telemetry is sent externally.

Budgets: zero arterial requests initially; default arterial transfer <2.5 MB,
<60 draws, <200k triangles; optional all-detail transfer <8 MB and <225 draws;
idle additional frames 0; no duplicate shared cardiac mesh draws. Browser tests
measure these contracts. Real-device sustained FPS, peak GPU/heap memory, cold
mobile network timings and complete-scene raycast p95 remain required before
claiming production performance. Local load time includes test navigation/UI,
not an isolated network benchmark; measured values are recorded in the test log.

Demand rendering, cached regional GLBs, memoized ID meshes and disposed owned
materials avoid permanent frame requests. Opaque/hidden nodes are not picked;
zero opacity prevents new packet mounting. Fine source sets are not automatically
loaded on initial activation. Named/fine packets share regional files rather
than distinct decimated LODs. Page-lifetime GLTF cache is intentional; mobile
cache eviction/true LODs and expanded thin-vessel picking remain future work.

Production build retains an existing large-JS-chunk warning. Current outputs:
main JS approximately 2.35 MB raw / 445 kB gzip; scene JS approximately 1.04 MB /
278 kB gzip. Anatomy meshes are external files, not bundled into JavaScript.
This is documented debt, not an exceptionally-fast-device FPS guarantee.

Final targeted browser run: five arterial scenarios passed, including all 32
global layer combinations. Initial major activation including test UI/navigation
took 1,039 ms locally. Aorta picking sample: five object calls, total 1.8 ms,
max/p95 1.2 ms (not a whole-scene physical-device latency guarantee). Idle frames
did not advance over one second. Full arteries + default cardiac walls submitted
223 calls / 603,386 triangles including the grid, with 223 geometry buffers and
two shader programs. The two initially requested GLB URLs were not re-requested
on mode changes/restoration. No fine regional GLB was requested initially.
