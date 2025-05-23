<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;


class StudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        DB::table('students')->insert([
            'student_id' => 22100120,
            'first_name' => 'May',
            'last_name' =>  'Ochia',
            'program' => 'BS CPE - 3', //  
            'enrolled_course' => 'CPE 3207' // FK to course_code
        ]);

        DB::table('students')->insert([
            'student_id' => 22100121,
            'first_name' => 'May',
            'last_name' =>  'Cassandra',
            'program' => 'BS CPE - 3', //  
            'enrolled_course' => 'CPE 3207' // FK to course_code
        ]);
    }
}
