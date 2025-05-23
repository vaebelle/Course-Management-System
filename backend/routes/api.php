<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\StudentController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Public Course routes
Route::prefix('courses')->group(function () {
    Route::get('/', [CourseController::class, 'index']);
    Route::get('/instructor/{teacherId}', [CourseController::class, 'getByInstructor']);
});

// Public Students routes (for frontend access)
Route::prefix('students')->group(function () {
    Route::get('/', [StudentController::class, 'index']);           // GET /api/students
    Route::get('/{id}', [StudentController::class, 'show']);        // GET /api/students/{id}
});

// Protected routes (authentication required)
Route::group(['middleware' => ['auth:sanctum']], function () {
    // Protected student management routes
    Route::prefix('students')->group(function () {
        Route::post('/', [StudentController::class, 'store']);          // POST /api/students
        // Route::put('/{id}', [StudentController::class, 'update']);      // PUT /api/students/{id}
        Route::patch('/{id}', [StudentController::class, 'update']);    // PATCH /api/students/{id}
        Route::delete('/{id}', [StudentController::class, 'destroy']);  // DELETE /api/students/{id}
    });
});

// Add CORS headers if needed
// Route::middleware(['cors'])->group(function () {
//     Route::get('/courses', [CourseController::class, 'index']);
//     Route::get('/courses/instructor/{teacherId}', [CourseController::class, 'getByInstructor']);
//     Route::get('/students', [StudentController::class, 'index']);
// });