This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Stripe setup

Copy the variables from [`.env.example`](/home/babayaga/Documents/Next.Js/la-volete-vedewe/.env.example) into your local environment and add the real Stripe price IDs for:

- `premium` monthly subscription
- `diamond` monthly subscription
- `starter`, `boost`, and `power` credit packs

The advisor dashboard now uses:

- `POST /api/stripe/checkout` for Stripe Checkout sessions
- `POST /api/stripe/portal` for the Stripe Billing Portal
- `POST /api/webhooks/stripe` to sync subscriptions and credit wallet purchases back into Supabase

Apply [stripe_billing_setup.sql](/home/babayaga/Documents/Next.Js/la-volete-vedewe/src/app/sql/stripe_billing_setup.sql) after the base schema to add the indexes used by the billing flow.

Recommended local webhook command:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
