'use client';

import { FileText, MessageSquare, Users, Clock } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";

import { Separator } from "../../../components/ui/separator";


import CourseDetailsModal from './CourseDetailsModal';

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

interface CourseCardsProps {
  refreshTrigger?: number;
}

export function CourseCards({ refreshTrigger }: CourseCardsProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      
      // Get auth token from localStorage
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        // If no token, redirect to login
        setError("Please login to view courses");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/courses`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`, // Add auth token
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid, clear it and show error
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
          setError("Session expired. Please login again.");
          return;
        }
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
  }, [API_BASE_URL]);

  // Initial fetch on component mount
  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  // Refresh courses when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      console.log('Refreshing courses due to trigger:', refreshTrigger);
      fetchCourses();
    }
  }, [refreshTrigger, fetchCourses]);

  const handleCourseClick = (courseCode: string) => {
    setSelectedCourse(courseCode);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#017638]"></div>
          <div className="text-lg">Loading courses...</div>
        </div>
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
          className="px-4 py-2 bg-[#017638] text-white rounded hover:bg-green-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // No courses state
  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-500 mb-4">
            Upload a class list to create your first course
          </p>
        </div>
        <button 
          onClick={fetchCourses}
          className="px-4 py-2 bg-[#017638] text-white rounded hover:bg-green-700 transition-colors"
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
            className="text-sm font-medium text-gray-600 hover:text-[#017638] hover:underline transition-colors"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Fixed size grid with consistent tile dimensions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {courses.map((course) => (
          <div
            key={course.courseCode}
            className="w-full h-48 rounded-md shadow-md overflow-hidden flex flex-col cursor-pointer transform transition-all duration-200 hover:scale-105 hover:shadow-lg"
            onClick={() => handleCourseClick(course.courseCode)}
          >
            <div className="h-2 w-full flex-shrink-0" style={{ backgroundColor: "#f5c034" }} />
            
            <Card className="rounded-t-none flex flex-col justify-between flex-1 h-full hover:bg-gray-50 transition-colors duration-200">
              <CardHeader className="pb-2 flex-shrink-0">
                <CardTitle className="text-base leading-tight line-clamp-2">
                  {course.courseName}
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-center">
                <Separator orientation="horizontal" className="mb-3" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-gray-500 flex-shrink-0" />
                    <p className="text-xs text-gray-600 truncate">
                      {course.instructorName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-gray-500 flex-shrink-0" />
                    <p className="text-xs text-gray-600">
                      Click to view details
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Course Details Modal */}
      <CourseDetailsModal
        isOpen={isModalOpen}
        onClose={closeModal}
        courseCode={selectedCourse || ''}
      />
    </>
  );
}