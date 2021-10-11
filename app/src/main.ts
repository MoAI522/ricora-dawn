import audio from "./audio";

const playButton = document.getElementById("play_pause") as HTMLButtonElement;
const trackNumberInput = document.getElementById(
  "track_number"
) as HTMLInputElement;

let initialized = false;

playButton?.addEventListener("click", async () => {
  if (!initialized) {
    await audio.init();
    audio.setAudioEndCallback(() => {
      audio.pause();
      const currentTrackNum = audio.getCurrentTrackNum();
      if (currentTrackNum + 1 < audio.getNumberOfTracks())
        audio.play(currentTrackNum + 1);
    });
    initialized = true;
  }

  const trackNumber = parseInt(trackNumberInput.value);
  if (0 > trackNumber && trackNumber >= audio.getNumberOfTracks()) return;
  if (
    audio.getState() === "stopped" ||
    trackNumber != audio.getCurrentTrackNum()
  ) {
    audio.play(trackNumber);
  } else {
    audio.pause();
  }
});

audio.load();
