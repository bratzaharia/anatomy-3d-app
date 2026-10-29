import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  ro: {
    translation: {
      "app.title": "Atlas anatomic 3D",
      "app.subtitle": "Explorează corpul uman pe straturi",
      "panels.navigation": "Deschide sau închide navigarea",
      "panels.inspector": "Deschide sau închide inspectorul",
      "nav.regions": "Regiuni anatomice",
      "nav.wholeBody": "Corp întreg",
      "nav.planned": "planificat",
      "filters.title": "Straturi anatomice",
      "filters.all": "Toate straturile",
      "filters.presets": "Vizualizări rapide",
      "filters.bonesMuscles": "Oase + mușchi",
      "filters.bonesOnly": "Doar oase",
      "filters.neuro": "Neuro",
      "nervous.explorer": "Explorator nervos",
      "nervous.viewerLabel":
        "Anatomie 3D interactivă — strat nervos BodyParts3D",
      "nervous.incomplete": "Acoperire nervoasă parțială · inventar v1.0.0",
      "nervous.coverage":
        "{{catalog}} intrări · {{individual}} mapări individuale · {{missing}} fără geometrie",
      "nervous.structural": "Clasificare structurală",
      "nervous.functional": "Filtre funcționale",
      "nervous.regional": "Filtre regionale",
      "nervous.division.cns": "Sistem nervos central (SNC)",
      "nervous.division.pns": "Sistem nervos periferic (SNP)",
      "nervous.division.associated": "Structuri asociate — nu țesut nervos",
      "nervous.function.somatic": "Somatic",
      "nervous.function.autonomic": "Autonom",
      "nervous.function.sympathetic": "Simpatic",
      "nervous.function.parasympathetic": "Parasimpatic",
      "nervous.function.enteric": "Enteric",
      "nervous.function.sensory": "Senzitiv / aferent",
      "nervous.function.motor": "Motor / eferent",
      "nervous.function.mixed": "Mixt senzitiv și motor",
      "nervous.filterHint":
        "Fără selecție = fără restricție. Opțiunile din același filtru se reunesc; filtrele diferite se intersectează. Clasificările necunoscute nu sunt presupuse.",
      "nervous.resetFilters": "Toate structurile nervoase disponibile",
      "nervous.brainParts": "Selectează encefalul disponibil",
      "nervous.show": "Vezi stratul nervos",
      "nervous.restoreContext": "Revino la straturile anterioare",
      "nervous.visibilityHint":
        "Geometrie disponibilă doar la cap. Craniul și mușchii o pot acoperi.",
      "nervous.mapped": "mapate 3D",
      "nervous.details": "Detalii despre structura nervoasă",
      "nervous.review":
        "Revizuirea medicală și a terminologiei românești este în așteptare.",
      "nervous.sourcePart":
        "Geometrie-sursă cu detaliu redus; nu implică un traseu sau o acoperire anatomică completă.",
      "nervous.unavailable":
        "Intrare de inventar, fără geometrie 3D independentă. Nu este desenat un traseu aproximativ.",
      "nervous.spinalQuarantine":
        "Geometrie în carantină: sursa folosește FJ1737 atât pentru măduva spinală, cât și pentru canalul central. Identitatea trebuie clarificată înainte de activare.",
      "nervous.opticCns":
        "Nervul optic (II) este un tract al SNC, nu un nerv periferic obișnuit.",
      "nervous.connections": "Relații anatomice",
      "nervous.connectionHint":
        "Relații de ramificare, nu conexiuni sinaptice sau trasee reconstruite.",
      "nervous.references": "Referință anatomică / terminologică",
      "nervous.connectionSource": "Sursa relației anatomice",
      "nervous.loading": "Se încarcă stratul nervos…",
      "nervous.error":
        "Stratul nervos nu s-a încărcat. Oasele și mușchii rămân disponibili.",
      "filters.none": "Niciun strat activ",
      "viewer.front": "Față",
      "viewer.back": "Spate",
      "viewer.left": "Stânga",
      "viewer.right": "Dreapta",
      "viewer.reset": "Încadrează corpul",
      "viewer.focus": "Focalizează",
      "viewer.empty": "Alege cel puțin un strat anatomic",
      "viewer.drag": "Trage pentru rotire · scroll pentru zoom",
      "viewer.label": "Schelet uman 3D interactiv — BodyParts3D",
      "viewer.views": "Vederi ale camerei",
      "viewer.loading": "Se încarcă scheletul 3D…",
      "viewer.sourceMeshes": "{{count}} geometrii sursă",
      "viewer.selectable": "{{count}} structuri selectabile",
      "search.label": "Caută o structură",
      "search.placeholder": "Ex. humerus, craniu…",
      "search.noResults": "Nicio structură găsită",
      "inspector.title": "Inspector anatomic",
      "skullModes.bones": "Oase",
      "skullModes.title": "Moduri de vizualizare pentru craniu",
      "skullModes.hint":
        "Un singur mod activ. Camera și selecția se păstrează.",
      "skullModes.preview": "Previzualizare stilizată",
      "skullModes.xrayNote":
        "Simulare educațională de stil radiografic, nu radiografie clinică sau instrument de diagnostic.",
      "inspector.empty": "Selectează o structură din model sau din listă.",
      "inspector.region": "Regiune",
      "inspector.system": "Sistem",
      "inspector.status": "Disponibilitate",
      "inspector.available": "Geometrie anatomică disponibilă",
      "inspector.hidden": "Ascuns de filtrele curente",
      "inspector.mappedMeshes": "{{count}} geometrii sursă mapate",
      "inspector.groupSelection": "Selecție de grup",
      "inspector.sourceNote":
        "Model cu detaliu redus pentru studiu. Revizuirea medicală independentă este în așteptare.",
      "inspector.hide": "Ascunde",
      "inspector.isolate": "Izolează",
      "inspector.restore": "Restaurează vizibilitatea",
      "inspector.deselect": "Închide selecția",
      "groups.title": "Grupuri",
      "groups.members": "membri",
      "groups.noGeometry": "fără geometrie",
      "common.available": "disponibil",
      "common.planned": "planificat",
      "common.close": "Închide",
      "language.label": "Limba interfeței",
      "error.webgl":
        "Dispozitivul nu oferă suport WebGL necesar pentru vizualizarea 3D.",
      "error.model":
        "Scheletul 3D nu a putut fi încărcat. Reîncarcă pagina pentru a încerca din nou.",
      "error.retry": "Reîncearcă",
      "muscles.explorer": "Explorator muscular",
      "muscles.viewerLabel":
        "Anatomie 3D interactivă — strat muscular BodyParts3D",
      "muscles.incomplete": "Acoperire musculară incompletă · inventar v1.0.0",
      "muscles.coverage":
        "{{independent}} mapări individuale · {{sets}} grupuri sursă · {{groupedOnly}} doar în grup · {{missing}} fără geometrie",
      "muscles.opacity": "Opacitatea mușchilor",
      "muscles.depth": "Plan anatomic contextual",
      "muscles.depth.all": "Toate planurile",
      "muscles.depth.superficial": "Superficial",
      "muscles.depth.intermediate": "Intermediar",
      "muscles.depth.deep": "Profund",
      "muscles.depth.mixed": "Planuri mixte",
      "muscles.side": "Lateralitate",
      "muscles.side.left": "Stânga",
      "muscles.side.right": "Dreapta",
      "muscles.side.midline": "Median",
      "muscles.side.bilateral": "Bilateral",
      "muscles.side.none": "Fără lateralitate",
      "muscles.groupedOnly": "Doar în grupul sursă; fără selecție individuală",
      "muscles.review":
        "Revizuirea medicală și terminologia RO sunt în așteptare.",
      "muscles.detailsPending":
        "Originea, inserția, funcția, inervația și vascularizația nu sunt încă verificate și nu sunt afișate.",
      "muscles.sourceSet":
        "Set sursă: membrii nu pot fi identificați individual în această geometrie.",
      "muscles.selectSourceSet": "Inspectează grupul sursă",
      "muscles.showSelected": "Arată mușchiul selectat",
      "muscles.hideGroup": "Ascunde grupul",
      "muscles.showGroup": "Arată grupul",
      "muscles.revealGroup": "Expune acest grup",
      "muscles.revealHint":
        "Ascunde ceilalți mușchi și arată acest grup; filtrul osos rămâne neschimbat.",
      "muscles.inventorySource": "Sursa inventarului",
      "muscles.loading": "Se încarcă stratul muscular…",
      "muscles.error":
        "Stratul muscular nu a putut fi încărcat. Scheletul rămâne disponibil.",
    },
  },
  en: {
    translation: {
      "app.title": "3D Anatomy Atlas",
      "app.subtitle": "Explore the human body by layers",
      "panels.navigation": "Toggle navigation panel",
      "panels.inspector": "Toggle inspector panel",
      "nav.regions": "Anatomical regions",
      "nav.wholeBody": "Whole body",
      "nav.planned": "planned",
      "filters.title": "Anatomical layers",
      "filters.all": "All layers",
      "filters.presets": "Quick views",
      "filters.bonesMuscles": "Bones + muscles",
      "filters.bonesOnly": "Bones only",
      "filters.neuro": "Neuro",
      "nervous.explorer": "Nervous explorer",
      "nervous.viewerLabel":
        "Interactive 3D anatomy — BodyParts3D nervous layer",
      "nervous.incomplete": "Partial nervous coverage · inventory v1.0.0",
      "nervous.coverage":
        "{{catalog}} entries · {{individual}} individual mappings · {{missing}} without geometry",
      "nervous.structural": "Structural classification",
      "nervous.functional": "Functional filters",
      "nervous.regional": "Regional filters",
      "nervous.division.cns": "Central nervous system (CNS)",
      "nervous.division.pns": "Peripheral nervous system (PNS)",
      "nervous.division.associated":
        "Associated structures — not neural tissue",
      "nervous.function.somatic": "Somatic",
      "nervous.function.autonomic": "Autonomic",
      "nervous.function.sympathetic": "Sympathetic",
      "nervous.function.parasympathetic": "Parasympathetic",
      "nervous.function.enteric": "Enteric",
      "nervous.function.sensory": "Sensory / afferent",
      "nervous.function.motor": "Motor / efferent",
      "nervous.function.mixed": "Mixed sensory and motor",
      "nervous.filterHint":
        "No selection = unrestricted. Options within a facet are combined; different facets intersect. Unknown classifications are not assumed.",
      "nervous.resetFilters": "All available nervous structures",
      "nervous.brainParts": "Select available brain parts",
      "nervous.show": "Show nervous layer",
      "nervous.restoreContext": "Restore previous layers",
      "nervous.visibilityHint":
        "Geometry is currently available only in the head. Skull and muscles can cover it.",
      "nervous.mapped": "mapped in 3D",
      "nervous.details": "Nervous structure details",
      "nervous.review":
        "Independent medical and Romanian terminology review is pending.",
      "nervous.sourcePart":
        "Reduced-detail source geometry; does not imply complete anatomical course or coverage.",
      "nervous.unavailable":
        "Inventory entry without independent 3D geometry. No approximate trajectory is drawn.",
      "nervous.spinalQuarantine":
        "Quarantined geometry: the source uses FJ1737 for both the spinal cord and its central canal. Identity must be resolved before activation.",
      "nervous.opticCns":
        "The optic nerve (II) is a CNS tract, not an ordinary peripheral nerve.",
      "nervous.connections": "Anatomical relationships",
      "nervous.connectionHint":
        "Branching relationships, not synaptic connections or reconstructed trajectories.",
      "nervous.references": "Anatomical / terminology reference",
      "nervous.connectionSource": "Anatomical relationship source",
      "nervous.loading": "Loading the nervous layer…",
      "nervous.error":
        "The nervous layer could not load. Bones and muscles remain available.",
      "filters.none": "No active layer",
      "viewer.front": "Front",
      "viewer.back": "Back",
      "viewer.left": "Left",
      "viewer.right": "Right",
      "viewer.reset": "Fit body",
      "viewer.focus": "Focus",
      "viewer.empty": "Choose at least one anatomical layer",
      "viewer.drag": "Drag to orbit · scroll to zoom",
      "viewer.label": "Interactive human 3D skeleton — BodyParts3D",
      "viewer.views": "Camera views",
      "viewer.loading": "Loading the 3D skeleton…",
      "viewer.sourceMeshes": "{{count}} source meshes",
      "viewer.selectable": "{{count}} selectable structures",
      "search.label": "Search structures",
      "search.placeholder": "E.g. humerus, skull…",
      "search.noResults": "No structures found",
      "inspector.title": "Anatomy inspector",
      "skullModes.bones": "Bones",
      "skullModes.title": "Skull Visualization Modes",
      "skullModes.hint": "One active mode. Camera and selection are preserved.",
      "skullModes.preview": "Stylized preview",
      "skullModes.xrayNote":
        "Educational radiographic-style simulation, not a clinical X-ray or diagnostic tool.",
      "inspector.empty": "Select a structure in the model or from the list.",
      "inspector.region": "Region",
      "inspector.system": "System",
      "inspector.status": "Availability",
      "inspector.available": "Anatomical geometry available",
      "inspector.hidden": "Hidden by current filters",
      "inspector.mappedMeshes": "{{count}} mapped source meshes",
      "inspector.groupSelection": "Group selection",
      "inspector.sourceNote":
        "Reduced-detail model for study. Independent medical review is pending.",
      "inspector.hide": "Hide",
      "inspector.isolate": "Isolate",
      "inspector.restore": "Restore visibility",
      "inspector.deselect": "Clear selection",
      "groups.title": "Groups",
      "groups.members": "members",
      "groups.noGeometry": "no geometry",
      "common.available": "available",
      "common.planned": "planned",
      "common.close": "Close",
      "language.label": "Interface language",
      "error.webgl":
        "This device does not provide the WebGL support required for the 3D viewer.",
      "error.model":
        "The 3D skeleton could not be loaded. Reload the page to try again.",
      "error.retry": "Try again",
      "muscles.explorer": "Muscle explorer",
      "muscles.viewerLabel":
        "Interactive 3D anatomy — BodyParts3D muscular layer",
      "muscles.incomplete": "Muscular coverage incomplete · inventory v1.0.0",
      "muscles.coverage":
        "{{independent}} individual mappings · {{sets}} source sets · {{groupedOnly}} grouped only · {{missing}} without geometry",
      "muscles.opacity": "Muscle opacity",
      "muscles.depth": "Contextual anatomical depth",
      "muscles.depth.all": "All depths",
      "muscles.depth.superficial": "Superficial",
      "muscles.depth.intermediate": "Intermediate",
      "muscles.depth.deep": "Deep",
      "muscles.depth.mixed": "Mixed depths",
      "muscles.side": "Laterality",
      "muscles.side.left": "Left",
      "muscles.side.right": "Right",
      "muscles.side.midline": "Midline",
      "muscles.side.bilateral": "Bilateral",
      "muscles.side.none": "None",
      "muscles.groupedOnly": "Source set only; no independent selection",
      "muscles.review":
        "Independent medical and Romanian terminology review pending.",
      "muscles.detailsPending":
        "Origin, insertion, function, innervation and blood supply have not yet been verified and are not displayed.",
      "muscles.sourceSet":
        "Source set: its members cannot be individually identified in this geometry.",
      "muscles.selectSourceSet": "Inspect source set",
      "muscles.showSelected": "Show selected muscle",
      "muscles.hideGroup": "Hide group",
      "muscles.showGroup": "Show group",
      "muscles.revealGroup": "Reveal this group",
      "muscles.revealHint":
        "Hides other muscles and shows this group; bone filters remain unchanged.",
      "muscles.inventorySource": "Inventory source",
      "muscles.loading": "Loading the muscular layer…",
      "muscles.error":
        "The muscular layer could not be loaded. The skeleton remains available.",
    },
  },
} as const;

const savedLocale =
  typeof localStorage === "undefined"
    ? null
    : localStorage.getItem("anatomy-locale");
void i18n.use(initReactI18next).init({
  resources,
  lng: savedLocale === "en" ? "en" : "ro",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
export { resources };
