import songdata from "../../assets/json/songdata.json";
import config from "../config";
import { TSondDatas as TSongDatas } from "../types";
import context from "./context";

let arrayBuffers: Array<ArrayBuffer>;
let audioBuffers: Array<AudioBuffer>;

const load = async () => {
  arrayBuffers = await Promise.all(
    (songdata as TSongDatas).map(async (data) => {
      const audioData = await fetch(config.MUSIC_PATH + data.filename);
      const arrayBuffer = await audioData.arrayBuffer();
      return arrayBuffer;
    })
  );
};

const init = async () => {
  audioBuffers = await Promise.all(
    arrayBuffers.map(async (arrayBuffer) => {
      const audioBuffer = await context.ctx.decodeAudioData(arrayBuffer);
      return audioBuffer;
    })
  );
};

export default {
  load,
  init,
  arrayBuffers,
};
