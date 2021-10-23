import audio from "./audio";
import audio_check from "./audio_check";
import background from "./background";
import information from "./information";
import scroll_manager from "./scroll_manager";
import songs from "./songs";
import title from "./title";

window.onload = async () => {
  document.getElementsByTagName("html")[0].style.overflow = "hidden";
  await Promise.all([audio.load(), title.load(), background.init()]);
  scroll_manager.init();
  songs.init();
  information.init();
  audio_check.init(async () => {
    await audio.init();
    title.init();
    songs.onAudioEnabled();
  }, false);
};
