// Publisher FMA identities. IS-A is used for source ownership, NEVER to infer
// branching. Romanian terminology is editorial and pending medical review.
export const arterialDefinitions = [];
function add(fma, ro, group, level = "named", parent = null, options = {}) {
  arterialDefinitions.push({
    id: `arterial-fma${fma}`,
    terminologyId: `FMA${fma}`,
    ro,
    group,
    level,
    parent,
    ...options,
  });
}
function pair(
  right,
  left,
  ro,
  group,
  level = "named",
  parents = [],
  options = {},
) {
  add(right, `${ro} — dreapta`, group, level, parents[0] ?? null, {
    laterality: "right",
    ...options,
  });
  add(left, `${ro} — stânga`, group, level, parents[1] ?? null, {
    laterality: "left",
    ...options,
  });
}
add(3768, "Arcul aortei", "aorta", "major", "cardiac-fma3736");
add(87217, "Aorta toracică descendentă", "aorta", "major", "arterial-fma3768");
add(3789, "Aorta abdominală", "aorta", "major", "arterial-fma87217");
add(3932, "Trunchi brahiocefalic", "aorta", "major", "arterial-fma3768", {
  laterality: "right",
});
pair(3941, 4058, "Artera carotidă comună", "head-neck", "major", [
  "arterial-fma3932",
  "arterial-fma3768",
]);
pair(3953, 4694, "Artera subclavie", "aorta", "major", [
  "arterial-fma3932",
  "arterial-fma3768",
]);
pair(3949, 4062, "Artera carotidă internă", "head-neck", "major", [
  "arterial-fma3941",
  "arterial-fma4058",
]);
pair(3958, 4066, "Artera vertebrală", "head-neck", "major", [
  "arterial-fma3953",
  "arterial-fma4694",
]);
pair(3969, 4068, "Artera toracică internă", "thoracic", "named", [
  "arterial-fma3953",
  "arterial-fma4694",
]);
pair(10692, 4077, "Artera musculofrenică", "thoracic");
pair(3988, 4083, "Artera epigastrică superioară", "thoracic");
pair(10697, 10680, "Artera tiroidiană inferioară", "head-neck");
pair(10698, 10681, "Artera suprascapulară", "head-neck");
pair(10699, 10682, "Artera cervicală transversă", "head-neck");
pair(10660, 4134, "Artera cervicală profundă", "head-neck");
pair(4057, 10552, "Artera dorsală a scapulei", "head-neck");
add(
  4176,
  "Artere intercostale posterioare (set din sursă)",
  "thoracic",
  "named",
  null,
  { grouped: true, laterality: "bilateral" },
);
pair(4634, 4654, "Artera subcostală", "thoracic");
add(
  71537,
  "Ramuri esofagiene ale aortei toracice (set)",
  "thoracic",
  "fine",
  null,
  { grouped: true },
);
// Cerebral source parts, not a perfusion territory atlas. Bilateral FJ...M files
// are publisher-provided geometry; this importer never mirrors anything.
pair(49869, 49870, "Artera oftalmică", "cerebral", "named", [
  "arterial-fma3949",
  "arterial-fma4062",
]);
pair(50029, 50030, "Artera cerebrală anterioară", "cerebral", "major", [
  "arterial-fma3949",
  "arterial-fma4062",
]);
pair(
  50366,
  50367,
  "Partea sfenoidală a arterei cerebrale medii (M1)",
  "cerebral",
  "major",
  ["arterial-fma3949", "arterial-fma4062"],
);
pair(
  50369,
  50370,
  "Partea insulară a arterei cerebrale medii (M2)",
  "cerebral",
  "named",
  ["arterial-fma50366", "arterial-fma50367"],
);
pair(
  76128,
  76129,
  "Trunchiul ramurii terminale inferioare a arterei cerebrale medii",
  "cerebral",
);
pair(50085, 50086, "Artera comunicantă posterioară", "cerebral");
pair(50088, 50089, "Artera coroidiană anterioară", "cerebral");
add(50169, "Artera comunicantă anterioară", "cerebral");
add(50542, "Artera bazilară", "cerebral", "major");
pair(
  50639,
  50640,
  "Partea precomunicantă a arterei cerebrale posterioare (P1)",
  "cerebral",
  "major",
  ["arterial-fma50542", "arterial-fma50542"],
);
pair(
  50641,
  50642,
  "Partea postcomunicantă a arterei cerebrale posterioare (P2)",
  "cerebral",
  "named",
  ["arterial-fma50639", "arterial-fma50640"],
);
pair(50519, 50520, "Artera cerebeloasă posterioară inferioară", "cerebral");
pair(50574, 50575, "Artera cerebeloasă superioară", "cerebral");
add(
  50544,
  "Artere cerebeloase anterioare inferioare (set bilateral)",
  "cerebral",
  "named",
  null,
  { grouped: true, laterality: "bilateral" },
);
pair(50347, 50348, "Artera calosomarginală", "cerebral", "fine");
pair(50359, 50360, "Artera pericalosală", "cerebral", "fine");
pair(50343, 50344, "Artera frontobazală medială", "cerebral", "fine");
pair(50380, 50381, "Artera polară temporală", "cerebral", "fine");
pair(50383, 50384, "Artera temporală anterioară", "cerebral", "fine");
pair(50443, 50444, "Artera frontobazală laterală", "cerebral", "fine");
pair(50445, 50478, "Artera prefrontală", "cerebral", "fine");
pair(50480, 50481, "Artera șanțului precentral", "cerebral", "fine");
pair(50483, 50484, "Artera șanțului postcentral", "cerebral", "fine");
pair(50486, 50487, "Artera parietală anterioară", "cerebral", "fine");
pair(50489, 50490, "Artera parietală posterioară", "cerebral", "fine");
pair(
  50467,
  50468,
  "Ramura temporală mijlocie a arterei cerebrale medii",
  "cerebral",
  "fine",
);
pair(
  50470,
  50471,
  "Ramura temporală posterioară a arterei cerebrale medii",
  "cerebral",
  "fine",
);
pair(
  50473,
  50474,
  "Ramura temporooccipitală a arterei cerebrale medii",
  "cerebral",
  "fine",
);
pair(50664, 50665, "Artera talamoperforantă", "cerebral", "fine");
pair(50670, 50671, "Artera talamogeniculată", "cerebral", "fine");
pair(50672, 50673, "Artera coroidiană posterioară medială", "cerebral", "fine");
// Abdominal and renal source anatomy. Sex-specific gonadal arteries are male,
// never presented as a universal male/female composite.
add(50737, "Trunchi celiac", "abdominal", "major", "arterial-fma3789", {
  onlyFiles: ["FJ1846"],
  duplicateAliases: [{ id: "FJ2013", duplicateOf: "FJ1846" }],
});
add(14768, "Artera gastrică stângă", "abdominal", "named", "arterial-fma50737");
add(14771, "Artera hepatică comună", "abdominal", "named", "arterial-fma50737");
add(14773, "Artera splenică", "abdominal", "named", "arterial-fma50737");
add(76574, "Trunchiul arterei gastroduodenale", "abdominal");
add(70456, "Trunchiul arterei hepatice drepte", "abdominal", "named", null, {
  laterality: "right",
});
add(70457, "Trunchiul arterei hepatice stângi", "abdominal", "named", null, {
  laterality: "left",
});
add(14776, "Artera gastrică dreaptă", "abdominal");
add(14781, "Artera gastroomentală dreaptă", "abdominal");
add(14796, "Artera gastroomentală stângă", "abdominal");
add(
  66358,
  "Trunchiul arterei mezenterice superioare",
  "abdominal",
  "major",
  "arterial-fma3789",
);
add(
  14750,
  "Artera mezenterică inferioară",
  "abdominal",
  "major",
  "arterial-fma3789",
);
add(14810, "Artera colică medie", "abdominal");
add(14811, "Artera colică dreaptă", "abdominal");
add(14815, "Artera ileocolică", "abdominal");
add(14826, "Artera colică stângă", "abdominal");
add(14832, "Artera rectală superioară", "abdominal");
pair(66363, 66364, "Trunchiul arterei renale", "renal", "major", [
  "arterial-fma3789",
  "arterial-fma3789",
]);
pair(86340, 86341, "Ramura segmentară renală superioară", "renal", "fine");
pair(86346, 86347, "Ramura segmentară renală inferioară", "renal", "fine");
pair(86348, 86349, "Ramura segmentară renală posterioară", "renal", "fine");
pair(14755, 14756, "Artera suprarenală mijlocie", "renal");
pair(69265, 69266, "Artera suprarenală inferioară", "renal");
pair(14746, 14747, "Artera frenică inferioară", "abdominal");
pair(14759, 14760, "Artera testiculară", "abdominal", "named", [], {
  sex: "male",
});
pair(14765, 14766, "Artera iliacă comună", "pelvic", "major", [
  "arterial-fma3789",
  "arterial-fma3789",
]);
pair(18806, 18807, "Artera iliacă externă", "pelvic", "major", [
  "arterial-fma14765",
  "arterial-fma14766",
]);
pair(18809, 18810, "Artera iliacă internă", "pelvic", "major", [
  "arterial-fma14765",
  "arterial-fma14766",
]);
pair(20688, 20689, "Artera epigastrică inferioară", "pelvic");
// Limbs: original named meshes, no radius inference or procedural tubes.
pair(22655, 22656, "Artera axilară", "upper-limb", "major", [
  "arterial-fma3953",
  "arterial-fma4694",
]);
pair(22691, 22692, "Artera brahială", "upper-limb", "major", [
  "arterial-fma22655",
  "arterial-fma22656",
]);
pair(22733, 22734, "Artera radială", "upper-limb", "major", [
  "arterial-fma22691",
  "arterial-fma22692",
]);
pair(22797, 22798, "Artera ulnară", "upper-limb", "major", [
  "arterial-fma22691",
  "arterial-fma22692",
]);
pair(22696, 22697, "Artera brahială profundă", "upper-limb");
pair(22675, 22676, "Artera toracică laterală", "upper-limb");
pair(22678, 22679, "Artera subscapulară", "upper-limb");
pair(22682, 22683, "Artera circumflexă humerală anterioară", "upper-limb");
pair(22685, 22687, "Artera circumflexă humerală posterioară", "upper-limb");
pair(23180, 23181, "Artera circumflexă a scapulei", "upper-limb");
pair(66321, 66322, "Artera toracodorsală", "upper-limb");
pair(66563, 66564, "Trunchiul arterei toracoacromiale", "upper-limb");
pair(22707, 22708, "Artera colaterală ulnară superioară", "upper-limb");
pair(22712, 22713, "Artera colaterală ulnară inferioară", "upper-limb");
pair(22807, 22808, "Artera interosoasă comună", "upper-limb");
pair(22812, 22813, "Artera interosoasă anterioară", "upper-limb");
pair(22835, 22837, "Arcul arterial palmar superficial", "upper-limb");
pair(22839, 22840, "Arcul palmar profund", "upper-limb");
pair(
  22856,
  85118,
  "Prima arteră digitală palmară comună",
  "upper-limb",
  "fine",
);
pair(
  85119,
  85120,
  "A doua arteră digitală palmară comună",
  "upper-limb",
  "fine",
);
pair(
  85121,
  85122,
  "A treia arteră digitală palmară comună",
  "upper-limb",
  "fine",
);
pair(
  85123,
  85124,
  "A patra arteră digitală palmară comună",
  "upper-limb",
  "fine",
);
pair(70249, 70250, "Artera femurală", "lower-limb", "major", [
  "arterial-fma18806",
  "arterial-fma18807",
]);
pair(77380, 77381, "Artera poplitee", "lower-limb", "major", [
  "arterial-fma70249",
  "arterial-fma70250",
]);
pair(43896, 43897, "Artera tibială anterioară", "lower-limb", "major", [
  "arterial-fma77380",
  "arterial-fma77381",
]);
pair(43898, 43899, "Artera tibială posterioară", "lower-limb", "major", [
  "arterial-fma77380",
  "arterial-fma77381",
]);
pair(43916, 43917, "Artera dorsală a piciorului", "lower-limb", "named", [
  "arterial-fma43896",
  "arterial-fma43897",
]);
pair(43929, 43930, "Artera plantară medială", "lower-limb");
pair(43931, 43932, "Artera plantară laterală", "lower-limb");
pair(20801, 20802, "Artera circumflexă femurală laterală", "lower-limb");
pair(22507, 22508, "Artera geniculară descendentă", "lower-limb");
pair(22586, 22587, "Artera geniculară superioară medială", "lower-limb");
pair(22588, 22589, "Artera geniculară superioară laterală", "lower-limb");
pair(43890, 43891, "Artera geniculară inferioară medială", "lower-limb");
pair(43892, 43893, "Artera geniculară inferioară laterală", "lower-limb");
pair(69494, 69495, "Artera arcuată a piciorului", "lower-limb", "fine");
pair(69490, 69491, "Artera tarsiană laterală", "lower-limb", "fine");
pair(69514, 69515, "Artera plantară profundă", "lower-limb", "fine");
pair(50872, 50873, "Artera pulmonară", "pulmonary", "major", [
  "cardiac-fma8612",
  "cardiac-fma8612",
]);
add(
  8755,
  "Artere pulmonare segmentare (set din sursă)",
  "pulmonary",
  "fine",
  null,
  { grouped: true, laterality: "bilateral" },
);
add(
  9311,
  "Artere pulmonare subsegmentare (set din sursă)",
  "pulmonary",
  "fine",
  null,
  { grouped: true, laterality: "bilateral" },
);
// Declared gaps, not pretend coverage. IDs here are application target IDs,
// not invented FMA codes. Fine targets are scoped families, not every vessel.
export const arterialMissing = [
  [
    "aortic-root",
    "Aortic root (separate segmentation)",
    "Rădăcina aortei (segmentare separată)",
    "aorta",
  ],
  [
    "external-carotid",
    "External carotid arteries and facial branches",
    "Artere carotide externe și ramuri faciale",
    "head-neck",
  ],
  [
    "thyrocervical",
    "Thyrocervical and costocervical trunks",
    "Trunchiuri tirocervicale și costocervicale",
    "head-neck",
  ],
  [
    "cerebral-distal",
    "Additional named distal cerebral branches",
    "Alte ramuri cerebrale distale numite",
    "cerebral",
  ],
  [
    "aca-segments",
    "Individual ACA A1/A2 segments",
    "Segmente ACA A1/A2 individualizate",
    "cerebral",
  ],
  [
    "mca-distal",
    "MCA M3/M4 and additional perforators",
    "MCA M3/M4 și alte perforante",
    "cerebral",
  ],
  [
    "cerebral-territories",
    "Registered cerebral perfusion territory maps",
    "Hărți înregistrate ale teritoriilor de perfuzie cerebrală",
    "cerebral",
  ],
  [
    "coronary-detail",
    "Additional diagonal, marginal and septal coronary branches",
    "Alte ramuri coronare diagonale, marginale și septale",
    "coronary",
  ],
  [
    "coronary-dominance",
    "Alternative coronary dominance geometry",
    "Geometrie pentru dominanțe coronare alternative",
    "coronary",
  ],
  [
    "pulmonary-lobes",
    "Individually mapped lobar/segmental pulmonary branches",
    "Ramuri pulmonare lobare/segmentare individualizate",
    "pulmonary",
  ],
  [
    "bronchial",
    "Named bronchial, mediastinal and pericardial arteries",
    "Artere bronșice, mediastinale și pericardice numite",
    "thoracic",
  ],
  [
    "lumbar",
    "Individual lumbar and spinal branches",
    "Ramuri lombare și spinale individualizate",
    "abdominal",
  ],
  [
    "hepatic-fine",
    "Additional hepatic and pancreatic branches",
    "Alte ramuri hepatice și pancreatice",
    "abdominal",
  ],
  [
    "intestinal",
    "Intestinal arcades, vasa recta and additional named branches",
    "Arcade intestinale, vase drepte și alte ramuri numite",
    "abdominal",
  ],
  [
    "renal-fine",
    "Remaining renal segments, interlobar and arcuate arteries",
    "Alte segmente renale, artere interlobare și arcuate",
    "renal",
  ],
  [
    "renal-variants",
    "Accessory renal arteries (separate variants)",
    "Artere renale accesorii (variante separate)",
    "renal",
  ],
  [
    "pelvic-branches",
    "Gluteal, pudendal, obturator and vesical branches",
    "Ramuri gluteale, pudendale, obturatoare și vezicale",
    "pelvic",
  ],
  [
    "female-pelvis",
    "Female pelvic and ovarian reference geometry",
    "Geometrie de referință pelvină feminină și ovariană",
    "pelvic",
  ],
  [
    "upper-fine",
    "Remaining recurrent, digital and communicating hand branches",
    "Alte ramuri recurente, digitale și comunicante ale mâinii",
    "upper-limb",
  ],
  [
    "deep-femoral",
    "Deep femoral and medial circumflex femoral arteries",
    "Artere femurale profunde și circumflexe femurale mediale",
    "lower-limb",
  ],
  [
    "fibular",
    "Fibular arteries and remaining distal foot branches",
    "Artere fibulare și alte ramuri distale ale piciorului",
    "lower-limb",
  ],
  [
    "spinal",
    "Spinal, radiculomedullary and Adamkiewicz arteries",
    "Artere spinale, radiculomedulare și Adamkiewicz",
    "spinal",
  ],
  [
    "microcirculation",
    "Validated arterial microanatomy",
    "Microanatomie arterială validată",
    "aorta",
  ],
].map(([key, en, ro, group]) => ({
  id: `arterial-missing-${key}`,
  names: { en, ro },
  group,
}));
