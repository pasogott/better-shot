# Better Shot - Product Requirements Document (PRD)

## Forensic & Evidence Features

**Version:** 1.0  
**Date:** 2026-01-12  
**Author:** Claude (AI Assistant)  
**Status:** Draft  

---

## Executive Summary

This PRD defines four new features for Better Shot designed to enhance screenshots for forensic, legal, and documentation purposes. These features transform Better Shot from a simple screenshot tool into a professional evidence capture solution—particularly valuable for the **cyberheld** use case (documenting online harassment, hate speech, and digital evidence).

---

## Problem Statement

### Current Situation
Better Shot excels at capturing beautiful, polished screenshots for presentations and marketing. However, it lacks features required for:

1. **Legal Evidence** - Screenshots used in court need verifiable timestamps, integrity proofs, and chain-of-custody documentation
2. **Forensic Documentation** - Cybersecurity researchers and investigators need tamper-evident screenshots
3. **Long Document Capture** - Web pages, chat logs, and legal documents often extend beyond a single viewport
4. **Attribution** - Screenshots shared in reports need clear identification of who captured them and when

### Target Users
- **Cyberheld investigators** documenting online hate speech and harassment
- **Legal professionals** capturing evidence for litigation
- **Journalists** preserving online content before deletion
- **Compliance teams** documenting regulatory violations
- **Security researchers** capturing vulnerability evidence

---

## User Stories

### Feature 1: UTC Timestamp Overlay

| ID | Story |
|----|-------|
| TS-1 | As a **legal investigator**, I want screenshots to automatically display the capture timestamp so I can prove when evidence was collected. |
| TS-2 | As a **user**, I want to configure the timestamp format (ISO 8601, locale-based, or custom) to match my organization's requirements. |
| TS-3 | As a **journalist**, I want the timestamp in UTC so international collaborators see consistent times regardless of timezone. |
| TS-4 | As a **user**, I want to toggle the timestamp on/off for screenshots where it's not needed. |

### Feature 2: Name/Label Overlay

| ID | Story |
|----|-------|
| NL-1 | As an **investigator**, I want my name on screenshots so colleagues know who captured the evidence. |
| NL-2 | As a **team lead**, I want case/project labels on screenshots for organization and filtering. |
| NL-3 | As a **user**, I want to set a default label that persists across sessions. |
| NL-4 | As a **user**, I want to override the label for specific screenshots. |

### Feature 3: Cryptographic Hash Overlay

| ID | Story |
|----|-------|
| CH-1 | As a **legal professional**, I want a SHA-256 hash displayed on screenshots to prove the image hasn't been tampered with. |
| CH-2 | As a **forensic analyst**, I want the hash computed from the original capture (before overlay) so the original can be verified separately. |
| CH-3 | As a **compliance officer**, I want hash values exported to a separate log file for audit trails. |
| CH-4 | As a **user**, I want to choose which hash algorithm to use (SHA-256, SHA-512, MD5 for legacy systems). |

### Feature 4: Scrolling Screenshots

| ID | Story |
|----|-------|
| SS-1 | As a **legal investigator**, I want to capture entire web pages including content below the fold. |
| SS-2 | As a **user**, I want automatic scrolling and stitching without manual effort. |
| SS-3 | As a **journalist**, I want to capture full chat conversations that span multiple screens. |
| SS-4 | As a **user**, I want control over scroll speed and capture interval for reliability. |

---

## Detailed Requirements

### 1. UTC Timestamp Overlay

#### 1.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| TS-F1 | Display timestamp as text overlay at configurable position (bottom-left default) | P0 |
| TS-F2 | Support ISO 8601 format: `2026-01-12T19:45:23Z` | P0 |
| TS-F3 | Support configurable formats via strftime-like patterns | P1 |
| TS-F4 | Always use UTC timezone regardless of system locale | P0 |
| TS-F5 | Toggle feature on/off globally in Preferences | P0 |
| TS-F6 | Override toggle per-capture via keyboard modifier (hold Alt) | P2 |
| TS-F7 | Configurable text color (auto-contrast or manual) | P1 |
| TS-F8 | Semi-transparent background behind text for readability | P1 |

#### 1.2 Technical Approach

**Backend (Rust - `src-tauri/src/`):**

```rust
// New module: src-tauri/src/overlay.rs

use chrono::{DateTime, Utc};
use image::{DynamicImage, Rgba, RgbaImage};
use imageproc::drawing::draw_text_mut;
use rusttype::{Font, Scale};

pub struct TimestampConfig {
    pub enabled: bool,
    pub format: String,        // e.g., "%Y-%m-%dT%H:%M:%SZ"
    pub position: Position,
    pub font_size: u32,
    pub text_color: Rgba<u8>,
    pub background_color: Option<Rgba<u8>>,
}

pub fn apply_timestamp_overlay(
    image: &mut DynamicImage,
    config: &TimestampConfig,
) -> Result<(), String> {
    if !config.enabled {
        return Ok(());
    }
    
    let timestamp: DateTime<Utc> = Utc::now();
    let text = timestamp.format(&config.format).to_string();
    
    // Draw semi-transparent background rectangle
    // Draw text using rusttype
    
    Ok(())
}
```

**New Dependencies (Cargo.toml):**
```toml
chrono = { version = "0.4", features = ["serde"] }
imageproc = "0.24"
rusttype = "0.9"
```

**Frontend (React - `src/components/preferences/`):**

Add new section in `PreferencesPage.tsx`:
```tsx
<Card className="bg-zinc-900 border-zinc-800">
  <CardHeader>
    <CardTitle>Forensic Overlay</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label>Show UTC Timestamp</label>
        <Switch checked={timestampEnabled} onCheckedChange={...} />
      </div>
      <div>
        <label>Format</label>
        <Select value={timestampFormat}>
          <SelectItem value="%Y-%m-%dT%H:%M:%SZ">ISO 8601</SelectItem>
          <SelectItem value="%Y-%m-%d %H:%M:%S UTC">Readable UTC</SelectItem>
          <SelectItem value="custom">Custom...</SelectItem>
        </Select>
      </div>
    </div>
  </CardContent>
</Card>
```

#### 1.3 UI/UX Mockup Description

**Preferences Panel:**
```
┌─────────────────────────────────────────┐
│ Forensic Overlay                        │
├─────────────────────────────────────────┤
│ ☑ Show UTC Timestamp            [ON/OFF]│
│                                         │
│ Format: [ISO 8601           ▼]          │
│         • ISO 8601 (2026-01-12T19:45:23Z)
│         • Readable (2026-01-12 19:45:23 UTC)
│         • Custom pattern...              │
│                                         │
│ Position: [Bottom Left      ▼]          │
│                                         │
│ Font Size: ────●──────── 14px           │
│                                         │
│ Text Color: [█ Auto-contrast ▼]         │
└─────────────────────────────────────────┘
```

**Screenshot Output:**
```
┌────────────────────────────────────────────┐
│                                            │
│         [Screenshot Content]               │
│                                            │
│                                            │
├────────────────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│ ░ 2026-01-12T19:45:23Z                   ░│
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
└────────────────────────────────────────────┘
```

---

### 2. Name/Label Overlay

#### 2.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| NL-F1 | Text input field in Preferences for default label | P0 |
| NL-F2 | Label displayed alongside timestamp (same bar) | P0 |
| NL-F3 | Support for two-line labels (Name + Case ID) | P1 |
| NL-F4 | Per-capture label override via pre-capture dialog | P2 |
| NL-F5 | Label persisted across app restarts | P0 |
| NL-F6 | Optional "Captured by:" prefix | P1 |

#### 2.2 Technical Approach

**Settings Store (`settings.json`):**
```json
{
  "forensic": {
    "label": {
      "enabled": true,
      "line1": "Pascal Ott",
      "line2": "Case: CYB-2026-0042",
      "showPrefix": true
    }
  }
}
```

**Backend:**
Extend `overlay.rs` to handle multi-line text rendering with the label.

**Frontend:**
Add to Forensic Overlay section in Preferences:
```tsx
<div className="space-y-2">
  <label>Investigator Name</label>
  <Input 
    placeholder="Your name or identifier"
    value={labelLine1}
    onChange={...}
  />
</div>
<div className="space-y-2">
  <label>Case/Project ID (optional)</label>
  <Input 
    placeholder="e.g., CASE-2026-001"
    value={labelLine2}
    onChange={...}
  />
</div>
```

#### 2.3 UI/UX Mockup Description

**Screenshot Output (Combined with Timestamp):**
```
┌────────────────────────────────────────────┐
│                                            │
│         [Screenshot Content]               │
│                                            │
├────────────────────────────────────────────┤
│ ░ Captured by: Pascal Ott                ░│
│ ░ Case: CYB-2026-0042                    ░│
│ ░ 2026-01-12T19:45:23Z                   ░│
└────────────────────────────────────────────┘
```

---

### 3. Cryptographic Hash Overlay

#### 3.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| CH-F1 | Calculate SHA-256 hash of screenshot **before** any overlays | P0 |
| CH-F2 | Display truncated hash (first 16 chars + "...") on image | P0 |
| CH-F3 | Full hash available via hover tooltip in editor | P1 |
| CH-F4 | Copy full hash to clipboard via button | P1 |
| CH-F5 | Export hash + metadata to `.json` sidecar file | P1 |
| CH-F6 | Support SHA-256 (default), SHA-512, MD5 | P2 |
| CH-F7 | Hash computed on raw PNG bytes, not visual content | P0 |

#### 3.2 Technical Approach

**Backend (Rust):**

```rust
// src-tauri/src/hash.rs

use sha2::{Sha256, Digest};
use std::fs;

pub struct HashResult {
    pub algorithm: String,
    pub full_hash: String,
    pub truncated: String,
}

pub fn compute_image_hash(image_path: &str) -> Result<HashResult, String> {
    let bytes = fs::read(image_path)
        .map_err(|e| format!("Failed to read image: {}", e))?;
    
    let mut hasher = Sha256::new();
    hasher.update(&bytes);
    let result = hasher.finalize();
    let full_hash = format!("{:x}", result);
    let truncated = format!("{}...", &full_hash[..16]);
    
    Ok(HashResult {
        algorithm: "SHA-256".to_string(),
        full_hash,
        truncated,
    })
}

pub fn export_hash_sidecar(
    image_path: &str,
    hash: &HashResult,
    metadata: &CaptureMetadata,
) -> Result<String, String> {
    let sidecar = serde_json::json!({
        "image_file": image_path,
        "algorithm": hash.algorithm,
        "hash": hash.full_hash,
        "captured_at": metadata.timestamp,
        "captured_by": metadata.label,
        "source_url": metadata.source_url,
    });
    
    let sidecar_path = format!("{}.evidence.json", image_path);
    fs::write(&sidecar_path, serde_json::to_string_pretty(&sidecar).unwrap())
        .map_err(|e| format!("Failed to write sidecar: {}", e))?;
    
    Ok(sidecar_path)
}
```

**New Dependencies:**
```toml
sha2 = "0.10"
```

**Sidecar File Example (`screenshot-2026-01-12.png.evidence.json`):**
```json
{
  "image_file": "/Users/pascal/Desktop/screenshot-2026-01-12.png",
  "algorithm": "SHA-256",
  "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "captured_at": "2026-01-12T19:45:23Z",
  "captured_by": "Pascal Ott",
  "case_id": "CYB-2026-0042",
  "source_url": null
}
```

#### 3.3 UI/UX Mockup Description

**Screenshot Output (Full Forensic Bar):**
```
┌────────────────────────────────────────────┐
│                                            │
│         [Screenshot Content]               │
│                                            │
├────────────────────────────────────────────┤
│ ░ Captured by: Pascal Ott                ░│
│ ░ Case: CYB-2026-0042                    ░│
│ ░ 2026-01-12T19:45:23Z                   ░│
│ ░ SHA-256: e3b0c44298fc1c14...           ░│
└────────────────────────────────────────────┘
```

**Editor Toolbar (Hash Actions):**
```
┌──────────────────────────────────┐
│ SHA-256: e3b0c44298fc1c14...     │
│ [📋 Copy Full Hash] [📄 Export]  │
└──────────────────────────────────┘
```

---

### 4. Scrolling Screenshots

#### 4.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| SS-F1 | New capture mode: "Capture Scrolling" (`⌘⇧5`) | P0 |
| SS-F2 | User selects initial region to capture | P0 |
| SS-F3 | Automatic scrolling within selected window/region | P0 |
| SS-F4 | Capture frames at configurable interval (default: 300ms) | P1 |
| SS-F5 | Automatic image stitching with overlap detection | P0 |
| SS-F6 | Scroll direction: vertical (default), horizontal, or both | P1 |
| SS-F7 | Manual stop via Escape or click | P0 |
| SS-F8 | Progress indicator during capture | P1 |
| SS-F9 | Handle dynamic content (lazy loading) with configurable delays | P2 |
| SS-F10 | Maximum scroll limit to prevent infinite captures | P0 |

#### 4.2 Technical Approach

**This is the most complex feature.** It requires:

1. **Window/Region scrolling automation** - sending scroll events
2. **Frame capture timing** - coordinating scroll and capture
3. **Image stitching** - aligning and merging captures

**Backend Architecture:**

```rust
// src-tauri/src/scrolling.rs

use std::time::Duration;
use std::thread;

pub struct ScrollCaptureConfig {
    pub region: CropRegion,
    pub scroll_amount: i32,        // pixels per scroll step
    pub capture_delay_ms: u64,     // wait after scroll before capture
    pub max_scrolls: u32,          // safety limit
    pub direction: ScrollDirection,
}

pub enum ScrollDirection {
    Vertical,
    Horizontal,
    Both,
}

pub struct ScrollCapture {
    frames: Vec<CapturedFrame>,
    config: ScrollCaptureConfig,
}

impl ScrollCapture {
    pub fn start(&mut self) -> Result<(), String> {
        for i in 0..self.config.max_scrolls {
            // 1. Capture current frame
            let frame = self.capture_frame()?;
            self.frames.push(frame);
            
            // 2. Check if we've reached the end (content hasn't changed)
            if self.is_end_reached() {
                break;
            }
            
            // 3. Scroll
            self.perform_scroll()?;
            
            // 4. Wait for content to settle
            thread::sleep(Duration::from_millis(self.config.capture_delay_ms));
        }
        
        Ok(())
    }
    
    pub fn stitch(&self) -> Result<DynamicImage, String> {
        // Use image comparison to find overlap regions
        // Stitch frames together vertically/horizontally
        stitch_frames(&self.frames, self.config.direction)
    }
}

fn stitch_frames(frames: &[CapturedFrame], direction: ScrollDirection) -> Result<DynamicImage, String> {
    // 1. For each consecutive pair, find overlap using image hashing/comparison
    // 2. Calculate total canvas size
    // 3. Composite frames onto canvas, blending at overlap boundaries
    
    // Key algorithm: Feature matching or simple row/column comparison
    // to find where frame N+1 overlaps with frame N
    
    todo!("Implement stitching algorithm")
}
```

**Scroll Automation Options:**

1. **macOS Accessibility API** (preferred)
   - Use `CGEventCreateScrollWheelEvent` for precise scroll control
   - Requires accessibility permissions (already needed for screen recording)

2. **AppleScript fallback**
   ```applescript
   tell application "System Events"
       scroll area 1 of window 1 of application "Safari" scroll down
   end tell
   ```

3. **JavaScript injection** (for browser windows)
   - Execute `window.scrollBy(0, amount)` via browser automation
   - Most reliable for web content

**Image Stitching Algorithm:**

```rust
fn find_overlap(frame_a: &RgbaImage, frame_b: &RgbaImage) -> u32 {
    // Compare bottom rows of frame_a with top rows of frame_b
    // Find the offset where they match best
    
    let max_overlap = frame_a.height().min(frame_b.height()) / 2;
    let mut best_match = 0;
    let mut best_score = f64::MAX;
    
    for overlap in 10..max_overlap {
        let score = compare_regions(
            &frame_a.view(0, frame_a.height() - overlap, frame_a.width(), overlap),
            &frame_b.view(0, 0, frame_b.width(), overlap),
        );
        
        if score < best_score {
            best_score = score;
            best_match = overlap;
        }
    }
    
    best_match
}
```

**Frontend Flow:**

```tsx
// New capture mode in App.tsx

const handleScrollingCapture = async () => {
  // 1. Show region selector (like region capture)
  setMode("select-scroll-region");
  
  // 2. User selects region
  // 3. Show progress overlay
  setMode("scrolling-capture");
  setScrollProgress({ current: 0, status: "Capturing..." });
  
  // 4. Invoke backend scroll capture
  const result = await invoke<string>("capture_scrolling", {
    region: selectedRegion,
    config: scrollConfig,
  });
  
  // 5. Open editor with stitched result
  setImagePath(result);
  setMode("edit");
};
```

#### 4.3 UI/UX Mockup Description

**Capture Flow:**

```
Step 1: Select Region
┌──────────────────────────────────────────┐
│  ╔═══════════════════════════╗           │
│  ║ Select the area to scroll ║           │
│  ║ capture. Click and drag.  ║           │
│  ╚═══════════════════════════╝           │
│           ┌─ ─ ─ ─ ─ ─ ─┐               │
│           │  [Selection] │               │
│           └─ ─ ─ ─ ─ ─ ─┘               │
└──────────────────────────────────────────┘

Step 2: Capturing
┌──────────────────────────────────────────┐
│         ┌─────────────────┐              │
│         │ Capturing...    │              │
│         │ ████████░░░░░░░ │              │
│         │ Frame 5 of ~12  │              │
│         │                 │              │
│         │ [ESC to stop]   │              │
│         └─────────────────┘              │
└──────────────────────────────────────────┘

Step 3: Stitching
┌──────────────────────────────────────────┐
│         ┌─────────────────┐              │
│         │ Stitching...    │              │
│         │ ██████████████░ │              │
│         │ Aligning frames │              │
│         └─────────────────┘              │
└──────────────────────────────────────────┘
```

**Preferences - Scrolling Settings:**
```
┌─────────────────────────────────────────┐
│ Scrolling Capture                       │
├─────────────────────────────────────────┤
│ Scroll Speed: ────●────── Medium        │
│                                         │
│ Capture Delay: ──●─────── 300ms         │
│ (Wait time after scroll before capture) │
│                                         │
│ Max Scroll Distance: [10000] px         │
│ (Safety limit to prevent infinite       │
│  capture loops)                         │
│                                         │
│ Direction: [Vertical ▼]                 │
│            • Vertical                   │
│            • Horizontal                 │
│            • Both                       │
└─────────────────────────────────────────┘
```

---

## Implementation Priority

| Priority | Feature | Effort | Value |
|----------|---------|--------|-------|
| **P0** | UTC Timestamp | Low (1-2 days) | High |
| **P0** | Name/Label | Low (1 day) | High |
| **P0** | Hash Overlay | Medium (2-3 days) | Very High |
| **P1** | Scrolling Screenshots | High (1-2 weeks) | Very High |

### Recommended Implementation Order

1. **Phase 1: Forensic Bar** (Week 1)
   - Implement overlay rendering infrastructure
   - Add timestamp overlay
   - Add name/label overlay
   - Settings UI for both

2. **Phase 2: Hash & Export** (Week 2)
   - SHA-256 hash computation
   - Hash display in overlay
   - Sidecar JSON export
   - Copy hash functionality

3. **Phase 3: Scrolling Capture** (Weeks 3-4)
   - Scroll automation (macOS APIs)
   - Frame capture loop
   - Stitching algorithm
   - UI/UX for capture flow

---

## Acceptance Criteria

### 1. UTC Timestamp

- [ ] Timestamp appears at bottom-left of saved screenshots when enabled
- [ ] Format is ISO 8601 by default (`2026-01-12T19:45:23Z`)
- [ ] Timestamp is always UTC regardless of system timezone
- [ ] Can be toggled on/off in Preferences
- [ ] Format can be changed in Preferences
- [ ] Semi-transparent background ensures readability on any content

### 2. Name/Label

- [ ] Label text configurable in Preferences
- [ ] Supports two lines (name + case ID)
- [ ] Appears above timestamp in forensic bar
- [ ] Persists across app restarts
- [ ] Can be toggled on/off independently of timestamp

### 3. Hash Overlay

- [ ] SHA-256 hash computed from original screenshot bytes
- [ ] Truncated hash displayed in forensic bar
- [ ] Full hash available via copy button
- [ ] `.evidence.json` sidecar file created with full hash and metadata
- [ ] Hash computation happens before any overlay is applied

### 4. Scrolling Screenshots

- [ ] New keyboard shortcut (`⌘⇧5`) triggers scrolling capture
- [ ] User can select region to capture
- [ ] Automatic scrolling captures full content
- [ ] Frames stitched into single seamless image
- [ ] Progress indicator shown during capture
- [ ] Escape key stops capture early
- [ ] Max scroll limit prevents infinite loops
- [ ] Works with browser windows (Safari, Chrome, Firefox)

---

## Technical Dependencies

### New Rust Crates

```toml
# Cargo.toml additions
chrono = { version = "0.4", features = ["serde"] }  # Timestamps
sha2 = "0.10"                                        # SHA-256 hashing
imageproc = "0.24"                                   # Image processing (text overlay)
rusttype = "0.9"                                     # Font rendering
```

### macOS Permissions

- **Screen Recording** - Already required, no change
- **Accessibility** - May be needed for scroll automation (existing xcap requirement)

### Frontend Dependencies

No new npm packages required. Existing UI components sufficient.

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Font rendering quality varies | Medium | Bundle a specific font (e.g., SF Mono) with the app |
| Scroll automation blocked by apps | High | Provide manual scroll fallback; document limitations |
| Image stitching fails on dynamic content | Medium | Add configurable delays; warn users about limitations |
| Hash display clutters small screenshots | Low | Auto-hide on screenshots below threshold size |
| Legal validity of timestamps | Medium | Document that timestamps are capture-time, not content-time |

---

## Future Considerations

- **Source URL capture** - Automatically detect and log the URL of browser windows
- **Blockchain timestamping** - Optional integration with timestamp authorities (RFC 3161)
- **Video recording mode** - Capture scrolling as video instead of stitched image
- **OCR text extraction** - Extract text from screenshots for searchability
- **Encrypted export** - Password-protected evidence packages

---

## Appendix: Forensic Bar Design Specification

### Visual Design

```
Height: 60-80px (auto-based on content)
Background: rgba(0, 0, 0, 0.85)
Font: SF Mono or system monospace
Font size: 12-14px
Text color: rgba(255, 255, 255, 0.95)
Padding: 12px horizontal, 8px vertical
Position: Bottom of image (appended, not overlay)
```

### Information Hierarchy

```
┌────────────────────────────────────────────────────────────┐
│ Line 1: Captured by: {NAME}                                │
│ Line 2: {CASE_ID} (if provided)                           │
│ Line 3: {TIMESTAMP}                                        │
│ Line 4: SHA-256: {HASH_TRUNCATED}                         │
└────────────────────────────────────────────────────────────┘
```

### Responsive Behavior

- If no name/case: Skip lines 1-2
- If no hash: Skip line 4
- Minimum: Just timestamp (if any forensic feature enabled)

---

*Document Version: 1.0*  
*Last Updated: 2026-01-12*
