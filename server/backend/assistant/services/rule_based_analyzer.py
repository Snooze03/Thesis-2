class RuleBasedAnalyzer:
    """
    Rule-based analysis engine for fitness and nutrition data.
    Provides objective insights and recommendations based on predefined thresholds.
    """

    def __init__(self, period_start=None, period_end=None):
        """
        Initialize the analyzer with period information.

        Args:
            period_start: Start datetime of reporting period
            period_end: End datetime of reporting period
        """
        self.period_start = period_start
        self.period_end = period_end

    def analyze_all(self, collected_data):
        """
        Apply rule-based analysis to all collected data.

        Args:
            collected_data: Dictionary containing user data

        Returns:
            dict: Rule-based insights and recommendations
        """
        insights = {
            "nutrition_insights": self._analyze_nutrition_rules(
                collected_data["nutrition_data"]
            ),
            "workout_insights": self._analyze_workout_rules(
                collected_data["workout_data"]
            ),
            "overall_recommendations": [],
        }

        # Generate overall recommendations based on combined data
        insights["overall_recommendations"] = self._generate_overall_recommendations(
            collected_data, insights
        )

        return insights

    def _get_total_period_days(self):
        """
        Calculate total days in the reporting period.

        Returns:
            int: Number of days in period
        """
        if self.period_start and self.period_end:
            return (self.period_end - self.period_start).days + 1
        return 7  # Default fallback

    def _analyze_nutrition_rules(self, nutrition_data):
        """
        Apply nutrition-specific rules and thresholds.

        Args:
            nutrition_data: Nutrition data dictionary

        Returns:
            dict: Nutrition insights
        """
        if not nutrition_data["has_data"]:
            return {"status": "insufficient_data", "insights": []}

        insights = []
        adherence = nutrition_data["adherence"]
        averages = nutrition_data["averages"]
        goals = nutrition_data["goals"]

        # Rule 1: Overall adherence rating
        overall_adherence = adherence["overall"]
        if overall_adherence >= 90:
            insights.append(
                {
                    "type": "excellent",
                    "message": "Exceptional nutrition adherence - you're consistently meeting your goals!",
                }
            )
        elif overall_adherence >= 75:
            insights.append(
                {
                    "type": "good",
                    "message": "Strong nutrition adherence - minor adjustments can help you reach your goals.",
                }
            )
        elif overall_adherence >= 50:
            insights.append(
                {
                    "type": "moderate",
                    "message": "Moderate nutrition adherence - focus on consistency to see better results.",
                }
            )
        else:
            insights.append(
                {
                    "type": "needs_improvement",
                    "message": "Nutrition tracking needs significant improvement for optimal results.",
                }
            )

        # Rule 2: Protein intake analysis
        protein_adherence = adherence["protein"]
        if protein_adherence < 80:
            deficit = goals["daily_protein_goal"] - averages["protein"]
            insights.append(
                {
                    "type": "warning",
                    "category": "protein",
                    "message": f"Protein intake is below target by {deficit:.1f}g/day. Increase protein-rich foods.",
                }
            )
        elif protein_adherence >= 95:
            insights.append(
                {
                    "type": "success",
                    "category": "protein",
                    "message": "Excellent protein intake - supporting muscle growth and recovery.",
                }
            )

        # Rule 3: Calorie intake analysis
        calorie_adherence = adherence["calories"]
        avg_calories = averages["calories"]
        goal_calories = goals["daily_calories_goal"]

        if calorie_adherence < 85:
            deficit = goal_calories - avg_calories
            insights.append(
                {
                    "type": "warning",
                    "category": "calories",
                    "message": f"Calorie intake is {deficit:.0f} kcal/day below target. This may slow progress.",
                }
            )
        elif calorie_adherence > 110:
            surplus = avg_calories - goal_calories
            insights.append(
                {
                    "type": "warning",
                    "category": "calories",
                    "message": f"Calorie intake is {surplus:.0f} kcal/day above target. Consider portion control.",
                }
            )

        # Rule 4: Macronutrient balance
        if avg_calories > 0:
            protein_ratio = (averages["protein"] * 4) / avg_calories * 100
            carbs_ratio = (averages["carbs"] * 4) / avg_calories * 100
            fat_ratio = (averages["fat"] * 9) / avg_calories * 100

            if protein_ratio < 15:
                insights.append(
                    {
                        "type": "warning",
                        "category": "macros",
                        "message": f"Protein ratio is low ({protein_ratio:.1f}%). Aim for at least 15-30%.",
                    }
                )

            if fat_ratio < 20:
                insights.append(
                    {
                        "type": "warning",
                        "category": "macros",
                        "message": f"Fat ratio is low ({fat_ratio:.1f}%). Healthy fats are essential for hormone production.",
                    }
                )
            elif fat_ratio > 40:
                insights.append(
                    {
                        "type": "caution",
                        "category": "macros",
                        "message": f"Fat ratio is high ({fat_ratio:.1f}%). Consider balancing with more protein/carbs.",
                    }
                )

        # Rule 5: Consistency tracking - NOW USES PERIOD
        days_tracked = nutrition_data["period_days"]
        total_period_days = self._get_total_period_days()

        tracking_rate = (
            (days_tracked / total_period_days * 100) if total_period_days > 0 else 0
        )

        if tracking_rate < 70:
            insights.append(
                {
                    "type": "improvement",
                    "category": "consistency",
                    "message": f"Only {days_tracked} of {total_period_days} days tracked ({tracking_rate:.0f}%). Aim for daily tracking.",
                }
            )
        elif tracking_rate >= 90:
            insights.append(
                {
                    "type": "success",
                    "category": "consistency",
                    "message": f"Excellent tracking consistency ({tracking_rate:.0f}%)! This data quality enables better insights.",
                }
            )

        # Rule 6: Carbohydrate intake (for active individuals)
        carbs_adherence = adherence["carbs"]
        if carbs_adherence < 70:
            insights.append(
                {
                    "type": "info",
                    "category": "carbs",
                    "message": "Low carb intake may affect workout performance and recovery.",
                }
            )

        return {
            "status": "analyzed",
            "overall_adherence": overall_adherence,
            "insights": insights,
            "key_metrics": {
                "protein_adherence": protein_adherence,
                "calorie_adherence": calorie_adherence,
                "tracking_consistency": tracking_rate,
            },
        }

    def _analyze_workout_rules(self, workout_data):
        """
        Apply workout-specific rules and thresholds.

        Args:
            workout_data: Workout data dictionary

        Returns:
            dict: Workout insights
        """
        if not workout_data["has_data"]:
            return {"status": "insufficient_data", "insights": []}

        insights = []
        total_workouts = workout_data["total_workouts"]
        workouts_per_week = workout_data["workouts_per_week"]
        avg_duration = workout_data["average_workout_duration"]
        total_period_days = self._get_total_period_days()

        # Rule 1: Workout frequency analysis
        if workouts_per_week >= 5:
            insights.append(
                {
                    "type": "excellent",
                    "message": f"Outstanding workout frequency ({workouts_per_week:.1f} workouts/week)!",
                }
            )
        elif workouts_per_week >= 3:
            insights.append(
                {
                    "type": "good",
                    "message": f"Good workout frequency ({workouts_per_week:.1f} workouts/week). Consistent effort!",
                }
            )
        elif workouts_per_week >= 2:
            insights.append(
                {
                    "type": "moderate",
                    "message": f"Moderate frequency ({workouts_per_week:.1f} workouts/week). Aim for 3-5 for optimal results.",
                }
            )
        else:
            insights.append(
                {
                    "type": "needs_improvement",
                    "message": f"Low workout frequency ({workouts_per_week:.1f} workouts/week). Increase to at least 2-3/week.",
                }
            )

        # Rule 2: Workout duration analysis
        if avg_duration < 30:
            insights.append(
                {
                    "type": "warning",
                    "category": "duration",
                    "message": f"Average workout duration is short ({avg_duration:.1f} min). Consider longer sessions (45-60 min).",
                }
            )
        elif avg_duration > 90:
            insights.append(
                {
                    "type": "caution",
                    "category": "duration",
                    "message": f"Long workouts ({avg_duration:.1f} min). Ensure adequate recovery and avoid overtraining.",
                }
            )
        else:
            insights.append(
                {
                    "type": "success",
                    "category": "duration",
                    "message": f"Optimal workout duration ({avg_duration:.1f} min).",
                }
            )

        # Rule 3: Volume analysis
        if workout_data.get("volume_by_exercise"):
            total_volume = sum(
                data["total_volume"]
                for data in workout_data["volume_by_exercise"].values()
            )
            avg_volume_per_workout = (
                total_volume / total_workouts if total_workouts > 0 else 0
            )

            if avg_volume_per_workout > 0:
                insights.append(
                    {
                        "type": "info",
                        "category": "volume",
                        "message": f"Average training volume: {avg_volume_per_workout:.0f} per workout.",
                    }
                )

        # Rule 4: Exercise variety
        unique_exercises = len(workout_data.get("volume_by_exercise", {}))
        if unique_exercises < 5:
            insights.append(
                {
                    "type": "improvement",
                    "category": "variety",
                    "message": f"Limited exercise variety ({unique_exercises} exercises). Add more for balanced development.",
                }
            )
        elif unique_exercises >= 10:
            insights.append(
                {
                    "type": "success",
                    "category": "variety",
                    "message": f"Great exercise variety ({unique_exercises} exercises) for comprehensive training.",
                }
            )
        else:
            insights.append(
                {
                    "type": "good",
                    "category": "variety",
                    "message": f"Good exercise variety ({unique_exercises} exercises).",
                }
            )

        # Rule 5: Total sets analysis
        total_sets = workout_data.get("total_sets_performed", 0)
        avg_sets_per_workout = total_sets / total_workouts if total_workouts > 0 else 0

        if avg_sets_per_workout < 10:
            insights.append(
                {
                    "type": "warning",
                    "category": "volume",
                    "message": f"Low average sets per workout ({avg_sets_per_workout:.1f}). Consider increasing training volume.",
                }
            )
        elif avg_sets_per_workout > 30:
            insights.append(
                {
                    "type": "caution",
                    "category": "volume",
                    "message": f"High average sets per workout ({avg_sets_per_workout:.1f}). Monitor recovery to avoid overtraining.",
                }
            )

        # Rule 6: Workout consistency over period
        workout_consistency = (
            (total_workouts / total_period_days * 100) if total_period_days > 0 else 0
        )
        insights.append(
            {
                "type": "info",
                "category": "consistency",
                "message": f"Completed {total_workouts} workouts in {total_period_days} days ({workout_consistency:.1f}% of days active).",
            }
        )

        return {
            "status": "analyzed",
            "insights": insights,
            "key_metrics": {
                "workout_frequency": workouts_per_week,
                "average_duration": avg_duration,
                "total_workouts": total_workouts,
                "exercise_variety": unique_exercises,
                "average_sets_per_workout": avg_sets_per_workout,
                "workout_consistency": workout_consistency,
            },
        }

    def _generate_overall_recommendations(self, collected_data, insights):
        """
        Generate overall recommendations based on combined analysis.

        Args:
            collected_data: Original collected data
            insights: Rule-based insights

        Returns:
            list: Overall recommendations
        """
        recommendations = []

        nutrition_insights = insights["nutrition_insights"]
        workout_insights = insights["workout_insights"]

        # Cross-analysis recommendations
        if (
            nutrition_insights["status"] == "analyzed"
            and workout_insights["status"] == "analyzed"
        ):

            # High workout frequency + low calorie intake
            if workout_insights["key_metrics"]["workout_frequency"] >= 4:
                if nutrition_insights["key_metrics"]["calorie_adherence"] < 85:
                    recommendations.append(
                        {
                            "priority": "high",
                            "category": "nutrition_workout_balance",
                            "recommendation": "You're training frequently but under-eating. Increase calorie intake to support recovery and performance.",
                        }
                    )

            # Low protein + high workout frequency
            if workout_insights["key_metrics"]["workout_frequency"] >= 3:
                if nutrition_insights["key_metrics"]["protein_adherence"] < 80:
                    recommendations.append(
                        {
                            "priority": "high",
                            "category": "protein_for_recovery",
                            "recommendation": "Increase protein intake to at least 1.6-2.2g per kg body weight to support muscle recovery.",
                        }
                    )

            # Good nutrition but low workout frequency
            if nutrition_insights["overall_adherence"] >= 80:
                if workout_insights["key_metrics"]["workout_frequency"] < 2:
                    recommendations.append(
                        {
                            "priority": "medium",
                            "category": "increase_activity",
                            "recommendation": "Your nutrition is on track. Increase workout frequency to 3-4 times per week to maximize results.",
                        }
                    )

            # High workout frequency + short duration
            if workout_insights["key_metrics"]["workout_frequency"] >= 4:
                if workout_insights["key_metrics"]["average_duration"] < 40:
                    recommendations.append(
                        {
                            "priority": "medium",
                            "category": "workout_quality",
                            "recommendation": "Consider extending workout sessions to 45-60 minutes for better results.",
                        }
                    )

            # Low variety + frequent training
            if workout_insights["key_metrics"]["exercise_variety"] < 6:
                if workout_insights["key_metrics"]["workout_frequency"] >= 3:
                    recommendations.append(
                        {
                            "priority": "medium",
                            "category": "exercise_variety",
                            "recommendation": "Add more exercise variety to prevent plateaus and ensure balanced muscle development.",
                        }
                    )

        # Single-domain recommendations
        if nutrition_insights["status"] == "analyzed":
            if nutrition_insights["key_metrics"]["tracking_consistency"] < 70:
                recommendations.append(
                    {
                        "priority": "high",
                        "category": "tracking_consistency",
                        "recommendation": "Improve nutrition tracking consistency to at least 6 days per week for better insights.",
                    }
                )

        if workout_insights["status"] == "analyzed":
            if workout_insights["key_metrics"]["average_sets_per_workout"] < 12:
                recommendations.append(
                    {
                        "priority": "low",
                        "category": "training_volume",
                        "recommendation": "Consider increasing training volume with additional sets per exercise.",
                    }
                )

        # No data recommendations
        if nutrition_insights["status"] == "insufficient_data":
            recommendations.append(
                {
                    "priority": "high",
                    "category": "start_tracking",
                    "recommendation": "Start tracking your nutrition to get personalized feedback and recommendations.",
                }
            )

        if workout_insights["status"] == "insufficient_data":
            recommendations.append(
                {
                    "priority": "high",
                    "category": "start_training",
                    "recommendation": "Begin logging your workouts to track progress and receive tailored advice.",
                }
            )

        return recommendations

    def get_summary_insights(self, insights):
        """
        Generate a text summary of rule-based insights for AI prompt.

        Args:
            insights: Rule-based insights dictionary

        Returns:
            str: Formatted summary text
        """
        summary_parts = []

        # Nutrition insights summary
        if insights["nutrition_insights"]["status"] == "analyzed":
            ni = insights["nutrition_insights"]
            summary_parts.append("NUTRITION ANALYSIS:")
            summary_parts.append(f"- Overall Adherence: {ni['overall_adherence']:.1f}%")

            for insight in ni["insights"]:
                summary_parts.append(
                    f"- [{insight['type'].upper()}] {insight['message']}"
                )

        # Workout insights summary
        if insights["workout_insights"]["status"] == "analyzed":
            wi = insights["workout_insights"]
            summary_parts.append("\nWORKOUT ANALYSIS:")

            for insight in wi["insights"]:
                summary_parts.append(
                    f"- [{insight['type'].upper()}] {insight['message']}"
                )

        # Overall recommendations
        if insights["overall_recommendations"]:
            summary_parts.append("\nKEY RECOMMENDATIONS:")
            for rec in insights["overall_recommendations"]:
                summary_parts.append(
                    f"- [{rec['priority'].upper()} PRIORITY] {rec['recommendation']}"
                )

        return "\n".join(summary_parts)
