package com.rewardsplanners

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.gms.auth.api.identity.GetPhoneNumberHintIntentRequest
import com.google.android.gms.auth.api.identity.Identity

class PhoneNumberHintModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  private var pendingPromise: Promise? = null

  private val activityEventListener: ActivityEventListener =
    object : BaseActivityEventListener() {
      override fun onActivityResult(
        activity: Activity,
        requestCode: Int,
        resultCode: Int,
        data: Intent?,
      ) {
        if (requestCode != PHONE_NUMBER_HINT_REQUEST) return

        val promise = pendingPromise ?: return
        pendingPromise = null

        if (resultCode != Activity.RESULT_OK || data == null) {
          promise.resolve(null)
          return
        }

        try {
          val phoneNumber = Identity.getSignInClient(reactContext).getPhoneNumberFromIntent(data)
          promise.resolve(phoneNumber)
        } catch (error: Exception) {
          promise.resolve(null)
        }
      }
    }

  init {
    reactContext.addActivityEventListener(activityEventListener)
  }

  override fun getName() = "PhoneNumberHint"

  @ReactMethod
  fun requestPhoneNumberHint(promise: Promise) {
    val activity = getCurrentActivity()

    if (activity == null) {
      promise.resolve(null)
      return
    }

    if (pendingPromise != null) {
      promise.reject("PHONE_HINT_IN_PROGRESS", "Phone number hint is already open")
      return
    }

    pendingPromise = promise

    val request = GetPhoneNumberHintIntentRequest.builder().build()

    Identity.getSignInClient(activity)
      .getPhoneNumberHintIntent(request)
      .addOnSuccessListener { result ->
        try {
          activity.startIntentSenderForResult(
            result.intentSender,
            PHONE_NUMBER_HINT_REQUEST,
            null,
            0,
            0,
            0,
          )
        } catch (error: Exception) {
          pendingPromise = null
          promise.resolve(null)
        }
      }
      .addOnFailureListener {
        pendingPromise = null
        promise.resolve(null)
      }
  }

  companion object {
    private const val PHONE_NUMBER_HINT_REQUEST = 9017
  }
}
