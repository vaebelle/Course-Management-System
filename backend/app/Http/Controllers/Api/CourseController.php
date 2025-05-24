<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    /**
     * Get all courses with instructor information
     */
    public function index()
    {
        try {
            $courses = Course::with('instructor')
                ->select([
                    'course_code',
                    'course_name',
                    'assigned_teacher',
                    'created_at',
                    'updated_at'
                ])
                ->get()
                ->map(function ($course) {
                    return [
                        'id' => $course->course_code,
                        'courseName' => $course->course_name,
                        'courseCode' => $course->course_code,
                        'instructorName' => $course->instructor 
                            ? $course->instructor->first_name . ' ' . $course->instructor->last_name 
                            : 'No Instructor Assigned',
                        'semester' => '2ND SEMESTER AY 2024-2025', 
                        'group' => 'Group 3', 
                        'color' => 'bg-blue-500',
                        'created_at' => $course->created_at->setTimezone('Asia/Manila')->toISOString(),
                        'updated_at' => $course->updated_at->setTimezone('Asia/Manila')->toISOString(),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $courses,
                'message' => 'Courses retrieved successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve courses',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get courses for a specific instructor
     */
    public function getByInstructor($teacherId)
    {
        try {
            $courses = Course::with('instructor')
                ->where('assigned_teacher', $teacherId)
                ->get()
                ->map(function ($course) {
                    return [
                        'id' => $course->course_code,
                        'courseName' => $course->course_name,
                        'courseCode' => $course->course_code,
                        'instructorName' => $course->instructor 
                            ? $course->instructor->first_name . ' ' . $course->instructor->last_name 
                            : 'No Instructor Assigned',
                        'semester' => '2ND SEMESTER AY 2024-2025',
                        'group' => 'Group 3',
                        'color' => 'bg-blue-500',
                        'created_at' => $course->created_at,
                        'updated_at' => $course->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $courses,
                'message' => 'Instructor courses retrieved successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve instructor courses',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}