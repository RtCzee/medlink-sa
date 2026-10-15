package com.medlink.mobile

import android.util.Base64
import androidx.room.Dao
import androidx.room.Database
import androidx.room.Entity
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.PrimaryKey
import androidx.room.Query
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.ColumnInfo
import androidx.room.Update
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import kotlinx.coroutines.flow.Flow
import java.security.MessageDigest
import java.security.SecureRandom
import java.util.UUID
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

@Entity(tableName = "local_accounts")
data class LocalAccount(
    @PrimaryKey val email: String,
    val name: String,
    val passwordSalt: String,
    val passwordHash: String,
    @ColumnInfo(defaultValue = "''") val phone: String = "",
    @ColumnInfo(defaultValue = "''") val bloodType: String = "",
    @ColumnInfo(defaultValue = "''") val allergies: String = "",
    @ColumnInfo(defaultValue = "''") val conditions: String = "",
    @ColumnInfo(defaultValue = "''") val emergencyContactName: String = "",
    @ColumnInfo(defaultValue = "''") val emergencyContactPhone: String = "",
)

@Dao
interface LocalAccountDao {
    @Query("SELECT * FROM local_accounts WHERE email = :email LIMIT 1")
    suspend fun findByEmail(email: String): LocalAccount?

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insert(account: LocalAccount)

    @Update
    suspend fun update(account: LocalAccount)
}

@Entity(tableName = "appointments", indices = [androidx.room.Index("patientEmail")])
data class LocalAppointment(
    @PrimaryKey val id: String,
    val patientEmail: String,
    val doctorName: String,
    val specialty: String,
    val facility: String,
    val scheduledAtMillis: Long,
    val reason: String,
    val status: String,
)

@Dao
interface LocalAppointmentDao {
    @Query("SELECT * FROM appointments WHERE patientEmail = :patientEmail ORDER BY scheduledAtMillis ASC")
    fun observeForPatient(patientEmail: String): Flow<List<LocalAppointment>>

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insert(appointment: LocalAppointment)

    @Query("DELETE FROM appointments WHERE id = :appointmentId AND patientEmail = :patientEmail")
    suspend fun delete(appointmentId: String, patientEmail: String)
}

@Database(entities = [LocalAccount::class, LocalAppointment::class], version = 3, exportSchema = false)
abstract class MedLinkDatabase : RoomDatabase() {
    abstract fun localAccountDao(): LocalAccountDao
    abstract fun localAppointmentDao(): LocalAppointmentDao

    companion object {
        private val MIGRATION_1_2 = object : Migration(1, 2) {
            override fun migrate(database: SupportSQLiteDatabase) {
                database.execSQL("ALTER TABLE local_accounts ADD COLUMN phone TEXT NOT NULL DEFAULT ''")
                database.execSQL("ALTER TABLE local_accounts ADD COLUMN bloodType TEXT NOT NULL DEFAULT ''")
                database.execSQL("ALTER TABLE local_accounts ADD COLUMN allergies TEXT NOT NULL DEFAULT ''")
                database.execSQL("ALTER TABLE local_accounts ADD COLUMN conditions TEXT NOT NULL DEFAULT ''")
                database.execSQL("ALTER TABLE local_accounts ADD COLUMN emergencyContactName TEXT NOT NULL DEFAULT ''")
                database.execSQL("ALTER TABLE local_accounts ADD COLUMN emergencyContactPhone TEXT NOT NULL DEFAULT ''")
            }
        }
        private val MIGRATION_2_3 = object : Migration(2, 3) {
            override fun migrate(database: SupportSQLiteDatabase) {
                database.execSQL(
                    """
                    CREATE TABLE IF NOT EXISTS appointments (
                        id TEXT NOT NULL PRIMARY KEY,
                        patientEmail TEXT NOT NULL,
                        doctorName TEXT NOT NULL,
                        specialty TEXT NOT NULL,
                        facility TEXT NOT NULL,
                        scheduledAtMillis INTEGER NOT NULL,
                        reason TEXT NOT NULL,
                        status TEXT NOT NULL
                    )
                    """.trimIndent(),
                )
                database.execSQL(
                    "CREATE INDEX IF NOT EXISTS index_appointments_patientEmail ON appointments(patientEmail)",
                )
            }
        }

        @Volatile
        private var instance: MedLinkDatabase? = null

        fun getInstance(context: android.content.Context): MedLinkDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    MedLinkDatabase::class.java,
                    "medlink-local.db",
                ).addMigrations(MIGRATION_1_2, MIGRATION_2_3).build().also { instance = it }
            }
    }
}

sealed interface LocalAuthResult {
    data class Success(val account: LocalAccount) : LocalAuthResult
    data object InvalidCredentials : LocalAuthResult
    data object AccountAlreadyExists : LocalAuthResult
}

class LocalAuthRepository(private val accounts: LocalAccountDao) {
    suspend fun register(name: String, email: String, password: String): LocalAuthResult {
        if (accounts.findByEmail(email) != null) {
            return LocalAuthResult.AccountAlreadyExists
        }

        val salt = ByteArray(SALT_BYTES).also(SecureRandom()::nextBytes)
        val hash = derivePasswordHash(password.toCharArray(), salt)
        val account = try {
            LocalAccount(
                email = email,
                name = name.trim(),
                passwordSalt = Base64.encodeToString(salt, Base64.NO_WRAP),
                passwordHash = Base64.encodeToString(hash, Base64.NO_WRAP),
            )
        } finally {
            hash.fill(0)
        }
        accounts.insert(account)
        return LocalAuthResult.Success(account)
    }

    suspend fun signIn(email: String, password: String): LocalAuthResult {
        val account = accounts.findByEmail(email) ?: return LocalAuthResult.InvalidCredentials
        val salt = Base64.decode(account.passwordSalt, Base64.NO_WRAP)
        val expectedHash = Base64.decode(account.passwordHash, Base64.NO_WRAP)
        val actualHash = derivePasswordHash(password.toCharArray(), salt)
        return try {
            if (MessageDigest.isEqual(expectedHash, actualHash)) {
                LocalAuthResult.Success(account)
            } else {
                LocalAuthResult.InvalidCredentials
            }
        } finally {
            actualHash.fill(0)
        }
    }

    suspend fun saveProfile(account: LocalAccount) {
        accounts.update(account)
    }

    private fun derivePasswordHash(password: CharArray, salt: ByteArray): ByteArray {
        val keySpec = PBEKeySpec(password, salt, PBKDF2_ITERATIONS, HASH_BITS)
        return try {
            SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
                .generateSecret(keySpec)
                .encoded
        } finally {
            keySpec.clearPassword()
            password.fill('\u0000')
        }
    }

    private companion object {
        const val SALT_BYTES = 16
        const val PBKDF2_ITERATIONS = 600_000
        const val HASH_BITS = 256
    }
}

class LocalAppointmentRepository(private val appointments: LocalAppointmentDao) {
    fun observeForPatient(patientEmail: String): Flow<List<LocalAppointment>> =
        appointments.observeForPatient(patientEmail)

    suspend fun request(
        patientEmail: String,
        doctorName: String,
        specialty: String,
        facility: String,
        scheduledAtMillis: Long,
        reason: String,
    ) {
        appointments.insert(
            LocalAppointment(
                id = UUID.randomUUID().toString(),
                patientEmail = patientEmail,
                doctorName = doctorName.trim(),
                specialty = specialty.trim(),
                facility = facility.trim(),
                scheduledAtMillis = scheduledAtMillis,
                reason = reason.trim(),
                status = "Requested",
            ),
        )
    }

    suspend fun cancel(appointment: LocalAppointment) {
        appointments.delete(appointment.id, appointment.patientEmail)
    }
}
