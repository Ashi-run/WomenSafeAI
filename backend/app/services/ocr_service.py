import logging
from typing import List
import easyocr
import numpy as np
import cv2
from fastapi import UploadFile

logger = logging.getLogger(__name__)

class OcrService:
    def __init__(self):
        """
        Initialize the EasyOCR Reader.
        """
        logger.info("Initializing EasyOCR Engine...")
        self.reader = easyocr.Reader(['en'], gpu=False)
        logger.info("✓ EasyOCR Engine ready.")

    async def extract_text_from_screenshots(self, files: List[UploadFile]) -> str:
        """
        Iterates through uploaded images, ensures the stream cursor is rewound,
        decodes them using OpenCV, and extracts text lines via EasyOCR.
        """
        if not files:
            return ""

        extracted_chunks = []

        for index, file in enumerate(files):
            try:
                # 🌟 THE CRITICAL FIX: Rewind the file stream cursor to the absolute 
                # beginning BEFORE reading. This ensures that even if validation 
                # checked the file earlier, we read the full file data here.
                await file.seek(0)
                file_bytes = await file.read()
                
                # Reset cursor after reading for good stream hygiene
                await file.seek(0)  

                # Safety Check: If the read operation returned nothing, skip it cleanly
                if not file_bytes:
                    logger.error(f"Skipping file {file.filename} because read bytes are empty.")
                    continue

                # Convert bytes to a raw numpy uint8 array
                nparr = np.frombuffer(file_bytes, np.uint8)
                if nparr.size == 0:
                    logger.error(f"Numpy buffer generation failed for: {file.filename}")
                    continue

                # Decode the image array using OpenCV
                image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if image_bgr is None:
                    logger.error(f"OpenCV could not decode image format for: {file.filename}")
                    continue

                # Convert BGR to RGB for EasyOCR execution
                image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)

                logger.info(f"Running OCR extraction on file {index + 1}: {file.filename}")
                
                # Execute text extraction
                text_lines = self.reader.readtext(image_rgb, detail=0)

                if text_lines:
                    screenshot_text = " ".join(text_lines)
                    extracted_chunks.append(screenshot_text)
                    logger.info(f"✓ Extracted {len(text_lines)} text segments from {file.filename}")
                else:
                    logger.warning(f"No text detected in screenshot: {file.filename}")

            except Exception as e:
                logger.error(f"Failed to process OCR for file {file.filename}: {str(e)}")
                continue

        return "\n\n".join(extracted_chunks)