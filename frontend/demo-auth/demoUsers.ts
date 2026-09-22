/**
 * SMART PC HUB — Demo User Credentials
 *
 * These match the seeded accounts in UserSeeder.php.
 * Password for all: "password"
 *
 * This file is ONLY imported by DemoLoginButtons.
 * No production code references it.
 *
 * Order: Customer → Technician → Admin
 */

export interface DemoUser {
  label: string;
  email: string;
  password: string;
  color: string;
  icon: string;
}

export const DEMO_USERS: DemoUser[] = [
  {
    label: 'Customer',
    email: 'customer1@smartpchub.test',
    password: 'password',
    color: 'emerald',
    icon: '\uD83D\uDFE2',
  },
  {
    label: 'Technician',
    email: 'ali.hassan@smartpchub.test',
    password: 'password',
    color: 'blue',
    icon: '\uD83D\uDD35',
  },
  {
    label: 'Admin',
    email: 'admin@smartpchub.test',
    password: 'password',
    color: 'rose',
    icon: '\uD83D\uDD34',
  },
];
