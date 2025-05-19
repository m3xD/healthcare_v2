from django.apps import AppConfig
import os


class AiModelConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ai_model'

    def ready(self):
        # Import the model builder on startup if needed
        # This will run when the Django server starts
        from .ml import model_builder

        # Create the model directory if it doesn't exist
        model_path = os.path.join(os.path.dirname(__file__), 'ml', 'saved_models')
        os.makedirs(model_path, exist_ok=True)

        # Check if model exists, otherwise train and save it
        model_file = os.path.join(model_path, 'health_model.h5')
        if not os.path.exists(model_file):
            model_builder.train_and_save_model()