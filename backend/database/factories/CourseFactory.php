<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Course;

class CourseFactory extends Factory
{
    protected $model = Course::class;

    public function definition()
    {
        return [
            'course_code' => strtoupper($this->faker->bothify('CS###')),
            'course_name' => $this->faker->sentence(3),
            'assigned_teacher' => 1, // or Instructor::factory()
        ];
    }
}