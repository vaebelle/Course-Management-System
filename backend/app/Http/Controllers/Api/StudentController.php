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

            // Only show students enrolled by this instructor
            $query = Student::where('enrolled_by_instructor', $instructor->teacher_id);
            
            // Option to include trashed students
            if ($request->has('include_deleted') && $request->get('include_deleted') == 'true') {
                $query = Student::withTrashed()->where('enrolled_by_instructor', $instructor->teacher_id);
            }
            
            // Option to show only deleted students
            if ($request->has('only_deleted') && $request->get('only_deleted') == 'true') {
                $query = Student::onlyTrashed()->where('enrolled_by_instructor', $instructor->teacher_id);
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
            $courseCode = $students[0]['enrolled_course'] ?? null;

            DB::beginTransaction();

            // First pass: Check all students for duplicates/errors before creating course
            $validStudents = [];
            $tempErrors = [];
            $tempDuplicates = [];

            foreach ($students as $index => $studentData) {
                try {
                    // Check if student already exists in THIS SPECIFIC COURSE (ANYWHERE)
                    // This includes both active and soft-deleted students
                    $existingStudentInAnyCourse = Student::withTrashed()
                        ->where('student_id', $studentData['student_id'])
                        ->where('enrolled_course', $studentData['enrolled_course'])
                        ->first();

                    if ($existingStudentInAnyCourse) {
                        // Student exists in this course - ALWAYS BLOCK regardless of instructor
                        $currentInstructor = null;
                        if ($existingStudentInAnyCourse->enrolledByInstructor) {
                            $currentInstructor = $existingStudentInAnyCourse->enrolledByInstructor->first_name . ' ' . 
                                               $existingStudentInAnyCourse->enrolledByInstructor->last_name;
                        }

                        if ($existingStudentInAnyCourse->trashed()) {
                            // Even if soft-deleted, still block - don't allow any instructor to "steal" students
                            $tempDuplicates[] = [
                                'row' => $index + 1,
                                'student_id' => $studentData['student_id'],
                                'name' => $studentData['first_name'] . ' ' . $studentData['last_name'],
                                'current_course' => $existingStudentInAnyCourse->enrolled_course,
                                'note' => 'Student was previously enrolled in this course with ' . ($currentInstructor ?? 'another instructor') . '. Cannot re-enroll with different instructor.'
                            ];
                        } else {
                            // Student is currently active in this course - BLOCK THIS
                            $tempDuplicates[] = [
                                'row' => $index + 1,
                                'student_id' => $studentData['student_id'],
                                'name' => $studentData['first_name'] . ' ' . $studentData['last_name'],
                                'current_course' => $existingStudentInAnyCourse->enrolled_course,
                                'current_instructor' => $currentInstructor,
                                'note' => 'Student is currently enrolled in this course with ' . ($currentInstructor ?? 'another instructor') . '. Cannot enroll with multiple instructors.'
                            ];
                        }
                    } else {
                        // Student is not in this course yet - mark as valid for import
                        $validStudents[] = ['index' => $index, 'data' => $studentData];
                    }

                } catch (\Exception $e) {
                    $tempErrors[] = [
                        'row' => $index + 1,
                        'student_id' => $studentData['student_id'] ?? 'Unknown',
                        'error' => $e->getMessage()
                    ];
                }
            }

            // If no valid students to import, don't create course and return failure
            if (empty($validStudents)) {
                DB::rollBack();
                
                $message = "Import failed. No students were imported";
                if (!empty($tempDuplicates)) {
                    $message .= ".";
                } else if (!empty($tempErrors)) {
                    $message .= " All students had errors during validation.";
                }

                return response()->json([
                    'success' => false,
                    'message' => $message,
                    'summary' => [
                        'total_processed' => count($students),
                        'successful' => 0,
                        'errors' => count($tempErrors),
                        'duplicates' => count($tempDuplicates),
                        'course_created' => false
                    ],
                    'errors' => $tempErrors,
                    'duplicates' => $tempDuplicates
                ], 422);
            }

            // We have valid students to import, so create/verify course exists
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

            // Process valid students
            foreach ($validStudents as $validStudent) {
                $index = $validStudent['index'];
                $studentData = $validStudent['data'];

                try {
                    // Verify course is assigned to current instructor (should always pass now)
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

                    // Create new student enrollment (no restore logic - students belong to one instructor only)
                    Student::create([
                        'student_id' => $studentData['student_id'],
                        'first_name' => $studentData['first_name'],
                        'last_name' => $studentData['last_name'],
                        'program' => $studentData['program'],
                        'enrolled_course' => $studentData['enrolled_course'],
                        'enrolled_by_instructor' => $instructor->teacher_id,
                    ]);
                    $successCount++;

                } catch (\Exception $e) {
                    $errors[] = [
                        'row' => $index + 1,
                        'student_id' => $studentData['student_id'] ?? 'Unknown',
                        'error' => $e->getMessage()
                    ];
                    $errorCount++;
                }
            }

            // Merge temporary arrays with final results
            $errors = array_merge($errors, $tempErrors);
            $duplicates = $tempDuplicates;
            $errorCount += count($tempErrors);

            DB::commit();

            // Final success response - we know successCount > 0 at this point
            $message = "Import completed. {$successCount} students imported successfully.";
            if ($courseCreated) {
                $message .= " Course '{$courseCode}' section has been assigned to you.";
            }

            // Add warning if some students were skipped
            if ($errorCount > 0 || count($duplicates) > 0) {
                $message .= " {$errorCount} students had errors and " . count($duplicates) . " duplicates were skipped.";
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
     * Get detailed course information with students (ONLY for instructor's section)
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

            // CRITICAL FIX: Get students ONLY for THIS INSTRUCTOR'S section
            // This prevents Teacher B from seeing Student 123 if they were enrolled by Teacher A
            $students = Student::withTrashed()
                ->where('enrolled_course', $courseCode)
                ->where('enrolled_by_instructor', $instructor->teacher_id) // ONLY students enrolled by this instructor
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

 
}