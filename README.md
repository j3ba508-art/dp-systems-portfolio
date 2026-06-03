# Marketplace System Case Study

## Positioning
Supabase Backend & DevOps portfolio project built with HTML, CSS, vanilla JavaScript, and Supabase.

## Problem
Small sellers need a lightweight way to manage products, inventory, buyer orders, and customer contact options without using a heavy custom platform.

## Solution
Built a Supabase-backed marketplace prototype with seller onboarding, product CRUD, buyer checkout, seller-based order grouping, and order tracking screens.

## Backend work
- Supabase Auth and profile-based seller flow
- PostgreSQL tables for profiles, buyers, products, orders, and order items
- Product ownership through seller IDs
- Stock fields, active product status, low-stock threshold, and checkout safety planning
- Storage/image workflow planning
- RLS/access-control planning for buyer, seller, and admin behavior

## Frontend work
- HTML and CSS layout without packaged UI frameworks
- Vanilla JavaScript and ES module organization
- Product cards, dashboard rendering, and DOM updates
- Product add/edit overlay workflow
- Buyer cart state and checkout flow
- Seller-side order management screens
- Console-based debugging and controlled change management

## Production mindset
- Rollback baseline for key files
- Stable error logs instead of noisy debug alerts
- Supabase local/cloud workflow awareness
- Environment/configuration checks
- Future checkout safety layer through atomic database transaction/RPC

## Portfolio summary
This project shows a practical transition from layout-focused web pages into full-stack business workflow implementation: database design, authentication, dashboards, inventory logic, order flow, debugging, and deployment readiness.
