<?php
// app/Models/ActivityLog.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = [
        'type',
        'action', 
        'entity_id',
        'entity_name',
        'details',
        'user_id'
    ];

    protected $casts = [
        'created_at' => 'datetime'
    ];

    public static function logActivity($type, $action, $entityId, $entityName, $details = null, $userId = null)
    {
        return self::create([
            'type' => $type,
            'action' => $action,
            'entity_id' => $entityId,
            'entity_name' => $entityName,
            'details' => $details,
            'user_id' => $userId
        ]);
    }
}