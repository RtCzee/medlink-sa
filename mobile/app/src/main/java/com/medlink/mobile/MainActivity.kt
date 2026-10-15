package com.medlink.mobile

import android.content.Intent
import android.database.sqlite.SQLiteConstraintException
import android.database.sqlite.SQLiteException
import android.net.Uri
import android.os.Bundle
import android.util.Patterns
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
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
import androidx.compose.material.icons.filled.Call
import androidx.compose.material.icons.filled.Directions
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.LocalHospital
import androidx.compose.material.icons.filled.MedicalInformation
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.QrCode2
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
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import kotlinx.coroutines.launch
import java.security.GeneralSecurityException
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException
import java.util.Locale

private val Ink = Color(0xFF30336F)
private val Muted = Color(0xFF737796)
private val Canvas = Color(0xFFF7F8FC)
private val Teal = Color(0xFF20AFC0)
private val Mint = Color(0xFFE2F7F7)
private val Coral = Color(0xFF7452A3)
private val Line = Color(0xFFE4E6F0)
private val Indigo = Color(0xFF465D99)
private val EmergencyRed = Color(0xFFB73535)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { MedLinkApp() }
    }
}

@Composable
private fun MedLinkApp() {
    val context = LocalContext.current
    val authRepository = remember(context) {
        LocalAuthRepository(MedLinkDatabase.getInstance(context).localAccountDao())
    }
    val appointmentRepository = remember(context) {
        LocalAppointmentRepository(MedLinkDatabase.getInstance(context).localAppointmentDao())
    }
    var currentAccount by remember { mutableStateOf<LocalAccount?>(null) }
    var selectedTab by rememberSaveable { mutableIntStateOf(0) }
    var emergencyPage by rememberSaveable { mutableIntStateOf(0) }
    var message by remember { mutableStateOf<String?>(null) }

    MaterialTheme(
        colorScheme = MaterialTheme.colorScheme.copy(
            primary = Teal,
            secondary = Indigo,
            tertiary = Coral,
            primaryContainer = Mint,
            secondaryContainer = Color(0xFFE8EAF6),
            onPrimary = Color.White,
            onPrimaryContainer = Ink,
            onSecondaryContainer = Ink,
            background = Canvas,
            surface = Color.White,
            onSurface = Ink,
            onBackground = Ink,
        ),
    ) {
        Surface(modifier = Modifier.fillMaxSize(), color = Canvas) {
            if (currentAccount == null) {
                SignInScreen(authRepository, onSignedIn = { account ->
                    currentAccount = account
                })
            } else {
                val account = currentAccount!!
                val appointments by appointmentRepository
                    .observeForPatient(account.email)
                    .collectAsState(initial = emptyList())
                Scaffold(
                    containerColor = Canvas,
                    bottomBar = {
                        NavigationBar(containerColor = Color.White) {
                            val tabs = listOf("Home", "Queue", "Emergency", "Care", "Records", "Profile")
                            val icons = listOf(
                                Icons.Default.Home,
                                Icons.Default.Queue,
                                Icons.Default.QrCode2,
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
                            0 -> HomeScreen(
                                account.name,
                                appointments.firstOrNull { it.scheduledAtMillis >= System.currentTimeMillis() },
                                onNavigate = { selectedTab = it },
                            )
                            1 -> QueueScreen(onMessage = { message = it })
                            2 -> EmergencyScreen(account, emergencyPage) { emergencyPage = it }
                            3 -> CareScreen(
                                account.email,
                                appointments,
                                appointmentRepository,
                                onMessage = { message = it },
                            )
                            4 -> RecordsScreen()
                            else -> ProfileScreen(
                                account,
                                authRepository,
                                onAccountSaved = { currentAccount = it },
                                onSignOut = {
                                    currentAccount = null
                                    selectedTab = 0
                                },
                            )
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
private fun SignInScreen(
    authRepository: LocalAuthRepository,
    onSignedIn: (LocalAccount) -> Unit,
) {
    val coroutineScope = rememberCoroutineScope()
    var createAccount by rememberSaveable { mutableStateOf(false) }
    var name by rememberSaveable { mutableStateOf("") }
    var email by rememberSaveable { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var errorMessage by rememberSaveable { mutableStateOf<String?>(null) }
    var isLoading by rememberSaveable { mutableStateOf(false) }

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
                onValueChange = { name = it; errorMessage = null },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Full name") },
                singleLine = true,
            )
            Spacer(Modifier.height(12.dp))
        }
        OutlinedTextField(
            value = email,
            onValueChange = { email = it; errorMessage = null },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Email address") },
            singleLine = true,
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = password,
            onValueChange = { password = it; errorMessage = null },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Password") },
            visualTransformation = PasswordVisualTransformation(),
            singleLine = true,
        )
        if (createAccount) {
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = confirmPassword,
                onValueChange = { confirmPassword = it; errorMessage = null },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Confirm password") },
                visualTransformation = PasswordVisualTransformation(),
                singleLine = true,
            )
        }
        Spacer(Modifier.height(20.dp))
        Button(
            onClick = {
                val normalizedEmail = email.trim().lowercase(Locale.ROOT)
                errorMessage = when {
                    createAccount && name.isBlank() -> "Enter your full name."
                    !Patterns.EMAIL_ADDRESS.matcher(normalizedEmail).matches() -> "Enter a valid email address."
                    password.length !in 8..128 -> "Password must be between 8 and 128 characters."
                    createAccount && password != confirmPassword -> "Passwords do not match."
                    else -> null
                }
                if (errorMessage == null) {
                    isLoading = true
                    coroutineScope.launch {
                        try {
                            val result = if (createAccount) {
                                authRepository.register(name, normalizedEmail, password)
                            } else {
                                authRepository.signIn(normalizedEmail, password)
                            }
                            when (result) {
                                is LocalAuthResult.Success -> {
                                    password = ""
                                    confirmPassword = ""
                                    onSignedIn(result.account)
                                }
                                LocalAuthResult.InvalidCredentials ->
                                    errorMessage = "Email or password is incorrect."
                                LocalAuthResult.AccountAlreadyExists ->
                                    errorMessage = "An account with this email already exists. Sign in instead."
                            }
                        } catch (exception: SQLiteConstraintException) {
                            errorMessage = "An account with this email already exists. Sign in instead."
                        } catch (exception: SQLiteException) {
                            errorMessage = "The local account database could not be accessed. Please try again."
                        } catch (exception: GeneralSecurityException) {
                            errorMessage = "Secure password processing failed. Please try again."
                        } finally {
                            isLoading = false
                        }
                    }
                }
            },
            modifier = Modifier.fillMaxWidth().height(54.dp),
            shape = RoundedCornerShape(14.dp),
            enabled = !isLoading,
        ) {
            if (isLoading) {
                CircularProgressIndicator(modifier = Modifier.size(21.dp), color = Color.White, strokeWidth = 2.dp)
            } else {
                Text(if (createAccount) "Create account" else "Sign in", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                Spacer(Modifier.width(8.dp))
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null)
            }
        }
        errorMessage?.let {
            Text(it, color = EmergencyRed, fontSize = 12.sp)
            Spacer(Modifier.height(4.dp))
        }
        TextButton(
            onClick = {
                createAccount = !createAccount
                errorMessage = null
                password = ""
                confirmPassword = ""
            },
            modifier = Modifier.align(Alignment.CenterHorizontally),
            enabled = !isLoading,
        ) {
            Text(if (createAccount) "Already have an account? Sign in" else "New to MedLink? Create an account", color = Teal)
        }
        Spacer(Modifier.height(12.dp))
        LocalAuthNotice()
    }
}

@Composable
private fun HomeScreen(
    name: String,
    nextAppointment: LocalAppointment?,
    onNavigate: (Int) -> Unit,
) {
    Column(modifier = Modifier.padding(horizontal = 20.dp)) {
        Spacer(Modifier.height(20.dp))
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
            Image(
                painter = painterResource(R.drawable.medlink_logo),
                contentDescription = "MedLink logo",
                modifier = Modifier.size(width = 34.dp, height = 44.dp),
                contentScale = ContentScale.Fit,
            )
            Spacer(Modifier.width(8.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text("SOUTH AFRICA", color = Teal, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.2.sp)
                Spacer(Modifier.height(7.dp))
                Text("Hello, ${name.substringBefore(' ')}", fontSize = 25.sp, fontWeight = FontWeight.Bold, color = Ink)
            }
            Avatar("${name.firstOrNull() ?: 'A'}", Modifier.size(46.dp))
        }
        Spacer(Modifier.height(20.dp))
        Card(shape = RoundedCornerShape(20.dp), colors = CardDefaults.cardColors(containerColor = Indigo)) {
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
        SectionHeading("Next appointment", "See all") { onNavigate(3) }
        Spacer(Modifier.height(10.dp))
        if (nextAppointment == null) {
            Text("No upcoming appointments yet.", color = Muted, fontSize = 12.sp)
        } else {
            AppointmentCard(nextAppointment)
        }
        Spacer(Modifier.height(22.dp))
        SectionHeading("Quick access", null, null)
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            QuickAction("Join a queue", Icons.Default.Queue, Modifier.weight(1f)) { onNavigate(1) }
            QuickAction("Find a doctor", Icons.Default.LocalHospital, Modifier.weight(1f)) { onNavigate(3) }
        }
        Spacer(Modifier.height(10.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            QuickAction("Medical records", Icons.Default.MedicalInformation, Modifier.weight(1f)) { onNavigate(4) }
            QuickAction("My profile", Icons.Default.Person, Modifier.weight(1f)) { onNavigate(5) }
        }
        Spacer(Modifier.height(20.dp))
        DemoNotice()
        Spacer(Modifier.height(20.dp))
    }
}

@Composable
private fun EmergencyScreen(account: LocalAccount, page: Int, onPageChange: (Int) -> Unit) {
    val context = LocalContext.current
    var horizontalDrag by remember { mutableStateOf(0f) }
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .pointerInput(page) {
                detectHorizontalDragGestures(
                    onDragEnd = {
                        if (horizontalDrag < -70f) onPageChange(1)
                        if (horizontalDrag > 70f) onPageChange(0)
                        horizontalDrag = 0f
                    },
                    onHorizontalDrag = { _, dragAmount -> horizontalDrag += dragAmount },
                )
            }
            .padding(horizontal = 20.dp),
    ) {
        ScreenTitle("Emergency assistance", "Your critical details and help, ready when you need them.")
        if (page == 0) {
            EmergencyQrCard(account)
            Spacer(Modifier.height(14.dp))
            Text(
                "Show this code to a paramedic. Swipe left for ambulance and nearby hospitals.",
                color = Muted,
                fontSize = 12.sp,
            )
            Spacer(Modifier.height(14.dp))
            EmergencyPageIndicator(page, onPageChange)
            Spacer(Modifier.height(12.dp))
            DemoNotice()
        } else {
            AmbulanceCard()
            Spacer(Modifier.height(17.dp))
            SectionHeading("Nearby hospitals", "Open map") {
                openHospitalMap(context, "hospitals near Rosebank, Johannesburg")
            }
            Spacer(Modifier.height(9.dp))
            NearbyHospitalMap()
            Spacer(Modifier.height(10.dp))
            HospitalRow("Rosebank Clinic", "1.2 km · Clinic", "Rosebank Clinic")
            Spacer(Modifier.height(8.dp))
            HospitalRow("Charlotte Maxeke Hospital", "4.8 km · Emergency department", "Charlotte Maxeke Johannesburg Academic Hospital")
            Spacer(Modifier.height(8.dp))
            HospitalRow("Netcare Milpark Hospital", "6.2 km · 24-hour emergency", "Netcare Milpark Hospital")
            Spacer(Modifier.height(12.dp))
            Text(
                "Distances and map are a demo around Rosebank, not live GPS results.",
                color = Muted,
                fontSize = 11.sp,
            )
            Spacer(Modifier.height(12.dp))
            EmergencyPageIndicator(page, onPageChange)
        }
        Spacer(Modifier.height(18.dp))
    }
}

@Composable
private fun EmergencyQrCard(account: LocalAccount) {
    val qrContent = remember(account) {
        listOf(
            "MEDLINK SA EMERGENCY PROFILE",
            "Name: ${account.name}",
            "Email: ${account.email}",
            "Phone: ${account.phone.ifBlank { "Not provided" }}",
            "Blood type: ${account.bloodType.ifBlank { "Not provided" }}",
            "Allergies: ${account.allergies.ifBlank { "Not provided" }}",
            "Conditions: ${account.conditions.ifBlank { "Not provided" }}",
            "Emergency contact: ${account.emergencyContactName.ifBlank { "Not provided" }}",
            "Emergency contact phone: ${account.emergencyContactPhone.ifBlank { "Not provided" }}",
        ).joinToString("\n")
    }
    val qrData = remember(qrContent) {
        QRCodeWriter().encode(
            qrContent,
            BarcodeFormat.QR_CODE,
            256,
            256,
        )
    }
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(18.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.QrCode2, contentDescription = null, tint = Teal)
                Spacer(Modifier.width(8.dp))
                Text("EMERGENCY MEDICAL ID", color = Teal, fontSize = 11.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            }
            Spacer(Modifier.height(14.dp))
            Canvas(Modifier.size(224.dp).background(Color.White)) {
                val cellSize = size.width / qrData.width
                for (x in 0 until qrData.width) {
                    for (y in 0 until qrData.height) {
                        if (qrData.get(x, y)) {
                            drawRect(
                                color = Color.Black,
                                topLeft = Offset(x * cellSize, y * cellSize),
                                size = androidx.compose.ui.geometry.Size(cellSize, cellSize),
                            )
                        }
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
            Text(account.name, color = Ink, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))
            Text("Name and email included · add details in Profile settings", color = Muted, fontSize = 11.sp)
            Spacer(Modifier.height(12.dp))
            Row(
                modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(Mint).padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(Icons.Default.Security, contentDescription = null, tint = Teal, modifier = Modifier.size(19.dp))
                Spacer(Modifier.width(9.dp))
                Text("Anyone who scans this QR can read the medical details you add.", color = Ink, fontSize = 11.sp)
            }
        }
    }
}

@Composable
private fun EmergencyPageIndicator(page: Int, onPageChange: (Int) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        listOf("QR medical ID", "Ambulance & hospitals").forEachIndexed { index, label ->
            Text(
                text = if (page == index) "● $label" else "○ $label",
                modifier = Modifier
                    .clip(RoundedCornerShape(20.dp))
                    .clickable { onPageChange(index) }
                    .padding(horizontal = 10.dp, vertical = 7.dp),
                color = if (page == index) Teal else Muted,
                fontSize = 11.sp,
                fontWeight = if (page == index) FontWeight.Bold else FontWeight.Normal,
            )
        }
    }
}

@Composable
private fun AmbulanceCard() {
    val context = LocalContext.current
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF0EE)),
    ) {
        Column(Modifier.fillMaxWidth().padding(17.dp)) {
            Text("NEED URGENT HELP?", color = EmergencyRed, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
            Spacer(Modifier.height(5.dp))
            Text("Call an ambulance", color = Ink, fontSize = 20.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(4.dp))
            Text("South African ambulance service · 10177", color = Muted, fontSize = 12.sp)
            Spacer(Modifier.height(13.dp))
            Button(
                onClick = {
                    context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:10177")))
                },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(13.dp),
                colors = ButtonDefaults.buttonColors(containerColor = EmergencyRed),
            ) {
                Icon(Icons.Default.Call, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text("Call 10177", fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(7.dp))
            Text("Opens your phone dialer; confirm the call there.", color = Muted, fontSize = 10.sp)
        }
    }
}

@Composable
private fun NearbyHospitalMap() {
    BoxWithConstraints(
        modifier = Modifier.fillMaxWidth().height(170.dp).clip(RoundedCornerShape(16.dp)),
    ) {
        Canvas(Modifier.fillMaxSize().background(Color(0xFFE6F0E8))) {
            drawLine(Color.White, Offset(0f, size.height * 0.30f), Offset(size.width, size.height * 0.47f), 18f)
            drawLine(Color.White, Offset(0f, size.height * 0.78f), Offset(size.width, size.height * 0.63f), 14f)
            drawLine(Color.White, Offset(size.width * 0.28f, 0f), Offset(size.width * 0.52f, size.height), 13f)
            drawLine(Color.White, Offset(size.width * 0.77f, 0f), Offset(size.width * 0.62f, size.height), 11f)
            drawLine(Color(0xFFD0E0D5), Offset(0f, size.height * 0.30f), Offset(size.width, size.height * 0.47f), 1f)
            drawLine(Color(0xFFD0E0D5), Offset(0f, size.height * 0.78f), Offset(size.width, size.height * 0.63f), 1f)
        }
        Text(
            "ROSEBANK, JOHANNESBURG",
            modifier = Modifier.align(Alignment.TopStart).padding(11.dp),
            color = Teal,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.8.sp,
        )
        MapPin("Rosebank Clinic", modifier = Modifier.align(Alignment.TopStart).padding(start = maxWidth * 0.58f, top = 47.dp))
        MapPin("Charlotte Maxeke", modifier = Modifier.align(Alignment.TopStart).padding(start = maxWidth * 0.20f, top = 105.dp))
        MapPin("Milpark", modifier = Modifier.align(Alignment.TopStart).padding(start = maxWidth * 0.69f, top = 118.dp))
        Row(
            modifier = Modifier.align(Alignment.BottomStart).padding(9.dp).clip(RoundedCornerShape(10.dp))
                .background(Color.White.copy(alpha = 0.92f)).padding(horizontal = 8.dp, vertical = 5.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Default.MyLocation, contentDescription = null, tint = Teal, modifier = Modifier.size(13.dp))
            Spacer(Modifier.width(4.dp))
            Text("Demo map", color = Ink, fontSize = 9.sp, fontWeight = FontWeight.Medium)
        }
    }
}

@Composable
private fun MapPin(label: String, modifier: Modifier = Modifier) {
    Column(modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Surface(shape = CircleShape, color = Teal, modifier = Modifier.size(22.dp)) {
            Box(contentAlignment = Alignment.Center) {
                Icon(Icons.Default.LocalHospital, contentDescription = null, tint = Color.White, modifier = Modifier.size(13.dp))
            }
        }
        Text(
            label,
            modifier = Modifier.clip(RoundedCornerShape(4.dp)).background(Color.White.copy(alpha = 0.94f)).padding(horizontal = 4.dp, vertical = 2.dp),
            color = Ink,
            fontSize = 8.sp,
            fontWeight = FontWeight.SemiBold,
        )
    }
}

@Composable
private fun HospitalRow(name: String, details: String, mapQuery: String) {
    val context = LocalContext.current
    Card(shape = RoundedCornerShape(14.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 13.dp, vertical = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(Icons.Default.LocalHospital, contentDescription = null, tint = Teal, modifier = Modifier.size(21.dp))
            Spacer(Modifier.width(10.dp))
            Column(Modifier.weight(1f)) {
                Text(name, color = Ink, fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                Text(details, color = Muted, fontSize = 10.sp)
            }
            TextButton(
                onClick = { openHospitalMap(context, mapQuery) },
            ) {
                Icon(Icons.Default.Directions, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(4.dp))
                Text("Go", fontSize = 11.sp)
            }
        }
    }
}

private fun openHospitalMap(context: android.content.Context, query: String) {
    val mapUri = Uri.parse("https://www.google.com/maps/search/?api=1&query=${Uri.encode(query)}")
    context.startActivity(Intent(Intent.ACTION_VIEW, mapUri))
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
private fun CareScreen(
    patientEmail: String,
    appointments: List<LocalAppointment>,
    repository: LocalAppointmentRepository,
    onMessage: (String) -> Unit,
) {
    val coroutineScope = rememberCoroutineScope()
    var doctorName by rememberSaveable { mutableStateOf("") }
    var specialty by rememberSaveable { mutableStateOf("") }
    var facility by rememberSaveable { mutableStateOf("") }
    var appointmentDate by rememberSaveable { mutableStateOf("") }
    var appointmentTime by rememberSaveable { mutableStateOf("") }
    var reason by rememberSaveable { mutableStateOf("") }
    var isSaving by rememberSaveable { mutableStateOf(false) }
    var statusMessage by rememberSaveable { mutableStateOf<String?>(null) }
    val now = System.currentTimeMillis()
    val upcomingAppointments = appointments.filter { it.scheduledAtMillis >= now }
    val pastAppointments = appointments.filter { it.scheduledAtMillis < now }.asReversed()

    Column(Modifier.padding(horizontal = 20.dp)) {
        ScreenTitle("Appointments", "Request a visit and keep track of your care.")
        Card(shape = RoundedCornerShape(18.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
            Column(Modifier.fillMaxWidth().padding(16.dp)) {
                Text("REQUEST AN APPOINTMENT", color = Teal, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                Spacer(Modifier.height(12.dp))
                OutlinedTextField(
                    value = doctorName,
                    onValueChange = { doctorName = it; statusMessage = null },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Doctor or provider") },
                    singleLine = true,
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = specialty,
                    onValueChange = { specialty = it; statusMessage = null },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Specialty") },
                    singleLine = true,
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = facility,
                    onValueChange = { facility = it; statusMessage = null },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Clinic or facility") },
                    singleLine = true,
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = appointmentDate,
                    onValueChange = { appointmentDate = it; statusMessage = null },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Date (YYYY-MM-DD)") },
                    supportingText = { Text("Use the YYYY-MM-DD format and choose a future date.") },
                    singleLine = true,
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = appointmentTime,
                    onValueChange = { appointmentTime = it; statusMessage = null },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Time (24-hour, HH:MM)") },
                    singleLine = true,
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it; statusMessage = null },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Reason for visit (optional)") },
                    minLines = 2,
                )
                Spacer(Modifier.height(14.dp))
                Button(
                    onClick = {
                        statusMessage = when {
                            doctorName.isBlank() -> "Enter the doctor or provider."
                            specialty.isBlank() -> "Enter the appointment specialty."
                            facility.isBlank() -> "Enter the clinic or facility."
                            doctorName.length > 100 || specialty.length > 100 || facility.length > 150 ->
                                "Provider, specialty, and facility must be 100, 100, and 150 characters or fewer."
                            reason.length > 500 -> "The visit reason must be 500 characters or fewer."
                            else -> null
                        }
                        if (statusMessage == null) {
                            val scheduledAt = try {
                                val date = LocalDate.parse(appointmentDate.trim())
                                if (date.year !in 1..9999) {
                                    throw DateTimeParseException("Year is out of range", appointmentDate, 0)
                                }
                                val time = LocalTime.parse(appointmentTime.trim())
                                date.atTime(time).atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
                            } catch (_: DateTimeParseException) {
                                statusMessage = "Enter a valid date (YYYY-MM-DD) and time (HH:MM)."
                                null
                            }
                            if (scheduledAt != null && scheduledAt < System.currentTimeMillis()) {
                                statusMessage = "Choose a future date and time."
                            } else if (scheduledAt != null) {
                                isSaving = true
                                statusMessage = null
                                coroutineScope.launch {
                                    try {
                                        repository.request(
                                            patientEmail = patientEmail,
                                            doctorName = doctorName,
                                            specialty = specialty,
                                            facility = facility,
                                            scheduledAtMillis = scheduledAt,
                                            reason = reason,
                                        )
                                        doctorName = ""
                                        specialty = ""
                                        facility = ""
                                        appointmentDate = ""
                                        appointmentTime = ""
                                        reason = ""
                                        statusMessage = "Appointment request saved on this device."
                                    } catch (exception: SQLiteException) {
                                        statusMessage = "Could not save the appointment locally. Please try again."
                                    } finally {
                                        isSaving = false
                                    }
                                }
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    enabled = !isSaving,
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
                    } else {
                        Icon(Icons.Default.CalendarMonth, contentDescription = null)
                        Spacer(Modifier.width(8.dp))
                        Text("Save appointment request")
                    }
                }
                statusMessage?.let {
                    Spacer(Modifier.height(8.dp))
                    Text(
                        it,
                        color = if (it.startsWith("Appointment request saved")) Teal else EmergencyRed,
                        fontSize = 12.sp,
                    )
                }
            }
        }
        Spacer(Modifier.height(22.dp))
        Text("UPCOMING APPOINTMENTS", color = Muted, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        Spacer(Modifier.height(10.dp))
        if (upcomingAppointments.isEmpty()) {
            Text("No upcoming appointments. Submit a request above to add one.", color = Muted, fontSize = 12.sp)
        } else {
            upcomingAppointments.forEach { appointment ->
                AppointmentCard(appointment, onCancel = {
                    coroutineScope.launch {
                        try {
                            repository.cancel(appointment)
                        } catch (exception: SQLiteException) {
                            statusMessage = "Could not remove the appointment. Please try again."
                        }
                    }
                })
                Spacer(Modifier.height(9.dp))
            }
        }
        Spacer(Modifier.height(14.dp))
        Text("PAST APPOINTMENTS", color = Muted, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        Spacer(Modifier.height(10.dp))
        if (pastAppointments.isEmpty()) {
            Text("Past appointments will appear here.", color = Muted, fontSize = 12.sp)
        } else {
            pastAppointments.forEach { appointment ->
                AppointmentCard(appointment)
                Spacer(Modifier.height(9.dp))
            }
        }
        Spacer(Modifier.height(14.dp))
        Text("YOUR DOCTORS", color = Muted, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        Spacer(Modifier.height(10.dp))
        DoctorRow("Dr. Sipho Dlamini", "Cardiology", "SD") {
            onMessage("Secure messaging with Dr. Dlamini will be available once a provider connection is configured.")
        }
        Spacer(Modifier.height(8.dp))
        DoctorRow("Dr. Thandiwe Mokoena", "General Practice", "TM") {
            onMessage("Secure messaging with Dr. Mokoena will be available once a provider connection is configured.")
        }
        Spacer(Modifier.height(16.dp))
        Text(
            "Appointments are saved locally as personal reminders; they are not sent to the provider or clinic.",
            color = Muted,
            fontSize = 11.sp,
        )
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
private fun ProfileScreen(
    account: LocalAccount,
    authRepository: LocalAuthRepository,
    onAccountSaved: (LocalAccount) -> Unit,
    onSignOut: () -> Unit,
) {
    val coroutineScope = rememberCoroutineScope()
    var name by rememberSaveable(account.email, account.name) { mutableStateOf(account.name) }
    var phone by rememberSaveable(account.email, account.phone) { mutableStateOf(account.phone) }
    var bloodType by rememberSaveable(account.email, account.bloodType) { mutableStateOf(account.bloodType) }
    var allergies by rememberSaveable(account.email, account.allergies) { mutableStateOf(account.allergies) }
    var conditions by rememberSaveable(account.email, account.conditions) { mutableStateOf(account.conditions) }
    var emergencyContactName by rememberSaveable(account.email, account.emergencyContactName) { mutableStateOf(account.emergencyContactName) }
    var emergencyContactPhone by rememberSaveable(account.email, account.emergencyContactPhone) { mutableStateOf(account.emergencyContactPhone) }
    var isSaving by rememberSaveable { mutableStateOf(false) }
    var statusMessage by rememberSaveable { mutableStateOf<String?>(null) }
    Column(Modifier.padding(horizontal = 20.dp)) {
        ScreenTitle("Profile settings", "Manage your account and emergency medical details.")
        OutlinedTextField(
            value = name,
            onValueChange = { if (it.length <= 100) name = it; statusMessage = null },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Full name") },
            singleLine = true,
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = account.email,
            onValueChange = {},
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Account email") },
            singleLine = true,
            readOnly = true,
        )
        Spacer(Modifier.height(12.dp))
        Text("EMERGENCY MEDICAL DETAILS", color = Teal, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
        Spacer(Modifier.height(8.dp))
        Text("These optional details are stored on this device and included in your emergency QR.", color = Muted, fontSize = 12.sp)
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = phone,
            onValueChange = { if (it.length <= 32) phone = it; statusMessage = null },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Your phone number") },
            singleLine = true,
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = bloodType,
            onValueChange = { if (it.length <= 20) bloodType = it; statusMessage = null },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Blood type (optional)") },
            singleLine = true,
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = allergies,
            onValueChange = { if (it.length <= 250) allergies = it; statusMessage = null },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Allergies (optional)") },
            minLines = 2,
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = conditions,
            onValueChange = { if (it.length <= 250) conditions = it; statusMessage = null },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Medical conditions (optional)") },
            minLines = 2,
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = emergencyContactName,
            onValueChange = { if (it.length <= 100) emergencyContactName = it; statusMessage = null },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Emergency contact name (optional)") },
            singleLine = true,
        )
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(
            value = emergencyContactPhone,
            onValueChange = { if (it.length <= 32) emergencyContactPhone = it; statusMessage = null },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Emergency contact phone (optional)") },
            singleLine = true,
        )
        Spacer(Modifier.height(16.dp))
        Button(
            onClick = {
                if (name.isBlank()) {
                    statusMessage = "Enter your full name."
                } else {
                    val updatedAccount = account.copy(
                        name = name.trim(),
                        phone = phone.trim(),
                        bloodType = bloodType.trim(),
                        allergies = allergies.trim(),
                        conditions = conditions.trim(),
                        emergencyContactName = emergencyContactName.trim(),
                        emergencyContactPhone = emergencyContactPhone.trim(),
                    )
                    isSaving = true
                    statusMessage = null
                    coroutineScope.launch {
                        try {
                            authRepository.saveProfile(updatedAccount)
                            onAccountSaved(updatedAccount)
                            statusMessage = "Profile saved. Your emergency QR has been updated."
                        } catch (exception: SQLiteException) {
                            statusMessage = "Your profile could not be saved on this device. Please try again."
                        } finally {
                            isSaving = false
                        }
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            enabled = !isSaving,
        ) {
            if (isSaving) {
                CircularProgressIndicator(modifier = Modifier.size(20.dp), color = Color.White, strokeWidth = 2.dp)
            } else {
                Text("Save profile and QR details")
            }
        }
        statusMessage?.let {
            Spacer(Modifier.height(8.dp))
            Text(it, color = if (it.startsWith("Profile saved")) Teal else EmergencyRed, fontSize = 12.sp)
        }
        Spacer(Modifier.height(16.dp))
        OutlinedButton(onClick = onSignOut, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp)) {
            Text("Sign out")
        }
        Spacer(Modifier.height(16.dp))
        DemoNotice()
        Spacer(Modifier.height(20.dp))
    }
}

@Composable
private fun ScreenTitle(title: String, subtitle: String) {
    Spacer(Modifier.height(22.dp))
    Row(verticalAlignment = Alignment.CenterVertically) {
        Image(
            painter = painterResource(R.drawable.medlink_logo),
            contentDescription = "MedLink logo",
            modifier = Modifier.size(width = 18.dp, height = 24.dp),
            contentScale = ContentScale.Fit,
        )
        Spacer(Modifier.width(6.dp))
        Text("MEDLINK  /  PATIENT", color = Teal, fontSize = 10.sp, fontWeight = FontWeight.Bold, letterSpacing = 1.2.sp)
    }
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
private fun AppointmentCard(appointment: LocalAppointment, onCancel: (() -> Unit)? = null) {
    val appointmentTime = remember(appointment.scheduledAtMillis) {
        DateTimeFormatter.ofPattern("EEE, d MMM yyyy · HH:mm", Locale.getDefault())
            .format(Instant.ofEpochMilli(appointment.scheduledAtMillis).atZone(ZoneId.systemDefault()))
    }
    Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
        Column(Modifier.fillMaxWidth().padding(15.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Avatar(
                    appointment.doctorName.split(" ").filter { it.startsWith("Dr.").not() }
                        .take(2).mapNotNull { it.firstOrNull() }.joinToString(""),
                    Modifier.size(42.dp),
                )
                Spacer(Modifier.width(12.dp))
                Column(Modifier.weight(1f)) {
                    Text(appointment.doctorName, color = Ink, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Text(appointment.specialty, color = Muted, fontSize = 12.sp)
                    Spacer(Modifier.height(5.dp))
                    Text("$appointmentTime · ${appointment.facility}", color = Teal, fontSize = 11.sp, fontWeight = FontWeight.Medium)
                    Text("Saved locally · ${appointment.status}", color = Muted, fontSize = 10.sp)
                }
                Icon(Icons.Default.Schedule, contentDescription = "Appointment time", tint = Teal, modifier = Modifier.size(19.dp))
            }
            if (appointment.reason.isNotBlank()) {
                Spacer(Modifier.height(9.dp))
                Text("Reason: ${appointment.reason}", color = Muted, fontSize = 11.sp)
            }
            if (onCancel != null) {
                Spacer(Modifier.height(4.dp))
                TextButton(onClick = onCancel, modifier = Modifier.align(Alignment.End)) {
                    Text("Remove request", color = EmergencyRed, fontSize = 11.sp)
                }
            }
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
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Image(
            painter = painterResource(R.drawable.medlink_logo),
            contentDescription = "MedLink — Help us help you",
            modifier = Modifier.size(width = 140.dp, height = 182.dp),
            contentScale = ContentScale.Fit,
        )
    }
}

@Composable
private fun DemoNotice() {
    Card(shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF2E9))) {
        Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Tune, contentDescription = null, tint = Coral, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text("Queue tickets, medical records and doctor messages are demo-only; they are not saved or sent.", color = Color(0xFF76564B), fontSize = 11.sp)
        }
    }
}

@Composable
private fun LocalAuthNotice() {
    Card(shape = RoundedCornerShape(12.dp), colors = CardDefaults.cardColors(containerColor = Mint)) {
        Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Icon(Icons.Default.Security, contentDescription = null, tint = Teal, modifier = Modifier.size(18.dp))
            Spacer(Modifier.width(8.dp))
            Text(
                "Accounts are stored on this device only. Passwords are salted and hashed; there is no online account recovery.",
                color = Ink,
                fontSize = 11.sp,
            )
        }
    }
}