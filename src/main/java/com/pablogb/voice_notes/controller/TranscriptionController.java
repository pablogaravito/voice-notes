package com.pablogb.voice_notes.controller;

import com.pablogb.voice_notes.service.TranscriptionManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.CompletionException;

@RestController
@RequestMapping("/api/audio")

public class TranscriptionController {

    private final TranscriptionManager transcriptionManager;
    private static final Logger log = LoggerFactory.getLogger(TranscriptionController.class);
    public TranscriptionController(TranscriptionManager transcriptionManager) {
        this.transcriptionManager = transcriptionManager;
    }

    @PostMapping("/transcribe")
    public ResponseEntity<?> transcribeAudio(
            @RequestBody byte[] audioBytes,
            @RequestParam TranscriptionManager.Engine engine,
            @RequestParam(required = false, defaultValue = "false") boolean timestamps) {
        try {
            if (engine == TranscriptionManager.Engine.BOTH) {
                Map<String, String> results =
                        transcriptionManager.handleDualTranscription(audioBytes, timestamps);
                return ResponseEntity.ok(results);
            } else {
                String result = transcriptionManager.handleSingleTranscription(audioBytes, engine, timestamps);
                return ResponseEntity.ok(result);
            }
        } catch (CompletionException e) {
            Throwable cause = e.getCause();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Parallel transcription failed: " + cause.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Transcription failed: " + e.getMessage());
        }
    }

    @PostMapping(value = "/transcribe-file",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> transcribeAudioFile(
            @RequestParam("file") MultipartFile audioFile,
            @RequestParam TranscriptionManager.Engine engine,
            @RequestParam(required = false, defaultValue = "false") boolean timestamps) {
        log.info("Received file: {} ({} bytes, type: {})",
                audioFile.getOriginalFilename(),
                audioFile.getSize(),
                audioFile.getContentType());
        log.info("boolean value received: {}", timestamps);
        try {
            byte[] audioBytes = audioFile.getBytes();

            if (engine == TranscriptionManager.Engine.BOTH) {
                Map<String, String> results =
                        transcriptionManager.handleDualTranscription(audioBytes, timestamps);
                return ResponseEntity.ok(results);
            } else {
                String result = transcriptionManager.handleSingleTranscription(audioBytes, engine, timestamps);
                return ResponseEntity.ok(result);
            }
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("File processing failed: " + e.getMessage());
        } catch (CompletionException e) {
            Throwable cause = e.getCause();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Parallel transcription failed: " + cause.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Transcription failed: " + e.getMessage());
        }
    }
}
