<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\AuthController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Course routes
Route::prefix('courses')->group(function () {
    Route::get('/', [CourseController::class, 'index']);
    Route::get('/instructor/{teacherId}', [CourseController::class, 'getByInstructor']);
});

// Add CORS headers if needed
Route::middleware(['cors'])->group(function () {
    Route::get('/courses', [CourseController::class, 'index']);
    Route::get('/courses/instructor/{teacherId}', [CourseController::class, 'getByInstructor']);
});

Route::post('/instructor/signup', [AuthController::class, 'registerInstructor']);