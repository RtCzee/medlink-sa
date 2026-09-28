package com.medlink.mobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.Chat
import androidx.compose.material.icons.automirrored.filled.ReceiptLong
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LocalHospital
import androidx.compose.material.icons.filled.MedicalInformation
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Queue
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

private val Ink = Color(0xFF17333A)
private val Muted = Color(0xFF718489)
private val Canvas = Color(0xFFF3F7F5)
private val Teal = Color(0xFF176B63)
private val Mint = Color(0xFFDCEFE8)
private val Coral = Color(0xFFE68168)
private val Line = Color(0xFFE2EAE6)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { MedLinkApp() }
    }
}

@Composable
private fun MedLinkApp() {
    var signedIn by rememberSaveable { mutableStateOf(false) }
    var selectedTab by rememberSaveable { mutableIntStateOf(0) }
    var patientName by rememberSaveable { mutableStateOf("Aisha Patel") }
    var message by remember { mutableStateOf<String?>(null) }

    MaterialTheme(
        colorScheme = MaterialTheme.colorScheme.copy(
            primary = Teal,
            onPrimary = Color.White,
            background = Canvas,
            surface = Color.White,
            onSurface = Ink,
            onBackground = Ink,
        ),
    ) {
        Surface(modifier = Modifier.fillMaxSize(), color = Canvas) {
            if (!signedIn) {
                SignInScreen(onContinue = { name ->
                    if (name.isNotBlank()) patientName = name
                    signedIn = true
                })
            } else {
                Scaffold(
                    containerColor = Canvas,
                    bottomBar = {
                        NavigationBar(containerColor = Color.White) {
                            val tabs = listOf("Home", "Queue", "Care", "Records", "Profile")
                            val icons = listOf(
                                Icons.Default.Home,
                                Icons.Default.Queue,
                                Icons.Default.CalendarMonth,
                                Icons.AutoMirrored.Filled.ReceiptLong,
                                Icons.Default.Person,
                            )
                            tabs.forEachIndexed { index, label ->
                                NavigationBarItem(
                                    selected = selectedTab == index,
                                    onClick = { selectedTab = index },
                                    icon = { Icon(icons[index], contentDescription = label) },
                                    label = { Text(label, fontSize = 10.sp) },
                                )
                            }
                        }
                    },
                ) { insets ->
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(insets)
                            .verticalScroll(rememberScrollState()),
                    ) {
                        when (selectedTab) {
                            0 -> HomeScreen(patientName, onNavigate = { selectedTab = it })
                            1 -> QueueScreen(onMessage = { message = it })
                            2 -> CareScreen(onMessage = { message = it })
                            3 -> RecordsScreen()
                            else -> ProfileScreen(patientName) { patientName = it }
                        }
                    }
                }
            }
        }
    }

    message?.let { text ->
        AlertDialog(
            onDismissRequest = { message = null },
            title = { Text("Demo action") },
            text = { Text(text) },
            confirmButton = {
                TextButton(onClick = { message = null }) { Text("Got it") }
            },
        )
    }
}

@Composable
private fun SignInScreen(onContinue: (String) -> Unit) {
    var createAccount by rememberSaveable { mutableStateOf(false) }
    var name by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var password by rememberSaveable { mutableStateOf("") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        BrandMark()
        Spacer(Modifier.height(36.dp))
        Text(if (createAccount) "Your care, connected." else "Welcome back.", fontSize = 31.sp, fontWeight = FontWeight.Bold, color = Ink)
        Spacer(Modifier.height(8.dp))
        Text("One place for your health journey.", color = Muted, fontSize = 15.sp)
        Spacer(Modifier.height(28.dp))
        if (createAccount) {
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Full name") },
                singleLine = true,
            )
            Spacer(Modifier.height(12.dp))
        }
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Email address") },
            singleLine = true,
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            singleLine = true,
        )
        Spacer(Modifier.height(20.dp))
        Button(
            onClick = { onContinue(name.ifBlank { "Aisha Patel" }) },
            modifier = Modifier.fillMaxWidth().height(54.dp),
            shape = RoundedCornerShape(14.dp),
        ) {
            Text(if (createAccount) "Create account" else "Sign in", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.width(8.dp))
            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null)
        }
        TextButton(onClick = { createAccount = !createAccount }, modifier = Modifier.align(Alignment.CenterHorizontally)) {
            Text(if (createAccount) "Already have an account? Sign in" else "New to MedLink? Create an account", color = Teal)
        }
        Spacer(Modifier.height(12.dp))
        DemoNotice()
    }
}

@Composable
private fun HomeScreen(name: String, onNavigate: (Int) -> Unit) {
    Column(modifier = Modifier.padding(horizontal = 20.dp)) {
        Spacer(Modifier.height(20.dp))
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.weight(1f)) {
                Text("MEDLINK  /  SOUTH AFRICA", color = Teal, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.2.sp)
                Spacer(Modifier.height(7.dp))
                Text("Hello, ${name.substringBefore(' ')}", fontSize = 25.sp, fontWeight = FontWeight.Bold, color = Ink)
            }
            Avatar("${name.firstOrNull() ?: 'A'}", Modifier.size(46.dp))
        }
        Spacer(Modifier.height(20.dp))
        Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = Teal)) {
            Column(Modifier.padding(20.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.FavoriteBorder, contentDescription = null, tint = Color.White)
                    Spacer(Modifier.width(9.dp))
                    Text("YOUR CARE, AT A GLANCE", color = Color.White.copy(alpha = 0.8f), fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                }
                Spacer(Modifier.height(15.dp))
                Text("One step at a time.", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold)
                Spacer(Modifier.height(5.dp))
                Text("Your health details and upcoming care, together.", color = Color.White.copy(alpha = 0.82f), fontSize = 13.sp)
                Spacer(Modifier.height(18.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    SummaryMetric("02", "Upcoming visits", Modifier.weight(1f))
                    SummaryMetric("01", "Active prescription", Modifier.weight(1f))
                }
            }
        }
        Spacer(Modifier.height(23.dp))
        SectionHeading("Next appointment", "See all") { onNavigate(2) }
        Spacer(Modifier.height(10.dp))
        AppointmentCard("Dr. Thandiwe Mokoena", "General Practice", "Tomorrow  ·  09:30", "Rosebank Clinic")
        Spacer(Modifier.height(22.dp))
        SectionHeading("Quick access", null, null)
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            QuickAction("Join a queue", Icons.Default.Queue, Modifier.weight(1f)) { onNavigate(1) }
            QuickAction("Find a doctor", Icons.Default.LocalHospital, Modifier.weight(1f)) { onNavigate(2) }
        }
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            QuickAction("Medical records", Icons.Default.MedicalInformation, Modifier.weight(1f)) { onNavigate(3) }
            QuickAction("My profile", Icons.Default.Person, Modifier.weight(1f)) { onNavigate(4) }
        }
        Spacer(Modifier.height(20.dp))
        DemoNotice()
        Spacer(Modifier.height(20.dp))
    }
}

@Composable
private fun QueueScreen(onMessage: (String) -> Unit) {
    var selectedHospital by rememberSaveable { mutableStateOf("Rosebank Clinic") }
    var ticketCreated by rememberSaveable { mutableStateOf(false) }
    Column(Modifier.padding(horizontal = 20.dp)) {
        ScreenTitle("Queues", "Choose a facility and service to join its queue.")
        Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
            Column(Modifier.padding(18.dp)) {
                Text("SELECT FACILITY", color = Muted, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                Spacer(Modifier.height(10.dp))
                listOf("Rosebank Clinic", "Chris Hani Baragwanath Hospital", "Charlotte Maxeke Hospital").forEach { hospital ->
                    Row(
                        modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).clickable { selectedHospital = hospital }.padding(vertical = 12.dp, horizontal = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Icon(Icons.Default.LocalHospital, contentDescription = null, tint = if (selectedHospital == hospital) Teal else Muted)
                        Spacer(Modifier.width(10.dp))
                        Text(hospital, modifier = Modifier.weight(1f), color = Ink, fontSize = 13.sp)
                        if (selectedHospital == hospital) Icon(Icons.Default.CheckCircle, contentDescription = "Selected", tint = Teal)
                    }
                }
                Divider(color = Line)
                Spacer(Modifier.height(12.dp))
                Text("SERVICE", color = Muted, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                Spacer(Modifier.height(7.dp))
                Text("General check-up  ·  Outpatient", color = Ink, fontWeight = FontWeight.Medium)
                Spacer(Modifier.height(16.dp))
                Button(onClick = { ticketCreated = true }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
                    Icon(Icons.Default.Add, contentDescription = null)
                    Spacer(Modifier.width(8.dp))
                    Text("Join this queue")
                }
            }
        }
        Spacer(Modifier.height(18.dp))
        if (ticketCreated) {
            Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Mint)) {
                Row(Modifier.padding(17.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Teal)
                    Spacer(Modifier.width(12.dp))
                    Column {
                        Text("Demo ticket created", fontWeight = FontWeight.Bold, color = Ink)
                        Text("$selectedHospital · estimated wait 38 min", color = Muted, fontSize = 12.sp)
                    }
                }
            }
        } else {
            Text("Your active ticket", color = Ink, fontWeight = FontWeight.Bold, fontSize = 17.sp)
            Spacer(Modifier.height(10.dp))
            Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Row(Modifier.fillMaxWidth().padding(17.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("#042", fontSize = 26.sp, fontWeight = FontWeight.Bold, color = Teal)
                        Text("Rosebank Clinic · General check-up", fontSize = 12.sp, color = Muted)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text("38 min", color = Ink, fontWeight = FontWeight.Bold)
                        Text("estimated", color = Muted, fontSize = 11.sp)
                    }
                }
            }
        }
        Spacer(Modifier.height(16.dp))
        DemoNotice()
        Spacer(Modifier.height(20.dp))
    }
}

@Composable
private fun CareScreen(onMessage: (String) -> Unit) {
    Column(Modifier.padding(horizontal = 20.dp)) {
        ScreenTitle("Care team", "Appointments and doctor communication.")
        Button(onClick = { onMessage("Appointment requests and doctor messaging will work when MedLink's secure care API is connected.") }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
            Icon(Icons.Default.CalendarMonth, contentDescription = null)
            Spacer(Modifier.width(8.dp))
            Text("Request an appointment")
        }
        Spacer(Modifier.height(20.dp))
        Text("UPCOMING APPOINTMENTS", color = Muted, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        Spacer(Modifier.height(10.dp))
        AppointmentCard("Dr. Sipho Dlamini", "Cardiology", "Today  ·  16:00", "Chris Hani Baragwanath")
        Spacer(Modifier.height(10.dp))
        AppointmentCard("Dr. Thandiwe Mokoena", "General Practice", "Tomorrow  ·  09:30", "Rosebank Clinic")
        Spacer(Modifier.height(21.dp))
        Text("YOUR DOCTORS", color = Muted, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        Spacer(Modifier.height(10.dp))
        DoctorRow("Dr. Sipho Dlamini", "Cardiology", "SD") { onMessage("Secure messaging with Dr. Dlamini will be available once a provider connection is configured.") }
        Spacer(Modifier.height(8.dp))
        DoctorRow("Dr. Thandiwe Mokoena", "General Practice", "TM") { onMessage("Secure messaging with Dr. Mokoena will be available once a provider connection is configured.") }
        Spacer(Modifier.height(16.dp))
        DemoNotice()
        Spacer(Modifier.height(20.dp))
    }
}

@Composable
private fun RecordsScreen() {
    Column(Modifier.padding(horizontal = 20.dp)) {
        ScreenTitle("Medical records", "Your care history, prescriptions, and visit notes.")
        Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
            Column(Modifier.padding(18.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.Security, contentDescription = null, tint = Teal)
                    Spacer(Modifier.width(10.dp))
                    Column {
                        Text("Private health information", color = Ink, fontWeight = FontWeight.SemiBold)
                        Text("Only share records with care providers you trust.", color = Muted, fontSize = 12.sp)
                    }
                }
            }
        }
        Spacer(Modifier.height(20.dp))
        Text("RECENT RECORDS", color = Muted, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        Spacer(Modifier.height(10.dp))
        RecordRow("Cardiology follow-up", "Consultation · Dr. Dlamini", "12 Jun 2025")
        RecordRow("Chest X-Ray", "Imaging · Rosebank Clinic", "03 Jun 2025")
        RecordRow("Blood panel — HbA1c", "Lab · Ampath", "28 May 2025")
        Spacer(Modifier.height(16.dp))
        DemoNotice()
        Spacer(Modifier.height(20.dp))
    }
}

@Composable
private fun ProfileScreen(name: String, onNameChange: (String) -> Unit) {
    var email by rememberSaveable { mutableStateOf("aisha.patel@example.com") }
    var phone by rememberSaveable { mutableStateOf("+27 82 555 0142") }
    var saved by rememberSaveable { mutableStateOf(false) }
    Column(Modifier.padding(horizontal = 20.dp)) {
        ScreenTitle("My profile", "Your personal details and preferences.")
        OutlinedTextField(value = name, onValueChange = { onNameChange(it); saved = false }, modifier = Modifier.fillMaxWidth(), label = { Text("Full name") }, singleLine = true)
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(value = email, onValueChange = { email = it; saved = false }, modifier = Modifier.fillMaxWidth(), label = { Text("Email address") }, singleLine = true)
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(value = phone, onValueChange = { phone = it; saved = false }, modifier = Modifier.fillMaxWidth(), label = { Text("Phone number") }, singleLine = true)
        Spacer(Modifier.height(16.dp))
        Button(onClick = { saved = true }, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
            Text(if (saved) "Details saved on this screen" else "Save details")
        }
        Spacer(Modifier.height(16.dp))
        DemoNotice()
        Spacer(Modifier.height(20.dp))
    }
}

@Composable
private fun ScreenTitle(title: String, subtitle: String) {
    Spacer(Modifier.height(22.dp))
    Text("MEDLINK  /  PATIENT", color = Teal, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.2.sp)
    Spacer(Modifier.height(7.dp))
    Text(title, fontSize = 27.sp, fontWeight = FontWeight.Bold, color = Ink)
    Spacer(Modifier.height(5.dp))
    Text(subtitle, color = Muted, fontSize = 13.sp)
    Spacer(Modifier.height(20.dp))
}

@Composable
private fun SectionHeading(title: String, action: String?, onAction: (() -> Unit)?) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
        Text(title, modifier = Modifier.weight(1f), fontSize = 17.sp, fontWeight = FontWeight.Bold, color = Ink)
        if (action != null && onAction != null) TextButton(onClick = onAction) { Text(action, color = Teal) }
    }
}

@Composable
private fun AppointmentCard(doctor: String, specialty: String, time: String, facility: String) {
    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Row(Modifier.fillMaxWidth().padding(15.dp), verticalAlignment = Alignment.CenterVertically) {
            Avatar(doctor.split(" ").filter { it.startsWith("Dr.").not() }.take(2).mapNotNull { it.firstOrNull() }.joinToString(""), Modifier.size(42.dp))
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(doctor, color = Ink, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                Text(specialty, color = Muted, fontSize = 12.sp)
                Spacer(Modifier.height(5.dp))
                Text("$time · $facility", color = Teal, fontSize = 11.sp, fontWeight = FontWeight.Medium)
            }
            Icon(Icons.Default.Schedule, contentDescription = "Appointment time", tint = Teal, modifier = Modifier.size(19.dp))
        }
    }
}

@Composable
private fun DoctorRow(name: String, specialty: String, initials: String, onMessage: () -> Unit) {
    Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Row(Modifier.fillMaxWidth().padding(13.dp), verticalAlignment = Alignment.CenterVertically) {
            Avatar(initials, Modifier.size(40.dp))
            Spacer(Modifier.width(11.dp))
            Column(Modifier.weight(1f)) {
                Text(name, fontWeight = FontWeight.SemiBold, fontSize = 13.sp, color = Ink)
                Text(specialty, fontSize = 11.sp, color = Muted)
            }
            OutlinedButton(onClick = onMessage, shape = RoundedCornerShape(10.dp)) {
                Icon(Icons.AutoMirrored.Filled.Chat, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(5.dp))
                Text("Message", fontSize = 12.sp)
            }
        }
    }
}

@Composable
private fun RecordRow(title: String, details: String, date: String) {
    Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White), modifier = Modifier.padding(bottom = 8.dp)) {
        Row(Modifier.fillMaxWidth().padding(15.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.AutoMirrored.Filled.ReceiptLong, contentDescription = null, tint = Teal)
            Spacer(Modifier.width(12.dp))
            Column(Modifier.weight(1f)) {
                Text(title, color = Ink, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                Text(details, color = Muted, fontSize = 11.sp)
            }
            Text(date, color = Muted, fontSize = 10.sp)
        }
    }
}

@Composable
private fun QuickAction(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Card(
        modifier = modifier.height(80.dp).clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
    ) {
        Row(Modifier.fillMaxSize().padding(horizontal = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(icon, contentDescription = null, tint = Teal, modifier = Modifier.size(22.dp))
            Spacer(Modifier.width(8.dp))
            Text(label, color = Ink, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
private fun SummaryMetric(value: String, label: String, modifier: Modifier = Modifier) {
    Column(modifier.clip(RoundedCornerShape(12.dp)).background(Color.White.copy(alpha = 0.12f)).padding(11.dp)) {
        Text(value, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
        Text(label, color = Color.White.copy(alpha = 0.8f), fontSize = 10.sp)
    }
}

@Composable
private fun Avatar(label: String, modifier: Modifier = Modifier) {
    Surface(modifier = modifier, shape = CircleShape, color = Mint) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
            Text(label, color = Teal, fontWeight = FontWeight.Bold, fontSize = 14.sp)
        }
    }
}

@Composable
private fun BrandMark() {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Surface(shape = RoundedCornerShape(12.dp), color = Teal, modifier = Modifier.size(42.dp)) {
            Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                Icon(Icons.Default.FavoriteBorder, contentDescription = null, tint = Color.White)
            }
        }
        Spacer(Modifier.width(10.dp))
        Text("medlink", color = Ink, fontSize = 23.sp, fontWeight = FontWeight.Bold)
        Text("  SA", color = Teal, fontSize = 13.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
private fun DemoNotice() {
    Card(shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF2E9))) {
        Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Tune, contentDescription = null, tint = Coral, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text("Demo only. No account, health data, or requests are saved or sent.", color = Color(0xFF76564B), fontSize = 11.sp)
        }
    }
}