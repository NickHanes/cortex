package com.study.cortex.service;

import org.opencv.core.*;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.Imgproc;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
public class ImageProcessingService {

    static {
        nu.pattern.OpenCV.loadLocally();
    }

    public File preprocessImage(String filePath) {

        Mat image = Imgcodecs.imread(filePath);

        // Convert to grayscale
        Mat gray = new Mat();
        Imgproc.cvtColor(image, gray, Imgproc.COLOR_BGR2GRAY);

        // Reduce noise
        Mat blur = new Mat();
        Imgproc.GaussianBlur(gray, blur, new Size(5,5), 0);

        // Adaptive threshold (great for handwriting)
        Mat threshold = new Mat();
        Imgproc.adaptiveThreshold(
                blur,
                threshold,
                255,
                Imgproc.ADAPTIVE_THRESH_GAUSSIAN_C,
                Imgproc.THRESH_BINARY,
                11,
                2
        );

        String processedPath = filePath.replace(".", "_processed.");

        Imgcodecs.imwrite(processedPath, threshold);

        return new File(processedPath);
    }
}