<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StudentController;

// Public routes (no authentication required)
Route::post('/instructor/signup', [AuthController::class, 'signup']);
Route::post('/instructor/login', [AuthController::class, 'login']);

// Protected routes (require authentication)
Route::group(['middleware' => ['auth:sanctum']], function () {
    // User routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']); // This is the endpoint your frontend is calling
    
    // Course routes - all require authentication
    Route::prefix('courses')->group(function () {
        Route::get('/', [CourseController::class, 'index']);
        Route::get('/instructor/{teacherId}', [CourseController::class, 'getByInstructor']);
        Route::get('/{courseCode}/details', [StudentController::class, 'getCourseDetails']);
    });

    // Student routes - all require authentication
    Route::prefix('students')->group(function () {
        Route::get('/', [StudentController::class, 'index']);
        Route::post('/', [StudentController::class, 'store']);
        Route::get('/{id}', [StudentController::class, 'show']);
        Route::put('/{id}', [StudentController::class, 'update']);
        Route::patch('/{id}', [StudentController::class, 'update']);
        Route::delete('/{id}', [StudentController::class, 'destroy']);
        Route::post('/{id}/restore', [StudentController::class, 'restore']);
        Route::delete('/{id}/force', [StudentController::class, 'forceDelete']);
        
        // CSV Import routes
        Route::post('/import-csv', [StudentController::class, 'importFromCsv']);
        Route::post('/bulk-import-csv', [StudentController::class, 'bulkImportFromCsv']); 
    });
});