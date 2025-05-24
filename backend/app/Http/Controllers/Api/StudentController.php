<?php

namespace App\Http\Controllers\Api;

use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use App\Http\Controllers\Controller;

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