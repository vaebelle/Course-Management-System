<?php

namespace App\Http\Controllers\Api;

use App\Models\Student;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class StudentController extends Controller
{
    /**
     * Display a listing of students for the authenticated instructor only
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $instructor = Auth::user();
            
            if (!$instructor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Please login first'
                ], 401);
            }

            // Get courses assigned to this instructor
            $instructorCourses = Course::where('assigned_teacher', $instructor->teacher_id)
                ->pluck('course_code')
                ->toArray();

            // Only show students enrolled in this instructor's courses
            $query = Student::whereIn('enrolled_course', $instructorCourses);
            
            // Option to include trashed students
            if ($request->has('include_deleted') && $request->get('include_deleted') == 'true') {
                $query = Student::withTrashed()->whereIn('enrolled_course', $instructorCourses);
            }
            
            // Option to show only deleted students
            if ($request->has('only_deleted') && $request->get('only_deleted') == 'true') {
                $query = Student::onlyTrashed()->whereIn('enrolled_course', $instructorCourses);
            }
            
            // Add search functionality
            if ($request->has('search')) {
                $search = $request->get('search');
                $query->where(function($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('student_id', 'like', "%{$search}%")
                      ->orWhere('program', 'like', "%{$search}%")
                      ->orWhere('enrolled_course', 'like', "%{$search}%");
                });
            }
            
            // Add pagination
            $perPage = $request->get('per_page', 15);
            $students = $query->paginate($perPage);
            
            return response()->json([
                'success' => true,
                'data' => $students,
                'message' => 'Students retrieved successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve students',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Import students from CSV data
     */
    public function importFromCsv(Request $request): JsonResponse
    {
        try {
            $instructor = Auth::user();
            
            if (!$instructor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Please login first'
                ], 401);
            }

            // Validate the request
            $request->validate([
                'students' => 'required|array|min:1',
                'students.*.student_id' => 'required|integer',
                'students.*.first_name' => 'required|string|max:255',
                'students.*.last_name' => 'required|string|max:255',
                'students.*.program' => 'required|string|max:255',
                'students.*.enrolled_course' => 'required|string|max:255',
                'course_info' => 'sometimes|array',
                'course_info.course_code' => 'sometimes|string|max:255',
                'course_info.course_name' => 'sometimes|string|max:255',
                'course_info.teacher_name' => 'sometimes|string|max:255',
            ]);

            $students = $request->input('students');
            $courseInfo = $request->input('course_info', []);
            $successCount = 0;
            $errorCount = 0;
            $errors = [];
            $duplicates = [];
            $courseCreated = false;
            $courseAssigned = false;

            DB::beginTransaction();

            // Check if we need to create the course or assign it to current instructor
            $courseCode = $students[0]['enrolled_course'] ?? null;
            if ($courseCode) {
                // Check if current instructor already has this course assigned
                $instructorCourse = Course::where('course_code', $courseCode)
                    ->where('assigned_teacher', $instructor->teacher_id)
                    ->first();
                
                if (!$instructorCourse) {
                    // Instructor doesn't have this course yet, create/assign it
                    $courseName = $courseInfo['course_name'] ?? $courseCode;
                    
                    Course::create([
                        'course_code' => $courseCode,
                        'course_name' => $courseName,
                        'assigned_teacher' => $instructor->teacher_id,
                    ]);
                    
                    $courseCreated = true;
                }
            }

            foreach ($students as $index => $studentData) {
                try {
                    // Verify course is assigned to current instructor
                    $instructorCourse = Course::where('course_code', $studentData['enrolled_course'])
                        ->where('assigned_teacher', $instructor->teacher_id)
                        ->first();
                    
                    if (!$instructorCourse) {
                        $errors[] = [
                            'row' => $index + 1,
                            'student_id' => $studentData['student_id'],
                            'error' => "Course '{$studentData['enrolled_course']}' is not assigned to you"
                        ];
                        $errorCount++;
                        continue;
                    }

                    // Check if student already exists in ANY course taught by this instructor
                    $instructorCourses = Course::where('assigned_teacher', $instructor->teacher_id)
                        ->pluck('course_code')
                        ->toArray();
                    
                    $existingStudentInInstructorCourses = Student::withTrashed()
                        ->where('student_id', $studentData['student_id'])
                        ->whereIn('enrolled_course', $instructorCourses)
                        ->first();

                    if ($existingStudentInInstructorCourses) {
                        if ($existingStudentInInstructorCourses->trashed()) {
                            // Restore and update the soft-deleted student
                            $existingStudentInInstructorCourses->restore();
                            $existingStudentInInstructorCourses->update([
                                'first_name' => $studentData['first_name'],
                                'last_name' => $studentData['last_name'],
                                'program' => $studentData['program'],
                                'enrolled_course' => $studentData['enrolled_course'],
                            ]);
                            $successCount++;
                        } else {
                            // Student already exists in this instructor's courses
                            $duplicates[] = [
                                'row' => $index + 1,
                                'student_id' => $studentData['student_id'],
                                'name' => $studentData['first_name'] . ' ' . $studentData['last_name'],
                                'current_course' => $existingStudentInInstructorCourses->enrolled_course
                            ];
                            $errorCount++;
                        }
                        continue;
                    }

                    // Check if student exists with same ID in same course (different instructor)
                    $existingStudentSameCourse = Student::where('student_id', $studentData['student_id'])
                        ->where('enrolled_course', $studentData['enrolled_course'])
                        ->first();

                    if ($existingStudentSameCourse) {
                        // Same student ID in same course but different instructor - this should be allowed
                        // Create new student record (different section of same course)
                        Student::create([
                            'student_id' => $studentData['student_id'],
                            'first_name' => $studentData['first_name'],
                            'last_name' => $studentData['last_name'],
                            'program' => $studentData['program'],
                            'enrolled_course' => $studentData['enrolled_course'],
                        ]);
                        $successCount++;
                    } else {
                        // Brand new student - create normally
                        Student::create([
                            'student_id' => $studentData['student_id'],
                            'first_name' => $studentData['first_name'],
                            'last_name' => $studentData['last_name'],
                            'program' => $studentData['program'],
                            'enrolled_course' => $studentData['enrolled_course'],
                        ]);
                        $successCount++;
                    }

                } catch (\Exception $e) {
                    $errors[] = [
                        'row' => $index + 1,
                        'student_id' => $studentData['student_id'] ?? 'Unknown',
                        'error' => $e->getMessage()
                    ];
                    $errorCount++;
                }
            }

            DB::commit();

            $message = "Import completed. {$successCount} students imported successfully.";
            if ($courseCreated) {
                $message .= " Course '{$courseCode}' section has been assigned to you.";
            }

            $response = [
                'success' => true,
                'message' => $message,
                'summary' => [
                    'total_processed' => count($students),
                    'successful' => $successCount,
                    'errors' => $errorCount,
                    'duplicates' => count($duplicates),
                    'course_created' => $courseCreated
                ]
            ];

            if (!empty($errors)) {
                $response['errors'] = $errors;
            }

            if (!empty($duplicates)) {
                $response['duplicates'] = $duplicates;
            }

            return response()->json($response, 200);

        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to import students',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get detailed course information with students (only for instructor's courses)
     */
    public function getCourseDetails($courseCode): JsonResponse
    {
        try {
            $instructor = Auth::user();
            
            if (!$instructor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Please login first'
                ], 401);
            }

            $course = Course::with(['instructor'])
                ->where('course_code', $courseCode)
                ->where('assigned_teacher', $instructor->teacher_id) // Only instructor's courses
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found or you do not have access to it'
                ], 404);
            }

            // Get students for this course
            $students = Student::withTrashed()
                ->where('enrolled_course', $courseCode)
                ->select([
                    'student_id',
                    'first_name',
                    'last_name',
                    'program',
                    'enrolled_course',
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
                'schedule' => 'FSat - 10:30 AM - 01:30 PM',
                'location' => 'CNLab',
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

    // ... (keep other methods like store, show, update, destroy, restore, forceDelete with similar instructor filtering)
}