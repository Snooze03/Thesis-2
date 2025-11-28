import os
from openai import OpenAI  # type: ignore
from datetime import datetime
from django.utils import timezone
from ..models.progress_report import ProgressReport, ProgressReportSettings
from .data_collection_service import DataCollectionService
from .rule_based_analyzer import RuleBasedAnalyzer


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
        # Ensure datetimes are timezone-aware
        if timezone.is_naive(period_start):
            period_start = timezone.make_aware(period_start)
        if timezone.is_naive(period_end):
            period_end = timezone.make_aware(period_end)

        # Create progress report instance with pending status
        report = ProgressReport.objects.create(
            user=user,
            period_start=period_start,
            period_end=period_end,
            report_type=report_type,
            status="pending",
        )

        try:
            # Collect user data - with period parameters for progress reports
            data_service = DataCollectionService(user, period_start, period_end)
            collected_data = data_service.collect_all_data()

            print(f"[ReportService] Data collected for user {user.email}")

            # Check if there's enough data to generate a report
            has_nutrition = collected_data["nutrition_data"]["has_data"]
            has_workouts = collected_data["workout_data"]["has_data"]

            if not has_nutrition and not has_workouts:
                print(f"[ReportService] Insufficient data for user {user.email}")
                report.status = "failed"
                report.generation_error = "Insufficient data: No nutrition or workout data found for this period"
                report.save()
                return report

            print(f"[ReportService] Running rule-based analysis for user {user.email}")

            # Apply rule-based analysis WITH period information
            rule_analyzer = RuleBasedAnalyzer(
                period_start=period_start, period_end=period_end
            )
            rule_based_insights = rule_analyzer.analyze_all(collected_data)
            collected_data["rule_based_insights"] = rule_based_insights

            print(f"[ReportService] Generating AI report content for user {user.email}")

            # Generate report sections using AI
            report_content = self._generate_report_content(collected_data, report_type)

            print(f"[ReportService] AI content generated for user {user.email}")

            # Update report with generated content
            report.progress_summary = report_content.get("progress_summary", "")
            report.workout_feedback = report_content.get("workout_feedback", "")
            report.workout_frequency = report_content.get("workout_frequency", "")
            report.workout_duration = report_content.get("workout_duration", "")
            report.workout_recommendations = report_content.get(
                "workout_recommendations", ""
            )
            report.nutrition_feedback = report_content.get("nutrition_feedback", "")
            report.nutrition_adherence = report_content.get("nutrition_adherence", "")
            report.nutrition_intake = report_content.get("nutrition_intake", "")
            report.nutrition_recommendations = report_content.get(
                "nutrition_recommendations", ""
            )
            report.key_takeaways = report_content.get("key_takeaways", "")
            report.status = "generated"
            report.save()

            print(f"[ReportService] Report {report.id} saved for user {user.email}")

            # Update user's progress report settings
            settings, created = ProgressReportSettings.objects.get_or_create(
                user=user,
                defaults={
                    "day_interval": 7,
                    "report_type": "short",
                    "is_enabled": True,
                },
            )
            # Set last_generated_at to current datetime
            current_time = timezone.now()
            settings.last_generated_at = current_time
            settings.save(update_fields=["last_generated_at"])

            # Update next generation date (converts datetime to date automatically)
            settings.update_next_generation_date()

            print(
                f"[ReportService] Successfully completed report for user {user.email}"
            )

            return report

        except Exception as e:
            # Handle generation errors
            print(
                f"[ReportService] ERROR generating report for user {user.email}: {str(e)}"
            )
            import traceback

            traceback.print_exc()

            report.status = "failed"
            report.generation_error = str(e)
            report.save()
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

        print(f"[ReportService] Calling LLM API...")

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

        print(f"[ReportService] LLM API response received")

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
        Build the user prompt containing collected data from DataCollectionService.

        Args:
            collected_data: Dictionary containing user data

        Returns:
            str: User prompt with data
        """
        nutrition_data = collected_data["nutrition_data"]
        workout_data = collected_data["workout_data"]
        user_profile = collected_data["user_profile"]
        rule_based_insights = collected_data.get("rule_based_insights", {})

        prompt_parts = []

        # User Profile Section
        prompt_parts.append("=== USER PROFILE ===")

        if user_profile.get("has_data"):
            if "user_profile" in user_profile:
                up = user_profile["user_profile"]

                # Display the 10 essential fields
                if up.get("gender"):
                    prompt_parts.append(f"Gender: {up['gender']}")
                if up.get("age"):
                    prompt_parts.append(f"Age: {up['age']} years")
                if up.get("body_goal"):
                    prompt_parts.append(f"Body Goal: {up['body_goal']}")
                if up.get("activity_level"):
                    prompt_parts.append(f"Activity Level: {up['activity_level']}")
                if up.get("starting_weight"):
                    prompt_parts.append(f"Starting Weight: {up['starting_weight']} kg")
                if up.get("current_weight"):
                    prompt_parts.append(f"Current Weight: {up['current_weight']} kg")
                if up.get("goal_weight"):
                    prompt_parts.append(f"Goal Weight: {up['goal_weight']} kg")
                if up.get("workout_frequency"):
                    prompt_parts.append(
                        f"Target Workout Frequency: {up['workout_frequency']}"
                    )
                if up.get("workout_location"):
                    prompt_parts.append(f"Workout Location: {up['workout_location']}")
                if up.get("injuries"):
                    prompt_parts.append(
                        f"Injuries/Medical Conditions: {up['injuries']}"
                    )
                if up.get("food_allergies"):
                    prompt_parts.append(
                        f"Food Allergies/Restrictions: {up['food_allergies']}"
                    )

            if "nutrition_profile" in user_profile:
                np = user_profile["nutrition_profile"]
                prompt_parts.append("\nNutrition Profile:")
                if np.get("daily_calories_goal"):
                    prompt_parts.append(
                        f"- Daily Calorie Goal: {np['daily_calories_goal']} kcal"
                    )
                if np.get("daily_protein_goal"):
                    prompt_parts.append(
                        f"- Daily Protein Goal: {np['daily_protein_goal']}g"
                    )
                if np.get("daily_carbs_goal"):
                    prompt_parts.append(
                        f"- Daily Carbs Goal: {np['daily_carbs_goal']}g"
                    )
                if np.get("daily_fat_goal"):
                    prompt_parts.append(f"- Daily Fat Goal: {np['daily_fat_goal']}g")
                if np.get("bmi"):
                    prompt_parts.append(
                        f"- BMI: {np['bmi']} ({np.get('bmi_category', 'N/A')})"
                    )
                if np.get("bmr"):
                    prompt_parts.append(f"- BMR: {np['bmr']} kcal/day")
                if np.get("tdee"):
                    prompt_parts.append(f"- TDEE: {np['tdee']} kcal/day")
        else:
            prompt_parts.append("No user profile data available")

        prompt_parts.append("")

        prompt_parts.append("=== NUTRITION DATA ===")
        if nutrition_data["has_data"]:
            prompt_parts.append(f"Days Tracked: {nutrition_data['total_days_tracked']}")
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

        # RULE-BASED ANALYSIS SECTION
        if rule_based_insights:
            prompt_parts.append("=" * 60)
            prompt_parts.append("=== RULE-BASED ANALYSIS ===")
            prompt_parts.append("=" * 60)

            # Create a new rule analyzer instance just for summary
            from .rule_based_analyzer import RuleBasedAnalyzer

            temp_analyzer = RuleBasedAnalyzer()
            insights_summary = temp_analyzer.get_summary_insights(rule_based_insights)
            prompt_parts.append(insights_summary)

            prompt_parts.append("\n" + "=" * 60)
            prompt_parts.append("IMPORTANT: Use the rule-based analysis above to:")
            prompt_parts.append("1. Validate your assessments with concrete metrics")
            prompt_parts.append(
                "2. Incorporate specific recommendations into your feedback"
            )
            prompt_parts.append(
                "3. Ensure your advice aligns with the identified priorities"
            )
            prompt_parts.append("=" * 60)

        prompt_parts.append(
            "\nPlease analyze this data and provide a comprehensive progress report that aligns with the user's body goal."
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
            "workout_frequency": "",
            "workout_duration": "",
            "workout_recommendations": "",
            "nutrition_feedback": "",
            "nutrition_adherence": "",
            "nutrition_intake": "",
            "nutrition_recommendations": "",
            "key_takeaways": "",
        }

        try:
            # Split response by section markers
            parts = ai_response.split("===")

            for i in range(1, len(parts), 2):
                section_name = parts[i].strip().lower().replace(" ", "_")
                section_content = parts[i + 1].strip() if i + 1 < len(parts) else ""

                # Match sections
                if "progress_summary" in section_name or "progress" in section_name:
                    sections["progress_summary"] = section_content
                elif "workout_feedback" in section_name:
                    sections["workout_feedback"] = section_content
                elif "workout_frequency" in section_name:
                    sections["workout_frequency"] = section_content
                elif (
                    "average_duration" in section_name
                    or "workout_duration" in section_name
                ):
                    sections["workout_duration"] = section_content
                elif "workout_recommendations" in section_name:
                    sections["workout_recommendations"] = section_content
                elif "nutrition_feedback" in section_name:
                    sections["nutrition_feedback"] = section_content
                elif (
                    "adherence_rate" in section_name
                    or "nutrition_adherence" in section_name
                ):
                    sections["nutrition_adherence"] = section_content
                elif (
                    "average_daily_intake" in section_name
                    or "nutrition_intake" in section_name
                ):
                    sections["nutrition_intake"] = section_content
                elif "nutrition_recommendations" in section_name:
                    sections["nutrition_recommendations"] = section_content
                elif "key_takeaway" in section_name or "takeaway" in section_name:
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
