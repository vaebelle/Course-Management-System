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
        Schema::create('students', function (Blueprint $table) {
            $table->unsignedBigInteger('student_id')->primary(); 
            $table->string('first_name');
            $table->string('last_name');
            $table->string('program');
            $table->string('enrolled_course'); // FK to course_code
            $table->timestamps();
            $table->softDeletes();

            // Foreign key: enrolled_course → courses.course_code
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
        Schema::dropIfExists('students');
    }
};