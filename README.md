# Franchise Management & Warranty Portal

A full-stack, production-grade franchise management system serving **400+ franchises** and **3,000+ customers monthly**. Built entirely in TypeScript, deployed and actively used in production.

🔗 **Live System:** https://warranty.emporiobyautoform.in/

---

## Overview

This is a live operational platform that manages the complete lifecycle of a product franchise network. It handles everything from warranty registration and grievance resolution to product catalogs, marketing assets, and announcements, all under a single unified system with role-based access.

---

## Modules

| Module | Description |
|---|---|
| **Warranty Management** | End-to-end warranty registration, tracking, and claim processing |
| **Fraud Prevention** | GPS-based location verification + camera metadata analysis to detect fraudulent warranty registrations |
| **Grievance Management** | Structured complaint submission and resolution workflow for customers |
| **Franchise Management** | Onboarding, management, and oversight of 400+ franchise partners |
| **Product Catalog** | Centralized product listings accessible to franchise partners |
| **Announcements** | Company-wide communication broadcast to franchises |
| **POSMs** | Point-of-Sale Marketing material distribution and management |
| **Admin Panel** | Full system oversight, analytics, and control for administrators |

---

## Fraud Prevention System

One of the core differentiators of this platform is its multi-layered fraud detection for warranty registrations:

- **GPS Verification** — At the time of warranty registration, the customer's location is captured and the distance is calculated against the nearest verified store in our database. Registrations from implausible locations are flagged.
- **Camera Metadata Analysis** — Product images submitted during registration are analyzed for EXIF/camera metadata. Inconsistencies (e.g., old photo timestamps, mismatched device data) are used to detect fraudulent submissions.

This system protects against fake warranty claims at scale across a distributed franchise network.

---

## User Roles

### Customer
- Register product warranties
- Submit and track grievances

### Franchise Partner
- Access product catalog
- View announcements and POSMs
- Manage warranty claims
- Submit grievances
- Access franchise-specific data

### Admin
- Full system access
- Manage franchises, products, announcements, and POSMs
- Monitor fraud flags and warranty claims
- Customer and franchise oversight

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | TypeScript, hosted on Hostinger |
| Backend | TypeScript, deployed on Vercel |
| Database | MySQL (phpMyAdmin) |
| Media Storage | Cloudinary |

---

## Scale

- **400+** active franchise partners
- **3,000+** customer interactions per month
- Production system with real business operations running on it

---

## Documentation

- [`CUSTOMER_USER_MANUAL.md`](./CUSTOMER_USER_MANUAL.md) — End-user guide for customers
- [`FRANCHISE_USER_MANUAL.md`](./FRANCHISE_USER_MANUAL.md) — Guide for franchise partners
- [`UID_SYNC_API_DOCS.md`](./UID_SYNC_API_DOCS.md) — API documentation for UID sync
- [`UID_SYNC_GUIDE_FOR_TEAMS.md`](./UID_SYNC_GUIDE_FOR_TEAMS.md) — Integration guide for teams
