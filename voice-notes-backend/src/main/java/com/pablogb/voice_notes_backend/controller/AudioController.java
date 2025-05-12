package com.pablogb.voice_notes_backend.controller;

import com.pablogb.voice_notes_backend.service.VoskSpeechRecognitionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audio")
public class AudioController {

    @Autowired
    private VoskSpeechRecognitionService recognitionService;

    @PostMapping(value = "/recognize", produces = MediaType.TEXT_PLAIN_VALUE + ";charset=UTF-8")
    public ResponseEntity<String> recognizeSpeech(@RequestBody byte[] audioData) {
        String transcript = recognitionService.transcribe(audioData);
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("text/plain;charset=UTF-8"))
                .body(transcript);
    }
}
