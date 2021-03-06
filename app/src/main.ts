import audio from "./audio";
import audio_check from "./audio_check";
import loading from "./audio_check/loading";
import background from "./background";
import information from "./information";
import scroll_manager from "./scroll_manager";
import songs from "./songs";
import title from "./title";

loading.init();
songs.init();
information.init();

window.onload = async () => {
  document.getElementsByTagName("html")[0].style.overflow = "hidden";
  await Promise.all([audio.load(), title.load(), background.init()]);
  scroll_manager.init();
  title.init();
  audio_check.init(async () => {
    await audio.init();
    title.onAudioEnabled();
    songs.onAudioEnabled();
    information.onAudioEnabled();
  }, false);
};
