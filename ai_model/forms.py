from django import forms
from .models import Symptom


class SymptomForm(forms.Form):
    """
    Dynamic form for symptom input
    """

    def __init__(self, *args, **kwargs):
        symptoms = kwargs.pop('symptoms', None)
        super(SymptomForm, self).__init__(*args, **kwargs)

        if symptoms:
            for i, symptom in enumerate(symptoms):
                self.fields[f'symptom_{i}'] = forms.BooleanField(
                    label=symptom,
                    required=False,
                    widget=forms.CheckboxInput(attrs={
                        'class': 'form-check-input',
                        'data-symptom-id': i
                    })
                )

    def get_symptom_values(self):
        """
        Get list of symptom values (0 or 1)
        """
        values = []
        for name, value in self.cleaned_data.items():
            if name.startswith('symptom_'):
                values.append(1 if value else 0)
        return values


class FeedbackForm(forms.Form):
    """
    Form for user feedback on diagnosis
    """
    ACCURACY_CHOICES = [
        (1, '1 - Not accurate at all'),
        (2, '2 - Slightly accurate'),
        (3, '3 - Moderately accurate'),
        (4, '4 - Very accurate'),
        (5, '5 - Extremely accurate')
    ]

    accuracy_rating = forms.ChoiceField(
        choices=ACCURACY_CHOICES,
        widget=forms.RadioSelect(attrs={'class': 'form-check-input'}),
        label='How accurate was the diagnosis?'
    )

    comments = forms.CharField(
        widget=forms.Textarea(attrs={'rows': 3, 'class': 'form-control'}),
        label='Additional comments',
        required=False
    )