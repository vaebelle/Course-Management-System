<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Instructor extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $table = 'instructors';
    protected $primaryKey = 'teacher_id';
    public $incrementing = false;
    protected $keyType = 'integer';

    protected $fillable = [
        'teacher_id',
        'email',
        'first_name',
        'last_name',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'teacher_id' => 'integer',
        'email_verified_at' => 'datetime',
    ];

    /**
     * Get the courses assigned to this instructor
     */
    public function courses()
    {
        return $this->hasMany(Course::class, 'assigned_teacher', 'teacher_id');
    }
}