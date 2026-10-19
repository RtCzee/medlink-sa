import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
    id("org.jetbrains.kotlin.kapt")
}

// Server addresses for the online features, from -P gradle properties, ~/.gradle/gradle.properties
// or mobile/local.properties (git-ignored). Missing values build an app with online services off.
// Only the Supabase *publishable* key belongs here; never the secret/service-role key.
val localProps = Properties().apply {
    val file = rootProject.file("local.properties")
    if (file.exists()) file.inputStream().use { load(it) }
}
fun medlinkProp(name: String): String =
    (providers.gradleProperty(name).orNull ?: localProps.getProperty(name) ?: "").trim()
fun quoted(value: String): String = "\"" + value.replace("\\", "\\\\").replace("\"", "\\\"") + "\""

android {
    namespace = "com.medlink.mobile"
    compileSdk = 35

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    defaultConfig {
        applicationId = "com.medlink.mobile"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "0.1.0"

        // e.g. https://medlink.example.com or http://10.0.2.2:3000 (emulator → PC dev server).
        buildConfigField("String", "MEDLINK_API_BASE_URL", quoted(medlinkProp("medlink.apiBaseUrl")))
        buildConfigField("String", "SUPABASE_URL", quoted(medlinkProp("medlink.supabaseUrl")))
        buildConfigField("String", "SUPABASE_PUBLISHABLE_KEY", quoted(medlinkProp("medlink.supabasePublishableKey")))
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

dependencies {
    val composeBom = platform("androidx.compose:compose-bom:2025.04.01")
    implementation(composeBom)
    androidTestImplementation(composeBom)

    implementation("androidx.activity:activity-compose:1.10.1")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    implementation("androidx.room:room-runtime:2.7.2")
    implementation("androidx.room:room-ktx:2.7.2")
    kapt("androidx.room:room-compiler:2.7.2")
    implementation("com.google.zxing:core:3.5.3")

    debugImplementation("androidx.compose.ui:ui-tooling")

    // JVM unit tests: JUnit, plus the real org.json (android.jar only has stubs off-device).
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.json:json:20240303")
}