<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Reservation extends Model {
    protected $table = 'reservations';
    protected $fillable = ['user_id','flight_id','status','reserved_at'];
    public $timestamps = true;
}