# Stripe CLI + Webhook Setup

## 1) Prerequisiti

Assicurati che in `.env.local` ci siano almeno:

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_CLIENT_GOLD_30_DAYS=price_...
```

## 2) Installare Stripe CLI (Linux x86_64)

```bash
mkdir -p /tmp/stripe-cli
curl -fL https://github.com/stripe/stripe-cli/releases/download/v1.37.3/stripe_1.37.3_linux_x86_64.tar.gz -o /tmp/stripe-cli/stripe.tar.gz
tar -xzf /tmp/stripe-cli/stripe.tar.gz -C /tmp/stripe-cli
mkdir -p ~/.local/bin
install -m 755 /tmp/stripe-cli/stripe ~/.local/bin/stripe
stripe --version
```

## 3) Setup webhook locale (consigliato in dev)

Terminale A (app):

```bash
npm run dev
```

Terminale B (Stripe listener):

```bash
source .env.local
stripe --api-key "$STRIPE_SECRET_KEY" listen --forward-to http://localhost:3000/api/webhooks/stripe
```

Il comando sopra stampa:

```text
Your webhook signing secret is whsec_...
```

Copia quel valore in `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

Poi riavvia `npm run dev`.

Nota: il `whsec_...` del listener CLI puo cambiare quando riavvii `stripe listen`. Se cambia, aggiorna `.env.local` e riavvia l'app.

## 4) Setup webhook da Stripe Dashboard (staging/production)

1. Vai in `Stripe Dashboard -> Developers -> Webhooks -> Add endpoint`.
2. Endpoint URL:
   - staging/prod: `https://TUO-DOMINIO/api/webhooks/stripe`
3. Seleziona eventi:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Salva endpoint e copia il `Signing secret` (`whsec_...`).
5. Imposta `STRIPE_WEBHOOK_SECRET` nell'environment del deploy (Vercel o altro).
6. Ridistribuisci l'app.

## 5) Test rapido webhook

Con listener attivo:

```bash
source .env.local
stripe --api-key "$STRIPE_SECRET_KEY" trigger checkout.session.completed
```

Se tutto e ok, nel terminale listener vedrai richieste inoltrate e risposta `200` verso `/api/webhooks/stripe`.

## 6) Test checkout Gold senza soldi reali

1. Fai checkout Gold dal sito in test mode.
2. Usa carta test Stripe, ad esempio:
   - numero: `4242 4242 4242 4242`
   - data: futura
   - CVC: qualsiasi 3 cifre
3. Verifica:
   - Stripe event `checkout.session.completed` consegnato (`Delivered`).
   - Dashboard client aggiornata a Gold dopo webhook.

## 7) Troubleshooting

- Gold non si attiva:
  - listener non attivo oppure endpoint non raggiungibile
  - `STRIPE_WEBHOOK_SECRET` errato/non aggiornato
  - app non riavviata dopo modifica `.env.local`
- Errore firma webhook:
  - secret sbagliato (usa quello dell'endpoint esatto in uso)
