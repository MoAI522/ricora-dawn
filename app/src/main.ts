import audio from "./audio";
import audio_check from "./audio_check";
import background from "./background";
import information from "./information";
import scroll_manager from "./scroll_manager";
import title from "./title";

audio.load();
title.load();
scroll_manager.init();
background.init();
audio_check.init(() => title.init(), false);
information.init();
