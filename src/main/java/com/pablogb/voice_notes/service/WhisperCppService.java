package com.pablogb.voice_notes.service;

import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;

@Service
public class WhisperCppService {

    private final File workingDir = new File("tmp");
    private final File whisperExe = new File("native-bin/whisper-cli.exe");
    private final File modelFile = new File("models/whisper-models/whisper-cpp-small/ggml-small.bin");
//    private final File modelFile = new File("models/whisper-models/whisper-cpp-tiny-q8/ggml-tiny-q8_0.bin");

    public String transcribe(File wavFile, boolean timestamps) throws IOException, InterruptedException {
        System.out.println("[whisperCppService] Starting service...");

        File outputTxtFile = new File(workingDir, wavFile.getName() + ".txt");
        File outputTimestampsFile = new File(workingDir, wavFile.getName() + "-timestamps.txt");

        ProcessBuilder pb = new ProcessBuilder(
                whisperExe.getAbsolutePath(),
                "-m", modelFile.getAbsolutePath(),
                "-f", wavFile.getAbsolutePath(),
                "-l", "es",
                "-otxt",
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
                    System.out.println("[whisper.cpp] " + line);
                    if (line.startsWith("[") && line.contains("-->")) {
                        writer.println(simplifyTimestamp(line));
                    }
                }
            }
        } else {
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    System.out.println("[whisper.cpp] " + line);
                }
            }
        }

        int exitCode = process.waitFor();
        System.out.println("[whisper.cpp] Process exited with code: " + exitCode);

        if (timestamps) {
            return Files.readString(outputTimestampsFile.toPath()).stripLeading();
        } else {
            return Files.readString(outputTxtFile.toPath()).stripLeading();
        }
    }

    public static String simplifyTimestamp(String line) {
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
            // Format as MM:SS for under one hour
            return String.format("%02d:%02d", minutes, seconds);
        }
    }

}


