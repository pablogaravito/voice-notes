package com.pablogb.voice_notes.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;

@Service
public class AudioConversionService {
    private static final Logger logger = LoggerFactory.getLogger(AudioConversionService.class);
    private final File workingDir = new File("tmp");
    private final File ffmpegExe = new File("native-bin/ffmpeg.exe");

    public File convertToWav(File inputFile) throws IOException, InterruptedException {
        File outputFile = new File(workingDir, "converted.wav");

        logger.info("Starting audio conversion process");
        logger.debug("Working directory: {}", workingDir.getAbsolutePath());
        logger.debug("Input file: {}", inputFile.getAbsolutePath());
        logger.debug("Output file: {}", outputFile.getAbsolutePath());

        ProcessBuilder pb = new ProcessBuilder(
                ffmpegExe.getAbsolutePath(),
                "-y",
                "-i", inputFile.getAbsolutePath(),
                "-ar", "16000",
                "-ac", "1",
                "-f", "wav",
                outputFile.getAbsolutePath()
        );
        pb.directory(workingDir);
        pb.redirectErrorStream(true);

        Process process = pb.start();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                logger.debug("[ffmpeg] {}", line);
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            logger.error("FFmpeg failed with exit code {}", exitCode);
            throw new RuntimeException("ffmpeg failed with exit code " + exitCode);
        }

        logger.info("Audio conversion completed successfully");
        return outputFile;
    }
}
