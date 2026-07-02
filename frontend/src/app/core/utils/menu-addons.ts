import {
  MENU_ADDON_GROUPS,
  MenuAddonGroup,
  deserializeAddonSelections,
  formatAddonLabels
} from '../constants/menu-addons';

export function addonLabelsForLine(
  addonTokens: string[] | undefined,
  lang: 'de' | 'en'
): string[] {
  if (!addonTokens?.length) {
    return [];
  }
  const selected = deserializeAddonSelections(addonTokens);
  const groups: MenuAddonGroup[] = [];
  for (const groupId of Object.keys(selected)) {
    const group = MENU_ADDON_GROUPS[groupId];
    if (group) {
      groups.push(group);
    }
  }
  return formatAddonLabels(groups, selected, lang);
}
