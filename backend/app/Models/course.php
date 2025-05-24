<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $primaryKey = 'course_code';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'course_code',
        'course_name',
        'semester',
        'group',
        'assigned_teacher',
    ];

    protected $casts = [
        'assigned_teacher' => 'integer',
    ];

    /**
     * Get the instructor assigned to this course
     */
    public function instructor()
    {
        return $this->belongsTo(Instructor::class, 'assigned_teacher', 'teacher_id');
    }

    /**
     * Get the students enrolled in this course
     */
    public function students()
    {
        return $this->hasMany(Student::class, 'enrolled_course', 'course_code');
    }
}