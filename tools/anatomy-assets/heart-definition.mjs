// Reviewed source identities, not an assertion of complete cardiac anatomy.
// FMA numbers below are publisher IDs, not fabricated Terminologia codes.
export const heartDefinitions = [];
function add(fma, en, ro, latin, category, group, options = {}) {
  heartDefinitions.push({
    id: `cardiac-${fma.toLowerCase()}`,
    terminologyId: fma,
    names: { en, ro },
    latinName: latin,
    category,
    group,
    ...options,
  });
}
add(
  "FMA9457",
  "Wall of right atrium",
  "Peretele atriului drept",
  "Paries atrii dextri",
  "wall",
  "walls",
);
add(
  "FMA9531",
  "Wall of left atrium",
  "Peretele atriului stâng",
  "Paries atrii sinistri",
  "wall",
  "walls",
);
add(
  "FMA86212",
  "Unsegmented region of heart wall (source subset)",
  "Regiune nesegmentată a peretelui inimii (subset din sursă)",
  "Regio parietis cordis",
  "wall",
  "walls",
  { onlyFiles: ["FJ2428"] },
);
for (const [fma, en, ro, latin] of [
  [
    "FMA11359",
    "Cavity of right atrium",
    "Cavitatea atriului drept",
    "Cavitas atrii dextri",
  ],
  [
    "FMA9465",
    "Cavity of left atrium",
    "Cavitatea atriului stâng",
    "Cavitas atrii sinistri",
  ],
  [
    "FMA9291",
    "Cavity of right ventricle",
    "Cavitatea ventriculului drept",
    "Cavitas ventriculi dextri",
  ],
  [
    "FMA9466",
    "Cavity of left ventricle",
    "Cavitatea ventriculului stâng",
    "Cavitas ventriculi sinistri",
  ],
])
  add(fma, en, ro, latin, "cavity", "cavities");
for (const [fma, en, ro, latin, valve] of [
  [
    "FMA7238",
    "Anterior leaflet of tricuspid valve",
    "Foița anterioară a valvei tricuspide",
    "Cuspis anterior valvae tricuspidalis",
    "tricuspid",
  ],
  [
    "FMA7239",
    "Posterior leaflet of tricuspid valve",
    "Foița posterioară a valvei tricuspide",
    "Cuspis posterior valvae tricuspidalis",
    "tricuspid",
  ],
  [
    "FMA7240",
    "Septal leaflet of tricuspid valve",
    "Foița septală a valvei tricuspide",
    "Cuspis septalis valvae tricuspidalis",
    "tricuspid",
  ],
  [
    "FMA7242",
    "Anterior leaflet of mitral valve",
    "Foița anterioară a valvei mitrale",
    "Cuspis anterior valvae mitralis",
    "mitral",
  ],
  [
    "FMA7243",
    "Posterior leaflet of mitral valve",
    "Foița posterioară a valvei mitrale",
    "Cuspis posterior valvae mitralis",
    "mitral",
  ],
  [
    "FMA7247",
    "Left anterior cusp of pulmonary valve (source term)",
    "Cuspa anterioară stângă a valvei pulmonare (termen din sursă)",
    "Cuspis anterior sinistra valvae pulmonalis",
    "pulmonary",
  ],
  [
    "FMA7249",
    "Right anterior cusp of pulmonary valve (source term)",
    "Cuspa anterioară dreaptă a valvei pulmonare (termen din sursă)",
    "Cuspis anterior dextra valvae pulmonalis",
    "pulmonary",
  ],
  [
    "FMA7250",
    "Posterior cusp of pulmonary valve (source term)",
    "Cuspa posterioară a valvei pulmonare (termen din sursă)",
    "Cuspis posterior valvae pulmonalis",
    "pulmonary",
  ],
  [
    "FMA7252",
    "Right posterior cusp of aortic valve (source term)",
    "Cuspa posterioară dreaptă a valvei aortice (termen din sursă)",
    "Cuspis posterior dextra valvae aortae",
    "aortic",
  ],
  [
    "FMA7253",
    "Anterior cusp of aortic valve (source term)",
    "Cuspa anterioară a valvei aortice (termen din sursă)",
    "Cuspis anterior valvae aortae",
    "aortic",
  ],
  [
    "FMA7254",
    "Left posterior cusp of aortic valve (source term)",
    "Cuspa posterioară stângă a valvei aortice (termen din sursă)",
    "Cuspis posterior sinistra valvae aortae",
    "aortic",
  ],
])
  add(fma, en, ro, latin, "valve", "valves", { valve });
for (const [fma, en, ro, latin] of [
  [
    "FMA7260",
    "Anterior papillary muscle of right ventricle",
    "Mușchiul papilar anterior al ventriculului drept",
    "Musculus papillaris anterior ventriculi dextri",
  ],
  [
    "FMA7261",
    "Posterior papillary muscle of right ventricle",
    "Mușchiul papilar posterior al ventriculului drept",
    "Musculus papillaris posterior ventriculi dextri",
  ],
  [
    "FMA7262",
    "Septal papillary muscle of right ventricle",
    "Mușchiul papilar septal al ventriculului drept",
    "Musculus papillaris septalis ventriculi dextri",
  ],
  [
    "FMA7264",
    "Lateral papillary muscle of left ventricle (source remainder)",
    "Mușchiul papilar lateral al ventriculului stâng (restul din sursă)",
    "Musculus papillaris lateralis ventriculi sinistri",
  ],
  [
    "FMA7265",
    "Anterolateral head of lateral papillary muscle of left ventricle",
    "Capul anterolateral al mușchiului papilar lateral al ventriculului stâng",
    "Caput anterolaterale musculi papillaris lateralis ventriculi sinistri",
  ],
])
  add(fma, en, ro, latin, "papillary", "papillary");
for (const [fma, en, ro, latin] of [
  [
    "FMA3802",
    "Trunk of right coronary artery",
    "Trunchiul arterei coronare drepte",
    "Truncus arteriae coronariae dextrae",
  ],
  [
    "FMA3855",
    "Trunk of left coronary artery",
    "Trunchiul arterei coronare stângi",
    "Truncus arteriae coronariae sinistrae",
  ],
  [
    "FMA74912",
    "Trunk of anterior interventricular branch of left coronary artery",
    "Trunchiul ramurii interventriculare anterioare a coronarei stângi",
    "Ramus interventricularis anterior arteriae coronariae sinistrae",
  ],
  [
    "FMA3895",
    "Circumflex branch of left coronary artery",
    "Ramura circumflexă a arterei coronare stângi",
    "Ramus circumflexus arteriae coronariae sinistrae",
  ],
  [
    "FMA3840",
    "Posterior interventricular branch of right coronary artery (source variant)",
    "Ramura interventriculară posterioară a coronarei drepte (varianta sursei)",
    "Ramus interventricularis posterior arteriae coronariae dextrae",
  ],
])
  add(fma, en, ro, latin, "artery", "coronary-arteries");
add(
  "FMA3736",
  "Ascending aorta",
  "Aorta ascendentă",
  "Aorta ascendens",
  "artery",
  "great-arteries",
);
add(
  "FMA8612",
  "Pulmonary trunk",
  "Trunchi pulmonar",
  "Truncus pulmonalis",
  "artery",
  "great-arteries",
);
// Unavailable targets deliberately have no terminology code or mesh mapping.
export const heartMissing = [
  ["endocardium", "Endocardium", "Endocard", "Endocardium"],
  ["epicardium", "Epicardium", "Epicard", "Epicardium"],
  ["pericardium", "Pericardium", "Pericard", "Pericardium"],
  [
    "interatrial-septum",
    "Interatrial septum",
    "Sept interatrial",
    "Septum interatriale",
  ],
  [
    "interventricular-septum",
    "Interventricular septum",
    "Sept interventricular",
    "Septum interventriculare",
  ],
  ["chordae", "Chordae tendineae", "Cordaje tendinoase", "Chordae tendineae"],
  [
    "moderator-band",
    "Moderator band",
    "Trabeculă septomarginală",
    "Trabecula septomarginalis",
  ],
  [
    "coronary-sinus-ostium",
    "Coronary sinus ostium and valve",
    "Ostiul și valvula sinusului coronar",
    "Ostium sinus coronarii",
  ],
  [
    "smallest-cardiac-veins",
    "Smallest cardiac veins",
    "Vene cardiace minime",
    "Venae cordis minimae",
  ],
  [
    "sinoatrial-node",
    "Sinoatrial node",
    "Nod sinoatrial",
    "Nodus sinuatrialis",
  ],
  [
    "atrioventricular-node",
    "Atrioventricular node",
    "Nod atrioventricular",
    "Nodus atrioventricularis",
  ],
  [
    "av-bundle",
    "Atrioventricular bundle",
    "Fascicul atrioventricular",
    "Fasciculus atrioventricularis",
  ],
  [
    "bundle-branches",
    "Right and left bundle branches",
    "Ramurile dreaptă și stângă ale fasciculului",
    "Crura fasciculi atrioventricularis",
  ],
  ["purkinje", "Purkinje network", "Rețeaua Purkinje", "Rami subendocardiales"],
].map(([key, en, ro, latinName]) => ({
  id: `cardiac-missing-${key}`,
  names: { en, ro },
  latinName,
}));
