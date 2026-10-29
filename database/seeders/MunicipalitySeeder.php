<?php

namespace Database\Seeders;

use App\Models\Municipality;
use Illuminate\Database\Seeder;

class MunicipalitySeeder extends Seeder
{
    public function run(): void
    {
        $municipalities = [
            'Surigao City',
            'Alegria',
            'Bacuag',
            'Burgos',
            'Claver',
            'Dapa',
            'Del Carmen',
            'General Luna',
            'Gigaquit',
            'Mainit',
            'Malimono',
            'Pilar',
            'Placer',
            'San Benito',
            'San Francisco (Anao-Aon)',
            'San Isidro',
            'Santa Monica (Sapao)',
            'Sison',
            'Socorro',
            'Tagana-an',
            'Tubod',
        ];

        foreach ($municipalities as $municipalityName) {
            Municipality::updateOrCreate(
                ['municipality_name' => $municipalityName]
            );
        }
    }
}
