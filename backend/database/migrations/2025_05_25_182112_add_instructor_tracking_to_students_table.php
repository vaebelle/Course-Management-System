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
            // Add a column to track which instructor enrolled this student
            $table->unsignedBigInteger('enrolled_by_instructor')->nullable()->after('enrolled_course');
            
            // Add foreign key constraint
            $table->foreign('enrolled_by_instructor')
                ->references('teacher_id')
                ->on('instructors')
                ->onDelete('set null');
                
            // Add index for faster queries
            $table->index('enrolled_by_instructor');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            // Drop foreign key constraint
            $table->dropForeign(['enrolled_by_instructor']);
            
            // Drop index
            $table->dropIndex(['enrolled_by_instructor']);
            
            // Drop column
            $table->dropColumn('enrolled_by_instructor');
        });
    }
};