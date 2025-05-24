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
  courseCode: string;
  createdAt: string;
  formattedDate: string;
  formattedTime: string;
}

interface ApiResponse {
  success: boolean;
  data: any[];
  message: string;
}

export default function ActivityList() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Replace with your Laravel backend URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/instructor/activitylog';

  useEffect(() => {
    fetchCourseActivities();
  }, []);

  const fetchCourseActivities = async () => {
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
        // Transform course data into activity entries
        const activityEntries = result.data.map((course) => {
          const createdDate = new Date(course.created_at);
          
          return {
            id: course.id,
            courseCode: course.courseCode,
            createdAt: course.created_at,
            formattedDate: createdDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              timeZone: 'Asia/Manila' // Set to your timezone
            }),
            formattedTime: createdDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
              timeZone: 'Asia/Manila' // Set to your timezone
            })
          };
        });

        // Sort by creation date (newest first)
        activityEntries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setActivities(activityEntries);
      } else {
        setError(result.message || 'Failed to fetch activities');
      }
    } catch (err) {
      console.error('Error fetching course activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
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
            onClick={fetchCourseActivities}
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
          <div className="text-gray-500 mb-4">No course activities found</div>
          <button 
            onClick={fetchCourseActivities}
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
      <TableCaption>A list of your recent course activities ({activities.length} total).</TableCaption>
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
            <TableCell>Created a Course: {entry.courseCode}</TableCell>
            <TableCell>{entry.formattedTime}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}