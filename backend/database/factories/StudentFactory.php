<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

class StudentFactory extends Factory
{
    protected $model = Student::class;

    public function definition(): array
    {
        return [
            'student_id' => $this->faker->unique()->numberBetween(200000, 299999),
            'first_name' => $this->faker->firstName,
            'last_name' => $this->faker->lastName,
            'program' => $this->faker->randomElement(['BSCS', 'BSIT', 'BSCE', 'BSECE']),
            'enrolled_course' => Course::inRandomOrder()->first()->course_code ?? Course::factory(),
        ];
    }
}