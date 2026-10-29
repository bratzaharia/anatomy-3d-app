// Curated macroscopic inventory; terms are not a claim of complete geometry.
export const nervousTerminologyUrl =
  "https://ifaa.net/committees/anatomical-terminology-fipat/fipat-ifaa-terminologies/";
export const nervousGroups = [
  [
    "brain",
    "Brain and central structures",
    "Encefal și structuri centrale",
    "cns",
  ],
  ["cranial", "Cranial nerves I–XII", "Nervi cranieni I–XII", "pns"],
  [
    "spinal",
    "Spinal nerves — 31 pairs",
    "Nervi spinali — 31 de perechi",
    "pns",
  ],
  ["cervical", "Cervical plexus", "Plex cervical", "pns"],
  ["brachial", "Brachial plexus", "Plex brahial", "pns"],
  ["thoracic", "Thoracic nerves", "Nervi toracici", "pns"],
  ["lumbar", "Lumbar plexus", "Plex lombar", "pns"],
  [
    "sacral",
    "Sacral plexus and lower limb",
    "Plex sacral și membru inferior",
    "pns",
  ],
  ["autonomic", "Autonomic structures", "Structuri autonome", "pns"],
  [
    "associated",
    "Associated cavities and coverings",
    "Cavități și învelișuri asociate",
    "associated",
  ],
];
export const nervousDefinitions = [];
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
function add(name, ro, latin, group, options = {}) {
  const { paired = false, ...extra } = options;
  for (const side of paired ? ["left", "right"] : [options.side ?? "midline"]) {
    const sided = paired ? `${side} ${name}` : name;
    nervousDefinitions.push({
      id: `nervous-${slug(name)}${paired ? `-${side}` : ""}`,
      names: {
        en: (paired ? `${side[0].toUpperCase()}${side.slice(1)} ` : "") + name,
        ro: ro + (paired ? (side === "left" ? " — stânga" : " — dreapta") : ""),
      },
      latinName: latin,
      laterality: side,
      group,
      division: nervousGroups.find(([id]) => id === group)[3],
      functions: [],
      regionIds: ["head"],
      structureType: group === "brain" ? "brain_region" : "nerve",
      parentId: group === "brain" ? "nervous-brain" : undefined,
      sourceName: options.source === false ? null : sided,
      ...extra,
    });
  }
}

// Exact publisher concept names are used only at import time, never as runtime IDs.
for (const [en, ro, la] of [
  [
    "superior frontal gyrus",
    "Girus frontal superior",
    "Gyrus frontalis superior",
  ],
  ["middle frontal gyrus", "Girus frontal mijlociu", "Gyrus frontalis medius"],
  [
    "inferior frontal gyrus",
    "Girus frontal inferior",
    "Gyrus frontalis inferior",
  ],
  ["precentral gyrus", "Girus precentral", "Gyrus precentralis"],
  ["postcentral gyrus", "Girus postcentral", "Gyrus postcentralis"],
  ["supramarginal gyrus", "Girus supramarginal", "Gyrus supramarginalis"],
  ["angular gyrus", "Girus angular", "Gyrus angularis"],
  [
    "superior parietal lobule",
    "Lobul parietal superior",
    "Lobulus parietalis superior",
  ],
  [
    "middle temporal gyrus",
    "Girus temporal mijlociu",
    "Gyrus temporalis medius",
  ],
  [
    "inferior temporal gyrus",
    "Girus temporal inferior",
    "Gyrus temporalis inferior",
  ],
  ["fusiform gyrus", "Girus fusiform", "Gyrus fusiformis"],
  ["parahippocampal gyrus", "Girus parahipocampal", "Gyrus parahippocampalis"],
  ["cingulate gyrus", "Girus cingular", "Gyrus cinguli"],
  ["occipital lobe", "Lob occipital", "Lobus occipitalis"],
  ["insula", "Insulă", "Insula"],
  ["hippocampus", "Hipocamp", "Hippocampus"],
  ["amygdala", "Amigdală", "Corpus amygdaloideum"],
  ["caudate nucleus", "Nucleu caudat", "Nucleus caudatus"],
  ["putamen", "Putamen", "Putamen"],
  ["globus pallidus", "Glob palid", "Globus pallidus"],
  ["internal capsule", "Capsulă internă", "Capsula interna"],
  ["thalamus", "Talamus", "Thalamus"],
  ["fornix of forebrain", "Fornix", "Fornix"],
])
  add(en, ro, la, "brain", { paired: true });
for (const [en, ro, la] of [
  ["corpus callosum", "Corp calos", "Corpus callosum"],
  ["hypothalamus", "Hipotalamus", "Hypothalamus"],
  ["midbrain", "Mezencefal", "Mesencephalon"],
  ["pons", "Punte", "Pons"],
  ["medulla oblongata", "Bulb rahidian", "Medulla oblongata"],
  ["cerebellum", "Cerebel", "Cerebellum"],
  ["optic chiasm", "Chiasmă optică", "Chiasma opticum"],
])
  add(en, ro, la, "brain");
add("spinal cord", "Măduvă spinală", "Medulla spinalis", "brain", {
  source: false,
  parentId: undefined,
  structureType: "spinal_cord_region",
  regionIds: ["neck", "back"],
  gap: "Quarantined: PART-OF FMA7647 (spinal cord) and FMA78497 (central canal) both map to FJ1737. Tissue-versus-cavity identity requires independent source review.",
});

export const cranialDefinitions = [
  ["olfactory nerve", "Nerv olfactiv", "Nervus olfactorius", "I", "sensory"],
  ["optic nerve", "Nerv optic", "Nervus opticus", "II", "sensory"],
  [
    "oculomotor nerve",
    "Nerv oculomotor",
    "Nervus oculomotorius",
    "III",
    "motor",
  ],
  ["trochlear nerve", "Nerv trohlear", "Nervus trochlearis", "IV", "motor"],
  ["trigeminal nerve", "Nerv trigemen", "Nervus trigeminus", "V", "mixed"],
  ["abducens nerve", "Nerv abducens", "Nervus abducens", "VI", "motor"],
  ["facial nerve", "Nerv facial", "Nervus facialis", "VII", "mixed"],
  [
    "vestibulocochlear nerve",
    "Nerv vestibulocohlear",
    "Nervus vestibulocochlearis",
    "VIII",
    "sensory",
  ],
  [
    "glossopharyngeal nerve",
    "Nerv glosofaringian",
    "Nervus glossopharyngeus",
    "IX",
    "mixed",
  ],
  ["vagus nerve", "Nerv vag", "Nervus vagus", "X", "mixed"],
  ["accessory nerve", "Nerv accesor", "Nervus accessorius", "XI", "motor"],
  ["hypoglossal nerve", "Nerv hipoglos", "Nervus hypoglossus", "XII", "motor"],
];
for (const [en, ro, la, number, fn] of cranialDefinitions)
  add(en, ro, la, "cranial", {
    paired: true,
    division: number === "II" ? "cns" : "pns",
    cranialNumber: number,
    // Mixed means mixed fiber classes; no unsupported organ/muscle innervation claims.
    functions:
      number === "III" ? ["motor", "autonomic", "parasympathetic"] : [fn],
    regionIds:
      number === "X" ? ["head", "neck", "thorax", "abdomen"] : ["head"],
    note:
      number === "II"
        ? "Optic nerve is a CNS tract despite its traditional cranial nerve designation."
        : null,
  });
for (const [en, ro, la] of [
  ["ophthalmic nerve", "Nerv oftalmic (V1)", "Nervus ophthalmicus"],
  ["lacrimal nerve", "Nerv lacrimal", "Nervus lacrimalis"],
  ["frontal nerve", "Nerv frontal", "Nervus frontalis"],
  ["supratrochlear nerve", "Nerv supratrohlear", "Nervus supratrochlearis"],
  ["supra-orbital nerve", "Nerv supraorbital", "Nervus supraorbitalis"],
  ["nasociliary nerve", "Nerv nazociliar", "Nervus nasociliaris"],
  [
    "anterior ethmoidal nerve",
    "Nerv etmoidal anterior",
    "Nervus ethmoidalis anterior",
  ],
  [
    "posterior ethmoidal nerve",
    "Nerv etmoidal posterior",
    "Nervus ethmoidalis posterior",
  ],
  ["infratrochlear nerve", "Nerv infratrohlear", "Nervus infratrochlearis"],
  ["long ciliary nerve", "Nerv ciliar lung", "Nervi ciliares longi"],
])
  add(en, ro, la, "cranial", { paired: true, structureType: "nerve_branch" });
for (const [en, ro, la] of [
  ["maxillary nerve", "Nerv maxilar (V2)", "Nervus maxillaris"],
  ["mandibular nerve", "Nerv mandibular (V3)", "Nervus mandibularis"],
])
  add(en, ro, la, "cranial", { paired: true, structureType: "nerve_branch" });
for (const [en, ro, la] of [
  [
    "superior branch of oculomotor nerve",
    "Ramură superioară a nervului oculomotor",
    "Ramus superior nervi oculomotorii",
  ],
  [
    "inferior branch of oculomotor nerve",
    "Ramură inferioară a nervului oculomotor",
    "Ramus inferior nervi oculomotorii",
  ],
]) {
  add(en, ro, la, "cranial", {
    paired: true,
    structureType: "nerve_branch",
    source: false,
  });
  for (const item of nervousDefinitions.slice(-2))
    item.sourceName = en.replace(
      "oculomotor nerve",
      `${item.laterality} oculomotor nerve`,
    );
}
add("ciliary ganglion", "Ganglion ciliar", "Ganglion ciliare", "autonomic", {
  paired: true,
  structureType: "ganglion",
  functions: ["autonomic", "parasympathetic"],
});

// Full 31-pair inventory, not manufactured geometry or spinal-segment coordinates.
for (const [prefix, count, region, ro, latin] of [
  ["C", 8, "neck", "cervical", "cervicalis"],
  ["T", 12, "thorax", "toracic", "thoracicus"],
  ["L", 5, "abdomen", "lombar", "lumbalis"],
  ["S", 5, "pelvis", "sacral", "sacralis"],
  ["Co", 1, "pelvis", "coccigian", "coccygeus"],
])
  for (let n = 1; n <= count; n++)
    add(
      `spinal nerve ${prefix}${n}`,
      `Nerv spinal ${ro} ${prefix}${n}`,
      `Nervus spinalis ${latin} ${n}`,
      "spinal",
      {
        paired: true,
        source: false,
        spinalDesignation: `${prefix}${n}`,
        regionIds: [region],
        functions: ["mixed"],
      },
    );

const peripheral = {
  cervical: [
    [
      "lesser occipital nerve",
      "Nerv occipital mic",
      "Nervus occipitalis minor",
    ],
    [
      "great auricular nerve",
      "Nerv auricular mare",
      "Nervus auricularis magnus",
    ],
    [
      "transverse cervical nerve",
      "Nerv transvers al gâtului",
      "Nervus transversus colli",
    ],
    [
      "supraclavicular nerves",
      "Nervi supraclaviculari",
      "Nervi supraclaviculares",
    ],
    ["phrenic nerve", "Nerv frenic", "Nervus phrenicus"],
  ],
  brachial: [
    ["musculocutaneous nerve", "Nerv musculocutanat", "Nervus musculocutaneus"],
    ["median nerve", "Nerv median", "Nervus medianus"],
    ["ulnar nerve", "Nerv ulnar", "Nervus ulnaris"],
    ["axillary nerve", "Nerv axilar", "Nervus axillaris"],
    ["radial nerve", "Nerv radial", "Nervus radialis"],
    [
      "dorsal scapular nerve",
      "Nerv dorsal al scapulei",
      "Nervus dorsalis scapulae",
    ],
    ["long thoracic nerve", "Nerv toracic lung", "Nervus thoracicus longus"],
    ["suprascapular nerve", "Nerv suprascapular", "Nervus suprascapularis"],
    [
      "nerve to subclavius",
      "Nerv al mușchiului subclavicular",
      "Nervus subclavius",
    ],
    [
      "lateral pectoral nerve",
      "Nerv pectoral lateral",
      "Nervus pectoralis lateralis",
    ],
    [
      "medial pectoral nerve",
      "Nerv pectoral medial",
      "Nervus pectoralis medialis",
    ],
    [
      "upper subscapular nerve",
      "Nerv subscapular superior",
      "Nervus subscapularis superior",
    ],
    [
      "lower subscapular nerve",
      "Nerv subscapular inferior",
      "Nervus subscapularis inferior",
    ],
    ["thoracodorsal nerve", "Nerv toracodorsal", "Nervus thoracodorsalis"],
    [
      "medial cutaneous nerve of arm",
      "Nerv cutanat medial al brațului",
      "Nervus cutaneus brachii medialis",
    ],
    [
      "medial cutaneous nerve of forearm",
      "Nerv cutanat medial al antebrațului",
      "Nervus cutaneus antebrachii medialis",
    ],
  ],
  lumbar: [
    [
      "iliohypogastric nerve",
      "Nerv iliohipogastric",
      "Nervus iliohypogastricus",
    ],
    ["ilioinguinal nerve", "Nerv ilioinghinal", "Nervus ilioinguinalis"],
    ["genitofemoral nerve", "Nerv genitofemural", "Nervus genitofemoralis"],
    [
      "lateral femoral cutaneous nerve",
      "Nerv cutanat femural lateral",
      "Nervus cutaneus femoris lateralis",
    ],
    ["femoral nerve", "Nerv femural", "Nervus femoralis"],
    ["obturator nerve", "Nerv obturator", "Nervus obturatorius"],
  ],
  sacral: [
    ["sciatic nerve", "Nerv sciatic", "Nervus ischiadicus"],
    ["tibial nerve", "Nerv tibial", "Nervus tibialis"],
    ["common fibular nerve", "Nerv fibular comun", "Nervus fibularis communis"],
    [
      "superficial fibular nerve",
      "Nerv fibular superficial",
      "Nervus fibularis superficialis",
    ],
    [
      "deep fibular nerve",
      "Nerv fibular profund",
      "Nervus fibularis profundus",
    ],
    [
      "superior gluteal nerve",
      "Nerv gluteal superior",
      "Nervus gluteus superior",
    ],
    [
      "inferior gluteal nerve",
      "Nerv gluteal inferior",
      "Nervus gluteus inferior",
    ],
    [
      "posterior femoral cutaneous nerve",
      "Nerv cutanat femural posterior",
      "Nervus cutaneus femoris posterior",
    ],
    ["pudendal nerve", "Nerv pudendal", "Nervus pudendus"],
    [
      "medial plantar nerve",
      "Nerv plantar medial",
      "Nervus plantaris medialis",
    ],
    [
      "lateral plantar nerve",
      "Nerv plantar lateral",
      "Nervus plantaris lateralis",
    ],
  ],
};
for (const [group, entries] of Object.entries(peripheral))
  for (const [en, ro, la] of entries) {
    add(en, ro, la, group, { paired: true, source: false });
    for (const item of nervousDefinitions.slice(-2))
      item.regionIds =
        group === "cervical"
          ? ["neck"]
          : group === "brachial"
            ? ["neck", `upper-limb-${item.laterality}`]
            : group === "lumbar"
              ? ["abdomen", `lower-limb-${item.laterality}`]
              : ["pelvis", `lower-limb-${item.laterality}`];
  }
for (let n = 1; n <= 11; n++)
  add(
    `intercostal nerve T${n}`,
    `Nerv intercostal T${n}`,
    `Nervus intercostalis ${n}`,
    "thoracic",
    { paired: true, source: false, regionIds: ["thorax"] },
  );
add("subcostal nerve", "Nerv subcostal", "Nervus subcostalis", "thoracic", {
  paired: true,
  source: false,
  regionIds: ["thorax", "abdomen"],
});
for (const [en, ro, la, fn, region] of [
  [
    "sympathetic trunk",
    "Trunchi simpatic",
    "Truncus sympathicus",
    "sympathetic",
    "back",
  ],
  [
    "superior cervical ganglion",
    "Ganglion cervical superior",
    "Ganglion cervicale superius",
    "sympathetic",
    "neck",
  ],
  [
    "middle cervical ganglion",
    "Ganglion cervical mijlociu",
    "Ganglion cervicale medium",
    "sympathetic",
    "neck",
  ],
  [
    "cervicothoracic ganglion",
    "Ganglion cervicotoracic",
    "Ganglion cervicothoracicum",
    "sympathetic",
    "neck",
  ],
  [
    "greater splanchnic nerve",
    "Nerv splanhnic mare",
    "Nervus splanchnicus major",
    "sympathetic",
    "thorax",
  ],
  [
    "lesser splanchnic nerve",
    "Nerv splanhnic mic",
    "Nervus splanchnicus minor",
    "sympathetic",
    "thorax",
  ],
  [
    "pelvic splanchnic nerves",
    "Nervi splanhnici pelvini",
    "Nervi splanchnici pelvici",
    "parasympathetic",
    "pelvis",
  ],
  [
    "sacral splanchnic nerves",
    "Nervi splanhnici sacrali",
    "Nervi splanchnici sacrales",
    "sympathetic",
    "pelvis",
  ],
  [
    "pterygopalatine ganglion",
    "Ganglion pterigopalatin",
    "Ganglion pterygopalatinum",
    "parasympathetic",
    "head",
  ],
  [
    "submandibular ganglion",
    "Ganglion submandibular",
    "Ganglion submandibulare",
    "parasympathetic",
    "head",
  ],
  [
    "otic ganglion",
    "Ganglion otic",
    "Ganglion oticum",
    "parasympathetic",
    "head",
  ],
])
  add(en, ro, la, "autonomic", {
    paired: true,
    source: false,
    regionIds: [region],
    functions: ["autonomic", fn],
    structureType: en.includes("ganglion") ? "ganglion" : "nerve",
  });
for (const [en, ro, la] of [
  ["myenteric plexus", "Plex mienteric", "Plexus myentericus"],
  ["submucosal plexus", "Plex submucos", "Plexus submucosus"],
])
  add(en, ro, la, "autonomic", {
    source: false,
    regionIds: ["abdomen"],
    functions: ["autonomic", "enteric"],
    structureType: "nerve_plexus",
  });
for (const [en, ro, la] of [
  [
    "lateral ventricles",
    "Ventriculi laterali (pereche)",
    "Ventriculi laterales",
  ],
  ["third ventricle", "Ventricul al treilea", "Ventriculus tertius"],
  ["fourth ventricle", "Ventricul al patrulea", "Ventriculus quartus"],
  ["filum terminale", "Filum terminale", "Filum terminale"],
])
  add(en, ro, la, "associated", {
    source: false,
    side: en === "lateral ventricles" ? "bilateral" : "midline",
    regionIds: en === "filum terminale" ? ["back", "pelvis"] : ["head"],
    structureType: "associated_structure",
    medicalSource:
      "https://openstax.org/books/anatomy-and-physiology/pages/13-3-circulation-and-the-central-nervous-system",
    note: "Associated structure, not neural tissue; no independent geometry supplied.",
  });

// Navigation and neural connectivity remain separate. Only verified coarse
// branch relationships are asserted; no spatial course or root contributions.
export const nervousConnections = [];
for (const side of ["left", "right"]) {
  const id = (name) => `nervous-${slug(name)}-${side}`;
  for (const [from, to] of [
    ["sciatic nerve", "tibial nerve"],
    ["sciatic nerve", "common fibular nerve"],
    ["common fibular nerve", "superficial fibular nerve"],
    ["common fibular nerve", "deep fibular nerve"],
    ["tibial nerve", "medial plantar nerve"],
    ["tibial nerve", "lateral plantar nerve"],
    ["trigeminal nerve", "ophthalmic nerve"],
    ["trigeminal nerve", "maxillary nerve"],
    ["trigeminal nerve", "mandibular nerve"],
  ])
    nervousConnections.push({
      from: id(from),
      to: id(to),
      relation: "branches_into",
      sourceUrl:
        from === "trigeminal nerve"
          ? "https://openstax.org/books/anatomy-and-physiology-2e/pages/13-4-the-peripheral-nervous-system"
          : "https://medicine.uams.edu/neuroscience/education/medical-school-courses/human-structure-module/anatomy-tables/nerve-tables/nerves-of-the-lower-limb/",
    });
}

for (const [group, en, ro, la, region] of [
  ["cervical", "cervical plexus", "Plex cervical", "Plexus cervicalis", "neck"],
  ["brachial", "brachial plexus", "Plex brahial", "Plexus brachialis", "neck"],
  ["lumbar", "lumbar plexus", "Plex lombar", "Plexus lumbalis", "abdomen"],
  ["sacral", "sacral plexus", "Plex sacral", "Plexus sacralis", "pelvis"],
])
  add(en, ro, la, group, {
    paired: true,
    source: false,
    structureType: "nerve_plexus",
    regionIds: [region],
  });
for (const [en, ro, la] of [
  [
    "superior trunk of brachial plexus",
    "Trunchi superior al plexului brahial",
    "Truncus superior plexus brachialis",
  ],
  [
    "middle trunk of brachial plexus",
    "Trunchi mijlociu al plexului brahial",
    "Truncus medius plexus brachialis",
  ],
  [
    "inferior trunk of brachial plexus",
    "Trunchi inferior al plexului brahial",
    "Truncus inferior plexus brachialis",
  ],
  [
    "lateral cord of brachial plexus",
    "Fascicul lateral al plexului brahial",
    "Fasciculus lateralis plexus brachialis",
  ],
  [
    "medial cord of brachial plexus",
    "Fascicul medial al plexului brahial",
    "Fasciculus medialis plexus brachialis",
  ],
  [
    "posterior cord of brachial plexus",
    "Fascicul posterior al plexului brahial",
    "Fasciculus posterior plexus brachialis",
  ],
])
  add(en, ro, la, "brachial", {
    paired: true,
    source: false,
    structureType: "nerve_plexus",
    regionIds: ["neck"],
  });
