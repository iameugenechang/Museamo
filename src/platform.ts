import { Capacitor } from "@capacitor/core";
import type { DesktopInfo } from "./sync";

export type Platform = "android" | "ios" | "desktop" | "preview";
declare global { interface Window { __TAURI_INTERNALS__?: unknown } }
function detectPlatform(): Platform {
  const nativePlatform = Capacitor.getPlatform();
  if (nativePlatform === "android" || nativePlatform === "ios") return nativePlatform;
  if (nativePlatform !== "web") throw new Error(`Unsupported native platform: ${nativePlatform}`);
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window ? "desktop" : "preview";
}
export const platform = detectPlatform();
export const isCapacitorNative = platform === "android" || platform === "ios";
export const isPreview = platform === "preview";
export const isDesktop = platform === "desktop";
interface PlatformCapabilities {
  nativeCapture: boolean;
  widgets: boolean;
  automaticLocation: boolean;
  manageTagSharing: boolean;
}
const platformCapabilities: Record<Platform, PlatformCapabilities> = {
  android: { nativeCapture: true, widgets: true, automaticLocation: true, manageTagSharing: true },
  // Enable iOS integrations individually when their native implementations are available.
  ios: { nativeCapture: false, widgets: false, automaticLocation: false, manageTagSharing: false },
  desktop: { nativeCapture: false, widgets: false, automaticLocation: false, manageTagSharing: false },
  preview: { nativeCapture: false, widgets: false, automaticLocation: true, manageTagSharing: true },
};
export const capabilities = platformCapabilities[platform];

export type DesktopRuntimeState =
  | { status: "loading" }
  | { status: "ready"; info: DesktopInfo }
  | { status: "error"; message: string };

export const previewDesktopInfo: DesktopInfo = { os: "preview", startupSupported: false, windowControls: "custom", closeBehavior: "quit" };

/** A failed or incompatible native response must never become browser preview state. */
export function readNativeDesktopInfo(value: unknown): DesktopInfo {
  if (typeof value !== "object" || value === null) throw new Error("Desktop information is unavailable.");
  const info = value as Record<string, unknown>;
  if ((info.os !== "windows" && info.os !== "macos" && info.os !== "linux")
    || typeof info.startupSupported !== "boolean"
    || (info.windowControls !== "native" && info.windowControls !== "custom")
    || (info.closeBehavior !== "background" && info.closeBehavior !== "quit")) {
    throw new Error("The installed app returned incompatible desktop information.");
  }
  return { os: info.os, startupSupported: info.startupSupported, windowControls: info.windowControls, closeBehavior: info.closeBehavior };
}

export function desktopName(info: DesktopInfo): string {
  return { windows: "Windows", macos: "macOS", linux: "Linux", preview: "Desktop preview" }[info.os];
}

export function desktopCloseDescription(info: DesktopInfo): string {
  if (info.os === "preview") return "Window controls in the browser preview do not control an installed app.";
  if (info.closeBehavior === "quit") return "Closing the window quits Museamo and stops syncing. Reopen Museamo to resume syncing.";
  if (info.os === "macos") return "Closing the window keeps Museamo running so linked devices can sync. Reopen it from the Dock. Choose Quit Museamo from the app menu or press Command+Q to stop it.";
  return "Closing the window keeps Museamo in the system tray so linked devices can sync. Reopen it from the tray. Choose Quit from the tray menu to stop it.";
}

export function shortcutModifier(info: DesktopInfo, previewPlatform = typeof navigator === "undefined" ? "" : navigator.platform): "Command" | "Ctrl" {
  return info.os === "macos" || (info.os === "preview" && /Mac|iPhone|iPad|iPod/.test(previewPlatform)) ? "Command" : "Ctrl";
}

type ShortcutEvent = Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey" | "repeat" | "isComposing" | "defaultPrevented">;
export function desktopShortcut(event: ShortcutEvent, info: DesktopInfo, previewPlatform?: string): "compose" | "search" | undefined {
  const modifierPressed = shortcutModifier(info, previewPlatform) === "Command" ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
  if (!modifierPressed || event.altKey || event.shiftKey || event.repeat || event.isComposing || event.defaultPrevented) return;
  if (event.key.toLowerCase() === "n") return "compose";
  if (event.key.toLowerCase() === "f") return "search";
}
