package com.pablogb.voice_notes.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.vosk.Model;
import org.vosk.Recognizer;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Service
public class VoskService {

    private static Model model;

    @PostConstruct
    public void init() throws IOException {
        // Initialize model
        String voskModelFile = "models/vosk-model-small-es-0.42";
        model = new Model(voskModelFile);
    }

    public String transcribe(File wavFile) {
        System.out.println("[voskService] Starting service...");
        try (InputStream inputStream = new FileInputStream(wavFile);
             Recognizer recognizer = new Recognizer(model, 16000.0f)) {

            byte[] buffer = inputStream.readAllBytes();
            recognizer.acceptWaveForm(buffer, buffer.length);

            String result = recognizer.getResult();
            // Force UTF-8 conversion
            String utf8Text = new String(result.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);

            JsonNode jsonNode = new ObjectMapper().readTree(utf8Text);
            return jsonNode.get("text").asText();
        } catch (Exception e) {
            throw new RuntimeException("Vosk transcription failed", e);
        }
    }
}
