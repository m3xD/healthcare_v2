from django.contrib import admin
from .models import Doctor, DoctorSchedule


class DoctorScheduleInline(admin.TabularInline):
    model = DoctorSchedule
    extra = 1


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'specialization', 'license_number', 'experience_years', 'available_for_appointment')
    search_fields = ('user__first_name', 'user__last_name', 'specialization')
    list_filter = ('specialization', 'available_for_appointment')
    inlines = [DoctorScheduleInline]


@admin.register(DoctorSchedule)
class DoctorScheduleAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'get_day_name', 'start_time', 'end_time')
    list_filter = ('day_of_week',)

    def get_day_name(self, obj):
        return dict(DoctorSchedule.DAYS_OF_WEEK)[obj.day_of_week]

    get_day_name.short_description = 'Day'