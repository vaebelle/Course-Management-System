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
        Schema::table('students', function (Blueprint $table) {
            // Drop the primary key on student_id since we need to allow duplicate student_ids
            $table->dropPrimary(['student_id']);
            
            // Add auto-incrementing id as primary key
            $table->id()->first();
            
            // Add unique constraint for student_id + enrolled_course combination
            // This allows same student in different courses but not in same course twice
            $table->unique(['student_id', 'enrolled_course'], 'student_course_unique');
            
            // Add index for faster queries
            $table->index('student_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Drop the unique constraint
            $table->dropUnique('student_course_unique');
            
            // Drop the index
            $table->dropIndex(['student_id']);
            
            // Drop the id column
            $table->dropColumn('id');
            
            // Make student_id primary again
            $table->primary('student_id');
        });
    }
};