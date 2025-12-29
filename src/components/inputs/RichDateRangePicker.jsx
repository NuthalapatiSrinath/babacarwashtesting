import React, { useState, useRef, useEffect } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const daysOfWeek = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const months = [
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
];

const RichDateRangePicker = ({ startDate, endDate, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Internal state for calendar navigation (Year/Month view)
  const [currentDate, setCurrentDate] = useState(new Date());

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Calendar Logic ---
  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  // Handle clicking a day
  const handleDateClick = (day) => {
    // Construct local date string YYYY-MM-DD
    // Note: We use local time to avoid timezone offset issues
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    const dateStr = `${year}-${month}-${d}`;

    if (!startDate || (startDate && endDate)) {
      // Case 1: No dates selected OR Range already full -> Start New Range
      onChange("startDate", dateStr);
      onChange("endDate", ""); // Clear end date
    } else {
      // Case 2: Start date exists, selecting End date
      if (new Date(dateStr) < new Date(startDate)) {
        // If clicked date is BEFORE start date, swap them
        onChange("endDate", startDate);
        onChange("startDate", dateStr);
      } else {
        // Normal range
        onChange("endDate", dateStr);
      }
      // Auto-close (optional, can remove if you want users to see selection)
      // setIsOpen(false);
    }
  };

  // Month Navigation
  const changeMonth = (offset) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1)
    );
  };

  const changeYear = (year) => {
    setCurrentDate(new Date(year, currentDate.getMonth(), 1));
  };

  const changeMonthDropdown = (monthIndex) => {
    setCurrentDate(new Date(currentDate.getFullYear(), monthIndex, 1));
  };

  // --- Render Days Grid ---
  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    // Actual Days
    for (let day = 1; day <= daysInMonth; day++) {
      // Construct date string for comparison
      const currentStr = `${year}-${String(month + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;

      const start = startDate;
      const end = endDate;

      const isSelected = currentStr === start || currentStr === end;
      const isStart = currentStr === start;
      const isEnd = currentStr === end;
      // Check if inside range
      const isInRange = start && end && currentStr > start && currentStr < end;

      // Dynamic Classes
      let classes = "text-slate-700 hover:bg-indigo-50 rounded-lg"; // Default

      if (isSelected) {
        classes =
          "bg-[#009ef7] text-white font-bold shadow-md rounded-lg scale-105 z-10";
      } else if (isInRange) {
        classes = "bg-indigo-50 text-indigo-700 rounded-none"; // Connect the range
        // Add rounded corners to visual ends if needed, but grid gap makes it tricky.
        // Simple bg-color is usually enough for grid calendars.
      }

      days.push(
        <button
          key={day}
          onClick={(e) => {
            e.stopPropagation();
            handleDateClick(day);
          }}
          className={`h-9 w-9 text-xs flex items-center justify-center transition-all duration-200 ${classes}`}
        >
          {day}
        </button>
      );
    }
    return days;
  };

  // Generate Year Options (1900 - 2100)
  const years = Array.from({ length: 200 }, (_, i) => 1900 + i).reverse();

  // Display Text Logic
  const getDisplayText = () => {
    if (!startDate && !endDate) return "Select Date Range";
    if (startDate && !endDate) return `${startDate} - Select End`;
    return `${startDate} - ${endDate}`;
  };

  return (
    <div className="relative w-full md:w-80 font-sans z-50" ref={containerRef}>
      {/* INPUT TRIGGER */}
      <div
        className={`relative flex items-center justify-between w-full h-[50px] px-4 bg-white border rounded-xl cursor-pointer transition-all shadow-sm ${
          isOpen
            ? "border-[#009ef7] ring-1 ring-[#009ef7]"
            : "border-slate-200 hover:border-slate-300"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-col justify-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">
            Choose Date
          </span>
          <span
            className={`text-sm font-bold truncate ${
              startDate ? "text-slate-700" : "text-slate-300"
            }`}
          >
            {getDisplayText()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {(startDate || endDate) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange("clear");
              }}
              className="p-1.5 bg-slate-100 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Clear"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <Calendar className="w-5 h-5 text-[#009ef7]" />
        </div>
      </div>

      {/* POPUP CALENDAR */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-3 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 w-[320px] z-50"
          >
            {/* Header: Selectors */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => changeMonth(-1)}
                className="p-1 hover:bg-slate-100 rounded text-slate-500"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex gap-2">
                {/* Month Dropdown */}
                <div className="relative group">
                  <select
                    value={currentDate.getMonth()}
                    onChange={(e) =>
                      changeMonthDropdown(Number(e.target.value))
                    }
                    className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-md py-1 px-2 pr-6 cursor-pointer focus:outline-none focus:border-[#009ef7]"
                  >
                    {months.map((m, i) => (
                      <option key={m} value={i}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>

                {/* Year Dropdown */}
                <div className="relative group">
                  <select
                    value={currentDate.getFullYear()}
                    onChange={(e) => changeYear(Number(e.target.value))}
                    className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-md py-1 px-2 pr-6 cursor-pointer focus:outline-none focus:border-[#009ef7]"
                  >
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 w-3 h-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <button
                onClick={() => changeMonth(1)}
                className="p-1 hover:bg-slate-100 rounded text-slate-500"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 mb-2 text-center">
              {daysOfWeek.map((d) => (
                <span
                  key={d}
                  className="text-[10px] font-bold text-slate-400 uppercase"
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {renderCalendarDays()}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
                  onChange("startDate", today);
                  onChange("endDate", today);
                  setCurrentDate(new Date());
                }}
                className="text-xs font-bold text-slate-500 hover:text-[#009ef7]"
              >
                Today
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-1.5 bg-[#009ef7] text-white text-xs font-bold rounded-md hover:bg-[#0086d6] transition-colors"
              >
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RichDateRangePicker;
