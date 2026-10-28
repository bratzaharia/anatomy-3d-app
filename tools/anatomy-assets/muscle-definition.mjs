// Inventory v1.0.0. Names/classification cross-checked against FIPAT TA2,
// chapter IV, and the source FMA concepts. RO terminology is editorial and
// requires independent medical review. Entries persist when geometry is absent.
export const inventoryVersion = "1.0.0";
export const terminologyUrl =
  "https://cdn.dal.ca/content/dam/dalhousie/pdf/library/FIPAT/TA2/FIPAT-TA2-Part-2.pdf";
// Group -> [region, English name, Romanian name, contextual depth].
export const muscleGroups = {
  facial: ["head", "Facial expression", "Mimică", "superficial"],
  mastication: ["head", "Mastication", "Masticație", "mixed"],
  ocular: ["head", "Extraocular muscles", "Mușchi extraoculari", "deep"],
  tongue: ["head", "Tongue and palate", "Limbă și palat", "deep"],
  headOther: [
    "head",
    "Middle ear and intrinsic auricular muscles",
    "Ureche medie și mușchi auriculari intrinseci",
    "deep",
  ],
  neck: ["neck", "Superficial neck", "Gât — plan superficial", "superficial"],
  hyoid: [
    "neck",
    "Suprahyoid and infrahyoid",
    "Suprahioidieni și infrahioidieni",
    "mixed",
  ],
  prevertebral: [
    "neck",
    "Prevertebral and scalene",
    "Prevertebrali și scaleni",
    "deep",
  ],
  larynx: ["neck", "Larynx and pharynx", "Laringe și faringe", "deep"],
  pectoral: [
    "thorax",
    "Pectoral and chest wall",
    "Pectorali și perete toracic",
    "mixed",
  ],
  intercostal: [
    "thorax",
    "Intercostal muscles and diaphragm",
    "Intercostali și diafragmă",
    "deep",
  ],
  backSuperficial: [
    "back",
    "Extrinsic back",
    "Spate — mușchi extrinseci",
    "superficial",
  ],
  backIntermediate: [
    "back",
    "Intermediate extrinsic back",
    "Spate — plan intermediar extrinsec",
    "intermediate",
  ],
  backDeep: ["back", "Intrinsic back", "Spate — mușchi intrinseci", "deep"],
  suboccipital: [
    "back",
    "Suboccipital muscles",
    "Mușchi suboccipitali",
    "deep",
  ],
  abdominal: ["abdomen", "Abdominal wall", "Perete abdominal", "mixed"],
  pelvicFloor: [
    "pelvis",
    "Pelvic floor and perineum",
    "Planșeu pelvin și perineu",
    "deep",
  ],
  gluteal: [
    "pelvis",
    "Gluteal and deep hip rotators",
    "Fesieri și rotatori profunzi ai șoldului",
    "mixed",
  ],
  shoulder: ["upper-limb", "Shoulder", "Umăr", "mixed"],
  cuff: [
    "upper-limb",
    "Shoulder — rotator cuff",
    "Umăr — coafa rotatorilor",
    "deep",
  ],
  armAnterior: [
    "upper-limb",
    "Arm — anterior compartment",
    "Braț — compartiment anterior",
    "mixed",
  ],
  armPosterior: [
    "upper-limb",
    "Arm — posterior compartment",
    "Braț — compartiment posterior",
    "mixed",
  ],
  forearmAnterior: [
    "upper-limb",
    "Forearm — superficial anterior",
    "Antebraț — anterior superficial",
    "superficial",
  ],
  forearmDeep: [
    "upper-limb",
    "Forearm — deep anterior",
    "Antebraț — anterior profund",
    "deep",
  ],
  forearmPosterior: [
    "upper-limb",
    "Forearm — superficial posterior",
    "Antebraț — posterior superficial",
    "superficial",
  ],
  forearmPosteriorDeep: [
    "upper-limb",
    "Forearm — deep posterior",
    "Antebraț — posterior profund",
    "deep",
  ],
  thenar: [
    "upper-limb",
    "Hand — thenar and adductor",
    "Mână — tenari și adductor",
    "mixed",
  ],
  hypothenar: ["upper-limb", "Hand — hypothenar", "Mână — hipotenari", "mixed"],
  handDeep: [
    "upper-limb",
    "Hand — lumbricals and interossei",
    "Mână — lombricali și interosoși",
    "deep",
  ],
  thighAnterior: [
    "lower-limb",
    "Thigh — anterior compartment",
    "Coapsă — compartiment anterior",
    "mixed",
  ],
  thighMedial: [
    "lower-limb",
    "Thigh — medial compartment",
    "Coapsă — compartiment medial",
    "mixed",
  ],
  thighPosterior: [
    "lower-limb",
    "Thigh — posterior compartment",
    "Coapsă — compartiment posterior",
    "mixed",
  ],
  legAnterior: [
    "lower-limb",
    "Leg — anterior compartment",
    "Gambă — compartiment anterior",
    "mixed",
  ],
  legLateral: [
    "lower-limb",
    "Leg — lateral compartment",
    "Gambă — compartiment lateral",
    "mixed",
  ],
  legPosterior: [
    "lower-limb",
    "Leg — superficial posterior",
    "Gambă — posterior superficial",
    "superficial",
  ],
  legDeep: [
    "lower-limb",
    "Leg — deep posterior",
    "Gambă — posterior profund",
    "deep",
  ],
  foot: [
    "lower-limb",
    "Foot — intrinsic muscles",
    "Picior — mușchi intrinseci",
    "mixed",
  ],
};
// name | Romanian stem | group. Latin uses the standard anatomical stem,
// supplied explicitly where the source English name is not Latin.
const inventory = `
frontalis|frontal|facial
occipitalis|occipital|facial
temporoparietalis|temporoparietal|facial
procerus|procerus|facial
nasalis|nazal|facial
depressor septi nasi|coborâtor al septului nazal|facial
orbicularis oculi|orbicular al ochiului|facial
corrugator supercilii|corugator al sprâncenei|facial
depressor supercilii|coborâtor al sprâncenei|facial
orbicularis oris|orbicular al gurii|facial
depressor anguli oris|coborâtor al unghiului gurii|facial
risorius|rizorius|facial
zygomaticus major|zigomatic mare|facial
zygomaticus minor|zigomatic mic|facial
levator labii superioris|ridicător al buzei superioare|facial
levator labii superioris alaeque nasi|ridicător al buzei superioare și aripii nasului|facial
depressor labii inferioris|coborâtor al buzei inferioare|facial
levator anguli oris|ridicător al unghiului gurii|facial
buccinator|buccinator|facial
mentalis|mentonier|facial
auricularis anterior|auricular anterior|facial
auricularis superior|auricular superior|facial
auricularis posterior|auricular posterior|facial
masseter|maseter|mastication
temporalis|temporal|mastication
pterygoideus medialis|pterigoidian medial|mastication
pterygoideus lateralis|pterigoidian lateral|mastication
superior rectus|drept superior al ochiului|ocular|Rectus superior
inferior rectus|drept inferior al ochiului|ocular|Rectus inferior
medial rectus|drept medial al ochiului|ocular|Rectus medialis
lateral rectus|drept lateral al ochiului|ocular|Rectus lateralis
superior oblique|oblic superior al ochiului|ocular|Obliquus superior
inferior oblique|oblic inferior al ochiului|ocular|Obliquus inferior
levator palpebrae superioris|ridicător al pleoapei superioare|ocular
genioglossus|genioglos|tongue
hyoglossus|hioglos|tongue
styloglossus|stiloglos|tongue
palatoglossus|palatoglos|tongue
superior longitudinal muscle of tongue|longitudinal superior al limbii|tongue|Longitudinalis superior linguae
inferior longitudinal muscle of tongue|longitudinal inferior al limbii|tongue|Longitudinalis inferior linguae
transverse muscle of tongue|transvers al limbii|tongue|Transversus linguae
vertical muscle of tongue|vertical al limbii|tongue|Verticalis linguae
levator veli palatini|ridicător al vălului palatin|tongue
tensor veli palatini|tensor al vălului palatin|tongue
uvular muscle|al uvulei|tongue|Musculus uvulae
platysma|platysma|neck
sternocleidomastoid|sternocleidomastoidian|neck|Sternocleidomastoideus
digastric|digastric|hyoid|Digastricus
stylohyoid|stilohioidian|hyoid|Stylohyoideus
mylohyoid|milohioidian|hyoid|Mylohyoideus
geniohyoid|geniohioidian|hyoid|Geniohyoideus
sternohyoid|sternohioidian|hyoid|Sternohyoideus
omohyoid|omohioidian|hyoid|Omohyoideus
sternothyroid|sternotiroidian|hyoid|Sternothyroideus
thyrohyoid|tirohioidian|hyoid|Thyrohyoideus
scalenus anterior|scalen anterior|prevertebral
scalenus medius|scalen mijlociu|prevertebral
scalenus posterior|scalen posterior|prevertebral
longus capitis|lung al capului|prevertebral
longus colli|lung al gâtului|prevertebral
rectus capitis anterior|drept anterior al capului|prevertebral
rectus capitis lateralis|drept lateral al capului|prevertebral
posterior crico-arytenoid|cricoaritenoidian posterior|larynx|Cricoarytenoideus posterior
lateral crico-arytenoid|cricoaritenoidian lateral|larynx|Cricoarytenoideus lateralis
oblique arytenoid|aritenoidian oblic|larynx|Arytenoideus obliquus
aryepiglotticus|aritenoepiglotic|larynx
thyro-arytenoid|tiroaritenoidian|larynx|Thyroarytenoideus
vocalis|vocal|larynx
cricothyroid|cricotiroidian|larynx|Cricothyroideus
superior pharyngeal constrictor|constrictor superior al faringelui|larynx|Constrictor pharyngis superior
middle pharyngeal constrictor|constrictor mijlociu al faringelui|larynx|Constrictor pharyngis medius
inferior pharyngeal constrictor|constrictor inferior al faringelui|larynx|Constrictor pharyngis inferior
stylopharyngeus|stilofaringian|larynx
salpingopharyngeus|salpingofaringian|larynx
palatopharyngeus|palatofaringian|larynx
pectoralis major|pectoral mare|pectoral
pectoralis minor|pectoral mic|pectoral
subclavius|subclavicular|pectoral
serratus anterior|dințat anterior|pectoral
transversus thoracis|transvers al toracelui|intercostal
trapezius|trapez|backSuperficial
latissimus dorsi|mare dorsal|backSuperficial
levator scapulae|ridicător al scapulei|backSuperficial
rhomboid major|romboid mare|backSuperficial|Rhomboideus major
rhomboid minor|romboid mic|backSuperficial|Rhomboideus minor
serratus posterior superior|dințat posterior superior|backIntermediate
serratus posterior inferior|dințat posterior inferior|backIntermediate
splenius capitis|splenius al capului|backDeep
splenius cervicis|splenius al gâtului|backDeep
iliocostalis lumborum|iliocostal lombar|backDeep
iliocostalis thoracis|iliocostal toracic|backDeep
iliocostalis cervicis|iliocostal cervical|backDeep
longissimus thoracis|longissimus toracic|backDeep
longissimus cervicis|longissimus cervical|backDeep
longissimus capitis|longissimus al capului|backDeep
spinalis thoracis|spinal toracic|backDeep
spinalis cervicis|spinal cervical|backDeep
spinalis capitis|spinal al capului|backDeep
semispinalis thoracis|semispinal toracic|backDeep
semispinalis cervicis|semispinal cervical|backDeep
semispinalis capitis|semispinal al capului|backDeep
multifidus lumborum|multifid lombar|backDeep
multifidus thoracis|multifid toracic|backDeep
multifidus cervicis|multifid cervical|backDeep
rectus capitis posterior major|drept posterior mare al capului|suboccipital
rectus capitis posterior minor|drept posterior mic al capului|suboccipital
obliquus capitis superior|oblic superior al capului|suboccipital
obliquus capitis inferior|oblic inferior al capului|suboccipital
rectus abdominis|drept abdominal|abdominal
external oblique|oblic extern al abdomenului|abdominal|Obliquus externus abdominis
internal oblique|oblic intern al abdomenului|abdominal|Obliquus internus abdominis
transversus abdominis|transvers abdominal|abdominal
pyramidalis|piramidal|abdominal
quadratus lumborum|pătrat lombar|abdominal
psoas major|psoas mare|abdominal
psoas minor|psoas mic|abdominal
iliacus|iliac|gluteal
gluteus maximus|fesier mare|gluteal
gluteus medius|fesier mijlociu|gluteal
gluteus minimus|fesier mic|gluteal
piriformis|piriform|gluteal
obturator internus|obturator intern|gluteal
obturator externus|obturator extern|gluteal
gemellus superior|gemen superior|gluteal
gemellus inferior|gemen inferior|gluteal
quadratus femoris|pătrat femural|gluteal
pubococcygeus|pubococcigian|pelvicFloor
puborectalis|puborectal|pelvicFloor
iliococcygeus|iliococcigian|pelvicFloor
coccygeus|coccigian|pelvicFloor
ischiocavernosus|ischiocavernos|pelvicFloor
bulbospongiosus|bulbospongios|pelvicFloor
superficial transverse perineal|transvers superficial al perineului|pelvicFloor|Transversus perinei superficialis
deep transverse perineal|transvers profund al perineului|pelvicFloor|Transversus perinei profundus
external urethral sphincter|sfincter extern al uretrei|pelvicFloor|Sphincter urethrae externus
deltoid|deltoid|shoulder|Deltoideus
teres major|rotund mare|shoulder
supraspinatus|supraspinos|cuff
infraspinatus|infraspinos|cuff
teres minor|rotund mic|cuff
subscapularis|subscapular|cuff
biceps brachii|biceps brahial|armAnterior
coracobrachialis|coracobrahial|armAnterior
brachialis|brahial|armAnterior
triceps brachii|triceps brahial|armPosterior
anconeus|anconeu|armPosterior
pronator teres|rotund pronator|forearmAnterior
flexor carpi radialis|flexor radial al carpului|forearmAnterior
palmaris longus|palmar lung|forearmAnterior
flexor carpi ulnaris|flexor ulnar al carpului|forearmAnterior
flexor digitorum superficialis|flexor superficial al degetelor|forearmAnterior
flexor digitorum profundus|flexor profund al degetelor|forearmDeep
flexor pollicis longus|flexor lung al policelui|forearmDeep
pronator quadratus|pătrat pronator|forearmDeep
brachioradialis|brahioradial|forearmPosterior
extensor carpi radialis longus|extensor radial lung al carpului|forearmPosterior
extensor carpi radialis brevis|extensor radial scurt al carpului|forearmPosterior
extensor digitorum|extensor al degetelor|forearmPosterior
extensor digiti minimi|extensor al degetului mic|forearmPosterior
extensor carpi ulnaris|extensor ulnar al carpului|forearmPosterior
supinator|supinator|forearmPosteriorDeep
abductor pollicis longus|abductor lung al policelui|forearmPosteriorDeep
extensor pollicis brevis|extensor scurt al policelui|forearmPosteriorDeep
extensor pollicis longus|extensor lung al policelui|forearmPosteriorDeep
extensor indicis|extensor al indexului|forearmPosteriorDeep
abductor pollicis brevis|abductor scurt al policelui|thenar
flexor pollicis brevis|flexor scurt al policelui|thenar
opponens pollicis|opozant al policelui|thenar
adductor pollicis|adductor al policelui|thenar
abductor digiti minimi of hand|abductor al degetului mic al mâinii|hypothenar|Abductor digiti minimi manus
flexor digiti minimi brevis of hand|flexor scurt al degetului mic al mâinii|hypothenar|Flexor digiti minimi brevis manus
opponens digiti minimi of hand|opozant al degetului mic al mâinii|hypothenar|Opponens digiti minimi manus
palmaris brevis|palmar scurt|hypothenar
sartorius|croitor|thighAnterior
tensor fasciae latae|tensor al fasciei lata|thighAnterior
rectus femoris|drept femural|thighAnterior
vastus lateralis|vast lateral|thighAnterior
vastus medialis|vast medial|thighAnterior
vastus intermedius|vast intermediar|thighAnterior
articularis genus|articular al genunchiului|thighAnterior
pectineus|pectineu|thighMedial
adductor longus|adductor lung|thighMedial
adductor brevis|adductor scurt|thighMedial
adductor magnus|adductor mare|thighMedial
adductor minimus|adductor mic|thighMedial
gracilis|gracilis|thighMedial
biceps femoris|biceps femural|thighPosterior
semitendinosus|semitendinos|thighPosterior
semimembranosus|semimembranos|thighPosterior
tibialis anterior|tibial anterior|legAnterior
extensor hallucis longus|extensor lung al halucelui|legAnterior
extensor digitorum longus|extensor lung al degetelor piciorului|legAnterior
fibularis tertius|fibular al treilea|legAnterior
fibularis longus|fibular lung|legLateral
fibularis brevis|fibular scurt|legLateral
gastrocnemius|gastrocnemian|legPosterior
soleus|solear|legPosterior
plantaris|plantar|legPosterior
popliteus|popliteu|legDeep
flexor hallucis longus|flexor lung al halucelui|legDeep
flexor digitorum longus|flexor lung al degetelor piciorului|legDeep
tibialis posterior|tibial posterior|legDeep
extensor digitorum brevis|extensor scurt al degetelor piciorului|foot
extensor hallucis brevis|extensor scurt al halucelui|foot
abductor hallucis|abductor al halucelui|foot
flexor digitorum brevis|flexor scurt al degetelor piciorului|foot
abductor digiti minimi of foot|abductor al degetului mic al piciorului|foot|Abductor digiti minimi pedis
flexor accessorius|pătrat al plantei|foot|Quadratus plantae
flexor hallucis brevis|flexor scurt al halucelui|foot
adductor hallucis|adductor al halucelui|foot
flexor digiti minimi brevis of foot|flexor scurt al degetului mic al piciorului|foot|Flexor digiti minimi brevis pedis
opponens digiti minimi of foot|opozant al degetului mic al piciorului|foot|Opponens digiti minimi pedis
`;

export const muscleDefinitions = inventory
  .trim()
  .split("\n")
  .map((line) => {
    const [name, ro, group, latin] = line.split("|");
    return {
      name,
      ro: `Mușchiul ${ro}`,
      group,
      latin: latin ?? name[0].toUpperCase() + name.slice(1),
      sides: ["left", "right"],
    };
  });
for (const [name, ro, group] of [
  ["stapedius", "scăriței", "headOther"],
  ["tensor tympani", "tensor al timpanului", "headOther"],
  ["helicis major", "mare al helixului", "headOther"],
  ["helicis minor", "mic al helixului", "headOther"],
  ["tragicus", "tragusului", "headOther"],
  ["antitragicus", "antitragusului", "headOther"],
  ["transversus auriculae", "transvers al pavilionului urechii", "headOther"],
  ["obliquus auriculae", "oblic al pavilionului urechii", "headOther"],
  ["puboperinealis", "puboperineal", "pelvicFloor"],
  ["puboprostaticus", "puboprostatic — anatomie masculină", "pelvicFloor"],
  ["pubovaginalis", "pubovaginal — anatomie feminină", "pelvicFloor"],
  [
    "compressor urethrae",
    "compresor al uretrei — anatomie feminină",
    "pelvicFloor",
  ],
  [
    "sphincter urethrovaginalis",
    "sfincter uretrovaginal — anatomie feminină",
    "pelvicFloor",
  ],
  ["cremaster", "cremaster — anatomie masculină", "pelvicFloor"],
])
  muscleDefinitions.push({
    name,
    ro: `Mușchiul ${ro}`,
    group,
    latin: name[0].toUpperCase() + name.slice(1),
    sides: ["left", "right"],
  });
for (const item of muscleDefinitions)
  if (
    [
      "procerus",
      "orbicularis oris",
      "uvular muscle",
      "external urethral sphincter",
      "sphincter urethrovaginalis",
    ].includes(item.name)
  )
    item.sides = ["midline"];
// Explicit whole-muscle assembly from named source subdivisions; no geometric
// splitting, invented placements, or runtime interpretation of mesh names.
export const sourceAssemblies = {
  deltoid: [
    "clavicular part of $ deltoid",
    "acromial part of $ deltoid",
    "spinal part of $ deltoid",
  ],
  trapezius: [
    "ascending part of $ trapezius",
    "transverse part of $ trapezius",
    "descending part of $ trapezius",
  ],
  "pectoralis major": [
    "clavicular part of $ pectoralis major",
    "sternocostal part of $ pectoralis major",
    "abdominal part of $ pectoralis major",
  ],
  "biceps brachii": [
    "short head of $ biceps brachii",
    "long head of $ biceps brachii",
  ],
  "triceps brachii": [
    "long head of $ triceps brachii",
    "medial head of $ triceps brachii",
    "lateral head of $ triceps brachii",
  ],
  "biceps femoris": [
    "long head of $ biceps femoris",
    "short head of $ biceps femoris",
  ],
  gastrocnemius: [
    "medial head of $ gastrocnemius",
    "lateral head of $ gastrocnemius",
  ],
  "flexor hallucis brevis": [
    "medial head of $ flexor hallucis brevis",
    "lateral head of $ flexor hallucis brevis",
  ],
  "adductor hallucis": [
    "oblique head of $ adductor hallucis",
    "transverse head of $ adductor hallucis",
  ],
  "adductor pollicis": [
    "oblique head of $ adductor pollicis",
    "transverse head of $ adductor pollicis",
  ],
  "pronator teres": [
    "humeral head of $ pronator teres",
    "ulnar head of $ pronator teres",
  ],
  "flexor carpi ulnaris": [
    "humeral head of $ flexor carpi ulnaris",
    "ulnar head of $ flexor carpi ulnaris",
  ],
  "longus colli": [
    "superior oblique part of $ longus colli",
    "inferior oblique part of $ longus colli",
    "vertical intermediate part of $ longus colli",
  ],
  cricothyroid: [
    "straight part of $ cricothyroid",
    "oblique part of $ cricothyroid",
  ],
};
// Known source series must be identified honestly as sets, not individual muscles.
for (const [name, ro, group, latin] of [
  [
    "set of lumbricals of hand",
    "Lombricalii mâinii — grup",
    "handDeep",
    "Musculi lumbricales manus",
  ],
  [
    "set of dorsal interossei of hand",
    "Interosoșii dorsali ai mâinii — grup",
    "handDeep",
    "Musculi interossei dorsales manus",
  ],
  [
    "set of palmar interossei of hand",
    "Interosoșii palmari ai mâinii — grup",
    "handDeep",
    "Musculi interossei palmares manus",
  ],
  [
    "set of levatores costarum longi",
    "Ridicătorii lungi ai coastelor — grup",
    "backDeep",
    "Levatores costarum longi",
  ],
  [
    "set of levatores costarum breves",
    "Ridicătorii scurți ai coastelor — grup",
    "backDeep",
    "Levatores costarum breves",
  ],
  [
    "set of interspinales lumborum",
    "Interspinalii lombari — grup bilateral",
    "backDeep",
    "Interspinales lumborum",
  ],
  [
    "set of interspinales cervicis",
    "Interspinalii cervicali — grup bilateral",
    "backDeep",
    "Interspinales cervicis",
  ],
  [
    "set of anterior cervical intertransversarii",
    "Intertransversarii cervicali anteriori — grup bilateral",
    "backDeep",
    "Intertransversarii anteriores cervicis",
  ],
  [
    "set of posterior cervical intertransversarii",
    "Intertransversarii cervicali posteriori — grup bilateral",
    "backDeep",
    "Intertransversarii posteriores cervicis",
  ],
  [
    "external intercostal muscle",
    "Intercostalii externi — grup bilateral",
    "intercostal",
    "Intercostales externi",
  ],
  [
    "internal intercostal muscle",
    "Intercostalii interni — grup bilateral",
    "intercostal",
    "Intercostales interni",
  ],
  [
    "innermost intercostal muscle",
    "Intercostalii intimi — grup bilateral",
    "intercostal",
    "Intercostales intimi",
  ],
  [
    "interspinalis thoracis",
    "Interspinalii toracici — grup",
    "backDeep",
    "Interspinales thoracis",
  ],
  [
    "cervical rotator",
    "Rotatorii cervicali — grup",
    "backDeep",
    "Rotatores cervicis",
  ],
  [
    "thoracic rotator",
    "Rotatorii toracici — grup bilateral",
    "backDeep",
    "Rotatores thoracis",
  ],
  [
    "lumbar rotator",
    "Rotatorii lombari — grup",
    "backDeep",
    "Rotatores lumborum",
  ],
  [
    "lateral lumbar intertransversarius",
    "Intertransversarii lombari laterali — grup bilateral",
    "backDeep",
    "Intertransversarii laterales lumborum",
  ],
  [
    "medial lumbar intertransversarius",
    "Intertransversarii lombari mediali — grup bilateral",
    "backDeep",
    "Intertransversarii mediales lumborum",
  ],
])
  muscleDefinitions.push({
    name,
    ro,
    latin,
    group,
    grouped: true,
    sides: /bilateral/.test(ro) ? ["bilateral"] : ["left", "right"],
  });

muscleDefinitions.push(
  {
    name: "diaphragm",
    ro: "Diafragmă",
    latin: "Diaphragma",
    group: "intercostal",
    sides: ["midline"],
  },
  {
    name: "transverse arytenoid",
    ro: "Mușchiul aritenoidian transvers",
    latin: "Arytenoideus transversus",
    group: "larynx",
    sides: ["midline"],
  },
  {
    name: "external anal sphincter",
    ro: "Sfincterul anal extern",
    latin: "Sphincter ani externus",
    group: "pelvicFloor",
    sides: ["midline"],
  },
);
// Versioned individual inventory for grouped/missing intrinsic geometry.
for (const [place, group] of [
  ["hand", "handDeep"],
  ["foot", "foot"],
]) {
  for (const [kind, number, latin, ro] of [
    ["lumbrical", 4, "Lumbricalis", "lombrical"],
    ["dorsal interosseous", 4, "Interosseus dorsalis", "interosos dorsal"],
    [
      place === "hand" ? "palmar interosseous" : "plantar interosseous",
      3,
      place === "hand" ? "Interosseus palmaris" : "Interosseus plantaris",
      place === "hand" ? "interosos palmar" : "interosos plantar",
    ],
  ])
    for (let i = 1; i <= number; i++)
      muscleDefinitions.push({
        name: `${["first", "second", "third", "fourth"][i - 1]} ${kind} of ${place}`,
        ro: `Mușchiul ${ro} ${i} al ${place === "hand" ? "mâinii" : "piciorului"}`,
        latin: `${latin} ${i} ${place === "hand" ? "manus" : "pedis"}`,
        group,
        sides: ["left", "right"],
        groupedIn:
          place === "hand"
            ? `set of ${kind === "lumbrical" ? "lumbricals" : kind.startsWith("dorsal") ? "dorsal interossei" : "palmar interossei"} of hand`
            : undefined,
      });
}
export const muscleId = (name, side) =>
  `muscle-${name.replace(/[^a-z0-9]+/g, "-")}-${side}`;
