package com.pablogb.voice_notes_backend.controller;

import com.pablogb.voice_notes_backend.service.AudioConversionService;
import com.pablogb.voice_notes_backend.service.TranscriptionManager;
import com.pablogb.voice_notes_backend.service.VoskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/transcribe")
@RequiredArgsConstructor
public class TranscriptionController {

    private TranscriptionManager transcriptionManager;

    //@PostMapping(produces = MediaType.TEXT_PLAIN_VALUE + ";charset=UTF-8")
//    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
//    public ResponseEntity<String> recognizeSpeech(@RequestBody byte[] audioData) {
//
//        String transcript = recognitionService.transcribe(audioData);
//        return ResponseEntity.ok()
//                .contentType(MediaType.valueOf("text/plain;charset=UTF-8"))
//                .body(transcript);
//    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<String> transcribe(@RequestParam("audio") MultipartFile audioFile) {
        System.out.println("reached controller");
        try {
            String result = transcriptionManager.handle(audioFile);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error: " + e.getMessage());
        }
    }
}
