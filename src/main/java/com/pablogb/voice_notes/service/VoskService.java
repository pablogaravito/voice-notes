package com.pablogb.voice_notes.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
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

    private static final Logger logger = LoggerFactory.getLogger(VoskService.class);

    @Value("${vosk.model.path}")
    private String modelPath;
    private static final float SAMPLE_RATE = 16000.0f;
    private static Model model;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void init() throws IOException {
        logger.info("Initializing Vosk speech recognition model");
        long startTime = System.currentTimeMillis();

        try {
            model = new Model(modelPath);
            long loadTime = System.currentTimeMillis() - startTime;
            logger.info("Vosk model loaded successfully from {} in {} ms",
                    modelPath, loadTime);
        } catch (IOException e) {
            logger.error("Failed to load Vosk model from {}", modelPath, e);
            throw new IllegalStateException("Could not initialize Vosk model", e);
        }
    }

    public String transcribe(File wavFile) {
        logger.info("Starting transcription for file: {}", wavFile.getAbsolutePath());
        try (InputStream inputStream = new FileInputStream(wavFile);
             Recognizer recognizer = new Recognizer(model, SAMPLE_RATE)) {

            logger.debug("Reading audio data from file");
            byte[] buffer = inputStream.readAllBytes();

            logger.debug("Processing audio with Vosk recognizer");
            recognizer.acceptWaveForm(buffer, buffer.length);

            String result = recognizer.getResult();
            logger.debug("Raw recognition result: {}", result);

            // Handle character encoding conversion
            String utf8Text = new String(result.getBytes(StandardCharsets.ISO_8859_1), StandardCharsets.UTF_8);

            JsonNode jsonNode = objectMapper.readTree(utf8Text);
            String transcription = jsonNode.get("text").asText();

            logger.info("Transcription completed successfully for file: {}", wavFile.getAbsolutePath());

            return transcription;
        } catch (Exception e) {
            logger.error("Transcription failed for file: {}", wavFile.getAbsolutePath(), e);
            throw new RuntimeException("Vosk transcription failed for file: " + wavFile.getName(), e);
        }
    }
}
