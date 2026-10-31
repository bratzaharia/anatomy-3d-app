# Pulmonary arterial subset

The existing pulmonary trunk `cardiac-fma8612` is reused. Right and left
pulmonary arteries are `arterial-fma50872` and `arterial-fma50873`.
Two source sets expose segmental and subsegmental pulmonary arterial surfaces,
but their constituent named vessels are not individually mapped. Their two
records must not be described as complete lobar/segmental selectable coverage.

All are classified as arteries with `circulation: pulmonary`, independently of
oxygenation. Bronchial systemic supply and pulmonary venous return are separate.
No pulmonary artery-to-vein mesh or capillary network is manufactured. The
existing cardiac semantic flow graph supplies the right-ventricular cavity and
pulmonary-valve context; artery origin tracing stops at the pulmonary trunk.

**Implemented:** shared identity, authentic source surfaces, independent filters,
selection and materials alongside veins/heart. **Pending:** individually mapped
lobar branches, exhaustive named segmental branches, anatomical variants,
registered organ-supply maps, measured lumen/connectivity and clinical review.
