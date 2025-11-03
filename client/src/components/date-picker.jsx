"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar } from "lucide-react"
import CalendarComponent from "./calendar";

export default function DatePicker() {
    const [selectedDate, setSelectedDate] = useState(null)
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef(null)

    const formatDate = (date) => {
        if (!date) return ""
        return date.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
        })
    }

    const handleDateSelect = (date) => {
        setSelectedDate(date)
        setIsOpen(false)
    }

    const handleInputClick = () => {
        setIsOpen(!isOpen)
    }

    const handleClose = () => {
        setIsOpen(false)
    }

    // Close calendar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isOpen])

    return (
        <div className="relative" ref={containerRef}>
            <div
                onClick={handleInputClick}
                className="flex items-center justify-between px-3 py-2 border rounded-lg cursor-pointer"
            >
                <span className={selectedDate ? "text-gray-900" : "text-gray-500"}>
                    {selectedDate ? formatDate(selectedDate) : "Select date..."}
                </span>
                <Calendar className="size-4 text-gray-400" />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 z-50">
                    <CalendarComponent selectedDate={selectedDate} onDateSelect={handleDateSelect} onClose={handleClose} />
                </div>
            )}
        </div>
    )
}
