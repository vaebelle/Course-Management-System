'use client';

import { useState, useEffect } from "react";
import { Search, FileText, RefreshCw } from 'lucide-react';

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
  const [filteredActivities, setFilteredActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE_URL = 'http://localhost:8000/api';

  useEffect(() => {
    fetchAllActivities();
  }, []);

  useEffect(() => {
    // Filter activities based on search term
    const filtered = activities.filter(activity =>
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.action.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredActivities(filtered);
  }, [searchTerm, activities]);

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
        return 'bg-green-100 text-green-800';
      case 'updated':
        return 'bg-blue-100 text-blue-800';
      case 'deleted':
        return 'bg-red-100 text-red-800';
      case 'restored':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const getTypeIcon = (type: string) => {
    return type === 'course' ? '📚' : '👤';
  };

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-green-600 text-white p-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white bg-opacity-20 rounded flex items-center justify-center">
              <span className="text-sm">📋</span>
            </div>
            <h2 className="text-lg font-semibold">Activity Logs</h2>
          </div>
        </div>
        <div className="flex justify-center items-center py-16">
          <div className="flex items-center space-x-2 text-gray-600">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-lg">Loading activities...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-green-600 text-white p-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white bg-opacity-20 rounded flex items-center justify-center">
              <span className="text-sm">📋</span>
            </div>
            <h2 className="text-lg font-semibold">Activity Logs</h2>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-red-500 mb-4 text-lg">Error: {error}</div>
          <button 
            onClick={fetchAllActivities}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header Section */}
      <div className="bg-green-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-white bg-opacity-20 rounded flex items-center justify-center">
              <span className="text-sm">📋</span>
            </div>
            <h2 className="text-lg font-semibold">Activity Logs ({filteredActivities.length})</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={fetchAllActivities}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-1 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wide">
                Type
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wide">
                Action
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wide">
                Description
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wide">
                Date
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wide">
                Time
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 text-sm uppercase tracking-wide">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredActivities.map((activity, index) => (
              <tr key={activity.id} className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                <td className="py-3 px-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getTypeIcon(activity.type)}</span>
                    <span className="font-medium text-gray-900 capitalize">{activity.type}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{getActionIcon(activity.action)}</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(activity.action)}`}>
                      {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-900 font-medium max-w-xs">
                  <div className="truncate" title={activity.description}>
                    {activity.description}
                  </div>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {activity.formattedDate}
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">
                  {activity.formattedTime}
                </td>
                <td className="py-3 px-4 text-sm text-gray-500 max-w-xs">
                  <div className="truncate" title={activity.details}>
                    {activity.details || 'No additional details'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredActivities.length === 0 && !loading && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-lg mb-2">No activities found</p>
          <p className="text-sm">
            {searchTerm ? 'Try adjusting your search terms' : 'No recent activities to display'}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="bg-gray-50 px-4 py-3 border-t">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredActivities.length} of {activities.length} activities
            {searchTerm && ` (filtered by "${searchTerm}")`}
          </span>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 transition-colors">
              Previous
            </button>
            <span className="px-3 py-1 bg-green-600 text-white rounded text-sm">1</span>
            <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}