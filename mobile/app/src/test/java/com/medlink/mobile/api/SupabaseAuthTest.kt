package com.medlink.mobile.api

import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Test

class SupabaseAuthTest {
    private class MemoryStorage(var session: Session? = null) : SessionStorage {
        override fun load() = session
        override fun save(session: Session) { this.session = session }
        override fun clear() { session = null }
    }

    private class FakeTransport(val responses: MutableList<HttpResponse>) : HttpTransport {
        val calls = mutableListOf<Triple<String, Map<String, String>, String?>>()
        override fun execute(method: String, url: String, headers: Map<String, String>, body: String?): HttpResponse {
            calls += Triple(url, headers, body)
            return responses.removeAt(0)
        }
    }

    private val tokenJson = """{"access_token":"new.access.jwt","refresh_token":"r2","expires_in":3600,"expires_at":5000,
        "user":{"id":"u1","email":"thandi@example.com"}}"""

    @Test
    fun signInUsesPasswordGrantWithPublishableKeyAndStoresSession() = runBlocking {
        val storage = MemoryStorage()
        val transport = FakeTransport(mutableListOf(HttpResponse(200, tokenJson)))
        val auth = SupabaseAuth("https://x.supabase.co/", "test-publishable-key", storage, transport) { 1000 }
        val session = auth.signIn("thandi@example.com", "pw")
        assertEquals("https://x.supabase.co/auth/v1/token?grant_type=password", transport.calls[0].first)
        assertEquals("test-publishable-key", transport.calls[0].second["apikey"])
        assertNull(transport.calls[0].second["Authorization"])
        assertEquals("u1", session.userId)
        assertEquals(session, storage.session)
        assertEquals("new.access.jwt", auth.accessToken())
    }

    @Test
    fun wrongPasswordGivesAFriendlyMessage() = runBlocking {
        val transport = FakeTransport(mutableListOf(HttpResponse(400, """{"code":400,"error_code":"invalid_credentials","msg":"Invalid login credentials"}""")))
        val auth = SupabaseAuth("https://x.supabase.co", "k", MemoryStorage(), transport)
        try { auth.signIn("a@b.co", "bad"); fail() } catch (e: ApiException.Server) {
            assertEquals("Email or password is incorrect.", e.message)
        }
    }

    @Test
    fun nearlyExpiredTokenIsRefreshed() = runBlocking {
        val storage = MemoryStorage(Session("old.access.jwt", "r1", expiresAt = 1030, userId = "u1", email = null))
        val transport = FakeTransport(mutableListOf(HttpResponse(200, tokenJson)))
        val auth = SupabaseAuth("https://x.supabase.co", "k", storage, transport) { 1000 }
        assertEquals("new.access.jwt", auth.accessToken())
        assertTrue(transport.calls[0].first.endsWith("grant_type=refresh_token"))
        assertTrue(transport.calls[0].third!!.contains("\"refresh_token\":\"r1\""))
        assertEquals("r2", storage.session?.refreshToken)
    }

    @Test
    fun revokedRefreshTokenSignsOut() = runBlocking {
        val storage = MemoryStorage(Session("old", "r1", expiresAt = 0, userId = "u1", email = null))
        val transport = FakeTransport(mutableListOf(HttpResponse(400, """{"error":"invalid_grant"}""")))
        val auth = SupabaseAuth("https://x.supabase.co", "k", storage, transport) { 1000 }
        assertNull(auth.accessToken())
        assertNull(storage.session)
        assertNull(auth.currentSession)
    }

    @Test
    fun validTokenIsReusedWithoutNetwork() = runBlocking {
        val storage = MemoryStorage(Session("cur.access.jwt", "r1", expiresAt = 9999, userId = "u1", email = null))
        val transport = FakeTransport(mutableListOf())
        val auth = SupabaseAuth("https://x.supabase.co", "k", storage, transport) { 1000 }
        assertEquals("cur.access.jwt", auth.accessToken())
        assertTrue(transport.calls.isEmpty())
    }

    @Test
    fun signOutForgetsSessionEvenIfServerFails() = runBlocking {
        val storage = MemoryStorage(Session("cur", "r1", 9999, "u1", null))
        val transport = FakeTransport(mutableListOf(HttpResponse(500, "")))
        val auth = SupabaseAuth("https://x.supabase.co", "k", storage, transport)
        auth.signOut()
        assertNull(storage.session)
        assertEquals("Bearer cur", transport.calls[0].second["Authorization"])
    }
}
