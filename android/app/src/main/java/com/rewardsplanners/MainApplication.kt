package com.rewardsplanners

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.media.AudioAttributes
import android.media.RingtoneManager
import android.os.Build
import com.rewardsplanners.icons.AppIconSwitcherPackage
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
          add(PhoneNumberHintPackage())
          add(AppIconSwitcherPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    createTodoAlarmChannel()
    loadReactNative(this)
  }

  // Notifee can't set a channel's audio usage, so its channels play the short
  // notification tone at notification volume. Todo alarms need the alarm
  // ringtone on the alarm stream, so the channel is created natively. Keep the
  // id in sync with TODO_ALARM_CHANNEL_ID in todoAlarms.ts.
  private fun createTodoAlarmChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

    val manager = getSystemService(NotificationManager::class.java) ?: return
    // Superseded channel that used the notification sound.
    manager.deleteNotificationChannel("todo_alarms_v1")
    if (manager.getNotificationChannel(TODO_ALARM_CHANNEL_ID) != null) return

    val alarmSound =
      RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
        ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE)
    val audioAttributes =
      AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_ALARM)
        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
        .build()

    val channel =
      NotificationChannel(TODO_ALARM_CHANNEL_ID, "Todo alarms", NotificationManager.IMPORTANCE_HIGH).apply {
        description = "Alarm-style reminders for your todo tasks"
        setSound(alarmSound, audioAttributes)
        enableVibration(true)
        vibrationPattern = longArrayOf(0, 1000, 500, 1000)
        lockscreenVisibility = android.app.Notification.VISIBILITY_PUBLIC
      }
    manager.createNotificationChannel(channel)
  }

  private companion object {
    const val TODO_ALARM_CHANNEL_ID = "todo_alarms_v2"
  }
}
