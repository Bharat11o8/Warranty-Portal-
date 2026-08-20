# Franchise Management & Warranty Portal

A full-stack, production-grade franchise management system serving **400+ franchises** and **3,000+ customers monthly**. Built entirely in TypeScript, deployed and actively used in production.

🔗 **Live System:** https://warranty2.autoformindia.co.in/

---

## Overview

This is a live operational platform that manages the complete lifecycle of a product franchise network. It handles everything from warranty registration and grievance resolution to B2B ordering, product catalogs, marketing assets, and announcements, all under a single unified system with role-based access.

---

## Modules

| Module | Description |
|---|---|
| **Warranty Management** | End-to-end warranty registration, tracking, and claim processing, including a resubmission workflow for rejected claims |
| **Fraud Prevention** | GPS-based location verification + camera metadata analysis to detect fraudulent warranty registrations |
| **UID Management** | Pre-generated serial numbers synced from an external generator, with validation, bulk import, and export |
| **Grievance Management** | Structured complaint submission, assignment, and resolution workflow for customers and franchises |
| **Franchise Management** | Onboarding, verification, and oversight of 400+ franchise partners |
| **Distributor & B2B Ordering** | Franchise-to-distributor ordering with inventory, order chat, and generated PDF invoices |
| **Product Catalog** | Centralized product listings and e-catalogue accessible to franchise partners |
| **Announcements** | Company-wide communication broadcast to franchises, including WhatsApp campaigns |
| **POSMs** | Point-of-Sale Marketing material distribution and management |
| **Analytics** | Franchise leaderboards, geographic distribution, product mix, and fraud analysis |
| **Admin Panel** | Full system oversight and control, with a per-admin module permission matrix |

---

## Fraud Prevention System

One of the core differentiators of this platform is its multi-layered fraud detection for warranty registrations. Each submission is scored on a 100-point deduction model that produces a **trust score** (0–100, higher is better) plus a set of flags for admin review:

- **GPS Verification** — At the time of warranty registration, the location embedded in the submitted product photos is compared against the nearest verified store, and the distance is scored in tiers. Registrations from implausible locations are flagged.
- **IP Geolocation** — The submitting IP is resolved to a city and state and compared against the store's, with an allowance for the Delhi NCR cluster to avoid false positives.
- **Camera Metadata Analysis** — Product images are analyzed for EXIF/camera metadata. Inconsistencies across the photo set — different capture devices, or images taken more than 500m apart — indicate a fabricated submission.
- **Source-Aware Scoring** — Franchise-submitted registrations are scored GPS-first with IP as fallback; customer and QR-code submissions are scored on IP alone, since a customer's own device location proves nothing about the installation site.

This system protects against fake warranty claims at scale across a distributed franchise network.

---

## User Roles

### Customer
- Register product warranties (dashboard, or by scanning a store's QR code without an account)
- Submit and track grievances

### Franchise Partner
- Access product catalog and e-catalogue
- View announcements and POSMs
- Register and verify warranty claims, and manage installer/manpower records
- Place B2B orders with their assigned distributors
- Submit grievances
- Access franchise-specific analytics

### Admin
- Full system access, scoped by a per-module read/write permission matrix
- Manage franchises, distributors, products, announcements, and POSMs
- Monitor fraud flags, review warranty claims, and manage UIDs
- Customer and franchise oversight, with a full activity audit log

---

## Authentication

The system is **passwordless**. Admins sign in with their email address, franchises and customers with their mobile number. A one-time code is delivered over WhatsApp where available and by email otherwise, and the resulting session is held in an HttpOnly cookie.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui — static SPA build hosted on Hostinger |
| Backend | Node.js + Express + TypeScript, served from `api.autoformindia.co.in` |
| Database | MySQL |
| Media Storage | Local disk on the API host, served over HTTPS |
| Realtime | Socket.io for in-app notifications |
| Messaging | Interakt (WhatsApp Business API) and SMTP email |

---

## Repository Layout

Two independently built and deployed applications live in this repository. There is no root `package.json` — install and run each separately.

```
seal-guardian-58321-main/   Frontend SPA (React + Vite)
server/                     Backend API (Express + MySQL)
```

### Running locally

```bash
# Frontend — dev server on :8080
cd seal-guardian-58321-main
npm install
npm run dev

# Backend — dev server on :3000
cd server
npm install
npm run dev
```

The backend requires a `.env` with database credentials, `JWT_SECRET`, SMTP settings, and — for the WhatsApp, UID sync, and IP geolocation integrations — `INTERAKT_API_KEY`, `UID_SYNC_API_KEY`, and `IPINFO_TOKEN`. The server refuses to start without `JWT_SECRET`.

Database changes are applied through one-off setup scripts in `server/src/scripts/`, run with `tsx`. Some of them drop and recreate live tables; read a script before running it.

---

## Scale

- **400+** active franchise partners
- **3,000+** customer interactions per month
- Production system with real business operations running on it

---

## Documentation

- [`CUSTOMER_USER_MANUAL.md`](./CUSTOMER_USER_MANUAL.md) — End-user guide for customers
- [`FRANCHISE_USER_MANUAL.md`](./FRANCHISE_USER_MANUAL.md) — Guide for franchise partners
- [`UID_VENDOR_MANUAL.md`](./UID_VENDOR_MANUAL.md) — UID handling guide for vendors
- [`UID_SYNC_API_DOCS.md`](./UID_SYNC_API_DOCS.md) — API documentation for UID sync
- [`UID_SYNC_GUIDE_FOR_TEAMS.md`](./UID_SYNC_GUIDE_FOR_TEAMS.md) — Integration guide for teams
- [`CLAUDE.md`](./CLAUDE.md) — Architecture notes and known pitfalls for contributors
