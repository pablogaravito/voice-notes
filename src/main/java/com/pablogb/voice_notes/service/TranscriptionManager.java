package com.pablogb.voice_notes.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
    private static final Logger logger = LoggerFactory.getLogger(TranscriptionManager.class);

    public TranscriptionManager(AudioConversionService audioConversionService, WhisperCppService whisperCppService, VoskService voskService) {
        this.audioConversionService = audioConversionService;
        this.whisperCppService = whisperCppService;
        this.voskService = voskService;
    }

    public enum Engine {WHISPER, VOSK, BOTH}

    private final File workingDir = new File("tmp");


    public Map<String, String> handleDualTranscription(byte[] inputAudio, boolean timestamps)
            throws IOException, InterruptedException {
        logger.info("Starting dual Transcription");

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
            return results;
        } catch (ExecutionException e) {
            throw new RuntimeException(e);
        } finally {
            logger.info("Dual Transcription completed");
            cleanWorkingDir(workingDir);
        }
    }


    public String handleSingleTranscription(byte[] inputAudio, Engine engine, boolean timestamps) throws IOException, InterruptedException {
        logger.info("Starting Single Transcription");
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
            logger.info("Single Transcription completed");
            cleanWorkingDir(workingDir);
        }
    }

    private void cleanWorkingDir(File workingDir) {
        logger.debug("Cleaning Temporary Dir");
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