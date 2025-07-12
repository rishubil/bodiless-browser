use serde::{Deserialize, Serialize};
use std::time::Instant;
use html_escape::decode_html_entities;

#[derive(Debug, Serialize, Deserialize)]
struct UrlCheckResponse {
    status_code: u16,
    title: Option<String>,
    content_size: usize,
}

#[tauri::command]
async fn check_url(url: String) -> Result<UrlCheckResponse, String> {
    let _start = Instant::now();
    
    // Create HTTP client
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(30))
        .user_agent("Bodiless-Browser/1.0.0")
        .build()
        .map_err(|e| format!("Client creation failed: {}", e))?;

    // Send HTTP request
    let response = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let status_code = response.status().as_u16();
    
    // Get HTML content
    let html = response
        .text()
        .await
        .map_err(|e| format!("Failed to read response: {}", e))?;

    let content_size = html.len();

    // Extract title tag from HTML (using simple regex)
    let title = extract_title(&html);

    Ok(UrlCheckResponse {
        status_code,
        title,
        content_size,
    })
}

fn extract_title(html: &str) -> Option<String> {
    // Case-insensitive title tag search
    let html_lower = html.to_lowercase();
    
    if let Some(start) = html_lower.find("<title>") {
        if let Some(end) = html_lower[start + 7..].find("</title>") {
            // Extract actual title content from original HTML (preserving case)
            let title_start = start + 7;
            let title_end = title_start + end;
            let title = &html[title_start..title_end];
            
            // HTML entity decoding and whitespace cleanup
            let decoded = decode_html_entities(title);
            let trimmed = decoded.trim();
            
            if !trimmed.is_empty() {
                return Some(trimmed.to_string());
            }
        }
    }
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![check_url])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
