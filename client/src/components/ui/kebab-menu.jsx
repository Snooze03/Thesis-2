"use client"

import { MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { clsx } from "clsx";

export function KebabMenu({
    items = [],
    onAction,
    trigger,
    align = "end",
    side = "bottom",
    className = "",
    disabled = false,
    ...props
}) {
    const handleAction = (action, item) => {
        // If action is a function, call it directly
        if (typeof action === 'function') {
            action(item);
        } else if (onAction) {
            // Fallback to original behavior for string actions
            onAction(action, item)
        }
    }

    const renderTrigger = () => {
        if (trigger) {
            return trigger
        }
        return (
            <Button variant="ghost" size="sm" className={`size-8 p-0 ${className}`} disabled={disabled}>
                <MoreVertical className="size-4" />
                <span className="sr-only">Open menu</span>
            </Button>
        )
    }

    const renderMenuItem = (item, index) => {
        if (item.type === "separator") {
            return <DropdownMenuSeparator key={`separator-${index}`} />
        }
        if (item.type === "title") {
            return (
                <div key={`title-${index}`} className="px-2 py-1.5 text-sm font-semibold text-gray-800">
                    {item.label}
                </div>
            )
        }

        const Icon = item.icon
        const isDestructive = item.variant === "destructive"

        return (
            <DropdownMenuItem
                key={item.action?.toString() || index}
                onClick={() => handleAction(item.action, item)}
                disabled={item.disabled}
                className={clsx(isDestructive && "text-destructive focus:text-destructive")}
            >
                {Icon && <Icon className={clsx("mr-1 size-4", isDestructive && "stroke-destructive")} />}
                {item.label}
            </DropdownMenuItem>
        )
    }

    return (
        <DropdownMenu {...props} >
            <DropdownMenuTrigger asChild>{renderTrigger()}</DropdownMenuTrigger>
            <DropdownMenuContent align={align} side={side}>
                {items.length > 0 ? (
                    items.map(renderMenuItem)
                ) : (
                    <DropdownMenuItem disabled>No items available</DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
