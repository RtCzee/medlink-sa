package com.medlink.mobile.api

import org.json.JSONException
import org.json.JSONObject

data class QueueFacility(val id: String, val name: String, val type: String, val city: String, val province: String, val serviceDate: String)

data class QueueTicket(
    val id: String,
    val facilityId: String,
    val facilityName: String,
    val serviceDate: String,
    val ticketNumber: Int,
    val status: String,
    /** Waiting tickets ahead of this one today; null once it is no longer waiting. */
    val waitingAhead: Int?,
    val issuedAt: String,
)

data class Practitioner(val id: String, val fullName: String, val specialty: String, val facilityName: String?)

data class Appointment(
    val id: String,
    val practitionerName: String,
    val specialty: String,
    val facilityName: String,
    /** UTC instant, ISO-8601 with Z. */
    val scheduledAt: String,
    val reason: String?,
    val status: String,
)

data class MedicalRecord(val id: String, val title: String, val category: String, val provider: String?, val recordedOn: String, val notes: String?)

data class PrescriptionItem(val medicineName: String, val dosage: String, val quantity: Int?, val instructions: String?, val refills: Int)

data class Prescription(
    val id: String,
    val status: String,
    val issuedOn: String,
    val expiresOn: String?,
    val practitionerName: String?,
    val facilityName: String?,
    val itemCount: Int,
    val items: List<PrescriptionItem>,
)

data class Medicine(
    val id: String,
    val name: String,
    val strength: String?,
    val form: String?,
    val category: String?,
    val requiresPrescription: Boolean,
    val source: String,
)

data class MedicinePrice(
    val pharmacyName: String,
    /** Exact decimal string, e.g. "24.99". */
    val amount: String,
    val currency: String,
    val effectiveFrom: String,
    /** "demo" for seeded sample prices: they are NOT current retail prices. */
    val source: String,
) {
    val isDemo: Boolean get() = source == "demo"
}

/** Typed wrappers for the patient endpoints the app uses. Parsing is strict: a missing field is Malformed. */
class MedLinkApi(private val client: ApiClient) {
    val isConfigured: Boolean get() = client.isConfigured

    suspend fun queues(): List<QueueFacility> =
        client.getPage("/api/queues", mapOf("pageSize" to "100")).items.map(::queue)

    suspend fun myTickets(status: String? = "waiting"): List<QueueTicket> =
        client.getPage("/api/queue-tickets", mapOf("status" to status, "pageSize" to "50")).items.map(::ticket)

    suspend fun joinQueue(facilityId: String): QueueTicket = ticket(client.send("POST", "/api/queues/$facilityId/join", null))

    suspend fun leaveTicket(ticketId: String): QueueTicket = ticket(client.send("POST", "/api/queue-tickets/$ticketId/leave", null))

    suspend fun practitioners(): List<Practitioner> =
        client.getPage("/api/practitioners", mapOf("pageSize" to "100"), auth = false).items.map(::practitioner)

    suspend fun appointments(): List<Appointment> =
        client.getPage("/api/appointments", mapOf("pageSize" to "50")).items.map(::appointment)

    suspend fun bookAppointment(practitionerId: String, scheduledAtUtc: String, reason: String?): Appointment {
        val body = JSONObject().put("practitionerId", practitionerId).put("scheduledAt", scheduledAtUtc)
        if (!reason.isNullOrBlank()) body.put("reason", reason.trim())
        return appointment(client.send("POST", "/api/appointments", body))
    }

    suspend fun rescheduleAppointment(id: String, scheduledAtUtc: String): Appointment =
        appointment(client.send("PATCH", "/api/appointments/$id", JSONObject().put("scheduledAt", scheduledAtUtc)))

    suspend fun cancelAppointment(id: String): Appointment = appointment(client.send("POST", "/api/appointments/$id/cancel", null))

    suspend fun medicalRecords(): List<MedicalRecord> =
        client.getPage("/api/medical-records", mapOf("pageSize" to "50")).items.map(::record)

    suspend fun prescriptions(): List<Prescription> =
        client.getPage("/api/prescriptions", mapOf("pageSize" to "50")).items.map(::prescription)

    suspend fun prescription(id: String): Prescription = prescription(client.getObject("/api/prescriptions/$id"))

    suspend fun medicines(query: String? = null): List<Medicine> =
        client.getPage("/api/medicines", mapOf("q" to query?.trim()?.takeIf { it.length >= 2 }, "pageSize" to "50"), auth = false).items.map(::medicine)

    suspend fun medicinePrices(medicineId: String): List<MedicinePrice> =
        client.getPage("/api/medicines/$medicineId/prices", mapOf("pageSize" to "50"), auth = false).items.map(::price)

    companion object {
        private inline fun <T> strict(block: () -> T): T = try {
            block()
        } catch (e: JSONException) {
            throw ApiException.Malformed()
        }

        fun queue(j: JSONObject) = strict {
            QueueFacility(j.getString("id"), j.getString("name"), j.getString("type"), j.getString("city"), j.getString("province"), j.getString("serviceDate"))
        }

        fun ticket(j: JSONObject) = strict {
            QueueTicket(
                j.getString("id"), j.getString("facilityId"), j.getString("facilityName"), j.getString("serviceDate"),
                j.getInt("ticketNumber"), j.getString("status"), if (j.isNull("waitingAhead")) null else j.getInt("waitingAhead"), j.getString("issuedAt"),
            )
        }

        fun practitioner(j: JSONObject) = strict {
            Practitioner(j.getString("id"), j.getString("fullName"), j.getString("specialty"), j.optJSONObject("facility")?.getString("name"))
        }

        fun appointment(j: JSONObject) = strict {
            Appointment(j.getString("id"), j.getString("practitionerName"), j.getString("specialty"), j.getString("facilityName"), j.getString("scheduledAt"), j.stringOrNull("reason"), j.getString("status"))
        }

        fun record(j: JSONObject) = strict {
            MedicalRecord(j.getString("id"), j.getString("title"), j.getString("category"), j.stringOrNull("provider"), j.getString("recordedOn"), j.stringOrNull("notes"))
        }

        fun prescription(j: JSONObject) = strict {
            val items = j.optJSONArray("items")?.let { arr ->
                (0 until arr.length()).map { i ->
                    val it = arr.getJSONObject(i)
                    PrescriptionItem(it.getString("medicineName"), it.getString("dosage"), if (it.isNull("quantity")) null else it.getInt("quantity"), it.stringOrNull("instructions"), it.getInt("refills"))
                }
            } ?: emptyList()
            Prescription(
                j.getString("id"), j.getString("status"), j.getString("issuedOn"), j.stringOrNull("expiresOn"),
                j.optJSONObject("practitioner")?.getString("fullName"), j.optJSONObject("facility")?.getString("name"),
                j.optInt("itemCount", items.size), items,
            )
        }

        fun medicine(j: JSONObject) = strict {
            Medicine(j.getString("id"), j.getString("name"), j.stringOrNull("strength"), j.stringOrNull("form"), j.stringOrNull("category"), j.getBoolean("requiresPrescription"), j.getString("source"))
        }

        fun price(j: JSONObject) = strict {
            MedicinePrice(j.getString("pharmacyName"), j.getString("amount"), j.getString("currency"), j.getString("effectiveFrom"), j.getString("source"))
        }
    }
}
