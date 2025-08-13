import { Loader2 } from "lucide-react"

export function LoadingSpinner({ message }) {
    return (
        <div className="w-full h-full flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading {message}...</span>
        </div>
    )
}