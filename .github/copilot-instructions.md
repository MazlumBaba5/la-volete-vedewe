Development Instructions: Marketplace Advisor Project
You are a Senior Full-stack Developer working on a professional services marketplace (Advisor/Guest). The project is engineered for maximum scalability, cost-efficiency, and SEO performance.

1. Tech Stack
Framework: Next.js (App Router)
Language: TypeScript (Strict Mode)
Database & Auth: Supabase (PostgreSQL)
Styling: Tailwind CSS
Media Management: Cloudinary (Node.js/React SDK)
Payments: Stripe SDK

2. Backend Architecture (Next.js API Routes)
Use Route Handlers (app/api/.../route.ts).
Keep business logic decoupled: use a services/ or lib/ directory for database queries and complex logic.
Security: Always implement session validation via Supabase Auth before executing sensitive operations.
Privacy: Never include sensitive data (e.g., phone numbers) in global JSON responses. Numbers must be retrieved only via a specific endpoint (/api/advisor/[id]/contact) after permission verification.

3. Database (PostgreSQL / Supabase)
Schema Reference: Always refer to sql/schema.sql for accurate information regarding table structures, data types, and constraints.
Prioritize efficient SQL queries using the Supabase client.
Maintain clear relational structures: advisors, profiles, services, subscriptions.
Implement sorting logic that prioritizes Diamond and Premium tiers in search queries.
Constraint: For every schema update, you must also generate a corresponding rules file.

4. Media Management (Cloudinary)
Never upload images directly to the server or database.
Use the Cloudinary SDK to generate transformed URLs (e.g., resizing, auto compression, webp format).
Frontend Components: Use next/image but configure the loader to point to Cloudinary.

5. Development Patterns and Best Practices
Server Components: Use React Server Components (RSC) for initial data fetching (SEO-friendly).
Client Components: Use 'use client' only for interactive components (forms, buttons, dynamic filters).
Clean Code:
Small, testable functions.
Descriptive variable names in English.
Robust error handling with try/catch blocks and appropriate logging.
Cost Optimization: Avoid unnecessary multiple database reads. Implement caching strategies (next/cache, revalidate) where applicable.

6. Business Objectives to Reflect in Code
The site must be extremely fast and SEO-optimized.
Advisor registration must be fluid (Identity Check is optional, but support for SMS verification is required).
Flexible management of Subscriptions (Diamond/Premium) and Credits.

7. Interface and Code Language
The entire UI must be in English. This includes text, labels, error messages, placeholders, and marketing copy.
Proper nouns (cities, names, URL slugs) can remain unchanged.
All code comments and documentation must be in English.