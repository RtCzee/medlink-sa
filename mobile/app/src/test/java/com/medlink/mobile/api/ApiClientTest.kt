package com.medlink.mobile.api

import kotlinx.coroutines.runBlocking
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assert.fail
import org.junit.Before
import org.junit.Test
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.InetAddress
import java.net.ServerSocket
import java.net.SocketException
import kotlin.concurrent.thread

/**
 * Exercises the real HttpURLConnection transport against a tiny local HTTP/1.1 server
 * (plain ServerSocket: unit tests compile against android.jar, which has no JDK HttpServer).
 */
class ApiClientTest {
    private lateinit var server: ServerSocket
    private var status = 200
    private var responseBody = ""
    private var delayMs = 0L
    private var seenAuth: String? = null
    private var seenMethod: String? = null
    private var seenPath: String? = null
    private var seenBody: String? = null

    private class FixedTokens(var token: String?) : TokenProvider {
        var unauthorizedCalls = 0
        override suspend fun accessToken() = token
        override suspend fun onUnauthorized() { unauthorizedCalls++; token = null }
    }

    @Before
    fun start() {
        server = ServerSocket(0, 50, InetAddress.getLoopbackAddress())
        thread(isDaemon = true) {
            while (!server.isClosed) {
                val socket = try { server.accept() } catch (e: SocketException) { break }
                socket.use { s ->
                    val reader = BufferedReader(InputStreamReader(s.getInputStream(), Charsets.UTF_8))
                    val requestLine = reader.readLine() ?: return@use
                    val headers = mutableMapOf<String, String>()
                    while (true) {
                        val line = reader.readLine() ?: break
                        if (line.isEmpty()) break
                        val i = line.indexOf(':')
                        if (i > 0) headers[line.substring(0, i).trim().lowercase()] = line.substring(i + 1).trim()
                    }
                    val length = headers["content-length"]?.toIntOrNull() ?: 0
                    val body = CharArray(length).also { var read = 0; while (read < length) { val n = reader.read(it, read, length - read); if (n < 0) break; read += n } }
                    seenMethod = requestLine.substringBefore(' ')
                    seenPath = requestLine.substringAfter(' ').substringBeforeLast(' ')
                    seenAuth = headers["authorization"]
                    seenBody = String(body)
                    if (delayMs > 0) Thread.sleep(delayMs)
                    val bytes = responseBody.toByteArray(Charsets.UTF_8)
                    val head = "HTTP/1.1 $status X\r\nContent-Type: application/json\r\nContent-Length: ${bytes.size}\r\nConnection: close\r\n\r\n"
                    try {
                        s.getOutputStream().apply { write(head.toByteArray()); write(bytes); flush() }
                    } catch (e: SocketException) {
                        // Client gave up (timeout test).
                    }
                }
            }
        }
    }

    @After
    fun stop() = server.close()

    private fun base() = "http://127.0.0.1:${server.localPort}"
    private fun api(tokens: TokenProvider? = FixedTokens("aaa.bbb.ccc"), readTimeoutMs: Int = 15_000) =
        MedLinkApi(ApiClient(base(), tokens, UrlConnectionTransport(2_000, readTimeoutMs)))

    @Test
    fun sendsBearerTokenAndParsesPagedEnvelope() = runBlocking {
        responseBody = """{"data":[{"id":"t1","facilityId":"f1","facilityName":"Rosebank Clinic","serviceDate":"2026-10-20",
            "ticketNumber":7,"status":"waiting","waitingAhead":2,"issuedAt":"2026-10-20T07:00:00.000Z",
            "createdAt":"x","updatedAt":"x"}],"meta":{"page":1,"pageSize":50,"total":1,"totalPages":1}}"""
        val tickets = api().myTickets("waiting")
        assertEquals("Bearer aaa.bbb.ccc", seenAuth)
        assertEquals("/api/queue-tickets?status=waiting&pageSize=50", seenPath)
        assertEquals(1, tickets.size)
        assertEquals(7, tickets[0].ticketNumber)
        assertEquals(2, tickets[0].waitingAhead)
    }

    @Test
    fun publicEndpointsSendNoAuthorizationHeader() = runBlocking {
        responseBody = """{"data":[{"pharmacyName":"Clicks","amount":"24.99","currency":"ZAR","effectiveFrom":"2026-10-19","source":"demo","id":"p"}],
            "meta":{"page":1,"pageSize":50,"total":1,"totalPages":1}}"""
        val prices = api(tokens = null).medicinePrices("m1")
        assertNull(seenAuth)
        assertEquals("24.99", prices[0].amount)
        assertTrue(prices[0].isDemo)
    }

    @Test
    fun postsJsonBodyForWrites() = runBlocking {
        status = 201
        responseBody = """{"data":{"id":"a1","practitionerId":"p1","practitionerName":"Dr N","specialty":"GP","facilityId":null,
            "facilityName":"Clinic","scheduledAt":"2026-10-21T07:30:00.000Z","reason":null,"status":"requested","createdAt":"x","updatedAt":"x"}}"""
        val appt = api().bookAppointment("p1", "2026-10-21T07:30:00Z", "  Check-up ")
        assertEquals("POST", seenMethod)
        assertTrue(seenBody!!.contains("\"reason\":\"Check-up\""))
        assertEquals("requested", appt.status)
        assertNull(appt.reason)
    }

    @Test
    fun errorEnvelopeBecomesServerException() = runBlocking {
        status = 409
        responseBody = """{"error":{"code":"ALREADY_IN_QUEUE","message":"You already have a ticket."},"requestId":"req-1"}"""
        try {
            api().joinQueue("f1"); fail("expected an error")
        } catch (e: ApiException.Server) {
            assertEquals(409, e.status)
            assertEquals("ALREADY_IN_QUEUE", e.code)
            assertEquals("You already have a ticket.", e.message)
            assertEquals("req-1", e.requestId)
        }
    }

    @Test
    fun unauthorizedClearsTheSession() = runBlocking {
        status = 401
        responseBody = """{"error":{"code":"UNAUTHENTICATED","message":"Sign in."},"requestId":"r"}"""
        val tokens = FixedTokens("aaa.bbb.ccc")
        try {
            api(tokens).appointments(); fail("expected 401")
        } catch (e: ApiException.Unauthorized) {
            assertEquals(1, tokens.unauthorizedCalls)
            assertNull(tokens.token)
        }
    }

    @Test
    fun missingTokenFailsWithoutCallingTheServer() = runBlocking {
        try {
            api(FixedTokens(null)).appointments(); fail("expected Unauthorized")
        } catch (e: ApiException.Unauthorized) {
            assertNull(seenPath)
        }
    }

    @Test
    fun malformedResponsesAreRejected() = runBlocking {
        responseBody = """{"data":[{"id":"x"}],"meta":{"page":1,"pageSize":1,"total":1,"totalPages":1}}"""
        try { api().myTickets(); fail("expected Malformed") } catch (e: ApiException.Malformed) {}
        responseBody = "<html>proxy error</html>"
        try { api().myTickets(); fail("expected Malformed") } catch (e: ApiException.Malformed) {}
    }

    @Test
    fun nonJsonServerErrorStillHasAMessage() = runBlocking {
        status = 502
        responseBody = "Bad gateway"
        try { api().queues(); fail() } catch (e: ApiException.Server) {
            assertEquals(502, e.status)
            assertEquals("HTTP_502", e.code)
        }
    }

    @Test
    fun slowServerTimesOut() = runBlocking {
        delayMs = 1_500
        responseBody = """{"data":[],"meta":{"page":1,"pageSize":1,"total":0,"totalPages":0}}"""
        try { api(readTimeoutMs = 300).queues(); fail("expected timeout") } catch (e: ApiException.Timeout) {}
    }

    @Test
    fun unreachableServerIsANetworkError() = runBlocking {
        val port = server.localPort
        server.close()
        val client = MedLinkApi(ApiClient("http://127.0.0.1:$port", FixedTokens("a.b.c"), UrlConnectionTransport(1_000, 1_000)))
        try { client.queues(); fail() } catch (e: ApiException.Network) {}
    }

    @Test
    fun unconfiguredClientNeverCallsOut() = runBlocking {
        val client = MedLinkApi(ApiClient("  ", FixedTokens("a.b.c")))
        assertFalse(client.isConfigured)
        try { client.queues(); fail() } catch (e: ApiException.NotConfigured) {}
    }

    @Test
    fun queryStringEncodesAndSkipsEmpty() {
        assertEquals("?q=para%20cet&page=2", ApiClient.queryString(linkedMapOf("q" to "para cet", "x" to null, "y" to "", "page" to "2")))
        assertEquals("", ApiClient.queryString(emptyMap()))
    }
}
