package com.pablogb.voice_notes.controller;

import com.pablogb.voice_notes.service.TranscriptionManager;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audio")

public class TranscriptionController {

    private final TranscriptionManager transcriptionManager;

    public TranscriptionController(TranscriptionManager transcriptionManager) {
        this.transcriptionManager = transcriptionManager;
    }

    @PostMapping("/transcribe")
    public ResponseEntity<String> transcribeAudio(
            @RequestBody byte[] audioBytes,
            @RequestParam(defaultValue = "WHISPER") TranscriptionManager.Engine engine) {
        try {
            String result = transcriptionManager.handle(audioBytes, engine);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Transcription failed: " + e.getMessage());
        }
    }

}
