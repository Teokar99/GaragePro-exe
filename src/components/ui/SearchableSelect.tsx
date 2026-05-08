// src/components/ui/SearchableSelect.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { normalize } from "../../utils/search";

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  allowCustom?: boolean;
  onAddCustom?: (value: string) => void;
};

export const SearchableSelect: React.FC<Props> = ({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  required = false,
  label,
  allowCustom = false,
  onAddCustom,
}) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const filteredOptions = useMemo(() => {
    const q = normalize(searchTerm);
    if (!q) return options;
    return options.filter((opt) => normalize(opt).includes(q));
  }, [options, searchTerm]);

  // Close on outside click
  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const showAddRow =
    allowCustom &&
    searchTerm.trim().length > 0 &&
    !filteredOptions.some(
      (o) => normalize(o) === normalize(searchTerm.trim()),
    );

  // Keep highlighted index valid
  useEffect(() => {
    const max = filteredOptions.length + (showAddRow ? 1 : 0);
    if (highlightedIndex >= max) setHighlightedIndex(0);
  }, [filteredOptions.length, highlightedIndex, showAddRow]);

  const open = () => {
    if (disabled) return;
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  const selectValue = (v: string) => {
    onChange(v);
    setSearchTerm("");
    close();
  };

  const clearValue = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
    setHighlightedIndex(0);
    // keep focus for fast retyping
    inputRef.current?.focus();
    setIsOpen(true);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (!isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex((i) => {
          const max = filteredOptions.length - 1 + (showAddRow ? 1 : 0);
          return Math.min(i + 1, Math.max(max, 0));
        });
        break;
      case "ArrowUp":
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        e.preventDefault();

        if (filteredOptions[highlightedIndex]) {
          selectValue(filteredOptions[highlightedIndex]);
          return;
        }

        // Add row is highlighted or allowCustom fallback
        if (showAddRow && highlightedIndex === filteredOptions.length) {
          const typed = searchTerm.trim();
          selectValue(typed);
          onAddCustom?.(typed);
          return;
        }

        if (allowCustom) {
          const typed = searchTerm.trim();
          if (typed.length > 0) {
            selectValue(typed);
            onAddCustom?.(typed);
          }
        }
        break;
    }
  };

  return (
    <div ref={wrapperRef} className="w-full">
      {label ? (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required ? "*" : ""}
        </label>
      ) : null}

      <div
        className={[
          "relative w-full",
          disabled ? "opacity-70 cursor-not-allowed" : "cursor-text",
        ].join(" ")}
        onClick={() => {
          if (disabled) return;
          inputRef.current?.focus();
          open();
        }}
      >
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Search className="w-4 h-4" />
        </div>

        <input
          ref={inputRef}
          type="text"
          required={required}
          disabled={disabled}
          value={isOpen ? searchTerm : value}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setHighlightedIndex(0);
            open();
          }}
          onFocus={() => open()}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={[
            "w-full pl-10 pr-10 py-2 border rounded-lg",
            "bg-white dark:bg-gray-700 text-gray-900 dark:text-white",
            "border-gray-300 dark:border-gray-600",
            "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            disabled ? "cursor-not-allowed" : "",
          ].join(" ")}
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !disabled ? (
            <button
              type="button"
              onClick={clearValue}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-300"
              aria-label="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}

          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>

        {isOpen && !disabled ? (
          <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-lg">
            <div className="max-h-56 overflow-auto py-1">
              {filteredOptions.length === 0 && !showAddRow ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-300">
                  No results found
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isActive = idx === highlightedIndex;
                  const isSelected = opt === value;

                  return (
                    <button
                      key={opt}
                      type="button"
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        selectValue(opt);
                      }}
                      className={[
                        "w-full text-left px-3 py-2 text-sm",
                        isActive ? "bg-blue-50 dark:bg-blue-900/30" : "",
                        isSelected
                          ? "font-medium text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-200",
                        "hover:bg-blue-50 dark:hover:bg-blue-900/30",
                      ].join(" ")}
                    >
                      {opt}
                    </button>
                  );
                })
              )}
              {showAddRow ? (
                <button
                  type="button"
                  onMouseEnter={() => setHighlightedIndex(filteredOptions.length)}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const typed = searchTerm.trim();
                    selectValue(typed);
                    onAddCustom?.(typed);
                  }}
                  className={[
                    "w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400",
                    filteredOptions.length > 0
                      ? "border-t border-gray-100 dark:border-gray-600"
                      : "",
                    highlightedIndex === filteredOptions.length
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : "",
                    "hover:bg-blue-50 dark:hover:bg-blue-900/30",
                  ].join(" ")}
                >
                  + Add "{searchTerm.trim()}"
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
