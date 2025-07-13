import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function BasicInfoForm() {
    return (
        <Card className="w-full max-w-lg">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold">Basic Information</CardTitle>
                <CardDescription>Tell us about your fitness goals and current stats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentWeight">Current Weight</Label>
                        <div className="relative">
                            <Input id="currentWeight" type="number" placeholder="150" className="pr-12" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kgs</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="goalWeight">Goal Weight</Label>
                        <div className="relative">
                            <Input id="goalWeight" type="number" placeholder="140" className="pr-12" />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">kgs</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="height">Height</Label>
                        <div className="flex gap-2">
                            <Input id="heightFeet" type="number" placeholder="5" className="flex-1" />
                            <span className="flex items-center text-sm text-muted-foreground">ft</span>
                            <Input id="heightInches" type="number" placeholder="8" className="flex-1" />
                            <span className="flex items-center text-sm text-muted-foreground">in</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="bodyGoal">Body Goal</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Select goal" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="lose-weight">Lose Weight</SelectItem>
                                <SelectItem value="gain-muscle">Gain Muscle</SelectItem>
                                <SelectItem value="maintain">Maintain Weight</SelectItem>
                                <SelectItem value="tone">Tone & Define</SelectItem>
                                <SelectItem value="strength">Build Strength</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Button type="submit" className="w-full">
                    Continue
                </Button>
            </CardContent>
        </Card>
    );
}
