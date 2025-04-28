package com.pablogb.voice_notes_backend;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;
import org.vosk.Model;
import org.vosk.Recognizer;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;

@Service
public class VoskSpeechRecognitionService {

    private static Model model;
    private static Recognizer recognizer;

    @PostConstruct
    public void init() throws IOException {
        // Initialize model
        String modelPath = "models/vosk-model-small-es-0.42";
        model = new Model(modelPath);
        recognizer = new Recognizer(model, 16000.0f);
    }

    public String transcribe(byte[] audioData) {
        try {
            // Vosk expects 16kHz mono PCM audio
            recognizer.acceptWaveForm(audioData, audioData.length);
            String result = recognizer.getResult();

            // Force UTF-8 conversion
            String utf8Text = new String(result.getBytes(StandardCharsets.ISO_8859_1),
                    StandardCharsets.UTF_8);

            JsonNode jsonNode = new ObjectMapper().readTree(utf8Text);
            return jsonNode.get("text").asText();
        } catch (Exception e) {
            throw new RuntimeException("Speech recognition failed", e);
        }
    }

    @PreDestroy
    public void cleanup() {
        if (recognizer != null) {
            recognizer.close();
        }
    }
}
