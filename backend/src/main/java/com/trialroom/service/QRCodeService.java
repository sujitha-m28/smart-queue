package com.trialroom.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class QRCodeService {

    @Value("${app.frontend.base-url:http://localhost:4200}")
    private String frontendBaseUrl;

    private static final int QR_SIZE = 300;

    /**
     * Generate a QR code PNG for a store's join URL.
     * URL format: {frontendBaseUrl}/customer/join?storeId={storeId}
     *
     * @param storeId UUID of the store
     * @return PNG image bytes
     */
    public byte[] generateStoreQRCode(String storeId) {
        String url = frontendBaseUrl + "/customer/join?storeId=" + storeId;
        return generateQRCode(url);
    }

    public byte[] generateQRCode(String content) {
        try {
            QRCodeWriter writer = new QRCodeWriter();
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.M);
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 2);

            BitMatrix bitMatrix = writer.encode(content, BarcodeFormat.QR_CODE, QR_SIZE, QR_SIZE, hints);

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            return outputStream.toByteArray();

        } catch (WriterException | IOException e) {
            log.error("Failed to generate QR code for content: {}", content, e);
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    public String getStoreQRUrl(String storeId) {
        return frontendBaseUrl + "/customer/join?storeId=" + storeId;
    }
}
