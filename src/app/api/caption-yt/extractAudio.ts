import toWav from "audiobuffer-to-wav";

const data = await fetch(src);
const context = new AudioContext({});
const arrayBuffer = await data.arrayBuffer();
const wave = await context.decodeAudioData(arrayBuffer);

const audio = audioBufferToWave(wave, {
    float32: true,
});