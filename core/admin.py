from django.contrib import admin
from .models import Chapter, UserChapterProgress, CalendarEvent

# Register your models here.
@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ('id','subject','phase','serial_number','name','created_by','created_date')
    list_filter = ('subject','phase')
    search_fields = ('name',)

@admin.register(UserChapterProgress)
class UCPAdmin(admin.ModelAdmin):
    list_display = ('id','user','chapter','highlight_color','updated_date')
    search_fields = ('chapter__name','user__username','user__email')

@admin.register(CalendarEvent)
class CalendarEventAdmin(admin.ModelAdmin):
    list_display = ('id','user','chapter','date','position')
    list_filter = ('date',)