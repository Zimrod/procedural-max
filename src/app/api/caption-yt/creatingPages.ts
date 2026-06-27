import {
    createTikTokStyleCaptions
} from "@remotion/captions";

const { pages } = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: 1200,
});