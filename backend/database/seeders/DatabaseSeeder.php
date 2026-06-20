<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Client;
use App\Models\Workspace;
use App\Models\Contract;
use App\Models\ContractClause;
use App\Models\Payment;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $superAdmin = User::create([
            'name' => 'المدير العام',
            'email' => 'admin@shadapp.com',
            'password' => 'password',
            'role' => User::ROLE_SUPER_ADMIN,
        ]);

        $manager = User::create([
            'name' => 'أحمد المدير',
            'email' => 'manager@shadapp.com',
            'password' => 'password',
            'role' => User::ROLE_ACCOUNT_MANAGER,
            'super_admin_id' => $superAdmin->id,
        ]);

        $client = Client::create([
            'company_name' => 'Curve Firm',
            'contact_person' => 'Ali',
            'email' => 'client@shadapp.com',
            'phone' => '0555000111',
            'password' => 'password',
            'manager_id' => $manager->id,
            'status' => 'active',
            'contract_value' => 150000,
            'payment_status' => 'pending',
            'signature_data' => null,
        ]);

        $workspace = Workspace::create([
            'client_id' => $client->id,
            'manager_id' => $manager->id,
            'status' => 'inactive',
        ]);

        $contract = Contract::create([
            'workspace_id' => $workspace->id,
            'title' => 'عقد تطوير منصة إلكترونية',
            'status' => 'draft',
            'value' => 150000,
            'created_by' => $manager->id,
        ]);

        $contract->clauses()->createMany([
            ['content' => 'يقدم الطرف الأول خدماته وفق الجدول الزمني المتفق عليه', 'type' => 'fixed', 'sort_order' => 0],
            ['content' => 'تسري أحكام هذا العقد لمدة سنة من تاريخ التوقيع', 'type' => 'fixed', 'sort_order' => 1],
            ['content' => 'يمكن تجديد العقد تلقائياً ما لم يخطر أحد الطرفين الآخر', 'type' => 'optional', 'sort_order' => 2],
        ]);

        Payment::create([
            'workspace_id' => $workspace->id,
            'client_id' => $client->id,
            'amount' => 50000,
            'method_type' => 'تحويل بنكي',
            'status' => 'pending',
        ]);

        $this->call(ContractClauseTemplateSeeder::class);

        $this->command->info('Demo data seeded successfully!');
        $this->command->info('Super Admin: admin@shadapp.com / password');
        $this->command->info('Manager: manager@shadapp.com / password');
        $this->command->info('Client: client@shadapp.com / password');
    }
}
