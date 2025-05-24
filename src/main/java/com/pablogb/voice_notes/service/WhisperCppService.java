package com.pablogb.voice_notes.service;

import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;

@Service
public class WhisperCppService {

    private final File workingDir = new File("tmp");
    private final File whisperExe = new File("native-bin/whisper-cli.exe");
    private final File modelFile = new File("models/whisper-cpp-small/ggml-small.bin");

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
                        writer.println(line);
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
}


