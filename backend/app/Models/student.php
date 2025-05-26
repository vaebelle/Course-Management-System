<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'student_id',
        'first_name',
        'last_name',
        'program',
        'enrolled_course',
        'enrolled_by_instructor', 
    ];

    // Define the deleted_at column for soft deletes
    protected $dates = ['deleted_at', 'created_at', 'updated_at'];

    protected $casts = [
        'student_id' => 'integer',
        'enrolled_by_instructor' => 'integer',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the course that the student is enrolled in
     */
    public function course()
    {
        return $this->belongsTo(Course::class, 'enrolled_course', 'course_code');
    }

    /**
     * Get the instructor who enrolled this student
     */
    public function enrolledByInstructor()
    {
        return $this->belongsTo(Instructor::class, 'enrolled_by_instructor', 'teacher_id');
    }

    /**
     * Get the instructor of the course the student is enrolled in
     */
    public function instructor()
    {
        return $this->hasOneThrough(
            Instructor::class,      
            Course::class,          
            'course_code',          
            'teacher_id',           
            'enrolled_course',      
            'assigned_teacher'     
        );
    }

    /**
     * Get full name attribute
     */
    public function getFullNameAttribute()
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    /**
     * Scope to get only active (non-deleted) students
     * Note: This is now handled automatically by SoftDeletes trait
     */
    public function scopeActive($query)
    {
        return $query->whereNull('deleted_at');
    }

    /**
     * Scope to get only soft-deleted students
     */
    public function scopeOnlyTrashed($query)
    {
        return $query->onlyTrashed();
    }

    /**
     * Scope to get all students including soft-deleted ones
     */
    public function scopeWithTrashed($query)
    {
        return $query->withTrashed();
    }

    /**
     * Scope to get students for a specific instructor
     */
    public function scopeForInstructor($query, $teacherId)
    {
        return $query->where('enrolled_by_instructor', $teacherId);
    }

    /**
     * Scope to get students enrolled by a specific instructor in a specific course
     */
    public function scopeForInstructorAndCourse($query, $teacherId, $courseCode)
    {
        return $query->where('enrolled_by_instructor', $teacherId)
                    ->where('enrolled_course', $courseCode);
    }
}