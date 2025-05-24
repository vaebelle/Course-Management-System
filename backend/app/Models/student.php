<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $primaryKey = 'student_id';
    public $incrementing = false;
    protected $keyType = 'integer';

    protected $fillable = [
        'student_id',
        'first_name',
        'last_name',
        'program',
        'enrolled_course',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    protected $casts = [
        'student_id' => 'integer',
    ];

    /**
     * Get the course that the student is enrolled in
     */
    public function course()
    {
        return $this->belongsTo(Course::class, 'enrolled_course', 'course_code');
    }

    /**
     * Get the instructor of the course the student is enrolled in
     */
    public function instructor()
    {
        return $this->hasOneThrough(
            Instructor::class,      // Final model we want to access
            Course::class,          // Intermediate model
            'course_code',          // Foreign key on Course table (matches enrolled_course)
            'teacher_id',           // Foreign key on Instructor table  
            'enrolled_course',      // Local key on Student table
            'assigned_teacher'      // Local key on Course table
        );
    }

    /**
     * Get full name attribute
     */
    public function getFullNameAttribute()
    {
        return $this->first_name . ' ' . $this->last_name;
    }
}