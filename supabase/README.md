# Supabase Database & Storage Setup Guide

This guide walks you through setting up your Supabase project for the **Yash Dixit Portfolio & Private Admin Dashboard**.

---

## 1. Create Your Supabase Project

1. Go to [supabase.com](https://supabase.com) and log in or create a free account.
2. Click **New Project**.
3. Fill in the project details:
   - **Name**: `yash-portfolio` (or your preferred name)
   - **Database Password**: Choose a strong password and save it securely in your password manager.
   - **Region**: Choose a region close to your target audience (e.g., `South Asia (Mumbai)` or `Central EU`).
   - **Pricing Plan**: Free Plan.
4. Click **Create new project** and wait ~2 minutes for provisioning to finish.

---

## 2. Obtain Your Supabase Credentials (Safe vs Secret)

In your Supabase project dashboard:

1. Click on **Project Settings** (the gear icon on the left sidebar) -> **API** (or **Data API**).
2. Look for the following fields:
   - **Project URL**: Format `https://xxxxxxxxxxxxxxxxxxxx.supabase.co`
     > *Safe to use in the public portfolio frontend (read-only through RLS).*
   - **anon / public key**: Long JWT string starting with `eyJ...`
     > *Safe to use in the public portfolio frontend.*
   - **service_role key**: 
     > ⚠️ **CRITICAL WARNING**: **NEVER** share, paste, or commit the `service_role` key anywhere in frontend code or git repositories. It bypasses all Row Level Security. We will **NOT** use the service-role key for our frontend or dashboard.

---

## 3. Apply the Database Schema, Security & Seed Data

You can apply the entire database setup in one click:

1. In your Supabase dashboard, click **SQL Editor** on the left navigation bar (icon with `>_`).
2. Click **+ New Query**.
3. Open [`supabase/schema_and_seed.sql`](./schema_and_seed.sql) in this repository, copy its entire contents, and paste them into the SQL Editor.
4. Click **Run** (or press `Ctrl` + `Enter`).
5. You should see `Success. No rows returned` in the query results.

This single script:
- Creates all 7 tables (`personal_info`, `about_me`, `skills`, `projects`, `hackathons`, `certificates`, `education`).
- Automatically wires up `updated_at` timestamp triggers.
- Creates indexes on display and sort orders.
- Enables **Row Level Security (RLS)** on all tables.
- Implements the `is_admin()` security function bound strictly to `dixityash2999@gmail.com`.
- Grants public read access (`SELECT`) to anonymous visitors.
- Restricts `INSERT`, `UPDATE`, and `DELETE` strictly to `dixityash2999@gmail.com`.
- Provisions the public `portfolio-assets` Storage Bucket (5 MB max, image MIME types only).
- Configures Storage RLS policies (public read, admin-only upload/edit/delete).
- Populates every table with the exact initial data from `src/data/portfolioData.js`.

---

## 4. Set Up Supabase Authentication

### A. Create Your Admin User
1. In your Supabase dashboard, go to **Authentication** -> **Users**.
2. Click **Add user** -> **Create user**.
3. Enter:
   - **Email**: `dixityash2999@gmail.com` *(Must match the email configured in our RLS policies)*
   - **Password**: Choose a secure admin password.
   - Check **Auto Confirm User?** so you don't have to wait for an email confirmation link.
4. Click **Create user**.

### B. Disable Public Signups
To ensure no unauthorized user can create an account on your admin dashboard:
1. Go to **Authentication** -> **Providers** -> **Email**.
2. Uncheck **Enable Signups** (or toggle "Allow new users to sign up" to OFF).
3. Click **Save**.
*(Now, only the user created in Step A can ever log into the dashboard).*

---

## 5. Upload Existing Certificate Images to Supabase Storage (Optional but Recommended)

Your repository currently has 8 certificate images in `public/certificates/`.

1. In your Supabase dashboard, go to **Storage** -> **Buckets**.
2. Click on the bucket named `portfolio-assets`.
3. Create a folder named `certificates`.
4. Upload the 8 certificate images from `public/certificates/`:
   - `cisco-cybersecurity.png`
   - `iamneo-dsa.png`
   - `iamneo-python.png`
   - `infosys-javascript.png`
   - `infosys-python-fundamentals.png`
   - `red-hat-linux.png`
   - `udemy-english-grammar.png`
   - `udemy-generative-ai.png`

*(Note: The portfolio will continue to fall back to the bundled local certificate files if `image_url` is not set, so nothing will break either way!)*

---

## 6. How to Verify Database Setup

Run the following quick checks in your Supabase dashboard to verify everything is working:

### Verification Check 1: Table Editor
1. Click **Table Editor** on the left sidebar.
2. Select `projects`: Verify that 4 projects appear (`CareerPilot AI`, `Paytm GrowthPilot`, `Smart Hospital Management System`, `Student Grade Calculator`).
3. Select `skills`: Verify 6 categories appear.
4. Select `hackathons`: Verify 3 events appear.
5. Select `certificates`: Verify 8 credentials appear.
6. Select `personal_info`: Verify your details and `core_tools` appear.

### Verification Check 2: Anonymous Public Read Test
In the **SQL Editor**, run:
```sql
-- Test public read access as anonymous user
SET ROLE anon;
SELECT count(*) FROM projects;
SELECT count(*) FROM certificates;
RESET ROLE;
```
Expected result: Returns 4 projects and 8 certificates successfully.

### Verification Check 3: Security Test (Unauthorized Write Attempt)
In the **SQL Editor**, run:
```sql
-- Test unauthorized write prevention
SET ROLE anon;
INSERT INTO projects (display_id, name, badge, tagline, problem, description, role)
VALUES ('99', 'Hacked Project', 'TEST', 'Test', 'Test', 'Test', 'Test');
RESET ROLE;
```
Expected result: **ERROR: new row violates row-level security policy for table "projects"**. This confirms your database is secure and cannot be vandalized.

