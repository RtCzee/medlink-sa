package com.medlink.mobile.api

import android.content.Context
import com.medlink.mobile.BuildConfig

/**
 * One shared auth + API instance per process. Addresses come from BuildConfig, which the
 * Gradle build fills from gradle properties or mobile/local.properties (never committed):
 *   medlink.apiBaseUrl, medlink.supabaseUrl, medlink.supabasePublishableKey
 */
object MedLinkServices {
    @Volatile private var auth: SupabaseAuth? = null
    @Volatile private var api: MedLinkApi? = null

    fun auth(context: Context): SupabaseAuth = auth ?: synchronized(this) {
        auth ?: SupabaseAuth(BuildConfig.SUPABASE_URL, BuildConfig.SUPABASE_PUBLISHABLE_KEY, PrefsSessionStorage(context)).also { auth = it }
    }

    fun api(context: Context): MedLinkApi = api ?: synchronized(this) {
        api ?: MedLinkApi(ApiClient(BuildConfig.MEDLINK_API_BASE_URL, auth(context))).also { api = it }
    }
}
