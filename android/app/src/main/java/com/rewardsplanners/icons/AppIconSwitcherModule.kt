package com.rewardsplanners.icons

import android.content.ComponentName
import android.content.pm.PackageManager
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AppIconSwitcherModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "AppIconSwitcherModule"

  private val aliases = mapOf(
    "default" to ".icons.DefaultIconAlias",
    "diwali" to ".icons.DiwaliIconAlias",
    "eid" to ".icons.EidIconAlias",
    "christmas" to ".icons.ChristmasIconAlias",
    "holi" to ".icons.HoliIconAlias",
    "independence_day" to ".icons.IndependenceDayIconAlias",
    "navratri" to ".icons.NavratriIconAlias",
    "dasera" to ".icons.DaseraIconAlias",
  ).mapValues { (_, name) -> ComponentName(context.packageName, "${context.packageName}$name") }

  private fun getAliasState(manager: PackageManager, component: ComponentName): Int {
    val state = manager.getComponentEnabledSetting(component)
    return if (state == PackageManager.COMPONENT_ENABLED_STATE_DEFAULT) {
      if (component == aliases.getValue("default")) PackageManager.COMPONENT_ENABLED_STATE_ENABLED
      else PackageManager.COMPONENT_ENABLED_STATE_DISABLED
    } else state
  }

  private fun setAliasState(manager: PackageManager, component: ComponentName, state: Int) {
    manager.setComponentEnabledSetting(component, state, PackageManager.DONT_KILL_APP)
  }

  private fun applyIcon(target: ComponentName) {
    val manager = reactApplicationContext.packageManager
    val currentEnabled = aliases.values.firstOrNull { component ->
      getAliasState(manager, component) == PackageManager.COMPONENT_ENABLED_STATE_ENABLED
    }

    if (currentEnabled == target) {
      return
    }

    // Enable the new launcher entry before disabling old aliases; MainActivity stays untouched.
    setAliasState(manager, target, PackageManager.COMPONENT_ENABLED_STATE_ENABLED)
    aliases.values
      .filter { component -> component != target }
      .forEach { component ->
        setAliasState(manager, component, PackageManager.COMPONENT_ENABLED_STATE_DISABLED)
      }
  }

  @ReactMethod
  @Synchronized
  fun setAppIcon(iconKey: String, promise: Promise) {
    try {
      val target = aliases[iconKey] ?: aliases.getValue("default")
      applyIcon(target)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("APP_ICON_SWITCH_FAILED", "Could not switch the launcher icon", error)
    }
  }
}
