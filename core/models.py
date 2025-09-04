from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Chapter(models.Model):
    SUBJECT_CHOICES = [
        ('phy', 'Physics'),
        ('chem', 'Chemistry'),
        ('math', 'Math'),
    ]
    subject = models.CharField(max_length=10, choices=SUBJECT_CHOICES)
    phase = models.IntegerField()
    name = models.CharField(max_length=255)
    serial_number = models.IntegerField()


    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='chapters_created')


    class Meta:
        ordering = ['serial_number']
        unique_together = ('subject', 'phase', 'serial_number')


    def __str__(self):
        return f"{self.get_subject_display()} P{self.phase} • {self.serial_number}. {self.name}"


class UserChapterProgress(models.Model):
    COLOR_CHOICES = [
        ('#baadec', 'Purple'),
        ('#b0e0eb', 'Blue'),
        ('#cbecaf', 'Green'),
        ('#ffffff', 'White'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE)
    status = models.TextField(blank=True)
    highlight_color = models.CharField(max_length=7, choices=COLOR_CHOICES, default='#ffffff')

    # Study material progress
    ncert_done = models.BooleanField(default=False)
    package_cpp_done = models.BooleanField(default=False)
    package_section1_done = models.BooleanField(default=False)
    package_section2_done = models.BooleanField(default=False)
    package_section3_done = models.BooleanField(default=False)
    mains_archive_done = models.BooleanField(default=False)
    advance_archive_done = models.BooleanField(default=False)
    class_notes_done = models.BooleanField(default=False)
    tab_assignments_done = models.BooleanField(default=False)


    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)


    class Meta:
        unique_together = ('user', 'chapter')


    def __str__(self):
        return f"{self.user.username} • {self.chapter}"


class CalendarEvent(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    chapter = models.ForeignKey(Chapter, on_delete=models.CASCADE)
    date = models.DateField()
    position = models.IntegerField(default=0)


    created_date = models.DateTimeField(auto_now_add=True)
    updated_date = models.DateTimeField(auto_now=True)


    class Meta:
        unique_together = ('user', 'chapter', 'date', 'position')
        ordering = ['date', 'position']


    def __str__(self):
        return f"{self.user.username} • {self.chapter.name} @ {self.date} ({self.position})"