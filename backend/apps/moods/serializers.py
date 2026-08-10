from rest_framework import serializers
from .models import MoodLog

class MoodLogSerializer(serializers.ModelSerializer):
    # Username readonly pass hoga taake frontend ko user id ke bajaye username mile
    user = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = MoodLog
        fields = ['id', 'user', 'mood', 'emoji', 'energy_level', 'notes', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

    # Validation: Energy level must be between 1 and 5
    def validate_energy_level(self, value):
        if value < 1 or value > 5:
            raise serializers.ValidationError("Energy level must be between 1 and 5.")
        return value