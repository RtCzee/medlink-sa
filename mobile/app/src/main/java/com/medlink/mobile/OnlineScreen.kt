package com.medlink.mobile

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.medlink.mobile.api.ApiException
import com.medlink.mobile.api.Appointment
import com.medlink.mobile.api.MedLinkApi
import com.medlink.mobile.api.MedLinkServices
import com.medlink.mobile.api.Medicine
import com.medlink.mobile.api.MedicinePrice
import com.medlink.mobile.api.Practitioner
import com.medlink.mobile.api.Prescription
import com.medlink.mobile.api.SupabaseAuth
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException

private val OInk = Color(0xFF30336F)
private val OMuted = Color(0xFF737796)
private val OTeal = Color(0xFF20AFC0)
private val OMint = Color(0xFFE2F7F7)
private val ORed = Color(0xFFB73535)
private val ODemo = Color(0xFFFFF2E9)
private val Sast: ZoneId = ZoneId.of("Africa/Johannesburg")
private val SastFormat: DateTimeFormatter = DateTimeFormatter.ofPattern("EEE d MMM yyyy, HH:mm", java.util.Locale.ENGLISH)

/** Loading / error / content state for one API-backed list. */
private sealed interface Load<out T> {
    data object Loading : Load<Nothing>
    data class Failed(val message: String) : Load<Nothing>
    data class Ready<T>(val value: T) : Load<T>
}

/** UTC ISO instant → "Mon 20 Oct 2026, 09:30 SAST". */
internal fun formatSast(utc: String): String = try {
    Instant.parse(utc).atZone(Sast).format(SastFormat) + " SAST"
} catch (e: DateTimeParseException) {
    utc
}

/** 7 → "#007". */
internal fun ticketLabel(number: Int): String = "#" + number.toString().padStart(3, '0')

/** "2026-10-21" + "09:30" in SAST → UTC ISO instant, or null if either is invalid. */
internal fun sastToUtc(date: String, time: String): String? = try {
    ZonedDateTime.of(LocalDate.parse(date.trim()), LocalTime.parse(time.trim()), Sast).toInstant().toString()
} catch (e: DateTimeParseException) {
    null
}

/**
 * The "Online" tab: the patient's real MedLink account through the web API
 * (Supabase session → Bearer token → Next.js /api → Prisma/Postgres). Nothing here is
 * stored in Room or faked offline; with no network the screen says so.
 */
@Composable
internal fun OnlineScreen(onLocalDemo: @Composable () -> Unit) {
    val context = LocalContext.current
    val auth = remember(context) { MedLinkServices.auth(context) }
    val api = remember(context) { MedLinkServices.api(context) }
    var signedInEmail by remember { mutableStateOf(auth.currentSession?.email ?: auth.currentSession?.let { "" }) }
    var notice by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    Column(Modifier.padding(horizontal = 20.dp)) {
        Spacer(Modifier.height(22.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Image(
                painter = painterResource(R.drawable.medlink_logo),
                contentDescription = "MedLink logo",
                modifier = Modifier.size(width = 34.dp, height = 44.dp),
                contentScale = ContentScale.Fit,
            )
            Spacer(Modifier.width(8.dp))
            Text("MEDLINK  /  ONLINE", color = OTeal, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.2.sp)
        }
        Spacer(Modifier.height(7.dp))
        Text("Online services", fontSize = 27.sp, fontWeight = FontWeight.Bold, color = OInk)
        Spacer(Modifier.height(5.dp))
        Text("Queues, appointments, records, prescriptions and medicines from your MedLink account.", color = OMuted, fontSize = 13.sp)
        Spacer(Modifier.height(16.dp))

        if (!api.isConfigured || !auth.isConfigured) {
            InfoCard("This build has no MedLink server configured, so online services are off. Set medlink.apiBaseUrl, medlink.supabaseUrl and medlink.supabasePublishableKey (see README). Below is the offline demo.", ODemo)
            Spacer(Modifier.height(12.dp))
            onLocalDemo()
            return@Column
        }

        notice?.let { InfoCard(it, ODemo); Spacer(Modifier.height(10.dp)) }

        if (signedInEmail == null) {
            OnlineSignIn(auth) { email -> notice = null; signedInEmail = email }
            return@Column
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("Signed in as ${signedInEmail?.ifEmpty { "your account" }}", color = OMuted, fontSize = 12.sp, modifier = Modifier.weight(1f))
            TextButton(onClick = { scope.launch { auth.signOut(); signedInEmail = null } }) { Text("Sign out", color = OTeal) }
        }
        val onExpired = { notice = "Your session has expired. Please sign in again."; signedInEmail = null }
        OnlineSections(api, onExpired)
    }
}

@Composable
private fun OnlineSignIn(auth: SupabaseAuth, onSignedIn: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    var email by rememberSaveable { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Column(Modifier.padding(18.dp)) {
            Text("Sign in to your MedLink account", fontWeight = FontWeight.Bold, color = OInk)
            Text("Use the account you created on the MedLink website (separate from the offline account on this device).", color = OMuted, fontSize = 12.sp)
            Spacer(Modifier.height(10.dp))
            OutlinedTextField(email, { email = it; error = null }, Modifier.fillMaxWidth(), label = { Text("Email address") }, singleLine = true)
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(password, { password = it; error = null }, Modifier.fillMaxWidth(), label = { Text("Password") }, singleLine = true, visualTransformation = PasswordVisualTransformation())
            Spacer(Modifier.height(12.dp))
            Button(
                enabled = !busy && email.isNotBlank() && password.isNotEmpty(),
                onClick = {
                    busy = true
                    scope.launch {
                        try {
                            val session = auth.signIn(email.trim().lowercase(), password)
                            password = ""
                            onSignedIn(session.email ?: email.trim())
                        } catch (e: ApiException) {
                            error = e.message
                        } finally {
                            busy = false
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(12.dp),
            ) {
                if (busy) CircularProgressIndicator(Modifier.size(18.dp), color = Color.White, strokeWidth = 2.dp) else Text("Sign in")
            }
            error?.let { Spacer(Modifier.height(6.dp)); Text(it, color = ORed, fontSize = 12.sp) }
        }
    }
}

@Composable
private fun OnlineSections(api: MedLinkApi, onExpired: () -> Unit) {
    var section by rememberSaveable { mutableIntStateOf(0) }
    val labels = listOf("Queue", "Appointments", "Records", "Prescriptions", "Medicines")
    Row(Modifier.horizontalScroll(rememberScrollState()), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        labels.forEachIndexed { i, label -> FilterChip(selected = section == i, onClick = { section = i }, label = { Text(label, fontSize = 12.sp) }) }
    }
    Spacer(Modifier.height(12.dp))
    when (section) {
        0 -> QueueSection(api, onExpired)
        1 -> AppointmentsSection(api, onExpired)
        2 -> RecordsSection(api, onExpired)
        3 -> PrescriptionsSection(api, onExpired)
        else -> MedicinesSection(api, onExpired)
    }
    Spacer(Modifier.height(20.dp))
}

/** Runs [block] into a Load state; a 401 signs the user out instead of showing an error. */
@Composable
private fun <T> rememberLoad(key: Any, onExpired: () -> Unit, block: suspend () -> T): Pair<Load<T>, () -> Unit> {
    var state by remember(key) { mutableStateOf<Load<T>>(Load.Loading) }
    var reload by remember(key) { mutableIntStateOf(0) }
    LaunchedEffect(key, reload) {
        state = Load.Loading
        state = try {
            Load.Ready(block())
        } catch (e: ApiException.Unauthorized) {
            onExpired(); Load.Failed(e.message ?: "Please sign in again.")
        } catch (e: ApiException) {
            Load.Failed(e.message ?: "Something went wrong.")
        }
    }
    return state to { reload++ }
}

@Composable
private fun <T> LoadView(state: Load<List<T>>, retry: () -> Unit, empty: String, item: @Composable (T) -> Unit) {
    when (state) {
        Load.Loading -> Row(Modifier.fillMaxWidth().padding(24.dp), horizontalArrangement = Arrangement.Center) { CircularProgressIndicator(color = OTeal) }
        is Load.Failed -> Column {
            InfoCard(state.message, ODemo)
            TextButton(onClick = retry) { Text("Try again", color = OTeal) }
        }
        is Load.Ready -> if (state.value.isEmpty()) Text(empty, color = OMuted, fontSize = 13.sp) else state.value.forEach { item(it); Spacer(Modifier.height(8.dp)) }
    }
}

/** Runs a write and reports the outcome; returns true on success. */
private suspend fun act(onExpired: () -> Unit, onMessage: (String) -> Unit, block: suspend () -> String): Boolean = try {
    onMessage(block()); true
} catch (e: ApiException.Unauthorized) {
    onExpired(); false
} catch (e: ApiException) {
    onMessage(e.message ?: "Something went wrong."); false
}

@Composable
private fun QueueSection(api: MedLinkApi, onExpired: () -> Unit) {
    val scope = rememberCoroutineScope()
    var version by remember { mutableIntStateOf(0) }
    var message by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    val (tickets, retryTickets) = rememberLoad("tickets$version", onExpired) { api.myTickets("waiting") }
    val (queues, retryQueues) = rememberLoad("queues", onExpired) { api.queues() }

    message?.let { InfoCard(it, OMint); Spacer(Modifier.height(8.dp)) }
    Text("Your tickets today", fontWeight = FontWeight.Bold, color = OInk, fontSize = 16.sp)
    Spacer(Modifier.height(8.dp))
    LoadView(tickets, retryTickets, "You are not in any queue.") { t ->
        ItemCard(title = ticketLabel(t.ticketNumber) + " · " + t.facilityName, lines = listOf("Status: ${t.status}", t.waitingAhead?.let { "$it waiting ahead of you" } ?: "", "Issued ${formatSast(t.issuedAt)}")) {
            OutlinedButton(enabled = !busy, onClick = {
                busy = true
                scope.launch {
                    if (act(onExpired, { message = it }) { api.leaveTicket(t.id); "You left the queue at ${t.facilityName}." }) version++
                    busy = false
                }
            }) { Text("Leave queue") }
        }
    }
    Spacer(Modifier.height(14.dp))
    Text("Join a queue", fontWeight = FontWeight.Bold, color = OInk, fontSize = 16.sp)
    Spacer(Modifier.height(8.dp))
    LoadView(queues, retryQueues, "No facilities are taking queue tickets yet.") { q ->
        ItemCard(title = q.name, lines = listOf("${q.city}, ${q.province}", "Tickets for ${q.serviceDate}")) {
            Button(enabled = !busy, onClick = {
                busy = true
                scope.launch {
                    if (act(onExpired, { message = it }) { val t = api.joinQueue(q.id); "Ticket ${ticketLabel(t.ticketNumber)} at ${t.facilityName}. ${t.waitingAhead ?: 0} ahead of you." }) version++
                    busy = false
                }
            }) { Text("Join") }
        }
    }
}

@Composable
private fun AppointmentsSection(api: MedLinkApi, onExpired: () -> Unit) {
    val scope = rememberCoroutineScope()
    var version by remember { mutableIntStateOf(0) }
    var message by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }
    var rescheduling by remember { mutableStateOf<String?>(null) }
    val (appointments, retry) = rememberLoad("appts$version", onExpired) { api.appointments() }

    message?.let { InfoCard(it, OMint); Spacer(Modifier.height(8.dp)) }
    BookAppointmentCard(api, onExpired) { message = it; version++ }
    Spacer(Modifier.height(14.dp))
    Text("Your appointments", fontWeight = FontWeight.Bold, color = OInk, fontSize = 16.sp)
    Spacer(Modifier.height(8.dp))
    LoadView(appointments, retry, "No appointments yet.") { a: Appointment ->
        ItemCard(title = "${a.practitionerName} · ${a.specialty}", lines = listOf(a.facilityName, formatSast(a.scheduledAt), "Status: ${a.status}", a.reason ?: "")) {
            if (a.status == "requested" || a.status == "confirmed") {
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (a.status == "requested") OutlinedButton(enabled = !busy, onClick = { rescheduling = if (rescheduling == a.id) null else a.id }) { Text("Reschedule") }
                    OutlinedButton(enabled = !busy, onClick = {
                        busy = true
                        scope.launch {
                            if (act(onExpired, { message = it }) { api.cancelAppointment(a.id); "Appointment cancelled." }) version++
                            busy = false
                        }
                    }) { Text("Cancel", color = ORed) }
                }
            }
            if (rescheduling == a.id) {
                DateTimeInputs("New time") { utc ->
                    busy = true
                    scope.launch {
                        if (act(onExpired, { message = it }) { val u = api.rescheduleAppointment(a.id, utc); "Moved to ${formatSast(u.scheduledAt)}." }) { rescheduling = null; version++ }
                        busy = false
                    }
                }
            }
        }
    }
}

@Composable
private fun BookAppointmentCard(api: MedLinkApi, onExpired: () -> Unit, onBooked: (String) -> Unit) {
    val scope = rememberCoroutineScope()
    var open by remember { mutableStateOf(false) }
    var chosen by remember { mutableStateOf<Practitioner?>(null) }
    var reason by remember { mutableStateOf("") }
    var error by remember { mutableStateOf<String?>(null) }
    if (!open) {
        Button(onClick = { open = true }, shape = RoundedCornerShape(12.dp)) { Text("Book an appointment") }
        return
    }
    val (practitioners, retry) = rememberLoad("practitioners", onExpired) { api.practitioners() }
    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Column(Modifier.padding(14.dp)) {
            Text("Choose a practitioner", fontWeight = FontWeight.Bold, color = OInk)
            Spacer(Modifier.height(6.dp))
            LoadView(practitioners, retry, "No practitioners are listed yet.") { p: Practitioner ->
                Text(
                    (if (chosen?.id == p.id) "● " else "○ ") + "${p.fullName} · ${p.specialty}" + (p.facilityName?.let { " · $it" } ?: ""),
                    color = if (chosen?.id == p.id) OTeal else OInk, fontSize = 13.sp,
                    modifier = Modifier.fillMaxWidth().clickable { chosen = p }.padding(vertical = 4.dp),
                )
            }
            OutlinedTextField(reason, { reason = it }, Modifier.fillMaxWidth(), label = { Text("Reason (optional)") })
            error?.let { Text(it, color = ORed, fontSize = 12.sp) }
            DateTimeInputs("Request appointment") { utc ->
                val p = chosen
                if (p == null) { error = "Choose a practitioner first."; return@DateTimeInputs }
                scope.launch {
                    if (act(onExpired, { error = it }) { val a = api.bookAppointment(p.id, utc, reason); "Requested ${a.practitionerName} on ${formatSast(a.scheduledAt)}." }) {
                        open = false; chosen = null; reason = ""; error = null
                        onBooked("Appointment requested.")
                    }
                }
            }
            TextButton(onClick = { open = false }) { Text("Close", color = OMuted) }
        }
    }
}

/** Date (YYYY-MM-DD) and time (HH:MM) in SAST, converted to a UTC instant for the API. */
@Composable
private fun DateTimeInputs(action: String, onSubmit: (String) -> Unit) {
    var date by remember { mutableStateOf(LocalDate.now(Sast).plusDays(1).toString()) }
    var time by remember { mutableStateOf("09:00") }
    var error by remember { mutableStateOf<String?>(null) }
    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        OutlinedTextField(date, { date = it; error = null }, Modifier.weight(1f), label = { Text("Date") }, singleLine = true)
        OutlinedTextField(time, { time = it; error = null }, Modifier.weight(0.7f), label = { Text("Time (SAST)") }, singleLine = true)
    }
    error?.let { Text(it, color = ORed, fontSize = 12.sp) }
    Button(onClick = { sastToUtc(date, time)?.let(onSubmit) ?: run { error = "Use a date like 2026-10-21 and a time like 09:30." } }) { Text(action) }
}

@Composable
private fun RecordsSection(api: MedLinkApi, onExpired: () -> Unit) {
    val (records, retry) = rememberLoad("records", onExpired) { api.medicalRecords() }
    Text("Medical records", fontWeight = FontWeight.Bold, color = OInk, fontSize = 16.sp)
    Spacer(Modifier.height(8.dp))
    LoadView(records, retry, "No medical records on your account yet.") { r ->
        ItemCard(title = r.title, lines = listOf("${r.category} · ${r.recordedOn}", r.provider ?: "", r.notes ?: "")) {}
    }
}

@Composable
private fun PrescriptionsSection(api: MedLinkApi, onExpired: () -> Unit) {
    val scope = rememberCoroutineScope()
    var details by remember { mutableStateOf<Map<String, Prescription>>(emptyMap()) }
    var message by remember { mutableStateOf<String?>(null) }
    val (list, retry) = rememberLoad("rx", onExpired) { api.prescriptions() }
    Text("Prescriptions", fontWeight = FontWeight.Bold, color = OInk, fontSize = 16.sp)
    Spacer(Modifier.height(8.dp))
    message?.let { InfoCard(it, ODemo) }
    LoadView(list, retry, "No prescriptions on your account yet.") { p ->
        val detail = details[p.id]
        val itemLines = detail?.items?.map { "• ${it.medicineName} — ${it.dosage}" + (it.instructions?.let { i -> " ($i)" } ?: "") + " · refills ${it.refills}" } ?: emptyList()
        ItemCard(title = "Issued ${p.issuedOn} · ${p.status}", lines = listOf(p.practitionerName ?: "", p.facilityName ?: "", p.expiresOn?.let { "Expires $it" } ?: "", "${p.itemCount} item(s)") + itemLines) {
            if (detail == null) TextButton(onClick = {
                scope.launch { act(onExpired, { message = it }) { details = details + (p.id to api.prescription(p.id)); "" }.also { if (it) message = null } }
            }) { Text("Show items", color = OTeal) }
        }
    }
}

@Composable
private fun MedicinesSection(api: MedLinkApi, onExpired: () -> Unit) {
    val scope = rememberCoroutineScope()
    var prices by remember { mutableStateOf<Map<String, List<MedicinePrice>>>(emptyMap()) }
    var message by remember { mutableStateOf<String?>(null) }
    val (list, retry) = rememberLoad("medicines", onExpired) { api.medicines() }
    Text("Medicines", fontWeight = FontWeight.Bold, color = OInk, fontSize = 16.sp)
    Spacer(Modifier.height(6.dp))
    InfoCard("Prices shown are DEMO sample data, not current retail prices. Always confirm with the pharmacy.", ODemo)
    Spacer(Modifier.height(8.dp))
    message?.let { InfoCard(it, ODemo) }
    LoadView(list, retry, "No medicines listed.") { m: Medicine ->
        val p = prices[m.id]
        val priceLines = p?.map { "${it.pharmacyName}: ${it.currency} ${it.amount}" + if (it.isDemo) " (demo, ${it.effectiveFrom})" else " (from ${it.effectiveFrom})" } ?: emptyList()
        ItemCard(
            title = listOfNotNull(m.name, m.strength).joinToString(" "),
            lines = listOf(listOfNotNull(m.form, m.category).joinToString(" · "), if (m.requiresPrescription) "Prescription required" else "Over the counter") + priceLines,
        ) {
            if (p == null) TextButton(onClick = {
                scope.launch { act(onExpired, { message = it }) { prices = prices + (m.id to api.medicinePrices(m.id)); "" }.also { if (it) message = null } }
            }) { Text("Show demo prices", color = OTeal) }
        }
    }
}

@Composable
private fun ItemCard(title: String, lines: List<String>, actions: @Composable () -> Unit) {
    Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White), modifier = Modifier.fillMaxWidth()) {
        Column(Modifier.padding(14.dp)) {
            Text(title, fontWeight = FontWeight.Bold, color = OInk)
            lines.filter { it.isNotBlank() }.forEach { Text(it, color = OMuted, fontSize = 12.sp) }
            Spacer(Modifier.height(4.dp))
            actions()
        }
    }
}

@Composable
private fun InfoCard(text: String, background: Color) {
    Card(shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = background), modifier = Modifier.fillMaxWidth()) {
        Text(text, color = OInk, fontSize = 12.sp, modifier = Modifier.padding(12.dp))
    }
}

