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
import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

@Entity(tableName = "local_accounts")
data class LocalAccount(
    @PrimaryKey val email: String,
    val name: String,
    val passwordSalt: String,
    val passwordHash: String,
)

@Dao
interface LocalAccountDao {
    @Query("SELECT * FROM local_accounts WHERE email = :email LIMIT 1")
    suspend fun findByEmail(email: String): LocalAccount?

    @Insert(onConflict = OnConflictStrategy.ABORT)
    suspend fun insert(account: LocalAccount)
}

@Database(entities = [LocalAccount::class], version = 1, exportSchema = false)
abstract class MedLinkDatabase : RoomDatabase() {
    abstract fun localAccountDao(): LocalAccountDao

    companion object {
        @Volatile
        private var instance: MedLinkDatabase? = null

        fun getInstance(context: android.content.Context): MedLinkDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(
                    context.applicationContext,
                    MedLinkDatabase::class.java,
                    "medlink-local.db",
                ).build().also { instance = it }
            }
    }
}

sealed interface LocalAuthResult {
    data class Success(val name: String, val email: String) : LocalAuthResult
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
        return LocalAuthResult.Success(account.name, account.email)
    }

    suspend fun signIn(email: String, password: String): LocalAuthResult {
        val account = accounts.findByEmail(email) ?: return LocalAuthResult.InvalidCredentials
        val salt = Base64.decode(account.passwordSalt, Base64.NO_WRAP)
        val expectedHash = Base64.decode(account.passwordHash, Base64.NO_WRAP)
        val actualHash = derivePasswordHash(password.toCharArray(), salt)
        return try {
            if (MessageDigest.isEqual(expectedHash, actualHash)) {
                LocalAuthResult.Success(account.name, account.email)
            } else {
                LocalAuthResult.InvalidCredentials
            }
        } finally {
            actualHash.fill(0)
        }
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
