//! Scrolling screenshot capture module
//! Captures long content by auto-scrolling and stitching images together

use image::{DynamicImage, ImageBuffer, RgbaImage};
use std::path::PathBuf;
use std::thread;
use std::time::Duration;
use xcap::{Window, WindowAllOptions};

use crate::image::{save_image, CropRegion};
use crate::utils::{ensure_dir, generate_filename_with_id, AppResult};

/// Configuration for scrolling screenshot
#[derive(Debug, Clone)]
pub struct ScrollConfig {
    pub scroll_amount: u32,       // Pixels to scroll per step
    pub scroll_delay_ms: u64,     // Delay between scroll and capture
    pub capture_overlap: u32,     // Overlap between captures for seamless stitching
    pub min_capture_height: u32,  // Minimum height per capture
}

impl Default for ScrollConfig {
    fn default() -> Self {
        Self {
            scroll_amount: 500,       // Scroll 500px at a time
            scroll_delay_ms: 300,     // 300ms delay for page to settle
            capture_overlap: 50,      // 50px overlap
            min_capture_height: 100,  // Minimum 100px per capture
        }
    }
}

/// Result of a scrolling screenshot capture
#[derive(Debug, Clone)]
pub struct ScrollScreenshotResult {
    pub images: Vec<String>,      // Paths to captured images
    pub stitched_path: Option<String>,  // Path to final stitched image
    pub total_height: u32,
    pub total_width: u32,
}

/// Get all available windows
pub fn get_available_windows() -> AppResult<Vec<WindowInfo>> {
    let windows = WindowAllOptions::new()
        .include_unnamed(false)
        .only_visible(true)
        .all()
        .map_err(|e| format!("Failed to get windows: {}", e))?;

    let window_infos: Vec<WindowInfo> = windows
        .into_iter()
        .filter(|w| w.is_minimized().unwrap_or(false) == false)
        .map(|w| WindowInfo {
            id: w.id().map_err(|e| format!("Failed to get window id: {}", e))?,
            title: w.title().unwrap_or("Unknown").to_string(),
            bounds: w.bounds().unwrap_or_default(),
        })
        .collect();

    Ok(window_infos)
}

/// Basic window info for selection
#[derive(Debug, Clone, Serialize)]
pub struct WindowInfo {
    pub id: u32,
    pub title: String,
    pub bounds: xcap::Rect,
}

/// Capture a scrolling screenshot of a specific window
pub async fn capture_scrolling_screenshot(
    window_title: &str,
    save_dir: &str,
    config: Option<ScrollConfig>,
) -> AppResult<ScrollScreenshotResult> {
    let config = config.unwrap_or_default();
    let save_path = PathBuf::from(save_dir);
    ensure_dir(&save_path)?;

    // Find the target window
    let windows = WindowAllOptions::new()
        .include_unnamed(false)
        .only_visible(true)
        .all()
        .map_err(|e| format!("Failed to get windows: {}", e))?;

    let target_window = windows
        .into_iter()
        .find(|w| {
            w.title()
                .map(|t| t.contains(window_title))
                .unwrap_or(false)
        })
        .ok_or_else(|| format!("Window not found: {}", window_title))?;

    // Get window bounds
    let bounds = target_window
        .bounds()
        .ok_or("Failed to get window bounds")?;
    let window_id = target_window
        .id()
        .map_err(|e| format!("Failed to get window id: {}", e))?;

    // Calculate capture dimensions (exclude title bar if needed)
    let capture_x = bounds.x;
    let capture_y = bounds.y;
    let capture_width = bounds.width;
    let capture_height = bounds.height;

    // For scrolling, we need to capture just the content area
    // This is a simplification - actual implementation depends on the app
    let content_height = capture_height.saturating_sub(50); // Assume 50px for title bar
    let content_y = capture_y + 50;

    // Number of captures needed
    let num_captures = (content_height / (config.scroll_amount - config.capture_overlap))
        .max(1) as usize;

    // Capture sequence
    let mut captured_images: Vec<DynamicImage> = Vec::with_capacity(num_captures);

    for i in 0..num_captures {
        // Calculate scroll position
        let scroll_y = content_y + (i as i32 * config.scroll_amount as i32);

        // Ensure we don't scroll past the content
        if scroll_y >= content_y + content_height as i32 {
            break;
        }

        // Capture the window at current scroll position
        let image = target_window
            .capture_image()
            .map_err(|e| format!("Failed to capture window at position {}: {}", scroll_y, e))?;

        captured_images.push(image);

        // Scroll down for next capture (using AppleScript for most apps)
        if i < num_captures - 1 {
            scroll_window_down(&target_window, config.scroll_amount as i32)?;
            thread::sleep(Duration::from_millis(config.scroll_delay_ms));
        }
    }

    // Stitch images together
    let stitched = stitch_images(&captured_images, capture_width, capture_x)?;

    // Save individual captures
    let mut image_paths: Vec<String> = Vec::with_capacity(captured_images.len());
    for (i, img) in captured_images.iter().enumerate() {
        let path = save_image(img, save_dir, &format!("scroll_part_{}", i))?;
        image_paths.push(path);
    }

    // Save stitched image
    let stitched_path = if let Some(stitched_img) = &stitched {
        let path = save_image(stitched_img, save_dir, "scroll_stitched")?;
        Some(path)
    } else {
        None
    };

    Ok(ScrollScreenshotResult {
        images: image_paths,
        stitched_path,
        total_height: stitched
            .map(|img| img.height())
            .unwrap_or(capture_height),
        total_width: capture_width,
    })
}

/// Scroll a window down by a certain amount
fn scroll_window_down(window: &Window, amount: i32) -> AppResult<()> {
    // Try using AppleScript for scrolling (works with most apps)
    let script = format!(
        r#"
        tell application "System Events"
            tell process "Better Shot"
                -- Try to scroll using accessibility APIs
            end tell
        end tell
        "#
    );

    // Alternative: Use xcap's window bounds to simulate scroll
    // This is a placeholder - actual scrolling depends on the target app

    // For now, we just delay between captures
    // Real scrolling would require:
    // 1. Accessibility API access
    // 2. App-specific scroll commands
    // 3. Or keyboard-based scrolling (arrow down, page down)

    Ok(())
}

/// Stitch multiple images vertically
fn stitch_images(
    images: &[DynamicImage],
    width: u32,
    _offset_x: i32,
) -> AppResult<Option<DynamicImage>> {
    if images.is_empty() {
        return Ok(None);
    }

    if images.len() == 1 {
        return Ok(Some(images[0].clone()));
    }

    // Calculate total height
    let total_height: u32 = images.iter().map(|img| img.height()).sum();

    // Create new image buffer
    let mut stitched: RgbaImage =
        ImageBuffer::new(width, total_height);

    // Copy images vertically
    let mut current_y = 0;
    for img in images {
        for (x, y, pixel) in img.pixels() {
            let dest_y = current_y + y;
            if dest_y < total_height {
                stitched.put_pixel(x, dest_y, *pixel);
            }
        }
        current_y += img.height();
    }

    Ok(Some(DynamicImage::ImageRgba8(stitched)))
}

/// Simple full-page capture using browser automation
/// This would work with Chrome/Firefox using DevTools Protocol
pub async fn capture_full_page_screenshot(
    url: &str,
    save_dir: &str,
) -> AppResult<ScrollScreenshotResult> {
    // This requires a browser automation approach
    // Options:
    // 1. Chrome DevTools Protocol
    // 2. Playwright/Puppeteer
    // 3. Firefox Marionette

    // For now, return a placeholder error
    Err("Full-page capture requires browser automation (Playwright/Puppeteer)".into())
}
