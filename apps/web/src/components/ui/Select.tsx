import React, { useState, useRef, useEffect } from 'react';

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    label?: string;
}

export const Select: React.FC<SelectProps> = ({ value, onChange, options, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find(opt => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    return (
        <div>
            {label && <label className="text-muted text-sm mb-1.5 block">{label}</label>}
            <div ref={selectRef} className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full bg-dark-700 border border-dark-600/50 rounded-lg px-4 py-3 pr-10 text-white outline-none focus:border-accent/50 text-left cursor-pointer hover:border-dark-600 transition-colors"
                >
                    {selectedOption?.label || 'Select...'}
                </button>

                <svg
                    className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted pointer-events-none transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>

                {isOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-dark-700 border border-dark-600/50 rounded-lg shadow-xl overflow-hidden">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelect(option.value)}
                                className={`w-full px-4 py-3 text-left transition-colors ${option.value === value
                                        ? 'bg-dark-600 text-white'
                                        : 'text-gray-300 hover:bg-dark-600/50 hover:text-white'
                                    }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
