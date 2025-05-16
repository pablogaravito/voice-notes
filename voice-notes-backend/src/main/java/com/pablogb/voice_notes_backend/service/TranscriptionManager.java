package com.pablogb.voice_notes_backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@Service
@RequiredArgsConstructor
public class TranscriptionManager {

    private final AudioConversionService audioConversionService;
    private final WhisperCppService whisperCppService;
    private final VoskService voskService;
    private final File workingDir = new File("tmp");

    public String handle(byte[] inputAudio) throws IOException, InterruptedException {
        if (!workingDir.exists()) {
            workingDir.mkdirs(); // create tmp dir if it doesn't exist
        }
        try {
            File inputFile = tempDir.resolve("input.webm").toFile();
            Files.write(inputFile.toPath(), inputAudio);

            File wavFile = audioConversionService.convertToWav(inputFile);

//            String result = switch (engine) {
//                case WHISPER -> whisperService.transcribe(wavFile);
//                case VOSK -> voskService.transcribe(wavFile);
//            };
            String result = voskService.transcribe(wavFile);

            return result.stripLeading(); // Remove leading whitespace
        } finally {
            FileUtils.deleteDirectory(tempDir.toFile());
        }
    }

    public String handle(MultipartFile audioFile) throws IOException, InterruptedException {
        System.out.println("reached handle");
        File tempInput = File.createTempFile("input", ".webm");
        audioFile.transferTo(tempInput);
        System.out.println(tempInput.getAbsolutePath());

        File wavFile = audioConversionService.convertToWav(tempInput);
        System.out.println(wavFile.getAbsolutePath());

        String transcript = whisperCppService.transcribe(wavFile);
        System.out.println(transcript);

        // Cleanup
        tempInput.delete();

        return transcript;
    }

}