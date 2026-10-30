// Versioned macroscopic target, not a claim of complete human venous anatomy.
export const venousReference =
  "https://openstax.org/books/anatomy-and-physiology-2e/pages/20-5-circulatory-pathways";
export const venousTerminology = "https://fipat.library.dal.ca/ta2/";
export const venousGroups = [
  [
    "intracranial",
    "Intracranial veins and sinuses",
    "Vene și sinusuri intracraniene",
  ],
  ["head-neck", "Head and neck", "Cap și gât"],
  ["thoracic", "Thoracic veins", "Vene toracice"],
  ["cardiac", "Cardiac veins", "Vene cardiace"],
  ["pulmonary", "Pulmonary veins", "Vene pulmonare"],
  ["abdominal", "Abdominal systemic veins", "Vene sistemice abdominale"],
  ["portal", "Hepatic portal territory", "Teritoriu port hepatic"],
  ["pelvic", "Pelvic veins", "Vene pelvine"],
  ["upper-limb", "Upper-limb veins", "Vene ale membrului superior"],
  ["lower-limb", "Lower-limb veins", "Vene ale membrului inferior"],
  ["vertebral", "Vertebral venous system", "Sistem venos vertebral"],
  [
    "micro",
    "Microanatomy (no accepted models)",
    "Microanatomie (fără modele acceptate)",
  ],
];
export const venousDefinitions = [];
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
function add(en, ro, latin, group, options = {}) {
  const { paired = false, ...extra } = options;
  for (const side of paired ? ["left", "right"] : ["midline"]) {
    const limb = group.endsWith("limb");
    venousDefinitions.push({
      id: `venous-${slug(en)}${paired ? `-${side}` : ""}`,
      names: {
        en: paired
          ? `${side === "left" ? "Left" : "Right"} ${en}`
          : en[0].toUpperCase() + en.slice(1),
        ro: ro + (paired ? (side === "left" ? " — stânga" : " — dreapta") : ""),
      },
      latinName: latin,
      laterality: paired
        ? side
        : en.startsWith("left ")
          ? "left"
          : en.startsWith("right ")
            ? "right"
            : "midline",
      group,
      regionIds: limb
        ? [`${group}-${side}`]
        : [
            {
              intracranial: "head",
              "head-neck": "neck",
              thoracic: "thorax",
              cardiac: "thorax",
              pulmonary: "thorax",
              abdominal: "abdomen",
              portal: "abdomen",
              pelvic: "pelvis",
              vertebral: "back",
              micro: "whole-body",
            }[group],
          ],
      venousCategory: "vein",
      territory:
        group === "portal"
          ? "portal"
          : group === "pulmonary"
            ? "pulmonary"
            : group === "cardiac"
              ? "cardiac"
              : "systemic",
      depth: "unknown",
      sex: "male-reference",
      representation: "individual",
      sourceName: paired ? `${side} ${en}` : en,
      terminologyVersion:
        "FMA source identifiers / TA2 framework (2019); terminology review pending",
      medicalSource: venousReference,
      ...extra,
    });
  }
}
const batch = (group, entries, options = {}) =>
  entries.forEach(([en, ro, la]) => add(en, ro, la, group, options));
batch(
  "intracranial",
  [
    [
      "superior sagittal sinus",
      "Sinus sagital superior",
      "Sinus sagittalis superior",
    ],
    [
      "inferior sagittal sinus",
      "Sinus sagital inferior",
      "Sinus sagittalis inferior",
    ],
    ["straight sinus", "Sinus drept", "Sinus rectus"],
    ["occipital sinus", "Sinus occipital", "Sinus occipitalis"],
  ],
  { venousCategory: "dural-sinus", depth: "deep" },
);
batch(
  "intracranial",
  [
    ["transverse sinus", "Sinus transvers", "Sinus transversus"],
    ["sigmoid sinus", "Sinus sigmoid", "Sinus sigmoideus"],
    ["cavernous sinus", "Sinus cavernos", "Sinus cavernosus"],
    [
      "superior petrosal sinus",
      "Sinus pietros superior",
      "Sinus petrosus superior",
    ],
    [
      "inferior petrosal sinus",
      "Sinus pietros inferior",
      "Sinus petrosus inferior",
    ],
    ["sphenoparietal sinus", "Sinus sfenoparietal", "Sinus sphenoparietalis"],
  ],
  { paired: true, venousCategory: "dural-sinus", depth: "deep" },
);
add(
  "great cerebral vein",
  "Venă cerebrală mare",
  "Vena magna cerebri",
  "intracranial",
  { depth: "deep" },
);
batch(
  "intracranial",
  [
    [
      "internal cerebral vein",
      "Venă cerebrală internă",
      "Vena interna cerebri",
    ],
    ["basal vein", "Venă bazală", "Vena basalis"],
    [
      "superficial cerebral veins",
      "Vene cerebrale superficiale",
      "Venae superficiales cerebri",
    ],
    [
      "deep cerebral veins",
      "Vene cerebrale profunde",
      "Venae profundae cerebri",
    ],
    ["cerebellar veins", "Vene cerebeloase", "Venae cerebelli"],
    ["emissary veins", "Vene emisare", "Venae emissariae"],
    ["diploic veins", "Vene diploice", "Venae diploicae"],
  ],
  { paired: true, representation: "set" },
);
batch(
  "head-neck",
  [
    [
      "internal jugular vein",
      "Venă jugulară internă",
      "Vena jugularis interna",
    ],
    [
      "external jugular vein",
      "Venă jugulară externă",
      "Vena jugularis externa",
    ],
    [
      "anterior jugular vein",
      "Venă jugulară anterioară",
      "Vena jugularis anterior",
    ],
    ["facial vein", "Venă facială", "Vena facialis"],
    ["angular vein", "Venă angulară", "Vena angularis"],
    ["retromandibular vein", "Venă retromandibulară", "Vena retromandibularis"],
    [
      "superficial temporal vein",
      "Venă temporală superficială",
      "Vena temporalis superficialis",
    ],
    ["maxillary vein", "Venă maxilară", "Vena maxillaris"],
    ["lingual vein", "Venă linguală", "Vena lingualis"],
    [
      "superior thyroid vein",
      "Venă tiroidiană superioară",
      "Vena thyroidea superior",
    ],
    ["middle thyroid vein", "Venă tiroidiană mijlocie", "Vena thyroidea media"],
    [
      "inferior thyroid vein",
      "Venă tiroidiană inferioară",
      "Vena thyroidea inferior",
    ],
    ["vertebral vein", "Venă vertebrală", "Vena vertebralis"],
    [
      "deep cervical vein",
      "Venă cervicală profundă",
      "Vena cervicalis profunda",
    ],
  ],
  { paired: true },
);
add(
  "pharyngeal venous plexus",
  "Plex venos faringian",
  "Plexus venosus pharyngeus",
  "head-neck",
  { representation: "set", venousCategory: "plexus" },
);
batch(
  "thoracic",
  [
    ["superior vena cava", "Venă cavă superioară", "Vena cava superior"],
    ["azygos vein", "Venă azygos", "Vena azygos"],
    ["hemiazygos vein", "Venă hemiazygos", "Vena hemiazygos"],
    [
      "accessory hemiazygos vein",
      "Venă hemiazygos accesorie",
      "Vena hemiazygos accessoria",
    ],
  ],
  { depth: "deep" },
);
batch(
  "thoracic",
  [
    ["brachiocephalic vein", "Venă brahiocefalică", "Vena brachiocephalica"],
    ["subclavian vein", "Venă subclavie", "Vena subclavia"],
    [
      "internal thoracic vein",
      "Venă toracică internă",
      "Vena thoracica interna",
    ],
    [
      "superior intercostal vein",
      "Venă intercostală superioară",
      "Vena intercostalis superior",
    ],
    ["subcostal vein", "Venă subcostală", "Vena subcostalis"],
  ],
  { paired: true, depth: "deep" },
);
batch(
  "thoracic",
  [
    [
      "posterior intercostal veins",
      "Vene intercostale posterioare",
      "Venae intercostales posteriores",
    ],
    [
      "anterior intercostal veins",
      "Vene intercostale anterioare",
      "Venae intercostales anteriores",
    ],
    ["bronchial veins", "Vene bronșice", "Venae bronchiales"],
    ["esophageal veins", "Vene esofagiene", "Venae oesophageae"],
    ["mediastinal veins", "Vene mediastinale", "Venae mediastinales"],
    ["pericardial veins", "Vene pericardice", "Venae pericardiacae"],
  ],
  { representation: "set", depth: "deep" },
);
batch(
  "cardiac",
  [
    ["coronary sinus", "Sinus coronar", "Sinus coronarius"],
    ["great cardiac vein", "Venă cardiacă mare", "Vena cardiaca magna"],
    ["middle cardiac vein", "Venă cardiacă mijlocie", "Vena cardiaca media"],
    ["small cardiac vein", "Venă cardiacă mică", "Vena cardiaca parva"],
    [
      "posterior vein of left ventricle",
      "Venă posterioară a ventriculului stâng",
      "Vena posterior ventriculi sinistri",
    ],
    [
      "oblique vein of left atrium",
      "Venă oblică a atriului stâng",
      "Vena obliqua atrii sinistri",
    ],
    ["left marginal vein", "Venă marginală stângă", "Vena marginalis sinistra"],
    ["right marginal vein", "Venă marginală dreaptă", "Vena marginalis dextra"],
    [
      "anterior cardiac vein",
      "Venă cardiacă anterioară",
      "Vena cardiaca anterior",
    ],
  ],
  { depth: "deep" },
);
for (const [side, ro] of [
  ["left", "stângă"],
  ["right", "dreaptă"],
])
  for (const [level, lr] of [
    ["superior", "superioară"],
    ["inferior", "inferioară"],
  ])
    add(
      `${side} ${level} pulmonary vein`,
      `Venă pulmonară ${lr} ${ro}`,
      `Vena pulmonalis ${level} ${side === "left" ? "sinistra" : "dextra"}`,
      "pulmonary",
      { laterality: side, depth: "deep" },
    );
add(
  "segmental pulmonary veins",
  "Vene pulmonare segmentare",
  "Venae pulmonales segmentales",
  "pulmonary",
  {
    representation: "set",
    sourceName: "segmental pulmonary vein",
    depth: "deep",
  },
);
add(
  "subsegmental pulmonary veins",
  "Vene pulmonare subsegmentare",
  "Venae pulmonales subsegmentales",
  "pulmonary",
  {
    representation: "set",
    sourceName: "subsegmental pulmonary vein",
    depth: "deep",
  },
);
batch(
  "abdominal",
  [
    ["inferior vena cava", "Venă cavă inferioară", "Vena cava inferior"],
    ["right hepatic vein", "Venă hepatică dreaptă", "Vena hepatica dextra"],
    [
      "middle hepatic vein",
      "Venă hepatică mijlocie",
      "Vena hepatica intermedia",
    ],
    ["left hepatic vein", "Venă hepatică stângă", "Vena hepatica sinistra"],
  ],
  { depth: "deep" },
);
batch(
  "abdominal",
  [
    ["renal vein", "Venă renală", "Vena renalis"],
    ["suprarenal vein", "Venă suprarenală", "Vena suprarenalis"],
    ["testicular vein", "Venă testiculară", "Vena testicularis"],
    [
      "inferior phrenic vein",
      "Venă frenică inferioară",
      "Vena phrenica inferior",
    ],
    [
      "ascending lumbar vein",
      "Venă lombară ascendentă",
      "Vena lumbalis ascendens",
    ],
  ],
  { paired: true, depth: "deep" },
);
add("lumbar veins", "Vene lombare", "Venae lumbales", "abdominal", {
  representation: "set",
  sourceName: "lumbar vein",
  depth: "deep",
});
batch(
  "portal",
  [
    ["hepatic portal vein", "Venă portă hepatică", "Vena portae hepatis"],
    [
      "right portal vein",
      "Ramură dreaptă a venei porte",
      "Ramus dexter venae portae",
    ],
    [
      "left portal vein",
      "Ramură stângă a venei porte",
      "Ramus sinister venae portae",
    ],
    [
      "superior mesenteric vein",
      "Venă mezenterică superioară",
      "Vena mesenterica superior",
    ],
    [
      "inferior mesenteric vein",
      "Venă mezenterică inferioară",
      "Vena mesenterica inferior",
    ],
    ["splenic vein", "Venă splenică", "Vena splenica"],
    ["left gastric vein", "Venă gastrică stângă", "Vena gastrica sinistra"],
    ["right gastric vein", "Venă gastrică dreaptă", "Vena gastrica dextra"],
    [
      "left gastroepiploic vein",
      "Venă gastro-omentală stângă",
      "Vena gastroomentalis sinistra",
    ],
    [
      "right gastroepiploic vein",
      "Venă gastro-omentală dreaptă",
      "Vena gastroomentalis dextra",
    ],
    [
      "pancreaticoduodenal vein",
      "Venă pancreaticoduodenală",
      "Vena pancreaticoduodenalis",
    ],
    [
      "superior rectal vein",
      "Venă rectală superioară",
      "Vena rectalis superior",
    ],
    ["left colic vein", "Venă colică stângă", "Vena colica sinistra"],
    ["right colic vein", "Venă colică dreaptă", "Vena colica dextra"],
    ["middle colic vein", "Venă colică mijlocie", "Vena colica media"],
    ["ileocolic vein", "Venă ileocolică", "Vena ileocolica"],
    ["ileal vein", "Venă ileală", "Vena ilealis"],
    ["sigmoid vein", "Venă sigmoidiană", "Vena sigmoidea"],
    ["pancreatic veins", "Vene pancreatice", "Venae pancreaticae"],
    ["cystic veins", "Vene cistice", "Venae cysticae"],
  ],
  { depth: "deep" },
);
batch(
  "pelvic",
  [
    ["common iliac vein", "Venă iliacă comună", "Vena iliaca communis"],
    ["external iliac vein", "Venă iliacă externă", "Vena iliaca externa"],
    ["internal iliac vein", "Venă iliacă internă", "Vena iliaca interna"],
    ["iliolumbar vein", "Venă iliolombară", "Vena iliolumbalis"],
    [
      "superior gluteal vein",
      "Venă gluteală superioară",
      "Vena glutea superior",
    ],
    [
      "inferior gluteal vein",
      "Venă gluteală inferioară",
      "Vena glutea inferior",
    ],
    ["obturator vein", "Venă obturatoare", "Vena obturatoria"],
    [
      "internal pudendal vein",
      "Venă pudendală internă",
      "Vena pudenda interna",
    ],
    ["lateral sacral vein", "Venă sacrală laterală", "Vena sacralis lateralis"],
  ],
  { paired: true, depth: "deep" },
);
add(
  "median sacral vein",
  "Venă sacrală mediană",
  "Vena sacralis mediana",
  "pelvic",
  { depth: "deep" },
);
batch(
  "pelvic",
  [
    ["rectal venous plexus", "Plex venos rectal", "Plexus venosus rectalis"],
    ["vesical venous plexus", "Plex venos vezical", "Plexus venosus vesicalis"],
    [
      "prostatic venous plexus",
      "Plex venos prostatic",
      "Plexus venosus prostaticus",
    ],
  ],
  { venousCategory: "plexus", representation: "set", depth: "deep" },
);
batch(
  "pelvic",
  [
    ["uterine venous plexus", "Plex venos uterin", "Plexus venosus uterinus"],
    ["vaginal venous plexus", "Plex venos vaginal", "Plexus venosus vaginalis"],
  ],
  {
    sex: "female-only",
    sourceName: null,
    representation: "set",
    depth: "deep",
  },
);
add("ovarian vein", "Venă ovariană", "Vena ovarica", "pelvic", {
  paired: true,
  sex: "female-only",
  sourceName: null,
  depth: "deep",
});
batch(
  "upper-limb",
  [
    ["cephalic vein", "Venă cefalică", "Vena cephalica"],
    ["basilic vein", "Venă bazilică", "Vena basilica"],
    ["median cubital vein", "Venă mediană a cotului", "Vena mediana cubiti"],
    [
      "median antebrachial vein",
      "Venă mediană a antebrațului",
      "Vena mediana antebrachii",
    ],
    [
      "accessory cephalic vein",
      "Venă cefalică accesorie",
      "Vena cephalica accessoria",
    ],
  ],
  { paired: true, depth: "superficial" },
);
batch(
  "upper-limb",
  [
    ["axillary vein", "Venă axilară", "Vena axillaris"],
    [
      "medial brachial vein",
      "Venă brahială medială",
      "Vena brachialis medialis",
    ],
    ["radial vein", "Venă radială", "Vena radialis"],
    ["ulnar vein", "Venă ulnară", "Vena ulnaris"],
    [
      "deep palmar venous arch",
      "Arc venos palmar profund",
      "Arcus venosus palmaris profundus",
    ],
  ],
  { paired: true, depth: "deep" },
);
batch(
  "upper-limb",
  [
    [
      "superficial palmar venous arch",
      "Arc venos palmar superficial",
      "Arcus venosus palmaris superficialis",
    ],
    [
      "dorsal venous network of hand",
      "Rețea venoasă dorsală a mâinii",
      "Rete venosum dorsale manus",
    ],
  ],
  { paired: true, representation: "set", depth: "superficial" },
);
// Exact publisher names place laterality before "hand", not before "dorsal".
for (const d of venousDefinitions.filter((d) =>
  d.id.includes("dorsal-venous-network-of-hand"),
))
  d.sourceName = `dorsal venous network of ${d.laterality} hand`;
for (const [finger, ro, latin] of [
  ["index", "arătător", "indicis"],
  ["middle", "mijlociu", "medii"],
  ["ring", "inelar", "anularis"],
  ["little", "mic", "minimi"],
]) {
  add(
    `proper palmar digital vein of ${finger} finger`,
    `Venă digitală palmară proprie a degetului ${ro}`,
    `Vena digitalis palmaris propria digiti ${latin}`,
    "upper-limb",
    { paired: true },
  );
  for (const d of venousDefinitions.filter((d) =>
    d.id.startsWith(`venous-proper-palmar-digital-vein-of-${finger}-finger-`),
  ))
    d.sourceName = `proper palmar digital vein of ${d.laterality} ${finger} finger`;
}
batch(
  "lower-limb",
  [
    ["great saphenous vein", "Venă safenă mare", "Vena saphena magna"],
    ["small saphenous vein", "Venă safenă mică", "Vena saphena parva"],
    [
      "accessory saphenous vein",
      "Venă safenă accesorie",
      "Vena saphena accessoria",
    ],
  ],
  { paired: true, depth: "superficial" },
);
batch(
  "lower-limb",
  [
    ["common femoral vein", "Venă femurală comună", "Vena femoralis communis"],
    ["femoral vein", "Venă femurală", "Vena femoralis"],
    ["deep femoral vein", "Venă profundă a coapsei", "Vena profunda femoris"],
    ["popliteal vein", "Venă poplitee", "Vena poplitea"],
    [
      "anterior tibial vein",
      "Venă tibială anterioară",
      "Vena tibialis anterior",
    ],
    [
      "posterior tibial vein",
      "Venă tibială posterioară",
      "Vena tibialis posterior",
    ],
    ["fibular vein", "Venă fibulară", "Vena fibularis"],
    [
      "medial circumflex femoral vein",
      "Venă circumflexă femurală medială",
      "Vena circumflexa femoris medialis",
    ],
    [
      "lateral circumflex femoral vein",
      "Venă circumflexă femurală laterală",
      "Vena circumflexa femoris lateralis",
    ],
    ["gastrocnemius veins", "Vene gastrocnemiene", "Venae gastrocnemii"],
    ["soleal veins", "Vene ale solearului", "Venae solei"],
    ["medial plantar vein", "Venă plantară medială", "Vena plantaris medialis"],
    [
      "lateral plantar vein",
      "Venă plantară laterală",
      "Vena plantaris lateralis",
    ],
  ],
  { paired: true, depth: "deep" },
);
for (const [en, ro, latin] of [
  ["dorsal venous arch", "Arc venos dorsal", "Arcus venosus dorsalis pedis"],
  ["plantar venous arch", "Arc venos plantar", "Arcus venosus plantaris"],
]) {
  add(`${en} of foot`, `${ro} al piciorului`, latin, "lower-limb", {
    paired: true,
    representation: "set",
  });
  for (const d of venousDefinitions.filter((d) =>
    d.id.startsWith(`venous-${slug(en)}-of-foot-`),
  ))
    d.sourceName = `${en} of ${d.laterality} foot`;
}
add("perforating veins", "Vene perforante", "Venae perforantes", "lower-limb", {
  depth: "perforating",
  representation: "set",
  sourceName: "set of perforating veins",
  laterality: "bilateral",
  regionIds: ["lower-limb-left", "lower-limb-right"],
});
add(
  "digital veins of foot",
  "Vene digitale ale piciorului",
  "Venae digitales pedis",
  "lower-limb",
  {
    representation: "set",
    sourceName: null,
    laterality: "bilateral",
    regionIds: ["lower-limb-left", "lower-limb-right"],
  },
);
batch(
  "vertebral",
  [
    [
      "internal vertebral venous plexus",
      "Plex venos vertebral intern",
      "Plexus venosus vertebralis internus",
    ],
    [
      "external vertebral venous plexus",
      "Plex venos vertebral extern",
      "Plexus venosus vertebralis externus",
    ],
    ["basivertebral veins", "Vene bazivertebrale", "Venae basivertebrales"],
    ["intervertebral veins", "Vene intervertebrale", "Venae intervertebrales"],
  ],
  { representation: "set", depth: "deep" },
);
batch(
  "micro",
  [
    ["venous valve", "Valvulă venoasă", "Valvula venosa"],
    ["venous wall layers", "Straturi ale peretelui venos", "Tunicae venae"],
    ["venules", "Venule", "Venulae"],
  ],
  { sourceName: null, venousCategory: "microanatomy" },
);

// "Superficial" in a palmar arch's source name is not sufficient evidence
// of superficial-system classification. Keep that facet unknown pending review.
for (const item of venousDefinitions) {
  if (item.id === "venous-coronary-sinus")
    item.venousCategory = "cardiac-sinus";
  if (item.id.startsWith("venous-superficial-palmar-venous-arch-"))
    item.depth = "unknown";
}

// Curated semantic pathways only. They do not join source meshes or certify
// their endpoints. No graph inference from a name, hierarchy, or proximity.
const id = (s) => (s.startsWith("collection-") ? s : "venous-" + slug(s));
export const venousConnections = [];
function edge(from, to, relation = "drains-into") {
  venousConnections.push({
    from: id(from),
    to: id(to),
    relation,
    sourceUrl: /cardiac|coronary|posterior vein of left ventricle/.test(from)
      ? "https://www.ncbi.nlm.nih.gov/books/NBK557566/"
      : venousReference,
    validationStatus: "unverified",
    evidence:
      "Source-supported reference pathway; independent clinical review pending",
  });
}
for (const side of ["left", "right"]) {
  edge(`internal jugular vein ${side}`, `brachiocephalic vein ${side}`);
  edge(`subclavian vein ${side}`, `brachiocephalic vein ${side}`);
  edge(`brachiocephalic vein ${side}`, "superior vena cava");
  edge(`cephalic vein ${side}`, `axillary vein ${side}`);
  edge(`axillary vein ${side}`, `subclavian vein ${side}`);
  edge(`medial brachial vein ${side}`, `axillary vein ${side}`);
  edge(`great saphenous vein ${side}`, `femoral vein ${side}`);
  edge(`small saphenous vein ${side}`, `popliteal vein ${side}`);
  edge(`popliteal vein ${side}`, `femoral vein ${side}`);
  edge(`deep femoral vein ${side}`, `femoral vein ${side}`);
  edge(`femoral vein ${side}`, `external iliac vein ${side}`);
  edge(`external iliac vein ${side}`, `common iliac vein ${side}`);
  edge(`internal iliac vein ${side}`, `common iliac vein ${side}`);
  edge(`common iliac vein ${side}`, "inferior vena cava");
  edge(`renal vein ${side}`, "inferior vena cava");
  for (const level of ["superior", "inferior"])
    edge(`${side} ${level} pulmonary vein`, "collection-left-atrium");
}
edge("azygos vein", "superior vena cava");
edge("superior vena cava", "collection-right-atrium");
edge("inferior vena cava", "collection-right-atrium");
for (const vein of [
  "great cardiac vein",
  "middle cardiac vein",
  "small cardiac vein",
  "posterior vein of left ventricle",
])
  edge(vein, "coronary sinus");
edge("coronary sinus", "collection-right-atrium");
edge("anterior cardiac vein", "collection-right-atrium");
edge("testicular vein left", "renal vein left");
edge("testicular vein right", "inferior vena cava");
edge("suprarenal vein left", "renal vein left");
edge("suprarenal vein right", "inferior vena cava");
edge("superior mesenteric vein", "hepatic portal vein");
edge("splenic vein", "hepatic portal vein");
edge(
  "hepatic portal vein",
  "collection-hepatic-sinusoids",
  "microcirculatory-transition",
);
for (const side of ["right", "middle", "left"]) {
  edge(
    "collection-hepatic-sinusoids",
    `${side} hepatic vein`,
    "microcirculatory-transition",
  );
  edge(`${side} hepatic vein`, "inferior vena cava");
}
// Variable inferior mesenteric termination is intentionally not asserted.
export const venousCollectionPoints = [
  {
    id: "collection-right-atrium",
    names: {
      en: "Right atrium (semantic endpoint, no model)",
      ro: "Atriu drept (capăt semantic, fără model)",
    },
  },
  {
    id: "collection-left-atrium",
    names: {
      en: "Left atrium (semantic endpoint, no model)",
      ro: "Atriu stâng (capăt semantic, fără model)",
    },
  },
  {
    id: "collection-hepatic-sinusoids",
    names: {
      en: "Hepatic microcirculation (concept only)",
      ro: "Microcirculație hepatică (doar concept)",
    },
  },
];
