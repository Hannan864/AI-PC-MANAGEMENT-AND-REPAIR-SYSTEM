<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\CompletionReport;
use App\Models\LifecycleEvent;
use App\Models\RepairRequest;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeder: RepairRequestSeeder
 *
 * Creates demo repair requests covering all workflow states.
 * Requires UserSeeder to have run first (uses known email addresses).
 *
 * Demo scenarios created:
 *   1. Submitted (unassigned) request — customer1
 *   2. Assigned to technician — customer2 → ali.hassan (hardware)
 *   3. In-progress repair — customer3 → sara.malik (software)
 *   4. Completed with report — customer4 → usman.khan (networking)
 *   5. Cancelled request — customer5
 */
class RepairRequestSeeder extends Seeder
{
    public function run(): void
    {
        // Retrieve seeded users by known emails
        $customer1 = User::where('email', 'customer1@smartpchub.test')->firstOrFail();
        $customer2 = User::where('email', 'customer2@smartpchub.test')->firstOrFail();
        $customer3 = User::where('email', 'customer3@smartpchub.test')->firstOrFail();
        $customer4 = User::where('email', 'customer4@smartpchub.test')->firstOrFail();
        $customer5 = User::where('email', 'customer5@smartpchub.test')->firstOrFail();

        $techAli   = User::where('email', 'ali.hassan@smartpchub.test')->firstOrFail();
        $techSara  = User::where('email', 'sara.malik@smartpchub.test')->firstOrFail();
        $techUsman = User::where('email', 'usman.khan@smartpchub.test')->firstOrFail();
        $admin     = User::where('email', 'admin@smartpchub.test')->firstOrFail();

        // ----------------------------------------------------------------
        // 1. Submitted (unassigned) request
        // ----------------------------------------------------------------
        $request1 = RepairRequest::create([
            'id'                   => Str::uuid(),
            'user_id'              => $customer1->id,
            'technician_id'        => null,
            'issue_category'       => 'Hardware',
            'issue_description'    => 'My PC does not POST. Fans spin but no display output. Tried reseating RAM and GPU.',
            'severity_level'       => 'high',
            'status'               => 'submitted',
            'system_specifications' => [
                'cpu'         => 'Intel Core i5-10400',
                'gpu'         => 'NVIDIA GeForce GTX 1660',
                'ram'         => '16GB DDR4 3200MHz',
                'storage'     => '1TB WD Blue NVMe',
                'os'          => 'Windows 10 Home',
                'browser'     => 'Chrome/114.0.5735.199',
                'captured_at' => now()->subDays(1)->toIso8601String(),
            ],
            'user_images' => [],
            'tech_images' => [],
        ]);

        LifecycleEvent::create([
            'repair_request_id' => $request1->id,
            'status'            => 'submitted',
            'updated_by'        => $customer1->id,
            'note'              => 'Request submitted by customer.',
        ]);

        // ----------------------------------------------------------------
        // 2. Assigned to technician Ali Hassan (hardware)
        // ----------------------------------------------------------------
        $request2 = RepairRequest::create([
            'id'                   => Str::uuid(),
            'user_id'              => $customer2->id,
            'technician_id'        => $techAli->id,
            'issue_category'       => 'Hardware',
            'issue_description'    => 'Laptop overheats after 15 minutes and shuts down. Fan makes grinding noise.',
            'severity_level'       => 'high',
            'status'               => 'assigned',
            'system_specifications' => [
                'cpu'         => 'AMD Ryzen 5 5500U',
                'gpu'         => 'AMD Radeon Graphics (integrated)',
                'ram'         => '8GB DDR4 3200MHz',
                'storage'     => '256GB NVMe SSD',
                'os'          => 'Windows 11 Home',
                'captured_at' => now()->subHours(12)->toIso8601String(),
            ],
            'user_images' => [],
            'tech_images' => [],
        ]);

        LifecycleEvent::create([
            'repair_request_id' => $request2->id,
            'status'            => 'submitted',
            'updated_by'        => $customer2->id,
            'note'              => 'Request submitted by customer.',
        ]);
        LifecycleEvent::create([
            'repair_request_id' => $request2->id,
            'status'            => 'assigned',
            'updated_by'        => $admin->id,
            'note'              => 'Assigned to Ali Hassan — Hardware Specialist.',
        ]);

        // ----------------------------------------------------------------
        // 3. In-progress repair (Sara Malik — software)
        // ----------------------------------------------------------------
        $request3 = RepairRequest::create([
            'id'                   => Str::uuid(),
            'user_id'              => $customer3->id,
            'technician_id'        => $techSara->id,
            'issue_category'       => 'Software',
            'issue_description'    => 'PC extremely slow after Windows update. Boot time is 15+ minutes. Memory usage 90% at idle.',
            'severity_level'       => 'medium',
            'status'               => 'in_progress',
            'system_specifications' => [
                'cpu'         => 'Intel Core i3-8100',
                'gpu'         => 'Intel UHD 630',
                'ram'         => '4GB DDR4 2400MHz',
                'storage'     => '500GB HDD',
                'os'          => 'Windows 10 Home',
                'captured_at' => now()->subDays(2)->toIso8601String(),
            ],
            'user_images' => [],
            'tech_images' => [],
        ]);

        LifecycleEvent::create([
            'repair_request_id' => $request3->id,
            'status'            => 'submitted',
            'updated_by'        => $customer3->id,
            'note'              => 'Request submitted by customer.',
        ]);
        LifecycleEvent::create([
            'repair_request_id' => $request3->id,
            'status'            => 'assigned',
            'updated_by'        => $admin->id,
            'note'              => 'Assigned to Sara Malik — Software Specialist.',
        ]);
        LifecycleEvent::create([
            'repair_request_id' => $request3->id,
            'status'            => 'accepted',
            'updated_by'        => $techSara->id,
            'note'              => 'Job accepted. Will run diagnostics and check startup programs.',
        ]);
        LifecycleEvent::create([
            'repair_request_id' => $request3->id,
            'status'            => 'in_progress',
            'updated_by'        => $techSara->id,
            'note'              => 'Cleaned startup entries. Updating drivers. Found several malware traces.',
        ]);

        // ----------------------------------------------------------------
        // 4. Completed with report (Usman Khan — networking)
        // ----------------------------------------------------------------
        $request4 = RepairRequest::create([
            'id'                   => Str::uuid(),
            'user_id'              => $customer4->id,
            'technician_id'        => $techUsman->id,
            'issue_category'       => 'Networking',
            'issue_description'    => 'WiFi disconnects every 10-15 minutes. Router shows connected but no internet.',
            'severity_level'       => 'medium',
            'status'               => 'completed',
            'system_specifications' => [
                'cpu'         => 'AMD Ryzen 7 5700X',
                'gpu'         => 'NVIDIA RTX 3060',
                'ram'         => '16GB DDR4 3600MHz',
                'storage'     => '1TB NVMe SSD',
                'os'          => 'Windows 11 Pro',
                'captured_at' => now()->subDays(5)->toIso8601String(),
            ],
            'user_images' => [],
            'tech_images' => [],
        ]);

        // Full lifecycle for completed request
        foreach ([
            [$customer4->id, 'submitted',   'Request submitted by customer.'],
            [$admin->id,     'assigned',    'Assigned to Usman Khan — Networking Specialist.'],
            [$techUsman->id, 'accepted',    'Job accepted. Will diagnose WiFi adapter and drivers.'],
            [$techUsman->id, 'in_progress', 'Updated WiFi drivers. Found DNS misconfiguration.'],
            [$techUsman->id, 'testing',     'Applied DNS fix. Testing connectivity over 30 minutes.'],
            [$techUsman->id, 'completed',   'Issue resolved. DNS settings corrected. WiFi stable.'],
        ] as [$actorId, $status, $note]) {
            LifecycleEvent::create([
                'repair_request_id' => $request4->id,
                'status'            => $status,
                'updated_by'        => $actorId,
                'note'              => $note,
            ]);
        }

        // Completion report for request 4
        CompletionReport::create([
            'id'                 => Str::uuid(),
            'repair_request_id'  => $request4->id,
            'issue_summary'      => 'WiFi connectivity drops caused by incorrect DNS configuration and outdated network adapter driver.',
            'root_cause'         => 'ISP-pushed DNS settings overriding router DNS caused intermittent resolution failures. Driver version 18.x had known disconnection bug.',
            'parts_replaced'     => [],
            'labor_cost'         => 500.00,
            'total_cost'         => 500.00,
            'work_notes'         => 'Updated WiFi adapter driver to v22.x. Set manual DNS (8.8.8.8 / 8.8.4.4). Tested over 1 hour — stable.',
            'time_spent_minutes' => 90,
        ]);

        // ----------------------------------------------------------------
        // 5. Cancelled request
        // ----------------------------------------------------------------
        $request5 = RepairRequest::create([
            'id'                   => Str::uuid(),
            'user_id'              => $customer5->id,
            'technician_id'        => null,
            'issue_category'       => 'Other',
            'issue_description'    => 'Screen flickering. Decided to buy a new monitor instead.',
            'severity_level'       => 'low',
            'status'               => 'cancelled',
            'system_specifications' => null,
            'user_images'          => [],
            'tech_images'          => [],
        ]);

        LifecycleEvent::create([
            'repair_request_id' => $request5->id,
            'status'            => 'submitted',
            'updated_by'        => $customer5->id,
            'note'              => 'Request submitted by customer.',
        ]);
        LifecycleEvent::create([
            'repair_request_id' => $request5->id,
            'status'            => 'cancelled',
            'updated_by'        => $customer5->id,
            'note'              => 'Customer cancelled — decided to purchase a replacement monitor.',
        ]);
    }
}
