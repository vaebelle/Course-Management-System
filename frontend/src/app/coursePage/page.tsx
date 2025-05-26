'use client';

import { useState } from 'react';
import { CourseCards } from "./_components/courseCards";
import CourseNavBar from "./_components/navBar";

export default function CoursePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCourseUpdate = () => {
    // Increment the trigger to force CourseCards to refresh
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen max-h-screen overflow-hidden">
      <section className="flex-shrink-0">
        <CourseNavBar 
          onCourseUpdate={handleCourseUpdate}
        />
      </section>

      <section className="flex-1 overflow-auto">
        <div className="flex min-h-full bg-[#ffffff]">
          <main className="flex-1 p-4 md:p-6 w-full">
            <div className="grid gap-6">
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <div className="w-full">
                <CourseCards refreshTrigger={refreshTrigger} />
              </div>
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}