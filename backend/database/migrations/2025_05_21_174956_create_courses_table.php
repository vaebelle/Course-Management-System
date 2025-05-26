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
        Schema::create('courses', function (Blueprint $table) {
            $table->string('course_code')->primary();
            $table->string('course_name');
            $table->unsignedBigInteger('assigned_teacher');
            $table->timestamps();

            // Foreign key: assigned_teacher → instructors.teacher_id
            $table->foreign('assigned_teacher')
                ->references('teacher_id')
                ->on('instructors')
                ->onDelete('cascade');
        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
