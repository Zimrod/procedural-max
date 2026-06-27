import type {Caption} frm "@remotion/captions";

import {
    OpenAiVerboseTranscription,
    openAiWhisperApiToCaptions,
} from "@remotion/openai-whisper";

const transcription = 
    (await res.json()) as OpenAiVerboseTranscription;

const { captions } =
    openAiWhisperApiToCaptions({ transcription });