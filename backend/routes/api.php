<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\AuthController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/courses', [CourseController::class, 'index']);
Route::get('/courses/instructor/{teacherId}', [CourseController::class, 'getByInstructor']);

// Public routes (no authentication required)
Route::post('/instructor/signup', [AuthController::class, 'signup']);
Route::post('/instructor/login', [AuthController::class, 'login']);

// Protected routes (require authentication)
Route::group([
    "middleware" => ["auth:sanctum"]
], function(){
    Route::post("logout", [AuthController::class, "logout"]);
    Route::get('/user', [AuthController::class, 'user']);
});

// Course routes (you can add auth middleware if needed)
Route::prefix('courses')->group(function () {
    Route::get('/', [CourseController::class, 'index']);
    Route::get('/instructor/{teacherId}', [CourseController::class, 'getByInstructor']);
});