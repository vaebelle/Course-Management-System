<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ActivityLogController extends Controller
{
    public function index()
    {
        try {
            $instructor = Auth::user();
            
            if (!$instructor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Please login first'
                ], 401);
            }

            // Get activity logs for this instructor
            $logs = ActivityLog::where('user_id', $instructor->id)
                ->orderBy('created_at', 'desc')
                ->limit(1000)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $logs
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve activity logs',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}