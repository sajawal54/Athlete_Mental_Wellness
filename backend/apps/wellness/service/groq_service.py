import os
from groq import Groq

MODULE_PROMPTS = {
    'setback_reframer': """Act as an elite sports psychologist. The athlete shares this setback: "{user_input}".
Provide a powerful, highly motivating positive reframe in simple Roman Urdu / Hinglish.
RULES:
- Maximum 2 to 3 short sentences total (under 50 words).
- Keep it direct, encouraging, authentic, and super simple to understand. No long lectures or complex bullet points.""",

    'self_talk': """Analyze this athlete's self-talk: "{user_input}".
Provide a concise response in simple Roman Urdu / Hinglish:
1. Pattern: Identify the mindset pattern in 1 short sentence.
2. Reframe: Give 2 short, powerful alternative self-talk phrases.
RULES:
- Keep the entire answer under 60 words.
- Do NOT write long paragraphs.""",

    'locker_room': """Generate a unique, realistic locker-room dilemma for an athlete in simple Roman Urdu / Hinglish.
Return ONLY a raw valid JSON object with NO markdown, formatting, or code blocks in this exact structure:
{"title": "...", "scenario": "...", "options": ["Option A", "Option B", "Option C"]}
RULES:
- Keep scenario max 2-3 short lines.
- Keep options ultra-short (3-6 words each).""",

    'integrity': """Generate a fresh ethical sports integrity dilemma involving honesty, fairness, or sportsmanship in simple Roman Urdu / Hinglish.
Return ONLY a raw valid JSON object with NO markdown, formatting, or code blocks in this exact structure:
{"title": "...", "dilemma": "...", "choices": ["Choice 1", "Choice 2"]}
RULES:
- Keep dilemma max 2 short sentences.
- Keep choices concise and clear.""",

    'empathy': """Create a realistic roleplay conversation scenario where a teammate needs emotional support regarding performance pressure or personal struggle in simple Roman Urdu / Hinglish.
Return ONLY a raw valid JSON object with NO markdown, formatting, or code blocks in this exact structure:
{"situation": "...", "teammate_dialogue": "..."}
RULES:
- Keep situation max 2 short lines.
- Keep teammate_dialogue max 1-2 realistic sentences.""",

    'grit_garden': """Act as a mental resilience guide for athletes. The athlete shared this journal entry: "{user_input}".
Provide feedback in simple Roman Urdu / Hinglish:
1. Feedback: 1 short sentence validating their feelings.
2. Prompts: 2 concise journaling questions to build grit.
RULES:
- Maximum 60 words total. Extremely short and clear.""",



}

def generate_wellness_ai(module_type, user_input="", extra_context=""):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is missing in .env file!")

    client = Groq(api_key=api_key)

    system_prompt = MODULE_PROMPTS.get(
        module_type,
        "You are an AI Athlete Mental Performance Coach. Provide insightful support."
    )

    full_prompt = f"{system_prompt}\n\nUser Input: {user_input}\nContext: {extra_context}"

    response = client.chat.completions.create(
        model="openai/gpt-oss-120b",  # Standard ultra-fast and permanently supported endpoint
        messages=[
            {
                "role": "user",
                "content": full_prompt
            }
        ],
    )

    return response.choices[0].message.content