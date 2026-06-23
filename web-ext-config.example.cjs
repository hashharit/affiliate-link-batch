/** @type {import('web-ext').Config} */
module.exports = {
  sourceDir: ".",
  ignoreFiles: [
    "*.htm",
    "*_files/**",
    "docs/**",
    "web-ext-artifacts/**",
    "web-ext-config.cjs",
  ],
  run: {
    // Windows: "C:\\Program Files\\Mozilla Firefox\\firefox.exe"
    // macOS: "/Applications/Firefox.app/Contents/MacOS/firefox"
    // Linux: "firefox"
    firefox: "firefox",
    startUrl: ["https://www.amazon.in/s?k=power+bank"],
    // Optional — close all Firefox windows before web-ext run:
    // firefoxProfile: "default-release",
    // keepProfileChanges: true,
    args: ["-no-remote"],
  },
};