# MedLink Mobile

Native Android patient-app prototype built with Kotlin and Jetpack Compose.

## Open in Android Studio

Open the `mobile` folder (not the repository root) in Android Studio, let Gradle sync, then run the `app` configuration on an emulator or Android device. Use JDK 17 and install Android SDK Platform 35 if Android Studio prompts for it.

## What's in this prototype

- Offline sign-in and account creation backed by a local Room database
- Local passwords stored as salted PBKDF2 hashes
- Profile settings for optional emergency details, saved locally and included in the emergency QR
- Patient overview with upcoming-care summary
- Emergency QR medical ID, ambulance dialer shortcut, and demo nearby-hospital map
- Facility selection and queue-ticket interaction
- Appointment overview and doctor contact actions
- Medical record list and editable profile fields

### Offline account use

Create an account with a name, valid email address, and password (8–128 characters), then sign in with that email and password. Account records are stored only in the app's local Room database; email matching is case-insensitive and passwords are salted and hashed. Profile settings let patients add a phone number, blood type, allergies, conditions, and an emergency contact. The QR includes the account name/email and any saved emergency details; anyone scanning it can read those details. There is no network connection, cross-device sync, or online password recovery. Uninstalling the app or clearing its storage removes local accounts.

Authentication is local-only and is not a production identity system. Appointments, medical records, tickets, and other health features remain demo data and are not saved or sent. The current Next.js/Prisma project does not expose the healthcare APIs needed to connect those flows.