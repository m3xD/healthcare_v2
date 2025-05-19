import numpy as np
import tensorflow as tf
from .model_builder import load_trained_model
import os
import json
from gtts import gTTS


def predict_with_uncertainty(model, x, n_iter=100):
    """
    Make predictions with uncertainty estimation using Monte Carlo Dropout

    Args:
        model: TensorFlow model with dropout layers
        x: Input features
        n_iter: Number of iterations for MC Dropout

    Returns:
        mean: Mean prediction probabilities
        std: Standard deviation of predictions (uncertainty)
    """
    # Enable dropout at inference time
    preds = np.array([model(x, training=True).numpy() for _ in range(n_iter)])
    mean = preds.mean(axis=0)
    std = preds.std(axis=0)
    return mean, std


def get_diagnosis(symptom_values):
    """
    Get diagnosis based on symptoms

    Args:
        symptom_values: List or array of symptom values (0 or 1)

    Returns:
        result: Dictionary with diagnosis results
    """
    # Load model and metadata
    model, metadata = load_trained_model()

    # Convert symptom values to numpy array
    symptoms_array = np.array([symptom_values], dtype=np.float32)

    # Make prediction with uncertainty
    mean_probs, std_probs = predict_with_uncertainty(model, symptoms_array)

    # Get the most likely disease
    most_likely_idx = np.argmax(mean_probs[0])
    diagnosis = metadata["diseases"][most_likely_idx]

    # Create result dictionary
    result = {
        "diagnosis": diagnosis,
        "confidence": float(mean_probs[0][most_likely_idx]),
        "uncertainty": float(std_probs[0][most_likely_idx]),
        "test_recommendation": metadata["test_recommendations"][diagnosis],
        "medicine_recommendation": metadata["medicine_recommendations"][diagnosis],
        "probabilities": {
            disease: float(mean_probs[0][i]) for i, disease in enumerate(metadata["diseases"])
        },
        "uncertainties": {
            disease: float(std_probs[0][i]) for i, disease in enumerate(metadata["diseases"])
        }
    }

    return result


def text_to_speech(text, filename="diagnosis.mp3"):
    """
    Convert text to speech and save as mp3

    Args:
        text: Text to convert to speech
        filename: Output filename

    Returns:
        file_path: Path to the generated audio file
    """
    # Determine the save directory
    media_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'media')
    audio_dir = os.path.join(media_dir, 'audio')
    os.makedirs(audio_dir, exist_ok=True)

    file_path = os.path.join(audio_dir, filename)

    # Generate speech using gTTS
    tts = gTTS(text=text, lang='en', slow=False)
    tts.save(file_path)

    return os.path.join('audio', filename)


def generate_audio_diagnosis(diagnosis_result):
    """
    Generate audio for diagnosis result

    Args:
        diagnosis_result: Dictionary with diagnosis results

    Returns:
        audio_path: Path to audio file
    """
    diagnosis = diagnosis_result["diagnosis"]
    confidence = int(diagnosis_result["confidence"] * 100)
    test = diagnosis_result["test_recommendation"]
    medicine = diagnosis_result["medicine_recommendation"]

    text = f"Based on your symptoms, you may have {diagnosis} with a confidence of {confidence} percent. "
    text += f"I recommend you take a {test} and consider {medicine}."

    return text_to_speech(text, f"diagnosis_{diagnosis.lower().replace('-', '_')}.mp3")