<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class instructor extends Model
{
    use HasFactory;

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
    ];

    protected $casts = [
        'teacher_id' => 'integer',
    ];

    /**
     * Get the courses assigned to this instructor
     */
    public function courses()
    {
        return $this->hasMany(Course::class, 'assigned_teacher', 'teacher_id');
    }
}
