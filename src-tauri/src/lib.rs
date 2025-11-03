// Export the lilypond_parser module
pub mod lilypond_parser;

// Re-export the types from lilypond_parser for external use
pub use lilypond_parser::{LilyPondNote, ParsedMusic, MusicMode, ApiParsedMusic};

// Test modules
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_parser_basic() {
        let test_content = r#"\version "2.24.0"
\header { title = "Test" }
\score { \new Staff { c'4 d' e' f' } }"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok());
        
        let parsed = result.unwrap();
        assert_eq!(parsed.title, Some("Test".to_string()));
        println!("解析成功，音符数: {}", parsed.staves.iter().map(|s| s.notes.len()).sum::<usize>());
    }
    
    #[test]
    fn test_parser_with_parentheses() {
        let test_content = r#"\version "2.24.0"
\score { \new Staff { g'2 (g'8) e'8 d'8 c'8 } }"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok());
        
        let parsed = result.unwrap();
        let total_notes = parsed.staves.iter().map(|s| s.notes.len()).sum::<usize>();
        println!("解析成功，音符数: {}", total_notes);
        
        // Print details of each note
        for (staff_idx, staff) in parsed.staves.iter().enumerate() {
            println!("Staff {}: {} notes", staff_idx, staff.notes.len());
            for (note_idx, note) in staff.notes.iter().enumerate() {
                println!("  Note {}: pitch={}, duration={}, octave={}", 
                    note_idx, note.pitch, note.duration, note.octave);
            }
        }
        
        // Should have 5 notes: g'2, g'8 (from parentheses), e'8, d'8, c'8
        assert_eq!(total_notes, 5);
    }
    
    #[test]
    fn test_parser_with_chords() {
        let test_content = r#"\version "2.24.0"
\score { \new Staff { <c' c''>4 <d' d''>4 } }"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok());
        
        let parsed = result.unwrap();
        println!("解析成功，音符数: {}", parsed.staves.iter().map(|s| s.notes.len()).sum::<usize>());
        // Should have 2 chords
        assert_eq!(parsed.staves.iter().map(|s| s.notes.len()).sum::<usize>(), 2);
    }
}
