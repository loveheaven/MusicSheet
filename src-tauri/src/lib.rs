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
    
    #[test]
    fn test_variable_with_override_command() {
        let test_content = r#"\version "2.24.0"
parenthesizeHairpin =
\override Hairpin.stencil =
#(lambda (grob)
   (parenthesize-stencil
    (ly:hairpin::print grob)
    0.05
    0.4
    0
    0.2
    0.5
    ))
\score { \new Staff { c'4 d' e' f' } }"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse variable with override command: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析带有 \\override 命令的变量定义成功");
        
        // Should have parsed the variable definition successfully
        assert!(parsed.variables.contains_key("parenthesizeHairpin"), "Variable 'parenthesizeHairpin' should be defined");
    }
    
    #[test]
    fn test_variable_with_set_command() {
        let test_content = r#"\version "2.24.0"
myTempoSetting = \set Staff.ottavation = #"8"
\score { \new Staff { c'4 d' e' f' } }"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse variable with set command: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析带有 \\set 命令的变量定义成功");
        
        // Should have parsed the variable definition successfully
        assert!(parsed.variables.contains_key("myTempoSetting"), "Variable 'myTempoSetting' should be defined");
    }
    
    #[test]
    fn test_musical_note_with_marks() {
        let test_content = r#"\version "2.24.0"
\score { \new Staff { 
  c'4\trill d'\mordent e'\fermata f'\accent 
  g'^\markup { "text" } a'-1 b'_2 c''
} }"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse notes with marks: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析带有装饰音和标记的音符成功");
        
        // Should have 8 notes
        let total_notes = parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>();
        assert_eq!(total_notes, 8, "Should have 8 notes");
    }
    
    #[test]
    fn test_for_elise_snippet() {
        // Test a snippet from For_Elise.ly with various mark attachments
        let test_content = r#"\version "2.24.0"
\score { 
  \new Staff {
    \clef treble
    \key a \minor
    \time 3/8
    \partial 8
    e'16 ( dis' e' dis' e' h' d' c' a'8 )
    r16 c' ( e' a' h'8 ) r16 e' ( gis' h'
    c'8 ) r16 e' ( e'' dis' e' dis' e' h' d' c' a'8 )
  }
}"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse For_Elise snippet: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析 For_Elise 片段成功");
        
        // Should have at least one staff
        assert!(parsed.staves.len() >= 1, "Should have at least one staff");
        
        // The staff should have notes
        let total_notes = parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>();
        println!("Total notes parsed: {}", total_notes);
        assert!(total_notes > 0, "Should have parsed some notes");
    }
    
    #[test]
    fn test_chords_with_marks() {
        // Test chords with various marks and attachments
        let test_content = r#"\version "2.24.0"
\score { 
  \new Staff {
    <c' e' g'>4\arpeggio <d' f' a'>^\markup { "text" } 
    <e' g' b'>-1 <f' a' c''>_2
    <g' b' d''>4.\staccato <a' c'' e''>8\fermata
  }
}"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse chords with marks: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析带有标记的和弦成功");
        
        // Should have 6 chords
        let total_notes = parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>();
        println!("Total chords parsed: {}", total_notes);
        assert_eq!(total_notes, 6, "Should have 6 chords");
        
        // Check that they are marked as chords
        let first_staff = &parsed.staves[0];
        for (i, note) in first_staff.base.notes.iter().enumerate() {
            assert_eq!(note.note_type, lilypond_parser::NoteType::Chord, "Note {} should be a chord", i);
            assert!(!note.chord_notes.is_empty(), "Chord {} should have additional notes", i);
        }
    }
    
    #[test]
    fn test_chord_with_fingerings() {
        // Test chords with fingerings from For_Elise.ly
        let test_content = r#"\version "2.24.0"
\score { 
  \new Staff {
    <e-1 c'-5>4 <f-1 c'-5> <e-1 g-2 c-5>
  }
}"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse chords with fingerings: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析带有指法标记的和弦成功");
        
        // Should have 3 chords
        let total_notes = parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>();
        println!("Total chords with fingerings: {}", total_notes);
        assert_eq!(total_notes, 3, "Should have 3 chords");
    }
    
    #[test]
    fn test_complex_chord_from_for_elise() {
        // Test actual complex chords from For_Elise.ly line 147
        let test_content = r#"\version "2.24.0"
\score { 
  \new Staff {
    <e-1 c'-5>-. <f-1 c'-5>-. <e-1 g-2 c-5>-.
    <e-1 g-2 b-3 cis-5>4.->
    <f-1 a-2 d-5>4-> <cis'-2 e-4>16 <d-3 f-5>
  }
}"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse complex chords from For_Elise: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析 For_Elise 复杂和弦成功");
        
        // Should have parsed all chords
        let total_notes = parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>();
        println!("Total complex chords parsed: {}", total_notes);
        assert!(total_notes >= 6, "Should have at least 6 chords");
        
        // Verify the first chord has the right structure
        let first_staff = &parsed.staves[0];
        let first_chord = &first_staff.base.notes[0];
        assert_eq!(first_chord.note_type, lilypond_parser::NoteType::Chord);
        assert_eq!(first_chord.pitch, "e"); // Base note is 'e'
        assert_eq!(first_chord.chord_notes.len(), 1, "First chord should have 1 additional note (c')");
    }
    
    #[test]
    fn test_accidental_modifiers() {
        // Test forced reminder accidental (!) and cautionary accidental (?)
        let test_content = r#"\version "2.24.0"
\score { 
  \new Staff {
    cis'!4 d'? e'! f'?
    g'4 a'! b'? c''
  }
}"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse accidental modifiers: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析临时变音记号修饰符成功");
        
        // Should have 8 notes
        let total_notes = parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>();
        assert_eq!(total_notes, 8, "Should have 8 notes");
        
        // Verify accidental modifiers
        let first_staff = &parsed.staves[0];
        assert_eq!(first_staff.base.notes[0].accidental_modifier, Some("!".to_string()), "First note should have ! modifier");
        assert_eq!(first_staff.base.notes[1].accidental_modifier, Some("?".to_string()), "Second note should have ? modifier");
        assert_eq!(first_staff.base.notes[2].accidental_modifier, Some("!".to_string()), "Third note should have ! modifier");
        assert_eq!(first_staff.base.notes[3].accidental_modifier, Some("?".to_string()), "Fourth note should have ? modifier");
        assert_eq!(first_staff.base.notes[4].accidental_modifier, None, "Fifth note should have no modifier");
        assert_eq!(first_staff.base.notes[5].accidental_modifier, Some("!".to_string()), "Sixth note should have ! modifier");
    }
    
    #[test]
    fn test_accidental_modifiers_with_duration() {
        // Test that accidental modifiers work correctly with durations
        let test_content = r#"\version "2.24.0"
\score { 
  \new Staff {
    c'!4 d'?8 e'!16 f'?2
  }
}"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse accidental modifiers with duration: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析带时值的临时变音记号修饰符成功");
        
        // Should have 4 notes
        let total_notes = parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>();
        assert_eq!(total_notes, 4, "Should have 4 notes");
        
        // Verify each note has correct duration and modifier
        let first_staff = &parsed.staves[0];
        assert_eq!(first_staff.base.notes[0].duration, "4");
        assert_eq!(first_staff.base.notes[0].accidental_modifier, Some("!".to_string()));
        
        assert_eq!(first_staff.base.notes[1].duration, "8");
        assert_eq!(first_staff.base.notes[1].accidental_modifier, Some("?".to_string()));
        
        assert_eq!(first_staff.base.notes[2].duration, "16");
        assert_eq!(first_staff.base.notes[2].accidental_modifier, Some("!".to_string()));
        
        assert_eq!(first_staff.base.notes[3].duration, "2");
        assert_eq!(first_staff.base.notes[3].accidental_modifier, Some("?".to_string()));
    }
    
    #[test]
    fn test_accidental_modifiers_in_chords() {
        // Test accidental modifiers on individual notes within chords
        let test_content = r#"\version "2.24.0"
\score { 
  \new Staff {
    <c'! e'? g'>4 <d' f'! a'?>2
  }
}"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse chords with accidental modifiers: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析和弦中的临时变音记号修饰符成功");
        
        // Should have 2 chords
        let total_notes = parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>();
        assert_eq!(total_notes, 2, "Should have 2 chords");
        
        // Verify the first chord's base note has ! modifier
        let first_staff = &parsed.staves[0];
        let first_chord = &first_staff.base.notes[0];
        assert_eq!(first_chord.note_type, lilypond_parser::NoteType::Chord);
        assert_eq!(first_chord.accidental_modifier, Some("!".to_string()), "First chord's base note should have ! modifier");
    }
    
    #[test]
    fn test_language_directive() {
        // Test parsing language directive
        let test_content = r#"\version "2.24.0"
\language "deutsch"
\score { 
  \new Staff {
    c'4 d' e' f'
  }
}"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse language directive: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析 language 指令成功");
        
        // Should have parsed the language
        assert_eq!(parsed.language, Some("deutsch".to_string()), "Language should be 'deutsch'");
    }
    
    #[test]
    fn test_language_directive_with_notes() {
        // Test that language directive works with German note names (h for B-natural)
        let test_content = r#"\version "2.24.0"
\language "deutsch"
\score { 
  \new Staff {
    c'4 h' a' g'
  }
}"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse German notes: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析德语音符名称成功");
        
        // Should have parsed the language
        assert_eq!(parsed.language, Some("deutsch".to_string()), "Language should be 'deutsch'");
        
        // Should have 4 notes
        let total_notes = parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>();
        assert_eq!(total_notes, 4, "Should have 4 notes");
        
        // Verify notes were parsed correctly
        let first_staff = &parsed.staves[0];
        assert_eq!(first_staff.base.notes[0].pitch, "c");
        assert_eq!(first_staff.base.notes[1].pitch, "h"); // German B-natural
        assert_eq!(first_staff.base.notes[2].pitch, "a");
        assert_eq!(first_staff.base.notes[3].pitch, "g");
    }
    
    #[test]
    fn test_for_elise_language() {
        // Test parsing For_Elise.ly which uses \language "deutsch"
        let test_content = r#"\version "2.22.0"
\language "deutsch"

\score { 
  \new Staff {
    \clef treble
    \key a \minor
    \time 3/8
    e'16 ( dis' e' dis' e' h' d' c' a'8 )
  }
}"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse For_Elise language: {:?}", result);
        
        let parsed = result.unwrap();
        println!("✅ 解析 For_Elise language 指令成功");
        
        // Should have parsed the language as "deutsch"
        assert_eq!(parsed.language, Some("deutsch".to_string()), "Language should be 'deutsch'");
        
        // Verify that German note names were parsed correctly
        let total_notes = parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>();
        assert!(total_notes > 0, "Should have parsed some notes");
        
        // Verify that German note 'h' (B natural) was parsed correctly
        let first_staff = &parsed.staves[0];
        // Should find some 'h' notes (B natural in German)
        let has_h_notes = first_staff.base.notes.iter().any(|note| note.pitch == "h");
        assert!(has_h_notes, "Should have parsed German 'h' notes (B natural)");
    }
    
    #[test]
    fn test_pitch_mapping() {
        // Test that the pitch mapping function works correctly
        use lilypond_parser::get_standard_pitch;
        
        // Test German note names
        assert_eq!(get_standard_pitch("h", Some("deutsch")), "b", "German 'h' should map to 'b' (B natural)");
        assert_eq!(get_standard_pitch("b", Some("deutsch")), "bes", "German 'b' should map to 'bes' (B flat)");
        assert_eq!(get_standard_pitch("c", Some("deutsch")), "c", "German 'c' should stay 'c'");
        assert_eq!(get_standard_pitch("as", Some("deutsch")), "aes", "German 'as' should map to 'aes'");
        assert_eq!(get_standard_pitch("es", Some("deutsch")), "ees", "German 'es' should map to 'ees'");
        
        // Test English note names (no conversion)
        assert_eq!(get_standard_pitch("b", Some("english")), "b", "English 'b' should stay 'b'");
        assert_eq!(get_standard_pitch("c", Some("english")), "c", "English 'c' should stay 'c'");
        
        // Test default (no language specified)
        assert_eq!(get_standard_pitch("b", None), "b", "Default 'b' should stay 'b'");
        
        println!("✅ 音符名称映射测试成功");
    }
    
    #[test]
    fn test_repeat_volta() {
        // Test parsing \repeat volta with simple repeat
        let test_content = r#"\version "2.24.0"
\score { 
  \new Staff {
    \repeat volta 2 {
      c'4 d' e' f'
    }
  }
}"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse repeat volta: {:?}", result);
        
        let parsed = result.unwrap();
        
        // Should have repeated the 4 notes 2 times = 8 notes total
        let total_notes = parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>();
        assert_eq!(total_notes, 8, "Should have 8 notes (4 notes repeated 2 times)");
        
        let first_staff = &parsed.staves[0];
        // First 4 notes
        assert_eq!(first_staff.base.notes[0].pitch, "c");
        assert_eq!(first_staff.base.notes[1].pitch, "d");
        assert_eq!(first_staff.base.notes[2].pitch, "e");
        assert_eq!(first_staff.base.notes[3].pitch, "f");
        // Second 4 notes (repeated)
        assert_eq!(first_staff.base.notes[4].pitch, "c");
        assert_eq!(first_staff.base.notes[5].pitch, "d");
        assert_eq!(first_staff.base.notes[6].pitch, "e");
        assert_eq!(first_staff.base.notes[7].pitch, "f");
        
        println!("✅ 解析 repeat volta 成功");
    }
    
    #[test]
    fn test_repeat_volta_with_alternative() {
        // Test parsing \repeat volta with alternative endings
        let test_content = r#"\version "2.24.0"
\score { 
  \new Staff {
    \repeat volta 2 {
      c'4 d' e' f'
    }
    \alternative {
      { g'4 }
      { a'4 }
    }
  }
}"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse repeat volta with alternative: {:?}", result);
        
        let parsed = result.unwrap();
        
        // Should have: 4 notes + g', then 4 notes + a' = 10 notes total
        let total_notes = parsed.staves.iter().map(|s| s.base.notes.len()).sum::<usize>();
        assert_eq!(total_notes, 10, "Should have 10 notes (4 notes + g', 4 notes + a')");
        
        let first_staff = &parsed.staves[0];
        // First ending: c d e f g
        assert_eq!(first_staff.base.notes[0].pitch, "c");
        assert_eq!(first_staff.base.notes[1].pitch, "d");
        assert_eq!(first_staff.base.notes[2].pitch, "e");
        assert_eq!(first_staff.base.notes[3].pitch, "f");
        assert_eq!(first_staff.base.notes[4].pitch, "g");
        // Second ending: c d e f a
        assert_eq!(first_staff.base.notes[5].pitch, "c");
        assert_eq!(first_staff.base.notes[6].pitch, "d");
        assert_eq!(first_staff.base.notes[7].pitch, "e");
        assert_eq!(first_staff.base.notes[8].pitch, "f");
        assert_eq!(first_staff.base.notes[9].pitch, "a");
        
        println!("✅ 解析 repeat volta with alternative 成功");
    }
    
    #[test]
    fn test_repeat_volta_relative_octave() {
        // Test that octave calculation works correctly in repeat volta with relative mode
        // Format: RH = \relative c'' { \repeat volta 2 { ... } }
        let test_content = r#"\version "2.24.0"

RH = \relative c'' {
  \repeat volta 2 {
    e16 ( dis e dis e b d c a8 )
  }
}

\score { 
  \new Staff {
    \RH
  }
}"#;
        
        let result = lilypond_parser::parse_lilypond(test_content);
        assert!(result.is_ok(), "Failed to parse repeat volta relative: {:?}", result);
        
        let parsed = result.unwrap();
        println!("Parsed staves count: {}", parsed.staves.len());
        assert!(parsed.staves.len() > 0, "Should have at least one staff");
        let first_staff = &parsed.staves[0];
        println!("First staff notes count: {}", first_staff.base.notes.len());
        
        // Should have 18 notes (9 notes repeated 2 times)
        let total_notes = first_staff.base.notes.len();
        assert_eq!(total_notes, 18, "Should have 18 notes (9 notes * 2 repeats), got {}", total_notes);
        
        // Print all notes for debugging
        println!("\n=== First repetition ===");
        for (i, note) in first_staff.base.notes.iter().take(9).enumerate() {
            println!("Note {}: pitch={} octave={}", i, note.pitch, note.octave);
        }
        
        println!("\n=== Second repetition ===");
        for (i, note) in first_staff.base.notes.iter().skip(9).take(9).enumerate() {
            println!("Note {}: pitch={} octave={}", i + 9, note.pitch, note.octave);
        }
        
        // Check first repetition octaves
        // Starting from c'' (octave 5), relative mode
        assert_eq!(first_staff.base.notes[0].pitch, "e");
        assert_eq!(first_staff.base.notes[0].octave, 5, "e should be octave 5");
        
        assert_eq!(first_staff.base.notes[5].pitch, "b");
        println!("b octave: {}", first_staff.base.notes[5].octave);
        assert_eq!(first_staff.base.notes[5].octave, 4, "b should be octave 4 (closest to e5)");
        
        assert_eq!(first_staff.base.notes[6].pitch, "d");
        assert_eq!(first_staff.base.notes[6].octave, 5, "d should be octave 5 (closest to b4)");
        
        assert_eq!(first_staff.base.notes[7].pitch, "c");
        assert_eq!(first_staff.base.notes[7].octave, 5, "c should be octave 5 (closest to d5)");
        
        assert_eq!(first_staff.base.notes[8].pitch, "a");
        assert_eq!(first_staff.base.notes[8].octave, 4, "a should be octave 4 (closest to c5)");
        
        // Check second repetition - should have same octaves as first
        assert_eq!(first_staff.base.notes[9].octave, first_staff.base.notes[0].octave, 
            "Second repetition first note should have same octave as first repetition");
        
        println!("✅ 解析 repeat volta relative octave 成功");
    }
}

