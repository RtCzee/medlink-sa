package com.medlink.mobile.api

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import org.json.JSONException
import org.json.JSONObject
import java.io.IOException
import java.net.SocketTimeoutException

/** A Supabase Auth session. The access token is the JWT the MedLink API accepts as Bearer. */
data class Session(
    val accessToken: String,
    val refreshToken: String,
    /** Epoch seconds. */
    val expiresAt: Long,
    val userId: String,
    val email: String?,
)

/** Where the session lives between launches. */
interface SessionStorage {
    fun load(): Session?
    fun save(session: Session)
    fun clear()
}

/** App-private SharedPreferences (not exported, excluded from backup by allowBackup=false). */
class PrefsSessionStorage(context: Context) : SessionStorage {
    private val prefs = context.applicationContext.getSharedPreferences("medlink_session", Context.MODE_PRIVATE)

    override fun load(): Session? {
        val access = prefs.getString("access", null) ?: return null
        val refresh = prefs.getString("refresh", null) ?: return null
        val user = prefs.getString("user", null) ?: return null
        return Session(access, refresh, prefs.getLong("expiresAt", 0), user, prefs.getString("email", null))
    }

    override fun save(session: Session) {
        prefs.edit()
            .putString("access", session.accessToken)
            .putString("refresh", session.refreshToken)
            .putLong("expiresAt", session.expiresAt)
            .putString("user", session.userId)
            .putString("email", session.email)
            .apply()
    }

    override fun clear() {
        prefs.edit().clear().apply()
    }
}

/**
 * Minimal Supabase Auth (GoTrue) client over the same transport: email/password sign-in,
 * token refresh and sign-out. Uses only the publishable (anon) key, which is meant to ship
 * in clients; the secret key never goes near the app. Accounts are created on the website
 * (sign-up needs email confirmation), then used here.
 */
class SupabaseAuth(
    supabaseUrl: String,
    private val publishableKey: String,
    private val storage: SessionStorage,
    private val transport: HttpTransport = UrlConnectionTransport(),
    private val nowSeconds: () -> Long = { System.currentTimeMillis() / 1000 },
) : TokenProvider {
    private val base = supabaseUrl.trim().trimEnd('/')
    private val mutex = Mutex()
    private var session: Session? = storage.load()

    val isConfigured: Boolean get() = base.isNotEmpty() && publishableKey.isNotBlank()
    val currentSession: Session? get() = session

    /** Sign in with email and password. Throws ApiException with a user-facing message. */
    suspend fun signIn(email: String, password: String): Session = mutex.withLock {
        val body = JSONObject().put("email", email).put("password", password)
        val result = token("password", body)
        session = result
        storage.save(result)
        result
    }

    /** Best-effort server sign-out, then always forget the local session. */
    suspend fun signOut() = mutex.withLock {
        val current = session
        session = null
        storage.clear()
        if (current != null && isConfigured) {
            try {
                call("POST", "/auth/v1/logout", JSONObject(), current.accessToken)
            } catch (e: ApiException) {
                // The local session is gone either way; the token simply expires.
            }
        }
    }

    /** A valid access token, refreshed when it is within 60 s of expiry; null if signed out. */
    override suspend fun accessToken(): String? = mutex.withLock {
        val current = session ?: return@withLock null
        if (current.expiresAt - nowSeconds() > 60) return@withLock current.accessToken
        try {
            val refreshed = token("refresh_token", JSONObject().put("refresh_token", current.refreshToken))
            session = refreshed
            storage.save(refreshed)
            refreshed.accessToken
        } catch (e: ApiException.Server) {
            // Refresh token revoked or expired: the user must sign in again.
            session = null
            storage.clear()
            null
        }
    }

    /** The API rejected our token (revoked/expired): drop the session so the UI asks to sign in. */
    override suspend fun onUnauthorized() = mutex.withLock {
        session = null
        storage.clear()
    }

    private suspend fun token(grant: String, body: JSONObject): Session {
        val json = call("POST", "/auth/v1/token?grant_type=$grant", body, null)
        return try {
            val user = json.getJSONObject("user")
            val expiresAt = if (json.has("expires_at")) json.getLong("expires_at") else nowSeconds() + json.optLong("expires_in", 3600)
            Session(json.getString("access_token"), json.getString("refresh_token"), expiresAt, user.getString("id"), user.stringOrNull("email"))
        } catch (e: JSONException) {
            throw ApiException.Malformed()
        }
    }

    private suspend fun call(method: String, path: String, body: JSONObject, bearer: String?): JSONObject {
        if (!isConfigured) throw ApiException.NotConfigured()
        val headers = linkedMapOf("apikey" to publishableKey, "Content-Type" to "application/json", "Accept" to "application/json")
        if (bearer != null) headers["Authorization"] = "Bearer $bearer"
        val response = withContext(Dispatchers.IO) {
            try {
                transport.execute(method, base + path, headers, body.toString())
            } catch (e: SocketTimeoutException) {
                throw ApiException.Timeout()
            } catch (e: IOException) {
                throw ApiException.Network()
            }
        }
        val json = try {
            if (response.body.isBlank()) JSONObject() else JSONObject(response.body)
        } catch (e: JSONException) {
            if (response.status in 200..299) throw ApiException.Malformed() else JSONObject()
        }
        if (response.status in 200..299) return json
        // GoTrue errors: {"error":"invalid_grant","error_description":"..."} or {"code":400,"msg":"..."}
        val code = json.optString("error_code").ifEmpty { json.optString("error") }.ifEmpty { "AUTH_${response.status}" }
        val message = when {
            code == "invalid_credentials" || code == "invalid_grant" -> "Email or password is incorrect."
            code == "email_not_confirmed" -> "Confirm your email address first (check your inbox), then sign in."
            response.status == 429 -> "Too many attempts. Wait a minute and try again."
            else -> "Sign-in failed (${response.status}). Please try again."
        }
        throw ApiException.Server(response.status, code, message, null)
    }
}
