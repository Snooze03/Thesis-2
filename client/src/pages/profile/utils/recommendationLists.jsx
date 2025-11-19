import { CheckCircle2 } from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown-renderer";

// Helper function to parse numbered list and add icons
export const RecommendationsList = ({ content, variant = "orange" }) => {
    if (!content) return null;

    // Split by numbered items (1. 2. 3. etc.)
    const items = content.split(/\n?\d+\.\s/).filter(Boolean);

    const iconColor = variant === "orange" ? "text-orange-500" : "text-sky-500";

    return (
        <ul >
            {items.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                    <CheckCircle2 className={`size-5 ${iconColor} mt-0.5 flex-shrink-0`} />
                    <div className="flex-1">
                        <MarkdownRenderer content={item.trim()} className="prose-p:mb-0 text-gray-800 text-sm" />
                    </div>
                </li>
            ))}
        </ul>
    );
};
