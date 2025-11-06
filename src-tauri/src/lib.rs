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
        println!("解析成功，音符数: {}", parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>());
    }
    
    #[test]
    fn test_parser_with_parentheses() {
        let test_content = r#"\version "2.24.0"
\score { \new Staff { g'2 (g'8) e'8 d'8 c'8 } }"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok());
        
        let parsed = result.unwrap();
        let total_notes = parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>();
        println!("解析成功，音符数: {}", total_notes);
        
        // Print details of each note
        for (staff_idx, staff) in parsed.staves.iter().enumerate() {
            println!("Staff {}: {} notes", staff_idx, staff.base.notes.len());
            for (note_idx, note) in staff.base.notes.iter().enumerate() {
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
        println!("解析成功，音符数: {}", parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>());
        // Should have 2 chords
        assert_eq!(parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>(), 2);
    }
    
    #[test]
    fn test_dynamics_with_spacer_rests() {
        let test_content = r#"\version "2.24.0"
\score { \new Staff { s8 \< s4 \> s4. \! c'4 d' e' f' } }"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse dynamics with spacer rests: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析力度记号成功，音符数: {}", parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>());
        
        // Should have spacer rests and regular notes
        assert!(parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>() >= 4);
    }
    
    #[test]
    fn test_crescendo_decrescendo() {
        let test_content = r#"\version "2.24.0"
\score { \new Staff { c'4 \< d' \> e' \! f' } }"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse crescendo/decrescendo: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析渐强渐弱成功，音符数: {}", parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>());
        
        // Should have 4 notes
        assert_eq!(parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>(), 4);
    }
    
    #[test]
    fn test_custom_function_call() {
        let test_content = r#"\version "2.24.0"
\score { \new Staff { c'4 \dynamictext "cresc." d' e' f' } }"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse custom function call: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析自定义函数调用成功，音符数: {}", parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>());
        
        // Should have 4 notes (the function call is ignored)
        assert_eq!(parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>(), 4);
    }
    
    #[test]
    fn test_custom_function_with_scheme_number() {
        let test_content = r#"\version "2.24.0"
\score { \new Staff { c'4 \myOttava #1 d' e' f' } }"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse custom function with scheme number: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析带数字参数的自定义函数成功，音符数: {}", parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>());
        
        // Should have 4 notes
        assert_eq!(parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>(), 4);
    }
    
    #[test]
    fn test_multiple_custom_functions() {
        let test_content = r#"\version "2.24.0"
\score { \new Staff { 
  c'4 \dynamictext "dolce" d' 
  e' \dynamictext "cresc." f' 
  g' \dynamictext "dim." a' 
} }"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse multiple custom functions: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析多个自定义函数成功，音符数: {}", parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>());
        
        // Should have 6 notes
        assert_eq!(parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>(), 6);
    }
    
    #[test]
    fn test_variable_with_custom_function() {
        let test_content = r#"\version "2.24.0"
din = \dynamictext "dimin."
\score { \new Staff { c'4 \din d' e' f' } }"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse variable with custom function: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析变量定义中的自定义函数成功");
        
        // Should have parsed the variable definition successfully
        // The variable 'din' should exist in the variables map
        assert!(parsed.variables.contains_key("din"), "Variable 'din' should be defined");
    }
    
    #[test]
    fn test_header_with_boolean() {
        let test_content = r#"\version "2.24.0"
\header {
  title = "Test Song"
  composer = "Test Composer"
  subsubtitle = ##f
  instrumentName = ##f
}
\score { \new Staff { c'4 d' e' f' } }"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse header with boolean: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析带布尔值的 header 成功");
        
        // Should have parsed title and composer
        assert_eq!(parsed.title, Some("Test Song".to_string()));
        assert_eq!(parsed.composer, Some("Test Composer".to_string()));
    }
    
    #[test]
    fn test_new_dynamics() {
        let test_content = r#"\version "2.24.0"
Dyn = { s8\< s4\> s4.\! }
\score {
  <<
    \new Staff { c'4 d' e' f' }
    \new Dynamics \Dyn
  >>
}"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse \\new Dynamics: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析 \\new Dynamics 成功");
        
        // Should have parsed the variable and the staff
        assert!(parsed.variables.contains_key("Dyn"), "Variable 'Dyn' should be defined");
        assert!(parsed.staves.len() >= 1, "Should have at least one staff");
    }
    
    #[test]
    fn test_new_nullvoice() {
        let test_content = r#"\version "2.24.0"
StrukturI = \relative c'' { c4 d e f }
\score {
  <<
    \new Staff { c'4 d' e' f' }
    \new NullVoice \StrukturI
  >>
}"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse \\new NullVoice: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析 \\new NullVoice 成功");
        
        // Should have parsed the variable and the staff
        assert!(parsed.variables.contains_key("StrukturI"), "Variable 'StrukturI' should be defined");
        assert!(parsed.staves.len() >= 1, "Should have at least one staff");
    }
}
