<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CourseController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::get('/courses', [CourseController::class, 'index']);
Route::get('/courses/instructor/{teacherId}', [CourseController::class, 'getByInstructor']);

