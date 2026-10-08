package com.rewardsplanners.icons

import android.content.ComponentName
import android.content.pm.PackageManager
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AppIconSwitcherModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "AppIconSwitcherModule"

  private val aliases = mapOf(
    "default" to "DefaultIconAlias",
    "diwali" to "DiwaliIconAlias",
    "eid" to "EidIconAlias",
    "christmas" to "ChristmasIconAlias",
    "holi" to "HoliIconAlias",
    "independence_day" to "IndependenceDayIconAlias",
    "navratri" to "NavratriIconAlias",
    "dasera" to "DaseraIconAlias",
  ).mapValues { (_, name) -> ComponentName(context.packageName, "com.rewardsplanners.icons.$name") }

  private fun applyStates(states: Map<ComponentName, Int>) {
    val manager = reactApplicationContext.packageManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      manager.setComponentEnabledSettings(states.map { (component, state) ->
        PackageManager.ComponentEnabledSetting(component, state, PackageManager.DONT_KILL_APP)
      })
    } else {
      // Older Android cannot batch atomically. Enable the target before removing the old entry.
      states.entries.sortedBy { if (it.value == PackageManager.COMPONENT_ENABLED_STATE_ENABLED) 0 else 1 }
        .forEach { (component, state) ->
          manager.setComponentEnabledSetting(component, state, PackageManager.DONT_KILL_APP)
        }
    }
  }

  @ReactMethod
  @Synchronized
  fun setAppIcon(iconKey: String, promise: Promise) {
    try {
      val manager = reactApplicationContext.packageManager
      val target = aliases[iconKey] ?: aliases.getValue("default")
      val previous = aliases.values.associateWith { component ->
        val state = manager.getComponentEnabledSetting(component)
        if (state == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT) {
          if (component == aliases.getValue("default")) PackageManager.COMPONENT_ENABLED_STATE_ENABLED
          else PackageManager.COMPONENT_ENABLED_STATE_DISABLED
        } else state
      }
      val desired = aliases.values.associateWith { component ->
        if (component == target) PackageManager.COMPONENT_ENABLED_STATE_ENABLED
        else PackageManager.COMPONENT_ENABLED_STATE_DISABLED
      }
      if (previous != desired) {
        try {
          applyStates(desired)
        } catch (error: Exception) {
          try {
            applyStates(previous)
          } catch (rollbackError: Exception) {
            error.addSuppressed(rollbackError)
          }
          throw error
        }
      }
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("APP_ICON_SWITCH_FAILED", "Could not switch the launcher icon", error)
    }
  }
}
