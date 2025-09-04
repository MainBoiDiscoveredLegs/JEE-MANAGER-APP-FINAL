from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Chapter, UserChapterProgress, CalendarEvent

class MeSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'first_name', 'last_name', 'full_name']
    def get_full_name(self, obj):
        return obj.get_full_name()


class ChapterSerializer(serializers.ModelSerializer):
    created_by = serializers.HiddenField(default=serializers.CurrentUserDefault())
    class Meta:
        model = Chapter
        fields = ['id', 'subject', 'phase', 'name', 'serial_number', 'created_date', 'updated_date', 'created_by']


class UserChapterProgressSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    class Meta:
        model = UserChapterProgress
        fields = [
            'id', 'user', 'chapter', 'status', 'highlight_color',
            'ncert_done', 'package_cpp_done', 'package_section1_done',
            'package_section2_done', 'package_section3_done',
            'mains_archive_done', 'advance_archive_done', 'class_notes_done', 'tab_assignments_done',
            'created_date', 'updated_date'
        ]
        read_only_fields = ['created_date', 'updated_date']

    def validate_highlight_color(self, value):
        if not value:
            return "#ffffff"
        return value


class CalendarEventSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    class Meta:
        model = CalendarEvent
        fields = ['id', 'user', 'chapter', 'date', 'position', 'created_date', 'updated_date']