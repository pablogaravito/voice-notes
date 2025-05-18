package com.pablogb.voice_notes.service;

import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

@Service
public class WhisperCppService {

    private final File workingDir = new File("tmp");
    private final File whisperExe = new File("native-bin/whisper-cli.exe");
    private final File modelFile = new File("models/whisper-cpp-small/ggml-small.bin");

    public String transcribe(File wavFile) throws IOException, InterruptedException {
        System.out.println("[whisperCppService] Starting service...");
        File outputTxtFile = new File(workingDir, wavFile.getName() + ".txt");

        ProcessBuilder pb = new ProcessBuilder(
                whisperExe.getAbsolutePath(),
                "-m", modelFile.getAbsolutePath(),
                "-f", wavFile.getAbsolutePath(),
                "-l", "es",
                "-otxt"
        );
        pb.directory(workingDir);
        pb.redirectErrorStream(true);
        Process process = pb.start();
        process.waitFor();

        String result = Files.readString(outputTxtFile.toPath()).stripLeading();
        System.out.println(result);
        return result;
    }
}


