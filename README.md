# ShopBillingApp

> An offline-first mobile billing, inventory, and shop management application built with React Native and Expo, with optional Google authentication and Supabase cloud synchronization.

**Status:** Beta V1  
**Platform:** Android  
**Architecture:** Offline-first + Cloud Sync  
**License:** MIT

---

## Overview

ShopBillingApp is a mobile billing and inventory management application designed for small shops and retail businesses.

The application follows an **offline-first architecture**. Core shop operations continue to work using a local SQLite database, while authenticated users can synchronize shop data with Supabase for cloud backup and restoration.

### Core Architecture

```text
                 ShopBillingApp
                       |
          +------------+------------+
          |                         |
     Local SQLite              Supabase Cloud
          |                         |
    Offline Operations        Cloud Backup
          |                         |
          +------ Sync Engine ------+
                       |
                Google Account
                 Authentication
```

---

# Features

## Billing

- Create customer bills
- Add products to the current cart
- Increase or decrease product quantities
- Modify selling prices
- Add loose/non-barcoded items
- Calculate item totals automatically
- Calculate grand totals
- Generate invoice numbers
- Save completed bills locally
- Synchronize bills with Supabase

## Product Management

- Add products manually
- Scan product barcodes
- Search products by name
- Search products by barcode
- Edit product information
- Delete products
- Store product MRP
- Automatically look up product information using barcode services
- Maintain products locally when offline
- Synchronize product changes with the cloud

## Barcode Scanning

Supported barcode types include:

- EAN-13
- EAN-8
- Code 128
- Code 39
- QR

Barcode scanning uses the device camera, with a confirmation beep after a successful scan.

## Product Lookup

Barcode information can be used to look up product information from OpenFoodFacts.

```text
Scan Barcode
     ↓
Barcode Detected
     ↓
OpenFoodFacts Lookup
     ↓
Product Information
     ↓
Add Product
     ↓
Save to SQLite
     ↓
Sync with Supabase
```

If the lookup service is unavailable, the product can still be entered manually.

---

# Invoice History

The application maintains local invoice history.

Users can:

- View previous invoices
- Search invoices
- Search by invoice number
- Search by customer name
- Search by mobile number
- Open invoice details
- View individual invoice items
- View invoice totals
- Generate a PDF invoice
- Share the generated invoice
- Send invoice information through SMS

---

# Shop Settings

Supported settings include:

- Shop name
- Owner name
- Phone number
- Shop address
- GST number
- UPI ID

Shop settings are stored locally and can be synchronized with Supabase for cloud restoration.

---

# Google Authentication

Users can sign in using their Google account through Supabase Authentication.

The authenticated Supabase user ID is used to associate cloud data with the correct account.

A user can:

1. Sign in with Google
2. Create or manage shop data
3. Sign out
4. Reinstall or clear local application data
5. Sign in again
6. Restore cloud-backed shop data

---

# Offline-First Architecture

The application does not depend entirely on the cloud for normal billing operations.

```text
User Action
    ↓
SQLite Database
    ↓
Local Operation Completed
    ↓
Mark Record for Synchronization
    ↓
Attempt Cloud Sync
    ↓
     ┌───────────────┐
     │ Internet/Auth │
     │ Available?    │
     └───────┬───────┘
             │
       Yes   │   No
        ↓    │    ↓
 Supabase    │  Keep Local
 Synchronize │  Pending
        ↓
 Mark Synced
```

If synchronization fails:

- Local data is not deleted
- The operation remains stored locally
- The record can be synchronized later

This helps protect against data loss caused by temporary network or authentication problems.

---

# Cloud Synchronization

Supabase is used as the cloud backend.

The synchronization layer handles:

- Products
- Bills
- Bill items
- Shop settings

Synchronization metadata includes:

- `cloud_id`
- `updated_at`
- `sync_status`

The application supports synchronization of:

- New products
- Updated products
- Deleted products
- New bills
- Bill items
- Shop settings

---

# Account Isolation

Cloud data is associated with the authenticated Supabase user.

When switching accounts, local shop data is cleared before restoring the newly authenticated account's cloud data.

```text
Account A
   ↓
Logout
   ↓
Clear local shop data
   ↓
Login as Account B
   ↓
Synchronize Account B data
   ↓
Account B's shop data restored
```

This prevents one user's local shop information from appearing under another account.

---

# Technology Stack

| Technology | Purpose |
|---|---|
| React Native | Mobile application framework |
| Expo | Development and application tooling |
| Expo Router | File-based navigation |
| TypeScript | Type-safe development |
| Expo SQLite | Local database |
| Supabase | Authentication and cloud database |
| Google OAuth | User authentication |
| Expo Camera | Barcode scanning |
| OpenFoodFacts | Product lookup |
| Expo Print | PDF invoice generation |
| Expo Sharing | Invoice sharing |
| Expo SMS | SMS invoice sharing |
| Expo Audio | Barcode scan feedback |

---

# Project Architecture

```text
ShopBillingApp/
│
├── assets/
│   ├── images/
│   └── sounds/
│
├── src/
│   ├── app/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── add-product.tsx
│   │   ├── cart.tsx
│   │   ├── edit-product.tsx
│   │   ├── generate-bill.tsx
│   │   ├── history.tsx
│   │   ├── invoice-details.tsx
│   │   ├── login.tsx
│   │   ├── loose-item.tsx
│   │   ├── mode-selection.tsx
│   │   ├── products.tsx
│   │   ├── profile.tsx
│   │   ├── scan-product.tsx
│   │   ├── scan.tsx
│   │   ├── settings.tsx
│   │   └── auth/
│   │       └── callback.tsx
│   │
│   ├── components/
│   │   ├── AppAlert.tsx
│   │   ├── AppButton.tsx
│   │   ├── AppInput.tsx
│   │   ├── EmptyState.tsx
│   │   └── ScreenHeader.tsx
│   │
│   ├── constants/
│   │   └── colors.ts
│   ├── context/
│   │   └── CartContext.tsx
│   ├── database/
│   │   └── db.ts
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── sync.ts
│   └── services/
│       ├── openFoodFacts.ts
│       ├── productLookup.ts
│       └── sqliteLookup.ts
│
├── app.json
├── eas.json
├── package.json
├── tsconfig.json
└── README.md
```

---

# Database Architecture

## Local Database

SQLite provides local persistence for:

```text
Products
Bills
Bill Items
Shop Settings
```

Cloud synchronization metadata is maintained alongside local records.

Important fields include:

```text
cloud_id
updated_at
sync_status
```

## Supabase

Supabase provides:

- Authentication
- Cloud database
- Per-user data storage
- Cloud backup
- Data restoration

The application obtains the authenticated user and uses the user's Supabase ID during synchronization.

---

# Security

Sensitive environment configuration is kept outside the repository.

Example environment variables:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

The `.env` file is intentionally excluded from Git.

Never commit:

```text
.env
service-role keys
private API keys
OAuth secrets
access tokens
refresh tokens
private certificates
keystores
```

---

# Installation

## Prerequisites

Install:

- Node.js
- npm
- Expo tooling
- Android development environment or an Android device

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/ShopBillingApp.git
```

Enter the project:

```bash
cd ShopBillingApp
```

Install dependencies:

```bash
npm install
```

---

# Environment Configuration

Create a local `.env` file:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

Do not commit this file.

---

# Development

Start the Expo development server:

```bash
npx expo start
```

Clear the Metro cache when required:

```bash
npx expo start -c
```

Run TypeScript validation:

```bash
npx tsc --noEmit
```

Run Expo diagnostics:

```bash
npx expo-doctor
```

Check dependency compatibility:

```bash
npx expo install --check
```

A clean V1 verification should report:

```text
21/21 checks passed. No issues detected!
```

---

# Android Development Build

Configure EAS:

```bash
eas build:configure
```

Build the development version:

```bash
eas build --platform android --profile development
```

For a clean build:

```bash
eas build --platform android --profile development --clear-cache
```

---

# Testing

ShopBillingApp V1 has been tested against the major operational flows.

## Authentication

- [x] Google login
- [x] Logout
- [x] Login restoration
- [x] Account switching
- [x] Cloud data restoration

## Products

- [x] Add product
- [x] Barcode lookup
- [x] Edit product
- [x] Delete product
- [x] Product cloud synchronization
- [x] Offline product update
- [x] Offline product deletion
- [x] Later synchronization

## Billing

- [x] Add products to cart
- [x] Change quantity
- [x] Change selling price
- [x] Add loose items
- [x] Generate invoice
- [x] Save invoice locally
- [x] Cloud synchronization

## Invoice History

- [x] View invoices
- [x] Search invoices
- [x] Open invoice details
- [x] Generate PDF
- [x] Share invoice
- [x] SMS functionality

## Offline Mode

Offline behavior has been tested for product operations.

When authentication/cloud synchronization is unavailable, local operations remain safely stored and can be synchronized later.

## Account Isolation

Multiple Google accounts have been tested.

The application:

1. Signs out the current user
2. Clears local shop data
3. Authenticates the new user
4. Restores only the new user's cloud data

---

# V1 Beta Status

ShopBillingApp V1 is intended for **real-world beta testing**.

Primary V1 objectives:

- Reliable billing
- Local data persistence
- Offline operation
- Cloud backup
- Google authentication
- Product management
- Invoice history
- Account isolation
- Professional, simple UI

---

# Known Limitations

V1 intentionally keeps the scope focused.

Possible improvements for future versions include:

- Advanced dashboard analytics
- Better inventory management
- Stock quantity tracking
- Sales reports
- Profit reports
- GST-specific billing improvements
- Advanced invoice customization
- Better PDF templates
- Printer integration
- Thermal printer support
- More payment methods
- Customer management
- Supplier management
- Multiple shop support
- Role-based access
- Improved profile/account management
- More extensive UI customization
- Advanced synchronization conflict handling

---

# Roadmap

## V1 — Beta

- [x] Local SQLite database
- [x] Product CRUD
- [x] Barcode scanning
- [x] Product lookup
- [x] Cart
- [x] Loose items
- [x] Invoice generation
- [x] Invoice history
- [x] Invoice PDF
- [x] SMS sharing
- [x] Shop settings
- [x] Google authentication
- [x] Supabase synchronization
- [x] Offline operation
- [x] Account switching
- [x] Account-specific cloud restoration
- [x] Product synchronization
- [x] Product deletion synchronization
- [x] Bill synchronization
- [x] Settings synchronization
- [x] Beta testing

## V2 — Planned

- [ ] Advanced inventory
- [ ] Stock management
- [ ] Sales analytics
- [ ] Profit tracking
- [ ] Customer management
- [ ] Supplier management
- [ ] Advanced reports
- [ ] Thermal printer support
- [ ] Improved invoice templates
- [ ] Better profile/account management
- [ ] Enhanced UI
- [ ] Improved synchronization conflict handling
- [ ] Additional business features

---

# Versioning

```text
V1
 └── Beta release
       └── Real-world testing

V2
 └── Feature expansion
       └── Advanced business functionality
```

Recommended release tags:

```text
v1.0.0-beta
v1.0.0
v2.0.0
```

---

# Contributing

Contributions, suggestions, and bug reports are welcome.

Before submitting a change, make sure:

```bash
npx tsc --noEmit
npx expo-doctor
```

complete successfully.

Please avoid committing:

- `.env` files
- credentials
- API secrets
- private certificates
- authentication tokens

---

# License

This project is licensed under the MIT License.

See the `LICENSE` file for details.

---

# Author

**Parampreet Singh**

ShopBillingApp is developed as an offline-first mobile billing and shop management solution with a focus on reliability, cloud backup, and practical retail workflows.

---

## Project Status

**ShopBillingApp V1 — Beta Ready**

The V1 build has completed functional, offline, synchronization, authentication, account-isolation, and core UI testing and is ready for controlled beta testing.

---

## Disclaimer

ShopBillingApp V1 is a beta release.

Users should maintain appropriate business records and verify generated invoices and financial information before relying on the application for production accounting or statutory compliance.
