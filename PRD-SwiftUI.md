# Better Shot - Native macOS SwiftUI PRD

## Product Requirements Document

**Version:** 1.0  
**Date:** 2026-01-12  
**Status:** Draft  
**Target:** macOS 14+ (Sonoma)  

---

## Executive Summary

### Why Native macOS Instead of Tauri?

Die Entscheidung für eine native macOS App mit SwiftUI anstelle der bestehenden Tauri/React-Lösung basiert auf mehreren kritischen Faktoren:

| Aspekt | Tauri (aktuell) | Native SwiftUI |
|--------|-----------------|----------------|
| **Screenshot-Qualität** | Shell-Calls zu `screencapture` | ScreenCaptureKit mit voller API-Kontrolle |
| **Scrolling Screenshots** | Nicht implementiert, komplex | Native Accessibility API Integration |
| **App-Größe** | ~80-120 MB (Webview + Assets) | ~5-15 MB |
| **Performance** | Webview-Overhead | Native Metal-Rendering |
| **System-Integration** | Limiert durch IPC | Volle macOS API-Zugang |
| **Permissions** | Umständliches Handling | Native TCC-Integration |
| **Wartbarkeit** | Rust + React + Tauri Plugins | Ein Tech-Stack (Swift) |
| **Distribution** | Notarization-Probleme | Native App Store ready |

### Kern-Argumente für Native

1. **ScreenCaptureKit**: Ab macOS 12.3 bietet Apple eine moderne Screenshot-API mit Window/App-Filtering, Live-Preview und HDR-Support - nicht erreichbar via `screencapture` CLI

2. **Scrolling Screenshots**: Die geplante Forensik-Feature (Scrolling Capture) benötigt Accessibility APIs für programmatisches Scrolling - in Swift direkt integrierbar

3. **Menu Bar App**: Native `NSStatusItem` ist performanter und zuverlässiger als Tauris Tray-Implementierung

4. **Forensik-Features**: SHA-256 Hashing, Timestamp-Overlay und Evidence-Export sind in Swift mit CryptoKit und Core Graphics effizienter

---

## Feature-Analyse aus bestehendem Tauri Code

### Core Screenshot Features

Aus der Analyse von `src-tauri/src/commands.rs` und `src/App.tsx`:

| Feature | Tauri Implementation | SwiftUI Equivalent |
|---------|---------------------|-------------------|
| Region Capture | `screencapture -i` | ScreenCaptureKit + Region Selection UI |
| Fullscreen Capture | `screencapture` | `SCScreenshotManager.capturePrimaryDisplay()` |
| Window Capture | `screencapture -w` | `SCShareableContent.windows` + Selection |
| Sound Playback | `afplay` | `NSSound.play()` oder AudioToolbox |
| Clipboard Copy | osascript | `NSPasteboard.general` |
| Multi-Monitor | `xcap` crate | `NSScreen.screens` + ScreenCaptureKit |

### Editor Features (aus ImageEditor.tsx)

```
┌─────────────────────────────────────────────────────────────────┐
│                         Editor Window                            │
├─────────────────────────────────────────────────────────────────┤
│ [Cancel]                Edit Screenshot    [📋 Copy] [💾 Save]   │
├─────────────────────────────────────────────────────────────────┤
│ Annotation Toolbar:                                              │
│ [Select] [Circle] [Rectangle] [Line] [Arrow] [Text] [Number]    │
├────────────────────┬────────────────────────────────────────────┤
│                    │                                             │
│  Properties Panel  │          Canvas Preview                     │
│  ────────────────  │                                             │
│  Background:       │    ┌─────────────────────────┐             │
│  [█][█][█][▒][🎨]  │    │                         │             │
│                    │    │     Screenshot mit      │             │
│  Gradients:        │    │     Background          │             │
│  [🌈][🌈][🌈][🌈]  │    │                         │             │
│  [🌈][🌈][🌈][🌈]  │    └─────────────────────────┘             │
│                    │                                             │
│  Wallpapers:       │                                             │
│  [📷][📷][📷][📷]  │                                             │
│                    │                                             │
│  Effects:          │                                             │
│  Blur: ────●─────  │                                             │
│  Noise: ──●──────  │                                             │
│                    │                                             │
│  Shadow:           │                                             │
│  Blur: ────●─────  │                                             │
│  Offset X: ─●────  │                                             │
│  Offset Y: ──●───  │                                             │
│  Opacity: ───●───  │                                             │
│                    │                                             │
│  Roundness:        │                                             │
│  ──────●─────      │                                             │
│                    │                                             │
└────────────────────┴────────────────────────────────────────────┘
```

### Background Options

Aus `BackgroundSelector.tsx` und `useEditorSettings.ts`:

**Solid Colors:**
- Transparent (Schachbrett-Muster)
- White (#FFFFFF)
- Black (#000000)
- Gray (#F5F5F5)
- Custom Color Picker

**Gradient Meshes (8 Presets):**
```swift
enum GradientPreset: String, CaseIterable {
    case mesh1  // #667eea → #764ba2
    case mesh2  // #0093E9 → #80D0C7
    case mesh3  // #f093fb → #f5576c
    case mesh4  // #11998e → #38ef7d
    case mesh5  // #fa709a → #fee140
    case mesh6  // #2E3192 → #1BFFFF
    case mesh7  // #ffecd2 → #fcb69f
    case mesh8  // #0f0c29 → #24243e
}
```

**Image Backgrounds (17 Assets):**
- 10 Wallpapers (asset-13 bis asset-30)
- 7 Mac Assets (mac-asset-3 bis mac-asset-10)

### Effects System

```swift
struct EditorEffects {
    var backgroundBlur: CGFloat = 0       // 0-100 px
    var backgroundNoise: CGFloat = 0       // 0-100 %
    var screenshotBorderRadius: CGFloat = 18  // px
    
    struct Shadow {
        var blur: CGFloat = 20             // 0-100 px
        var offsetX: CGFloat = 0           // -50 to 50 px
        var offsetY: CGFloat = 10          // -50 to 50 px
        var opacity: CGFloat = 0.3         // 0-100 %
    }
}
```

### Annotation System

Aus `types/annotations.ts`:

```swift
enum AnnotationTool: String {
    case select
    case circle
    case rectangle
    case line
    case arrow
    case text
    case number
}

protocol Annotation: Identifiable {
    var id: UUID { get }
    var position: CGPoint { get set }
    var fillColor: Color { get set }
    var fillOpacity: Double { get set }
    var borderWidth: CGFloat { get set }
    var borderColor: Color { get set }
}

struct CircleAnnotation: Annotation {
    var radius: CGFloat
}

struct RectangleAnnotation: Annotation {
    var size: CGSize
}

struct LineAnnotation: Annotation {
    var endPoint: CGPoint
    var lineType: LineType  // straight, curved
    var controlPoints: [CGPoint]?
}

struct ArrowAnnotation: Annotation {
    var endPoint: CGPoint
    var lineType: LineType
    var arrowType: ArrowType  // thin, thick, none
}

struct TextAnnotation: Annotation {
    var text: String
    var fontSize: CGFloat
    var fontFamily: String
    var size: CGSize
}

struct NumberAnnotation: Annotation {
    var number: Int
    var radius: CGFloat
}
```

### Preferences System

Aus `PreferencesPage.tsx`:

```swift
struct AppSettings: Codable {
    var saveDirectory: URL = FileManager.default.urls(for: .desktopDirectory, in: .userDomainMask)[0]
    var copyToClipboard: Bool = true
    var autoApplyBackground: Bool = false
    var defaultBackgroundImage: String? = nil
    
    var keyboardShortcuts: [KeyboardShortcut] = [
        KeyboardShortcut(id: "region", action: "Capture Region", 
                        key: "2", modifiers: [.command, .shift], enabled: true),
        KeyboardShortcut(id: "fullscreen", action: "Capture Screen",
                        key: "3", modifiers: [.command, .shift], enabled: false),
        KeyboardShortcut(id: "window", action: "Capture Window",
                        key: "4", modifiers: [.command, .shift], enabled: false)
    ]
}
```

---

## Native macOS APIs

### 1. ScreenCaptureKit (Screenshots)

```swift
import ScreenCaptureKit

@MainActor
final class ScreenshotService {
    
    /// Capture a specific screen region
    func captureRegion(_ rect: CGRect, on display: SCDisplay) async throws -> CGImage {
        let filter = SCContentFilter(display: display, excludingWindows: [])
        let config = SCStreamConfiguration()
        config.width = Int(rect.width)
        config.height = Int(rect.height)
        config.sourceRect = rect
        config.capturesAudio = false
        config.showsCursor = false
        
        return try await SCScreenshotManager.captureImage(
            contentFilter: filter,
            configuration: config
        )
    }
    
    /// Capture a specific window
    func captureWindow(_ window: SCWindow) async throws -> CGImage {
        let filter = SCContentFilter(desktopIndependentWindow: window)
        let config = SCStreamConfiguration()
        config.capturesAudio = false
        config.showsCursor = false
        
        return try await SCScreenshotManager.captureImage(
            contentFilter: filter,
            configuration: config
        )
    }
    
    /// List available windows for selection
    func listWindows() async throws -> [SCWindow] {
        let content = try await SCShareableContent.excludingDesktopWindows(
            false,
            onScreenWindowsOnly: true
        )
        return content.windows.filter { $0.isOnScreen && $0.frame.width > 100 }
    }
}
```

### 2. Accessibility API (Scrolling Screenshots)

```swift
import ApplicationServices

@MainActor
final class ScrollingCaptureService {
    
    func captureScrollingContent(in window: SCWindow) async throws -> [CGImage] {
        var frames: [CGImage] = []
        
        // Get AXUIElement for the window
        let app = AXUIElementCreateApplication(window.owningApplication?.processID ?? 0)
        
        var scrollArea: AXUIElement?
        // ... find scroll area in window hierarchy
        
        // Capture frames while scrolling
        while !isAtEnd {
            let frame = try await captureWindow(window)
            frames.append(frame)
            
            // Scroll down
            try performScroll(on: scrollArea, by: scrollStep)
            try await Task.sleep(for: .milliseconds(300))
        }
        
        return frames
    }
    
    private func performScroll(on element: AXUIElement?, by amount: CGFloat) throws {
        // Create scroll event
        let scrollEvent = CGEvent(
            scrollWheelEvent2Source: nil,
            units: .pixel,
            wheelCount: 1,
            wheel1: Int32(-amount),
            wheel2: 0,
            wheel3: 0
        )
        scrollEvent?.post(tap: .cghidEventTap)
    }
}
```

### 3. SwiftUI Views

```swift
import SwiftUI

struct EditorView: View {
    @State private var screenshotImage: NSImage?
    @State private var settings = EditorSettings()
    @State private var annotations: [any Annotation] = []
    @State private var selectedTool: AnnotationTool = .select
    
    var body: some View {
        HSplitView {
            // Left Sidebar - Properties
            SidebarView(settings: $settings)
                .frame(width: 280)
            
            // Main Canvas
            CanvasView(
                image: screenshotImage,
                settings: settings,
                annotations: $annotations,
                selectedTool: selectedTool
            )
        }
        .toolbar {
            ToolbarItemGroup {
                AnnotationToolbar(selectedTool: $selectedTool)
            }
            
            ToolbarItemGroup(placement: .confirmationAction) {
                Button(action: copyToClipboard) {
                    Image(systemName: "doc.on.doc")
                }
                Button(action: save) {
                    Image(systemName: "square.and.arrow.down")
                }
            }
        }
    }
}

struct SidebarView: View {
    @Binding var settings: EditorSettings
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                BackgroundSection(settings: $settings)
                GradientsSection(settings: $settings)
                WallpapersSection(settings: $settings)
                EffectsSection(settings: $settings)
                ShadowSection(settings: $settings)
                RoundnessSection(settings: $settings)
            }
            .padding()
        }
    }
}
```

### 4. SwiftData Persistence

```swift
import SwiftData

@Model
final class CaptureHistory {
    var id: UUID
    var timestamp: Date
    var imagePath: URL
    var hash: String?
    var label: String?
    var caseId: String?
    
    init(imagePath: URL) {
        self.id = UUID()
        self.timestamp = Date()
        self.imagePath = imagePath
    }
}

@Model
final class UserPreferences {
    @Attribute(.unique) var id: String = "default"
    var saveDirectory: String
    var copyToClipboard: Bool
    var autoApplyBackground: Bool
    var defaultBackgroundAssetId: String?
    var shortcuts: Data?  // Encoded KeyboardShortcuts
    
    // Forensic Settings
    var forensicEnabled: Bool = false
    var showTimestamp: Bool = false
    var timestampFormat: String = "ISO8601"
    var investigatorName: String = ""
    var caseId: String = ""
    var hashAlgorithm: String = "SHA256"
}
```

---

## Architektur

### MVVM Pattern mit Swift 6 Concurrency

```
┌──────────────────────────────────────────────────────────────────┐
│                           App Layer                               │
├──────────────────────────────────────────────────────────────────┤
│  BetterShotApp.swift                                             │
│  ├── @main App struct                                            │
│  ├── MenuBarExtra (NSStatusItem)                                 │
│  ├── WindowGroup (Editor)                                        │
│  └── Settings (Preferences)                                      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                          View Layer                               │
├──────────────────────────────────────────────────────────────────┤
│  Views/                                                           │
│  ├── MainView.swift          - Landing/Status Screen             │
│  ├── EditorView.swift        - Screenshot Editor                 │
│  ├── PreferencesView.swift   - Settings                          │
│  ├── RegionSelectorView.swift - Overlay for region selection     │
│  └── Components/                                                  │
│      ├── BackgroundSelector.swift                                │
│      ├── GradientGrid.swift                                      │
│      ├── EffectsPanel.swift                                      │
│      ├── AnnotationToolbar.swift                                 │
│      └── CanvasView.swift                                        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       ViewModel Layer                             │
├──────────────────────────────────────────────────────────────────┤
│  ViewModels/                                                      │
│  ├── EditorViewModel.swift     @Observable                       │
│  ├── CaptureViewModel.swift    @Observable                       │
│  └── SettingsViewModel.swift   @Observable                       │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Service Layer                              │
├──────────────────────────────────────────────────────────────────┤
│  Services/                                                        │
│  ├── ScreenshotService.swift    - ScreenCaptureKit Wrapper       │
│  ├── ClipboardService.swift     - NSPasteboard Operations        │
│  ├── ImageProcessor.swift       - Core Graphics Rendering        │
│  ├── ForensicService.swift      - Hash, Timestamp, Overlay       │
│  ├── ScrollingCapture.swift     - Accessibility-based Scrolling  │
│  └── HotkeyService.swift        - Global Shortcut Registration   │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                         Model Layer                               │
├──────────────────────────────────────────────────────────────────┤
│  Models/                                                          │
│  ├── Screenshot.swift           - Captured Image Data            │
│  ├── EditorSettings.swift       - Editor State                   │
│  ├── Annotation.swift           - Annotation Protocol + Types    │
│  ├── ForensicMetadata.swift     - Evidence Data                  │
│  └── AppSettings.swift          - User Preferences               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Persistence Layer                           │
├──────────────────────────────────────────────────────────────────┤
│  ├── SwiftData ModelContainer   - CaptureHistory, Preferences    │
│  └── @AppStorage               - Simple Settings                 │
└──────────────────────────────────────────────────────────────────┘
```

### Package.swift (SwiftPM, kein Xcode Projekt)

```swift
// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "BetterShot",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(name: "BetterShot", targets: ["BetterShot"])
    ],
    dependencies: [
        // Keine externen Dependencies für Core-Features
    ],
    targets: [
        .executableTarget(
            name: "BetterShot",
            dependencies: [],
            path: "Sources/BetterShot",
            resources: [
                .process("Resources/Assets.xcassets"),
                .process("Resources/Backgrounds"),
                .process("Resources/Gradients"),
                .copy("Resources/Sounds")
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("StrictConcurrency")
            ]
        ),
        .testTarget(
            name: "BetterShotTests",
            dependencies: ["BetterShot"],
            path: "Tests"
        )
    ]
)
```

### Directory Structure

```
BetterShot/
├── Package.swift
├── Sources/
│   └── BetterShot/
│       ├── BetterShotApp.swift
│       ├── Views/
│       │   ├── MainView.swift
│       │   ├── EditorView.swift
│       │   ├── PreferencesView.swift
│       │   ├── RegionSelectorWindow.swift
│       │   └── Components/
│       │       ├── BackgroundSelector.swift
│       │       ├── GradientGrid.swift
│       │       ├── AssetGrid.swift
│       │       ├── EffectsPanel.swift
│       │       ├── ShadowPanel.swift
│       │       ├── RoundnessSlider.swift
│       │       ├── AnnotationToolbar.swift
│       │       ├── AnnotationCanvas.swift
│       │       └── PropertiesPanel.swift
│       ├── ViewModels/
│       │   ├── EditorViewModel.swift
│       │   ├── CaptureViewModel.swift
│       │   └── SettingsViewModel.swift
│       ├── Services/
│       │   ├── ScreenshotService.swift
│       │   ├── ClipboardService.swift
│       │   ├── ImageProcessor.swift
│       │   ├── ForensicService.swift
│       │   ├── ScrollingCaptureService.swift
│       │   └── HotkeyService.swift
│       ├── Models/
│       │   ├── Screenshot.swift
│       │   ├── EditorSettings.swift
│       │   ├── Annotation.swift
│       │   ├── BackgroundPreset.swift
│       │   ├── ForensicMetadata.swift
│       │   └── AppSettings.swift
│       ├── Utilities/
│       │   ├── ImageExtensions.swift
│       │   ├── ColorExtensions.swift
│       │   └── FileManager+Extensions.swift
│       └── Resources/
│           ├── Assets.xcassets/
│           │   ├── AppIcon.appiconset/
│           │   └── MenuBarIcon.imageset/
│           ├── Backgrounds/
│           │   ├── Wallpapers/
│           │   └── MacAssets/
│           ├── Gradients/
│           │   └── mesh1-8.webp
│           └── Sounds/
│               └── capture.aif
├── Tests/
│   └── BetterShotTests/
│       ├── ScreenshotServiceTests.swift
│       ├── ImageProcessorTests.swift
│       └── ForensicServiceTests.swift
└── Scripts/
    ├── build.sh
    ├── package-app.sh
    └── notarize.sh
```

---

## Forensic Features (aus PRD.md)

### 1. UTC Timestamp Overlay

```swift
import CryptoKit

struct ForensicOverlay {
    var timestamp: Date = Date()
    var format: TimestampFormat = .iso8601
    var position: OverlayPosition = .bottomLeft
    var fontSize: CGFloat = 14
    var textColor: NSColor = .white
    var backgroundColor: NSColor = NSColor.black.withAlphaComponent(0.85)
    
    enum TimestampFormat: String, CaseIterable {
        case iso8601 = "%Y-%m-%dT%H:%M:%SZ"
        case readable = "%Y-%m-%d %H:%M:%S UTC"
        case custom
    }
}

extension Date {
    var utcISO8601String: String {
        let formatter = ISO8601DateFormatter()
        formatter.timeZone = TimeZone(identifier: "UTC")
        return formatter.string(from: self)
    }
}
```

### 2. Name/Label Overlay

```swift
struct InvestigatorLabel {
    var enabled: Bool = false
    var name: String = ""
    var caseId: String = ""
    var showPrefix: Bool = true  // "Captured by:"
}
```

### 3. Cryptographic Hash

```swift
import CryptoKit

struct ForensicHash {
    var algorithm: HashAlgorithm = .sha256
    var displayTruncated: Bool = true
    
    enum HashAlgorithm: String, CaseIterable {
        case sha256 = "SHA-256"
        case sha512 = "SHA-512"
        case md5 = "MD5"  // Legacy support only
    }
    
    func compute(from imageData: Data) -> String {
        switch algorithm {
        case .sha256:
            let digest = SHA256.hash(data: imageData)
            return digest.map { String(format: "%02x", $0) }.joined()
        case .sha512:
            let digest = SHA512.hash(data: imageData)
            return digest.map { String(format: "%02x", $0) }.joined()
        case .md5:
            let digest = Insecure.MD5.hash(data: imageData)
            return digest.map { String(format: "%02x", $0) }.joined()
        }
    }
}

/// Evidence sidecar file
struct EvidenceMetadata: Codable {
    let imageFile: String
    let algorithm: String
    let hash: String
    let capturedAt: String
    let capturedBy: String?
    let caseId: String?
    let sourceUrl: String?
    
    func writeJSON(to url: URL) throws {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let data = try encoder.encode(self)
        try data.write(to: url)
    }
}
```

### 4. Scrolling Screenshots

```swift
@MainActor
final class ScrollingCaptureService {
    struct Config {
        var scrollAmount: CGFloat = 100  // pixels per step
        var captureDelay: Duration = .milliseconds(300)
        var maxScrolls: Int = 100  // safety limit
        var direction: ScrollDirection = .vertical
    }
    
    enum ScrollDirection {
        case vertical
        case horizontal
        case both
    }
    
    func capture(window: SCWindow, config: Config) async throws -> NSImage {
        var frames: [CGImage] = []
        
        for _ in 0..<config.maxScrolls {
            // 1. Capture current frame
            let frame = try await captureFrame(window)
            frames.append(frame)
            
            // 2. Check if reached end
            if try await isAtEnd(window) {
                break
            }
            
            // 3. Scroll
            try await scroll(in: window, by: config.scrollAmount)
            
            // 4. Wait for content to settle
            try await Task.sleep(for: config.captureDelay)
        }
        
        // 5. Stitch frames
        return try stitchFrames(frames)
    }
    
    private func stitchFrames(_ frames: [CGImage]) throws -> NSImage {
        // Find overlaps between consecutive frames
        // Calculate total canvas size
        // Composite frames with blending at overlaps
        // ...
    }
}
```

---

## Implementation Plan

### Milestone: Core Screenshot

**Week 1: Foundation**
- [ ] SwiftPM Projekt Setup
- [ ] App Scaffold (MenuBarExtra + WindowGroup)
- [ ] ScreenshotService mit ScreenCaptureKit
- [ ] Basic Permission Handling (Screen Recording)

**Week 2: Editor Basics**
- [ ] EditorView Layout (HSplitView)
- [ ] Background Selector (Solid Colors)
- [ ] Gradient Presets laden
- [ ] Basic Canvas Rendering

**Week 3: Editor Features**
- [ ] Asset Grid für Wallpapers
- [ ] Effects Panel (Blur, Noise)
- [ ] Shadow Controls
- [ ] Border Radius Slider
- [ ] Save & Copy to Clipboard

### Milestone: Forensische Features

**Week 4: Overlays**
- [ ] UTC Timestamp Overlay
- [ ] Investigator Name/Label Overlay
- [ ] SHA-256 Hash Berechnung
- [ ] Forensic Bar Rendering

**Week 5: Evidence Export**
- [ ] Evidence.json Sidecar Files
- [ ] Hash-before-overlay Workflow
- [ ] Preferences für Forensic Settings
- [ ] Copy Full Hash Funktion

**Week 6: Scrolling Capture**
- [ ] Accessibility API Integration
- [ ] Scroll Event Injection
- [ ] Frame Capture Loop
- [ ] Image Stitching Algorithmus
- [ ] Progress UI

### Milestone: Polish & Distribution

**Week 7: Annotations**
- [ ] Annotation Protocol & Types
- [ ] Select/Move Tool
- [ ] Circle & Rectangle
- [ ] Lines & Arrows
- [ ] Text & Number Annotations
- [ ] Properties Panel

**Week 8: Distribution**
- [ ] App Icon & Branding
- [ ] Onboarding Flow
- [ ] Keyboard Shortcuts (Global)
- [ ] Code Signing
- [ ] Notarization
- [ ] DMG/Installer erstellen

---

## UI Mockups (ASCII)

### Main Window (Menu Bar aktiviert)

```
┌──────────────────────────────────────────────────────────────┐
│                        Better Shot                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│              ┌─────────────────────────────────┐             │
│              │                                 │             │
│              │       Better Shot               │             │
│              │   Professional Screenshot       │             │
│              │        Workflow                 │             │
│              │                                 │             │
│              └─────────────────────────────────┘             │
│                                                              │
│       ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│       │  ⬚       │  │  🖥      │  │  ⧉       │              │
│       │ Region   │  │ Screen   │  │ Window   │              │
│       └──────────┘  └──────────┘  └──────────┘              │
│                                                              │
│       ┌────────────────────────────────────────┐            │
│       │ ☑ Auto-apply background                │            │
│       │   Apply default background and save    │            │
│       │   instantly                      [ON]  │            │
│       └────────────────────────────────────────┘            │
│                                                              │
│       ┌────────────────────────────────────────┐            │
│       │ Keyboard Shortcuts                     │            │
│       ├────────────────────────────────────────┤            │
│       │ Region          ⌘⇧2                    │            │
│       │ Screen          ⌘⇧3                    │            │
│       │ Window          ⌘⇧4                    │            │
│       │ Save            ⌘S                     │            │
│       └────────────────────────────────────────┘            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                                            [⚙] Settings
```

### Editor Window

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [<] Cancel            Edit Screenshot               [📋] [💾] Save      │
├─────────────────────────────────────────────────────────────────────────┤
│ [→] [○] [□] [╱] [➜] [A] [①]                        [🗑] Delete Selected │
├───────────────────────┬─────────────────────────────────────────────────┤
│ Properties            │                                                  │
│                       │                                                  │
│ ───────────────────── │                                                  │
│ Background            │                                                  │
│ Solid                 │                                                  │
│ [⬜][⬛][▒][🏁][🎨]    │                                                  │
│                       │          ┌──────────────────────────────┐       │
│ Gradients             │          │                              │       │
│ [🟣][🔵][🔴][🟢]      │          │                              │       │
│ [🟡][🔵][🟠][⚫]      │          │      Screenshot Preview      │       │
│                       │          │      with Background         │       │
│ Wallpapers            │          │      and Effects             │       │
│ [📷][📷][📷][📷]      │          │                              │       │
│ [📷][📷][📷][📷]      │          │                              │       │
│                       │          └──────────────────────────────┘       │
│ Mac Assets            │                                                  │
│ [🖼][🖼][🖼][🖼]      │                                                  │
│                       │                                                  │
│ ───────────────────── │                                                  │
│ Background Effects    │                                                  │
│ Blur     ────●────  0 │                                                  │
│ Noise    ──●──────  0 │                                                  │
│                       │                                                  │
│ ───────────────────── │                                                  │
│ Shadow                │                                                  │
│ Blur     ────●─────20 │                                                  │
│ X Offset ─●────────  0│                                                  │
│ Y Offset ──●───────10 │                                                  │
│ Opacity  ───●──────30 │                                                  │
│                       │                                                  │
│ ───────────────────── │                                                  │
│ Roundness             │                                                  │
│ ──────●────────    18 │                                                  │
│                       │                                                  │
└───────────────────────┴─────────────────────────────────────────────────┘
```

### Preferences Window

```
┌──────────────────────────────────────────────────────────────┐
│ [<] Back               Preferences                           │
│                    Configure your app settings               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ General                                                  │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 📁 Save Directory                                        │ │
│ │ [~/Desktop                                    ] [Browse] │ │
│ │ Screenshots will be saved to this directory              │ │
│ │                                                          │ │
│ │ Copy to clipboard                              [ON/OFF]  │ │
│ │ Automatically copy screenshots after saving              │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Default Background                                       │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Current: [📷 Wallpaper 24]                               │ │
│ │ [📷][📷][📷][📷][📷][📷][📷][📷]                         │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Forensic Mode                                            │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Enable Forensic Overlay                        [ON/OFF]  │ │
│ │                                                          │ │
│ │ UTC Timestamp                                  [ON/OFF]  │ │
│ │ Format: [ISO 8601               ▼]                       │ │
│ │                                                          │ │
│ │ Investigator Name                                        │ │
│ │ [Pascal Ott                                  ]           │ │
│ │                                                          │ │
│ │ Case/Project ID                                          │ │
│ │ [CYB-2026-0042                               ]           │ │
│ │                                                          │ │
│ │ Hash Algorithm: [SHA-256        ▼]                       │ │
│ │                                                          │ │
│ │ Export Evidence JSON                           [ON/OFF]  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Keyboard Shortcuts                                       │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Capture Region   ⌘⇧2                         [Record]   │ │
│ │ Capture Screen   ⌘⇧3                         [Record]   │ │
│ │ Capture Window   ⌘⇧4                         [Record]   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Forensic Bar Output

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│                                                                    │
│                     [Screenshot Content]                           │
│                                                                    │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░  Captured by: Pascal Ott                                      ░ │
│ ░  Case: CYB-2026-0042                                          ░ │
│ ░  2026-01-12T19:45:23Z                                         ░ │
│ ░  SHA-256: e3b0c44298fc1c14...                                 ░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└────────────────────────────────────────────────────────────────────┘
```

---

## Technical Requirements

### macOS Frameworks

| Framework | Verwendung |
|-----------|------------|
| **ScreenCaptureKit** | Screenshot Capture (Screen, Window, Region) |
| **AppKit** | NSStatusItem (Menu Bar), NSWindow, NSPasteboard |
| **SwiftUI** | Alle Views und UI-Komponenten |
| **SwiftData** | Persistenz (History, Preferences) |
| **CryptoKit** | SHA-256/512 für Evidence Hashing |
| **Accessibility** | AXUIElement für Scrolling Screenshots |
| **UniformTypeIdentifiers** | File Type Handling |
| **CoreGraphics** | Image Rendering und Manipulation |

### Permissions (Info.plist)

```xml
<key>NSScreenCaptureUsageDescription</key>
<string>Better Shot needs screen recording permission to capture screenshots.</string>

<key>NSAppleEventsUsageDescription</key>
<string>Better Shot uses AppleEvents to play the capture sound.</string>

<key>com.apple.security.temporary-exception.apple-events</key>
<array>
    <string>com.apple.systemevents</string>
</array>
```

### Entitlements

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "...">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <false/>
    
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    
    <key>com.apple.security.files.downloads.read-write</key>
    <true/>
</dict>
</plist>
```

---

## Acceptance Criteria

### Milestone: Core Screenshot

- [ ] App startet als Menu Bar App mit Tray Icon
- [ ] Globale Hotkeys funktionieren (⌘⇧2, ⌘⇧3, ⌘⇧4)
- [ ] Region Selection mit interaktivem Overlay
- [ ] Fullscreen Capture aller Monitore
- [ ] Window Selection und Capture
- [ ] Editor öffnet sich nach Capture
- [ ] Background Selector mit Solid Colors
- [ ] Gradient Presets anzeigen und anwenden
- [ ] Wallpapers laden und anwenden
- [ ] Blur & Noise Effekte funktionieren
- [ ] Shadow Controls funktionieren
- [ ] Border Radius einstellbar
- [ ] Save speichert PNG
- [ ] Copy kopiert in Clipboard

### Milestone: Forensische Features

- [ ] UTC Timestamp Overlay (ISO 8601)
- [ ] Investigator Label erscheint
- [ ] SHA-256 Hash berechnet und angezeigt
- [ ] Hash wird VOR Overlay berechnet
- [ ] .evidence.json wird exportiert
- [ ] Scrolling Capture funktioniert (Browser)
- [ ] Stitching produziert seamless Image

### Milestone: Polish

- [ ] Annotation Tools funktionieren
- [ ] Properties Panel aktualisiert Annotations
- [ ] Onboarding bei erstem Start
- [ ] Preferences speichern und laden
- [ ] App ist signiert und notarisiert
- [ ] DMG Installer erstellt

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| ScreenCaptureKit Permissions komplex | Medium | Klare Onboarding-Flow, Fallback zu CGWindowListCreateImage |
| Scrolling Capture unzuverlässig | High | Configurable Delays, Manual Stop, Preview vor Stitching |
| SwiftData Migration bei Updates | Low | Lightweight Migration, JSON Backup |
| Menu Bar Apps und Window Focus | Medium | Custom Window Levels, NSApp.activate() |
| App Store Rejection (Screenshot) | High | Direct Distribution via Website/Homebrew |

---

## Future Considerations

- **iOS Companion App**: Screenshot Upload via iCloud
- **AI-Powered OCR**: Text aus Screenshots extrahieren
- **Browser Extension**: Direkter Capture aus Safari/Chrome
- **Blockchain Timestamping**: RFC 3161 Compliance
- **Team Features**: Shared Asset Libraries

---

*Document Version: 1.0*  
*Last Updated: 2026-01-12*
