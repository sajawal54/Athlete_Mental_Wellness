import os
from groq import Groq


client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


def ask_groq(prompt):

    response = client.chat.completions.create(
         model="openai/gpt-oss-120b", 
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
    )

    return response.choices[0].message.content