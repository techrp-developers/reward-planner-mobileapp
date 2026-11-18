package com.rewardsplanners

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.uimanager.ViewManager

class AndroidStepsPermissionPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> =
      listOf(AndroidStepsPermissionModule(context))

  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> =
      emptyList()
}

private class AndroidStepsPermissionModule(context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context) {
  override fun getName(): String = "AndroidStepsPermission"

  @ReactMethod
  fun request(promise: Promise) {
    val activity = reactApplicationContext.currentActivity as? MainActivity
    if (activity == null) {
      promise.reject("ACTIVITY_UNAVAILABLE", "Reward Planners activity is unavailable")
      return
    }
    activity.runOnUiThread { activity.requestStepsPermission(promise) }
  }
}
