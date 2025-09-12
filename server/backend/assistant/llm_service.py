import os
from openai import OpenAI
from dotenv import load_dotenv
from .models import Chat


class LLMService:
    def __init__(self):
        load_dotenv()
        self.client = OpenAI(api_key=os.getenv("ASSISTANT_API_KEY"))

    def get_system_prompt(self, user_profile=None):
        try:
            # Use absolute path relative to the app directory
            instructions_path = os.path.join(
                os.path.dirname(__file__), "instructions.txt"
            )
            with open(instructions_path, "r", encoding="utf-8") as f:
                base_prompt = f.read().strip()
        except FileNotFoundError:
            # Fallback prompt if file doesn't exist
            base_prompt = """You are PrimeFit Assistant, a knowledgeable fitness and nutrition expert.
            You help users with workout planning, nutrition advice, exercise form, and general fitness guidance.
            Always provide evidence-based recommendations and encourage users to consult healthcare professionals for medical concerns."""

        if user_profile:
            try:
                context = f"""
                User Context:
                - Age: {getattr(user_profile, 'age', 'Not specified')}
                - Fitness Goal: {getattr(user_profile, 'body_goal', 'Not specified')}
                - Workout Frequency: {getattr(user_profile, 'workout_frequency', 'Not specified')}
                - Workout Location: {getattr(user_profile, 'workout_location', 'Not specified')}
                """
                return base_prompt + context
            except Exception as e:
                print(f"Error adding user context: {e}")

        return base_prompt

    def get_response(self, user_message, chat_id, user_profile=None):
        """Generate AI response with chat context"""
        try:
            chat = Chat.objects.get(id=chat_id)

            # Build message history
            messages = [
                {"role": "system", "content": self.get_system_prompt(user_profile)}
            ]

            # Add chat history (last 15 messages for context)
            recent_messages = chat.messages.order_by("-created_at")[:15]
            for msg in reversed(recent_messages):
                messages.append({"role": msg.role, "content": msg.content})

            # Add current user message
            messages.append({"role": "user", "content": user_message})

            response = self.client.chat.completions.create(
                model=os.getenv("ASSISTANT_MODEL"),  # Added fallback
                messages=messages,
                max_tokens=500,
                temperature=0.7,
            )

            assistant_message = response.choices[0].message.content

            # Return just the message content - views.py handles saving messages
            return assistant_message

        except Chat.DoesNotExist:
            raise Exception("Chat not found")
        except Exception as e:
            print(f"Error in get_response: {e}")
            raise e
