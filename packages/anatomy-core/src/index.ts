export type Locale = "ro" | "en";
export type Laterality = "left" | "right" | "midline" | "bilateral" | "none";
export type Availability = "available" | "planned" | "unavailable";
export type ReviewStatus = "unreviewed" | "reviewed";

export interface LocalizedText {
  readonly en: string;
  readonly ro: string;
}

export interface Provenance {
  readonly sourceTitle: string;
  readonly sourceUrl: string;
  readonly license: string;
  readonly reviewStatus: ReviewStatus;
  readonly reviewedBy?: string;
  readonly lastValidatedAt?: string;
}

export interface AnatomicalStructure {
  readonly id: string;
  readonly names: LocalizedText;
  readonly latinName?: string;
  readonly synonyms?: Partial<Record<Locale, readonly string[]>>;
  readonly systemIds: readonly string[];
  readonly structureType: string;
  readonly regionIds: readonly string[];
  readonly parentId?: string;
  readonly childIds?: readonly string[];
  readonly groupIds?: readonly string[];
  readonly laterality: Laterality;
  readonly assetIds: readonly string[];
  readonly status: Availability;
  readonly description?: LocalizedText;
  readonly provenance: readonly Provenance[];
}

export interface AnatomySystem {
  readonly id: string;
  readonly names: LocalizedText;
  readonly color: string;
  readonly available: boolean;
  readonly primary: boolean;
}

export interface AnatomyRegion {
  readonly id: string;
  readonly names: LocalizedText;
  readonly parentId?: string;
  readonly status: Availability;
}

export interface AnatomyGroup {
  readonly id: string;
  readonly names: LocalizedText;
  readonly memberIds: readonly string[];
  readonly description?: LocalizedText;
}

export interface VisibilityOverrides {
  readonly hiddenIds: ReadonlySet<string>;
  readonly isolatedIds: ReadonlySet<string>;
}

export const EMPTY_OVERRIDES: VisibilityOverrides = {
  hiddenIds: new Set<string>(),
  isolatedIds: new Set<string>(),
};

export function resolveVisibleStructureIds(
  structures: readonly AnatomicalStructure[],
  activeSystemIds: ReadonlySet<string>,
  overrides: VisibilityOverrides = EMPTY_OVERRIDES,
): ReadonlySet<string> {
  const visible = new Set<string>();
  for (const structure of structures) {
    if (structure.status !== "available" || structure.assetIds.length === 0)
      continue;
    if (overrides.hiddenIds.has(structure.id)) continue;
    if (
      overrides.isolatedIds.size > 0 &&
      !overrides.isolatedIds.has(structure.id)
    )
      continue;
    if (structure.systemIds.some((systemId) => activeSystemIds.has(systemId)))
      visible.add(structure.id);
  }
  return visible;
}

export function isAllSelected(
  availableSystemIds: readonly string[],
  activeSystemIds: ReadonlySet<string>,
): boolean {
  return (
    availableSystemIds.length > 0 &&
    availableSystemIds.every((id) => activeSystemIds.has(id))
  );
}

export function toggleAllSystems(
  availableSystemIds: readonly string[],
  activeSystemIds: ReadonlySet<string>,
): ReadonlySet<string> {
  return isAllSelected(availableSystemIds, activeSystemIds)
    ? new Set<string>()
    : new Set(availableSystemIds);
}

export function resolveGroupMembers(
  group: AnatomyGroup,
  structures: readonly AnatomicalStructure[],
): readonly AnatomicalStructure[] {
  const byId = new Map(
    structures.map((structure) => [structure.id, structure]),
  );
  return group.memberIds.flatMap((id) => {
    const match = byId.get(id);
    return match ? [match] : [];
  });
}

export function validateHierarchy(
  structures: readonly AnatomicalStructure[],
): readonly string[] {
  const errors: string[] = [];
  const byId = new Map(structures.map((item) => [item.id, item]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (id: string): void => {
    if (visiting.has(id)) {
      errors.push(`Cycle detected at ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    const item = byId.get(id);
    if (item?.parentId) {
      if (!byId.has(item.parentId))
        errors.push(`Missing parent ${item.parentId} for ${id}`);
      else visit(item.parentId);
    }
    visiting.delete(id);
    visited.add(id);
  };

  for (const item of structures) visit(item.id);
  return errors;
}

export function getLocalizedName(
  item: { readonly names: LocalizedText },
  locale: Locale,
): string {
  return item.names[locale] || item.names.en;
}
