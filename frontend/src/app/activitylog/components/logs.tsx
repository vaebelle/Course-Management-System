'use client';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { useState, useEffect } from "react";

interface ActivityEntry {
  id: string;
  type: 'course' | 'student';
  action: 'created' | 'updated' | 'deleted' | 'restored';
  timestamp: string;
  formattedDate: string;
  formattedTime: string;
  description: string;
  details?: string;
}

interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  program: string;
  enrolled_course: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

interface Course {
  id: string;
  courseCode: string;
  created_at: string;
  updated_at: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface PaginatedStudentResponse {
  data: Student[];
  total: number;
  per_page: number;
  current_page: number;
}

export default function ActivityList() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    fetchAllActivities();
  }, []);

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      formattedDate: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Manila'
      }),
      formattedTime: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Manila'
      })
    };
  };

  const fetchAllActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch courses and students in parallel
      const [coursesResponse, studentsResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/courses`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }),
        fetch(`${API_BASE_URL}/students?include_deleted=true&per_page=1000`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        })
      ]);

      if (!coursesResponse.ok) {
        throw new Error(`Courses API error! status: ${coursesResponse.status}`);
      }

      if (!studentsResponse.ok) {
        throw new Error(`Students API error! status: ${studentsResponse.status}`);
      }

      const coursesResult: ApiResponse<Course[]> = await coursesResponse.json();
      const studentsResult: ApiResponse<PaginatedStudentResponse> = await studentsResponse.json();

      const allActivities: ActivityEntry[] = [];

      // Process course activities
      if (coursesResult.success && Array.isArray(coursesResult.data)) {
        coursesResult.data.forEach((course) => {
          const { formattedDate, formattedTime } = formatDateTime(course.created_at);
          
          allActivities.push({
            id: `course-${course.id}-created`,
            type: 'course',
            action: 'created',
            timestamp: course.created_at,
            formattedDate,
            formattedTime,
            description: `Created Course: ${course.courseCode}`,
            details: `Course Code: ${course.courseCode}`
          });
        });
      }

      // Process student activities
      if (studentsResult.success && studentsResult.data?.data) {
        studentsResult.data.data.forEach((student) => {
          const studentName = `${student.first_name} ${student.last_name}`;
          const id_number = `${student.student_id}`;
          
          // Check if created_at and updated_at are the same
          if (student.created_at === student.updated_at) {
            // Student enrolled activity (only when created_at equals updated_at)
            const createdDateTime = formatDateTime(student.created_at);
            allActivities.push({
              id: `student-${student.student_id}-enrolled`,
              type: 'student',
              action: 'created',
              timestamp: student.created_at,
              formattedDate: createdDateTime.formattedDate,
              formattedTime: createdDateTime.formattedTime,
              description: `Student Enrolled: ${id_number} - ${studentName}`,
              details: `ID: ${student.student_id}, Program: ${student.program}, Course: ${student.enrolled_course}`
            });
          } else {
            // Student updated activity (only when created_at is different from updated_at)
            const updatedDateTime = formatDateTime(student.updated_at);
            allActivities.push({
              id: `student-${student.student_id}-updated`,
              type: 'student',
              action: 'updated',
              timestamp: student.updated_at,
              formattedDate: updatedDateTime.formattedDate,
              formattedTime: updatedDateTime.formattedTime,
              description: `Student Updated: ${id_number} - ${studentName}`,
              details: `ID: ${student.student_id}, Changes to student information`
            });
          }

          // Student deleted activity (if soft deleted)
          if (student.deleted_at) {
            const deletedDateTime = formatDateTime(student.deleted_at);
            allActivities.push({
              id: `student-${student.student_id}-deleted`,
              type: 'student',
              action: 'deleted',
              timestamp: student.deleted_at,
              formattedDate: deletedDateTime.formattedDate,
              formattedTime: deletedDateTime.formattedTime,
              description: `Student Deleted: ${studentName}`,
              details: `ID: ${student.student_id}, Soft deleted from system`
            });
          }
        });
      }

      // Sort all activities by timestamp (newest first)
      allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setActivities(allActivities);

    } catch (err) {
      console.error('Error fetching activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'text-green-600 bg-green-50';
      case 'updated':
        return 'text-blue-600 bg-blue-50';
      case 'deleted':
        return 'text-red-600 bg-red-50';
      case 'restored':
        return 'text-purple-600 bg-purple-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return '✅';
      case 'updated':
        return '✏️';
      case 'deleted':
        return '🗑️';
      case 'restored':
        return '♻️';
      default:
        return '📝';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white p-4">
        <div className="flex justify-center items-center py-8">
          <div className="text-lg">Loading activities...</div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white p-4">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <button 
            onClick={fetchAllActivities}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No activities state
  if (activities.length === 0) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-white p-4">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="text-gray-500 mb-4">No activities found</div>
          <button 
            onClick={fetchAllActivities}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <Table className="w-full max-w-2xl mx-auto bg-white">
      <TableCaption>A list of your recent activities ({activities.length} total).</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Date</TableHead>
          <TableHead>Activity</TableHead>
          <TableHead>Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {activities.map((entry) => (
          <TableRow key={entry.id}>
            <TableCell className="font-medium">{entry.formattedDate}</TableCell>
            <TableCell>{entry.description}</TableCell>
            <TableCell>{entry.formattedTime}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}