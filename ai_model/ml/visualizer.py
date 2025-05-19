import matplotlib.pyplot as plt
import numpy as np
import io
import base64
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
import os


def create_diagnosis_chart(diseases, probabilities, uncertainties):
    """
    Create a bar chart showing diagnosis probabilities with error bars

    Args:
        diseases: List of disease names
        probabilities: List of probability values
        uncertainties: List of uncertainty values

    Returns:
        b64_image: Base64 encoded image
    """
    # Create figure and axis
    fig = Figure(figsize=(10, 6))
    ax = fig.add_subplot(111)

    # Generate colors based on probability
    colors = plt.cm.Blues(np.array(probabilities))

    # Create bar chart
    bars = ax.bar(diseases, probabilities, yerr=uncertainties,
                  capsize=5, color=colors, edgecolor='gray', alpha=0.7)

    # Add value labels on top of bars
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2., height + 0.02,
                f'{height:.2f}', ha='center', va='bottom')

    # Customize chart
    ax.set_ylabel('Probability')
    ax.set_ylim(0, 1.1)
    ax.set_title('Diagnosis Probabilities with Uncertainty')
    ax.grid(axis='y', linestyle='--', alpha=0.7)

    # Rotate x-axis labels for better readability
    plt.setp(ax.get_xticklabels(), rotation=45, ha='right')

    # Adjust layout
    fig.tight_layout()

    # Convert plot to base64 encoded image
    buf = io.BytesIO()
    FigureCanvas(fig).print_png(buf)
    b64_image = base64.b64encode(buf.getvalue()).decode('utf-8')

    return b64_image


def create_symptoms_radar_chart(symptoms, symptom_values):
    """
    Create a radar chart showing symptom patterns

    Args:
        symptoms: List of symptom names
        symptom_values: List of 0 or 1 values indicating symptoms

    Returns:
        b64_image: Base64 encoded image
    """
    # Create figure
    fig = Figure(figsize=(8, 8))
    ax = fig.add_subplot(111, polar=True)

    # Number of symptoms
    N = len(symptoms)

    # Create angles for each symptom
    angles = [n / float(N) * 2 * np.pi for n in range(N)]
    angles += angles[:1]  # Close the circle

    # Add symptom values and close the circle
    values = symptom_values.copy()
    values += values[:1]

    # Draw the radar chart
    ax.plot(angles, values, linewidth=2, linestyle='solid', color='blue')
    ax.fill(angles, values, color='blue', alpha=0.25)

    # Set labels
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(symptoms)

    # Remove radial labels and set y-lim
    ax.set_yticklabels([])
    ax.set_ylim(0, 1)

    # Add title
    ax.set_title("Symptom Pattern", size=15, pad=20)

    # Adjust layout
    fig.tight_layout()

    # Convert plot to base64 encoded image
    buf = io.BytesIO()
    FigureCanvas(fig).print_png(buf)
    b64_image = base64.b64encode(buf.getvalue()).decode('utf-8')

    return b64_image


def save_diagnosis_chart(diseases, probabilities, uncertainties, filename):
    """
    Save diagnosis chart to file

    Args:
        diseases: List of disease names
        probabilities: List of probability values
        uncertainties: List of uncertainty values
        filename: Output filename

    Returns:
        file_path: Path to saved image
    """
    # Create figure and axis
    plt.figure(figsize=(10, 6))

    # Generate colors based on probability
    colors = plt.cm.Blues(np.array(probabilities))

    # Create bar chart
    bars = plt.bar(diseases, probabilities, yerr=uncertainties,
                   capsize=5, color=colors, edgecolor='gray', alpha=0.7)

    # Add value labels on top of bars
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width() / 2., height + 0.02,
                 f'{height:.2f}', ha='center', va='bottom')

    # Customize chart
    plt.ylabel('Probability')
    plt.ylim(0, 1.1)
    plt.title('Diagnosis Probabilities with Uncertainty')
    plt.grid(axis='y', linestyle='--', alpha=0.7)

    # Rotate x-axis labels for better readability
    plt.xticks(rotation=45, ha='right')

    # Adjust layout
    plt.tight_layout()

    # Determine save path
    media_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'media')
    charts_dir = os.path.join(media_dir, 'charts')
    os.makedirs(charts_dir, exist_ok=True)

    file_path = os.path.join(charts_dir, filename)

    # Save figure
    plt.savefig(file_path, dpi=100)
    plt.close()

    return os.path.join('charts', filename)