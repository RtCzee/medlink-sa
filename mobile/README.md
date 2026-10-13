# MedLink Mobile

Native Android patient-app prototype built with Kotlin and Jetpack Compose.

## Open in Android Studio

Open the `mobile` folder (not the repository root) in Android Studio, let Gradle sync, then run the `app` configuration on an emulator or Android device. Use JDK 17 and install Android SDK Platform 35 if Android Studio prompts for it.

## What's in this prototype

- Sign-in and create-account screens
- Patient overview with upcoming-care summary
- Emergency QR medical ID, ambulance dialer shortcut, and demo nearby-hospital map
- Facility selection and queue-ticket interaction
- Appointment overview and doctor contact actions
- Medical record list and editable profile fields

All displayed people, records, tickets, appointments, and authentication are demo-only. The app does not connect to a server, save data, or send messages. The current Next.js/Prisma project does not yet expose the authentication or healthcare APIs needed to make these flows real. Connect those APIs and add secure token handling, authorization, and protected health-data storage before production use.