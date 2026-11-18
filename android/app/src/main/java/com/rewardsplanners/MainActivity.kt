package com.rewardsplanners

import android.os.Bundle
import android.util.Log
import androidx.activity.result.ActivityResultLauncher
import androidx.health.connect.client.PermissionController
import androidx.lifecycle.Lifecycle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.bridge.Promise
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory

class MainActivity : ReactActivity() {
  private lateinit var stepsPermissionLauncher: ActivityResultLauncher<Set<String>>
  private var stepsPermissionResult: Promise? = null

  private fun logFitness(event: String) {
    if (BuildConfig.DEBUG) Log.d("RP_MOVE_ANDROID_FLOW", event)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "RewardsPlanners"

  override fun onCreate(savedInstanceState: Bundle?) {
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    super.onCreate(savedInstanceState)
    logFitness(if (savedInstanceState != null) "ACTIVITY_RECREATED" else "ACTIVITY_CREATED")
    stepsPermissionLauncher = activityResultRegistry.register(
      "rp-move-steps-read",
      this,
      PermissionController.createRequestPermissionResultContract()
    ) {
      val result = stepsPermissionResult
      stepsPermissionResult = null
      logFitness(if (result == null) "ORPHAN_PERMISSION_RESULT_IGNORED" else "NATIVE_PERMISSION_RESULT")
      // JS verifies the current grant independently, including after recreation.
      result?.resolve(null)
    }
  }

  fun requestStepsPermission(promise: Promise) {
    if (!lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED) || !::stepsPermissionLauncher.isInitialized) {
      promise.reject("ACTIVITY_UNAVAILABLE", "Return to Reward Planners to request Steps access")
      return
    }
    if (stepsPermissionResult != null) {
      logFitness("DUPLICATE_PERMISSION_REQUEST_IGNORED")
      promise.reject("REQUEST_IN_PROGRESS", "The Steps permission dialog is already open")
      return
    }
    stepsPermissionResult = promise
    try {
      logFitness("OPEN_NATIVE_PERMISSION_UI")
      stepsPermissionLauncher.launch(setOf("android.permission.health.READ_STEPS"))
    } catch (error: Exception) {
      stepsPermissionResult = null
      promise.reject("PERMISSION_LAUNCH_FAILED", error)
    }
  }

  override fun onDestroy() {
    stepsPermissionResult?.reject("ACTIVITY_RECREATED", "Steps access will be verified when the app returns")
    stepsPermissionResult = null
    super.onDestroy()
  }

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
