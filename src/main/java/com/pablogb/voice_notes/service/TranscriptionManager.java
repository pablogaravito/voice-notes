package com.pablogb.voice_notes.service;

import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ExecutionException;

@Service
public class TranscriptionManager {

    private final AudioConversionService audioConversionService;
    private final WhisperCppService whisperCppService;
    private final VoskService voskService;

    public TranscriptionManager(AudioConversionService audioConversionService, WhisperCppService whisperCppService, VoskService voskService) {
        this.audioConversionService = audioConversionService;
        this.whisperCppService = whisperCppService;
        this.voskService = voskService;
    }

    public enum Engine {WHISPER, VOSK, BOTH}

    private final File workingDir = new File("tmp");


    public Map<String, String> handleDualTranscription(byte[] inputAudio, boolean timestamps)
            throws IOException, InterruptedException {
        System.out.println("Starting dual transcription");

        if (!workingDir.exists()) {
            workingDir.mkdirs();
        }

        try {
            File inputFile = new File(workingDir, "audio.tmp");
            Files.write(inputFile.toPath(), inputAudio);
            File wavFile = audioConversionService.convertToWav(inputFile);

            CompletableFuture<String> whisperFuture = CompletableFuture.supplyAsync(() -> {
                try {
                    return whisperCppService.transcribe(wavFile, timestamps);
                } catch (Exception e) {
                    throw new CompletionException(e);
                }
            });

            CompletableFuture<String> voskFuture = CompletableFuture.supplyAsync(() -> {
                try {
                    return voskService.transcribe(wavFile);
                } catch (Exception e) {
                    throw new CompletionException(e);
                }
            });

            CompletableFuture.allOf(whisperFuture, voskFuture).join();

            Map<String, String> results = new HashMap<>();
            results.put("whisper", whisperFuture.get().stripLeading());
            results.put("vosk", voskFuture.get().stripLeading());
            System.out.println(results);
            return results;
        } catch (ExecutionException e) {
            throw new RuntimeException(e);
        } finally {
            cleanWorkingDir(workingDir);
        }
    }


    public String handleSingleTranscription(byte[] inputAudio, Engine engine, boolean timestamps) throws IOException, InterruptedException {
        if (!workingDir.exists()) {
            workingDir.mkdirs(); // create tmp dir if it doesn't exist
        }
        try {
            File inputFile = new File(workingDir, "audio.tmp");
            Files.write(inputFile.toPath(), inputAudio);

            File wavFile = audioConversionService.convertToWav(inputFile);

            String result = switch(engine) {
                case WHISPER -> whisperCppService.transcribe(wavFile, timestamps);
                case VOSK -> voskService.transcribe(wavFile);
                default -> throw new IllegalArgumentException("Unsupported engine");
            };

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