<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;


class InstructorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
        DB::table('instructors')->insert([
            'teacher_id' => 22100129,
            'email' => '22100129@usc.edu.ph',
            'first_name' => 'Bea Belle Therese',
            'last_name' =>  'Caños',
            'password' => bcrypt('password') // Hashing the password
        ]);
    }
}
