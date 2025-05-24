"use client";

import { useState } from "react";
import { Card } from "../../components/ui/card";
import CourseNavBar from "../coursePage/_components/navBar";
import Search from "./components/search";
import StudentList from "./components/studentlist";

export default function ClassList() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (newSearchTerm: string) => {
    setSearchTerm(newSearchTerm);
  };

  return (
    <>
      <CourseNavBar instructorName="Bea Belle Therese B. Caños" />

      <section>
        <div className="flex min-h-screen bg-[#ffffff] flex-col items-center pt-10 gap-6">
          {/* Search is now here */}
          <Search
            onSearchChange={handleSearchChange}
            placeholder="Search students by name, ID, program, or course..."
            className="mb-6"
          />

          <Card className="w-3xl flex justify-center items-start pt-10">
            <StudentList searchTerm={searchTerm} />
          </Card>
        </div>
      </section>
    </>
  );
}
