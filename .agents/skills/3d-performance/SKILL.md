---
name: 3d-performance
description: Investigate a rendering, interaction, loading, or memory regression in the anatomy viewer using measured evidence.
---

# 3D performance investigation

Capture environment and a reproducible scenario. Measure before changing code: asset bytes, initialization time, steady-state frame activity, FPS while interacting, draw calls, triangles, texture/material counts, raycast cost, filter latency, and memory where the browser exposes it. Inspect R3F subscriptions, frame-loop ownership, repeated allocations, loading/cache behavior, object visibility, disposal, DPR, and pointer updates.

Apply the smallest evidence-backed correction, rerun the same scenario, then separate measured results from hypotheses. Report environment, baseline, change, after-measurement, risks, and verification. Do not propose BVH, LOD, or compression without evidence that it targets the bottleneck.
