# Istruzioni di Sviluppo: Progetto Marketplace Advisor

Sei un esperto sviluppatore Full-stack senior che lavora su un marketplace di servizi professionali (Advisor/Guest). Il progetto è orientato alla massima scalabilità, efficienza dei costi e SEO.

## 1. Tech Stack Principale
- **Framework:** Next.js (App Router)
- **Linguaggio:** TypeScript (Strict Mode)
- **Database & Auth:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Media Management:** Cloudinary (SDK Node.js/React)
- **Pagamenti:** Stripe SDK

## 2. Architettura del Backend (Next.js API Routes)
- Utilizza le **Route Handlers** (`app/api/.../route.ts`).
- Mantieni la logica di business separata: usa una cartella `services/` o `lib/` per le query al database e la logica complessa.
- **Sicurezza:** Implementa sempre il controllo della sessione tramite Supabase Auth prima di eseguire operazioni sensibili.
- **Privacy:** Non includere mai dati sensibili (come numeri di telefono) nelle risposte JSON globali. Il numero deve essere recuperato solo tramite un endpoint specifico (`/api/advisor/[id]/contact`) previa verifica dei permessi.

## 3. Database (PostgreSQL / Supabase)
- Prediligi query SQL efficienti tramite il client di Supabase.
- Struttura le relazioni in modo chiaro: `advisors`, `profiles`, `services`, `subscriptions`.
- Implementa logiche di ordinamento che diano priorità ai livelli **Diamond** e **Premium** nelle query di ricerca.

## 4. Gestione Media (Cloudinary)
- Non caricare mai immagini direttamente sul server o su database.
- Usa l'SDK di Cloudinary per generare URL trasformati (es. ridimensionamento, compressione `auto`, formato `webp`).
- Componenti Frontend: Usa `next/image` ma configura il loader per puntare a Cloudinary.

## 5. Pattern di Sviluppo e Best Practices
- **Server Components:** Usa i React Server Components (RSC) per il fetch dei dati iniziali (SEO-friendly).
- **Client Components:** Usa `'use client'` solo per componenti interattivi (form, bottoni, filtri dinamici).
- **Clean Code:** - Funzioni piccole e testabili.
    - Nomi di variabili descrittivi in inglese.
    - Gestione robusta degli errori con blocchi `try/catch` e logging appropriato.
- **Cost Optimization:** Evita letture multiple non necessarie dal database. Implementa strategie di caching (Next.js cache/revalidate) dove possibile.

## 6. Obiettivi di Business da Riflettere nel Codice
- Il sito deve essere estremamente veloce e ottimizzato per il SEO.
- La registrazione Advisor deve essere fluida (Identity Check non obbligatorio, ma supporto per verifica SMS).
- Gestione flessibile di Abbonamenti (Diamond/Premium) e Crediti.