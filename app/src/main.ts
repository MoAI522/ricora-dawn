import audio from "./audio";

const playButton = document.getElementById("play_pause") as HTMLButtonElement;
const trackNumberInput = document.getElementById(
  "track_number"
) as HTMLInputElement;
const jumpButton = document.getElementById("jump") as HTMLButtonElement;

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

  if (audio.getState() === "stopped") {
    audio.play(audio.getCurrentTrackNum());
  } else if (audio.getState() === "playing") {
    audio.pause();
  }
});
jumpButton?.addEventListener("click", () => {
  const trackNumber = parseInt(trackNumberInput.value);
  if (0 > trackNumber && trackNumber >= audio.getNumberOfTracks()) return;
  audio.play(trackNumber);
});

audio.load();
