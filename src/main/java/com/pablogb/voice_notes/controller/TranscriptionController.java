package com.pablogb.voice_notes.controller;

import com.pablogb.voice_notes.service.TranscriptionManager;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.concurrent.CompletionException;

@RestController
@RequestMapping("/api/audio")

public class TranscriptionController {

    private final TranscriptionManager transcriptionManager;

    public TranscriptionController(TranscriptionManager transcriptionManager) {
        this.transcriptionManager = transcriptionManager;
    }

    @PostMapping("/transcribe")
    public ResponseEntity<?> transcribeAudio(
            @RequestBody byte[] audioBytes,
            @RequestParam TranscriptionManager.Engine engine) {
        try {
            if (engine == TranscriptionManager.Engine.BOTH) {
                System.out.println("controller, both");
                Map<String, String> results =
                        transcriptionManager.handleDualTranscription(audioBytes);
                return ResponseEntity.ok(results);
            } else {
                System.out.println("controller, single");
                String result = transcriptionManager.handleSingleTranscription(audioBytes, engine);
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
}
