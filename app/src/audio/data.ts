import { logger } from ".";
import songdata from "../../assets/json/songdata.json";
import config from "../config";
import { TSondDatas as TSongDatas } from "../types";
import context from "./context";

let arrayBuffers: Array<ArrayBuffer> = [];
let audioBuffers: Array<AudioBuffer | null> = [];

const load = async () => {
  arrayBuffers = await Promise.all(
    (songdata as TSongDatas).map(async (data) => {
      const audioData = await fetch(config.MUSIC_PATH + data.filename);
      const arrayBuffer = await audioData.arrayBuffer();
      return arrayBuffer;
    })
  );
  logger.debug("loading completed", { arrayBuffers });
};

const init = async () => {
  logger.debug("data init", { arrayBuffers });
  audioBuffers = await Promise.all(
    arrayBuffers.map(async (arrayBuffer) => {
      const audioBuffer = await new Promise<AudioBuffer | null>((resolve) =>
        context.getContext()?.decodeAudioData(
          arrayBuffer,
          (buffer) => {
            logger.debug("buffer", { buffer });
            resolve(buffer);
          },
          (e) => {
            logger.debug("decodeAudioData error", { e });
            resolve(null);
          }
        )
      );
      logger.debug("arrayBuffers map", {
        arrayBuffer,
        audioBuffer,
        ctx: context.getContext(),
      });
      return audioBuffer || null;
    })
  );
};

const getAudioBuffers = () => audioBuffers;

const getNumberOfTracks = () => audioBuffers.length;

export default {
  load,
  init,
  getAudioBuffers,
  getNumberOfTracks,
};
