<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Drop foreign key constraints that reference courses table
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['enrolled_course']);
        });

        // Step 2: Drop the courses table and recreate it with new structure
        Schema::dropIfExists('courses');
        
        Schema::create('courses', function (Blueprint $table) {
            $table->id(); // Auto-incrementing primary key
            $table->string('course_code');
            $table->string('course_name');
            $table->unsignedBigInteger('assigned_teacher');
            $table->timestamps();

            // Foreign key: assigned_teacher → instructors.teacher_id
            $table->foreign('assigned_teacher')
                ->references('teacher_id')
                ->on('instructors')
                ->onDelete('cascade');

            // Unique constraint: same instructor can't be assigned to same course twice
            $table->unique(['course_code', 'assigned_teacher'], 'course_instructor_unique');
            
            // Index for faster queries
            $table->index('course_code');
        });

        // Step 3: Re-add foreign key constraint for students table
        Schema::table('students', function (Blueprint $table) {
            $table->foreign('enrolled_course')
                ->references('course_code')
                ->on('courses')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop foreign key from students table
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['enrolled_course']);
        });

        // Drop the courses table
        Schema::dropIfExists('courses');
        
        // Recreate original courses table structure
        Schema::create('courses', function (Blueprint $table) {
            $table->string('course_code')->primary();
            $table->string('course_name');
            $table->unsignedBigInteger('assigned_teacher');
            $table->timestamps();

            $table->foreign('assigned_teacher')
                ->references('teacher_id')
                ->on('instructors')
                ->onDelete('cascade');
        });

        // Re-add foreign key for students
        Schema::table('students', function (Blueprint $table) {
            $table->foreign('enrolled_course')
                ->references('course_code')
                ->on('courses')
                ->onDelete('cascade');
        });
    }
};