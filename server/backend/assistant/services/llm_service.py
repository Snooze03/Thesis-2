import os
from openai import OpenAI
from dotenv import load_dotenv
from ..models import Chat
from .data_collection_service import DataCollectionService


class LLMService:
    def __init__(self):
        # Only load .env in development
        if os.getenv("RENDER") is None:
            load_dotenv()

        api_key = os.getenv("ASSISTANT_API_KEY") or os.environ.get("ASSISTANT_API_KEY")
        if not api_key:
            raise ValueError("ASSISTANT_API_KEY environment variable is not set")

        self.client = OpenAI(api_key=api_key)

        self.model = os.getenv("ASSISTANT_MODEL") or os.environ.get("ASSISTANT_MODEL")
        if not self.model:
            raise ValueError("ASSISTANT_MODEL not found in environment variables")

    def get_system_prompt(self, user_data_summary):
        """
        Build system prompt with user data from DataCollectionService.

        Args:
            user_data_summary: Complete text summary from DataCollectionService

        Returns:
            str: System prompt with user context
        """
        try:
            # Use absolute path relative to the app directory
            prompt_file = os.path.join(
                os.path.dirname(__file__),
                os.pardir,
                "prompts",
                "assistant_prompt.txt",
            )
            with open(prompt_file, "r", encoding="utf-8") as f:
                base_prompt = f.read().strip()
        except FileNotFoundError:
            raise FileNotFoundError(f"System prompt file not found at {prompt_file}")

        # Add user data summary if available
        if user_data_summary:
            return f"{base_prompt}\n\n{user_data_summary}"

        return base_prompt

    def get_response(self, user_message, chat_id):
        """
        Generate AI response with chat context and full user history.
        All data is collected via DataCollectionService.
        """
        try:
            chat = Chat.objects.get(id=chat_id)

            # Fetch complete historical activity data using DataCollectionService
            user_data_summary = None
            try:
                # Initialize service without date parameters to collect full history
                data_service = DataCollectionService(chat.user)
                user_data_summary = data_service.get_summary_text()
            except Exception as e:
                print(f"Error fetching user data summary: {e}")

            # Build message history
            messages = [
                {
                    "role": "system",
                    "content": self.get_system_prompt(user_data_summary),
                }
            ]

            # Add chat history (last 15 messages for context)
            recent_messages = chat.messages.order_by("-created_at")[:15]
            for msg in reversed(recent_messages):
                messages.append({"role": msg.role, "content": msg.content})

            # Add current user message
            messages.append({"role": "user", "content": user_message})

            response = self.client.chat.completions.create(
                model=self.model,
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
