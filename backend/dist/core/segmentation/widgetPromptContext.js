import fs from 'fs';
import path from 'path';
import { WIDGET_TAXONOMY } from '../taxonomy/widgetTaxonomy.js';
import { widgetRegistry } from '../widgetRegistry.js';
const WIDGET_PROPS_FILE = path.resolve(process.cwd(), 'src', 'remotion', 'MyComp', 'widget-props.txt');
let cachedWidgetPropSchemas = null;
const getSupportedTypesSet = () => new Set(Object.keys(widgetRegistry));
export const getAllSupportedWidgetTypes = () => Object.keys(widgetRegistry);
export const getWidgetTypesByCategory = () => {
    const supported = getSupportedTypesSet();
    return Object.fromEntries(Object.entries(WIDGET_TAXONOMY).map(([category, config]) => [
        category,
        Object.keys(config.types).filter((type) => supported.has(type)),
    ]));
};
export const getTaxonomyPromptDescription = () => Object.entries(getWidgetTypesByCategory())
    .map(([category, types]) => `${category}:\n${types.map((type) => `- ${type}`).join('\n')}`)
    .join('\n\n');
export const getWidgetPropSchemas = () => {
    if (cachedWidgetPropSchemas !== null) {
        return cachedWidgetPropSchemas;
    }
    try {
        cachedWidgetPropSchemas = fs.readFileSync(WIDGET_PROPS_FILE, 'utf8');
    }
    catch {
        cachedWidgetPropSchemas = '';
    }
    return cachedWidgetPropSchemas;
};
//# sourceMappingURL=widgetPromptContext.js.map