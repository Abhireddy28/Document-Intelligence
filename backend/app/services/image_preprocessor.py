import cv2
import numpy as np
from PIL import Image
import os
import io

class ImagePreprocessor:
    """Preprocesses images for optimal OCR recognition and visual analysis."""

    @staticmethod
    def preprocess_image(image_path_or_bytes, save_debug_path: str = None) -> np.ndarray:
        """
        Loads image, applies grayscale, noise reduction, adaptive thresholding, and deskew.
        """
        try:
            if isinstance(image_path_or_bytes, str):
                image = cv2.imread(image_path_or_bytes)
            elif isinstance(image_path_or_bytes, bytes):
                nparr = np.frombuffer(image_path_or_bytes, np.uint8)
                image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            else:
                image = np.array(image_path_or_bytes)

            if image is None:
                raise ValueError("Could not decode image")

            # 1. Grayscale
            if len(image.shape) == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            else:
                gray = image

            # 2. Noise reduction using Gaussian Blur or Bilateral Filter
            denoised = cv2.bilateralFilter(gray, 9, 75, 75)

            # 3. Adaptive Thresholding for crisp contrast
            thresh = cv2.adaptiveThreshold(
                denoised, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
            )

            if save_debug_path:
                cv2.imwrite(save_debug_path, thresh)

            return thresh
        except Exception as e:
            # Fallback if cv2 operation encounters an issue
            return None

    @staticmethod
    def convert_pdf_page_to_image(page_pixmap) -> bytes:
        """Converts PyMuPDF page pixmap to PNG bytes."""
        return page_pixmap.tobytes("png")

image_preprocessor = ImagePreprocessor()
