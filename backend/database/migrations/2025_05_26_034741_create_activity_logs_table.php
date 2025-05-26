<?php
// database/migrations/xxxx_xx_xx_create_activity_logs_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['course', 'student']);
            $table->enum('action', ['created', 'updated', 'deleted']);
            $table->string('entity_id');
            $table->string('entity_name');
            $table->text('details')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamps();
            
            $table->index(['type', 'action']);
            $table->index('created_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('activity_logs');
    }
};