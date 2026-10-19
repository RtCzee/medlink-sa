package com.medlink.mobile

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class OnlineFormatTest {
    @Test
    fun sastInputBecomesUtcInstant() {
        assertEquals("2026-10-21T07:30:00Z", sastToUtc("2026-10-21", "09:30"))
        assertNull(sastToUtc("21/10/2026", "09:30"))
        assertNull(sastToUtc("2026-10-21", "9h30"))
    }

    @Test
    fun utcIsShownInSast() {
        assertEquals("Wed 21 Oct 2026, 09:30 SAST", formatSast("2026-10-21T07:30:00.000Z"))
        assertEquals("not-a-date", formatSast("not-a-date"))
    }

    @Test
    fun ticketNumbersArePadded() {
        assertEquals("#007", ticketLabel(7))
        assertEquals("#1234", ticketLabel(1234))
    }
}
