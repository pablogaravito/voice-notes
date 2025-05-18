package com.pablogb.voice_notes_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

@Service
@RequiredArgsConstructor
public class TranscriptionManager {

    private final AudioConversionService audioConversionService;
    private final WhisperCppService whisperCppService;
    private final VoskService voskService;

    public enum Engine {WHISPER, VOSK, BOTH}

    private final File workingDir = new File("tmp");

//    public TranscriptionManager(AudioConversionService audioConversionService,
//                                WhisperCppService whisperCppService,
//                                VoskService voskService) {
//        this.audioConversionService = audioConversionService;
//        this.whisperCppService = whisperCppService;
//        this.voskService = voskService;
//    }

    public String handle(byte[] inputAudio, Engine engine) throws IOException, InterruptedException {
        System.out.println("reached handle");
        if (!workingDir.exists()) {
            workingDir.mkdirs(); // create tmp dir if it doesn't exist
        }
        try {
            File inputFile = new File(workingDir, "audio.tmp");
            Files.write(inputFile.toPath(), inputAudio);

            File wavFile = audioConversionService.convertToWav(inputFile);

            String result = switch (engine) {
                case WHISPER -> whisperCppService.transcribe(wavFile);
                case VOSK -> voskService.transcribe(wavFile);
                case BOTH -> voskService.transcribe(wavFile);
            };
            //String result = voskService.transcribe(wavFile);

            return result.stripLeading(); // Remove leading whitespace
        } finally {
            cleanWorkingDir(workingDir);
        }
    }

    private void cleanWorkingDir(File workingDir) {
        File[] files = workingDir.listFiles();
        if (files != null) {
            for (File file : files) {
                if (!file.isDirectory()) {
                    file.delete();
                }
            }
        }
    }

}