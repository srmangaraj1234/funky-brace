import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomStatusSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);

  const options = [
    { value: 'Verified', label: 'Community Verified' },
    { value: 'In Progress', label: 'Pending Action' },
    { value: 'Resolved', label: 'Resolved' }
  ];

  // Close when clicking/tapping outside (pointerdown covers mouse, touch, and pen)
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('pointerdown', handleClickOutside);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, []);

  // Keep the active (highlighted) option in sync with the current value whenever the menu opens
  useEffect(() => {
    if (isOpen) {
      const currentIndex = options.findIndex((opt) => opt.value === value);
      setActiveIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [isOpen, value]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen && activeIndex >= 0) {
        handleSelect(options[activeIndex].value);
      } else {
        setIsOpen(!isOpen);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Tab') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setActiveIndex((prev) => (prev + 1) % options.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        setActiveIndex((prev) => (prev - 1 + options.length) % options.length);
      }
    }
  };

  let selectedLabel = 'Issue Raised';
  const foundOpt = options.find((opt) => opt.value === value);
  if (foundOpt) {
    selectedLabel = foundOpt.label;
  } else if (value === 'Reported') {
    selectedLabel = 'Issue Raised';
  } else {
    selectedLabel = value;
  }

  const listboxId = 'status-select-listbox';

  return (
    <div className="relative w-full" ref={containerRef} id="status-select-container">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={isOpen && activeIndex >= 0 ? `status-option-${options[activeIndex].value}` : undefined}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full bg-white border rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 transition-all flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 cursor-pointer ${
          isOpen ? 'border-green-500 ring-2 ring-green-500/20 bg-white' : 'border-slate-200 hover:bg-slate-50'
        }`}
      >
        <span>{selectedLabel}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-green-600' : ''}`} />
      </button>

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-100 max-h-60 overflow-y-auto"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;
            return (
              <li
                key={option.value}
                id={`status-option-${option.value}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => handleSelect(option.value)}
                className={`px-3.5 py-2.5 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-green-50 text-green-800 font-bold'
                    : isActive
                    ? 'bg-slate-50 text-slate-800'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="w-4 h-4 text-green-600 shrink-0" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
