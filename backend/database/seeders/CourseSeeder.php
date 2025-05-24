<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Course;
use App\Models\Instructor;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $instructor = Instructor::factory()->create();

        Course::create([
            'course_code' => 'CS049',
            'course_name' => 'Ut quia iure magnam.',
            'semester' => '1st',
            'group' => 'A',
            'assigned_teacher' => $instructor->teacher_id
        ]);

        Course::create([
            'course_code' => 'CS050',
            'course_name' => 'Doloribus repellendus rerum.',
            'semester' => '1st',
            'group' => 'B',
            'assigned_teacher' => $instructor->teacher_id
        ]);

        Course::create([
            'course_code' => 'CS051',
            'course_name' => 'Consectetur aut eveniet.',
            'semester' => '2nd',
            'group' => 'C',
            'assigned_teacher' => $instructor->teacher_id
        ]);
    }
}