// Config plugin for expo-flic2. The published expo-flic2@0.5.0 ships its plugin source but not the
// compiled build/plugin its app.plugin.js requires, so this is an equivalent local copy
// (same Info.plist keys, background mode and Android permissions as expo-flic2/plugin/src/index.ts).
const { withAndroidManifest, withInfoPlist } = require('expo/config-plugins');

const ANDROID_PERMISSIONS = [
  { 'android:name': 'android.permission.BLUETOOTH', 'android:maxSdkVersion': '30' },
  { 'android:name': 'android.permission.BLUETOOTH_ADMIN', 'android:maxSdkVersion': '30' },
  { 'android:name': 'android.permission.BLUETOOTH_SCAN', 'android:usesPermissionFlags': 'neverForLocation' },
  { 'android:name': 'android.permission.BLUETOOTH_CONNECT' },
  { 'android:name': 'android.permission.ACCESS_FINE_LOCATION', 'android:maxSdkVersion': '30' },
];

module.exports = function withFlic2(config, props = {}) {
  const usage = props.bluetoothPermission || 'This app uses Bluetooth to connect to Flic buttons.';
  config = withInfoPlist(config, (c) => {
    c.modResults.NSBluetoothAlwaysUsageDescription = usage;
    c.modResults.NSBluetoothPeripheralUsageDescription = usage;
    const modes = c.modResults.UIBackgroundModes || [];
    if (!modes.includes('bluetooth-central')) modes.push('bluetooth-central');
    c.modResults.UIBackgroundModes = modes;
    return c;
  });
  config = withAndroidManifest(config, (c) => {
    const manifest = c.modResults.manifest;
    manifest['uses-permission'] = manifest['uses-permission'] || [];
    for (const attrs of ANDROID_PERMISSIONS) {
      if (!manifest['uses-permission'].some((p) => p.$ && p.$['android:name'] === attrs['android:name'])) {
        manifest['uses-permission'].push({ $: attrs });
      }
    }
    return c;
  });
  return config;
};
