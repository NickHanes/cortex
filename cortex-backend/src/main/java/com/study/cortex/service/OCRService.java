package com.study.cortex.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.sourceforge.tess4j.Tesseract;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;
import java.util.Map;

@Service
public class OCRService {

    @Value("${tesseract.datapath}")
    private String tessDataPath;

    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    public String extractText(MultipartFile file) throws Exception {
        String contentType = file.getContentType();
        if (contentType != null && contentType.equals("application/pdf")) {
            return extractFromPdf(file);
        } else {
            byte[] imageBytes = file.getBytes();
            try {
                return extractFromImageWithGroq(imageBytes, contentType);
            } catch (Exception e) {
                System.out.println("Groq failed, falling back to Tesseract: " + e.getMessage());
                return extractFromImageWithTesseractBytes(imageBytes);
            }
        }
    }

    // PDF — keep using PDFBox + Tesseract
    private String extractFromPdf(MultipartFile file) throws Exception {
        Tesseract tesseract = new Tesseract();
        tesseract.setDatapath(tessDataPath);
        tesseract.setLanguage("eng");
        tesseract.setPageSegMode(6);
        tesseract.setOcrEngineMode(1);

        byte[] bytes = file.getBytes();
        try (PDDocument document = Loader.loadPDF(bytes)) {
            PDFRenderer renderer = new PDFRenderer(document);
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < document.getNumberOfPages(); i++) {
                BufferedImage image = renderer.renderImageWithDPI(i, 300);
                sb.append(tesseract.doOCR(image)).append("\n");
            }
            return sb.toString();
        }
    }

    @Value("${groq.api.key}")
    private String groqApiKey;

    private String extractFromImageWithGroq(byte[] imageBytes, String contentType) throws Exception {
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);
        String mimeType = contentType != null ? contentType : "image/png";

        String requestBody = mapper.writeValueAsString(Map.of(
                "model", "meta-llama/llama-4-scout-17b-16e-instruct",
                "messages", new Object[]{
                        Map.of(
                                "role", "user",
                                "content", new Object[]{
                                        Map.of("type", "text", "text", """
                        You are a study note transcriber. Carefully transcribe ALL text in this image including:
                        - All handwritten or printed text
                        - Mathematical equations (e.g. dy/dx, x^2, integral from 0 to 1 of x^2 dx)
                        - Greek letters (theta, sigma, lambda etc.)
                        - Diagrams — describe them briefly
                        - Tables or structured data
                        Just transcribe what you see. No commentary.
                        """),
                                        Map.of("type", "image_url", "image_url", Map.of(
                                                "url", "data:" + mimeType + ";base64," + base64Image
                                        ))
                                }
                        )
                },
                "max_tokens", 2048
        ));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.groq.com/openai/v1/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + groqApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request,
                HttpResponse.BodyHandlers.ofString());

        System.out.println("GROQ RESPONSE: " + response.body());

        JsonNode json = mapper.readTree(response.body());

        if (json.has("error")) {
            throw new RuntimeException("Groq error: " + json.get("error").get("message").asText());
        }

        return json.get("choices")
                .get(0)
                .get("message")
                .get("content")
                .asText();
    }

    private String extractFromImageWithTesseractBytes(byte[] imageBytes) throws Exception {
        Tesseract tesseract = new Tesseract();
        tesseract.setDatapath(tessDataPath);
        tesseract.setLanguage("eng");
        tesseract.setPageSegMode(6);
        tesseract.setOcrEngineMode(1);
        BufferedImage img = ImageIO.read(new java.io.ByteArrayInputStream(imageBytes));
        return tesseract.doOCR(img);
    }

    private String getImageFormat(String contentType) {
        if (contentType == null) return "png";
        return switch (contentType) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/gif" -> "gif";
            default -> "png";
        };
    }
}