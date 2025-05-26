"use client";

import { useState } from "react";
import { Input } from "../../../components/ui/input";

interface SearchProps {
  onSearchChange?: (searchTerm: string) => void;
  placeholder?: string;
  className?: string;
}

export default function Search({
  onSearchChange,
  placeholder = "Search for a student...",
  className = "",
}: SearchProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // Immediately call the callback if provided
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleClear = () => {
    setSearchTerm("");
    if (onSearchChange) {
      onSearchChange("");
    }
  };

  return (
    <div className="relative w-1/4 min-w-64">
      <Input
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={handleInputChange}
        className="w-full p-2 border border-gray-300 rounded pr-8"
      />

      {/* Clear Button */}
      {searchTerm && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg font-bold"
          title="Clear search"
        >
          ×
        </button>
      )}
    </div>
  );
}
