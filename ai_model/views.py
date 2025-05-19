from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.utils import timezone

from .forms import SymptomForm, FeedbackForm
from .models import Symptom, Disease, Diagnosis, DiagnosisSymptom
from .ml.model_builder import load_trained_model
from .ml.prediction import get_diagnosis, generate_audio_diagnosis
from .ml.visualizer import (
    create_diagnosis_chart,
    create_symptoms_radar_chart,
    save_diagnosis_chart
)

import json
import uuid


def home(request):
    """
    Home page view
    """
    # Load model metadata to get symptoms
    _, metadata = load_trained_model()
    symptoms = metadata.get("symptoms", [])

    # Create the form with dynamic symptom fields
    form = SymptomForm(symptoms=symptoms)

    context = {
        'form': form,
        'symptoms': symptoms,
        'page_title': 'AI Health Assistant'
    }

    return render(request, 'ai_model/index.html', context)


def diagnose(request):
    """
    Process diagnosis request
    """
    if request.method != 'POST':
        return redirect('ai_model:home')

    # Load model metadata
    _, metadata = load_trained_model()
    symptoms = metadata.get("symptoms", [])

    # Create form with submitted data
    form = SymptomForm(request.POST, symptoms=symptoms)

    if form.is_valid():
        # Get symptom values (0 or 1)
        symptom_values = form.get_symptom_values()

        # Get diagnosis result
        result = get_diagnosis(symptom_values)

        # Generate visualization
        diseases = list(result["probabilities"].keys())
        probabilities = list(result["probabilities"].values())
        uncertainties = list(result["uncertainties"].values())

        # Create charts
        diagnosis_chart = create_diagnosis_chart(diseases, probabilities, uncertainties)
        symptoms_chart = create_symptoms_radar_chart(symptoms, symptom_values)

        # Create diagnosis object in database if user is logged in
        if request.user.is_authenticated:
            # Get or create disease
            primary_disease, _ = Disease.objects.get_or_create(
                name=result["diagnosis"],
                defaults={
                    'test_recommendation': result["test_recommendation"],
                    'medicine_recommendation': result["medicine_recommendation"]
                }
            )

            # Create diagnosis
            diagnosis = Diagnosis.objects.create(
                user=request.user,
                primary_disease=primary_disease,
                prediction_data=result
            )

            # Create symptom relationships
            for i, symptom_name in enumerate(symptoms):
                symptom, _ = Symptom.objects.get_or_create(name=symptom_name)
                DiagnosisSymptom.objects.create(
                    diagnosis=diagnosis,
                    symptom=symptom,
                    is_present=bool(symptom_values[i])
                )

            # Save chart for historical record
            chart_filename = f"diagnosis_{diagnosis.id}_{timezone.now().strftime('%Y%m%d%H%M%S')}.png"
            chart_path = save_diagnosis_chart(diseases, probabilities, uncertainties, chart_filename)

            # Generate audio
            audio_path = generate_audio_diagnosis(result)

            # Store paths in session for retrieval
            request.session['diagnosis_id'] = diagnosis.id
        else:
            # For anonymous users, store diagnosis in session
            session_id = request.session.get('session_id', str(uuid.uuid4()))
            request.session['session_id'] = session_id

            # Generate audio
            audio_path = generate_audio_diagnosis(result)

            # Store paths in session
            request.session['diagnosis_data'] = {
                'result': result,
                'symptom_values': symptom_values,
                'created_at': timezone.now().isoformat()
            }

        # Store common data in session
        request.session['diagnosis_result'] = result
        request.session['symptom_values'] = symptom_values
        request.session['audio_path'] = audio_path
        request.session.modified = True


        return redirect('ai_model:diagnosis_result')

    # If form is invalid, return to home page with error message
    messages.error(request, 'There was an error processing your request. Please try again.')
    return redirect('ai_model:home')


def diagnosis_result(request):
    """
    Display diagnosis result
    """
    # Get diagnosis data from session
    result = request.session.get('diagnosis_result')
    symptom_values = request.session.get('symptom_values')
    audio_path = request.session.get('audio_path')


    if not result or not symptom_values:
        messages.error(request, 'No diagnosis data found. Please try again.')
        return redirect('ai_model:home')

    # Load model metadata
    _, metadata = load_trained_model()
    symptoms = metadata.get("symptoms", [])

    # Create charts
    diseases = list(result["probabilities"].keys())
    probabilities = list(result["probabilities"].values())
    uncertainties = list(result["uncertainties"].values())

    diagnosis_chart = create_diagnosis_chart(diseases, probabilities, uncertainties)
    symptoms_chart = create_symptoms_radar_chart(symptoms, symptom_values)

    # Create a list of symptoms that are present
    present_symptoms = [
        symptoms[i] for i, val in enumerate(symptom_values) if val == 1
    ]

    # Create feedback form
    feedback_form = FeedbackForm()

    context = {
        'diagnosis': result["diagnosis"],
        'confidence': result["confidence"] * 100,  # Convert to percentage
        'uncertainty': result["uncertainty"] * 100,  # Convert to percentage
        'test_recommendation': result["test_recommendation"],
        'medicine_recommendation': result["medicine_recommendation"],
        'present_symptoms': present_symptoms,
        'diagnosis_chart': diagnosis_chart,
        'symptoms_chart': symptoms_chart,
        'audio_path': audio_path,
        'feedback_form': feedback_form,
        'page_title': f'Diagnosis Result: {result["diagnosis"]}'
    }

    return render(request, 'ai_model/diagnosis.html', context)


@login_required
def diagnosis_history(request):
    """
    View diagnosis history for logged-in user
    """
    diagnoses = Diagnosis.objects.filter(user=request.user).order_by('-created_at')

    context = {
        'diagnoses': diagnoses,
        'page_title': 'Your Diagnosis History'
    }

    return render(request, 'ai_model/history.html', context)


@login_required
def diagnosis_detail(request, diagnosis_id):
    """
    View details of a specific diagnosis
    """
    diagnosis = get_object_or_404(Diagnosis, id=diagnosis_id, user=request.user)
    result = diagnosis.prediction_data

    # Get symptoms and values
    symptoms_data = DiagnosisSymptom.objects.filter(diagnosis=diagnosis)
    symptoms = [s.symptom.name for s in symptoms_data]
    symptom_values = [1 if s.is_present else 0 for s in symptoms_data]

    # Create charts
    diseases = list(result["probabilities"].keys())
    probabilities = list(result["probabilities"].values())
    uncertainties = list(result["uncertainties"].values())

    diagnosis_chart = create_diagnosis_chart(diseases, probabilities, uncertainties)
    symptoms_chart = create_symptoms_radar_chart(symptoms, symptom_values)

    # Create a list of symptoms that are present
    present_symptoms = [
        symptoms[i] for i, val in enumerate(symptom_values) if val == 1
    ]

    context = {
        'diagnosis': diagnosis,
        'confidence': result["confidence"] * 100,  # Convert to percentage
        'uncertainty': result["uncertainty"] * 100,  # Convert to percentage
        'present_symptoms': present_symptoms,
        'diagnosis_chart': diagnosis_chart,
        'symptoms_chart': symptoms_chart,
        'page_title': f'Diagnosis: {diagnosis.primary_disease.name}'
    }

    return render(request, 'ai_model/diagnosis_detail.html', context)


def submit_feedback(request):
    """
    Handle feedback submission
    """
    if request.method != 'POST':
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

    form = FeedbackForm(request.POST)

    if form.is_valid():
        # Get diagnosis ID from session if user is logged in
        diagnosis_id = request.session.get('diagnosis_id')

        if diagnosis_id and request.user.is_authenticated:
            try:
                diagnosis = Diagnosis.objects.get(id=diagnosis_id, user=request.user)

                # Update diagnosis with feedback
                feedback_data = {
                    'accuracy_rating': form.cleaned_data['accuracy_rating'],
                    'comments': form.cleaned_data['comments'],
                    'submitted_at': timezone.now().isoformat()
                }

                # Update prediction data to include feedback
                prediction_data = diagnosis.prediction_data
                prediction_data['feedback'] = feedback_data
                diagnosis.prediction_data = prediction_data
                diagnosis.save()

                return JsonResponse({'status': 'success', 'message': 'Thank you for your feedback!'})

            except Diagnosis.DoesNotExist:
                pass

        # For anonymous users or if diagnosis not found, just return success
        return JsonResponse({'status': 'success', 'message': 'Thank you for your feedback!'})

    # Return form errors if validation fails
    return JsonResponse({'status': 'error', 'errors': form.errors})