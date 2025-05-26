<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Student;  
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class CourseController extends Controller
{
    /**
     * Get all courses for the authenticated instructor
     */
    public function index()
    {
        try {
            // Get the authenticated instructor
            $instructor = Auth::user();
            
            if (!$instructor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Please login first'
                ], 401);
            }

            // Only get courses assigned to this instructor
            $courses = Course::with('instructor')
                ->where('assigned_teacher', $instructor->teacher_id)
                ->select([
                    'course_code',
                    'course_name',
                    'assigned_teacher',
                    'schedule',
                    'location',
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
                        'schedule' => $course->schedule ?? 'TBD',
                        'location' => $course->location ?? 'TBD',
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
     * Get courses for a specific instructor (only if it's the authenticated user)
     */
    public function getByInstructor($teacherId)
    {
        try {
            $instructor = Auth::user();
            
            if (!$instructor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Please login first'
                ], 401);
            }

            // Ensure instructor can only access their own courses
            if ($instructor->teacher_id != $teacherId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Forbidden - You can only access your own courses'
                ], 403);
            }

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
                        'schedule' => $course->schedule ?? 'TBD',
                        'location' => $course->location ?? 'TBD',
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

    /**
     * Delete a course and all its enrolled students
     */
    public function destroy($courseCode)
    {
        try {
            $instructor = Auth::user();
            
            if (!$instructor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Please login first'
                ], 401);
            }

            DB::beginTransaction();
            
            // Get course details before deletion for logging
            $course = Course::where('course_code', $courseCode)
                ->where('assigned_teacher', $instructor->teacher_id)
                ->first();
            
            if (!$course) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found or you do not have permission to delete it'
                ], 404);
            }

            // Log the course deletion BEFORE actually deleting
            ActivityLog::logActivity(
                'course',
                'deleted',
                $course->course_code,
                $course->course_name,
                "Course {$course->course_code} - {$course->course_name} was deleted",
                $instructor->id
            );
            
            // Delete all students enrolled in this course (by this instructor)
            $deletedStudents = DB::table('students')
                ->where('enrolled_course', $courseCode)
                ->where('enrolled_by_instructor', $instructor->teacher_id)
                ->delete();
            
            // Delete the course
            $deletedCourse = DB::table('courses')
                ->where('course_code', $courseCode)
                ->where('assigned_teacher', $instructor->teacher_id)
                ->delete();
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => "Course {$courseCode} and {$deletedStudents} enrolled students deleted successfully"
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete course',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed course information including enrolled students
     */
    public function getCourseDetails($courseCode)
    {
        try {
            // Get the authenticated instructor
            $instructor = Auth::user();
            
            if (!$instructor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Please login first'
                ], 401);
            }

            // Get course details - only if it belongs to this instructor
            $course = Course::with('instructor')
                ->where('course_code', $courseCode)
                ->where('assigned_teacher', $instructor->teacher_id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found or you do not have access to it'
                ], 404);
            }

            // Get students enrolled in this course by this instructor
            $students = Student::withTrashed()
                ->where('enrolled_course', $courseCode)
                ->where('enrolled_by_instructor', $instructor->teacher_id)
                ->select([
                    'id',
                    'student_id', 
                    'first_name',
                    'last_name',
                    'program',
                    'enrolled_course',
                    'enrolled_by_instructor',
                    'created_at',
                    'updated_at',
                    'deleted_at'
                ])
                ->get();

            $courseDetails = [
                'course_code' => $course->course_code,
                'course_name' => $course->course_name,
                'instructor_name' => $course->instructor 
                    ? $course->instructor->first_name . ' ' . $course->instructor->last_name 
                    : 'No Instructor Assigned',
                'instructor_email' => $course->instructor ? $course->instructor->email : null,
                'semester' => '2ND SEMESTER AY 2024-2025',
                'group' => 'Group 3',
                'schedule' => $course->schedule ?? 'TBD',
                'location' => $course->location ?? 'TBD',
                'enrolled_count' => $students->whereNull('deleted_at')->count(),
                'total_students' => $students->count(),
                'created_at' => $course->created_at->setTimezone('Asia/Manila')->toISOString(),
                'updated_at' => $course->updated_at->setTimezone('Asia/Manila')->toISOString(),
                'students' => $students->map(function ($student) {
                    return [
                        'id' => $student->student_id,
                        'student_id' => $student->student_id,
                        'first_name' => $student->first_name,
                        'last_name' => $student->last_name,
                        'full_name' => $student->first_name . ' ' . $student->last_name,
                        'program' => $student->program,
                        'enrolled_course' => $student->enrolled_course,
                        'status' => $student->deleted_at ? 'inactive' : 'active',
                        'enrolled_date' => $student->created_at->setTimezone('Asia/Manila')->toDateString(),
                        'created_at' => $student->created_at->setTimezone('Asia/Manila')->toISOString(),
                        'updated_at' => $student->updated_at->setTimezone('Asia/Manila')->toISOString(),
                        'deleted_at' => $student->deleted_at ? $student->deleted_at->setTimezone('Asia/Manila')->toISOString() : null,
                    ];
                })
            ];

            return response()->json([
                'success' => true,
                'data' => $courseDetails,
                'message' => 'Course details retrieved successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve course details',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}