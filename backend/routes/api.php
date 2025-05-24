<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\StudentController;

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

// Public Students routes (for frontend access)
Route::prefix('students')->group(function () {
    Route::get('/', [StudentController::class, 'index']);           // GET /api/students
    Route::get('/{id}', [StudentController::class, 'show']);        // GET /api/students/{id}
    Route::put('/{id}', [StudentController::class, 'update']);      // PUT /api/students/{id} - NOW ENABLED
    Route::patch('/{id}', [StudentController::class, 'update']);    // PATCH /api/students/{id} - ALSO AVAILABLE
});

// Protected routes (authentication required)
Route::group(['middleware' => ['auth:sanctum']], function () {
    // Protected student management routes
    Route::prefix('students')->group(function () {
        Route::post('/', [StudentController::class, 'store']);          // POST /api/students
        Route::delete('/{id}', [StudentController::class, 'destroy']);  // DELETE /api/students/{id}
    });
});