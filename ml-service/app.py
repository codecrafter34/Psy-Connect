import base64
import numpy as np
import cv2
from fer import FER
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

detector = FER(mtcnn=False)

# Kept identical to the AWS Rekognition vocabulary in emotionController.js so the
# dashboard shows one consistent set of moods no matter which engine answered.
EMOTION_MAP = {
    'happy': 'Happy',
    'sad': 'Sad',
    'angry': 'Angry',
    'neutral': 'Neutral',
    'fear': 'Fear',
    'disgust': 'Disgusted',
    'surprise': 'Surprised'
}

@app.route('/', methods=['GET'])
@app.route('/health', methods=['GET'])
def health():
    # A cheap GET so the host's health check (and a quick browser visit) can
    # confirm the service is awake without running the model.
    return jsonify({'status': 'ok', 'service': 'psyconnect-ml'}), 200


@app.route('/predict', methods=['POST'])
def predict_emotion():
    try:
        data = request.get_json()

        if not data or 'image' not in data:
            return jsonify({'success': False, 'message': 'Base64 image string is required'}), 400

        image_data = data['image']

        if not isinstance(image_data, str) or not image_data.startswith('data:image/'):
            return jsonify({'success': False, 'message': 'Invalid image format. Expected a base64 data URL.'}), 400

        base64_str = image_data.split(',', 1)[1]
        img_bytes = base64.b64decode(base64_str)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({'success': False, 'message': 'Could not decode image.'}), 400

        results = detector.detect_emotions(img)

        if not results:
            return jsonify({'success': False, 'message': 'No face detected. Please position your face inside the camera.'}), 400

        face_emotions = results[0]['emotions']
        top_emotion_raw = max(face_emotions, key=face_emotions.get)
        confidence = round(face_emotions[top_emotion_raw] * 100, 2)
        normalized_emotion = EMOTION_MAP.get(top_emotion_raw, 'Neutral')

        print(f"[Flask ML] Detected: {normalized_emotion} (raw: {top_emotion_raw}) | Confidence: {confidence}%")

        return jsonify({
            'success': True,
            'data': {
                'emotion': normalized_emotion,
                'rawEmotion': top_emotion_raw.upper(),
                'confidence': confidence
            }
        }), 201

    except Exception as e:
        print(f"[Flask ML] Error: {str(e)}")
        return jsonify({'success': False, 'message': 'Emotion analysis unavailable.', 'error': str(e)}), 500

if __name__ == '__main__':
    import os
    # Bind to 0.0.0.0 and honour the host's PORT so the same file runs locally
    # (port 5001) and on a cloud host (which injects its own PORT). debug is off
    # so a stack trace is never exposed in production.
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting Flask ML Microservice on port {port}...")
    app.run(host='0.0.0.0', port=port)
