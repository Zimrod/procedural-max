import fs from 'fs';
import path from 'path';
import { WIDGET_TAXONOMY, WidgetCategory, WidgetType } from '../taxonomy/widgetTaxonomy';
import { widgetRegistry } from '../widgetRegistry';

const WIDGET_PROPS_FILE = path.resolve(
  process.cwd(),
  'src',
  'remotion',
  'MyComp',
  'widget-props.txt'
);

let cachedWidgetPropSchemas: string | null = null;

const getSupportedTypesSet = () => new Set(Object.keys(widgetRegistry) as WidgetType[]);

export const getAllSupportedWidgetTypes = (): WidgetType[] =>
  Object.keys(widgetRegistry) as WidgetType[];

export const getWidgetTypesByCategory = (): Record<WidgetCategory, WidgetType[]> => {
  const supported = getSupportedTypesSet();

  return Object.fromEntries(
    Object.entries(WIDGET_TAXONOMY).map(([category, config]) => [
      category,
      Object.keys(config.types).filter((type): type is WidgetType => supported.has(type as WidgetType)),
    ])
  ) as Record<WidgetCategory, WidgetType[]>;
};

export const getTaxonomyPromptDescription = (): string =>
  Object.entries(getWidgetTypesByCategory())
    .map(([category, types]) => `${category}:\n${types.map((type) => `- ${type}`).join('\n')}`)
    .join('\n\n');

export const getWidgetPropSchemas = (): string => {
  if (cachedWidgetPropSchemas !== null) {
    return cachedWidgetPropSchemas;
  }

  try {
    cachedWidgetPropSchemas = fs.readFileSync(WIDGET_PROPS_FILE, 'utf8');
  } catch {
    cachedWidgetPropSchemas = '';
  }

  return cachedWidgetPropSchemas;
};
