package com.pablogb.voice_notes.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class WhisperCppService {

    private static final Logger logger = LoggerFactory.getLogger(WhisperCppService.class);

    @Value("${whisper.model.path}")
    private String modelPath;

    private final File workingDir;
    private final File whisperExe;
    private final File modelFile;

    public WhisperCppService(@Value("${whisper.model.path}") String modelPath) {
        this.workingDir = new File("tmp");
        this.whisperExe = new File("native-bin/whisper-cli.exe");
        this.modelFile = new File(modelPath);
    }

    public String transcribe(File wavFile, boolean timestamps) throws IOException, InterruptedException {
        logger.info("Starting transcription for file: {} (timestamps: {})",
                wavFile.getAbsolutePath(), timestamps);

        File outputTxtFile = new File(workingDir, wavFile.getName() + ".srt");
        File outputTimestampsFile = new File(workingDir, wavFile.getName() + "-timestamps.txt");

        ProcessBuilder pb = new ProcessBuilder(
                whisperExe.getAbsolutePath(),
                "-m", modelFile.getAbsolutePath(),
                "-f", wavFile.getAbsolutePath(),
                "-l", "es",
                "-osrt",
                "-pp"
        );
        pb.directory(workingDir);
        pb.redirectErrorStream(true);
        Process process = pb.start();

        if (timestamps) {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                 PrintWriter writer = new PrintWriter(new FileWriter(outputTimestampsFile))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    logger.debug("[whisper.cpp] {}", line);
                    if (line.startsWith("[") && line.contains("-->")) {
                        writer.println(simplifyTimestamp(line));
                    }
                }
            }
        } else {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    logger.debug("[whisper.cpp] {}", line);
                }
            }
        }

        int exitCode = process.waitFor();
        logger.debug("Whisper process exited with code: {}", exitCode);

        if (exitCode != 0) {
            logger.error("Whisper transcription failed with exit code: {}", exitCode);
            throw new IOException("Whisper process failed with exit code " + exitCode);
        }
        logger.info("Transcription completed successfully for file: {}", wavFile.getAbsolutePath());
        return timestamps ? readResultFile(outputTimestampsFile) : cleanSRTToNaturalText(outputTxtFile.toPath());
    }

    private String readResultFile(File resultFile) throws IOException {
        String result = Files.readString(resultFile.toPath()).stripLeading();
        logger.debug("Final transcription result: {}", result);
        return result;
    }

    private static String simplifyTimestamp(String line) {
        // Extract the timestamp part
        int startIdx = line.indexOf('[');
        int endIdx = line.indexOf(']');
        if (startIdx == -1 || endIdx == -1) return line;

        String timestampPart = line.substring(startIdx + 1, endIdx);
        String textPart = line.substring(endIdx + 1).trim();

        // Process the timestamp
        String[] parts = timestampPart.split(" --> ");
        if (parts.length != 2) return line;

        String startSimplified = simplifySingleTimestamp(parts[0]);
        String endSimplified = simplifySingleTimestamp(parts[1]);

        // Reconstruct the line
        return "[" + startSimplified + "-" + endSimplified + "]  " + textPart;
    }

    private static String simplifySingleTimestamp(String timestamp) {
        // Remove milliseconds
        String[] timeParts = timestamp.split("\\.")[0].split(":");
        int hours = Integer.parseInt(timeParts[0]);
        int minutes = Integer.parseInt(timeParts[1]);
        int seconds = Integer.parseInt(timeParts[2]);

        if (hours > 0) {
            // Format as HH:MM:SS when hours exist
            return String.format("%02d:%02d:%02d", hours, minutes, seconds);
        } else {
            // Format as MM:SS when under one hour
            return String.format("%02d:%02d", minutes, seconds);
        }
    }

    private static String cleanSRTToNaturalText(Path srtFilePath) throws IOException {
        List<String> lines = Files.readAllLines(srtFilePath);
        StringBuilder output = new StringBuilder();
        StringBuilder currentSentence = new StringBuilder();

        Pattern timestampPattern = Pattern.compile("^\\d{2}:\\d{2}:\\d{2},\\d{3} --> .*");
        Pattern indexPattern = Pattern.compile("^\\d+$");

        for (String line : lines) {
            line = line.trim();

            // Skip index lines and timestamps
            if (line.isEmpty() || indexPattern.matcher(line).matches() || timestampPattern.matcher(line).matches()) {
                continue;
            }

            // Accumulate sentence parts
            currentSentence.append(line).append(" ");

            // Check for sentence-ending punctuation
            if (line.matches(".*[.?!…]$")) {
                output.append(currentSentence.toString().trim()).append(" ");
                currentSentence.setLength(0);
            }
        }

        // In case any leftover fragment
        if (!currentSentence.isEmpty()) {
            output.append(currentSentence.toString().trim());
        }

        // collapse multiple spaces, trim ends
        return output.toString().replaceAll(" +", " ").trim();
    }
}


