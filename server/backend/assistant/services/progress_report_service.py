import os
from openai import OpenAI
from datetime import datetime
from django.utils import timezone
from ..models.progress_report import ProgressReport
from ..data_collection_service import DataCollectionService


class ReportGenerationService:
    """
    Service to generate AI-powered progress reports for users.
    """

    def __init__(self):
        """Initialize the OpenAI client"""
        # Load API key from environment
        if os.getenv("RENDER") is None:
            from dotenv import load_dotenv

            load_dotenv()

        api_key = os.getenv("ASSISTANT_API_KEY") or os.environ.get("ASSISTANT_API_KEY")
        if not api_key:
            raise ValueError("ASSISTANT_API_KEY not found in environment variables")

        self.client = OpenAI(api_key=api_key)

        self.model = os.getenv("ASSISTANT_MODEL") or os.environ.get("ASSISTANT_MODEL")
        if not self.model:
            raise ValueError("ASSISTANT_MODEL not found in environment variables")

        # Get system prompt file
        self.base_prompt = self._get_system_prompt()

    def _get_system_prompt(self):
        prompt_file = os.path.join(
            os.path.dirname(__file__),
            os.pardir,
            "prompts",
            "progress_report_prompt.txt",
        )

        try:
            with open(prompt_file, "r", encoding="utf-8") as f:
                return f.read().strip()
        except FileNotFoundError:
            raise FileNotFoundError(f"System prompt file not found at {prompt_file}")

    def generate_report(self, user, period_start, period_end, report_type="short"):
        """
        Generate a progress report for the user.

        Args:
            user: User instance
            period_start: Start datetime of reporting period
            period_end: End datetime of reporting period
            report_type: Type of report ("short" or "detailed")

        Returns:
            ProgressReport: The generated progress report instance
        """
        # Create progress report instance with pending status
        report = ProgressReport.objects.create(
            user=user,
            period_start=period_start,
            period_end=period_end,
            report_type=report_type,
            status="pending",
        )

        try:
            # Collect user data
            data_service = DataCollectionService(user, period_start, period_end)
            collected_data = data_service.collect_all_data()

            # Check if there's enough data to generate a report
            has_nutrition = collected_data["nutrition_data"]["has_data"]
            has_workouts = collected_data["workout_data"]["has_data"]

            if not has_nutrition and not has_workouts:
                report.status = "failed"
                report.generation_error = "Insufficient data: No nutrition or workout data found for this period"
                report.save()
                return report

            # Generate report sections using AI
            report_content = self._generate_report_content(collected_data, report_type)

            # Update report with generated content
            report.progress_summary = report_content.get("progress_summary", "")
            report.workout_feedback = report_content.get("workout_feedback", "")
            report.nutrition_feedback = report_content.get("nutrition_feedback", "")
            report.key_takeaways = report_content.get("key_takeaways", "")
            report.status = "generated"
            report.save()

            return report

        except Exception as e:
            # Handle generation errors
            report.status = "failed"
            report.generation_error = str(e)
            report.save()
            print(f"Error generating progress report: {e}")
            return report

    def _generate_report_content(self, collected_data, report_type):
        """
        Generate report content using OpenAI API.

        Args:
            collected_data: Dictionary containing user data
            report_type: Type of report ("short" or "detailed")

        Returns:
            dict: Report sections (progress_summary, workout_feedback, etc.)
        """
        # Build the prompt based on collected data
        system_prompt = self._build_system_prompt(report_type)
        user_prompt = self._build_user_prompt(collected_data)

        # Call OpenAI API
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.7,
            max_tokens=2000 if report_type == "detailed" else 1000,
        )

        # Parse the AI response
        ai_response = response.choices[0].message.content
        return self._parse_ai_response(ai_response)

    def _build_system_prompt(self, report_type):
        """
        Build the system prompt for the AI.

        Args:
            report_type: Type of report ("short" or "detailed")

        Returns:
            str: System prompt
        """
        length_instruction = (
            "Keep your response concise and to the point (around 500 words total)."
            if report_type == "short"
            else "Provide detailed analysis and comprehensive feedback (around 1000-1500 words total)."
        )

        return self.base_prompt.replace("{LENGTH_INSTRUCTION}", length_instruction)

    def _build_user_prompt(self, collected_data):
        """
        Build the user prompt containing collected data.

        Args:
            collected_data: Dictionary containing user data

        Returns:
            str: User prompt with data
        """
        nutrition_data = collected_data["nutrition_data"]
        workout_data = collected_data["workout_data"]
        user_profile = collected_data["user_profile"]

        prompt_parts = []

        # User Profile Section
        if user_profile:
            prompt_parts.append("=== USER PROFILE ===")

            if "user_profile" in user_profile:
                up = user_profile["user_profile"]
                if up.get("body_goal"):
                    prompt_parts.append(f"Body Goal: {up['body_goal']}")
                if up.get("activity_level"):
                    prompt_parts.append(f"Activity Level: {up['activity_level']}")
                if up.get("current_weight") and up.get("goal_weight"):
                    prompt_parts.append(
                        f"Weight: {up['current_weight']}kg (Goal: {up['goal_weight']}kg)"
                    )
                if up.get("workout_frequency"):
                    prompt_parts.append(
                        f"Target Workout Frequency: {up['workout_frequency']} times/week"
                    )

            if "nutrition_profile" in user_profile:
                np = user_profile["nutrition_profile"]
                if np.get("bmi"):
                    prompt_parts.append(
                        f"BMI: {np['bmi']} ({np.get('bmi_category', 'N/A')})"
                    )
                if np.get("tdee"):
                    prompt_parts.append(f"TDEE: {np['tdee']} kcal/day")

            prompt_parts.append("")

        # Nutrition Data Section
        prompt_parts.append("=== NUTRITION DATA ===")
        if nutrition_data["has_data"]:
            prompt_parts.append(f"Days Tracked: {nutrition_data['period_days']}")
            prompt_parts.append("\nDaily Averages:")
            prompt_parts.append(
                f"- Calories: {nutrition_data['averages']['calories']} kcal "
                f"(Goal: {nutrition_data['goals']['daily_calories_goal']} kcal) "
                f"- Adherence: {nutrition_data['adherence']['calories']}%"
            )
            prompt_parts.append(
                f"- Protein: {nutrition_data['averages']['protein']}g "
                f"(Goal: {nutrition_data['goals']['daily_protein_goal']}g) "
                f"- Adherence: {nutrition_data['adherence']['protein']}%"
            )
            prompt_parts.append(
                f"- Carbs: {nutrition_data['averages']['carbs']}g "
                f"(Goal: {nutrition_data['goals']['daily_carbs_goal']}g) "
                f"- Adherence: {nutrition_data['adherence']['carbs']}%"
            )
            prompt_parts.append(
                f"- Fat: {nutrition_data['averages']['fat']}g "
                f"(Goal: {nutrition_data['goals']['daily_fat_goal']}g) "
                f"- Adherence: {nutrition_data['adherence']['fat']}%"
            )
            prompt_parts.append(
                f"\nOverall Nutrition Adherence: {nutrition_data['adherence']['overall']}%"
            )
        else:
            prompt_parts.append(
                f"No nutrition data available: {nutrition_data['message']}"
            )

        prompt_parts.append("")

        # Workout Data Section
        prompt_parts.append("=== WORKOUT DATA ===")
        if workout_data["has_data"]:
            prompt_parts.append(f"Total Workouts: {workout_data['total_workouts']}")
            prompt_parts.append(
                f"Workout Frequency: {workout_data['workouts_per_week']} workouts/week"
            )
            prompt_parts.append(
                f"Total Exercises: {workout_data['total_exercises_performed']}"
            )
            prompt_parts.append(f"Total Sets: {workout_data['total_sets_performed']}")
            prompt_parts.append(
                f"Total Workout Time: {workout_data['total_workout_minutes']} minutes"
            )
            prompt_parts.append(
                f"Average Workout Duration: {workout_data['average_workout_duration']} minutes"
            )

            # Add top exercises by volume
            if workout_data.get("volume_by_exercise"):
                prompt_parts.append("\nTop Exercises by Volume:")
                sorted_exercises = sorted(
                    workout_data["volume_by_exercise"].items(),
                    key=lambda x: x[1]["total_volume"],
                    reverse=True,
                )[:5]
                for exercise_name, data in sorted_exercises:
                    prompt_parts.append(
                        f"- {exercise_name}: {data['total_volume']} total volume "
                        f"({data['total_sets']} sets, {data['occurrences']} sessions)"
                    )
        else:
            prompt_parts.append(f"No workout data available: {workout_data['message']}")

        prompt_parts.append("")
        prompt_parts.append(
            "Please analyze this data and provide a comprehensive progress report."
        )

        return "\n".join(prompt_parts)

    def _parse_ai_response(self, ai_response):
        """
        Parse the AI response into structured sections.

        Args:
            ai_response: Raw AI response text

        Returns:
            dict: Parsed sections
        """
        sections = {
            "progress_summary": "",
            "workout_feedback": "",
            "nutrition_feedback": "",
            "key_takeaways": "",
        }

        try:
            # Split response by section markers
            parts = ai_response.split("===")

            for i in range(1, len(parts), 2):
                section_name = parts[i].strip().lower().replace("_", "_")
                section_content = parts[i + 1].strip() if i + 1 < len(parts) else ""

                if "progress" in section_name and "summary" in section_name:
                    sections["progress_summary"] = section_content
                elif "workout" in section_name:
                    sections["workout_feedback"] = section_content
                elif "nutrition" in section_name:
                    sections["nutrition_feedback"] = section_content
                elif "key" in section_name and "takeaway" in section_name:
                    sections["key_takeaways"] = section_content

        except Exception as e:
            print(f"Error parsing AI response: {e}")
            # Fallback: put entire response in progress_summary
            sections["progress_summary"] = ai_response

        return sections

    def regenerate_report(self, report_id):
        """
        Regenerate a failed or existing report.

        Args:
            report_id: ID of the report to regenerate

        Returns:
            ProgressReport: Updated report instance
        """
        try:
            report = ProgressReport.objects.get(id=report_id)

            # Generate new report content
            return self.generate_report(
                user=report.user,
                period_start=report.period_start,
                period_end=report.period_end,
                report_type=report.report_type,
            )

        except ProgressReport.DoesNotExist:
            raise ValueError(f"Report with id {report_id} does not exist")
