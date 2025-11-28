from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from ...models.progress_report import ProgressReportSettings
from ...services.progress_report_service import ReportGenerationService
from ...services.data_collection_service import DataCollectionService
from ...services.rule_based_analyzer import RuleBasedAnalyzer
from datetime import timedelta, datetime, time

User = get_user_model()


class Command(BaseCommand):
    help = "Test progress report generation with rule-based analysis visibility"

    def add_arguments(self, parser):
        parser.add_argument(
            "--user-id",
            type=int,
            help="User ID to generate report for",
        )
        parser.add_argument(
            "--user-email",
            type=str,
            help="User email to generate report for",
        )
        parser.add_argument(
            "--days",
            type=int,
            default=7,
            help="Number of days to include in report (default: 7)",
        )
        parser.add_argument(
            "--report-type",
            type=str,
            default="short",
            choices=["short", "detailed"],
            help="Type of report to generate",
        )
        parser.add_argument(
            "--show-insights",
            action="store_true",
            help="Show detailed rule-based insights before generating report",
        )
        parser.add_argument(
            "--insights-only",
            action="store_true",
            help="Show only rule-based insights without generating AI report",
        )
        parser.add_argument(
            "--show-data-summary",
            action="store_true",
            help="Show the complete data summary text used for AI context",
        )

    def handle(self, *args, **options):
        user_id = options.get("user_id")
        user_email = options.get("user_email")
        days = options.get("days")
        report_type = options.get("report_type")
        show_insights = options.get("show_insights")
        insights_only = options.get("insights_only")
        show_data_summary = options.get("show_data_summary")

        # Get user
        try:
            if user_id:
                user = User.objects.get(id=user_id)
            elif user_email:
                user = User.objects.get(email=user_email)
            else:
                # Get first user if no ID or email specified
                user = User.objects.first()
                if not user:
                    self.stdout.write(self.style.ERROR("No users found in database"))
                    return
        except User.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(
                    f"User not found with {'ID ' + str(user_id) if user_id else 'email ' + user_email}"
                )
            )
            return

        self.stdout.write(self.style.SUCCESS(f"\n{'='*80}"))
        self.stdout.write(self.style.SUCCESS(f"Progress Report Generation Test"))
        self.stdout.write(self.style.SUCCESS(f"{'='*80}\n"))
        self.stdout.write(f"User: {user.email} (ID: {user.id})")

        # Use progress report settings for start and end dates
        try:
            settings = ProgressReportSettings.objects.get(user=user)
            # Convert date to datetime at end of day for period_end
            period_end_date = settings.next_generation_date
            period_end = timezone.make_aware(
                datetime.combine(period_end_date, time(23, 59, 59))
            )

            # Use last_generated_at if available, otherwise calculate from period_end
            if settings.last_generated_at:
                period_start = settings.last_generated_at
            else:
                period_start = period_end - timedelta(days=days)
        except ProgressReportSettings.DoesNotExist:
            period_end = timezone.now()
            period_start = period_end - timedelta(days=days)

        self.stdout.write(self.style.SUCCESS(f"\n{'='*80}"))
        self.stdout.write(self.style.SUCCESS(f"Report Date Parameters"))
        self.stdout.write(self.style.SUCCESS(f"{'='*80}\n"))
        self.stdout.write(f"Period Type: Time-bounded (for progress reports)")
        self.stdout.write(f"Start: {period_start}")
        self.stdout.write(f"End: {period_end}")
        self.stdout.write(f"Duration: {(period_end - period_start).days} days")

        try:
            # Collect data using DataCollectionService with period parameters
            self.stdout.write(self.style.WARNING("\nCollecting user data..."))
            data_service = DataCollectionService(user, period_start, period_end)
            collected_data = data_service.collect_all_data()

            # Show data summary if requested
            if show_data_summary:
                self._display_data_summary(data_service)

            # Display user profile data from collected data
            self._display_user_profile(collected_data.get("user_profile", {}))

            # Display basic collected data statistics
            self._display_collected_data_stats(collected_data)

            # Run rule-based analysis
            self.stdout.write(self.style.WARNING("\nRunning rule-based analysis...\n"))
            analyzer = RuleBasedAnalyzer(
                period_start=period_start, period_end=period_end
            )
            rule_based_insights = analyzer.analyze_all(collected_data)

            # Display rule-based insights
            if show_insights or insights_only:
                self._display_rule_based_insights(rule_based_insights)

            # Stop here if insights_only flag is set
            if insights_only:
                self.stdout.write(
                    self.style.SUCCESS(
                        "\n✓ Rule-based analysis completed. Skipping AI generation."
                    )
                )
                return

            # Generate AI report
            self.stdout.write(self.style.WARNING("\nGenerating AI report...\n"))
            service = ReportGenerationService()

            report = service.generate_report(
                user=user,
                period_start=period_start,
                period_end=period_end,
                report_type=report_type,
            )

            # Display results
            self.stdout.write(self.style.SUCCESS(f"\n{'='*80}"))
            self.stdout.write(self.style.SUCCESS("REPORT GENERATION RESULT"))
            self.stdout.write(self.style.SUCCESS(f"{'='*80}\n"))

            if report.status == "generated":
                self.stdout.write(
                    self.style.SUCCESS("✓ Report generated successfully!")
                )
                self.stdout.write(f"Report ID: {report.id}")
                self.stdout.write(f"Status: {report.status}")
                self.stdout.write(f"Type: {report.report_type}\n")

                self._display_ai_report(report)

                # Show comparison if insights were displayed
                if show_insights:
                    self._display_comparison_analysis(rule_based_insights, report)

            elif report.status == "failed":
                self.stdout.write(
                    self.style.ERROR(
                        f"✗ Report generation failed: {report.generation_error}"
                    )
                )
            else:
                self.stdout.write(self.style.WARNING(f"Report status: {report.status}"))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"\n✗ Error: {str(e)}"))
            import traceback

            traceback.print_exc()

    def _display_data_summary(self, data_service):
        """Display the complete data summary text used for AI context"""
        self.stdout.write(self.style.SUCCESS(f"\n{'='*80}"))
        self.stdout.write(self.style.SUCCESS("DATA SUMMARY TEXT (AI Context)"))
        self.stdout.write(self.style.SUCCESS(f"{'='*80}\n"))

        summary_text = data_service.get_summary_text()
        self.stdout.write(summary_text)

    def _display_collected_data_stats(self, collected_data):
        """Display statistics about collected data"""
        self.stdout.write(self.style.SUCCESS(f"\n{'='*80}"))
        self.stdout.write(self.style.SUCCESS("COLLECTED DATA STATISTICS"))
        self.stdout.write(self.style.SUCCESS(f"{'='*80}"))

        # Nutrition data stats
        nutrition = collected_data.get("nutrition_data", {})
        if nutrition.get("has_data"):
            self.stdout.write(self.style.WARNING("\n📊 Nutrition Data:"))
            self.stdout.write(f"  - Days tracked: {nutrition['total_days_tracked']}")
            self.stdout.write(
                f"  - Overall adherence: {nutrition['adherence']['overall']}%"
            )
            self.stdout.write(
                f"  - Average calories: {nutrition['averages']['calories']} kcal"
            )
            self.stdout.write(
                f"  - Mode: {'Full History' if nutrition.get('is_full_history') else 'Period-based'}"
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f"\n📊 Nutrition Data: {nutrition.get('message', 'No data')}"
                )
            )

        # Workout data stats
        workout = collected_data.get("workout_data", {})
        if workout.get("has_data"):
            self.stdout.write(self.style.WARNING("\n💪 Workout Data:"))
            self.stdout.write(f"  - Total workouts: {workout['total_workouts']}")
            self.stdout.write(
                f"  - Workout frequency: {workout['workouts_per_week']} per week"
            )
            self.stdout.write(
                f"  - Total exercises: {workout['total_exercises_performed']}"
            )
            self.stdout.write(
                f"  - Mode: {'Full History' if workout.get('is_full_history') else 'Period-based'}"
            )
        else:
            self.stdout.write(
                self.style.WARNING(
                    f"\n💪 Workout Data: {workout.get('message', 'No data')}"
                )
            )

        # Profile data stats
        profile = collected_data.get("user_profile", {})
        if profile.get("has_data"):
            self.stdout.write(self.style.WARNING("\n👤 Profile Data:"))
            up = profile.get("user_profile", {})
            np = profile.get("nutrition_profile", {})

            fields_collected = sum(1 for v in {**up, **np}.values() if v is not None)
            self.stdout.write(f"  - Profile fields collected: {fields_collected}")
            if up.get("age"):
                self.stdout.write(f"  - User age: {up['age']} years")
            if np.get("bmi"):
                self.stdout.write(
                    f"  - BMI: {np['bmi']} ({np.get('bmi_category', 'N/A')})"
                )
        else:
            self.stdout.write(self.style.WARNING("\n👤 Profile Data: Not available"))

    def _display_user_profile(self, user_profile):
        """Display user profile data collected by DataCollectionService"""
        self.stdout.write(self.style.SUCCESS(f"\n{'='*80}"))
        self.stdout.write(
            self.style.SUCCESS("USER PROFILE DATA (from DataCollectionService)")
        )
        self.stdout.write(self.style.SUCCESS(f"{'='*80}"))

        if not user_profile.get("has_data"):
            self.stdout.write("\n⚠️ No user profile data available")
            return

        # Display the 10 essential profile fields
        if "user_profile" in user_profile:
            up = user_profile["user_profile"]
            self.stdout.write("\n👤 User Profile (10 Essential Fields):")

            fields_map = {
                "gender": "Gender",
                "activity_level": "Activity Level",
                "starting_weight": "Starting Weight (kg)",
                "current_weight": "Current Weight (kg)",
                "goal_weight": "Goal Weight (kg)",
                "injuries": "Injuries/Medical Conditions",
                "food_allergies": "Food Allergies/Restrictions",
                "workout_frequency": "Workout Frequency",
                "workout_location": "Workout Location",
                "age": "Age (years)",
            }

            for key, label in fields_map.items():
                value = up.get(key)
                if value is not None:
                    self.stdout.write(f"  ✓ {label}: {value}")
                else:
                    self.stdout.write(self.style.ERROR(f"  ✗ {label}: Not set"))

            # Also show body_goal if available
            if up.get("body_goal"):
                self.stdout.write(f"  • Body Goal: {up['body_goal']}")

        # Display nutrition profile
        if "nutrition_profile" in user_profile:
            np = user_profile["nutrition_profile"]
            self.stdout.write("\n🥗 Nutrition Profile:")
            if np.get("daily_calories_goal"):
                self.stdout.write(
                    f"  - Daily Calorie Goal: {np['daily_calories_goal']} kcal"
                )
            if np.get("daily_protein_goal"):
                self.stdout.write(
                    f"  - Daily Protein Goal: {np['daily_protein_goal']}g"
                )
            if np.get("bmi"):
                self.stdout.write(
                    f"  - BMI: {np['bmi']} ({np.get('bmi_category', 'N/A')})"
                )
            if np.get("bmr"):
                self.stdout.write(f"  - BMR: {np['bmr']} kcal/day")
            if np.get("tdee"):
                self.stdout.write(f"  - TDEE: {np['tdee']} kcal/day")

        self.stdout.write("")

    def _display_rule_based_insights(self, insights):
        """Display rule-based insights in a formatted way"""
        self.stdout.write(self.style.SUCCESS(f"\n{'='*80}"))
        self.stdout.write(self.style.SUCCESS("RULE-BASED ANALYSIS INSIGHTS"))
        self.stdout.write(self.style.SUCCESS(f"{'='*80}"))

        # Nutrition Insights
        if insights["nutrition_insights"]["status"] == "analyzed":
            ni = insights["nutrition_insights"]
            self.stdout.write(self.style.WARNING("\n📊 NUTRITION INSIGHTS:"))
            self.stdout.write(f"Overall Adherence: {ni['overall_adherence']:.1f}%")

            if ni["insights"]:
                for insight in ni["insights"]:
                    icon = self._get_insight_icon(insight["type"])
                    self.stdout.write(
                        f"{icon} [{insight['type'].upper()}] {insight['message']}"
                    )
            else:
                self.stdout.write("  No specific insights available")

            # Key metrics
            self.stdout.write("\nKey Metrics:")
            for key, value in ni["key_metrics"].items():
                self.stdout.write(f"  - {key}: {value:.1f}%")

        else:
            self.stdout.write(
                self.style.WARNING(
                    f"\n📊 NUTRITION INSIGHTS: {insights['nutrition_insights']['status']}"
                )
            )

        # Workout Insights
        if insights["workout_insights"]["status"] == "analyzed":
            wi = insights["workout_insights"]
            self.stdout.write(self.style.WARNING("\n💪 WORKOUT INSIGHTS:"))

            if wi["insights"]:
                for insight in wi["insights"]:
                    icon = self._get_insight_icon(insight["type"])
                    self.stdout.write(
                        f"{icon} [{insight['type'].upper()}] {insight['message']}"
                    )
            else:
                self.stdout.write("  No specific insights available")

            # Key metrics
            self.stdout.write("\nKey Metrics:")
            for key, value in wi["key_metrics"].items():
                self.stdout.write(f"  - {key}: {value}")

        else:
            self.stdout.write(
                self.style.WARNING(
                    f"\n💪 WORKOUT INSIGHTS: {insights['workout_insights']['status']}"
                )
            )

        # Overall Recommendations
        if insights["overall_recommendations"]:
            self.stdout.write(self.style.WARNING("\n🎯 OVERALL RECOMMENDATIONS:"))
            for rec in insights["overall_recommendations"]:
                priority_color = {
                    "high": self.style.ERROR,
                    "medium": self.style.WARNING,
                    "low": self.style.SUCCESS,
                }
                color = priority_color.get(rec["priority"], lambda x: x)
                self.stdout.write(
                    color(f"  [{rec['priority'].upper()}] {rec['recommendation']}")
                )
        else:
            self.stdout.write(
                self.style.WARNING("\n🎯 OVERALL RECOMMENDATIONS: None generated")
            )

    def _display_ai_report(self, report):
        """Display AI-generated report sections"""
        self.stdout.write(self.style.SUCCESS(f"\n{'='*80}"))
        self.stdout.write(self.style.SUCCESS("AI-GENERATED REPORT"))
        self.stdout.write(self.style.SUCCESS(f"{'='*80}"))

        if report.progress_summary:
            self.stdout.write(self.style.WARNING("\n📝 PROGRESS SUMMARY:"))
            self.stdout.write(report.progress_summary)

        if report.workout_feedback:
            self.stdout.write(self.style.WARNING("\n💪 WORKOUT FEEDBACK:"))
            self.stdout.write(report.workout_feedback)

        if report.workout_frequency:
            self.stdout.write(self.style.WARNING("\n📊 WORKOUT FREQUENCY:"))
            self.stdout.write(report.workout_frequency)

        if report.workout_duration:
            self.stdout.write(self.style.WARNING("\n⏱️ WORKOUT DURATION:"))
            self.stdout.write(report.workout_duration)

        if report.workout_recommendations:
            self.stdout.write(self.style.WARNING("\n💡 WORKOUT RECOMMENDATIONS:"))
            self.stdout.write(report.workout_recommendations)

        if report.nutrition_feedback:
            self.stdout.write(self.style.WARNING("\n🥗 NUTRITION FEEDBACK:"))
            self.stdout.write(report.nutrition_feedback)

        if report.nutrition_adherence:
            self.stdout.write(self.style.WARNING("\n📈 NUTRITION ADHERENCE:"))
            self.stdout.write(report.nutrition_adherence)

        if report.nutrition_intake:
            self.stdout.write(self.style.WARNING("\n🍽️ NUTRITION INTAKE:"))
            self.stdout.write(report.nutrition_intake)

        if report.nutrition_recommendations:
            self.stdout.write(self.style.WARNING("\n💡 NUTRITION RECOMMENDATIONS:"))
            self.stdout.write(report.nutrition_recommendations)

        if report.key_takeaways:
            self.stdout.write(self.style.WARNING("\n🎯 KEY TAKEAWAYS:"))
            self.stdout.write(report.key_takeaways)

    def _display_comparison_analysis(self, rule_insights, report):
        """Compare rule-based insights with AI report to verify integration"""
        self.stdout.write(self.style.SUCCESS(f"\n{'='*80}"))
        self.stdout.write(self.style.SUCCESS("INTEGRATION VERIFICATION"))
        self.stdout.write(self.style.SUCCESS(f"{'='*80}\n"))

        # Check if key rule-based terms appear in AI report
        full_report_text = (
            f"{report.progress_summary} {report.workout_feedback} "
            f"{report.nutrition_feedback} {report.key_takeaways}"
        ).lower()

        # Check nutrition insights
        if rule_insights["nutrition_insights"]["status"] == "analyzed":
            ni = rule_insights["nutrition_insights"]
            adherence = ni["overall_adherence"]

            self.stdout.write("Checking nutrition insights integration:")
            if (
                str(int(adherence)) in full_report_text
                or f"{adherence:.0f}" in full_report_text
            ):
                self.stdout.write(
                    self.style.SUCCESS("  ✓ Adherence percentage mentioned")
                )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        "  ⚠ Adherence percentage not explicitly mentioned"
                    )
                )

        # Check workout insights
        if rule_insights["workout_insights"]["status"] == "analyzed":
            wi = rule_insights["workout_insights"]
            freq = wi["key_metrics"]["workout_frequency"]

            self.stdout.write("\nChecking workout insights integration:")
            if "workout" in full_report_text and "frequency" in full_report_text:
                self.stdout.write(self.style.SUCCESS("  ✓ Workout frequency discussed"))
            else:
                self.stdout.write(
                    self.style.WARNING("  ⚠ Workout frequency not explicitly discussed")
                )

        # Check recommendations
        if rule_insights["overall_recommendations"]:
            self.stdout.write("\nChecking recommendations integration:")
            recommendation_keywords = set()
            for rec in rule_insights["overall_recommendations"]:
                words = rec["recommendation"].lower().split()
                recommendation_keywords.update(
                    [w for w in words if len(w) > 5][:3]
                )  # Get key terms

            matched = sum(
                1 for keyword in recommendation_keywords if keyword in full_report_text
            )
            total = len(recommendation_keywords)

            if matched > 0:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"  ✓ {matched}/{total} recommendation keywords found in report"
                    )
                )
            else:
                self.stdout.write(
                    self.style.WARNING("  ⚠ Recommendation keywords not found")
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"\n{'='*80}\n"
                "Note: AI may paraphrase insights rather than use exact wording.\n"
                "Review the report content to verify insights are incorporated meaningfully."
            )
        )

    def _get_insight_icon(self, insight_type):
        """Get emoji icon for insight type"""
        icons = {
            "excellent": "🌟",
            "success": "✅",
            "good": "👍",
            "moderate": "⚡",
            "info": "ℹ️",
            "warning": "⚠️",
            "caution": "⚠️",
            "needs_improvement": "📈",
            "improvement": "💡",
        }
        return icons.get(insight_type, "•")
