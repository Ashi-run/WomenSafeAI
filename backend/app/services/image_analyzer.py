import logging
import cv2
import numpy as np

# Lightweight TFLite runtime
try:
    import tflite_runtime.interpreter as tflite
except ImportError:
    import tensorflow as tf
    tflite = tf.lite

logger = logging.getLogger(__name__)

class ProfileImageAnalyzer:
    def __init__(self):
        self.is_loaded = False
        self.interpreter = None
        self.input_details = None
        self.output_details = None
        
        # Point this to your actual 42MB TFLite file
        self.model_path = "models/liveness_targeted_quant.tflite" 
        
        # Use OpenCV's built-in face detector instead of the broken MediaPipe!
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        self._load_model()

    def _load_model(self):
        try:
            self.interpreter = tflite.Interpreter(model_path=self.model_path)
            self.interpreter.allocate_tensors()
            
            self.input_details = self.interpreter.get_input_details()
            self.output_details = self.interpreter.get_output_details()
            self.is_loaded = True
            logger.info("✅ TFLite Liveness model loaded successfully!")
        except Exception as e:
            logger.error(f"Failed to load TFLite model: {e}")

    async def analyze_image(self, image_bytes: bytes) -> int:
        """
        Detects face using OpenCV, crops, resizes to 224x224, 
        and runs TFLite inference.
        """
        if not self.is_loaded:
            return 0

        try:
            # 1. Decode the uploaded image bytes
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return 0
            
            h_orig, w_orig, _ = img.shape
            
            # OpenCV face detector needs grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # 2. Detect the Face using OpenCV
            faces = self.face_cascade.detectMultiScale(
                gray, 
                scaleFactor=1.1, 
                minNeighbors=5, 
                minSize=(30, 30)
            )
            
            if len(faces) == 0:
                logger.info("GAN model skipped: No human face detected in the image.")
                return 0 
                
            # Grab the largest face found (most likely the primary subject)
            faces = sorted(faces, key=lambda f: f[2]*f[3], reverse=True)
            x, y, w, h = faces[0]
            
            # Add a 20% margin around the face
            margin_x = int(w * 0.2)
            margin_y = int(h * 0.2)
            
            start_x = max(0, x - margin_x)
            start_y = max(0, y - margin_y)
            end_x = min(w_orig, x + w + margin_x)
            end_y = min(h_orig, y + h + margin_y)
            
            # 3. Crop the face! (Convert to RGB for TFLite)
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            cropped_face = img_rgb[start_y:end_y, start_x:end_x]
            
            if cropped_face.size == 0:
                return 0
            
            # 4. Resize to 224x224
            resized_face = cv2.resize(cropped_face, (224, 224), interpolation=cv2.INTER_LINEAR)
            
            # Convert to Float32. (No /255 division due to internal Rescaling layer)
            img_array = np.array(resized_face, dtype=np.float32)
            img_array = np.expand_dims(img_array, axis=0)

            # 5. Run Inference
            self.interpreter.set_tensor(self.input_details[0]['index'], img_array)
            self.interpreter.invoke()

            output_data = self.interpreter.get_tensor(self.output_details[0]['index'])
            
            # 6. Interpret the score (0.0 = FAKE, 1.0 = REAL)
            real_probability = float(output_data[0][0])
            fake_probability = (1.0 - real_probability) * 100
            
            final_score = int(fake_probability)
            logger.info(f"TFLite extracted Fake Probability: {final_score}%")
            
            return max(0, min(100, final_score))

        except Exception as e:
            logger.error(f"TFLite image analysis failed: {e}")
            return 0