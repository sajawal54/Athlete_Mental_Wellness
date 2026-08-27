from .groq_service import ask_groq

def get_bio_guide_response(
    user_message,
    conversation_history=None
):

    system_prompt = """
You are the AI Bio Guide for an Athlete Mental Wellness application.

You are a focused wellness assistant specifically for athletes.

You can help with:
- Stress management
- Mood and emotional wellbeing
- Mindfulness
- Recovery
- Focus
- Motivation
- Healthy routines
- Daily wellness goals

You must NOT:
- Diagnose medical or mental health conditions.
- Prescribe medication.
- Replace doctors, therapists, counselors, or other professionals.
- Provide dangerous or harmful instructions.

If the user describes an emergency, immediate danger,
self-harm, suicide, serious injury, or another urgent situation,
encourage them to contact appropriate emergency services
or a qualified professional immediately.

Keep responses supportive, practical, concise,
and relevant to the athlete's situation.
"""

    history_text = ""

    if conversation_history:

        history_text = "\nPrevious conversation:\n"

        for message in conversation_history:

            history_text += (
                f"{message.role}: {message.content}\n"
            )

    prompt = f"""
{system_prompt}

{history_text}

Current athlete message:
{user_message}

Respond as the AI Bio Guide.
"""

    return ask_groq(prompt)