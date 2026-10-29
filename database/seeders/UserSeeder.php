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
        $HEADRole = Role::firstOrCreate(['name' => 'HEAD']);
        $PDRRMORole = Role::firstOrCreate(['name' => 'PDRRMO']);
        $GUESTRole = Role::firstOrCreate(['name' => 'GUEST']);

        User::updateOrCreate(
            ['email' => 'ricoadolfo@gmail.com'],
            [
                'name' => 'Rico Adolfo',
                'password' => Hash::make('password'),
                'role_id' => $HEADRole->id,
                'is_protected' => true,
            ]
        );

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
