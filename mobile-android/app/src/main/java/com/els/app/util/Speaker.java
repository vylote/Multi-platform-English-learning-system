package com.els.app.util;

import android.content.Context;
import android.speech.tts.TextToSpeech;

import java.util.Locale;

/** Phát âm tiếng Anh bằng TextToSpeech (thay cho Web Speech API ở web). */
public class Speaker {

    private TextToSpeech tts;
    private boolean ready = false;

    public Speaker(Context context) {
        tts = new TextToSpeech(context.getApplicationContext(), status -> {
            if (status == TextToSpeech.SUCCESS) {
                tts.setLanguage(Locale.US);
                ready = true;
            }
        });
    }

    public void speak(String text) {
        if (ready && text != null && !text.isEmpty()) {
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "els-tts");
        }
    }

    public void shutdown() {
        if (tts != null) {
            tts.stop();
            tts.shutdown();
            tts = null;
        }
    }
}
