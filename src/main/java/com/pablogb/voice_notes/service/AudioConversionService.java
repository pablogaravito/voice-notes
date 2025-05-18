package com.pablogb.voice_notes.service;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;

@Service
public class AudioConversionService {

    private final File workingDir = new File("tmp");
    private final File ffmpegExe = new File("native-bin/ffmpeg.exe");

    public File convertToWav(File inputFile) throws IOException, InterruptedException {
        File outputFile = new File(workingDir, "converted.wav");

        System.out.println("⏳ [ffmpeg] Starting conversion...");
        System.out.println("🔍 Input file: " + inputFile.getAbsolutePath());
        System.out.println("📝 Output file: " + outputFile.getAbsolutePath());

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
                System.out.println("[ffmpeg] " + line);
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("ffmpeg failed with exit code " + exitCode);
        }

        System.out.println("✅ [ffmpeg] Conversion complete.");
        return outputFile;
    }
}
