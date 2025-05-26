'use client';

import { FileText, MessageSquare, Users, Clock, Trash2 } from "lucide-react";
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

interface DeleteResponse {
  success: boolean;
  message: string;
}

interface CourseCardsProps {
  refreshTrigger?: number;
}

// Confirmation Modal Component
interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  courseName: string;
  courseCode: string;
  isDeleting: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  courseName,
  courseCode,
  isDeleting
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xl bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Course</h3>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete this course?
            </p>
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="font-medium text-gray-900">{courseName}</p>
              <p className="text-sm text-gray-600">Code: {courseCode}</p>
            </div>
            <p className="text-sm text-red-600 mt-2">
              ⚠️ This will also delete all enrolled students and course data.
            </p>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete Course
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export function CourseCards({ refreshTrigger }: CourseCardsProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Delete confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = (e: React.MouseEvent, course: Course) => {
    e.stopPropagation(); // Prevent opening the course details modal
    setCourseToDelete(course);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;

    try {
      setIsDeleting(true);
      
      // Get auth token from localStorage
      const token = localStorage.getItem("auth_token");
      
      if (!token) {
        setError("Please login to delete courses");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/courses/${courseToDelete.courseCode}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user");
          setError("Session expired. Please login again.");
          return;
        }
        
        const errorText = await response.text();
        throw new Error(`Failed to delete course (${response.status}): ${errorText}`);
      }

      const result: DeleteResponse = await response.json();

      if (result.success) {
        // Remove the deleted course from the local state
        setCourses(prevCourses => 
          prevCourses.filter(course => course.courseCode !== courseToDelete.courseCode)
        );
        
        // Show success message (optional)
        console.log('Course deleted successfully:', result.message);
        
        // Close the modal
        setIsDeleteModalOpen(false);
        setCourseToDelete(null);
        
        // Optionally refresh the courses list to ensure consistency
        fetchCourses();
      } else {
        throw new Error(result.message || 'Failed to delete course');
      }
    } catch (err) {
      console.error('Error deleting course:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete course');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setCourseToDelete(null);
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
                <CardTitle className="text-base leading-tight line-clamp-2 flex items-center justify-between gap-2">
                  <span className="flex-1 truncate">{course.courseName}</span>
                  <button
                    onClick={(e) => handleDeleteClick(e, course)}
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                    title="Delete course"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        courseName={courseToDelete?.courseName || ''}
        courseCode={courseToDelete?.courseCode || ''}
        isDeleting={isDeleting}
      />
    </>
  );
}