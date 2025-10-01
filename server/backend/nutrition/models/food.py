from django.db import models


class Food(models.Model):
    """
    Master food database - stores unique foods from FatSecret API
    """

    # FatSecret API fields
    food_id = models.CharField(
        max_length=50, unique=True, help_text="FatSecret food ID"
    )
    food_name = models.CharField(max_length=255, help_text="Food name from FatSecret")
    food_type = models.CharField(max_length=50, blank=True, help_text="Type of food")

    # Additional metadata
    brand_name = models.CharField(
        max_length=255, blank=True, help_text="Brand name if applicable"
    )
    food_description = models.TextField(
        blank=True, help_text="Detailed description from FatSecret"
    )

    # Store FatSecret serving options as JSON (predefined servings from API)
    fatsecret_servings = models.JSONField(
        default=list,
        blank=True,
        help_text="Available serving options from FatSecret API",
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "nutrition_foods"
        verbose_name = "Food"
        verbose_name_plural = "Foods"
        ordering = ["food_name"]
        indexes = [
            models.Index(fields=["food_name"]),
            models.Index(fields=["brand_name"]),
        ]

    def __str__(self):
        return (
            f"{self.food_name} ({self.brand_name})"
            if self.brand_name
            else self.food_name
        )

    def get_serving_by_id(self, serving_id):
        """Get specific serving data by serving_id"""
        if not self.fatsecret_servings or not serving_id:
            return None

        for serving in self.fatsecret_servings:
            if serving.get("serving_id") == str(serving_id):
                return serving
        return None

    def get_default_serving(self):
        """Get the first available serving (usually 100g)"""
        if not self.fatsecret_servings:
            return None
        return self.fatsecret_servings[0] if self.fatsecret_servings else None
