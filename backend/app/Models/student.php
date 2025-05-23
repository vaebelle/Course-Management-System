<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    // If your table name is not the plural of the model name, uncomment and set it:
    // protected $table = 'students';

    // Add the fields you want to be mass assignable
    protected $fillable = [
        'student_id',
        'first_name',
        'last_name',
        'program',
        'enrolled_course',
        'created_at',
        'updated_at',
        // Add other fields as needed
    ];

    // If you want to hide certain fields from JSON responses, add them here
    // protected $hidden = [
    //     'created_at',
    //     'updated_at',
    // ];
}
