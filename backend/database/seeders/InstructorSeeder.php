<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Instructor;

class InstructorSeeder extends Seeder
{
    public function run(): void
    {
        Instructor::create([
            'teacher_id' => 1,
            'first_name' => 'Alice',
            'last_name' => 'Ramos',
            'email' => 'alice.ramos@example.com',
            'password' => bcrypt('password'),
        ]);
    }
}
