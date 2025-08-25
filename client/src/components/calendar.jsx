"use client"

import { useState } from "react"
import { ChevronUp, ChevronDown } from "lucide-react"

export default function CalendarComponent({ selectedDate, onDateSelect, onClose }) {
  const [currentDate, setCurrentDate] = useState(new Date())

  const today = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  // Get first day of the month and number of days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()

  // Get previous month's last days
  const prevMonth = new Date(currentYear, currentMonth - 1, 0)
  const daysInPrevMonth = prevMonth.getDate()

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(currentDate.getMonth() + direction)
    setCurrentDate(newDate)
  }

  const handleDateClick = (day, isCurrentMonth = true, isPrevMonth = false) => {
    let clickedDate
    if (isPrevMonth) {
      clickedDate = new Date(currentYear, currentMonth - 1, day)
    } else if (!isCurrentMonth) {
      clickedDate = new Date(currentYear, currentMonth + 1, day)
    } else {
      clickedDate = new Date(currentYear, currentMonth, day)
    }

    // Don't allow future dates
    if (clickedDate > today) {
      return
    }

    onDateSelect(clickedDate)
  }

  const handleClear = () => {
    onDateSelect(null)
  }

  const handleToday = () => {
    onDateSelect(today)
  }

  const isDateSelected = (day, isCurrentMonth = true, isPrevMonth = false) => {
    if (!selectedDate) return false

    let dateToCheck
    if (isPrevMonth) {
      dateToCheck = new Date(currentYear, currentMonth - 1, day)
    } else if (!isCurrentMonth) {
      dateToCheck = new Date(currentYear, currentMonth + 1, day)
    } else {
      dateToCheck = new Date(currentYear, currentMonth, day)
    }

    return dateToCheck.toDateString() === selectedDate.toDateString()
  }

  const isToday = (day, isCurrentMonth = true, isPrevMonth = false) => {
    let dateToCheck
    if (isPrevMonth) {
      dateToCheck = new Date(currentYear, currentMonth - 1, day)
    } else if (!isCurrentMonth) {
      dateToCheck = new Date(currentYear, currentMonth + 1, day)
    } else {
      dateToCheck = new Date(currentYear, currentMonth, day)
    }

    return dateToCheck.toDateString() === today.toDateString()
  }

  const isFutureDate = (day, isCurrentMonth = true, isPrevMonth = false) => {
    let dateToCheck
    if (isPrevMonth) {
      dateToCheck = new Date(currentYear, currentMonth - 1, day)
    } else if (!isCurrentMonth) {
      dateToCheck = new Date(currentYear, currentMonth + 1, day)
    } else {
      dateToCheck = new Date(currentYear, currentMonth, day)
    }

    return dateToCheck > today
  }

  // Generate calendar days
  const calendarDays = []

  // Previous month's days
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i
    const isFuture = isFutureDate(day, false, true)
    const isTodayDate = isToday(day, false, true)
    calendarDays.push(
      <button
        key={`prev-${day}`}
        onClick={() => !isFuture && handleDateClick(day, false, true)}
        className={`w-8 h-8 text-sm ${isFuture
          ? "text-gray-300 cursor-not-allowed"
          : isDateSelected(day, false, true)
            ? "bg-gray-800 text-white rounded"
            : isTodayDate
              ? "bg-blue-100 text-blue-800 rounded font-medium"
              : "text-gray-400 hover:bg-gray-100 rounded"
          }`}
        disabled={isFuture}
      >
        {day}
      </button>,
    )
  }

  // Current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    const isFuture = isFutureDate(day)
    const isTodayDate = isToday(day)
    calendarDays.push(
      <button
        key={`current-${day}`}
        onClick={() => !isFuture && handleDateClick(day)}
        className={`w-8 h-8 text-sm ${isFuture
          ? "text-gray-300 cursor-not-allowed"
          : isDateSelected(day)
            ? "bg-gray-800 text-white rounded"
            : isTodayDate
              ? "bg-blue-100 text-blue-800 rounded font-medium"
              : "text-gray-900 hover:bg-gray-100 rounded"
          }`}
        disabled={isFuture}
      >
        {day}
      </button>,
    )
  }

  // Next month's days to fill the grid
  const remainingCells = 42 - calendarDays.length
  for (let day = 1; day <= remainingCells; day++) {
    const isFuture = isFutureDate(day, false)
    const isTodayDate = isToday(day, false)
    calendarDays.push(
      <button
        key={`next-${day}`}
        onClick={() => !isFuture && handleDateClick(day, false)}
        className={`w-8 h-8 text-sm ${isFuture
          ? "text-gray-300 cursor-not-allowed"
          : isDateSelected(day, false)
            ? "bg-gray-800 text-white rounded"
            : isTodayDate
              ? "bg-blue-100 text-blue-800 rounded font-medium"
              : "text-gray-400 hover:bg-gray-100 rounded"
          }`}
        disabled={isFuture}
      >
        {day}
      </button>,
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-64">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-900">
          {monthNames[currentMonth]} {currentYear}
        </span>
        <div className="flex space-x-1">
          <button onClick={() => navigateMonth(-1)} className="p-1 hover:bg-gray-100 rounded">
            <ChevronUp className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={() => navigateMonth(1)} className="p-1 hover:bg-gray-100 rounded">
            <ChevronDown className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-xs font-medium text-gray-500 text-center py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">{calendarDays}</div>

      {/* Action buttons */}
      <div className="flex justify-between">
        <button onClick={handleClear} className="text-sm text-blue-600 hover:text-blue-800">
          Clear
        </button>
        <button onClick={handleToday} className="text-sm text-blue-600 hover:text-blue-800">
          Today
        </button>
      </div>
    </div>
  )
}
