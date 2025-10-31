// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod lilypond_parser;

use tauri::Manager;
use std::fs;
use lilypond_parser::{parse_lilypond, ApiParsedMusic};

#[tauri::command]
fn parse_lilypond_content(content: String) -> Result<ApiParsedMusic, String> {
    let parsed = parse_lilypond(&content)?;
    Ok(ApiParsedMusic::from(parsed))
}

#[tauri::command]
async fn parse_lilypond_file(file_path: String) -> Result<ApiParsedMusic, String> {
    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    parse_lilypond_content(content)
}

#[tauri::command]
async fn get_sample_lilypond() -> String {
    r#"

\version "2.24.0"

\header {
  title = "Twinkle, Twinkle, Little Star"
  composer = "Love"
}

\score {
  \new Staff {
    \clef treble
    \key c \major
    \time 4/4
    \tempo 4 = 120

    c'4 c' g' g' | a' a' g'2 |
    f'4 f' e' e' | d' d' c'2 |
    g'4 g' f' f' | e' e' d'2 |
    g'4 g' f' f' | e' e' d'2 |
    c'4 c' g' g' | a' a' g'2 |
    f'4 f' e' e' | d' d' c'2 |
  }
  \layout { }
  \midi { }
}


"#.to_string()
}



fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            parse_lilypond_file,
            parse_lilypond_content,
            get_sample_lilypond
        ])
        .setup(|app| {
            println!("Tauri app is starting...");
            let window = app.get_webview_window("main").unwrap();
            
            #[cfg(debug_assertions)]
            {
                window.open_devtools();
                println!("Developer tools opened");
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}