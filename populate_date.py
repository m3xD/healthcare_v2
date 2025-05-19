import os
import sys
import django

# Thiết lập các cài đặt Django trước khi import bất kỳ model nào
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'healthcare.settings')
django.setup()

# Bây giờ mới import các model sau khi đã setup Django
from django.contrib.auth.models import User, Group
from ai_model.models import Symptom, Disease
from doctors.models import Doctor, DoctorSchedule
from datetime import time


def create_sample_data():
    # Tạo nhóm người dùng
    doctor_group, _ = Group.objects.get_or_create(name='Doctors')
    patient_group, _ = Group.objects.get_or_create(name='Patients')

    # Tạo các triệu chứng mẫu
    symptoms = [
        "Fever", "Cough", "Headache", "Sore Throat",
        "Fatigue", "Nausea", "Vomiting", "Rash",
        "Shortness of Breath"
    ]

    for symptom_name in symptoms:
        Symptom.objects.get_or_create(name=symptom_name)
    print(f"Created {len(symptoms)} symptoms")

    # Tạo các bệnh mẫu
    diseases = [
        {"name": "Common Cold", "test_recommendation": "No tests needed", "medicine_recommendation": "Rest and fluids"},
        {"name": "Flu", "test_recommendation": "Influenza test", "medicine_recommendation": "Antiviral medication"},
        {"name": "COVID-19", "test_recommendation": "PCR test", "medicine_recommendation": "As advised by doctor"},
        {"name": "Allergy", "test_recommendation": "Allergy test", "medicine_recommendation": "Antihistamines"}
    ]

    for disease_data in diseases:
        Disease.objects.get_or_create(**disease_data)
    print(f"Created {len(diseases)} diseases")

    # Tạo các bác sĩ mẫu
    doctors_data = [
        {
            "username": "dr.smith",
            "first_name": "John",
            "last_name": "Smith",
            "specialization": "General Medicine",
            "schedule": [
                {"day": 0, "start": "08:00", "end": "16:00"},
                {"day": 2, "start": "08:00", "end": "16:00"},
                {"day": 4, "start": "08:00", "end": "16:00"}
            ]
        },
        {
            "username": "dr.johnson",
            "first_name": "Emily",
            "last_name": "Johnson",
            "specialization": "Pediatrics",
            "schedule": [
                {"day": 1, "start": "09:00", "end": "17:00"},
                {"day": 3, "start": "09:00", "end": "17:00"},
                {"day": 5, "start": "10:00", "end": "14:00"}
            ]
        },
        {
            "username": "dr.patel",
            "first_name": "Raj",
            "last_name": "Patel",
            "specialization": "Cardiology",
            "schedule": [
                {"day": 0, "start": "13:00", "end": "20:00"},
                {"day": 2, "start": "13:00", "end": "20:00"},
                {"day": 4, "start": "13:00", "end": "20:00"}
            ]
        }
    ]

    doctor_count = 0
    schedule_count = 0

    for doc_data in doctors_data:
        username = doc_data["username"]
        schedule_data = doc_data.pop("schedule")
        specialization = doc_data.pop("specialization")

        # Tạo user nếu chưa tồn tại
        if not User.objects.filter(username=username).exists():
            user = User.objects.create_user(
                username=username,
                email=f"{username}@example.com",
                password="password123",
                first_name=doc_data["first_name"],
                last_name=doc_data["last_name"]
            )
            user.groups.add(doctor_group)

            # Tạo hồ sơ bác sĩ
            doctor, created = Doctor.objects.get_or_create(
                user=user,
                specialization=specialization,
                license_number=f"LIC-{username.upper()}",
                experience_years=5,
                available_for_appointment=True
            )

            if created:
                doctor_count += 1

            # Tạo lịch làm việc cho bác sĩ
            for schedule in schedule_data:
                start_time = time.fromisoformat(schedule["start"])
                end_time = time.fromisoformat(schedule["end"])

                schedule_obj, created = DoctorSchedule.objects.get_or_create(
                    doctor=doctor,
                    day_of_week=schedule["day"],
                    defaults={
                        'start_time': start_time,
                        'end_time': end_time
                    }
                )

                if created:
                    schedule_count += 1

    print(f"Created {doctor_count} doctors with {schedule_count} schedules")


if __name__ == "__main__":
    print("Creating sample data...")
    create_sample_data()
    print("Sample data created successfully!")