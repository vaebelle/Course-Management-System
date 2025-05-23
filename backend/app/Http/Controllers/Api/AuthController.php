<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\Instructors;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function signup(Request $request)
    {
        try {
            $data = $request->validate([
                "teacher_id" => "required|unique:instructors,teacher_id",
                "email" => "required|email|unique:instructors,email",
                "first_name" => "required|string|max:255",
                "last_name" => "required|string|max:255",
                "password" => "required",
            ]);

            // Hash the password
            $data['password'] = Hash::make($data['password']);
            
            $user = Instructors::create($data);
            
            return response()->json([
                "status" => true,
                "message" => "Instructor registered successfully",
                "user" => $user
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                "status" => false,
                "message" => "Validation failed",
                "errors" => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                "status" => false,
                "message" => "Registration failed: " . $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        try {
            $data = $request->validate([
                "email" => "required|email",
                "password" => "required",
            ]);

            // Find instructor by email
            $instructor = Instructors::where('email', $data['email'])->first();

            if (!$instructor || !Hash::check($data['password'], $instructor->password)) {
                return response()->json([
                    "status" => false,
                    "message" => "Invalid credentials",
                ], 401);
            }

            // Create token
            $token = $instructor->createToken("auth_token")->plainTextToken;
            
            return response()->json([
                "status" => true,
                "message" => "User logged in successfully",
                "token" => $token,
                "user" => $instructor
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                "status" => false,
                "message" => "Validation failed",
                "errors" => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                "status" => false,
                "message" => "Login failed: " . $e->getMessage()
            ], 500);
        }
    }
    
    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();
            
            return response()->json([
                "status" => true,
                "message" => "User logged out successfully",
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                "status" => false,
                "message" => "Logout failed: " . $e->getMessage()
            ], 500);
        }
    }

    public function user(Request $request)
    {
        return response()->json([
            "status" => true,
            "user" => $request->user()
        ], 200);
    }
}