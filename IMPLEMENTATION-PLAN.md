# Better Shot Native - Implementation Plan

**Goal:** Native macOS screenshot app with forensic capabilities  
**Stack:** Swift 6, SwiftUI, ScreenCaptureKit, SwiftPM (no Xcode)  
**Target:** macOS 14+ (Sonoma)  

---

## Project Structure

```
~/projects/better-shot-native/
├── Package.swift
├── version.env
├── README.md
├── LICENSE
├── Scripts/
│   ├── compile_and_run.sh
│   ├── package_app.sh
│   ├── sign-and-notarize.sh
│   └── build_icon.sh
├── Resources/
│   ├── Assets.xcassets/
│   ├── Backgrounds/
│   ├── Gradients/
│   ├── Sounds/
│   ├── Info.plist
│   └── BetterShot.entitlements
├── Sources/
│   └── BetterShot/
│       ├── BetterShotApp.swift
│       ├── AppDelegate.swift
│       ├── Models/
│       ├── ViewModels/
│       ├── Services/
│       ├── Views/
│       └── Extensions/
└── Tests/
    └── BetterShotTests/
```

---

## User Stories & Tasks

### 🏗️ Epic: Project Foundation

#### Story: Developer can build and run the app
> As a developer, I want to bootstrap the project so that I can start building features.

- [ ] Create project directory at `~/projects/better-shot-native/`
- [ ] Create `Package.swift` with Swift 6, macOS 14 target
- [ ] Add HotKey dependency for global shortcuts
- [ ] Create `version.env` with APP_NAME, BUNDLE_ID, VERSION
- [ ] Create minimal `BetterShotApp.swift` entry point
- [ ] Create `AppDelegate.swift` for lifecycle management
- [ ] Copy build scripts from macos-spm-app-packaging skill
- [ ] Verify `swift build` succeeds
- [ ] Verify `./Scripts/compile_and_run.sh` launches app

---

### 📸 Epic: Screenshot Capture

#### Story: User can capture a region of the screen
> As a user, I want to select a region of my screen to capture so that I only get the part I need.

- [ ] Create `ScreenCaptureService.swift`
- [ ] Implement permission check via `SCShareableContent`
- [ ] Create `RegionSelectionService.swift` for overlay window
- [ ] Create `RegionSelectionOverlay.swift` SwiftUI view
- [ ] Implement drag gesture to define selection rectangle
- [ ] Show size indicator (width × height) during selection
- [ ] Support ESC to cancel selection
- [ ] Capture selected region via `SCScreenshotManager`
- [ ] Support Retina displays (2x scaling)
- [ ] Play capture sound on success

#### Story: User can capture the entire screen
> As a user, I want to capture my full screen with one action.

- [ ] Implement `captureDisplay()` in ScreenCaptureService
- [ ] Handle multi-monitor setups (capture primary display)
- [ ] Open editor after capture

#### Story: User can capture a specific window
> As a user, I want to capture a single window without background clutter.

- [ ] Create `WindowPickerView.swift` to list available windows
- [ ] Filter out tiny windows and own app windows
- [ ] Show window thumbnails with app name
- [ ] Implement `captureWindow()` using `SCContentFilter`
- [ ] Capture window without shadow (clean edges)

---

### 🎨 Epic: Editor

#### Story: User can view and edit the captured screenshot
> As a user, I want an editor to adjust my screenshot before saving.

- [ ] Create `EditorView.swift` with HSplitView layout
- [ ] Create `CanvasView.swift` for screenshot preview
- [ ] Implement checkerboard pattern for transparency
- [ ] Support zoom (pinch gesture / scroll)
- [ ] Support pan (drag gesture)
- [ ] Create `PropertiesSidebar.swift` for all controls
- [ ] Create `EditorViewModel.swift` for state management

#### Story: User can copy screenshot to clipboard
> As a user, I want to quickly copy my edited screenshot.

- [ ] Implement `copyToClipboard()` in EditorViewModel
- [ ] Add toolbar button with keyboard shortcut (⌘C)
- [ ] Show confirmation feedback

#### Story: User can save screenshot to disk
> As a user, I want to save my screenshot as a file.

- [ ] Implement save panel with format selection
- [ ] Support PNG, JPEG, TIFF formats
- [ ] Auto-generate filename with timestamp
- [ ] Remember last save directory

---

### 🖼️ Epic: Backgrounds

#### Story: User can choose a solid color background
> As a user, I want to place my screenshot on a clean colored background.

- [ ] Create `BackgroundPreset.swift` model
- [ ] Define preset colors (transparent, white, black, gray)
- [ ] Create `SolidColorGrid.swift` component
- [ ] Create `BackgroundPreviewCell.swift` for selection UI
- [ ] Apply selected background in ImageProcessor

#### Story: User can choose a gradient background
> As a user, I want beautiful gradient backgrounds like mesh gradients.

- [ ] Add 8 gradient mesh images to Resources
- [ ] Create `GradientGrid.swift` component
- [ ] Load gradient images from bundle
- [ ] Apply gradient as background layer

#### Story: User can choose a wallpaper background
> As a user, I want to use wallpaper images as backgrounds.

- [ ] Add wallpaper images to Resources (asset-13 to asset-30)
- [ ] Add Mac asset images (mac-asset-3 to mac-asset-10)
- [ ] Create `WallpaperGrid.swift` component
- [ ] Display wallpaper thumbnails in grid

#### Story: User can pick a custom color
> As a user, I want to use any color I choose.

- [ ] Add ColorPicker to BackgroundSelectorView
- [ ] Store custom color in EditorSettings
- [ ] Apply custom color as background

---

### ✨ Epic: Effects

#### Story: User can blur the background
> As a user, I want to blur the background for a frosted glass effect.

- [ ] Add `backgroundBlur` slider (0-100) to EffectsPanel
- [ ] Implement Gaussian blur via CIFilter
- [ ] Apply blur only to background, not screenshot

#### Story: User can add noise to the background
> As a user, I want subtle noise texture on my background.

- [ ] Add `backgroundNoise` slider (0-100) to EffectsPanel
- [ ] Generate noise using CIRandomGenerator
- [ ] Blend noise with background at selected opacity

#### Story: User can add shadow to the screenshot
> As a user, I want a drop shadow to make my screenshot pop.

- [ ] Create `ShadowControls.swift` component
- [ ] Add shadow enable/disable toggle
- [ ] Add blur radius slider (0-100)
- [ ] Add X/Y offset sliders (-50 to 50)
- [ ] Add opacity slider (0-100%)
- [ ] Render shadow using CIDropShadow or manual composition

#### Story: User can round the screenshot corners
> As a user, I want rounded corners on my screenshot.

- [ ] Create `RoundnessSlider.swift` component
- [ ] Add border radius slider (0-50)
- [ ] Apply rounded rect mask to screenshot
- [ ] Show square/circle icons at slider ends

#### Story: User can adjust padding around the screenshot
> As a user, I want to control whitespace around my screenshot.

- [ ] Add padding slider (0-200) to sidebar
- [ ] Apply padding when compositing layers

---

### ✏️ Epic: Annotations

#### Story: User can draw shapes on the screenshot
> As a user, I want to highlight areas with circles and rectangles.

- [ ] Create `Annotation.swift` protocol and models
- [ ] Create `CircleAnnotation`, `RectangleAnnotation` structs
- [ ] Create `AnnotationToolbar.swift` with tool buttons
- [ ] Create `AnnotationCanvas.swift` overlay
- [ ] Implement drag gesture to draw shapes
- [ ] Render shapes with fill and stroke colors

#### Story: User can draw arrows and lines
> As a user, I want to point at things with arrows.

- [ ] Create `LineAnnotation`, `ArrowAnnotation` structs
- [ ] Implement arrow head rendering
- [ ] Support configurable stroke width

#### Story: User can add text labels
> As a user, I want to add text explanations to my screenshot.

- [ ] Create `TextAnnotation` struct
- [ ] Show text input field on placement
- [ ] Support font size adjustment
- [ ] Support text color selection

#### Story: User can add numbered markers
> As a user, I want to add step numbers (1, 2, 3...) to my screenshot.

- [ ] Create `NumberAnnotation` struct
- [ ] Auto-increment number for each new marker
- [ ] Render as filled circle with white number

#### Story: User can select and modify annotations
> As a user, I want to move, resize, and delete annotations.

- [ ] Implement selection mode (pointer tool)
- [ ] Show selection handles on selected annotation
- [ ] Support drag to move
- [ ] Support handle drag to resize
- [ ] Support Delete key to remove
- [ ] Implement Undo/Redo stack

---

### 🔒 Epic: Forensic Features

#### Story: User can enable forensic mode
> As an investigator, I want forensic metadata on my evidence screenshots.

- [ ] Create `ForensicSettings.swift` model
- [ ] Create `ForensicSettingsTab.swift` in Settings
- [ ] Add master toggle for forensic mode
- [ ] Persist settings via @AppStorage

#### Story: Screenshots show UTC timestamp
> As an investigator, I need proof of when evidence was captured.

- [ ] Add timestamp toggle in forensic settings
- [ ] Support ISO 8601 format (2026-01-12T20:30:00Z)
- [ ] Support readable format (2026-01-12 20:30:00 UTC)
- [ ] Always use UTC timezone

#### Story: Screenshots show investigator name and case ID
> As an investigator, I need to identify who captured evidence and for which case.

- [ ] Add investigator name field in settings
- [ ] Add case/project ID field in settings
- [ ] Display in forensic bar overlay

#### Story: Screenshots include cryptographic hash
> As an investigator, I need to prove the image wasn't tampered with.

- [ ] Create `ForensicService.swift`
- [ ] Implement SHA-256 hash computation
- [ ] Support SHA-512 and MD5 options
- [ ] **Compute hash from ORIGINAL image before overlay**
- [ ] Display truncated hash in forensic bar
- [ ] Support showing full hash

#### Story: Forensic bar renders at bottom of image
> As an investigator, I want all metadata visible in a professional bar.

- [ ] Create `ForensicBarView.swift`
- [ ] Design bar: dark background (85% opacity)
- [ ] Use monospace font (SF Mono)
- [ ] Layout: Name → Case ID → Timestamp → Hash
- [ ] Append bar to bottom of final image

#### Story: Evidence metadata exports as JSON
> As an investigator, I need machine-readable evidence records.

- [ ] Create `EvidenceMetadata` struct
- [ ] Include: filename, algorithm, hash, timestamp, investigator, case ID
- [ ] Include: app version, bundle ID
- [ ] Export `.evidence.json` alongside image file

---

### 📜 Epic: Scrolling Screenshots

#### Story: User can capture full-length web pages
> As a user, I want to capture entire web pages that extend beyond the viewport.

- [ ] Create `ScrollingCaptureService.swift`
- [ ] Implement scroll-to-top via keyboard event (⌘Home)
- [ ] Implement incremental scroll via CGEvent
- [ ] Capture frame after each scroll
- [ ] Detect end of page (duplicate frame hash)
- [ ] Create `ScrollingCaptureProgress.swift` UI
- [ ] Show progress bar during capture
- [ ] Show frame preview thumbnails
- [ ] Support cancel operation

#### Story: Captured frames stitch into seamless image
> As a user, I want scrolling captures to look like one continuous image.

- [ ] Implement overlap detection between frames
- [ ] Calculate Y offset for each frame
- [ ] Create output image with total height
- [ ] Composite frames at calculated positions
- [ ] Handle edge cases (short pages, no scroll)

---

### 🎯 Epic: Menu Bar & Hotkeys

#### Story: App runs in menu bar
> As a user, I want quick access from the menu bar without dock clutter.

- [ ] Configure app as LSUIElement (no dock icon)
- [ ] Create MenuBarExtra with camera.viewfinder icon
- [ ] Create `MenuBarView.swift` dropdown
- [ ] Show capture options in dropdown
- [ ] Show recent screenshots list
- [ ] Add Preferences link
- [ ] Add Quit option

#### Story: User can trigger captures with global hotkeys
> As a user, I want to capture screenshots with keyboard shortcuts even when the app isn't focused.

- [ ] Create `HotkeyService.swift`
- [ ] Register ⌘⇧2 for region capture
- [ ] Register ⌘⇧3 for screen capture
- [ ] Register ⌘⇧4 for window capture
- [ ] Register ⌘⇧5 for scrolling capture
- [ ] Hotkeys work when app is in background

---

### ⚙️ Epic: Settings & Persistence

#### Story: User can configure general preferences
> As a user, I want to customize app behavior.

- [ ] Create `AppSettings.swift` model
- [ ] Create `GeneralSettingsTab.swift`
- [ ] Add save directory picker
- [ ] Add default format selector (PNG/JPEG/TIFF)
- [ ] Add "copy to clipboard after capture" toggle
- [ ] Add "play capture sound" toggle
- [ ] Add "launch at login" toggle (SMAppService)

#### Story: User can customize keyboard shortcuts
> As a user, I want to change the default hotkeys.

- [ ] Create `HotkeySettingsTab.swift`
- [ ] Display current shortcuts
- [ ] Add "Reset to Defaults" button
- [ ] (Bonus) Support recording custom shortcuts

#### Story: Settings persist across app restarts
> As a user, I expect my preferences to be remembered.

- [ ] Use @AppStorage for simple values
- [ ] Use JSON encoding for complex settings
- [ ] Load settings on app launch
- [ ] Save settings on change

---

### 📦 Epic: Packaging & Distribution

#### Story: App can be packaged as .app bundle
> As a developer, I want to create a proper macOS app bundle.

- [ ] Create `Info.plist` with all required keys
- [ ] Create `BetterShot.entitlements`
- [ ] Update `package_app.sh` for this project
- [ ] Compile Assets.xcassets with actool
- [ ] Copy resources to bundle
- [ ] Sign with ad-hoc signature for dev

#### Story: App has proper icon
> As a user, I want a nice app icon.

- [ ] Design app icon (camera viewfinder theme)
- [ ] Create AppIcon.appiconset with all sizes
- [ ] Verify icon shows in Finder and Dock

#### Story: App can be distributed as DMG
> As a developer, I want to create a DMG for distribution.

- [ ] Create `create_dmg.sh` script
- [ ] Generate DMG with app bundle
- [ ] (Bonus) Add Applications symlink for drag-install

#### Story: App is code-signed and notarized
> As a developer, I want the app to run without Gatekeeper warnings.

- [ ] Set up Developer ID certificate
- [ ] Update `sign-and-notarize.sh`
- [ ] Sign app bundle
- [ ] Submit for notarization
- [ ] Staple notarization ticket

---

## Code Templates

### Package.swift

```swift
// swift-tools-version:6.0
import PackageDescription

let package = Package(
    name: "BetterShot",
    platforms: [.macOS(.v14)],
    products: [
        .executable(name: "BetterShot", targets: ["BetterShot"])
    ],
    dependencies: [
        .package(url: "https://github.com/soffes/HotKey.git", from: "0.2.0"),
    ],
    targets: [
        .executableTarget(
            name: "BetterShot",
            dependencies: ["HotKey"],
            path: "Sources/BetterShot",
            resources: [.process("Resources")],
            swiftSettings: [.swiftLanguageMode(.v6)]
        )
    ]
)
```

### version.env

```bash
APP_NAME="Better Shot"
BUNDLE_ID="com.cyberheld.bettershot"
VERSION="1.0.0"
BUILD_NUMBER="1"
MIN_OS="14.0"
```

### BetterShotApp.swift

```swift
import SwiftUI

@main
struct BetterShotApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    
    var body: some Scene {
        MenuBarExtra("Better Shot", systemImage: "camera.viewfinder") {
            MenuBarView()
        }
        .menuBarExtraStyle(.window)
        
        WindowGroup("Editor", id: "editor", for: UUID.self) { $screenshotId in
            EditorView(screenshotId: screenshotId)
        }
        .windowStyle(.hiddenTitleBar)
        
        Settings {
            SettingsView()
        }
    }
}
```

### ScreenCaptureService.swift

```swift
import ScreenCaptureKit

@MainActor
final class ScreenCaptureService: ObservableObject {
    @Published var availableDisplays: [SCDisplay] = []
    @Published var availableWindows: [SCWindow] = []
    
    func checkPermission() async -> Bool {
        do {
            let content = try await SCShareableContent.excludingDesktopWindows(false, onScreenWindowsOnly: true)
            availableDisplays = content.displays
            availableWindows = content.windows.filter { $0.isOnScreen && $0.frame.width > 100 }
            return true
        } catch {
            return false
        }
    }
    
    func captureRegion(_ rect: CGRect, on display: SCDisplay) async throws -> CGImage {
        let filter = SCContentFilter(display: display, excludingWindows: [])
        let config = SCStreamConfiguration()
        config.sourceRect = rect
        config.width = Int(rect.width * 2)
        config.height = Int(rect.height * 2)
        return try await SCScreenshotManager.captureImage(contentFilter: filter, configuration: config)
    }
}
```

### ForensicService.swift

```swift
import CryptoKit

@MainActor
final class ForensicService {
    func computeHash(of image: CGImage, algorithm: HashAlgorithm) -> String {
        guard let data = image.pngData else { return "" }
        switch algorithm {
        case .sha256:
            return SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
        case .sha512:
            return SHA512.hash(data: data).map { String(format: "%02x", $0) }.joined()
        case .md5:
            return Insecure.MD5.hash(data: data).map { String(format: "%02x", $0) }.joined()
        }
    }
    
    func currentTimestamp() -> String {
        let formatter = ISO8601DateFormatter()
        formatter.timeZone = TimeZone(identifier: "UTC")
        return formatter.string(from: Date())
    }
}
```

### Info.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDisplayName</key>
    <string>Better Shot</string>
    <key>CFBundleIdentifier</key>
    <string>com.cyberheld.bettershot</string>
    <key>CFBundleVersion</key>
    <string>1</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>14.0</string>
    <key>LSUIElement</key>
    <true/>
    <key>NSScreenCaptureUsageDescription</key>
    <string>Better Shot needs screen recording permission to capture screenshots.</string>
</dict>
</plist>
```

---

## Progress Tracking

### Summary

| Epic | Total Tasks | Completed |
|------|-------------|-----------|
| Project Foundation | 9 | 0 |
| Screenshot Capture | 14 | 0 |
| Editor | 11 | 0 |
| Backgrounds | 13 | 0 |
| Effects | 14 | 0 |
| Annotations | 17 | 0 |
| Forensic Features | 18 | 0 |
| Scrolling Screenshots | 12 | 0 |
| Menu Bar & Hotkeys | 12 | 0 |
| Settings & Persistence | 13 | 0 |
| Packaging & Distribution | 12 | 0 |
| **Total** | **145** | **0** |

---

## Quick Start

```bash
# Create project
mkdir -p ~/projects/better-shot-native && cd ~/projects/better-shot-native

# Bootstrap (ask Lana)
# "Lana, create the Better Shot project skeleton"

# Build
swift build

# Run
./Scripts/compile_and_run.sh
```

---

*Document Version: 2.0*  
*Author: Lana 🐧*
