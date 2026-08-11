import base64
import numpy as np
import cv2
from fer import FER
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

detector = FER(mtcnn=False)

EMOTION_MAP = {
    'happy': 'Happy',
    'sad': 'Depression / Sad',
    'angry': 'Angry',
    'neutral': 'Neutral',
    'fear': 'Fear & Anxiety',
    'disgust': 'Angry',
    'surprise': 'Stress'
}

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
    print("Starting Flask ML Microservice on port 5001...")
    app.run(host='127.0.0.1', port=5001, debug=True)
