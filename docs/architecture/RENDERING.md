# Rendering architecture

`AnatomyCanvas` owns WebGL configuration, demand invalidation, lights, controls, and camera transitions. `SkeletonModel` loads a locally hosted Meshopt GLB, verifies all canonical mappings, and resolves visible IDs through the pure core function. Hidden meshes have `visible=false` and an explicit no-op raycast, so cached geometry remains mounted without retaining selection eligibility. Boolean per-bone Zustand subscriptions limit hover/selection rerenders to affected bones. No external environment image request is needed.

The generated manifest validates through Zod. The anatomy validator checks actual GLB bytes, SHA-256, decompressed buffers, triangle count, all mesh IDs, finite vertices/normals, index bounds, and bounds agreement. Region-level assets can be added behind the same cache boundary. Loading failure is localized and exposes a reload action; context restoration still requires physical-device testing.

Camera commands are semantic (`front`, `back`, `left`, `right`, `fit`, `focus`). Fit uses the model dimensions and viewport aspect ratio; focus uses the selected structure's bounds or a union of region bounds. Transitions update camera position and controls target together, stop on user orbit, respect reduced motion, and invalidate only during movement.
