<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Instructor;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new instructor
     */
    public function signup(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'teacher_id' => 'required|integer|unique:instructors,teacher_id',
                'email' => 'required|email|unique:instructors,email',
                'first_name' => 'required|string|max:255',
                'last_name' => 'required|string|max:255',
                'password' => 'required|string|min:6',
            ]);

            $instructor = Instructor::create([
                'teacher_id' => $request->teacher_id,
                'email' => $request->email,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'password' => Hash::make($request->password),
            ]);

            // Create token for immediate login
            $token = $instructor->createToken('instructor-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Instructor registered successfully',
                'user' => [
                    'teacher_id' => $instructor->teacher_id,
                    'email' => $instructor->email,
                    'first_name' => $instructor->first_name,
                    'last_name' => $instructor->last_name,
                ],
                'token' => $token,
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
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Login instructor
     */
    public function login(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'email' => 'required|email',
                'password' => 'required|string',
            ]);

            $instructor = Instructor::where('email', $request->email)->first();

            if (!$instructor || !Hash::check($request->password, $instructor->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401);
            }

            // Create token
            $token = $instructor->createToken('instructor-token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'teacher_id' => $instructor->teacher_id,
                    'email' => $instructor->email,
                    'first_name' => $instructor->first_name,
                    'last_name' => $instructor->last_name,
                ],
                'token' => $token,
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Login failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current authenticated user
     */
    public function user(Request $request): JsonResponse
    {
        try {
            $instructor = Auth::user();

            if (!$instructor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 401);
            }

            return response()->json([
                'success' => true,
                'user' => [
                    'teacher_id' => $instructor->teacher_id,
                    'email' => $instructor->email,
                    'first_name' => $instructor->first_name,
                    'last_name' => $instructor->last_name,
                ],
                'message' => 'User data retrieved successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve user data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Logout instructor
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}