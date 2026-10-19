package com.medlink.mobile.api

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.io.IOException
import java.net.HttpURLConnection
import java.net.SocketTimeoutException
import java.net.URL

/** A raw HTTP response. Bodies are small JSON documents, so they are read fully. */
data class HttpResponse(val status: Int, val body: String)

/** The one seam between the app and the network, so tests can swap in a fake or local server. */
fun interface HttpTransport {
    @Throws(IOException::class)
    fun execute(method: String, url: String, headers: Map<String, String>, body: String?): HttpResponse
}

/**
 * HttpURLConnection transport (part of the Android SDK, so no extra networking library).
 * Timeouts keep a dead network from hanging a screen forever.
 */
class UrlConnectionTransport(
    private val connectTimeoutMs: Int = 10_000,
    private val readTimeoutMs: Int = 15_000,
) : HttpTransport {
    override fun execute(method: String, url: String, headers: Map<String, String>, body: String?): HttpResponse {
        val connection = URL(url).openConnection() as HttpURLConnection
        try {
            connection.requestMethod = method
            connection.connectTimeout = connectTimeoutMs
            connection.readTimeout = readTimeoutMs
            connection.useCaches = false
            headers.forEach { (name, value) -> connection.setRequestProperty(name, value) }
            if (body != null) {
                connection.doOutput = true
                connection.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
            }
            val status = connection.responseCode
            val stream = if (status >= 400) connection.errorStream else connection.inputStream
            val text = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() } ?: ""
            return HttpResponse(status, text)
        } finally {
            connection.disconnect()
        }
    }
}

/** Everything a call can fail with, already turned into something a screen can show. */
sealed class ApiException(message: String) : Exception(message) {
    /** The API isn't configured in this build (no base URL). */
    class NotConfigured : ApiException("The MedLink API address is not configured in this build.")
    /** 401: no session, or the access token expired and could not be refreshed. */
    class Unauthorized(message: String) : ApiException(message)
    /** A 4xx/5xx with the API's {error:{code,message},requestId} envelope. */
    class Server(val status: Int, val code: String, message: String, val requestId: String?) : ApiException(message)
    class Timeout : ApiException("The server took too long to respond. Check your connection and try again.")
    class Network : ApiException("Could not reach MedLink. Check your internet connection and try again.")
    /** A response that doesn't match the documented envelope. */
    class Malformed : ApiException("MedLink sent a response the app could not read.")
}

/** A page from a list endpoint: {data:[...], meta:{page,pageSize,total,totalPages}}. */
data class Page<T>(val items: List<T>, val page: Int, val pageSize: Int, val total: Int, val totalPages: Int)

/** Supplies the current access token (refreshing if needed) and is told when it was rejected. */
interface TokenProvider {
    suspend fun accessToken(): String?
    suspend fun onUnauthorized()
}

/**
 * Calls the MedLink web API (`/api/...`), which accepts the Supabase access token as
 * `Authorization: Bearer <token>`. Runs on Dispatchers.IO, parses the {data,meta} and
 * {error,requestId} envelopes, and never logs tokens or response bodies.
 */
class ApiClient(
    baseUrl: String,
    private val tokens: TokenProvider?,
    private val transport: HttpTransport = UrlConnectionTransport(),
) {
    private val base = baseUrl.trim().trimEnd('/')

    val isConfigured: Boolean get() = base.isNotEmpty()

    suspend fun getObject(path: String, query: Map<String, String?> = emptyMap(), auth: Boolean = true): JSONObject =
        request("GET", path, query, null, auth).let { dataObject(it) }

    suspend fun getPage(path: String, query: Map<String, String?> = emptyMap(), auth: Boolean = true): Page<JSONObject> =
        request("GET", path, query, null, auth).let { pageOf(it) }

    suspend fun send(method: String, path: String, body: JSONObject?, auth: Boolean = true): JSONObject =
        request(method, path, emptyMap(), body ?: JSONObject(), auth).let { dataObject(it) }

    private suspend fun request(
        method: String,
        path: String,
        query: Map<String, String?>,
        body: JSONObject?,
        auth: Boolean,
    ): JSONObject {
        if (!isConfigured) throw ApiException.NotConfigured()
        val headers = linkedMapOf("Accept" to "application/json")
        if (body != null) headers["Content-Type"] = "application/json"
        if (auth) {
            val token = tokens?.accessToken() ?: throw ApiException.Unauthorized("Sign in to your MedLink account first.")
            headers["Authorization"] = "Bearer $token"
        }
        val url = base + path + queryString(query)
        val response = withContext(Dispatchers.IO) {
            try {
                transport.execute(method, url, headers, body?.toString())
            } catch (e: SocketTimeoutException) {
                throw ApiException.Timeout()
            } catch (e: IOException) {
                throw ApiException.Network()
            }
        }
        val json = parse(response.body)
        if (response.status in 200..299) return json ?: throw ApiException.Malformed()
        val error = json?.optJSONObject("error")
        val code = error?.optString("code").orEmpty().ifEmpty { "HTTP_${response.status}" }
        val message = error?.optString("message").orEmpty().ifEmpty { "MedLink returned an error (${response.status})." }
        val requestId = json?.optString("requestId")?.takeIf { it.isNotEmpty() }
        if (response.status == 401) {
            if (auth) tokens?.onUnauthorized()
            throw ApiException.Unauthorized("Your session has expired. Please sign in again.")
        }
        throw ApiException.Server(response.status, code, message, requestId)
    }

    companion object {
        fun queryString(query: Map<String, String?>): String {
            val parts = query.filterValues { !it.isNullOrEmpty() }
                .map { (k, v) -> "${encode(k)}=${encode(v!!)}" }
            return if (parts.isEmpty()) "" else "?" + parts.joinToString("&")
        }

        private fun encode(value: String) = java.net.URLEncoder.encode(value, "UTF-8").replace("+", "%20")

        private fun parse(text: String): JSONObject? = try {
            if (text.isBlank()) null else JSONObject(text)
        } catch (e: JSONException) {
            null
        }

        fun dataObject(json: JSONObject): JSONObject =
            json.optJSONObject("data") ?: throw ApiException.Malformed()

        fun pageOf(json: JSONObject): Page<JSONObject> {
            val data: JSONArray = json.optJSONArray("data") ?: throw ApiException.Malformed()
            val meta = json.optJSONObject("meta") ?: throw ApiException.Malformed()
            val items = (0 until data.length()).map { data.optJSONObject(it) ?: throw ApiException.Malformed() }
            return Page(items, meta.optInt("page", 1), meta.optInt("pageSize", items.size), meta.optInt("total", items.size), meta.optInt("totalPages", 1))
        }
    }
}

/** Nullable string helper: JSON null and missing both become Kotlin null. */
fun JSONObject.stringOrNull(name: String): String? = if (isNull(name)) null else optString(name)
