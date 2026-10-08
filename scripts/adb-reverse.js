const { spawnSync } = require('child_process');
const { existsSync } = require('fs');
const os = require('os');
const path = require('path');

// Resolve adb even when Android Studio's platform-tools are not on PATH.
const executable = process.platform === 'win32' ? 'adb.exe' : 'adb';
const sdkRoots = [
  process.env.ANDROID_HOME,
  process.env.ANDROID_SDK_ROOT,
  process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
  path.join(os.homedir(), 'Library', 'Android', 'sdk'),
  path.join(os.homedir(), 'Android', 'Sdk'),
].filter(Boolean);
const adb = sdkRoots
  .map(root => path.join(root, 'platform-tools', executable))
  .find(candidate => existsSync(candidate)) || executable;

const devices = spawnSync(adb, ['devices'], { encoding: 'utf8' });
if (devices.error || devices.status !== 0) {
  console.warn('[adb reverse] adb unavailable. Connect Android and forward ports 5000 and 8081 before using the local API.');
} else {
  const serials = devices.stdout.split(/\r?\n/)
    .map(line => line.match(/^(\S+)\s+device\s*$/)?.[1])
    .filter(Boolean);

  if (!serials.length) {
    console.warn('[adb reverse] No authorized Android device connected. Run this script again after connecting your device.');
  }

  for (const serial of serials) {
    for (const port of [5000, 8081]) {
      const result = spawnSync(adb, ['-s', serial, 'reverse', `tcp:${port}`, `tcp:${port}`], { encoding: 'utf8' });
      if (result.error || result.status !== 0) {
        console.warn(`[adb reverse] Failed to forward port ${port} on ${serial}: ${result.error?.message || result.stderr}`);
      } else {
        console.log(`[adb reverse] ${serial}: port ${port} forwarded`);
      }
    }
  }
}
