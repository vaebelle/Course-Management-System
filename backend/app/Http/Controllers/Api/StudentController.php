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
     * Store a newly created student
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $instructor = Auth::user();
            
            if (!$instructor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Please login first'
                ], 401);
            }

            $request->validate([
                'student_id' => 'required|integer',
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'program' => 'required|string|max:255',
                'enrolled_course' => 'required|string|max:255',
            ]);

            // Check if student already exists in this course
            $existingStudent = Student::withTrashed()
                ->where('student_id', $request->student_id)
                ->where('enrolled_course', $request->enrolled_course)
                ->first();

            if ($existingStudent) {
                if ($existingStudent->trashed()) {
                    // Restore the soft-deleted student
                    $existingStudent->restore();
                    $existingStudent->update([
                        'first_name' => $request->first_name,
                        'last_name' => $request->last_name,
                        'program' => $request->program,
                        'enrolled_by_instructor' => $instructor->teacher_id,
                    ]);
                    
                    return response()->json([
                        'success' => true,
                        'message' => 'Student restored and updated successfully',
                        'data' => $existingStudent
                    ], 200);
                } else {
                    return response()->json([
                        'success' => false,
                        'message' => 'Student already exists in this course'
                    ], 422);
                }
            }

            // Verify the course belongs to this instructor
            $course = Course::where('course_code', $request->enrolled_course)
                ->where('assigned_teacher', $instructor->teacher_id)
                ->first();

            if (!$course) {
                return response()->json([
                    'success' => false,
                    'message' => 'Course not found or you do not have permission to enroll students'
                ], 403);
            }

            // Create new student
            $student = Student::create([
                'student_id' => $request->student_id,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'program' => $request->program,
                'enrolled_course' => $request->enrolled_course,
                'enrolled_by_instructor' => $instructor->teacher_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Student added successfully',
                'data' => $student
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
                'message' => 'Failed to add student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified student
     */
    public function show($id): JsonResponse
    {
        try {
            $instructor = Auth::user();
            
            if (!$instructor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Please login first'
                ], 401);
            }

            $student = Student::withTrashed()
                ->where('student_id', $id)
                ->where('enrolled_by_instructor', $instructor->teacher_id)
                ->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found or you do not have access'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $student,
                'message' => 'Student retrieved successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified student
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $instructor = Auth::user();
            
            if (!$instructor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Please login first'
                ], 401);
            }

            $request->validate([
                'first_name' => 'sometimes|required|string|max:255',
                'last_name' => 'sometimes|required|string|max:255',
                'program' => 'sometimes|required|string|max:255',
            ]);

            $student = Student::withTrashed()
                ->where('student_id', $id)
                ->where('enrolled_by_instructor', $instructor->teacher_id)
                ->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found or you do not have permission to update'
                ], 404);
            }

            $student->update($request->only(['first_name', 'last_name', 'program']));

            return response()->json([
                'success' => true,
                'message' => 'Student updated successfully',
                'data' => $student
            ]);

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
     * Soft delete the specified student
     */
    public function destroy($id): JsonResponse
    {
        try {
            $instructor = Auth::user();
            
            if (!$instructor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Please login first'
                ], 401);
            }

            $student = Student::where('student_id', $id)
                ->where('enrolled_by_instructor', $instructor->teacher_id)
                ->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found or you do not have permission to remove'
                ], 404);
            }

            $student->delete(); // Soft delete

            return response()->json([
                'success' => true,
                'message' => 'Student removed from course successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Restore a soft-deleted student
     */
    public function restore($id): JsonResponse
    {
        try {
            $instructor = Auth::user();
            
            if (!$instructor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Please login first'
                ], 401);
            }

            $student = Student::onlyTrashed()
                ->where('student_id', $id)
                ->where('enrolled_by_instructor', $instructor->teacher_id)
                ->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found or already active'
                ], 404);
            }

            $student->restore();

            return response()->json([
                'success' => true,
                'message' => 'Student restored successfully',
                'data' => $student
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to restore student',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Force delete the specified student (permanent deletion)
     */
    public function forceDelete($id): JsonResponse
    {
        try {
            $instructor = Auth::user();
            
            if (!$instructor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Please login first'
                ], 401);
            }

            $student = Student::withTrashed()
                ->where('student_id', $id)
                ->where('enrolled_by_instructor', $instructor->teacher_id)
                ->first();

            if (!$student) {
                return response()->json([
                    'success' => false,
                    'message' => 'Student not found or you do not have permission'
                ], 404);
            }

            $student->forceDelete(); // Permanent deletion

            return response()->json([
                'success' => true,
                'message' => 'Student permanently deleted'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to permanently delete student',
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
                'course_info.schedule' => 'sometimes|string|max:255',
                'course_info.location' => 'sometimes|string|max:255',
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
                    // Check if student already exists in THIS SPECIFIC COURSE with THIS INSTRUCTOR
                    $existingStudentSameInstructor = Student::withTrashed()
                        ->where('student_id', $studentData['student_id'])
                        ->where('enrolled_course', $studentData['enrolled_course'])
                        ->where('enrolled_by_instructor', $instructor->teacher_id)
                        ->first();

                    if ($existingStudentSameInstructor) {
                        // Student already exists with current instructor - this is a true duplicate
                        if ($existingStudentSameInstructor->trashed()) {
                            // Student was soft-deleted by this instructor - we can restore them
                            $validStudents[] = [
                                'index' => $index, 
                                'data' => $studentData, 
                                'restore' => $existingStudentSameInstructor
                            ];
                        } else {
                            // Student is currently active with this instructor - duplicate
                            $tempDuplicates[] = [
                                'row' => $index + 1,
                                'student_id' => $studentData['student_id'],
                                'name' => $studentData['first_name'] . ' ' . $studentData['last_name'],
                                'current_course' => $existingStudentSameInstructor->enrolled_course,
                                'note' => 'Student is already enrolled in this course with you.'
                            ];
                        }
                        continue;
                    }

                    // Check if student exists with a DIFFERENT instructor
                    $existingStudentDifferentInstructor = Student::withTrashed()
                        ->where('student_id', $studentData['student_id'])
                        ->where('enrolled_course', $studentData['enrolled_course'])
                        ->where('enrolled_by_instructor', '!=', $instructor->teacher_id)
                        ->first();

                    if ($existingStudentDifferentInstructor) {
                        // Student exists with different instructor - BLOCK this (business rule)
                        $currentInstructor = null;
                        if ($existingStudentDifferentInstructor->enrolledByInstructor) {
                            $currentInstructor = $existingStudentDifferentInstructor->enrolledByInstructor->first_name . ' ' . 
                                               $existingStudentDifferentInstructor->enrolledByInstructor->last_name;
                        }

                        $tempDuplicates[] = [
                            'row' => $index + 1,
                            'student_id' => $studentData['student_id'],
                            'name' => $studentData['first_name'] . ' ' . $studentData['last_name'],
                            'current_course' => $existingStudentDifferentInstructor->enrolled_course,
                            'current_instructor' => $currentInstructor,
                            'note' => 'Student is enrolled in this course with ' . ($currentInstructor ?? 'another instructor') . '. Cannot enroll with multiple instructors.'
                        ];
                        continue;
                    }

                    // Student is not in this course at all - can be imported
                    $validStudents[] = [
                        'index' => $index, 
                        'data' => $studentData, 
                        'restore' => null
                    ];

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
                    $message .= ". All students had errors during validation.";
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

            // Check if we have too few valid students (less than 50% of total)
            $validPercentage = (count($validStudents) / count($students)) * 100;
            if ($validPercentage < 50) {
                DB::rollBack();
                
                $message = "Import failed. Too many duplicate students ({$validPercentage}% valid). Course not created to prevent incomplete class lists.";

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
                    $schedule = $courseInfo['schedule'] ?? 'TBD';
                    $location = $courseInfo['location'] ?? 'TBD';
                    
                    Course::create([
                        'course_code' => $courseCode,
                        'course_name' => $courseName,
                        'assigned_teacher' => $instructor->teacher_id,
                        'schedule' => $schedule,
                        'location' => $location,
                    ]);
                    
                    $courseCreated = true;
                } else {
                    // Course exists, update schedule and location if provided
                    $updateData = [];
                    if (isset($courseInfo['schedule']) && $courseInfo['schedule'] !== 'TBD') {
                        $updateData['schedule'] = $courseInfo['schedule'];
                    }
                    if (isset($courseInfo['location']) && $courseInfo['location'] !== 'TBD') {
                        $updateData['location'] = $courseInfo['location'];
                    }
                    
                    if (!empty($updateData)) {
                        $instructorCourse->update($updateData);
                    }
                }
            }

            // Process valid students
            foreach ($validStudents as $validStudent) {
                $index = $validStudent['index'];
                $studentData = $validStudent['data'];
                $existingStudent = $validStudent['restore'] ?? null;

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

                    if ($existingStudent) {
                        // Restore and update the soft-deleted student (same instructor)
                        $existingStudent->restore();
                        $existingStudent->update([
                            'first_name' => $studentData['first_name'],
                            'last_name' => $studentData['last_name'],
                            'program' => $studentData['program'],
                            'enrolled_course' => $studentData['enrolled_course'],
                            'enrolled_by_instructor' => $instructor->teacher_id,
                        ]);
                        $successCount++;
                    } else {
                        // Create new student enrollment
                        Student::create([
                            'student_id' => $studentData['student_id'],
                            'first_name' => $studentData['first_name'],
                            'last_name' => $studentData['last_name'],
                            'program' => $studentData['program'],
                            'enrolled_course' => $studentData['enrolled_course'],
                            'enrolled_by_instructor' => $instructor->teacher_id,
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
     * Bulk import students from multiple CSV datasets
     */
    public function bulkImportFromCsv(Request $request): JsonResponse
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
                'imports' => 'required|array|min:1',
                'imports.*.course_code' => 'required|string|max:255',
                'imports.*.students' => 'required|array|min:1',
                'imports.*.students.*.student_id' => 'required|integer',
                'imports.*.students.*.first_name' => 'required|string|max:255',
                'imports.*.students.*.last_name' => 'required|string|max:255',
                'imports.*.students.*.program' => 'required|string|max:255',
                'imports.*.students.*.enrolled_course' => 'required|string|max:255',
                'imports.*.course_info' => 'sometimes|array',
                'imports.*.course_info.schedule' => 'sometimes|string|max:255',
                'imports.*.course_info.location' => 'sometimes|string|max:255',
            ]);

            $imports = $request->input('imports');
            $results = [];
            $successfulImports = 0;
            $failedImports = 0;

            DB::beginTransaction();

            foreach ($imports as $importIndex => $importData) {
                try {
                    $courseCode = $importData['course_code'];
                    $students = $importData['students'];
                    $courseInfo = $importData['course_info'] ?? [];

                    // Process each import individually
                    $importResult = $this->processSingleImport($instructor, $students, $courseInfo, $courseCode);
                    
                    $results[] = [
                        'course_code' => $courseCode,
                        'success' => $importResult['success'],
                        'message' => $importResult['message'],
                        'summary' => $importResult['summary'],
                        'errors' => $importResult['errors'] ?? [],
                        'duplicates' => $importResult['duplicates'] ?? []
                    ];

                    if ($importResult['success']) {
                        $successfulImports++;
                    } else {
                        $failedImports++;
                    }

                } catch (\Exception $e) {
                    $results[] = [
                        'course_code' => $importData['course_code'] ?? "Import " . ($importIndex + 1),
                        'success' => false,
                        'message' => 'Failed to process import: ' . $e->getMessage(),
                        'summary' => [
                            'total_processed' => 0,
                            'successful' => 0,
                            'errors' => 1,
                            'duplicates' => 0,
                            'course_created' => false
                        ],
                        'errors' => [['error' => $e->getMessage()]],
                        'duplicates' => []
                    ];
                    $failedImports++;
                }
            }

            DB::commit();

            return response()->json([
                'success' => $successfulImports > 0,
                'message' => "Bulk import completed. {$successfulImports} courses imported successfully, {$failedImports} failed.",
                'summary' => [
                    'total_imports' => count($imports),
                    'successful_imports' => $successfulImports,
                    'failed_imports' => $failedImports
                ],
                'results' => $results
            ], 200);

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
                'message' => 'Bulk import failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper method to process a single import
     */
    private function processSingleImport($instructor, $students, $courseInfo, $courseCode)
    {
        $successCount = 0;
        $errorCount = 0;
        $errors = [];
        $duplicates = [];
        $courseCreated = false;

        // Pre-validate students
        $validStudents = [];
        foreach ($students as $index => $studentData) {
            $existingStudent = Student::withTrashed()
                ->where('student_id', $studentData['student_id'])
                ->where('enrolled_course', $studentData['enrolled_course'])
                ->first();

            if ($existingStudent) {
                $currentInstructor = null;
                if ($existingStudent->enrolledByInstructor) {
                    $currentInstructor = $existingStudent->enrolledByInstructor->first_name . ' ' . 
                                       $existingStudent->enrolledByInstructor->last_name;
                }

                $duplicates[] = [
                    'row' => $index + 1,
                    'student_id' => $studentData['student_id'],
                    'name' => $studentData['first_name'] . ' ' . $studentData['last_name'],
                    'current_course' => $existingStudent->enrolled_course,
                    'note' => 'Student already enrolled in this course with ' . ($currentInstructor ?? 'another instructor')
                ];
            } else {
                $validStudents[] = $studentData;
            }
        }

        // If no valid students, don't create course
        if (empty($validStudents)) {
            return [
                'success' => false,
                'message' => "No students imported for {$courseCode}. All students already exist.",
                'summary' => [
                    'total_processed' => count($students),
                    'successful' => 0,
                    'errors' => 0,
                    'duplicates' => count($duplicates),
                    'course_created' => false
                ],
                'errors' => $errors,
                'duplicates' => $duplicates
            ];
        }

        // Create/verify course
        $instructorCourse = Course::where('course_code', $courseCode)
            ->where('assigned_teacher', $instructor->teacher_id)
            ->first();
        
        if (!$instructorCourse) {
            $courseName = $courseInfo['course_name'] ?? $courseCode;
            $schedule = $courseInfo['schedule'] ?? 'TBD';
            $location = $courseInfo['location'] ?? 'TBD';
            
            Course::create([
                'course_code' => $courseCode,
                'course_name' => $courseName,
                'assigned_teacher' => $instructor->teacher_id,
                'schedule' => $schedule,
                'location' => $location,
            ]);
            $courseCreated = true;
        } else {
            // Update schedule and location if provided
            $updateData = [];
            if (isset($courseInfo['schedule']) && $courseInfo['schedule'] !== 'TBD') {
                $updateData['schedule'] = $courseInfo['schedule'];
            }
            if (isset($courseInfo['location']) && $courseInfo['location'] !== 'TBD') {
                $updateData['location'] = $courseInfo['location'];
            }
            
            if (!empty($updateData)) {
                $instructorCourse->update($updateData);
            }
        }

        // Import valid students
        foreach ($validStudents as $studentData) {
            try {
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
                    'student_id' => $studentData['student_id'],
                    'error' => $e->getMessage()
                ];
                $errorCount++;
            }
        }

        return [
            'success' => $successCount > 0,
            'message' => $successCount > 0 
                ? "{$successCount} students imported successfully for {$courseCode}." 
                : "Failed to import students for {$courseCode}.",
            'summary' => [
                'total_processed' => count($students),
                'successful' => $successCount,
                'errors' => $errorCount,
                'duplicates' => count($duplicates),
                'course_created' => $courseCreated
            ],
            'errors' => $errors,
            'duplicates' => $duplicates
        ];
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