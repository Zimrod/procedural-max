import {fitText} from "@remotion/layout-utils";

const {fontSize} = fitText({
    fontFamily,
    text: page.text,
    withinWidth: captionWidth,
    textTransform: "uppercase",
    validateFontIsLoaded: true,
});

const clampedFontSize = 
    Math.min(DESIRED_FONT_SIZE, fontSize);