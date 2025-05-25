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

class StudentController extends Controller
{
    /**
     * Display a listing of students.
     * By default, only shows non-deleted students due to SoftDeletes trait
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Student::query();
            
            // Option to include trashed students
            if ($request->has('include_deleted') && $request->get('include_deleted') == 'true') {
                $query = Student::withTrashed();
            }
            
            // Option to show only deleted students
            if ($request->has('only_deleted') && $request->get('only_deleted') == 'true') {
                $query = Student::onlyTrashed();
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
     * Store a newly created student in storage.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate([
                'student_id' => 'required|integer|unique:students,student_id',
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'program' => 'required|string|max:255',
                'enrolled_course' => 'required|string|max:255|exists:courses,course_code',
            ]);
            
            $student = Student::create($validatedData);
            
            return response()->json([
                'success' => true,
                'data' => $student,
                'message' => 'Student created successfully'
            ], 201);
            
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create student',
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
            // Validate the request
            $request->validate([
                'students' => 'required|array|min:1',
                'students.*.student_id' => 'required|integer',
                'students.*.first_name' => 'required|string|max:255',
                'students.*.last_name' => 'required|string|max:255',
                'students.*.program' => 'required|string|max:255',
                'students.*.enrolled_course' => 'required|string|max:255',
                'course_info' => 'sometimes|array', // Optional course info from CSV
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

            DB::beginTransaction();

            // Check if we need to create the course
            $courseCode = $students[0]['enrolled_course'] ?? null;
            if ($courseCode) {
                $courseExists = DB::table('courses')
                    ->where('course_code', $courseCode)
                    ->exists();

                if (!$courseExists) {
                    // Try to create the course with available information
                    $courseName = $courseInfo['course_name'] ?? $courseCode;
                    
                    // For now, assign to a default teacher (you can modify this logic)
                    $defaultTeacherId = DB::table('instructors')->first()->teacher_id ?? 1;
                    
                    DB::table('courses')->insert([
                        'course_code' => $courseCode,
                        'course_name' => $courseName,
                        'assigned_teacher' => $defaultTeacherId,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                    
                    $courseCreated = true;
                }
            }

            foreach ($students as $index => $studentData) {
                try {
                    // Course should exist now (either already existed or was created above)
                    $courseExists = DB::table('courses')
                        ->where('course_code', $studentData['enrolled_course'])
                        ->exists();

                    if (!$courseExists) {
                        $errors[] = [
                            'row' => $index + 1,
                            'student_id' => $studentData['student_id'],
                            'error' => "Course code '{$studentData['enrolled_course']}' could not be created or found"
                        ];
                        $errorCount++;
                        continue;
                    }

                    // Check for existing student
                    $existingStudent = Student::withTrashed()
                        ->where('student_id', $studentData['student_id'])
                        ->first();

                    if ($existingStudent) {
                        if ($existingStudent->trashed()) {
                            // Restore and update the soft-deleted student
                            $existingStudent->restore();
                            $existingStudent->update([
                                'first_name' => $studentData['first_name'],
                                'last_name' => $studentData['last_name'],
                                'program' => $studentData['program'],
                                'enrolled_course' => $studentData['enrolled_course'],
                            ]);
                            $successCount++;
                        } else {
                            // Student already exists and is active
                            $duplicates[] = [
                                'row' => $index + 1,
                                'student_id' => $studentData['student_id'],
                                'name' => $studentData['first_name'] . ' ' . $studentData['last_name']
                            ];
                            $errorCount++;
                        }
                        continue;
                    }

                    // Create new student
                    Student::create([
                        'student_id' => $studentData['student_id'],
                        'first_name' => $studentData['first_name'],
                        'last_name' => $studentData['last_name'],
                        'program' => $studentData['program'],
                        'enrolled_course' => $studentData['enrolled_course'],
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

            DB::commit();

            $message = "Import completed. {$successCount} students imported successfully.";
            if ($courseCreated) {
                $message .= " Course '{$courseCode}' was created automatically.";
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
     * Get detailed course information with students
     */
    public function getCourseDetails($courseCode): JsonResponse
    {
        try {
            $course = Course::with(['instructor', 'students'])
                ->where('course_code', $courseCode)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found'
                ], 404);
            }

            // Get students for this course (including soft-deleted ones)
            $activeStudents = Student::withTrashed()
                ->where('enrolled_course', $courseCode)
                ->select([
                    'student_id', // Use student_id as primary identifier
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
                'semester' => '2ND SEMESTER AY 2024-2025', // This could be dynamic
                'group' => 'Group 3', // This could be dynamic
                'schedule' => 'FSat - 10:30 AM - 01:30 PM', // This could come from additional data
                'location' => 'CNLab', // This could come from additional data
                'enrolled_count' => $activeStudents->whereNull('deleted_at')->count(),
                'total_students' => $activeStudents->count(),
                'created_at' => $course->created_at->setTimezone('Asia/Manila')->toISOString(),
                'updated_at' => $course->updated_at->setTimezone('Asia/Manila')->toISOString(),
                'students' => $activeStudents->map(function ($student) {
                    return [
                        'id' => $student->student_id, // Use student_id as id for frontend
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

    /**
     * Display the specified student.
     * Will automatically exclude soft-deleted students unless specified otherwise
     */
    public function show(string $id, Request $request): JsonResponse
    {
        try {
            $query = Student::where('student_id', $id);
            
            // Option to include trashed students in search
            if ($request->has('include_deleted') && $request->get('include_deleted') == 'true') {
                $query = Student::withTrashed()->where('student_id', $id);
            }
            
            $student = $query->firstOrFail();
            
            return response()->json([
                'success' => true,
                'data' => $student,
                'message' => 'Student retrieved successfully'
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified student in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            $student = Student::where('student_id', $id)->firstOrFail();
            
            $validatedData = $request->validate([
                'student_id' => 'sometimes|required|integer|unique:students,student_id,' . $student->id,
                'first_name' => 'sometimes|required|string|max:255',
                'last_name' => 'sometimes|required|string|max:255',
                'program' => 'sometimes|required|string|max:255',
                'enrolled_course' => 'sometimes|required|string|max:255|exists:courses,course_code',
            ]);
            
            $student->update($validatedData);
            
            return response()->json([
                'success' => true,
                'data' => $student->fresh(),
                'message' => 'Student updated successfully'
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Soft delete the specified student.
     * This will set the deleted_at timestamp without removing the record from database
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $student = Student::where('student_id', $id)->firstOrFail();
            $student->delete(); // This performs soft delete due to SoftDeletes trait
            
            return response()->json([
                'success' => true,
                'message' => 'Student soft deleted successfully',
                'data' => [
                    'student_id' => $student->student_id,
                    'deleted_at' => $student->deleted_at
                ]
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore a soft-deleted student.
     */
    public function restore(string $id): JsonResponse
    {
        try {
            $student = Student::onlyTrashed()->where('student_id', $id)->firstOrFail();
            $student->restore();
            
            return response()->json([
                'success' => true,
                'data' => $student->fresh(),
                'message' => 'Student restored successfully'
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Deleted student not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to restore student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Permanently delete a student from the database.
     * This will completely remove the record from the database
     */
    public function forceDelete(string $id): JsonResponse
    {
        try {
            $student = Student::withTrashed()->where('student_id', $id)->firstOrFail();
            $studentData = $student->toArray(); // Store data before permanent deletion
            $student->forceDelete();
            
            return response()->json([
                'success' => true,
                'message' => 'Student permanently deleted from database',
                'data' => $studentData
            ]);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Student not found'
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to permanently delete student',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}