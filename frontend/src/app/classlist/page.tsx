// In your ClassList component
"use client";

import { useState } from "react";
import { Card } from "../../components/ui/card";
import CourseNavBar from "../coursePage/_components/navBar";
import Search from "./components/search";
import AddStudent from "./components/addStudent";
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
          {/* Search and Add Student - justified between */}
          <div className="w-3xl flex justify-between items-center">
            <Search
              onSearchChange={handleSearchChange}
              placeholder="Search students by name, ID number, program, or course"
              className="max-w-md"
            />
            <AddStudent />
          </div>

          <Card className="w-3xl flex justify-center items-start pt-10">
            <StudentList searchTerm={searchTerm} />
          </Card>
        </div>
      </section>
    </>
  );
}