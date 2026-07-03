import { DEFAULT_COMPOSITION_THEME, } from '../types/theme.js';
import { getWidgetComponent, } from '../core/widgetComponentRegistry.js';
export const VoiceoverScene = ({ scenes, theme = {}, }) => {
    const resolvedTheme = {
        ...DEFAULT_COMPOSITION_THEME,
        ...theme,
    };
    return style = {};
    {
        backgroundColor: resolvedTheme.backgroundColor,
        ;
    }
};
    >
        { scenes, : .map((item, i) => {
                const WidgetComponent = getWidgetComponent(item.widget);
                return key = {} `${item.widget}_${i}`;
            }, from = { item, : .startFrame }, durationInFrames = { item, : .mainDurationInFrames ?? item.durationFrames }
                >
                    { ...item.props }
                        /  >
                /Sequence>)
        };
/AbsoluteFill>;
;
;
//# sourceMappingURL=logger.js.map