export const venousRo = {
  "venous.title": "Stratul 04 — Sistem venos",
  "venous.coverage":
    "{{individual}} structuri · {{grouped}} seturi · {{missing}} fără geometrie",
  "venous.review":
    "Geometrie educațională din sursă, nerevizuită medical. Inventar parțial; terminologia română și latină necesită revizuire.",
  "venous.all": "Toate venele",
  "venous.regions": "Regiuni anatomice",
  "venous.depth": "Clasificare superficial / profund",
  "venous.superficial": "Superficiale",
  "venous.deep": "Profunde",
  "venous.perforating": "Perforante",
  "venous.unknown": "Clasificare necunoscută",
  "venous.filterHint":
    "Reuniune în același filtru; intersecție între filtre. Fără regiuni sau profunzimi selectate = fără restricție. Clasificările necunoscute nu sunt presupuse.",
  "venous.opacity": "Opacitatea stratului venos",
  "venous.mode": "Mod de afișare venos",
  "venous.mode.standard": "Anatomic",
  "venous.mode.blue": "Albastru",
  "venous.mode.depth": "Profunzime",
  "venous.mode.contrast": "Contrast",
  "venous.modeNote":
    "Culori convenționale pentru studiu, nu culori biologice sau imagistică medicală. În modul profunzime: cyan = superficial, violet = profund, ocru = perforant, gri = necunoscut.",
  "venous.isolate": "Izolează stratul venos",
  "venous.restore": "Revino la contextul anterior",
  "venous.trace": "Urmărește drenajul de referință",
  "venous.traceTitle": "Traseu semantic de referință",
  "venous.traceNote":
    "Relații documentate, nerevizuite clinic; lista nu certifică unirea suprafețelor 3D. Microcirculația hepatică este doar un punct conceptual, fără model. Relațiile absente și variantele nu sunt deduse.",
  "venous.noPath":
    "Nu există o relație de drenaj verificabilă în inventarul curent.",
  "venous.inventory": "Inventar regional și lipsuri",
  "venous.available": "Geometrie-sursă disponibilă · nerevizuită",
  "venous.missing": "Fără geometrie acceptată; nu se desenează o aproximație",
  "venous.sideConflict":
    "În carantină: lateralitatea sursei nu corespunde coordonatelor. Nu am oglindit sau reetichetat modelul.",
  "venous.femaleMissing":
    "Sursa este un corp masculin; nu există încă un model feminin compatibil acceptat.",
  "venous.set": "Set-sursă, nu fiecare vas individual",
  "venous.source": "Sursă și licență",
  "venous.sex":
    "Referință de corp masculin; anatomia feminină specifică nu este suprapusă.",
  "venous.details": "Detalii venoase",
  "venous.drainsInto": "Drenaj de referință către",
  "venous.tributaries": "Afluenți documentați în inventar",
  "venous.notRecorded":
    "Nedocumentat în acest inventar; nu implică absență anatomică",
  "venous.depthLabel": "Profunzime",
  "venous.categoryLabel": "Categorie",
  "venous.category.vein": "Venă",
  "venous.category.dural-sinus": "Sinus venos dural",
  "venous.category.cardiac-sinus": "Sinus venos coronar",
  "venous.category.plexus": "Plex venos",
  "venous.category.microanatomy": "Microanatomie",
  "venous.multi":
    "Shift/Ctrl/Cmd + clic adaugă sau elimină o venă din selecție.",
  "venous.loading": "Se încarcă regiunile venoase…",
  "venous.error":
    "O regiune venoasă nu s-a încărcat. Celelalte straturi rămân disponibile.",
  "venous.viewerLabel": "Anatomie 3D interactivă — sistem venos BodyParts3D",
} as const;
export const venousEn: Record<keyof typeof venousRo, string> = {
  "venous.title": "Layer 04 — Venous system",
  "venous.coverage":
    "{{individual}} structures · {{grouped}} sets · {{missing}} without geometry",
  "venous.review":
    "Educational source geometry, not medically reviewed. Partial inventory; Romanian and Latin terminology require review.",
  "venous.all": "All veins",
  "venous.regions": "Anatomical regions",
  "venous.depth": "Superficial / deep classification",
  "venous.superficial": "Superficial",
  "venous.deep": "Deep",
  "venous.perforating": "Perforating",
  "venous.unknown": "Unknown classification",
  "venous.filterHint":
    "OR within each facet; AND between facets. No selected regions or depths means unrestricted. Unknown classifications are not assumed.",
  "venous.opacity": "Venous layer opacity",
  "venous.mode": "Venous display mode",
  "venous.mode.standard": "Anatomical",
  "venous.mode.blue": "Blue",
  "venous.mode.depth": "Depth",
  "venous.mode.contrast": "Contrast",
  "venous.modeNote":
    "Conventional study colors, not biological colors or medical imaging. In depth mode: cyan = superficial, violet = deep, ochre = perforating, gray = unknown.",
  "venous.isolate": "Isolate venous layer",
  "venous.restore": "Restore previous context",
  "venous.trace": "Trace reference drainage",
  "venous.traceTitle": "Reference semantic pathway",
  "venous.traceNote":
    "Documented relationships, not clinically reviewed; the list does not certify connected 3D surfaces. Hepatic microcirculation is a conceptual endpoint only, with no model. Missing relationships and variants are not inferred.",
  "venous.noPath":
    "No supported drainage relationship in the current inventory.",
  "venous.inventory": "Regional inventory and gaps",
  "venous.available": "Source geometry available · unreviewed",
  "venous.missing": "No accepted geometry; no approximation is drawn",
  "venous.sideConflict":
    "Quarantined: source laterality conflicts with coordinates. No automatic mirroring or relabelling.",
  "venous.femaleMissing":
    "The source is a male body; no compatible female model has been accepted yet.",
  "venous.set": "Source set, not each individual vessel",
  "venous.source": "Source and license",
  "venous.sex": "Male body reference; female-specific anatomy is not overlaid.",
  "venous.details": "Venous details",
  "venous.drainsInto": "Reference drainage into",
  "venous.tributaries": "Tributaries documented in this inventory",
  "venous.notRecorded":
    "Not documented in this inventory; not evidence of anatomical absence",
  "venous.depthLabel": "Depth",
  "venous.categoryLabel": "Category",
  "venous.category.vein": "Vein",
  "venous.category.dural-sinus": "Dural venous sinus",
  "venous.category.cardiac-sinus": "Coronary venous sinus",
  "venous.category.plexus": "Venous plexus",
  "venous.category.microanatomy": "Microanatomy",
  "venous.multi":
    "Shift/Ctrl/Cmd + click adds or removes a vein from selection.",
  "venous.loading": "Loading venous regions…",
  "venous.error":
    "A venous region could not load. Other layers remain available.",
  "venous.viewerLabel": "Interactive 3D anatomy — BodyParts3D venous system",
};
