// Deliberately curated: the upstream broad skeleton group also includes eye
// tissues and omits limb bones. Only the named bone concepts below are imported.
const ordinals = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
  "tenth",
  "eleventh",
  "twelfth",
];
const sides = ["left", "right"];
const paired = (name) => sides.map((side) => `${side} ${name}`);
const headBones = [
  "frontal bone",
  "occipital bone",
  "sphenoid bone",
  "ethmoid",
  "vomer",
  ...[
    "temporal bone",
    "parietal bone",
    "zygomatic bone",
    "lacrimal bone",
    "nasal bone",
    "palatine bone",
    "maxilla",
    "inferior nasal concha",
  ].flatMap(paired),
];

export const skeletonDefinitions = [
  {
    id: "skull",
    en: "Skull (without mandible)",
    ro: "Craniu (fără mandibulă)",
    latin: "Cranium",
    region: "head",
    sourceNames: headBones,
  },
  {
    id: "mandible",
    en: "Mandible",
    ro: "Mandibulă",
    latin: "Mandibula",
    region: "head",
    sourceNames: ["mandible"],
  },
  {
    id: "hyoid",
    en: "Hyoid bone",
    ro: "Os hioid",
    latin: "Os hyoideum",
    region: "neck",
    sourceNames: ["hyoid bone"],
  },
  {
    id: "vertebral-column",
    en: "Vertebral column (C1–L5)",
    ro: "Coloană vertebrală (C1–L5)",
    latin: "Columna vertebralis",
    region: "back",
    sourceNames: [
      "atlas",
      "axis",
      ...ordinals.slice(2, 7).map((n) => `${n} cervical vertebra`),
      ...ordinals.map((n) => `${n} thoracic vertebra`),
      ...ordinals.slice(0, 5).map((n) => `${n} lumbar vertebra`),
    ],
  },
  {
    id: "rib-cage",
    en: "Ribs and sternum",
    ro: "Coaste și stern",
    latin: "Costae et sternum",
    region: "thorax",
    sourceNames: [
      "sternum",
      ...sides.flatMap((side) => ordinals.map((n) => `${side} ${n} rib`)),
    ],
  },
  {
    id: "pelvic-girdle",
    en: "Hip bones",
    ro: "Oase coxale",
    latin: "Ossa coxae",
    region: "pelvis",
    sourceNames: paired("hip bone"),
  },
  {
    id: "sacrum",
    en: "Sacrum",
    ro: "Sacru",
    latin: "Os sacrum",
    region: "pelvis",
    sourceNames: ["sacrum"],
  },
  ...sides.flatMap((side) => {
    const roSide = side === "left" ? "stâng" : "drept";
    const latinSide = side === "left" ? "sinister" : "dexter";
    const roFeminine = side === "left" ? "stângă" : "dreaptă";
    return [
      ...[
        ["clavicle", "Clavicle", "Claviculă", "Clavicula"],
        ["scapula", "Scapula", "Scapulă", "Scapula"],
        ["humerus", "Humerus", "Humerus", "Humerus"],
        ["radius", "Radius", "Radius", "Radius"],
        ["ulna", "Ulna", "Ulnă", "Ulna"],
      ].map(([bone, en, ro, latin]) => ({
        id: `${bone}-${side}`,
        en: `${side === "left" ? "Left" : "Right"} ${en.toLowerCase()}`,
        ro: `${ro} ${["Claviculă", "Scapulă", "Ulnă"].includes(ro) ? roFeminine : roSide}`,
        latin: `${latin} ${latin === "Clavicula" || latin === "Scapula" || latin === "Ulna" ? (side === "left" ? "sinistra" : "dextra") : latinSide}`,
        region: `upper-limb-${side}`,
        side,
        sourceNames: [`${side} ${bone}`],
      })),
      {
        id: `hand-bones-${side}`,
        en: `${side === "left" ? "Left" : "Right"} hand bones`,
        ro: `Oasele mâinii ${side === "left" ? "stângi" : "drepte"}`,
        latin: "Ossa manus",
        region: `upper-limb-${side}`,
        side,
        sourceNames: [
          ...[
            "scaphoid",
            "lunate",
            "triquetral",
            "pisiform",
            "trapezium",
            "trapezoid",
            "capitate",
            "hamate",
          ].map((bone) => `${side} ${bone}`),
          ...ordinals.slice(0, 5).map((n) => `${side} ${n} metacarpal bone`),
          ...["proximal", "middle", "distal"].flatMap((level) =>
            [
              "thumb",
              "index finger",
              "middle finger",
              "ring finger",
              "little finger",
            ]
              .filter((digit) => !(level === "middle" && digit === "thumb"))
              .map((digit) => `${level} phalanx of ${side} ${digit}`),
          ),
        ],
      },
      ...[
        ["femur", "Femur", "Femur", "Femur"],
        ["patella", "Patella", "Patelă", "Patella"],
        ["tibia", "Tibia", "Tibie", "Tibia"],
        ["fibula", "Fibula", "Fibulă", "Fibula"],
      ].map(([bone, en, ro, latin]) => ({
        id: `${bone}-${side}`,
        en: `${side === "left" ? "Left" : "Right"} ${en.toLowerCase()}`,
        ro: `${ro} ${bone === "femur" ? roSide : roFeminine}`,
        latin: `${latin} ${bone === "femur" ? (side === "left" ? "sinistrum" : "dextrum") : side === "left" ? "sinistra" : "dextra"}`,
        region: `lower-limb-${side}`,
        side,
        sourceNames: [`${side} ${bone}`],
      })),
      {
        id: `foot-bones-${side}`,
        en: `${side === "left" ? "Left" : "Right"} foot bones`,
        ro: `Oasele piciorului ${roSide}`,
        latin: "Ossa pedis",
        region: `lower-limb-${side}`,
        side,
        sourceNames: [
          ...[
            "talus",
            "calcaneus",
            "medial cuneiform bone",
            "intermediate cuneiform bone",
            "lateral cuneiform bone",
            "cuboid bone",
          ].map((bone) => `${side} ${bone}`),
          `navicular bone of ${side} foot`,
          ...ordinals.slice(0, 5).map((n) => `${side} ${n} metatarsal bone`),
          ...["proximal", "middle", "distal"].flatMap((level) =>
            ["big toe", "second toe", "third toe", "fourth toe", "little toe"]
              .filter((digit) => !(level === "middle" && digit === "big toe"))
              .map((digit) => `${level} phalanx of ${side} ${digit}`),
          ),
        ],
      },
    ];
  }),
];
