import numpy as np
import tensorflow as tf
import os
import json
from tensorflow.keras.models import load_model


def build_model(input_size=6, output_size=4):
    """
    Build a neural network model for health diagnosis

    Args:
        input_size: Number of input features (symptoms)
        output_size: Number of output classes (diseases)

    Returns:
        A compiled TensorFlow model
    """
    inputs = tf.keras.Input(shape=(input_size,))
    x = tf.keras.layers.Dense(32, activation='relu')(inputs)
    x = tf.keras.layers.Dropout(0.4)(x)
    x = tf.keras.layers.Dense(16, activation='relu')(x)
    x = tf.keras.layers.Dropout(0.4)(x)
    outputs = tf.keras.layers.Dense(output_size, activation='softmax')(x)

    model = tf.keras.Model(inputs, outputs)
    model.compile(optimizer='adam',
                  loss='categorical_crossentropy',
                  metrics=['accuracy'])

    return model


def train_and_save_model():
    """
    Train the model with predefined data and save it
    """
    # Extended training data with more symptoms
    # [Fever, Cough, Sneezing, Fatigue, Loss of Taste, Itchy Eyes, Sore Throat, Body Aches, Chills]
    X_train = np.array([
        [1, 1, 0, 1, 0, 0, 1, 1, 1],  # Flu
        [0, 1, 1, 0, 0, 0, 1, 0, 0],  # Cold
        [1, 1, 0, 1, 1, 0, 0, 1, 1],  # COVID-19
        [0, 0, 1, 0, 0, 1, 0, 0, 0],  # Allergy
        [1, 0, 0, 1, 0, 0, 0, 1, 1],  # Fever
        [0, 1, 0, 1, 0, 0, 1, 0, 0],  # Bronchitis
        [1, 1, 0, 1, 0, 0, 1, 1, 0],  # Pneumonia
    ], dtype=np.float32)

    # Disease categories
    y_train = tf.keras.utils.to_categorical([0, 1, 2, 3, 4, 5, 6], num_classes=7)

    # Define diseases and symptoms for later use
    diseases = ["Flu", "Cold", "COVID-19", "Allergy", "Fever", "Bronchitis", "Pneumonia"]
    symptoms = ["Fever", "Cough", "Sneezing", "Fatigue", "Loss of Taste", "Itchy Eyes",
                "Sore Throat", "Body Aches", "Chills"]

    # Define test and medication recommendations
    test_recommendations = {
        "Flu": "Influenza A/B test",
        "Cold": "Nasal swab",
        "COVID-19": "PCR test or antigen test",
        "Allergy": "Allergy skin test",
        "Fever": "Blood test",
        "Bronchitis": "Chest X-ray",
        "Pneumonia": "Chest X-ray and sputum culture"
    }

    medicine_recommendations = {
        "Flu": "Oseltamivir (Tamiflu), rest, and fluids",
        "Cold": "Rest, fluids, antihistamines, and decongestants",
        "COVID-19": "Isolation, rest, paracetamol, and fluids",
        "Allergy": "Loratadine, Cetirizine, or other antihistamines",
        "Fever": "Paracetamol or Ibuprofen",
        "Bronchitis": "Rest, fluids, and possibly antibiotics if bacterial",
        "Pneumonia": "Antibiotics, rest, and fluids"
    }

    # Build and train the model
    model = build_model(input_size=X_train.shape[1], output_size=len(diseases))
    model.fit(X_train, y_train, epochs=200, verbose=0)

    # Save the model
    model_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml', 'saved_models')
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'health_model.h5')
    model.save(model_path)

    # Save metadata
    metadata = {
        "diseases": diseases,
        "symptoms": symptoms,
        "test_recommendations": test_recommendations,
        "medicine_recommendations": medicine_recommendations
    }

    metadata_path = os.path.join(model_dir, 'metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f)

    return model, metadata


def load_trained_model():
    """
    Load the trained model and metadata

    Returns:
        model: The trained TensorFlow model
        metadata: Dictionary with model metadata
    """
    model_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml', 'saved_models')
    model_path = os.path.join(model_dir, 'health_model.h5')
    metadata_path = os.path.join(model_dir, 'metadata.json')

    # Check if model exists, otherwise train it
    if not os.path.exists(model_path) or not os.path.exists(metadata_path):
        return train_and_save_model()

    # Load model and metadata
    model = load_model(model_path)

    with open(metadata_path, 'r') as f:
        metadata = json.load(f)

    return model, metadata