# KUSH & CO

Nurse-led platform for NMCN license renewal assistance and community health outreach across Nigeria.

**Live site:** https://kushco.site.je

## Features
- Public marketing site with hero, services, gallery, and outreach listings
- Renewal request form with server-side validation
- Secure admin dashboard (session-based auth)
- Manage outreaches, gallery, site settings via JSON storage (no database)
- Mark renewals complete, upload certificate images, control public visibility

## Stack
PHP 8 · JSON flat-file storage · Vanilla JS · Modern CSS

## Structure
kush/
├── api/         # REST endpoints
├── data/        # JSON content (settings, gallery, outreaches)
├── js/          # Frontend logic
├── partials/    # Reusable HTML fragments
├── uploads/     # User images
├── admin.html   # Admin panel
└── index.html   # Public site

## Setup
1. Clone into web root (e.g. xampp/htdocs/kush)
2. Copy config.php and set the admin password
3. Ensure data/ and uploads/ are writable (chmod 755)
4. Open index.html