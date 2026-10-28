import {
  REGIONS,
  ANATOMY_CATALOG as STRUCTURES,
  SYSTEMS,
  GROUPS,
  SKULL_VISUALIZATION_MODES,
} from "@anatomy/data";
import { resources } from "../../apps/web/src/localization/i18n";

const errors: string[] = [];
for (const item of [
  ...STRUCTURES,
  ...REGIONS,
  ...SYSTEMS,
  ...GROUPS,
  ...SKULL_VISUALIZATION_MODES,
]) {
  if (!item.names.en.trim()) errors.push(`Missing English name: ${item.id}`);
  if (!item.names.ro.trim()) errors.push(`Missing Romanian name: ${item.id}`);
}
for (const mode of SKULL_VISUALIZATION_MODES) {
  if (!mode.description.en.trim() || !mode.description.ro.trim())
    errors.push("Missing mode description: " + mode.id);
}
const roKeys = Object.keys(resources.ro.translation);
const enKeys = Object.keys(resources.en.translation);
for (const key of roKeys)
  if (!enKeys.includes(key)) errors.push(`Missing English UI key: ${key}`);
for (const key of enKeys)
  if (!roKeys.includes(key)) errors.push(`Missing Romanian UI key: ${key}`);
if (errors.length)
  throw new Error(`Translation validation failed:\n${errors.join("\n")}`);
process.stdout.write(
  `Validated RO/EN names for ${STRUCTURES.length + REGIONS.length + SYSTEMS.length} catalog entries.\n`,
);
