<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CourseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        DB::table('courses')->insert([
            'course_code' => 'CPE 3207',
            'course_name' => 'Research',
            'assigned_teacher' => 22100129, // FK to instructor_id'
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
