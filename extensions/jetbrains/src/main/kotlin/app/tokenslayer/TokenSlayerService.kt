package app.tokenslayer

import app.tokenslayer.api.JdkHttpTransport
import app.tokenslayer.api.TokenSlayerClient
import app.tokenslayer.auth.AuthService
import app.tokenslayer.auth.PasswordSafeSecretStore
import app.tokenslayer.bridge.BridgeMessage
import app.tokenslayer.hooks.*
import app.tokenslayer.realtime.SnapshotPoller
import app.tokenslayer.settings.TokenSlayerSettings
import app.tokenslayer.ui.*
import com.intellij.ide.BrowserUtil
import com.intellij.openapi.components.Service
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import com.intellij.util.Alarm
import com.google.gson.JsonObject

@Service(Service.Level.APP)
class TokenSlayerService {
    val serverUrl: String get() = TokenSlayerSettings.getInstance().serverUrl

    val client: TokenSlayerClient = TokenSlayerClient(
        serverUrl = serverUrl,
        getToken = { auth.token() },
        onUnauthorized = { auth.handleUnauthorized() },
        transport = JdkHttpTransport(),
    )

    val auth: AuthService = AuthService(
        secrets = PasswordSafeSecretStore(),
        client = client,
        openBrowser = { BrowserUtil.browse(it) },
        serverUrl = serverUrl,
    )

    private val alarm = Alarm(Alarm.ThreadToUse.POOLED_THREAD, ApplicationDisposable)
    private val poller = SnapshotPoller(
        client = client,
        schedule = { ms, cb -> alarm.addRequest(cb, ms.toInt()) },
        cancel = { alarm.cancelAllRequests() },
    )

    private val statusListeners = mutableSetOf<(StatusState) -> Unit>()
    private var status = StatusState()
    private val hitThrottle = NotificationThrottle()

    init {
        poller.onBridgeEvent { dispatchBridge(it) }
        auth.onAuthChanged { signedIn ->
            if (signedIn) poller.start() else { poller.stop(); updateStatus { StatusState() } }
            updateStatus { it.copy(signedIn = signedIn) }
        }
        if (auth.isSignedIn()) { poller.start(); updateStatus { it.copy(signedIn = true) } }
    }

    fun addStatusListener(listener: (StatusState) -> Unit) {
        statusListeners.add(listener); listener(status)
    }

    fun dispatchBridge(m: BridgeMessage) {
        when (m) {
            is BridgeMessage.ConnectionState -> updateStatus { it.copy(connection = m.state) }
            is BridgeMessage.BossSnapshot -> updateStatus {
                it.copy(bossName = m.name, bossMaxHp = m.maxHp, bossCurrentHp = m.currentHp, yourDamage = m.yourDamage)
            }
            is BridgeMessage.BossSpawned -> {
                updateStatus { it.copy(bossName = m.name, bossMaxHp = m.maxHp, bossCurrentHp = m.maxHp, yourDamage = 0) }
                TokenSlayerNotifications.bossSpawned(null, m.name)
            }
            is BridgeMessage.BossDefeated -> {
                updateStatus { it.copy(bossName = null, bossCurrentHp = null, yourDamage = 0) }
                TokenSlayerNotifications.bossDefeated(null, m.killerHandle)
            }
            is BridgeMessage.HitLanded -> {
                updateStatus { it.copy(bossCurrentHp = m.bossHpAfter, bossMaxHp = m.bossMaxHp, yourDamage = it.yourDamage + m.damage) }
                if (hitThrottle.allow()) TokenSlayerNotifications.hit(null, m.damage, m.bossHpAfter, m.bossMaxHp)
            }
            is BridgeMessage.ChargingUpdated -> updateStatus { it.copy(charging = m.activity) }
            else -> {}
        }
    }

    fun installHooks(project: Project?) {
        val file = SettingsFile()
        try {
            val cfg = parseHookConfig(client.getJson("/api/ide/hook-config"))
            val existing = file.read()
            val next = mergeHooks(existing, cfg)
            if (existing.toString() == next.toString()) {
                Messages.showInfoMessage(project, "token-slayer hooks already up to date.", "token-slayer")
                return
            }
            file.write(next)
            Messages.showInfoMessage(project, "token-slayer hooks installed in ${file.filePath}", "token-slayer")
        } catch (e: InvalidSettingsError) {
            Messages.showErrorDialog(project, "${e.filePath} is not valid JSON. Fix it and retry.", "token-slayer")
        } catch (e: Exception) {
            Messages.showErrorDialog(project, "install failed (${e.message})", "token-slayer")
        }
    }

    fun uninstallHooks(project: Project?) {
        val file = SettingsFile()
        try {
            file.write(removeHooks(file.read(), "token_slayer"))
            Messages.showInfoMessage(project, "token-slayer hooks removed.", "token-slayer")
        } catch (e: Exception) {
            Messages.showErrorDialog(project, "uninstall failed (${e.message})", "token-slayer")
        }
    }

    fun openBattlefield(project: Project?) {
        com.intellij.openapi.wm.ToolWindowManager.getInstance(project ?: return)
            .getToolWindow("token-slayer")?.activate(null)
    }

    fun openProfile() = BrowserUtil.browse("$serverUrl/profile")

    private fun parseHookConfig(json: JsonObject): HookConfig {
        val events = json.getAsJsonArray("events").map {
            val o = it.asJsonObject
            HookEvent(o.get("name").asString, o.get("command").asString)
        }
        return HookConfig(json.get("namespace").asString, json.get("eventsUrl").asString, events)
    }

    private fun updateStatus(transform: (StatusState) -> StatusState) {
        status = transform(status)
        for (l in statusListeners.toList()) { try { l(status) } catch (_: Exception) {} }
    }
}

object ApplicationDisposable : com.intellij.openapi.Disposable {
    override fun dispose() {}
}
