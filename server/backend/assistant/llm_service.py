# import os
# from openai import OpenAI
# from dotenv import load_dotenv
# from .models import Chat


# class LLMService:
#     def __init__(self):
#         load_dotenv()
#         self.client = OpenAI(api_key=os.getenv("ASSISTANT_API_KEY"))

#     def get_system_prompt(self, user_profile=None, nutrition_profile=None):
#         try:
#             # Use absolute path relative to the app directory
#             instructions_path = os.path.join(
#                 os.path.dirname(__file__), "instructions.txt"
#             )
#             with open(instructions_path, "r", encoding="utf-8") as f:
#                 base_prompt = f.read().strip()
#         except FileNotFoundError:
#             # Fallback prompt if file doesn't exist
#             base_prompt = """You are PrimeFit Assistant, a knowledgeable fitness and nutrition expert.
#             You help users with workout planning, nutrition advice, exercise form, and general fitness guidance.
#             Always provide evidence-based recommendations and encourage users to consult healthcare professionals for medical concerns."""

#         context_parts = []

#         # Add user profile context
#         if user_profile:
#             try:
#                 user_context = f"""
#                 User Profile:
#                 - Age: {getattr(user_profile, 'age', 'Not specified')}
#                 - Fitness Goal: {getattr(user_profile, 'body_goal', 'Not specified')}
#                 - Workout Frequency: {getattr(user_profile, 'workout_frequency', 'Not specified')}
#                 - Workout Location: {getattr(user_profile, 'workout_location', 'Not specified')}
#                 - Activity Level: {getattr(user_profile, 'activity_level', 'Not specified')}
#                 - Current Weight: {getattr(user_profile, 'current_weight', 'Not specified')}kg
#                 - Goal Weight: {getattr(user_profile, 'goal_weight', 'Not specified')}kg
#                 - Starting Weight: {getattr(user_profile, 'starting_weight', 'Not specified')}kg
#                 - Injuries/Limitations: {getattr(user_profile, 'injuries', 'None specified')}
#                 - Food Allergies/Restrictions: {getattr(user_profile, 'food_allergies', 'None specified')}
#                 """
#                 context_parts.append(user_context)
#             except Exception as e:
#                 print(f"Error adding user context: {e}")

#         # Add nutrition profile context
#         if nutrition_profile:
#             try:
#                 nutrition_context = f"""
#                 Nutrition Profile:
#                 - Daily Calorie Goal: {getattr(nutrition_profile, 'daily_calories_goal', 'Not set')} kcal
#                 - Daily Protein Goal: {getattr(nutrition_profile, 'daily_protein_goal', 'Not set')}g
#                 - Daily Carbs Goal: {getattr(nutrition_profile, 'daily_carbs_goal', 'Not set')}g
#                 - Daily Fat Goal: {getattr(nutrition_profile, 'daily_fat_goal', 'Not set')}g
#                 - BMR (Basal Metabolic Rate): {getattr(nutrition_profile, 'bmr', 'Not calculated')} kcal
#                 - TDEE (Total Daily Energy Expenditure): {getattr(nutrition_profile, 'tdee', 'Not calculated')} kcal
#                 - Macros Auto-Calculated: {getattr(nutrition_profile, 'is_auto_calculated', 'Unknown')}
#                 """
#                 context_parts.append(nutrition_context)
#             except Exception as e:
#                 print(f"Error adding nutrition context: {e}")

#         # Combine all context
#         if context_parts:
#             full_context = "\n".join(context_parts)
#             return base_prompt + "\n" + full_context

#         return base_prompt

#     def get_response(
#         self, user_message, chat_id, user_profile=None, nutrition_profile=None
#     ):
#         """Generate AI response with chat context"""
#         try:
#             chat = Chat.objects.get(id=chat_id)

#             # Get user profile if not provided
#             if user_profile is None:
#                 try:
#                     user_profile = getattr(chat.user, "profile", None)
#                 except:
#                     user_profile = None

#             # Get nutrition profile if not provided
#             if nutrition_profile is None:
#                 try:
#                     nutrition_profile = getattr(chat.user, "nutrition_profile", None)
#                 except:
#                     nutrition_profile = None

#             # Build message history
#             messages = [
#                 {
#                     "role": "system",
#                     "content": self.get_system_prompt(user_profile, nutrition_profile),
#                 }
#             ]

#             # Add chat history (last 15 messages for context)
#             recent_messages = chat.messages.order_by("-created_at")[:15]
#             for msg in reversed(recent_messages):
#                 messages.append({"role": msg.role, "content": msg.content})

#             # Add current user message
#             messages.append({"role": "user", "content": user_message})

#             response = self.client.chat.completions.create(
#                 model=os.getenv("ASSISTANT_MODEL"),
#                 messages=messages,
#                 max_tokens=500,
#                 temperature=0.7,
#             )

#             assistant_message = response.choices[0].message.content

#             # Return just the message content - views.py handles saving messages
#             return assistant_message

#         except Chat.DoesNotExist:
#             raise Exception("Chat not found")
#         except Exception as e:
#             print(f"Error in get_response: {e}")
#             raise e


import os
from openai import OpenAI
from dotenv import load_dotenv
from .models import Chat


class LLMService:
    def __init__(self):
        load_dotenv()
        self.client = OpenAI(api_key=os.getenv("ASSISTANT_API_KEY"))

    def get_system_prompt(self, user_profile=None, nutrition_profile=None):
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

        context_parts = []

        # Add user profile context
        if user_profile:
            try:
                user_context = f"""
                User Profile:
                - Age: {getattr(user_profile, 'age', 'Not specified')}
                - Fitness Goal: {getattr(user_profile, 'body_goal', 'Not specified')}
                - Workout Frequency: {getattr(user_profile, 'workout_frequency', 'Not specified')}
                - Workout Location: {getattr(user_profile, 'workout_location', 'Not specified')}
                - Activity Level: {getattr(user_profile, 'activity_level', 'Not specified')}
                - Current Weight: {getattr(user_profile, 'current_weight', 'Not specified')}kg
                - Goal Weight: {getattr(user_profile, 'goal_weight', 'Not specified')}kg
                - Starting Weight: {getattr(user_profile, 'starting_weight', 'Not specified')}kg
                - Injuries/Limitations: {getattr(user_profile, 'injuries', 'None specified')}
                - Food Allergies/Restrictions: {getattr(user_profile, 'food_allergies', 'None specified')}
                """
                context_parts.append(user_context)
            except Exception as e:
                print(f"Error adding user context: {e}")

        # Add nutrition profile context
        if nutrition_profile:
            try:
                # Get BMI category using the model method
                bmi_category = "Not available"
                try:
                    bmi_category = nutrition_profile.get_bmi_category()
                except:
                    pass

                nutrition_context = f"""
                Nutrition Profile:
                - Daily Calorie Goal: {getattr(nutrition_profile, 'daily_calories_goal', 'Not set')} kcal
                - Daily Protein Goal: {getattr(nutrition_profile, 'daily_protein_goal', 'Not set')}g
                - Daily Carbs Goal: {getattr(nutrition_profile, 'daily_carbs_goal', 'Not set')}g
                - Daily Fat Goal: {getattr(nutrition_profile, 'daily_fat_goal', 'Not set')}g
                - BMI (Body Mass Index): {getattr(nutrition_profile, 'bmi', 'Not calculated')}
                - BMI Category: {bmi_category}
                - BMR (Basal Metabolic Rate): {getattr(nutrition_profile, 'bmr', 'Not calculated')} kcal
                - TDEE (Total Daily Energy Expenditure): {getattr(nutrition_profile, 'tdee', 'Not calculated')} kcal
                - Macros Auto-Calculated: {getattr(nutrition_profile, 'is_auto_calculated', 'Unknown')}
                """
                context_parts.append(nutrition_context)
            except Exception as e:
                print(f"Error adding nutrition context: {e}")

        # Combine all context
        if context_parts:
            full_context = "\n".join(context_parts)
            return base_prompt + "\n" + full_context

        return base_prompt

    def get_response(
        self, user_message, chat_id, user_profile=None, nutrition_profile=None
    ):
        """Generate AI response with chat context"""
        try:
            chat = Chat.objects.get(id=chat_id)

            # Get user profile if not provided
            if user_profile is None:
                try:
                    user_profile = getattr(chat.user, "profile", None)
                except:
                    user_profile = None

            # Get nutrition profile if not provided
            if nutrition_profile is None:
                try:
                    nutrition_profile = getattr(chat.user, "nutrition_profile", None)
                except:
                    nutrition_profile = None

            # Build message history
            messages = [
                {
                    "role": "system",
                    "content": self.get_system_prompt(user_profile, nutrition_profile),
                }
            ]

            # Add chat history (last 15 messages for context)
            recent_messages = chat.messages.order_by("-created_at")[:15]
            for msg in reversed(recent_messages):
                messages.append({"role": msg.role, "content": msg.content})

            # Add current user message
            messages.append({"role": "user", "content": user_message})

            response = self.client.chat.completions.create(
                model=os.getenv("ASSISTANT_MODEL"),
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
