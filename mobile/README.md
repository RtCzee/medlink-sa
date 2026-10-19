# MedLink Mobile

Native Android patient-app prototype built with Kotlin and Jetpack Compose.

## Open in Android Studio

Open the `mobile` folder (not the repository root) in Android Studio, let Gradle sync, then run the `app` configuration on an emulator or Android device. Use JDK 17 and install Android SDK Platform 35 if Android Studio prompts for it.

## Online services (MedLink API)

The **Online** tab connects to the real MedLink backend: it signs in with Supabase Auth and calls the Next.js API (`/api/*`) with `Authorization: Bearer <access token>`. It covers queues (list, join, your ticket, leave), appointments (list, book, reschedule, cancel), medical records (read), prescriptions with their items (read) and the medicine directory with prices, which are **demo data, not current prices**.

Configure the build with Gradle properties, either in `mobile/local.properties` (git-ignored) or with `-P` on the command line:

```properties
# The deployed website, or http://10.0.2.2:3000 for the emulator against `npm run dev`
medlink.apiBaseUrl=https://your-deployment.example.com
medlink.supabaseUrl=https://<project-ref>.supabase.co
# The publishable key only; never the secret/service-role key
medlink.supabasePublishableKey=<publishable key>
```

Without them the app still builds and the Online tab shows the offline queue demo. Debug builds allow plain HTTP (for a local `npm run dev` server); release builds require HTTPS.

How it works (`app/src/main/java/com/medlink/mobile/api/`):

- `ApiClient`: HttpURLConnection (part of the Android SDK, no extra library) with 10 s connect / 15 s read timeouts, on `Dispatchers.IO`. It parses the `{data, meta}` and `{error:{code,message}, requestId}` envelopes and maps failures to `ApiException` (Unauthorized, Server, Timeout, Network, Malformed, NotConfigured) so screens show loading, empty, error and retry states.
- `SupabaseAuth`: email/password sign-in, token refresh 60 s before expiry, sign-out. The session is kept in app-private SharedPreferences (`allowBackup=false`). A 401 from the API, or a failed refresh, signs the Online tab out.
- `MedLinkApi`: typed calls and strict parsing of each response.
- Nothing logs tokens or health data. Online data is not written to Room and nothing is queued offline.
- Accounts are created on the website (sign-up needs email confirmation), then used in the app.

Unit tests (`./gradlew test`) run the real HttpURLConnection transport against a local socket server (Bearer header, envelopes, 401, timeouts, network errors, malformed responses), the token refresh and sign-out logic, and the SAST date handling.

## What's in this prototype

- Offline sign-in and account creation backed by a local Room database
- Local passwords stored as salted PBKDF2 hashes
- Profile settings for optional emergency details, saved locally and included in the emergency QR
- Locally saved appointment requests with upcoming and past appointment views
- Patient-specific medical records saved locally in Room
- Patient overview with upcoming appointment summary
- Emergency QR medical ID, ambulance dialer shortcut, and demo nearby-hospital map
- Facility selection and queue-ticket interaction
- Medical record list and editable profile fields

### Offline account use

Create an account with a name, valid email address, and password (8–128 characters), then sign in with that email and password. Account records are stored only in the app's local Room database; email matching is case-insensitive and passwords are salted and hashed. Profile settings let patients add a phone number, blood type, allergies, conditions, and an emergency contact. The QR includes the account name/email and any saved emergency details; anyone scanning it can read those details. The offline account has no network connection, cross-device sync, or online password recovery (the Online tab uses a separate website account). Uninstalling the app or clearing its storage removes local accounts.

Authentication is local-only and is not a production identity system. Appointment requests are local reminders only and are not sent to providers. Medical records entered in the Records tab are personal notes saved locally for the signed-in account; they are not verified provider records and are not sent or backed up. These offline features stay local. The Online tab is the connected version: queue tickets, appointments, records, prescriptions and medicines there come from the MedLink API.