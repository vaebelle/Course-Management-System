<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    // Remove custom primary key settings since we're using default 'id' now
    // protected $primaryKey = 'student_id';
    // public $incrementing = false;
    // protected $keyType = 'integer';

    protected $fillable = [
        'student_id',
        'first_name',
        'last_name',
        'program',
        'enrolled_course',
    ];

    // Define the deleted_at column for soft deletes
    protected $dates = ['deleted_at', 'created_at', 'updated_at'];

    protected $casts = [
        'student_id' => 'integer',
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
        return $query->whereHas('course', function ($courseQuery) use ($teacherId) {
            $courseQuery->where('assigned_teacher', $teacherId);
        });
    }
}