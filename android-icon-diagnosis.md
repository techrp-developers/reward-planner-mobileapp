# Android launcher-icon diagnosis

## Phone follow-up: successful icon refresh

Final `npm run android` result: exit 0, `BUILD SUCCESSFUL in 4m 26s`, installed on V2030, and automatic launch succeeded with `cmp=com.rewardsplanners/.MainActivity`. There was no Activity class does not exist error. All six focused icon-service tests passed, and the final diff check passed.

The V2030 phone is now connected as 3d1a521. The earlier emulator failure remains a separate machine setup issue. Direct launch with `adb -s 3d1a521 shell am start -n com.rewardsplanners/.MainActivity` succeeded. The CLI supports `--main-activity MainActivity`, so the manifest does not need a launcher filter on MainActivity.

The phone's wlan0 address is 192.168.1.207; the PC remains 192.168.1.209. `adb reverse --list` shows only `UsbFfs tcp:8081 tcp:8081`. The API reverse flag was true with no port 5000 forwarding; it has now been set to false to use LAN access as requested. No port 5000 forwarding was added.

Fresh phone logcat at 15:53:28 IST on 2026-10-09:

```text
[AppIcon] Resolved icon: navratri
[AppIcon] Applied icon: navratri
```

The Applied log is emitted after the awaited native setAppIcon call resolves. `adb shell dumpsys package com.rewardsplanners` confirms `com.rewardsplanners.icons.NavratriIconAlias` enabled; Default, Diwali, Eid, Christmas, Holi, IndependenceDay and Dasera aliases are disabled. CMS module/navbar calls also succeeded via http://192.168.1.209:5000. This verifies API resolution and the native switcher; launcher artwork caching was not visually inspected.

Commands used for follow-up verification (SDK adb path: C:/Users/dell/AppData/Local/Android/Sdk/platform-tools/adb.exe):

```powershell
adb devices
adb reverse --list
adb -s 3d1a521 shell am start -n com.rewardsplanners/.MainActivity
curl.exe --max-time 10 -sS 'http://192.168.1.209:5000/content/resolved/app-icon?platform=android'
adb -s 3d1a521 shell ip route
adb -s 3d1a521 logcat -d -t 5000
adb -s 3d1a521 shell dumpsys package com.rewardsplanners
curl.exe --max-time 10 -sS 'http://localhost:8081/status'
npm test -- --runTestsByPath src/services/__tests__/iconService.test.ts --runInBand
npm run android
git diff --check
git diff -- package.json src/config/apiConfig.ts src/services/iconService.ts
```

Relevant output: device 3d1a521/device; Metro reverse 8081 only; explicit MainActivity launch succeeded; curl icon response success/android/navratri; phone route 192.168.1.0/24 wlan0 src 192.168.1.207; Metro packager-status:running; six icon-service tests passed; diff check passed. CLI and repo file searches established that scripts/adb-reverse.js does not exist and the installed CLI supports --main-activity. Long build and search output is summarized.

Task changes, including the API flag relative to the start of this follow-up:

```diff
--- package.json
+++ package.json
-    "android": "node scripts/adb-reverse.js && react-native run-android",
+    "android": "react-native run-android --main-activity MainActivity",
-    "start": "node scripts/adb-reverse.js && react-native start",
+    "start": "react-native start",
--- src/config/apiConfig.ts
+++ src/config/apiConfig.ts
-export const USE_ADB_REVERSE_FOR_ANDROID_PHYSICAL = true;
+export const USE_ADB_REVERSE_FOR_ANDROID_PHYSICAL = false;
--- src/services/iconService.ts
+++ src/services/iconService.ts
   await bridge.setAppIcon(platform === 'ios' && key === 'default' ? null : iconMap[key]);
+  if (__DEV__) console.log('[AppIcon] Applied icon:', key);
   // Fetch/validation failures never call the native bridge, preserving the current icon.
+  if (__DEV__) console.log('[AppIcon] Resolved icon:', data.data.icon_key);
   await applyAppIcon(data.data.icon_key);
```

This report section is newly added. No manifest, Kotlin, backend, iOS, campaign, or schema edit was made during the phone follow-up. The older sections below describe the earlier diagnostic run and its historical config state.

Date: 2026-10-09. Commands below were run in PowerShell from C:/Projects/RewardsPlanners unless a different working directory is shown. Long file reads and repetitive emulator IPv6 messages are summarized in the early-command section; later commands have captured output. No backend code, iOS file, or schema was changed.

## 1. Device

ADB repeatedly returned an empty device list. Sandbox emulator launches misleadingly returned "Unknown AVD name"; launching outside the sandbox located the AVD and exposed the real failure:

```text
ERROR | x86_64 emulation currently requires hardware acceleration!
CPU acceleration status: Android Emulator hypervisor driver is not installed on this machine
```

The retry with -gpu swiftshader_indirect failed identically. BIOS virtualization and second-level address translation are True; HypervisorPresent is False. C: has 65,782,349,824 bytes free (about 61.3 GiB), and the emulator passed its disk check. Get-WindowsOptionalFeature required Windows administrator elevation, so the exact Windows Hypervisor Platform feature state could not be confirmed. Registry package states alone are not sufficient to establish that the feature is enabled. Missing usable acceleration is confirmed. No evidence proves snapshot corruption; -no-snapshot-load already bypasses the snapshot.

Recovery: in an Administrator PowerShell, run the following command, then restart Windows yourself:

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName HypervisorPlatform -All -NoRestart
```

After restarting, run emulator -accel-check and start the AVD again. Android documentation recommends Windows Hypervisor Platform: https://developer.android.com/studio/run/emulator-acceleration . If acceleration passes but a separate snapshot problem remains, use Android Studio > Device Manager > this AVD's menu > Cold Boot Now. Wipe Data is a later option and erases emulator data; it was not performed.

Phone alternative:
1. Phone Settings > About phone > tap Build number seven times (Samsung: About phone > Software information > Build number).
2. Settings > Developer options > enable USB debugging.
3. Connect a data-capable USB cable, unlock the phone, select File Transfer if needed, and accept the RSA debugging prompt.
4. Run the ADB devices command below. It must show the serial with state device, rather than unauthorized. Install the manufacturer's Windows USB driver if the phone does not appear.
5. For USB-only API access, run adb reverse tcp:5000 tcp:5000 and set USE_ADB_REVERSE_FOR_ANDROID_PHYSICAL=true. Otherwise keep the current LAN setup and put the phone on the PC's network.

## 2. API reachability

src/config/apiConfig.ts currently forces the local environment. Physical Android uses http://192.168.1.209:5000; with USE_ADB_REVERSE_FOR_ANDROID_PHYSICAL=true it uses http://127.0.0.1:5000 and requires an active ADB reverse mapping. Android emulator already correctly uses http://10.0.2.2:5000. iOS simulator uses http://localhost:5000; physical iOS uses the PC LAN address. Only the stale LAN host was changed, from 192.168.1.111 to 192.168.1.209.

Express uses server.listen(PORT) without a loopback host. Runtime listener is :: on port 5000, an all-interface IPv6 listener accepting IPv4 here: both localhost and 192.168.1.209 returned the resolved icon successfully. It is not bound only to localhost; an explicit 0.0.0.0 edit is unnecessary.

Firewall: Get-NetFirewallRule was denied, but netsh inspection succeeded. Enabled inbound TCP Node.js rules allow all local ports for C:\\program files\\nodejs\\node.exe on Private and Public profiles. Wi-Fi 2 is Public. TCP 5000 is covered. No firewall change was made. If these rules are removed, the requested add-rule command is:

```powershell
New-NetFirewallRule -DisplayName 'RewardsPlanners API TCP 5000' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5000 -Profile Private,Public
```

Run that in Administrator PowerShell only if needed. Main and all three built debug manifest outputs contain android:usesCleartextTraffic="true".

## 3. Data

Neither repo-root .env nor src/server/.env exists. config/database.js uses environment variables with localhost / rewardplanners_db defaults. The effective target in this session is localhost / rewardplanners_db, and SELECT DATABASE(), @@hostname, @@port returned rewardplanners_db / DESKTOP-7JB363H / 3306. No credential was printed. This verifies the database used by the diagnostic process; it does not inspect private environment variables of the already-running server process.

SHOW COLUMNS confirmed starts_at datetime(3), ends_at datetime(3), and is_active tinyint(1), plus id, platform, icon_key, priority, created_at, updated_at.

Inserted campaign 7: Android/navratri, priority 2, active, starts 2026-10-09 09:39:08.221 UTC (15:09:08.221 IST), ends 09:42:08.221 UTC (15:12:08.221 IST). Existing campaign 6 remains active until 11:13:30.937 UTC (16:43:30.937 IST), as requested by the user. Therefore the post-test response should remain navratri, not default. Campaign 7 is left as an expired test record after the window; no existing campaign was modified.

## 4. End-to-end

App.tsx imports useFestivalIcon at line 14 and calls it at line 41. MainApplication registers AppIconSwitcherPackage. AppIconSwitcherModule.kt maps default to .icons.DefaultIconAlias and navratri to .icons.NavratriIconAlias. It enables the target before disabling other icon aliases, never changes MainActivity, and uses PackageManager.DONT_KILL_APP. It skips when the first enabled alias is the target; under the normal single-enabled-alias invariant this meets the requested check. If multiple aliases are already enabled, that shortcut is not a general repair for inconsistent state. No evidence from a device establishes such a state here.

The module source was read in the early command transcript and is available at android/app/src/main/java/com/rewardsplanners/icons/AppIconSwitcherModule.kt. No native code change was made.

## Early commands and relevant output
### Early command 1

```powershell
& 'C:\Users\dell\AppData\Local\Android\Sdk\platform-tools\adb.exe' devices
```

Relevant output:

```text
List of devices attached (empty)
```

### Early command 2

```powershell
git status --short
```

Relevant output:

```text
 M README.md
 M android/app/src/main/java/com/rewardsplanners/icons/AppIconSwitcherModule.kt
 D device-screen.png
 M src/config/apiConfig.ts
 M src/server/models/appIconModel.js
 M src/server/tests/appIcon.test.js
 M src/services/__tests__/iconService.test.ts
 M src/services/iconService.ts
?? src/server/migrations/20261008_01_normalize_app_icon_campaigns.sql
```

### Early command 3

```powershell
rg --files -g AGENTS.md -g '*database*' -g '*apiConfig*' -g '*appIcon*' -g '*iconService*' -g '*Festival*' -g '*AndroidManifest*' -g '.env*' -g '*server*' -g 'package.json' -g 'App.tsx'
```

Relevant output:

```text
Located App.tsx, apiConfig.ts, iconService.ts, useFestivalIcon.ts, AndroidManifest.xml, database.js, appIconModel.js, controller/tests/package.json. No AGENTS.md or actual .env returned.
```

### Early command 4

```powershell
& 'C:\Users\dell\AppData\Local\Android\Sdk\emulator\emulator.exe' '@Medium_Phone_API_36.1' -no-snapshot-load
```

Relevant output:

```text
Sandbox, exit 1: Unknown AVD name [Medium_Phone_API_36.1]; no ini found in sandbox HOME.
```

### Early command 5

```powershell
& 'C:\Users\dell\AppData\Local\Android\Sdk\emulator\emulator.exe' '@Medium_Phone_API_36.1' -no-snapshot-load -gpu swiftshader_indirect
```

Relevant output:

```text
Sandbox, exit 1: same Unknown AVD name error.
```

### Early command 6

```powershell
& 'C:\Users\dell\AppData\Local\Android\Sdk\emulator\emulator.exe' -list-avds
```

Relevant output:

```text
Sandbox, exit 0, no output.
```

### Early command 7

```powershell
Get-ChildItem Env: | Where-Object { $_.Name -in @('HOME','USERPROFILE','ANDROID_AVD_HOME','ANDROID_SDK_HOME','ANDROID_HOME') }; Get-PSDrive -PSProvider FileSystem; Get-CimInstance Win32_Processor | Select-Object Name,VirtualizationFirmwareEnabled,SecondLevelAddressTranslationExtensions; Get-CimInstance Win32_ComputerSystem | Select-Object HypervisorPresent; Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Component Based Servicing\Packages\*HypervisorPlatform*' -ErrorAction SilentlyContinue | Select-Object PSChildName,CurrentState
```

Relevant output:

```text
ANDROID_HOME=C:\Users\dell\AppData\Local\Android\Sdk; USERPROFILE=C:\Users\dell. Sandbox CIM: Access denied. Registry package CurrentState values 64 and 112; feature state not established.
```

### Early command 8

```powershell
Get-ChildItem 'C:\Users\dell\.android\avd' -ErrorAction SilentlyContinue; Get-ChildItem -Force -Filter AGENTS.md; Get-Content src/config/apiConfig.ts
```

Relevant output:

```text
Medium_Phone.avd and Medium_Phone_API_36.1.ini exist. No root AGENTS.md. Config: local environment; stale LAN=192.168.1.111, reverse=false, emulator=10.0.2.2, iOS simulator=localhost.
```

### Early command 9

```powershell
& 'C:\Users\dell\AppData\Local\Android\Sdk\emulator\emulator.exe' '@Medium_Phone_API_36.1' -no-snapshot-load
```

Relevant output:

```text
Outside sandbox, exit 1. AVD found; system checks passed; warning reading quickbootChoice.ini; x86_64 emulation requires hardware acceleration; Android Emulator hypervisor driver is not installed.
```

### Early command 10

```powershell
Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'" | Select-Object DeviceID,FreeSpace,Size; Get-CimInstance Win32_Processor | Select-Object Name,VirtualizationFirmwareEnabled,SecondLevelAddressTranslationExtensions; Get-CimInstance Win32_ComputerSystem | Select-Object HypervisorPresent; & 'C:\Users\dell\AppData\Local\Android\Sdk\emulator\emulator.exe' -accel-check
```

Relevant output:

```text
C: FreeSpace=65782349824 Size=255380369408. Select-Object combined formatting hid CPU fields; repeated separately next. accel: 6; Android Emulator hypervisor driver is not installed on this machine.
```

### Early command 11

```powershell
& 'C:\Users\dell\AppData\Local\Android\Sdk\emulator\emulator.exe' '@Medium_Phone_API_36.1' -no-snapshot-load -gpu swiftshader_indirect
```

Relevant output:

```text
Outside sandbox, exit 1: same hardware acceleration failure; software GPU does not remedy it.
```

### Early command 12

```powershell
Get-CimInstance Win32_Processor | Format-List Name,VirtualizationFirmwareEnabled,SecondLevelAddressTranslationExtensions; Get-CimInstance Win32_ComputerSystem | Format-List HypervisorPresent; Get-WindowsOptionalFeature -Online -FeatureName HypervisorPlatform | Format-List FeatureName,State; bcdedit /enum '{current}'
```

Relevant output:

```text
Intel Core i5-7300U; VirtualizationFirmwareEnabled=True; SecondLevelAddressTranslationExtensions=True; HypervisorPresent=False. Get-WindowsOptionalFeature: requested operation requires elevation. bcdedit: specified entry type invalid / parameter incorrect.
```

### Early command 13

```powershell
ipconfig; Get-Content src/server/config/database.js; Get-Content src/server/package.json; rg -n 'listen\(|0\.0\.0\.0|dotenv|useFestivalIcon|usesCleartextTraffic' src/server/index.js src/server/server.js App.tsx android/app src/hooks/useFestivalIcon.ts
```

Relevant output:

```text
Wi-Fi 2 IPv4=192.168.1.209/24 gateway=192.168.1.1. database.js uses dotenv and DB_* defaults localhost/root/rewardplanners_db. Backend entry=app.js. index.js/server.js absent. App.tsx hook import line 14/call line 41; manifest cleartext=true; debug placeholder=true.
```

### Early command 14

```powershell
Get-Content src/server/models/appIconModel.js; Get-Content src/services/iconService.ts; Get-Content android/app/src/main/java/com/rewardsplanners/icons/AppIconSwitcherModule.kt; Get-Content package.json
```

Relevant output:

```text
Read model, service, native switcher, package scripts. Resolver uses UTC_TIMESTAMP(3), active flag, priority. Service fetches /content/resolved/app-icon with platform and 2500ms timeout then calls bridge.setAppIcon. Native switcher maps default/navratri correctly, enables target first, modifies only aliases, DONT_KILL_APP. Package android/start scripts reference scripts/adb-reverse.js.
```

### Early command 15

```powershell
rg -n 'listen\(|HOST|dotenv|app-icon' src/server/app.js src/server/routes src/server/controllers/appIconController.js; Get-Content src/hooks/useFestivalIcon.ts; Get-Content android/app/src/main/AndroidManifest.xml; Get-Content 'C:\Users\dell\.android\avd\Medium_Phone.avd\config.ini' | Select-String 'hw.cpu|hw.gpu|disk|fastboot' ; Get-ChildItem -Force src/server -Filter '.env*' | Select-Object Name
```

Relevant output:

```text
app.js dotenv line 17/listen line 266. Public resolved route present. Hook refreshes when active/on foreground and warns [AppIcon] on error. Manifest aliases point to MainActivity; default enabled/navratri disabled. AVD: x86_64, 2 cores, GPU auto, data partition 6G. Only .env.zoho-sign.example exists.
```

### Early command 16

```powershell
Get-NetTCPConnection -State Listen -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object LocalAddress,LocalPort,OwningProcess; curl.exe --max-time 10 -sS 'http://localhost:5000/content/resolved/app-icon?platform=android'; Get-NetFirewallRule -Enabled True -Direction Inbound -Action Allow | Get-NetFirewallPortFilter | Where-Object { $_.Protocol -eq 'TCP' -and ($_.LocalPort -contains '5000' -or $_.LocalPort -contains 'Any') } | Select-Object InstanceID,Protocol,LocalPort
```

Relevant output:

```text
Listener :: 5000 PID 16904. HTTP: {"success":true,"data":{"platform":"android","icon_key":"navratri"}}. Get-NetFirewallRule: Access denied.
```

### Early command 17

```powershell
node -e 'const fs=require("fs"); const dotenv=require("dotenv"); for(const f of [".env","src/server/.env"]) { if(fs.existsSync(f)) {const e=dotenv.parse(fs.readFileSync(f)); console.log(f,JSON.stringify({DB_HOST:e.DB_HOST,DB_NAME:e.DB_NAME,PORT:e.PORT,HOST:e.HOST}));}}'
```

Relevant output:

```text
Exit 1: PowerShell/native quoting removed JavaScript quotes, SyntaxError: Unexpected token '.'. Corrected using a PowerShell here-string piped to node in later database commands.
```

## Captured command output

### Captured command 1

```powershell
Get-ChildItem -Force -Filter '.env*'; Get-ChildItem -Force src/server -Filter '.env*'; Get-CimInstance Win32_Process -Filter 'ProcessId=16904' | Select-Object ProcessId,ExecutablePath,CommandLine; netsh advfirewall firewall show rule name=all | Select-String -Pattern '5000' -Context 8,8; curl.exe --max-time 10 -sS 'http://192.168.1.209:5000/content/resolved/app-icon?platform=android'
```

Exit: 0

```text


    Directory: C:\Projects\RewardsPlanners\src\server


Mode                 LastWriteTime         Length Name                                                                 
----                 -------------         ------ ----                                                                 
-a----         10/7/2026  12:25 PM            611 .env.zoho-sign.example                                               

ProcessId      : 16904
ExecutablePath : C:\Program Files\nodejs\node.exe
CommandLine    : "C:\Program Files\nodejs\node.exe" app.js


IgnoreCase : True
LineNumber : 4769
Line       : LocalPort:                            
             7777,7778,7779,7780,7781,5004,5005,50004,50005,50006,50007,50008,50009,50010,50011,50012,50013
Filename   : InputStream
Path       : InputStream
Pattern    : 5000
Context    : Microsoft.PowerShell.Commands.MatchInfoContext
Matches    : {0}


IgnoreCase : True
LineNumber : 6099
Line       : LocalPort:                            5000-5020
Filename   : InputStream
Path       : InputStream
Pattern    : 5000
Context    : Microsoft.PowerShell.Commands.MatchInfoContext
Matches    : {0}

{"success":true,"data":{"platform":"android","icon_key":"navratri"}}


```

### Captured command 2

```powershell
Get-Content src/server/app.js | Select-Object -First 30; Get-Content src/server/app.js | Select-Object -Skip 255 -First 25; Get-Content src/server/controllers/appIconController.js; git diff -- src/config/apiConfig.ts
```

Exit: 0

```text
// app.js
const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");

// Initialize Quiz Game DB Tables
// const setupQuizDB = require("./config/setupQuizDB");
// const setupTodoReminderDB = require("./config/setupTodoReminderDB");
// setupQuizDB();
// setupTodoReminderDB();

require("dotenv").config();
require("./app/busboooking/config/productionSafety")
  .assertProductionConfiguration();
if (String(process.env.RUN_SCHEDULED_JOBS ?? "true").toLowerCase() === "true") {
  require("./services/ExpressBees/cron/shipmentCron");
  require("./services/Status/statusCleanupCron");
}
require("./services/Bbps/retryCron");
require("./services/Bbps/refundCron");
require("./services/Razorpay/retryCron");
require("./services/Maintenance/maintenanceCron");
require("./services/Razorpay/orderExpiryCron");
require("./services/Todo/todoReminderCron");
require("./services/Todo/birthdayReminderCron");
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
require("./app/chat/socket/chatSocket")(server, app, isAllowedOrigin);

server.listen(PORT, () => {
  console.log("\n=================================");
  console.log("Reward Planners Backend Started!");
  console.log(`ðŸ”— Server URL: http://localhost:${PORT}`);
  console.log(`Swagger docs at http://localhost:${PORT}/api-docs`);
  console.log(`Flea Market API ready at http://localhost:${PORT}`);
  console.log("CORS allowed origins (parsed):", allowedOrigins);
  console.log("=================================\n");

  // âœ… Start worker inside same process (only when enabled)
  if (process.env.START_WA_WORKER === "true") {
    require("./services/whatsapp/waWorker");
    console.log("âœ… WhatsApp worker started (START_WA_WORKER=true)");
  }
});
const model = require("../models/appIconModel");

const handler = (action, status = 200) => async (req, res) => {
  try {
    const data = await action(req);
    res.set("Cache-Control", "no-store");
    return res.status(status).json({ success: true, data });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
  resolve: handler((req) => model.resolve(req.query.platform)),
  keys: handler((req) => ({ platform: model.validatePlatform(req.query.platform), icon_keys: model.getIconKeys(req.query.platform) })),
  list: handler((req) => model.list(req.query.platform)),
  get: handler((req) => model.getById(req.params.id)),
  create: handler((req) => model.create(req.body), 201),
  update: handler((req) => model.update(req.params.id, req.body)),
  deactivate: handler((req) => model.deactivate(req.params.id)),
  delete: handler((req) => model.delete(req.params.id)),
};
warning: in the working copy of 'src/config/apiConfig.ts', LF will be replaced by CRLF the next time Git touches it
diff --git a/src/config/apiConfig.ts b/src/config/apiConfig.ts
index 9f1aa08..33abcef 100644
--- a/src/config/apiConfig.ts
+++ b/src/config/apiConfig.ts
@@ -20,7 +20,7 @@ const IS_LOCAL_ENVIRONMENT = isLocalEnvironment(API_ENVIRONMENT);
 // renewal, new Wi-Fi network, etc). Run `ipconfig` (Windows) / `ifconfig`
 // (Mac/Linux) to find it — physical devices need this because 'localhost'
 // on-device points back at the device itself, not your PC.
-export const LOCAL_API_HOST = '192.168.1.111';
+export const LOCAL_API_HOST = '192.168.1.209';
 
 // Physical Android devices should use the dev machine's LAN IP by default.
 // Set this to true only when `adb reverse tcp:5000 tcp:5000` is running.

```

### Captured command 3

```powershell
@'
const fs = require('fs');
const dotenv = require('dotenv');
for (const file of ['.env','../../.env']) {
  if (fs.existsSync(file)) {
    const env = dotenv.parse(fs.readFileSync(file));
    console.log('dotenv', file, { DB_HOST: env.DB_HOST, DB_NAME: env.DB_NAME });
  } else console.log('dotenv', file, 'absent');
}
console.log('effective target', { host: process.env.DB_HOST || 'localhost', database: process.env.DB_NAME || 'rewardplanners_db' });
const db = require('./config/database');
(async () => {
  try {
    const [identity] = await db.query('SELECT DATABASE() AS db, @@hostname AS server, @@port AS port, UTC_TIMESTAMP(3) AS utc_now');
    console.log('identity', JSON.stringify(identity));
    const [columns] = await db.query('SHOW COLUMNS FROM app_icon_campaigns');
    console.log('SHOW COLUMNS FROM app_icon_campaigns', JSON.stringify(columns));
    const [campaigns] = await db.query("SELECT * FROM app_icon_campaigns WHERE platform = 'android' ORDER BY priority DESC, id DESC");
    console.log('campaigns', JSON.stringify(campaigns));
  } catch (error) {console.error(error.message); process.exitCode = 1;}
  finally { await db.end(); }
})();
'@ | node
```

Exit: 0

```text
dotenv .env absent
dotenv ../../.env absent
effective target { host: 'localhost', database: 'rewardplanners_db' }
✅ Database connected successfully to rewardplanners_db
identity [{"db":"rewardplanners_db","server":"DESKTOP-7JB363H","port":3306,"utc_now":"2026-10-09 09:35:59.165"}]
SHOW COLUMNS FROM app_icon_campaigns [{"Field":"id","Type":"int(10) unsigned","Null":"NO","Key":"PRI","Default":null,"Extra":"auto_increment"},{"Field":"platform","Type":"enum('ios','android')","Null":"NO","Key":"MUL","Default":null,"Extra":""},{"Field":"icon_key","Type":"enum('default','diwali','eid','christmas','holi','independence_day','navratri','dasera')","Null":"NO","Key":"","Default":null,"Extra":""},{"Field":"starts_at","Type":"datetime(3)","Null":"NO","Key":"","Default":null,"Extra":""},{"Field":"ends_at","Type":"datetime(3)","Null":"NO","Key":"","Default":null,"Extra":""},{"Field":"priority","Type":"int(11)","Null":"NO","Key":"","Default":"0","Extra":""},{"Field":"is_active","Type":"tinyint(1)","Null":"NO","Key":"","Default":"1","Extra":""},{"Field":"created_at","Type":"timestamp","Null":"NO","Key":"","Default":"current_timestamp()","Extra":""},{"Field":"updated_at","Type":"timestamp","Null":"NO","Key":"","Default":"current_timestamp()","Extra":"on update current_timestamp()"}]
campaigns [{"id":6,"platform":"android","icon_key":"navratri","starts_at":"2026-10-08 11:12:23.346","ends_at":"2026-10-09 11:13:30.937","priority":1,"is_active":1,"created_at":"2026-10-08 16:43:42","updated_at":"2026-10-08 18:12:30"}]

```

### Captured command 4

```powershell
netsh advfirewall firewall show rule name=all verbose | Select-String -Pattern 'LocalPort:\s+5000-5020' -Context 15,8 | ForEach-Object { $_.ToString() }; & 'C:\Users\dell\AppData\Local\Android\Sdk\platform-tools\adb.exe' devices; Get-ChildItem android/app/build/intermediates -Recurse -Filter AndroidManifest.xml -ErrorAction SilentlyContinue | Where-Object { $_.FullName -match 'debug' } | Select-String 'usesCleartextTraffic'
```

Exit: 0

```text
  InterfaceTypes:                       Any
  Security:                             NotRequired
  Rule source:                          Local Setting
  Action:                               Allow
  
  Rule Name:                            @FirewallAPI.dll,-80206
  ----------------------------------------------------------------------
  Description:                          @FirewallAPI.dll,-80205
  Enabled:                              Yes
  Direction:                            In
  Profiles:                             Domain,Private,Public
  Grouping:                             @FirewallAPI.dll,-80200
  LocalIP:                              Any
  RemoteIP:                             LocalSubnet
  Protocol:                             UDP
> LocalPort:                            5000-5020
  RemotePort:                           Any
  Edge traversal:                       No
  Program:                              C:\Windows\system32\svchost.exe
  Service:                              FrameServer
  InterfaceTypes:                       Any
  Security:                             NotRequired
  Rule source:                          Local Setting
  Action:                               Allow
List of devices attached


android\app\build\intermediates\merged_manifest\debug\processDebugMainManifest\AndroidManifest.xml:111:        
android:usesCleartextTraffic="true" >
android\app\build\intermediates\merged_manifests\debug\processDebugManifest\AndroidManifest.xml:111:        
android:usesCleartextTraffic="true" >
android\app\build\intermediates\packaged_manifests\debug\processDebugManifestForPackage\AndroidManifest.xml:111:       
 android:usesCleartextTraffic="true" >



```

### Captured command 5

```powershell
netsh advfirewall firewall show rule name=all verbose | Select-String -Pattern '^\s*Rule Name:|^\s*Enabled:|^\s*Direction:|^\s*Protocol:|^\s*LocalPort:|^\s*Program:|^\s*Action:|^\s*Profiles:' | ForEach-Object { $_.Line } | Out-String -Stream | Select-Object -Last 120
```

Exit: 0

```text
Rule Name:                            Connected Devices Platform (TCP-In)
Enabled:                              Yes
Direction:                            In
Profiles:                             Domain,Private
Protocol:                             TCP
LocalPort:                            Any
Program:                              C:\Windows\system32\svchost.exe
Action:                               Allow
Rule Name:                            Connected Devices Platform (UDP-Out)
Enabled:                              Yes
Direction:                            Out
Profiles:                             Domain,Private
Protocol:                             UDP
LocalPort:                            Any
Program:                              C:\Windows\system32\svchost.exe
Action:                               Allow
Rule Name:                            Connected Devices Platform (UDP-In)
Enabled:                              Yes
Direction:                            In
Profiles:                             Domain,Private
Protocol:                             UDP
LocalPort:                            Any
Program:                              C:\Windows\system32\svchost.exe
Action:                               Allow
Rule Name:                            Windows Collaboration Computer Name Registration Service (SSDP-Out)
Enabled:                              No
Direction:                            Out
Profiles:                             Domain,Private,Public
Protocol:                             UDP
LocalPort:                            Any
Program:                              C:\Windows\system32\svchost.exe
Action:                               Allow
Rule Name:                            Windows Collaboration Computer Name Registration Service (SSDP-In)
Enabled:                              No
Direction:                            In
Profiles:                             Domain,Private,Public
Protocol:                             UDP
LocalPort:                            1900
Program:                              C:\Windows\system32\svchost.exe
Action:                               Allow
Rule Name:                            Windows Collaboration Computer Name Registration Service (PNRP-Out)
Enabled:                              No
Direction:                            Out
Profiles:                             Domain,Private,Public
Protocol:                             UDP
LocalPort:                            Any
Program:                              C:\Windows\system32\svchost.exe
Action:                               Allow
Rule Name:                            Windows Collaboration Computer Name Registration Service (PNRP-In)
Enabled:                              No
Direction:                            In
Profiles:                             Domain,Private,Public
Protocol:                             UDP
LocalPort:                            3540
Program:                              C:\Windows\system32\svchost.exe
Action:                               Allow
Rule Name:                            Delivery Optimization (UDP-In)
Enabled:                              Yes
Direction:                            In
Profiles:                             Domain,Private,Public
Protocol:                             UDP
LocalPort:                            7680
Program:                              C:\Windows\system32\svchost.exe
Action:                               Allow
Rule Name:                            Delivery Optimization (TCP-In)
Enabled:                              Yes
Direction:                            In
Profiles:                             Domain,Private,Public
Protocol:                             TCP
LocalPort:                            7680
Program:                              C:\Windows\system32\svchost.exe
Action:                               Allow
Rule Name:                            WFD Driver-only (UDP-Out)
Enabled:                              Yes
Direction:                            Out
Profiles:                             Domain,Private,Public
Protocol:                             UDP
LocalPort:                            Any
Program:                              System
Action:                               Allow
Rule Name:                            WFD Driver-only (UDP-In)
Enabled:                              Yes
Direction:                            In
Profiles:                             Domain,Private,Public
Protocol:                             UDP
LocalPort:                            Any
Program:                              System
Action:                               Allow
Rule Name:                            WFD Driver-only (TCP-Out)
Enabled:                              Yes
Direction:                            Out
Profiles:                             Domain,Private,Public
Protocol:                             TCP
LocalPort:                            Any
Program:                              System
Action:                               Allow
Rule Name:                            WFD Driver-only (TCP-In)
Enabled:                              Yes
Direction:                            In
Profiles:                             Domain,Private,Public
Protocol:                             TCP
LocalPort:                            Any
Program:                              System
Action:                               Allow
Rule Name:                            SNMP Trap Service (UDP In)
Enabled:                              No
Direction:                            In
Profiles:                             Domain
Protocol:                             UDP
LocalPort:                            162
Program:                              C:\Windows\system32\snmptrap.exe
Action:                               Allow
Rule Name:                            SNMP Trap Service (UDP In)
Enabled:                              No
Direction:                            In
Profiles:                             Private,Public
Protocol:                             UDP
LocalPort:                            162
Program:                              C:\Windows\system32\snmptrap.exe
Action:                               Allow

```

### Captured command 6

```powershell
@'
const db = require('./config/database');
(async () => {
  try {
    const [identity] = await db.query('SELECT DATABASE() AS db');
    if (identity[0].db !== 'rewardplanners_db' || !['localhost','127.0.0.1','::1'].includes(process.env.DB_HOST || 'localhost')) throw new Error('Unexpected database target');
    const [result] = await db.execute("INSERT INTO app_icon_campaigns (platform, icon_key, starts_at, ends_at, priority, is_active) VALUES ('android', 'navratri', UTC_TIMESTAMP(3) + INTERVAL 2 MINUTE, UTC_TIMESTAMP(3) + INTERVAL 5 MINUTE, 2, 1)");
    const [rows] = await db.execute('SELECT *, UTC_TIMESTAMP(3) AS utc_now FROM app_icon_campaigns WHERE id = ?', [result.insertId]);
    console.log('inserted campaign', JSON.stringify(rows));
  } catch (error) {console.error(error.message); process.exitCode = 1;}
  finally {await db.end();}
})();
'@ | node
```

Exit: 0

```text
✅ Database connected successfully to rewardplanners_db
inserted campaign [{"id":7,"platform":"android","icon_key":"navratri","starts_at":"2026-10-09 09:39:08.221","ends_at":"2026-10-09 09:42:08.221","priority":2,"is_active":1,"created_at":"2026-10-09 15:07:08","updated_at":"2026-10-09 15:07:08","utc_now":"2026-10-09 09:37:08.225"}]

```

### Captured command 7

```powershell
$rulesText = netsh advfirewall firewall show rule name=all verbose; $ruleBlocks = ($rulesText -join "`n") -split '(?m)(?=^Rule Name:)'; $matchingRules = $ruleBlocks | Where-Object { $_ -match '(?m)^Enabled:\s+Yes' -and $_ -match '(?m)^Direction:\s+In' -and $_ -match '(?m)^Action:\s+Allow' -and $_ -match '(?m)^Protocol:\s+TCP' -and ($_ -match '(?m)^LocalPort:\s+.*\b5000\b' -or ($_ -match '(?m)^LocalPort:\s+Any' -and $_ -match '(?im)^Program:\s+(Any|.*node\.exe)\s*$')) }; if ($matchingRules) { $matchingRules } else { 'No enabled inbound TCP 5000 or general Node/Any-program rule found.' }
```

Exit: 0

```text
Rule Name:                            Node.js JavaScript Runtime
----------------------------------------------------------------------
Description:                          Node.js JavaScript Runtime
Enabled:                              Yes
Direction:                            In
Profiles:                             Private
Grouping:                             
LocalIP:                              Any
RemoteIP:                             Any
Protocol:                             TCP
LocalPort:                            Any
RemotePort:                           Any
Edge traversal:                       Defer to user
Program:                              C:\program files\nodejs\node.exe
InterfaceTypes:                       Any
Security:                             NotRequired
Rule source:                          Local Setting
Action:                               Allow


Rule Name:                            Node.js JavaScript Runtime
----------------------------------------------------------------------
Description:                          Node.js JavaScript Runtime
Enabled:                              Yes
Direction:                            In
Profiles:                             Public
Grouping:                             
LocalIP:                              Any
RemoteIP:                             Any
Protocol:                             TCP
LocalPort:                            Any
RemotePort:                           Any
Edge traversal:                       Defer to user
Program:                              C:\program files\nodejs\node.exe
InterfaceTypes:                       Any
Security:                             NotRequired
Rule source:                          Local Setting
Action:                               Allow



```

### Captured command 8

```powershell
npx tsc --noEmit
```

Exit: running, session 84461

```text
(no output)
```

### Captured command 9

```powershell
Get-NetConnectionProfile | Select-Object InterfaceAlias,NetworkCategory; & 'C:\Users\dell\AppData\Local\Android\Sdk\platform-tools\adb.exe' reverse --list; Get-ChildItem 'C:\Users\dell\AppData\Local\Android\Sdk\extras\google\Android_Emulator_Hypervisor_Driver' -ErrorAction SilentlyContinue | Select-Object Name; rg -n 'AppIconSwitcher|NavratriIconAlias|useFestivalIcon' android/app/src/main/java App.tsx android/app/src/main/AndroidManifest.xml
```

Exit: 0

```text

error: no devices/emulators found
android/app/src/main/AndroidManifest.xml:168:            android:name=".icons.NavratriIconAlias"
App.tsx:14:import { useFestivalIcon } from './src/hooks/useFestivalIcon';
App.tsx:41:  useFestivalIcon();
android/app/src/main/java\com\rewardsplanners\MainApplication.kt:4:import com.rewardsplanners.icons.AppIconSwitcherPackage
android/app/src/main/java\com\rewardsplanners\MainApplication.kt:21:          add(AppIconSwitcherPackage())
android/app/src/main/java\com\rewardsplanners\icons\AppIconSwitcherPackage.kt:8:class AppIconSwitcherPackage : ReactPackage {
android/app/src/main/java\com\rewardsplanners\icons\AppIconSwitcherPackage.kt:10:    listOf(AppIconSwitcherModule(context))
android/app/src/main/java\com\rewardsplanners\icons\AppIconSwitcherModule.kt:10:class AppIconSwitcherModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
android/app/src/main/java\com\rewardsplanners\icons\AppIconSwitcherModule.kt:11:  override fun getName() = "AppIconSwitcherModule"
android/app/src/main/java\com\rewardsplanners\icons\AppIconSwitcherModule.kt:20:    "navratri" to ".icons.NavratriIconAlias",
InterfaceAlias NetworkCategory
-------------- ---------------
Wi-Fi 2                 Public
                              
                              
                              
                              
                              
                              
                              



```

### Captured command 10

```powershell
Poll npx tsc --noEmit (session 84461)
```

Exit: running, session 84461

```text
(no output)
```

### Captured command 11: Inside campaign 7 window (2026-10-09 09:40 UTC)

```powershell
curl.exe --max-time 10 -sS 'http://localhost:5000/content/resolved/app-icon?platform=android'
```

Exit: 0

```text
{"success":true,"data":{"platform":"android","icon_key":"navratri"}}
```

### Captured command 12

```powershell
Poll npx tsc --noEmit (session 84461)
```

Exit: 0

```text
(no output)
```

### Captured command 13: After campaign 7 window (2026-10-09 09:48 UTC)

```powershell
curl.exe --max-time 10 -sS 'http://localhost:5000/content/resolved/app-icon?platform=android'
```

Exit: 0

```text
{"success":true,"data":{"platform":"android","icon_key":"navratri"}}
```

### Captured command 14

```powershell
npx react-native run-android
```

Exit: running, session 36912

```text
info A dev server is already running for this project on port 8081.
info Launching emulator...

```

### Captured command 15

```powershell
Poll npx react-native run-android (session 36912)
```

Exit: running, session 36912

```text
error Failed to launch emulator. Reason: The emulator (Medium_Phone_API_36.1) quit before it finished opening. You can try starting the emulator manually from the terminal with: C:\Users\dell\AppData\Local\Android\Sdk/emulator/emulator @Medium_Phone_API_36.1.
warn Please launch an emulator manually or connect a device. Otherwise app may fail to launch.
info Installing the app...
> Task :gradle-plugin:settings-plugin:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :gradle-plugin:shared:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :gradle-plugin:shared:compileKotlin UP-TO-DATE
> Task :gradle-plugin:shared:compileJava NO-SOURCE
> Task :gradle-plugin:shared:processResources NO-SOURCE
> Task :gradle-plugin:shared:classes UP-TO-DATE
> Task :gradle-plugin:shared:jar UP-TO-DATE
> Task :gradle-plugin:settings-plugin:compileKotlin UP-TO-DATE
> Task :gradle-plugin:settings-plugin:compileJava NO-SOURCE
> Task :gradle-plugin:settings-plugin:pluginDescriptors UP-TO-DATE
> Task :gradle-plugin:settings-plugin:processResources UP-TO-DATE
> Task :gradle-plugin:settings-plugin:classes UP-TO-DATE
> Task :gradle-plugin:settings-plugin:jar UP-TO-DATE
> Task :gradle-plugin:react-native-gradle-plugin:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :gradle-plugin:react-native-gradle-plugin:compileKotlin UP-TO-DATE
> Task :gradle-plugin:react-native-gradle-plugin:compileJava NO-SOURCE
> Task :gradle-plugin:react-native-gradle-plugin:pluginDescriptors UP-TO-DATE
> Task :gradle-plugin:react-native-gradle-plugin:processResources UP-TO-DATE
> Task :gradle-plugin:react-native-gradle-plugin:classes UP-TO-DATE
> Task :gradle-plugin:react-native-gradle-plugin:jar UP-TO-DATE

> Configure project :notifee_react-native
:notifee_react-native @notifee/react-native found at C:\Projects\RewardsPlanners\node_modules\@notifee\react-native
:notifee_react-native package.json found at C:\Projects\RewardsPlanners\node_modules\@notifee\react-native\package.json
:notifee_react-native:version set from package.json: 9.1.8 (9,1,8 - 9001008)
:notifee_react-native:android.compileSdk using custom value: 36
:notifee_react-native:android.targetSdk using custom value: 36
:notifee_react-native:android.minSdk using custom value: 24
:notifee_react-native:reactNativeAndroidDir C:\Projects\RewardsPlanners\node_modules\react-native

> Configure project :react-native-firebase_app
:react-native-firebase_app package.json found at C:\Projects\RewardsPlanners\node_modules\@react-native-firebase\app\package.json
:react-native-firebase_app:firebase.bom using default value: 34.16.0
:react-native-firebase_app:play.play-services-auth using default value: 21.5.0
:react-native-firebase_app package.json found at C:\Projects\RewardsPlanners\node_modules\@react-native-firebase\app\package.json
:react-native-firebase_app:version set from package.json: 26.2.0 (26,2,0 - 26002000)
:react-native-firebase_app:android.compileSdk using custom value: 36
:react-native-firebase_app:android.targetSdk using custom value: 36
:react-native-firebase_app:android.minSdk using custom value: 24
:react-native-firebase_app:reactNativeAndroidDir C:\Projects\RewardsPlanners\node_modules\react-native

> Configure project :react-native-firebase_messaging
:react-native-firebase_messaging package.json found at C:\Projects\RewardsPlanners\node_modules\@react-native-firebase\messaging\package.json
:react-native-firebase_app package.json found at C:\Projects\RewardsPlanners\node_modules\@react-native-firebase\app\package.json
:react-native-firebase_messaging:firebase.bom using default value: 34.16.0
:react-native-firebase_messaging package.json found at C:\Projects\RewardsPlanners\node_modules\@react-native-firebase\messaging\package.json
:react-native-firebase_messaging:version set from package.json: 26.2.0 (26,2,0 - 26002000)
:react-native-firebase_messaging:android.compileSdk using custom value: 36
:react-native-firebase_messaging:android.targetSdk using custom value: 36
:react-native-firebase_messaging:android.minSdk using custom value: 24
:react-native-firebase_messaging:reactNativeAndroidDir C:\Projects\RewardsPlanners\node_modules\react-native

> Configure project :react-native-video
Kotlin version is correct: 2.1.20
AndroidX version is correct: 1.9.3
useExoplayerIMA: false
useExoplayerSmoothStreaming: true
useExoplayerDash: true
useExoplayerHls: true
useExoplayerRtsp: false
buildFromSource: false

> Task :app:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :app:generateAutolinkingNewArchitectureFiles UP-TO-DATE
> Task :app:generateAutolinkingPackageList UP-TO-DATE
> Task :app:generateCodegenSchemaFromJavaScript SKIPPED
> Task :app:generateCodegenArtifactsFromSchema SKIPPED
> Task :app:generateReactNativeEntryPoint UP-TO-DATE
> Task :d11_react-native-fast-image:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :d11_react-native-fast-image:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :d11_react-native-fast-image:preBuild UP-TO-DATE
> Task :notifee_react-native:preBuild UP-TO-DATE
> Task :react-native-async-storage_async-storage:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :react-native-async-storage_async-storage:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :react-native-async-storage_async-storage:preBuild UP-TO-DATE
> Task :react-native-biometrics:preBuild UP-TO-DATE
> Task :react-native-camera-roll_camera-roll:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :react-native-camera-roll_camera-roll:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :react-native-camera-roll_camera-roll:preBuild UP-TO-DATE
> Task :react-native-community_geolocation:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :react-native-community_geolocation:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :react-native-community_geolocation:preBuild UP-TO-DATE
> Task :react-native-community_netinfo:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :react-native-community_netinfo:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :react-native-community_netinfo:preBuild UP-TO-DATE
> Task :react-native-device-info:preBuild UP-TO-DATE
> Task :react-native-documents_picker:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :react-native-documents_picker:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :react-native-documents_picker:preBuild UP-TO-DATE
> Task :react-native-firebase_app:preBuild UP-TO-DATE
> Task :react-native-firebase_messaging:preBuild UP-TO-DATE
> Task :react-native-gesture-handler:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :react-native-gesture-handler:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :react-native-gesture-handler:preBuild UP-TO-DATE
> Task :react-native-health-connect:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :react-native-health-connect:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :react-native-health-connect:preBuild UP-TO-DATE
> Task :react-native-html-to-pdf:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :react-native-html-to-pdf:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :react-native-html-to-pdf:preBuild UP-TO-DATE
> Task :react-native-image-picker:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :react-native-image-picker:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :react-native-image-picker:preBuild UP-TO-DATE
> Task :react-native-linear-gradient:preBuild UP-TO-DATE
> Task :react-native-maps:preBuild UP-TO-DATE
> Task :react-native-masked-view_masked-view:preBuild UP-TO-DATE
> Task :react-native-permissions:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :react-native-permissions:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :react-native-permissions:preBuild UP-TO-DATE
> Task :react-native-razorpay:preBuild UP-TO-DATE

```

### Captured command 16

```powershell
& 'C:\Users\dell\AppData\Local\Android\Sdk\platform-tools\adb.exe' logcat -d -s ReactNativeJS | Select-String '\[AppIcon\]'
```

Exit: running, session 21537

```text
- waiting for device -

```

### Captured command 17

```powershell
Stop adb logcat waiting for a device (session 21537)
```

Exit: 1

```text
(no output)
```

### Captured command 18

```powershell
Poll npx react-native run-android (session 36912)
```

Exit: running, session 36912

```text
Warning: truncated output (original token count: 13008)
Total output lines: 768

> Task :react-native-reanimated:assertMinimalReactNativeVersionTask
> Task :react-native-reanimated:assertNewArchitectureEnabledTask SKIPPED
> Task :react-native-reanimated:assertWorkletsVersionTask
> Task :react-native-reanimated:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :react-native-reanimated:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :react-native-reanimated:prepareReanimatedHeadersForPrefabs UP-TO-DATE
> Task :react-native-reanimated:preBuild
> Task :react-native-safe-area-context:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :react-native-safe-area-context:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :react-native-safe-area-context:preBuild UP-TO-DATE
> Task :react-native-screens:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :react-native-screens:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :react-native-screens:preBuild UP-TO-DATE
> Task :react-native-send-intent:preBuild UP-TO-DATE
> Task :react-native-share:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :react-native-share:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :react-native-share:preBuild UP-TO-DATE
> Task :react-native-svg:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :react-native-svg:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :react-native-svg:preBuild UP-TO-DATE
> Task :react-native-vector-icons:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :react-native-vector-icons:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :react-native-vector-icons:preBuild UP-TO-DATE
> Task :react-native-video:preBuild UP-TO-DATE
> Task :react-native-view-shot:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :react-native-view-shot:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :react-native-view-shot:preBuild UP-TO-DATE
> Task :react-native-worklets:assertMinimalReactNativeVersionTask
> Task :react-native-worklets:assertNewArchitectureEnabledTask SKIPPED
> Task :react-native-worklets:generateCodegenSchemaFromJavaScript UP-TO-DATE
> Task :react-native-worklets:generateCodegenArtifactsFromSchema UP-TO-DATE
> Task :react-native-worklets:prepareWorkletsHeadersForPrefabs UP-TO-DATE
> Task :react-native-worklets:preBuild
> Task :app:preBuild
> Task :app:preDebugBuild
> Task :app:generateDebugBuildConfig UP-TO-DATE
> Task :d11_react-native-fast-image:preDebugBuild UP-TO-DATE
> Task :d11_react-native-fast-image:writeDebugAarMetadata UP-TO-DATE
> Task :notifee_react-native:preDebugBuild UP-TO-DATE
> Task :notifee_react-native:writeDebugAarMetadata UP-TO-DATE
> Task :react-native-async-storage_async-storage:preDebugBuild UP-TO-DATE
> Task :react-native-async-storage_async-storage:writeDebugAarMetadata UP-TO-DATE
> Task :react-native-biometrics:preDebugBuild UP-TO-DATE
> Task :react-native-biometrics:writeDebugAarMetadata UP-TO-DATE
> Task :react-native-camera-roll_camera-roll:preDebugBuild UP-TO-DATE
> Task :react-native-camera-roll_camera-roll:writeDebugAarMetadata UP-TO-DATE
> Task :react-native-community_geolocation:preDebugBuild UP-TO-DATE
> Task :react-native-community_geolocation:writeDebugAarMetadata UP-TO-DATE
> Task :react-native-community_netinfo:preDebugBuild UP-TO-DATE
> Task :react-native-community_netinfo:writeDebugAarMetadata UP-TO-DATE
> Task :react-native-device-info:preDebugBuild UP-TO-DATE
> Task :react-native-device-info:writeDebugAarMetadata UP-TO-DATE
> Task :react-native-documents_picker:preDebugBuild UP-TO-DATE
> Task :react-native-documents_picker:writeDebugAarMetadata UP-TO-DATE
> Task :react-native-firebase_…11208 tokens truncated… UP-TO-DATE
> Task :react-native-worklets:configureCMakeDebug[arm64-v8a]
> Task :react-native-worklets:buildCMakeDebug[arm64-v8a][worklets]
> Task :react-native-worklets:externalNativeBuildDebug
> Task :react-native-worklets:generateJsonModelDebug
> Task :react-native-worklets:prefabDebugConfigurePackage
> Task :react-native-reanimated:configureCMakeDebug[arm64-v8a]
> Task :react-native-reanimated:generateJsonModelDebug
> Task :react-native-reanimated:prefabDebugConfigurePackage UP-TO-DATE
> Task :app:configureCMakeDebug[arm64-v8a]
> Task :react-native-worklets:prefabDebugPackage UP-TO-DATE
> Task :react-native-reanimated:buildCMakeDebug[arm64-v8a][reanimated]
> Task :react-native-worklets:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-worklets:mergeDebugNativeLibs UP-TO-DATE
> Task :react-native-worklets:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-reanimated:externalNativeBuildDebug
> Task :react-native-reanimated:prefabDebugPackage UP-TO-DATE
> Task :app:buildCMakeDebug[arm64-v8a]
> Task :app:mergeDebugJniLibFolders UP-TO-DATE
> Task :d11_react-native-fast-image:mergeDebugJniLibFolders UP-TO-DATE
> Task :d11_react-native-fast-image:mergeDebugNativeLibs NO-SOURCE
> Task :d11_react-native-fast-image:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :notifee_react-native:mergeDebugJniLibFolders UP-TO-DATE
> Task :notifee_react-native:mergeDebugNativeLibs NO-SOURCE
> Task :notifee_react-native:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-async-storage_async-storage:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-async-storage_async-storage:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-async-storage_async-storage:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-biometrics:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-biometrics:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-biometrics:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-camera-roll_camera-roll:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-camera-roll_camera-roll:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-camera-roll_camera-roll:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-community_geolocation:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-community_geolocation:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-community_geolocation:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-community_netinfo:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-community_netinfo:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-community_netinfo:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-device-info:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-device-info:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-device-info:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-documents_picker:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-documents_picker:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-documents_picker:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-firebase_app:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-firebase_app:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-firebase_app:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-firebase_messaging:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-firebase_messaging:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-firebase_messaging:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-gesture-handler:configureCMakeDebug[arm64-v8a]

```

### Captured command 19

```powershell
Poll npx react-native run-android (session 36912)
```

Exit: 1

```text
> Task :react-native-gesture-handler:buildCMakeDebug[arm64-v8a]
> Task :react-native-gesture-handler:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-gesture-handler:mergeDebugNativeLibs UP-TO-DATE
> Task :react-native-gesture-handler:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-health-connect:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-health-connect:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-health-connect:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-html-to-pdf:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-html-to-pdf:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-html-to-pdf:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-image-picker:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-image-picker:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-image-picker:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-linear-gradient:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-linear-gradient:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-linear-gradient:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-maps:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-maps:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-maps:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-masked-view_masked-view:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-masked-view_masked-view:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-masked-view_masked-view:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-permissions:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-permissions:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-permissions:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-razorpay:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-razorpay:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-razorpay:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-reanimated:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-reanimated:mergeDebugNativeLibs UP-TO-DATE
> Task :react-native-reanimated:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-safe-area-context:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-safe-area-context:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-safe-area-context:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-screens:configureCMakeDebug[arm64-v8a]
> Task :react-native-screens:buildCMakeDebug[arm64-v8a]
> Task :react-native-screens:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-screens:mergeDebugNativeLibs UP-TO-DATE
> Task :react-native-screens:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-send-intent:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-send-intent:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-send-intent:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-share:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-share:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-share:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-svg:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-svg:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-svg:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-vector-icons:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-vector-icons:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-vector-icons:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-video:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-video:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-video:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :react-native-view-shot:mergeDebugJniLibFolders UP-TO-DATE
> Task :react-native-view-shot:mergeDebugNativeLibs NO-SOURCE
> Task :react-native-view-shot:copyDebugJniLibsProjectOnly UP-TO-DATE
> Task :app:mergeDebugNativeLibs UP-TO-DATE
> Task :app:stripDebugDebugSymbols UP-TO-DATE
> Task :app:validateSigningDebug UP-TO-DATE
> Task :app:writeDebugAppMetadata UP-TO-DATE
> Task :app:writeDebugSigningConfigVersions UP-TO-DATE
> Task :app:packageDebug UP-TO-DATE
> Task :app:createDebugApkListingFileRedirect UP-TO-DATE
> Task :app:installDebug FAILED

[Incubating] Problems report is available at: file:///C:/Projects/RewardsPlanners/android/build/reports/problems/problems-report.html

Deprecated Gradle features were used in this build, making it incompatible with Gradle 10.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/9.0.0/userguide/command_line_interface.html#sec:command_line_warnings in the Gradle documentation.
703 actionable tasks: 17 executed, 686 up-to-date

info 💡 Tip: Make sure that you have set up your development environment correctly, by running npx react-native doctor. To read more about doctor command visit: https://github.com/react-native-community/cli/blob/main/packages/cli-doctor/README.md#doctor 


FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':app:installDebug'.
> com.android.builder.testing.api.DeviceException: No connected devices!

* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to generate a Build Scan (Powered by Develocity).
> Get more help at https://help.gradle.org.

BUILD FAILED in 50s
error Failed to install the app. Make sure you have an Android emulator running or a device connected.
info Run CLI with --verbose flag for more details.

```

### Captured command 20

```powershell
@'
const db = require('./config/database');
(async () => {
  try {
    const [rows] = await db.query("SELECT id, icon_key, starts_at, ends_at, is_active, starts_at <= UTC_TIMESTAMP(3) AND ends_at >= UTC_TIMESTAMP(3) AS in_window, UTC_TIMESTAMP(3) AS utc_now FROM app_icon_campaigns WHERE id IN (6,7)");
    console.log(JSON.stringify(rows));
    console.log('local resolver', JSON.stringify(await require('./models/appIconModel').resolve('android')));
  } catch (error) {console.error(error.message); process.exitCode = 1;}
  finally {await db.end();}
})();
'@ | node
```

Exit: 0

```text
[{"id":6,"icon_key":"navratri","starts_at":"2026-10-08 11:12:23.346","ends_at":"2026-10-09 11:13:30.937","is_active":1,"in_window":1,"utc_now":"2026-10-09 09:50:35.608"},{"id":7,"icon_key":"navratri","starts_at":"2026-10-09 09:39:08.221","ends_at":"2026-10-09 09:42:08.221","is_active":1,"in_window":0,"utc_now":"2026-10-09 09:50:35.608"}]
✅ Database connected successfully to rewardplanners_db
local resolver {"platform":"android","icon_key":"navratri"}

```

### Captured command 21

```powershell
git diff --check; git diff -- src/config/apiConfig.ts; git status --short
```

Exit: 0

```text
diff --git a/src/config/apiConfig.ts b/src/config/apiConfig.ts
index 9f1aa08..006d432 100644
--- a/src/config/apiConfig.ts
+++ b/src/config/apiConfig.ts
@@ -20,11 +20,11 @@ const IS_LOCAL_ENVIRONMENT = isLocalEnvironment(API_ENVIRONMENT);
 // renewal, new Wi-Fi network, etc). Run `ipconfig` (Windows) / `ifconfig`
 // (Mac/Linux) to find it — physical devices need this because 'localhost'
 // on-device points back at the device itself, not your PC.
-export const LOCAL_API_HOST = '192.168.1.111';
+export const LOCAL_API_HOST = '192.168.1.209';
 
 // Physical Android devices should use the dev machine's LAN IP by default.
 // Set this to true only when `adb reverse tcp:5000 tcp:5000` is running.
-export const USE_ADB_REVERSE_FOR_ANDROID_PHYSICAL = false;
+export const USE_ADB_REVERSE_FOR_ANDROID_PHYSICAL = true;
 
 // Resolve the right local host per target automatically:
 // - Android emulator: 10.0.2.2 is the AVD's alias for the host machine.
 M src/config/apiConfig.ts
?? android-icon-diagnosis.md

```

## Final results

Inside the test window: navratri. After it: navratri, because campaign 6 remains active by explicit user instruction. Campaign 7 is expired, confirmed by in_window=0. npx tsc --noEmit exited 0. git diff --check exited 0. run-android built/packageDebug successfully but installDebug failed: No connected devices! (703 actionable tasks: 17 executed, 686 up-to-date.) Existing Metro was detected on port 8081; no app was installed to produce runtime success logs. adb logcat waited for a device and was interrupted. Request success on an Android device and setAppIcon('navratri') cannot be confirmed from this run.

The ADB reverse flag was false at the beginning of this task and changed to true outside my edits during testing. The final git diff above includes that concurrent change; my app-code edit is only the LAN IP. With true, a physical phone requires adb reverse tcp:5000 tcp:5000 after connection. Emulator routing remains 10.0.2.2 regardless of this flag.

Files authored by this task: src/config/apiConfig.ts (LAN IP line only) and android-icon-diagnosis.md (new diagnostic document, all its content is added). The full tracked config diff is shown in the final captured command above. No pre-existing changes were reverted.

Root cause: the emulator has no usable hardware acceleration, leaving ADB without a device; the earlier icon network failures came from unreachable local API addressing (loopback without reverse or a stale LAN IP).


