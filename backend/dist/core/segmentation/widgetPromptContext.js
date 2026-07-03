"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWidgetPropSchemas = exports.getTaxonomyPromptDescription = exports.getWidgetTypesByCategory = exports.getAllSupportedWidgetTypes = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const widgetTaxonomy_1 = require("../taxonomy/widgetTaxonomy");
const widgetRegistry_1 = require("../widgetRegistry");
const WIDGET_PROPS_FILE = path_1.default.resolve(process.cwd(), 'src', 'remotion', 'MyComp', 'widget-props.txt');
let cachedWidgetPropSchemas = null;
const getSupportedTypesSet = () => new Set(Object.keys(widgetRegistry_1.widgetRegistry));
const getAllSupportedWidgetTypes = () => Object.keys(widgetRegistry_1.widgetRegistry);
exports.getAllSupportedWidgetTypes = getAllSupportedWidgetTypes;
const getWidgetTypesByCategory = () => {
    const supported = getSupportedTypesSet();
    return Object.fromEntries(Object.entries(widgetTaxonomy_1.WIDGET_TAXONOMY).map(([category, config]) => [
        category,
        Object.keys(config.types).filter((type) => supported.has(type)),
    ]));
};
exports.getWidgetTypesByCategory = getWidgetTypesByCategory;
const getTaxonomyPromptDescription = () => Object.entries((0, exports.getWidgetTypesByCategory)())
    .map(([category, types]) => `${category}:\n${types.map((type) => `- ${type}`).join('\n')}`)
    .join('\n\n');
exports.getTaxonomyPromptDescription = getTaxonomyPromptDescription;
const getWidgetPropSchemas = () => {
    if (cachedWidgetPropSchemas !== null) {
        return cachedWidgetPropSchemas;
    }
    try {
        cachedWidgetPropSchemas = fs_1.default.readFileSync(WIDGET_PROPS_FILE, 'utf8');
    }
    catch {
        cachedWidgetPropSchemas = '';
    }
    return cachedWidgetPropSchemas;
};
exports.getWidgetPropSchemas = getWidgetPropSchemas;
//# sourceMappingURL=widgetPromptContext.js.map