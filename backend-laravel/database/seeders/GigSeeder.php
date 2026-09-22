<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\Gig;
use App\Models\User;
use Illuminate\Database\Seeder;

class GigSeeder extends Seeder
{
    public function run(): void
    {
        $technicians = User::where('role', 'technician')->get();

        if ($technicians->isEmpty()) {
            return;
        }

        $gigs = [
            [
                'title'          => 'Full System Diagnostic & Repair',
                'description'    => 'Comprehensive hardware and software diagnostic with full repair service. Includes thermal paste replacement, driver updates, and system optimization.',
                'category'       => 'Full Repair',
                'price'          => 8500,
                'estimated_time' => '4-6 hours',
            ],
            [
                'title'          => 'GPU Driver Installation & Optimization',
                'description'    => 'Professional GPU driver installation, configuration, and benchmark optimization for gaming and productivity workloads.',
                'category'       => 'Hardware',
                'price'          => 2500,
                'estimated_time' => '1-2 hours',
            ],
            [
                'title'          => 'Operating System Reinstallation',
                'description'    => 'Clean OS installation with driver setup, data migration, and system restore. Supports Windows 10/11.',
                'category'       => 'Software',
                'price'          => 3500,
                'estimated_time' => '2-3 hours',
            ],
            [
                'title'          => 'Network Configuration & Troubleshooting',
                'description'    => 'Router configuration, WiFi optimization, DNS setup, and network performance tuning for home and small office.',
                'category'       => 'Network',
                'price'          => 2000,
                'estimated_time' => '1-2 hours',
            ],
            [
                'title'          => 'CPU Thermal Management Service',
                'description'    => 'Thermal paste replacement, cooler installation, and temperature monitoring setup to prevent overheating.',
                'category'       => 'Hardware',
                'price'          => 3000,
                'estimated_time' => '1-2 hours',
            ],
            [
                'title'          => 'Virus & Malware Removal',
                'description'    => 'Complete system scan and removal of viruses, malware, and adware. Includes security software setup.',
                'category'       => 'Software',
                'price'          => 2500,
                'estimated_time' => '2-4 hours',
            ],
            [
                'title'          => 'RAM Upgrade & Compatibility Check',
                'description'    => 'Memory upgrade with compatibility verification, XMP profile setup, and stability testing.',
                'category'       => 'Hardware',
                'price'          => 1500,
                'estimated_time' => '1 hour',
            ],
            [
                'title'          => 'Full System Optimization',
                'description'    => 'Comprehensive system cleanup, startup optimization, registry repair, and performance tuning.',
                'category'       => 'Software',
                'price'          => 2000,
                'estimated_time' => '2-3 hours',
            ],
        ];

        foreach ($technicians as $tech) {
            $techGigs = array_slice($gigs, 0, rand(2, 4));
            foreach ($techGigs as $gigData) {
                Gig::create(array_merge($gigData, [
                    'technician_id' => $tech->id,
                    'is_available'  => true,
                ]));
            }
        }
    }
}
