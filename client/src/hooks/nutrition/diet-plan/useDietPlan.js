import api from "@/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useDietPlan() {
    const fetchDietPlan = useQuery({
        queryKey: ['diet-plan'],
        queryFn: async () => {
            const response = await api.get('/nutrition/diet-plans/');
            return response.data;
        },
        onSuccess: (data) => {
            console.log(`Fetched diet plan data ${data}`);
        }
    })

    const addFoodToDietPlan = useMutation({
        mutationFn: async (newFoodItem) => {
            const response = await api.post('/nutrition/diet-plans/meal-items/', newFoodItem);
            return response.data;
        },
        onSuccess: (data) => {
            console.log(`Added food item to diet plan ${data}`);
        }
    })

    return {
        fetchDietPlan,
        addFoodToDietPlan,
    }
}