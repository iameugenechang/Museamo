import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Tag } from "./data";

const runtime = vi.hoisted(() => ({
  platform: "web",
  registerPlugin: vi.fn(),
  desktopBridge: vi.fn(),
  native: { library: vi.fn() },
  desktop: { library: vi.fn() },
}));
vi.mock("@capacitor/core", () => ({
  Capacitor: { getPlatform: () => runtime.platform },
  registerPlugin: runtime.registerPlugin,
}));
vi.mock("./desktop", () => ({ desktopBridge: runtime.desktopBridge }));

beforeEach(() => {
  vi.resetModules();
  runtime.platform = "web";
  runtime.registerPlugin.mockReset().mockReturnValue(runtime.native);
  runtime.desktopBridge.mockReset().mockReturnValue(runtime.desktop);
  runtime.native.library.mockReset().mockResolvedValue({ tags: [], profiles: [] });
});
afterEach(() => vi.unstubAllGlobals());

describe("Capacitor platform routing", () => {
  it.each(["android", "ios"])("routes %s to the native Museamo plugin", async nativePlatform => {
    runtime.platform = nativePlatform;
    const platform = await import("./platform");
    const { bridge, isNative } = await import("./data");
    expect(platform.platform).toBe(nativePlatform);
    expect(platform.isPreview).toBe(false);
    expect(platform.isDesktop).toBe(false);
    expect(isNative).toBe(true);
    expect(bridge).toBe(runtime.native);
    expect(runtime.registerPlugin).toHaveBeenCalledExactlyOnceWith("Museamo");
    expect(runtime.desktopBridge).not.toHaveBeenCalled();
  });

  it.each(["android", "ios"])("preserves %s native failures instead of using preview data", async nativePlatform => {
    runtime.platform = nativePlatform;
    const failure = new Error("Native library unavailable");
    runtime.native.library.mockRejectedValue(failure);
    const { bridge } = await import("./data");
    await expect(bridge.library()).rejects.toBe(failure);
    expect(runtime.native.library).toHaveBeenCalledOnce();
  });

  it("keeps a mobile browser in preview mode", async () => {
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (iPhone)", platform: "iPhone" });
    const { platform, isPreview, isCapacitorNative } = await import("./platform");
    const { bridge } = await import("./data");
    expect(platform).toBe("preview");
    expect(isPreview).toBe(true);
    expect(isCapacitorNative).toBe(false);
    expect((await bridge.library()).tags.length).toBeGreaterThan(0);
    expect(runtime.registerPlugin).not.toHaveBeenCalled();
    expect(runtime.desktopBridge).not.toHaveBeenCalled();
  });

  it("keeps Tauri on the desktop bridge", async () => {
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
    const { platform, isDesktop, isCapacitorNative } = await import("./platform");
    const { bridge } = await import("./data");
    expect(platform).toBe("desktop");
    expect(isDesktop).toBe(true);
    expect(isCapacitorNative).toBe(false);
    expect(bridge).toBe(runtime.desktop);
    expect(runtime.desktopBridge).toHaveBeenCalledOnce();
    expect(runtime.registerPlugin).not.toHaveBeenCalled();
  });

  it("uses the explicit Capacitor platform before checking desktop markers", async () => {
    runtime.platform = "ios";
    vi.stubGlobal("window", { __TAURI_INTERNALS__: {} });
    const { platform } = await import("./platform");
    expect(platform).toBe("ios");
  });

  it("rejects an unknown platform instead of opening a preview library", async () => {
    runtime.platform = "unknown-native";
    await expect(import("./data")).rejects.toThrow("Unsupported native platform");
    expect(runtime.registerPlugin).not.toHaveBeenCalled();
    expect(runtime.desktopBridge).not.toHaveBeenCalled();
  });
});

describe("platform feature availability", () => {
  it("enables implemented iOS features without enabling unfinished native integrations", async () => {
    runtime.platform = "ios";
    const { capabilities } = await import("./platform");
    expect(capabilities).toEqual({
      nativeCapture: false, widgets: false, automaticLocation: false, manualLocation: true,
      location: true, media: true, backups: false, sync: true, sharing: true, recovery: true,
    });
  });

  it("preserves Android capture, widgets, location and sharing management", async () => {
    runtime.platform = "android";
    const { capabilities } = await import("./platform");
    expect(capabilities).toEqual({
      nativeCapture: true, widgets: true, automaticLocation: true, manualLocation: true,
      location: true, media: true, backups: true, sync: true, sharing: true, recovery: true,
    });
  });

  it.each(["android", "ios", "web"])("renders sharing actions according to %s capabilities", async nativePlatform => {
    runtime.platform = nativePlatform;
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { JoinSharedTag, TagSharingSettings } = await import("./components/Sharing");
    const tag: Tag = { id: "tag", name: "Ideas", type: "standard" };
    const settings = renderToStaticMarkup(<TagSharingSettings tag={tag} changed={async () => {}} close={() => {}} />);
    const join = renderToStaticMarkup(<JoinSharedTag joined={async () => {}} />);
    expect(settings).toContain("Share hashtag");
    expect(join).toContain("Join shared hashtag");
    const shared = renderToStaticMarkup(<TagSharingSettings
      tag={{ ...tag, sharing: { collectionId: "collection", role: "owner", status: "waiting" } }}
      changed={async () => {}} close={() => {}}
    />);
    expect(shared).toContain("Shared hashtag");
    expect(shared).toContain("Invite someone");
    expect(shared).toContain("Stop sharing");
  });

  it("omits Android widgets, location setup and desktop startup settings on iOS", async () => {
    runtime.platform = "ios";
    const { renderToStaticMarkup } = await import("react-dom/server");
    const { Settings } = await import("./components/Settings");
    const html = renderToStaticMarkup(<Settings library={{ tags: [], profiles: [] }}
      report={() => {}} run={async action => { await action(); }} refresh={() => {}}
    />);
    expect(html).not.toContain("<h2>Widgets</h2>");
    expect(html).not.toContain("Automatically save location");
    expect(html).not.toContain("Start Museamo when I sign in");
    expect(html).not.toContain("Preview tools");
  });
});
