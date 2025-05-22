'use client';

import { FileText, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

import { Separator } from "../../../components/ui/separator";

interface Course {
  id: string;
  courseName: string;
  courseCode: string;
  instructorName: string;
  semester: string;
  group: string;
  color: string;
}

interface ApiResponse {
  success: boolean;
  data: Course[];
  message: string;
}

export function CourseCards() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Replace with your Laravel backend URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/courses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: ApiResponse = await response.json();

      if (result.success) {
        setCourses(result.data);
      } else {
        setError(result.message || 'Failed to fetch courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-lg">Loading courses...</div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="text-red-500 mb-4">Error: {error}</div>
        <button 
          onClick={fetchCourses}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  // No courses state
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <div className="text-gray-500 mb-4">No courses found</div>
        <button 
          onClick={fetchCourses}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          Courses ({courses.length})
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={fetchCourses}
            className="text-sm font-medium text-gray-600 hover:underline"
          >
            Refresh
          </button>
          <Link
            href="/courses"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            All Courses
          </Link>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
        {courses.map((course) => (
          <div
            key={course.courseCode}
            className="rounded-md shadow-md overflow-hidden flex flex-col"
          >
            <div className="h-2 w-full" style={{ backgroundColor: "#f5c034" }} />
            
            <Card className="rounded-t-none flex flex-col justify-between flex-1">
              <CardHeader className="pb-2 min-h-24 flex flex-col justify-between">
                <CardTitle className="text-base">{course.courseName}</CardTitle>
                <p className="text-sm text-muted-foreground">{course.courseCode}</p>
              </CardHeader>

              <CardContent>
                <Separator orientation="horizontal" />
                <div className="mt-2">
                  <p className="text-xs text-gray-600">
                    Instructor: {course.instructorName}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="pb-2 flex flex-col items-end text-right">
                <p className="text-sm">{course.semester}</p>
                <p className="text-sm">{course.group}</p>
              </CardFooter>
            </Card>
          </div>
        ))}
      </div>
    </>
  );
}