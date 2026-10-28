<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $PDRRMORole = Role::firstOrCreate(['name' => 'PDRRMO']);
        $GUESTRole = Role::firstOrCreate(['name' => 'GUEST']);

        User::updateOrCreate(
            ['email' => 'pdrrmo@gmail.com'],
            [
                'name' => 'PDRRMO',
                'password' => Hash::make('password'),
                'role_id' => $PDRRMORole->id,
            ]
        );

        User::updateOrCreate(
            ['email' => 'guest@gmail.com'],
            [
                'name' => 'GUEST',
                'password' => Hash::make('password'),
                'role_id' => $GUESTRole->id,
            ]
        );

        User::whereNull('role_id')->update(['role_id' => $GUESTRole->id]);
    }
}