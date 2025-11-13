use pest::Parser;
use pest_derive::Parser;
use serde::{Serialize, Deserialize};
use std::{collections::HashMap};

#[derive(Parser)]
#[grammar = "lilypond.pest"]
pub struct LilyPondParser;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum NoteType {
    Default,
    Clef,
    Chord,
    Time,
    Key,
    Rest,
    Grace,
    Ottava,
    RepeatStart,
    RepeatEnd,
    AlternativeStart,
    AlternativeEnd,
}

impl Default for NoteType {
    fn default() -> Self {
        NoteType::Default
    }
}

// Script attachment direction (above, below, or default)
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ScriptDirection {
    Above,   // ^
    Below,   // _
    Default, // -
}

// Script attachment content type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ScriptContent {
    Fingering(u32),           // Fingering number like -1, -2, ^3
    Text(String),             // String literal like ^"text"
    Markup(String),           // Markup expression like ^\markup { "text" }
    Articulation(String),     // Articulation mark like ^., ^-, etc.
    Empty,                    // Just direction without content
}

// Complete script attachment
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptAttachment {
    pub direction: ScriptDirection,
    pub content: ScriptContent,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LilyPondNote {
    pub pitch: String,
    pub duration: String,
    pub octave: i32,
    pub dots: String,  // Dotted notes (e.g., "." or "..")
    pub chord_notes: Vec<(String, i32)>,  // Additional notes in chord: (pitch, octave)
    pub clef: Option<String>,  // Clef at this note position (if changed)
    pub time_sig: Option<String>,  // Time signature (e.g., "4/4", "3/4")
    pub key_sig: Option<String>,  // Key signature (e.g., "C", "G", "F")
    pub ottava: Option<i32>,  // Octave transposition (e.g., 1 for up one octave, -1 for down one octave)
    pub arpeggio: bool,  // True if this note has an arpeggio marking
    #[serde(default)]
    pub note_type: NoteType,  // Type of note: Default, Clef, Chord, Time
    #[serde(default)]
    pub group_start: bool,  // True if this note starts a slur group (note before opening parenthesis)
    #[serde(default)]
    pub group_end: bool,  // True if this note ends a slur group (last note before closing parenthesis)
    #[serde(default)]
    pub has_slur: bool,  // True if this note has a ~ marker (for slur to next note)
    #[serde(default)]
    pub script_attachments: Vec<ScriptAttachment>,  // Script attachments (fingering, text, markup, etc.)
    #[serde(default)]
    pub accidental_modifier: Option<String>,  // Accidental modifier: "!" (forced) or "?" (cautionary)
    #[serde(default)]
    pub alternative_index: Vec<i32>,  // Alternative index (for alternative endings)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Lyric {
    pub text_nodes: Vec<String>,
}
impl Lyric {
    pub fn new(lyrics_text: String) -> Self {
        Self { text_nodes: lyrics_text.split(&[' ', '\t', '\n'][..]).filter(|s| !s.is_empty()).map(|s| {
            if s == "_" {
                " ".to_string()
            } else if s == "--" {
                " ".to_string()
            } else if s.contains('_') {
                s.replace('_', " ")
            } else {
                s.to_string()
            }
        }).collect() }
    }
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MusicMode {
    Absolute,
    Relative { reference: Option<LilyPondNote> },
    Fixed { reference: LilyPondNote },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MusicContainerBase {
    pub name: Option<String>,
    pub clef: Option<String>,
    pub time_signature: Option<String>,
    pub key_signature: Option<String>,
    pub notes: Vec<LilyPondNote>,
}

#[derive(Debug, Clone)]
pub struct Variable {
    pub base: MusicContainerBase,
    pub lyric: Option<Lyric>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Measure {
    pub notes: Vec<u32>,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Voice {
    pub base: MusicContainerBase,
    pub lyrics: Vec<Lyric>,
    pub measures: Vec<Measure>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Staff {
    #[serde(flatten)]
    pub base: MusicContainerBase,
    pub voices: Vec<Voice>,
    pub measures: Vec<Measure>,
}

impl Staff {
    pub fn new(name: Option<String>) -> Self {
        Self {
            base: MusicContainerBase {
                name,
                clef: None,
                time_signature: None,
                key_signature: None,
                notes: Vec::new(),
            },
            voices: Vec::new(),
            measures: Vec::new(),
        }
    }
}

impl Default for Staff {
    fn default() -> Self {
        Self::new(None)
    }
}


#[derive(Debug, Serialize, Deserialize)]
pub struct ParsedMusic {
    pub title: Option<String>,
    pub composer: Option<String>,
    pub tempo: Option<String>,
    pub key_signature: Option<String>,
    pub time_signature: Option<String>,
    pub partial: Option<String>,  // Pickup measure duration (e.g., "8", "4", "16")
    pub language: Option<String>,
    pub staves: Vec<Staff>,
    pub music_mode: Option<MusicMode>,
    #[serde(skip)]
    pub variables: HashMap<String, Variable>,
    #[serde(skip)]
    pub voices: HashMap<String, (usize, usize)>, // (staff_index, voice_index)
}

// API-friendly version for frontend (with simplified music_mode as string)
#[derive(Debug, Serialize, Deserialize)]
pub struct ApiParsedMusic {
    pub title: Option<String>,
    pub composer: Option<String>,
    pub tempo: Option<String>,
    pub key_signature: Option<String>,
    pub time_signature: Option<String>,
    pub partial: Option<String>,  // Pickup measure duration (e.g., "8", "4", "16")
    pub language: Option<String>,
    pub staves: Vec<Staff>,
    pub music_mode: Option<String>, // Simplified as string for frontend
}

// Convert from internal ParsedMusic to API-friendly version
impl From<ParsedMusic> for ApiParsedMusic {
    fn from(parsed: ParsedMusic) -> Self {
        Self {
            title: parsed.title,
            composer: parsed.composer,
            tempo: parsed.tempo,
            key_signature: parsed.key_signature,
            time_signature: parsed.time_signature,
            partial: parsed.partial,
            language: parsed.language,
            staves: parsed.staves,
            music_mode: parsed.music_mode.map(|mode| format!("{:?}", mode)),
        }
    }
}

impl ParsedMusic {
    pub fn new() -> Self {
        Self {
            title: None,
            composer: None,
            tempo: None,
            key_signature: None,
            time_signature: None,
            partial: None,
            language: Some("english".to_string()),
            staves: Vec::new(),
            music_mode: None,
            variables: HashMap::new(),
            voices: HashMap::new(),
        }
    }
}

pub fn parse_lilypond(content: &str) -> Result<ParsedMusic, String> {
    println!("Parse start!");
    let pairs = LilyPondParser::parse(Rule::lilypond_file, content)
        .map_err(|e| format!("Parse error: {}", e))?;
    println!("Parse success!");

    let mut parsed = ParsedMusic::new();
    
    for pair in pairs {
        match pair.as_rule() {
            Rule::lilypond_file => {
                parse_lilypond_file(pair, &mut parsed)?;
            }
            _ => {}
        }
    }

    // 组织音符成小节
    organize_measures(&mut parsed)?;

    Ok(parsed)
}

fn parse_lilypond_file(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::top_level_item => parse_top_level_item(inner_pair, parsed)?,
            Rule::EOI => break,
            _ => {}
        }
    }
    Ok(())
}

fn parse_top_level_item(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::version => {
                // Skip version for now
            },
            Rule::language => {
                // Parse language directive (e.g., \language "deutsch")
                for lang_pair in inner_pair.into_inner() {
                    if lang_pair.as_rule() == Rule::string_literal {
                        let lang_str = lang_pair.as_str();
                        // Remove quotes from string literal
                        let language = lang_str[1..lang_str.len()-1].to_string();
                        parsed.language = Some(language.to_lowercase().clone());
                        println!("[parse_top_level_item] Parsed language: {}", language);
                    }
                }
            },
            Rule::header => {
                parse_header(inner_pair, parsed)?;
            },
            Rule::score => {
                parse_score(inner_pair, parsed)?;
            },
            Rule::book => {
                parse_book(inner_pair, parsed)?;
            },
            Rule::bookpart => {
                parse_bookpart(inner_pair, parsed)?;
            },
            Rule::music_mode => {
                // parse_music_mode_without_staff(inner_pair, parsed)?;
            },
            Rule::simple_command => {
                // Skip simple commands for now
            },
            Rule::scheme_code => {
                // Skip scheme code for now
            },
            Rule::include_directive => {
                // Skip include directives for now
            },
            Rule::paper_block => {
                // Skip paper blocks
            },
            Rule::variable_definition => {
                // Parse variable definitions
                // println!("[DEBUG] Parsing variable_definition: {}", inner_pair.as_str());
                parse_variable_definition(inner_pair, parsed)?;
            },
            Rule::pointandclickoff => {
                // Skip pointandclickoff
            },
            _ => {}
        }
    }
    Ok(())
}

fn parse_score(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::score_content => parse_score_content(inner_pair, parsed)?,
            Rule::layout_block => {
                // Skip layout block
            },
            Rule::midi_block => {
                // Skip midi block
            },
            _ => {}
        }
    }
    Ok(())
}

fn parse_score_content(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::simultaneous_music => {
                parse_simultaneous_music(inner_pair, parsed)?;
            },
            Rule::piano_staff => {
                parse_piano_staff(inner_pair, parsed)?;
            },
            Rule::staff => {
                // Create a new staff and parse into it
                let staff = Staff::new(None);
                parsed.staves.push(staff);
                parse_staff(inner_pair, parsed)?;
            },
            Rule::simple_staff => {
                // Create a new staff and parse into it
                let staff = Staff::new(None);
                parsed.staves.push(staff);
                parse_simple_staff(inner_pair, parsed)?;
            },            
            Rule::music_mode => {
                parse_music_mode_without_staff(inner_pair, parsed)?;
            },
            Rule::simple_command => {
                // Skip simple commands for now
            },
            Rule::scheme_code => {
                // Skip scheme code for now
            },
            Rule::include_directive => {
                // Skip include directives for now
            },
            Rule::paper_block => {
                // Skip paper blocks for now
            },
            Rule::variable_definition => {
                // Skip variable definitions for now
            },
            _ => {}
        }
    }
    Ok(())
}

fn parse_simultaneous_music(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    // Parse parallel staves (<<...>>)
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::staff => {
                // Create a new staff and parse into it
                let staff = Staff::new(None);
                parsed.staves.push(staff);
                parse_staff(inner_pair, parsed)?;
                
                
                // if !staff.base.notes.is_empty() {
                //     parsed.staves.push(staff);
                // }
            },
            Rule::simple_staff => {
                // Create a new staff and parse into it
                let staff = Staff::new(None);
                parsed.staves.push(staff);
                parse_simple_staff(inner_pair, parsed)?;
            },
            Rule::music_mode => {
                parse_music_mode_without_staff(inner_pair, parsed)?;
            },
            Rule::addlyrics => parse_addlyrics(inner_pair, parsed)?,
            Rule::new_lyrics => {
                parse_new_lyrics(inner_pair, parsed)?;
            },
            Rule::new_dynamics => {
                // Parse \new Dynamics context - for now, treat it similar to a staff
                parse_new_dynamics(inner_pair, parsed)?;
            },
            Rule::new_nullvoice => {
                // Parse \new NullVoice context - used for structural information
                parse_new_nullvoice(inner_pair, parsed)?;
            },
            _ => {}
        }
    }
    Ok(())
}

fn parse_header(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    for inner_pair in pair.into_inner() {
        if inner_pair.as_rule() == Rule::header_item {
            let mut key = String::new();
            let mut value = String::new();
            
            for item_pair in inner_pair.into_inner() {
                match item_pair.as_rule() {
                    Rule::identifier => key = item_pair.as_str().to_string(),
                    Rule::header_value => {
                        // Parse different types of header values
                        for value_pair in item_pair.into_inner() {
                            match value_pair.as_rule() {
                                Rule::string_literal => {
                                    let s = value_pair.as_str();
                                    // Remove quotes
                                    value = s[1..s.len()-1].to_string();
                                },
                                Rule::boolean_literal => {
                                    // For boolean values like ##f or ##t, store as-is
                                    value = value_pair.as_str().to_string();
                                },
                                Rule::markup_expression => {
                                    // For markup expressions, store the raw text
                                    value = value_pair.as_str().to_string();
                                },
                                Rule::scheme_code => {
                                    // For scheme code, store the raw text
                                    value = value_pair.as_str().to_string();
                                },
                                Rule::identifier => {
                                    // For identifiers (variable references), store as-is
                                    value = value_pair.as_str().to_string();
                                },
                                _ => {}
                            }
                        }
                    }
                    _ => {}
                }
            }
            
            match key.as_str() {
                "title" => {
                    parsed.title = Some(value);
                },
                "composer" => {
                    parsed.composer = Some(value);
                },
                "tempo" => {
                    parsed.tempo = Some(value);
                },
                _ => {
                    // Ignore other header fields like subsubtitle, instrumentName, etc.
                }
            }
        }
    }
    Ok(())
}

fn parse_book(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::book_item => parse_book_item(inner_pair, parsed)?,
            _ => {}
        }
    }
    Ok(())
}

fn parse_bookpart(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::book_item => parse_book_item(inner_pair, parsed)?,
            _ => {}
        }
    }
    Ok(())
}

fn parse_book_item(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::score => parse_score(inner_pair, parsed)?,
            Rule::header => parse_header(inner_pair, parsed)?,
            _ => {}
        }
    }
    Ok(())
}

fn parse_piano_staff(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    // Parse PianoStaff which contains simultaneous music
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::simultaneous_music => {
                parse_simultaneous_music(inner_pair, parsed)?;
            },
            _ => {}
        }
    }
    Ok(())
}

fn parse_staff(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    let mut staff_body_pair = None;
    
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::identifier => {
                // This is the staff name (e.g., "upper" in \new Staff = upper)
                if let Some(staff) = parsed.staves.last_mut() {
                    staff.base.name = Some(inner_pair.as_str().to_string());
                }
            },
            Rule::string_literal => {
                // This is the staff name as a string literal
                let s = inner_pair.as_str();
                if let Some(staff) = parsed.staves.last_mut() {
                    staff.base.name = Some(s[1..s.len()-1].to_string());
                }
            },
            Rule::staff_body => {
                staff_body_pair = Some(inner_pair);
            },
            _ => {}
        }
    }
    
    // Process staff_body after releasing the mutable borrow
    if let Some(staff_body) = staff_body_pair {
        let staff_idx = parsed.staves.len() - 1;
        let base_ptr = &mut parsed.staves[staff_idx].base as *mut MusicContainerBase;
        parse_staff_body(staff_body, parsed, unsafe { &mut *base_ptr })?;
    }
    
    Ok(())
}

fn parse_simple_staff(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    let mut staff_body_pair = None;
    
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::staff_body => {
                staff_body_pair = Some(inner_pair);
            },
            _ => {}
        }
    }
    
    // Process staff_body after releasing the mutable borrow
    if let Some(staff_body) = staff_body_pair {
        let staff_idx = parsed.staves.len() - 1;
        let base_ptr = &mut parsed.staves[staff_idx].base as *mut MusicContainerBase;
        parse_staff_body(staff_body, parsed, unsafe { &mut *base_ptr })?;
    }
    
    Ok(())
}

fn parse_staff_body(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic, base: &mut MusicContainerBase) -> Result<(), String> {
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::staff_directive => parse_staff_directive(inner_pair, parsed, base)?,
            Rule::music_sequence => {
                let mut last_duration = "4".to_string();
                let mut last_octave: i32  = 0; // Default octave for Absolute mode
                let mut last_pitch = String::new();
                parse_music_sequence(inner_pair, &mut base.notes, parsed, &mut last_duration, &mut last_octave, &mut last_pitch, OctaveMode::Absolute)?;
            },
            _ => {}
        }
    }
    // Find the first note with is_clef=true and set staff.clef
    for note in &base.notes {
        if note.note_type == NoteType::Clef {
            base.clef = note.clef.clone();
            break;
        }
    }
    Ok(())
}

fn parse_variable_definition(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    let mut var_name = String::new();
    let mut var_notes = Vec::new();
    let mut var_clef: Option<String> = None;
    let mut var_time: Option<String> = None;
    let mut var_key: Option<String> = None;
    let mut var_lyric: Option<Lyric> = None;
    
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::variable_name => {
                var_name = inner_pair.as_str().to_string();
            },
            Rule::variable_value => {
                // If it's a music_mode, extract notes from it
                for value_pair in inner_pair.into_inner() {
                    match value_pair.as_rule() {
                        Rule::music_mode => {
                            println!("[DEBUG] Variable {} contains music_mode ", var_name);
                            parse_music_mode(value_pair.clone(),&mut var_notes, parsed)?;
                        },
                        Rule::lyricmode => {
                            var_lyric = parse_lyric_mode(value_pair.clone())?;
                        },
                        Rule::scheme_code => {
                            // Parse Scheme code (e.g., #(make-span-event 'SustainEvent STOP))
                            // For now, we just acknowledge it exists but don't process it further
                            println!("[DEBUG] Variable {} contains scheme_code: {}", var_name, value_pair.as_str());
                        },
                        Rule::custom_function_call => {
                            // Custom function calls like \dynamictext "dimin."
                            // For now, we just acknowledge it exists but don't process it further
                            println!("[DEBUG] Variable {} contains custom_function_call: {}", var_name, value_pair.as_str());
                        },
                        Rule::bare_music_block => {
                            // Parse bare music block (e.g., { notes })
                            println!("[DEBUG] Variable {} contains bare_music_block", var_name);
                            for block_pair in value_pair.into_inner() {
                                if block_pair.as_rule() == Rule::basic_music_sequence {
                                    let mut last_duration = String::from("4");
                                    let mut last_octave = 3i32;
                                    let mut last_pitch = String::new();
                                    parse_basic_music_item(block_pair, &mut var_notes, parsed, &mut last_duration, &mut last_octave, &mut last_pitch, OctaveMode::Absolute)?;
                                }
                            }
                        },
                        _ => {}
                    }
                }
            },
            _ => {}
        }
    }
    
    // Get clef from the first note with is_clef=true
    for note in &var_notes {
        if note.note_type == NoteType::Clef {
            var_clef = note.clef.clone();
            break;
        }
    }
    for note in &var_notes {
        if note.note_type == NoteType::Time {
            var_time = note.time_sig.clone();
            break;
        }
    }

    for note in &var_notes {
        if note.note_type == NoteType::Key {
            var_key = note.key_sig.clone();
            break;
        }
    }
    
    
    // Store the variable with its notes
    if !var_name.is_empty() {
        let variable = Variable {
            base: MusicContainerBase {
                name: Some(var_name.clone()),
                notes: var_notes.clone(),
                clef: var_clef.clone(),
                time_signature: var_time.clone(),
                key_signature: var_key.clone(),
            },
            lyric: var_lyric.clone(),
        };
        parsed.variables.insert(var_name.clone(), variable);
    }
    
    Ok(())
}

// Staff-aware parsing functions
fn parse_staff_directive(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic, base: &mut MusicContainerBase) -> Result<(), String> {
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::clef => {
                // Extract clef information from clef rule
                for clef_item in inner_pair.into_inner() {
                    match clef_item.as_rule() {
                        Rule::clef_type => {
                            base.clef = Some(clef_item.as_str().to_string());
                        },
                        Rule::string_literal => {
                            // Handle quoted clef like "treble" or "bass"
                            let s = clef_item.as_str();
                            let clef_value = s[1..s.len()-1].to_string(); // Remove quotes
                            base.clef = Some(clef_value);
                        },
                        Rule::identifier => {
                            // Handle unquoted identifier
                            base.clef = Some(clef_item.as_str().to_string());
                        },
                        _ => {}
                    }
                }
            },
            Rule::key_signature => {
                parse_key_signature(inner_pair, parsed)?;
                base.key_signature = parsed.key_signature.clone();
            },
            Rule::time_signature => parse_time_signature(inner_pair, parsed)?,
            Rule::tempo => parse_tempo(inner_pair, parsed)?,
            Rule::partial => parse_partial(inner_pair, parsed)?,
            _ => {}
        }
    }
    Ok(())
}

fn parse_key_signature(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    let mut note = String::new();
    let mut mode = String::new();
    
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::key_note => note = inner_pair.as_str().to_string(),
            Rule::key_mode => mode = inner_pair.as_str().to_string(),
            _ => {}
        }
    }
    
    // Convert LilyPond format to VexFlow format
    let vexflow_key = convert_key_signature(&note, &mode);
    println!("[parse_key_signature] Key signature: {:?}", vexflow_key);
    parsed.key_signature = Some(vexflow_key);
    Ok(())
}

fn parse_time_signature(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::fraction => {
                let time_sig = inner_pair.as_str().to_string();
                parsed.time_signature = Some(time_sig);
            },
            Rule::unsigned => {
                // Handle "4/4" format parsed as separate numbers
                // This is a simplified approach - in a full parser you'd handle this more carefully
            },
            _ => {}
        }
    }
    println!("[parse_time_signature] Time signature: {:?}", parsed.time_signature);
    Ok(())
}

fn parse_tempo(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::string_literal => {
                let s = inner_pair.as_str();
                let tempo = s[1..s.len()-1].to_string(); // Remove quotes
                parsed.tempo = Some(tempo);
            },
            _ => {}
        }
    }
    Ok(())
}

fn parse_partial(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::duration => {
                // Extract only the duration_number part (e.g., "8", "4", "16")
                let mut duration_value = String::new();
                for duration_item in inner_pair.into_inner() {
                    match duration_item.as_rule() {
                        Rule::duration_number => {
                            duration_value = duration_item.as_str().to_string();
                        },
                        Rule::duration_dots => {
                            // Add dots if present
                            duration_value.push_str(duration_item.as_str());
                        },
                        _ => {}
                    }
                }
                
                if !duration_value.is_empty() {
                    parsed.partial = Some(duration_value.clone());
                    println!("[parse_partial] Partial (pickup measure): {}", duration_value);
                }
            },
            _ => {}
        }
    }
    Ok(())
}

fn parse_addlyrics(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    let mut lyric: Option<Lyric> = None;
    
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::lyric_sequence => {
                lyric = parse_lyric_sequence(inner_pair, parsed)?;
            },
            _ => {}
        }
    }
    
    if let Some(lyric) = lyric {
        if !parsed.staves.is_empty() {
            if let Some(last_voice) = parsed.staves.last_mut().and_then(|s| s.voices.last_mut()) {
                last_voice.lyrics.push(lyric);
            }
        }
    }
    
    Ok(())
}

fn parse_new_lyrics(pair: pest::iterators::Pair<Rule>, parsed: &mut ParsedMusic) -> Result<(), String> {
    let mut lyric: Option<Lyric> = None;
    let mut lyricsto_target: Option<String> = None;
    
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::string_literal => {
                // let s = inner_pair.as_str();
                // let content = s[1..s.len()-1].to_string();
                // if lyricsto_target.is_none() {
                //     lyricsto_target = Some(content);
                // }
            },
            Rule::lyric_sequence => {
                // Extract lyrics text from lyric_sequence
                lyric = parse_lyric_sequence(inner_pair, parsed)?;
            },
            Rule::lyricsto => {
                for lyricsto_pair in inner_pair.into_inner() {
                    match lyricsto_pair.as_rule() {
                        Rule::string_literal => {
                            let s = lyricsto_pair.as_str();
                            lyricsto_target = Some(s[1..s.len()-1].to_string());
                        },
                        _ => {}
                    }
                }
            },
            Rule::lyricmode => {
                lyric = parse_lyric_mode(inner_pair)?;
            },
            Rule::variable_reference => {
                let ref_str = inner_pair.as_str();
                if ref_str.starts_with("\\") {
                    let var_name = ref_str[1..].to_string();
                    if let Some(variable) = parsed.variables.get(&var_name) {
                        lyric = variable.lyric.clone();                       
                    }
                }
            },
            _ => {}
        }
    }
    
    if let Some(lyric) = lyric {
        if let Some(target) = lyricsto_target {
            if let Some(&(staff_idx, voice_idx)) = parsed.voices.get(&target) {
                if let Some(staff) = parsed.staves.get_mut(staff_idx) {
                    if let Some(voice) = staff.voices.get_mut(voice_idx) {
                        voice.lyrics.push(lyric);
                    }
                }
            }
        } else {
            if !parsed.staves.is_empty() {
                if let Some(last_voice) = parsed.staves.last_mut().and_then(|s| s.voices.last_mut()) {
                    last_voice.lyrics.push(lyric);
                }
            }
        }
    }
    
    Ok(())
}

fn parse_new_dynamics(pair: pest::iterators::Pair<Rule>, _parsed: &mut ParsedMusic) -> Result<(), String> {
    // Parse \new Dynamics context
    // Dynamics contexts contain dynamic markings, hairpins, etc.
    // For now, we'll just parse and ignore the content since we're not tracking dynamics separately
    
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::identifier => {
                // Name of the Dynamics context (e.g., Dyn)
                // We can ignore this for now
            },
            Rule::string_literal => {
                // Name of the Dynamics context as string
                // We can ignore this for now
            },
            Rule::simple_staff => {
                // Dynamics content in braces { ... }
                // We could parse this but don't need to store it
                println!("[parse_new_dynamics] Ignoring simple_staff content");
            },
            Rule::music_mode => {
                // Dynamics content in a music mode
                println!("[parse_new_dynamics] Ignoring music_mode content");
            },
            Rule::variable_reference => {
                // Reference to a variable containing dynamics (e.g., \Dyn)
                let ref_str = inner_pair.as_str();
                println!("[parse_new_dynamics] Ignoring variable reference: {}", ref_str);
            },
            Rule::bare_music_block => {
                // Bare music block
                println!("[parse_new_dynamics] Ignoring bare_music_block content");
            },
            _ => {}
        }
    }
    
    Ok(())
}

fn parse_new_nullvoice(pair: pest::iterators::Pair<Rule>, _parsed: &mut ParsedMusic) -> Result<(), String> {
    // Parse \new NullVoice context
    // NullVoice contexts are used for structural information (bar lines, lyrics alignment, etc.)
    // but don't produce actual note output. We'll parse and ignore the content.
    
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::identifier => {
                // Name of the NullVoice context
            },
            Rule::string_literal => {
                // Name as string
            },
            Rule::simple_staff => {
                println!("[parse_new_nullvoice] Ignoring simple_staff content");
            },
            Rule::music_mode => {
                println!("[parse_new_nullvoice] Ignoring music_mode content");
            },
            Rule::variable_reference => {
                let ref_str = inner_pair.as_str();
                println!("[parse_new_nullvoice] Ignoring variable reference: {}", ref_str);
            },
            Rule::bare_music_block => {
                println!("[parse_new_nullvoice] Ignoring bare_music_block content");
            },
            _ => {}
        }
    }
    
    Ok(())
}

fn parse_lyric_sequence(pair: pest::iterators::Pair<Rule>,
    parsed: &ParsedMusic) -> Result<Option<Lyric>, String> {
    let mut lyrics_text = String::new();
    
    for lyric_item_pair in pair.into_inner() {
        match lyric_item_pair.as_rule() {
            Rule::lyric_item => {
                for item in lyric_item_pair.into_inner() {
                    match item.as_rule() {
                        Rule::variable_reference => {
                            let ref_str = item.as_str();
                            if ref_str.starts_with("\\") {
                                let var_name = ref_str[1..].to_string();
                                if let Some(variable) = parsed.variables.get(&var_name) {
                                    if let Some(var_lyric) = &variable.lyric {
                                        return Ok(Some(var_lyric.clone()))
                                    }
                                }
                            }
                        },
                        Rule::basic_lyric_item => {
                            for basic_item in item.into_inner() {
                                match basic_item.as_rule() {
                                    Rule::lyric_text => {
                                        if !lyrics_text.is_empty() {
                                            lyrics_text.push(' ');
                                        }
                                        lyrics_text.push_str(basic_item.as_str());
                                    },
                                    Rule::set_command | Rule::override_command => {
                                        // Ignore commands
                                    },
                                    _ => {}
                                }
                            }
                        },
                        _ => {}
                    }
                }
            },
            _ => {}
        }
    }
    if !lyrics_text.is_empty() {
        Ok(Some(Lyric::new(lyrics_text)))
    } else {
        Ok(None)
    }
}

fn parse_lyric_mode(pair: pest::iterators::Pair<Rule>) -> Result<Option<Lyric>, String> {
    let mut lyrics_text = String::new();
    
    for lyricmode_pair in pair.into_inner() {
        match lyricmode_pair.as_rule() {
            Rule::basic_lyric_sequence => {
                // 遍历 basic_lyric_sequence 中的每个 basic_lyric_item
                for basic_lyric_item_pair in lyricmode_pair.into_inner() {
                    match basic_lyric_item_pair.as_rule() {
                        Rule::basic_lyric_item => {
                            // 遍历 basic_lyric_item 中的内容
                            for lyric_item in basic_lyric_item_pair.into_inner() {
                                match lyric_item.as_rule() {
                                    Rule::lyric_text => {
                                        // 普通歌词文本
                                        lyrics_text.push_str(lyric_item.as_str());
                                    },
                                    Rule::set_command | Rule::override_command => {
                                        // 命令 - 可以选择忽略或处理
                                        // 这里选择忽略，只保留歌词文本
                                    },
                                    _ => {
                                    }
                                }
                            }
                        },
                        _ => {
                        }
                    }
                }
            },
            _ => {
            }
        }
    }
    
    if !lyrics_text.is_empty() {
        Ok(Some(Lyric::new(lyrics_text)))
    } else {
        Ok(None)
    }
}

fn parse_music_sequence(pair: pest::iterators::Pair<Rule>, 
    notes: &mut Vec<LilyPondNote>, 
    parsed: &mut ParsedMusic,
    last_duration: &mut String,
    last_octave: &mut i32,
    last_pitch: &mut String,
    mode: OctaveMode) -> Result<(), String> {
    
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::music_item => {
                // music_item can be basic_music_item or music_mode
                for item in inner_pair.into_inner() {
                    match item.as_rule() {
                        Rule::basic_music_item => {
                            parse_basic_music_item(item, notes, parsed, last_duration, last_octave, last_pitch, mode)?;
                        },
                        Rule::music_mode => {
                            // Handle music_mode if needed
                            parse_music_mode(item, notes, parsed)?;
                        },
                        Rule::new_voice => {
                            // Handle \new Voice = "name" { ... } or \new Voice = "name" \variableName
                            parse_new_voice(item, notes, parsed, last_duration, last_octave, last_pitch, mode)?;
                        },
                        Rule::new_lyrics => {
                            parse_new_lyrics(item, parsed)?;
                        },
                        Rule::new_dynamics => {
                            // Handle \new Dynamics
                            parse_new_dynamics(item, parsed)?;
                        },
                        Rule::new_nullvoice => {
                            // Handle \new NullVoice
                            parse_new_nullvoice(item, parsed)?;
                        },
                        _ => {
                            println!("[parse_music_sequence] 跳过 music_item 内部规则: {:?}", item.as_rule());
                        }
                    }
                }
            },
            _ => {
                println!("[parse_music_sequence] 跳过规则: {:?}", inner_pair.as_rule());
            }
        }
    }
    
    Ok(())
}

fn parse_music_mode_without_staff(_pair: pest::iterators::Pair<Rule>, _parsed: &mut ParsedMusic) -> Result<(), String> {
    // Parse music mode (absolute, relative, fixed, lyricmode)
    // For now, just skip it as we're not using it in the main parsing
    Ok(())
}
// 音乐模式枚举，用于区分 Fixed 和 Relative 模式
#[derive(Debug, Clone, Copy)]
enum OctaveMode {
    Fixed,
    Relative,
    Absolute,
}

fn parse_music_mode(pair: pest::iterators::Pair<Rule>, 
    notes: &mut Vec<LilyPondNote>, 
    parsed: &mut ParsedMusic) -> Result<(), String> {    
    let _input_str = pair.as_str();
    let mut last_duration = "4".to_string();
    let mode_type = pair.as_rule();
    

    // Determine the actual mode type and get the pair to process
    let (actual_mode_type, actual_pair) = if mode_type == Rule::music_mode {
        // Find the actual mode (fixed_mode, relative_mode, or absolute_mode) inside music_mode
        let mut found_mode = None;
        for inner in pair.into_inner() {
            match inner.as_rule() {
                Rule::fixed_mode | Rule::relative_mode | Rule::absolute_mode => {
                    let rule = inner.as_rule();
                    println!("[parse_music_mode] 在 music_mode 内找到实际模式: {:?}", rule);
                    found_mode = Some((rule, inner));
                    break;
                },
                _ => {}
            }
        }
        found_mode.ok_or_else(|| "No valid mode found inside music_mode ".to_string())?
    } else {
        (mode_type, pair)
    };
    
    
    match actual_mode_type {
        Rule::fixed_mode => {
            let mut fixed_ref_octave = 4;
            let mut last_pitch = String::new();
            
            for mode_item in actual_pair.into_inner() {
                match mode_item.as_rule() {
                    Rule::fixed_reference => {
                        fixed_ref_octave = parse_reference_octave(mode_item)?;
                        println!("[parse_music_mode] Fixed 模式 - reference octave: {}", fixed_ref_octave);
                    },
                    Rule::basic_music_sequence => {
                        for seq_item in mode_item.into_inner() {
                            match seq_item.as_rule() {
                                Rule::basic_music_item => {
                                    parse_basic_music_item(seq_item,  notes, parsed, &mut last_duration,  &mut fixed_ref_octave, &mut last_pitch, OctaveMode::Fixed)?;
                                },
                                _ => {}
                            }
                        }
                    },
                    _ => {}
                }
            }
           
        },
        Rule::relative_mode => {
            let mut relative_ref_octave = 4;
            let mut last_pitch = String::new();
            
            for mode_item in actual_pair.into_inner() {
                match mode_item.as_rule() {
                    Rule::relative_reference => {
                        // Parse both pitch and octave from reference note
                        let (ref_pitch, ref_octave) = parse_reference_note(mode_item, parsed.language.as_deref())?;
                        relative_ref_octave = ref_octave;
                        last_pitch = ref_pitch;
                        println!("[parse_music_mode] Relative 模式 - reference pitch: {}, octave: {}", last_pitch, relative_ref_octave);
                    },
                    Rule::basic_music_sequence => {
                        for seq_item in mode_item.into_inner() {
                            match seq_item.as_rule() {
                                Rule::basic_music_item => {
                                    parse_basic_music_item(seq_item,  notes, parsed, &mut last_duration,  &mut relative_ref_octave, &mut last_pitch, OctaveMode::Relative)?;
                                },
                                _ => {}
                            }
                        }
                    },
                    _ => {}
                }
            }
            

        },
        // 默认是Absolute 模式
        _ => {
            println!("[parse_music_mode] Absolute 模式");
            let notes_before = notes.len();
            let mut last_octave = 4; // Default octave for Absolute mode
            let mut last_pitch = String::new();
            for mode_item in actual_pair.into_inner() {
                match mode_item.as_rule() {
                    Rule::basic_music_sequence => {
                        for seq_item in mode_item.into_inner() {
                            match seq_item.as_rule() {
                                Rule::basic_music_item => {
                                    parse_basic_music_item(seq_item,  notes, parsed, &mut last_duration,  &mut last_octave, &mut last_pitch, OctaveMode::Absolute)?;
                                },
                                _ => {}
                            }
                        }
                    },
                    _ => {}
                }
            }
            println!("[parse_music_mode] Absolute 模式 - 提取了 {} 个音符", notes.len() - notes_before);
        }
    }
    
    
    Ok(())
}

// Parse \repeat volta with optional alternative endings
fn parse_repeat_volta(
    pair: pest::iterators::Pair<Rule>,
    notes: &mut Vec<LilyPondNote>,
    parsed: &mut ParsedMusic,
    last_duration: &mut String,
    last_octave: &mut i32,
    last_pitch: &mut String,
    mode: OctaveMode,
) -> Result<(), String> {
    let mut repeat_times = 2u32; // Default to 2 if not specified
    let mut main_notes = Vec::new();
    let mut alternative_sections: Vec<Vec<LilyPondNote>> = Vec::new();
    let mut repeat_type: String = String::new();

    for repeat_part in pair.into_inner() {
        match repeat_part.as_rule() {
            Rule::repeat_type => {
                repeat_type = repeat_part.as_str().to_string().to_lowercase();
            },
            Rule::repeat_times => {
                // Parse the repeat count
                if let Ok(times) = repeat_part.as_str().parse::<u32>() {
                    repeat_times = times.max(1);
                }
            },
            Rule::basic_music_sequence => {
                // Parse the main repeated music section
                for seq_item in repeat_part.into_inner() {
                    if seq_item.as_rule() == Rule::basic_music_item {
                        parse_basic_music_item(seq_item, &mut main_notes, parsed, last_duration, last_octave, last_pitch, mode)?;
                    }
                }
            },
            Rule::alternative_block => {
                // Parse alternative endings
                for alt_choice in repeat_part.into_inner() {
                    if alt_choice.as_rule() == Rule::alternative_choice {
                        let mut alt_notes = Vec::new();
                        for alt_seq in alt_choice.into_inner() {
                            if alt_seq.as_rule() == Rule::basic_music_sequence {
                                for seq_item in alt_seq.into_inner() {
                                    if seq_item.as_rule() == Rule::basic_music_item {
                                        parse_basic_music_item(seq_item, &mut alt_notes, parsed, last_duration, last_octave, last_pitch, mode)?;
                                    }
                                }
                            }
                        }
                        alternative_sections.push(alt_notes);
                    }
                }
            },
            _ => {}
        }
    }
    
    match repeat_type.as_str() {
        "volta" => {
            // Insert repeat start marker
            let repeat_start_note = LilyPondNote {
                pitch: String::new(),
                duration: String::new(),
                octave: 0,
                dots: String::new(),
                chord_notes: Vec::new(),
                clef: None,
                time_sig: None,
                key_sig: None,
                ottava: None,
                arpeggio: false,
                note_type: NoteType::RepeatStart,
                group_start: false,
                group_end: false,
                has_slur: false,
                script_attachments: Vec::new(),
                accidental_modifier: None,
                alternative_index: Vec::new(),
            };
            notes.push(repeat_start_note);

            notes.extend(main_notes.clone());
            
            for (alt_index, alt_notes) in alternative_sections.iter().enumerate() {
                // Insert alternative marker
                let alt_note = LilyPondNote {
                    pitch: String::new(),
                    duration: String::new(),
                    octave: 0,
                    dots: String::new(),
                    chord_notes: Vec::new(),
                    clef: None,
                    time_sig: None,
                    key_sig: None,
                    ottava: None,
                    arpeggio: false,
                    note_type: NoteType::AlternativeStart,
                    group_start: false,
                    group_end: false,
                    has_slur: false,
                    script_attachments: Vec::new(),
                    accidental_modifier: None,
                    alternative_index: vec![alt_index as i32 + 1],  // 1-based index
                };
                notes.push(alt_note);
                
                notes.extend(alt_notes.clone());
                
                // Insert repeat end marker if not the last alternative
                let repeat_end_note = LilyPondNote {
                    pitch: String::new(),
                    duration: String::new(),
                    octave: 0,
                    dots: String::new(),
                    chord_notes: Vec::new(),
                    clef: None,
                    time_sig: None,
                    key_sig: None,
                    ottava: None,
                    arpeggio: false,
                    note_type: NoteType::AlternativeEnd,
                    group_start: false,
                    group_end: false,
                    has_slur: false,
                    script_attachments: Vec::new(),
                    accidental_modifier: None,
                    alternative_index: Vec::new(),
                };
                notes.push(repeat_end_note);
            }
            
            
                // Insert final repeat end marker
                let final_repeat_end = LilyPondNote {
                    pitch: String::new(),
                    duration: String::new(),
                    octave: 0,
                    dots: String::new(),
                    chord_notes: Vec::new(),
                    clef: None,
                    time_sig: None,
                    key_sig: None,
                    ottava: None,
                    arpeggio: false,
                    note_type: NoteType::RepeatEnd,
                    group_start: false,
                    group_end: false,
                    has_slur: false,
                    script_attachments: Vec::new(),
                    accidental_modifier: None,
                    alternative_index: Vec::new(),
                };
                notes.push(final_repeat_end);
        },
        "unfold" => {
            // With alternatives: play main section (repeat_times - alternatives.len()) times,
            // then play main section + each alternative
            let num_alternatives = alternative_sections.len() as u32;
            let common_repeats = if repeat_times > num_alternatives {
                repeat_times - num_alternatives
            } else {
                0
            };

            let mut index = 0;
            // Play each alternative ending
            for i in 0..repeat_times {
                notes.extend(main_notes.clone());
                if num_alternatives > 0 {
                    notes.extend(alternative_sections[index].clone());
                    if i >= common_repeats {
                        index += 1;
                    }
                }
            }
        },
        _ => {
            notes.extend(main_notes.clone());
            for alt_notes in alternative_sections {
                notes.extend(alt_notes);
            }
        }
    }
        
    
    Ok(())
}

fn parse_basic_music_item(pair: pest::iterators::Pair<Rule>, 
    notes: &mut Vec<LilyPondNote>,     
    parsed: &mut ParsedMusic,
    last_duration: &mut String, 
    last_octave: &mut i32,
    last_pitch: &mut String,
    mode: OctaveMode) -> Result<(), String> {
    // println!("[parse_basic_music_item] 输入: {}", pair.as_str());
    for inner_pair in pair.into_inner() {
        // println!("[parse_basic_music_item] 处理规则: {:?}, 内容: {}", inner_pair.as_rule(), inner_pair.as_str());
        match inner_pair.as_rule() {
            Rule::clef => {
                // Handle clef change - create a special clef marker note
                let mut clef_value = String::new();
                for clef_item in inner_pair.into_inner() {
                    match clef_item.as_rule() {
                        Rule::clef_type => {
                            clef_value = clef_item.as_str().to_string();
                        },
                        Rule::string_literal => {
                            let s_str = clef_item.as_str();
                            clef_value = s_str[1..s_str.len()-1].to_string();
                        },
                        Rule::identifier => {
                            clef_value = clef_item.as_str().to_string();
                        },
                        _ => {}
                    }
                }
                
                // Create a special clef marker note
                if !clef_value.is_empty() {
                    let clef_note = LilyPondNote {
                        pitch: String::new(),
                        duration: String::new(),
                        octave: 0,
                        dots: String::new(),
                        chord_notes: Vec::new(),
                        clef: Some(clef_value.clone()),
                        time_sig: None,
                        key_sig: None,
                        ottava: None,
                        arpeggio: false,
                        note_type: NoteType::Clef,
                        group_start: false,
                        group_end: false,
                        has_slur: false,
                        script_attachments: Vec::new(),
                        accidental_modifier: None,
                        alternative_index: Vec::new(),
                    };
                    notes.push(clef_note);
                    
                }
            },
            Rule::time_signature => {
                // Handle time signature - create a special time signature marker note
                let mut time_sig_value = String::new();
                for time_item in inner_pair.into_inner() {
                    match time_item.as_rule() {
                        Rule::fraction => {
                            time_sig_value = time_item.as_str().to_string();
                        },
                        _ => {}
                    }
                }
                
                // Create a special time signature marker note
                if !time_sig_value.is_empty() {
                    let time_note = LilyPondNote {
                        pitch: String::new(),
                        duration: String::new(),
                        octave: 0,
                        dots: String::new(),
                        chord_notes: Vec::new(),
                        clef: None,
                        time_sig: Some(time_sig_value.clone()),
                        key_sig: None,
                        ottava: None,
                        arpeggio: false,
                        note_type: NoteType::Time,
                        group_start: false,
                        group_end: false,
                        has_slur: false,
                        script_attachments: Vec::new(),
                        accidental_modifier: None,
                        alternative_index: Vec::new(),
                    };
                    notes.push(time_note);
                    println!("[parse_basic_music_item] Created time signature note: {}", time_sig_value);
                }
            },
            Rule::key_signature => {
                parse_key_signature(inner_pair, parsed)?;
                let key_note = LilyPondNote {
                        pitch: String::new(),
                        duration: String::new(),
                        octave: 0,
                        dots: String::new(),
                        chord_notes: Vec::new(),
                        clef: None,
                        time_sig: None,
                        key_sig: parsed.key_signature.clone(),
                        ottava: None,
                        arpeggio: false,
                        note_type: NoteType::Key,
                        group_start: false,
                        group_end: false,
                        has_slur: false,
                        script_attachments: Vec::new(),
                        accidental_modifier: None,
                        alternative_index: Vec::new(),
                    };
                    notes.push(key_note);
            },
            Rule::ottava => {
                // Handle ottava (octave transposition)
                // Format: \ottava #n where n is the octave offset
                let mut ottava_value: Option<i32> = None;
                for ottava_item in inner_pair.into_inner() {
                    match ottava_item.as_rule() {
                        Rule::int => {
                            if let Ok(val) = ottava_item.as_str().parse::<i32>() {
                                ottava_value = Some(val);
                            }
                        },
                        _ => {}
                    }
                }
                
                // Create a special ottava marker note
                if let Some(ottava_val) = ottava_value {
                    let ottava_note = LilyPondNote {
                        pitch: String::new(),
                        duration: String::new(),
                        octave: 0,
                        dots: String::new(),
                        chord_notes: Vec::new(),
                        clef: None,
                        time_sig: None,
                        key_sig: None,
                        ottava: Some(ottava_val),
                        arpeggio: false,
                        note_type: NoteType::Ottava,
                        group_start: false,
                        group_end: false,
                        has_slur: false,
                        script_attachments: Vec::new(),
                        accidental_modifier: None,
                        alternative_index: Vec::new(),
                    };
                    notes.push(ottava_note);
                    println!("[parse_basic_music_item] Created ottava note with value: {}", ottava_val);
                }
            },
            Rule::partial => {
                // Handle partial (pickup measure)
                parse_partial(inner_pair, parsed)?;
            },
            Rule::musical_note => {
                let (note_item, multiplier) = parse_musical_note_with_multiplier(inner_pair, parsed, last_duration, last_octave, last_pitch, mode)?;
                let mut note = note_item;
                
                // If the previous note has has_slur=true (from ~), mark this note as group_end
                // Only check has_slur to avoid conflicts with parentheses slurs
                let should_end_group = notes.last().map_or(false, |n| n.has_slur);
                if should_end_group {
                    note.group_end = true;
                }
                
                // Handle multiplier - repeat the note N times
                for _ in 0..multiplier {
                    notes.push(note.clone());
                }
            },
            Rule::rest => {
                let (rest, multiplier) = parse_rest_with_multiplier(inner_pair, last_duration)?;
                // Handle multiplier - repeat the rest N times
                for _ in 0..multiplier {
                    notes.push(rest.clone());
                }
            },
            Rule::multi_measure_rest => {
                // Multi-measure rest 'R' - similar to regular rest but for multiple measures
                let (multi_rest, multiplier) = parse_multi_measure_rest_with_multiplier(inner_pair, last_duration)?;
                // Handle multiplier - repeat the rest N times
                for _ in 0..multiplier {
                    notes.push(multi_rest.clone());
                }
            },
            Rule::chord_repetition => {
                // Chord repetition 'q' - repeats the last chord with new duration/attachments
                // Get the last chord from notes
                let last_chord = notes.iter().rev()
                    .find(|n| !n.chord_notes.is_empty() || n.pitch != "r" && n.pitch != "R")
                    .cloned();
                
                if let Some(last_chord) = last_chord {
                    let (chord_rep, multiplier) = parse_chord_repetition_with_multiplier(inner_pair, last_duration, last_chord)?;
                    // Handle multiplier - repeat the chord N times
                    for _ in 0..multiplier {
                        notes.push(chord_rep.clone());
                    }
                } else {
                    return Err("Chord repetition 'q' used but no previous chord found".to_string());
                }
            },
            Rule::angle_brackets => {
                let (chord, multiplier): (LilyPondNote, u32) = parse_chord_with_multiplier(inner_pair, parsed, last_duration, last_octave, last_pitch, mode)?;
                // Handle multiplier - repeat the chord N times
                for _ in 0..multiplier {
                    notes.push(chord.clone());
                }
            },
            Rule::slur_start => {
                // Mark the previous note as group_start (the note before the opening parenthesis)
                if let Some(last_note) = notes.last_mut() {
                    last_note.group_start = true;
                }
            },
            Rule::slur_end => {
                // Mark the previous note as group_end (the note before the closing parenthesis)
                if let Some(last_note) = notes.last_mut() {
                    last_note.group_end = true;
                }
            },
            Rule::variable_reference => {
                // Extract variable name from \variableName
                let ref_str = inner_pair.as_str();
                if ref_str.starts_with("\\") {
                    let var_name = ref_str[1..].to_string();
                    if let Some(variable) = parsed.variables.get(&var_name) {
                        notes.extend(variable.base.notes.clone());                        
                    }
                }
            },
            Rule::modal_transpose => {
                parse_modal_transpose(inner_pair, notes, last_duration, parsed)?;
            },
            
            Rule::arpeggio => {
                // Handle \arpeggio - mark the last note as having an arpeggio
                if let Some(last_note) = notes.last_mut() {
                    last_note.arpeggio = true;
                    println!("[parse_basic_music_item] Set arpeggio for note: pitch={}", last_note.pitch);
                }
            },
            
            Rule::repeat_volta => {
                parse_repeat_volta(inner_pair, notes, parsed, last_duration, last_octave, last_pitch, mode)?;
            },
            
            Rule::grace_notes | Rule::acciaccatura_notes | Rule::appoggiatura_notes => {
                // Handle grace notes, acciaccatura, and appoggiatura
                // These are ornamental notes that appear before the main note
                // Mark all notes within grace blocks with note_type = Grace
                for grace_part in inner_pair.into_inner() {
                    if grace_part.as_rule() == Rule::basic_music_sequence {
                        for seq_item in grace_part.into_inner() {
                            if seq_item.as_rule() == Rule::basic_music_item {
                                parse_basic_music_item(seq_item, notes, parsed, last_duration, last_octave, last_pitch, mode)?;
                                
                                // Mark the last added note as a grace note
                                if let Some(last_note) = notes.last_mut() {
                                    last_note.note_type = NoteType::Grace;
                                }
                            }
                        }
                    }
                }
            },
            
            Rule::tuplet => {
                // Handle \tuplet fraction { music }
                // Parse the music sequence inside the tuplet
                for tuplet_part in inner_pair.into_inner() {
                    match tuplet_part.as_rule() {
                        Rule::basic_music_sequence => {
                            for seq_item in tuplet_part.into_inner() {
                                if seq_item.as_rule() == Rule::basic_music_item {
                                    parse_basic_music_item(seq_item, notes, parsed, last_duration, last_octave, last_pitch, mode)?;
                                }
                            }
                        },
                        _ => {} // Ignore tuplet_fraction for now
                    }
                }
            },
            
            Rule::tuplet_span => {
                // Ignore \tupletSpan command for now
                // This sets the duration for automatic tuplet grouping
            },
            
            Rule::omit_command => {
                // Ignore \omit command for now
                // This is used to hide certain elements like TupletNumber
            },
            
            Rule::crescendo_start | Rule::decrescendo_start | Rule::dynamic_stop => {
                // Ignore dynamic markings - they are visual annotations for crescendo/decrescendo
                // \< = crescendo start, \> = decrescendo start, \! = dynamic stop
            },
            
            Rule::custom_function_call => {
                // Ignore custom function calls like \dynamictext "cresc."
                // These are user-defined event functions that add visual annotations
                // Example: \dynamictext "cresc." or \myOttava #1
                println!("[parse_basic_music_item] Ignoring custom function call: {}", inner_pair.as_str());
            },
            
            _ => {}
        }
    }
    Ok(())
}

// Helper function to parse musical note with multiplier support
fn parse_musical_note_with_multiplier(pair: pest::iterators::Pair<Rule>, 
    parsed: &mut ParsedMusic,
    last_duration: &mut String,
    last_octave: &mut i32,
    last_pitch: &mut String,
    mode: OctaveMode) -> Result<(LilyPondNote, u32), String> {
    let mut multiplier = 1u32;
    let mut has_multiplier = false;
    
    // First pass: check for multiplier and extract it
    let inner_pairs: Vec<_> = pair.clone().into_inner().collect();
    for inner_pair in &inner_pairs {
        if inner_pair.as_rule() == Rule::multiplier {
            // Parse multiplier: "* unsigned"
            let mult_str = inner_pair.as_str();
            if let Some(num_str) = mult_str.split('*').nth(1) {
                if let Ok(num) = num_str.trim().parse::<u32>() {
                    multiplier = num.max(1);  // At least 1
                    has_multiplier = true;
                }
            }
        }
    }
    
    // Parse the actual note, using the original pair which contains all components
    let note = parse_musical_note(pair, parsed, last_duration, last_octave, last_pitch, mode)?;
    
    Ok((note, if has_multiplier { multiplier } else { 1 }))
}

// Helper function to get standard pitch name from language-specific pitch name
// Maps note names from different languages to standard notation
pub fn get_standard_pitch(pitch: &str, language: Option<&str>) -> String {
    match language {
        Some("deutsch") => {
            // German note naming: h = B natural, b = B flat
            match pitch {
                "h" => "b".to_string(),        // h in German = B natural in standard
                "b" => "bes".to_string(),      // b in German = B flat in standard
                "as" | "aes" => "aes".to_string(),
                "es" | "ees" => "ees".to_string(),
                "ases"  => "aeses".to_string(),
                "eses"  => "eeses".to_string(),
                "hes" => "bes".to_string(),
                "his" => "bis".to_string(),
                "heses" => "beses".to_string(),
                "hisis" => "bisis".to_string(),
                _ => pitch.to_string(),
            }
        },
        Some("english") | None => {
            // English/default: no conversion needed, already standard
            pitch.to_string()
        },
        _ => {
            // For other languages, return as-is for now
            pitch.to_string()
        }
    }
}

fn parse_musical_note(pair: pest::iterators::Pair<Rule>, 
    parsed: &mut ParsedMusic,
    last_duration: &mut String,
    last_octave: &mut i32,
    last_pitch: &mut String,
    mode: OctaveMode) -> Result<LilyPondNote, String> {
    // println!("[DEBUG] parse_musical_note - Input: {}", pair.as_str());
    
    let mut pitch = String::new();
    let mut octave_marks = String::new();
    let mut duration = last_duration.clone();
    let mut dots = String::new();
    let mut has_slur = false;
    let mut script_attachments = Vec::new();
    let mut accidental_modifier = None;
    
    for inner_pair in pair.into_inner() {
        // println!("[DEBUG] parse_musical_note - Inner rule: {:?}, content: {}", inner_pair.as_rule(), inner_pair.as_str());
        
        match inner_pair.as_rule() {
            Rule::note_name => {
                pitch = inner_pair.as_str().to_string();
                pitch = get_standard_pitch(&pitch, parsed.language.as_deref());
            },
            Rule::octave_modifier => {
                octave_marks = inner_pair.as_str().to_string();
            },
            Rule::accidental_modifier => {
                accidental_modifier = Some(inner_pair.as_str().to_string());
            },
            Rule::duration => {
                let (dur, d) = parse_duration(inner_pair)?;
                duration = dur;
                dots = d;
                *last_duration = duration.clone();
            },
            Rule::slur_marker => {
                has_slur = true;
            },
            Rule::repeat_tie => {
                // Ignore repeat tie marks (\repeatTie) for now
                // These indicate that a note is tied to the previous occurrence
            },
            Rule::script_attachment => {
                // Parse script attachments (^, _, - with optional text/markup)
                // These are used for articulation marks, fingering (-1, -2, etc.), and text positioning
                // Examples: ^"text", _markup, -1 (fingering), ^. (staccato above)
                if let Ok(attachment) = parse_script_attachment(inner_pair) {
                    script_attachments.push(attachment);
                }
            },
            Rule::mark_attach_sign => {
                // Ignore mark attachment signs for now
                // These include: articulation commands (\accent, \staccato, etc.),
                // ornaments (\trill, \mordent, etc.), fermatas, repeat signs (\segno, \coda),
                // instrument signs (\upbow, \downbow, etc.), and dynamics (\pp, \ff, etc.)
            },
            Rule::multiplier => {
                // Ignore multiplier - it's handled by parse_musical_note_with_multiplier
            },
            _ => {
                println!("[DEBUG] parse_musical_note - Unhandled inner rule: {:?}", inner_pair.as_rule());
            }
        }
    }
    
    // Calculate octave based on ' and , marks
    let mut octave = calculate_octave(&octave_marks);

    match mode {
        OctaveMode::Fixed => {
            // In fixed mode: last_octave + (note.octave - 3)
            // Because note.octave is relative to middle C (octave 3)
            octave = *last_octave + (octave - 3);
            
        },
        OctaveMode::Relative => {            
            octave = calculate_relative_octave(&pitch, octave, last_octave, last_pitch);
            *last_octave = octave;
            *last_pitch = pitch.clone();
            
        },
        OctaveMode::Absolute => {
            // In absolute mode, octave is used as-is
        }
    }
    
    // println!("[DEBUG] parse_musical_note - Final result: pitch={}, octave_marks={}, octave={}, duration={}, dots={}", pitch, octave_marks, octave, duration, dots);
    
    Ok(LilyPondNote {
        pitch,
        duration,
        octave,
        dots,
        chord_notes: Vec::new(),
        clef: None,
        time_sig: None,
        key_sig: None,
        ottava: None,
        arpeggio: false,
        note_type: NoteType::Default,
        group_start: has_slur,  // If this note has ~, it starts a slur
        group_end: false,
        has_slur,  // Mark if this note has ~ marker
        script_attachments,  // Store parsed script attachments
        accidental_modifier,  // Store accidental modifier if present
        alternative_index: Vec::new(),
    })
}

// Helper function to parse rest with multiplier support
fn parse_rest_with_multiplier(pair: pest::iterators::Pair<Rule>, last_duration: &mut String) -> Result<(LilyPondNote, u32), String> {
    let mut multiplier = 1u32;
    let mut has_multiplier = false;
    
    // First pass: check for multiplier and extract it
    let inner_pairs: Vec<_> = pair.clone().into_inner().collect();
    for inner_pair in &inner_pairs {
        if inner_pair.as_rule() == Rule::multiplier {
            // Parse multiplier: "* unsigned"
            let mult_str = inner_pair.as_str();
            if let Some(num_str) = mult_str.split('*').nth(1) {
                if let Ok(num) = num_str.trim().parse::<u32>() {
                    multiplier = num.max(1);  // At least 1
                    has_multiplier = true;
                }
            }
        }
    }
    
    // Parse the actual rest, using the original pair
    let rest = parse_rest(pair, last_duration)?;
    
    Ok((rest, if has_multiplier { multiplier } else { 1 }))
}

fn parse_rest(pair: pest::iterators::Pair<Rule>, last_duration: &mut String) -> Result<LilyPondNote, String> {
    let mut duration = last_duration.clone();
    let mut dots = String::new();
    
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::rest_name => {}, // We know it's a rest
            Rule::duration => {
                let (dur, d) = parse_duration(inner_pair)?;
                duration = dur;
                dots = d;
                *last_duration = duration.clone();
            },
            Rule::multiplier => {
                // Ignore multiplier - it's handled by parse_rest_with_multiplier
            },
            Rule::crescendo_start | Rule::decrescendo_start | Rule::dynamic_stop => {
                // Ignore dynamic markings - they are visual annotations
            },
            _ => {}
        }
    }
    
    Ok(LilyPondNote {
        pitch: "r".to_string(), // Rest
        duration,
        octave: 0, // Rests don't have octaves
        dots,
        chord_notes: Vec::new(),
        clef: None,
        time_sig: None,
        key_sig: None,
        ottava: None,
        arpeggio: false,
        note_type: NoteType::Rest,
        group_start: false,
        group_end: false,
        has_slur: false,
        script_attachments: Vec::new(),
        accidental_modifier: None,
        alternative_index: Vec::new(),
    })
}

// Helper function to parse multi-measure rest with multiplier support
fn parse_multi_measure_rest_with_multiplier(pair: pest::iterators::Pair<Rule>, last_duration: &mut String) -> Result<(LilyPondNote, u32), String> {
    let mut multiplier = 1u32;
    let mut has_multiplier = false;
    
    // First pass: check for multiplier and extract it
    let inner_pairs: Vec<_> = pair.clone().into_inner().collect();
    for inner_pair in &inner_pairs {
        if inner_pair.as_rule() == Rule::multiplier {
            // Parse multiplier: "* unsigned"
            let mult_str = inner_pair.as_str();
            if let Some(num_str) = mult_str.split('*').nth(1) {
                if let Ok(num) = num_str.trim().parse::<u32>() {
                    multiplier = num.max(1);  // At least 1
                    has_multiplier = true;
                }
            }
        }
    }
    
    // Parse the actual rest, using the original pair
    let rest = parse_multi_measure_rest(pair, last_duration)?;
    
    Ok((rest, if has_multiplier { multiplier } else { 1 }))
}

fn parse_multi_measure_rest(pair: pest::iterators::Pair<Rule>, last_duration: &mut String) -> Result<LilyPondNote, String> {
    let mut duration = last_duration.clone();
    let mut dots = String::new();
    
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::duration => {
                let (dur, d) = parse_duration(inner_pair)?;
                duration = dur;
                dots = d;
                *last_duration = duration.clone();
            },
            Rule::multiplier => {
                // Ignore multiplier - it's handled by parse_multi_measure_rest_with_multiplier
            },
            _ => {}
        }
    }
    
    // Return a rest note with "R" to indicate multi-measure rest
    Ok(LilyPondNote {
        pitch: "R".to_string(), // Multi-measure rest (uppercase R)
        duration,
        octave: 0, // Rests don't have octaves
        dots,
        chord_notes: Vec::new(),
        clef: None,
        time_sig: None,
        key_sig: None,
        ottava: None,
        arpeggio: false,
        note_type: NoteType::Rest,
        group_start: false,
        group_end: false,
        has_slur: false,
        script_attachments: Vec::new(),
        accidental_modifier: None,
        alternative_index: Vec::new(),
    })
}

// Helper function to parse chord repetition with multiplier support
fn parse_chord_repetition_with_multiplier(pair: pest::iterators::Pair<Rule>, last_duration: &mut String, last_chord: LilyPondNote) -> Result<(LilyPondNote, u32), String> {
    let mut multiplier = 1u32;
    let mut has_multiplier = false;
    
    // First pass: check for multiplier and extract it
    let inner_pairs: Vec<_> = pair.clone().into_inner().collect();
    for inner_pair in &inner_pairs {
        if inner_pair.as_rule() == Rule::multiplier {
            // Parse multiplier: "* unsigned"
            let mult_str = inner_pair.as_str();
            if let Some(num_str) = mult_str.split('*').nth(1) {
                if let Ok(num) = num_str.trim().parse::<u32>() {
                    multiplier = num.max(1);  // At least 1
                    has_multiplier = true;
                }
            }
        }
    }
    
    // Parse the actual repetition, using the original pair and previous chord
    let rep = parse_chord_repetition(pair, last_duration, last_chord)?;
    
    Ok((rep, if has_multiplier { multiplier } else { 1 }))
}

fn parse_chord_repetition(pair: pest::iterators::Pair<Rule>, last_duration: &mut String, last_chord: LilyPondNote) -> Result<LilyPondNote, String> {
    let mut duration = last_duration.clone();
    let mut dots = String::new();
    let mut script_attachments = Vec::new();
    
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::duration => {
                let (dur, d) = parse_duration(inner_pair)?;
                duration = dur;
                dots = d;
                *last_duration = duration.clone();
            },
            Rule::script_attachment => {
                // Parse script attachments (fingering like -1, -2, etc.)
                let script = parse_script_attachment(inner_pair)?;
                script_attachments.push(script);
            },
            Rule::mark_attach_sign => {
                // Parse mark attachment sign (like -., ->, etc.)
                // Mark attachment signs are parsed as script attachments
                let script = parse_script_attachment(inner_pair)?;
                script_attachments.push(script);
            },
            Rule::multiplier => {
                // Ignore multiplier - it's handled by parse_chord_repetition_with_multiplier
            },
            _ => {}
        }
    }
    
    // Return the last chord with new duration and script attachments
    let mut repeated_chord = last_chord.clone();
    repeated_chord.duration = duration;
    repeated_chord.dots = dots;
    
    // Combine existing script attachments with new ones
    repeated_chord.script_attachments.extend(script_attachments);
    
    Ok(repeated_chord)
}

// Helper function to parse chord with multiplier support
fn parse_chord_with_multiplier(pair: pest::iterators::Pair<Rule>, 
    parsed: &mut ParsedMusic,
    last_duration: &mut String,
    last_octave: &mut i32,
    last_pitch: &mut String,
    mode: OctaveMode) -> Result<(LilyPondNote, u32), String> {
    let mut multiplier = 1u32;
    let mut has_multiplier = false;
    
    // First pass: check for multiplier and extract it
    let inner_pairs: Vec<_> = pair.clone().into_inner().collect();
    for inner_pair in &inner_pairs {
        if inner_pair.as_rule() == Rule::multiplier {
            // Parse multiplier: "* unsigned"
            let mult_str = inner_pair.as_str();
            if let Some(num_str) = mult_str.split('*').nth(1) {
                if let Ok(num) = num_str.trim().parse::<u32>() {
                    multiplier = num.max(1);  // At least 1
                    has_multiplier = true;
                }
            }
        }
    }
    
    // Parse the actual chord, using the original pair
    let chord = parse_chord(pair, parsed, last_duration, last_octave, last_pitch, mode)?;
    
    Ok((chord, if has_multiplier { multiplier } else { 1 }))
}

fn parse_chord(pair: pest::iterators::Pair<Rule>, 
    parsed: &mut ParsedMusic,
    last_duration: &mut String,
    last_octave: &mut i32,
    last_pitch: &mut String,
    mode: OctaveMode) -> Result<LilyPondNote, String> {
    // New implementation using the grammar: angle_brackets = { "<" ~ musical_note+ ~ ">" ~ duration? ~ script_attachment* ~ mark_attach_sign? ~ multiplier? }
    // We can now directly parse musical_note items from the grammar instead of manual string parsing
    
    let mut chord_notes: Vec<(String, i32)> = Vec::new();
    let mut duration = last_duration.clone();
    let mut dots = String::new();
    let mut first_note: Option<LilyPondNote> = None;
    
    // In LilyPond's relative mode within chords:
    // - The first note in the chord is relative to the note BEFORE the chord
    // - Subsequent notes in the chord are relative to the FIRST note in the chord (not each other)
    // This is different from sequential notes where each note is relative to the previous one.
    let mut chord_last_octave = *last_octave;
    let mut chord_last_pitch = last_pitch.clone();
    
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::musical_note => {
                // Parse each note in the chord
                // For subsequent notes (not the first), they should be relative to the FIRST note
                // not to the previously parsed note in the chord
                let note = parse_musical_note(inner_pair, parsed, last_duration, &mut chord_last_octave, &mut chord_last_pitch, mode)?;
                
                if first_note.is_none() {
                    // First note becomes the base note
                    first_note = Some(note);
                } else {
                    // Subsequent notes are added to chord_notes
                    // Reset to the first note's octave/pitch for relative calculation
                    if let Some(ref base) = first_note {
                        chord_last_octave = base.octave;
                        chord_last_pitch = base.pitch.clone();
                    }
                    chord_notes.push((note.pitch, note.octave));
                }
            },
            Rule::duration => {
                // Duration after the closing bracket applies to the whole chord
                let (dur, d) = parse_duration(inner_pair)?;
                duration = dur;
                dots = d;
                *last_duration = duration.clone();
            },
            Rule::script_attachment => {
                // Ignore script attachments on the chord for now
                // These apply to the entire chord (e.g., <c e g>^. for staccato on the whole chord)
            },
            Rule::mark_attach_sign => {
                // Ignore mark attachment signs on the chord for now
                // These apply to the entire chord
            },
            Rule::multiplier => {
                // Ignore multiplier - it's handled by parse_chord_with_multiplier
            },
            _ => {
                println!("[DEBUG] parse_chord - Unhandled rule: {:?}", inner_pair.as_rule());
            }
        }
    }
    
    // After parsing all chord notes, update last_octave and last_pitch
    // The note following the chord will be relative to the FIRST note in the chord
    if let Some(ref base) = first_note {
        *last_octave = base.octave;
        *last_pitch = base.pitch.clone();
    }
    
    // Use the first note as the base, but mark it as a chord
    if let Some(mut base_note) = first_note {
        base_note.chord_notes = chord_notes;
        base_note.duration = duration;
        base_note.dots = dots;
        base_note.note_type = NoteType::Chord;
        Ok(base_note)
    } else {
        Err("Empty chord".to_string())
    }
}


// Parse a note string with proper octave calculation based on mode
// Parse script attachment (fingering, text, markup, articulation)
// Format: direction (^, _, -) followed by optional content
// Examples: -1 (fingering), ^"text", ^\markup { "text" }, ^. (articulation)
fn parse_script_attachment(pair: pest::iterators::Pair<Rule>) -> Result<ScriptAttachment, String> {
    let mut direction = ScriptDirection::Default;
    let mut content = ScriptContent::Empty;
    
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::script_direction => {
                direction = match inner_pair.as_str() {
                    "^" => ScriptDirection::Above,
                    "_" => ScriptDirection::Below,
                    "-" => ScriptDirection::Default,
                    _ => ScriptDirection::Default,
                };
            },
            Rule::script_text => {
                // Parse the content of the script
                for text_pair in inner_pair.into_inner() {
                    match text_pair.as_rule() {
                        Rule::unsigned => {
                            // Fingering number
                            if let Ok(num) = text_pair.as_str().parse::<u32>() {
                                content = ScriptContent::Fingering(num);
                            }
                        },
                        Rule::string_literal => {
                            // String literal: remove quotes
                            let s = text_pair.as_str();
                            let text = s[1..s.len()-1].to_string();
                            content = ScriptContent::Text(text);
                        },
                        Rule::markup_expression => {
                            // Markup expression: store as-is for now
                            content = ScriptContent::Markup(text_pair.as_str().to_string());
                        },
                        Rule::articulation => {
                            // Articulation mark: ., -, >, etc.
                            content = ScriptContent::Articulation(text_pair.as_str().to_string());
                        },
                        _ => {}
                    }
                }
            },
            _ => {}
        }
    }
    
    Ok(ScriptAttachment {
        direction,
        content,
    })
}

fn parse_duration(pair: pest::iterators::Pair<Rule>) -> Result<(String, String), String> {
    // println!("[DEBUG] parse_duration - Input: {}", pair.as_str());
    
    let mut duration_num = String::new();
    let mut dots = String::new();
    
    for inner_pair in pair.into_inner() {
        // println!("[DEBUG] parse_duration - Inner rule: {:?}, content: {}", inner_pair.as_rule(), inner_pair.as_str());
        
        match inner_pair.as_rule() {
            Rule::duration_number => {
                duration_num = inner_pair.as_str().to_string();
                // println!("[DEBUG] parse_duration - duration_number: {}", duration_num);
            },
            Rule::duration_dots => {
                dots = inner_pair.as_str().to_string();
                // println!("[DEBUG] parse_duration - duration_dots: {}", dots);
            },
            _ => {
                // println!("[DEBUG] parse_duration - Unhandled inner rule: {:?}", inner_pair.as_rule());
            }
        }
    }
    
    // println!("[DEBUG] parse_duration - Final result: duration={}, dots={}", duration_num, dots);
    Ok((duration_num, dots))
}

fn calculate_octave(octave_marks: &str) -> i32 {
    // In LilyPond: c = C3, c' = C4, c'' = C5, c, = C2, c,, = C1
    octave_marks.chars().fold(3, |acc, c| {
        match c {
            '\'' => acc + 1,  // Each ' raises by one octave
            ',' => acc - 1,   // Each , lowers by one octave
            _ => acc,
        }
    })
}

fn convert_key_signature(note: &str, mode: &str) -> String {
    match (note, mode) {
        ("c", "\\major") => "C",
        ("g", "\\major") => "G", 
        ("d", "\\major") => "D",
        ("a", "\\major") => "A",
        ("e", "\\major") => "E",
        ("b", "\\major") => "B",
        ("fis", "\\major") => "F#",
        ("cis", "\\major") => "C#",
        ("f", "\\major") => "F",
        ("bes", "\\major") => "Bb",
        ("es", "\\major") => "Eb", 
        ("aes", "\\major") => "Ab",
        ("des", "\\major") => "Db",
        ("ges", "\\major") => "Gb",
        ("ces", "\\major") => "Cb",
        ("a", "\\minor") => "Am",
        ("e", "\\minor") => "Em",
        ("b", "\\minor") => "Bm", 
        ("fis", "\\minor") => "F#m",
        ("cis", "\\minor") => "C#m",
        ("gis", "\\minor") => "G#m",
        ("dis", "\\minor") => "D#m",
        ("ais", "\\minor") => "A#m",
        ("d", "\\minor") => "Dm",
        ("g", "\\minor") => "Gm",
        ("c", "\\minor") => "Cm",
        ("f", "\\minor") => "Fm",
        ("bes", "\\minor") => "Bbm",
        ("es", "\\minor") => "Ebm",
        ("aes", "\\minor") => "Abm",
        _ => "C", // Default to C major
    }.to_string()
}

fn get_pitch_value(pitch: &str) -> i32 {
    // Get the semitone value of a pitch within an octave (0-11)
    // Support both standard and language-specific note names
    let pitch_values = [
        // Standard notes
        ("c", 0), ("d", 2), ("e", 4), ("f", 5), ("g", 7), ("a", 9), ("b", 11),
        // German: h = B natural, b = Bb
        ("h", 11), 
        // Sharps and flats (standard)
        ("bis", 0), ("cis", 1), ("dis", 3), ("eis", 5), ("fis", 6), ("gis", 8), ("ais", 10),
        ("ces", 11), ("des", 1), ("es", 3), ("ees", 3), ("fes", 4), ("ges", 6), ("as", 8), ("aes", 8), ("bes", 10),
        // German h variants
        ("his", 0), ("hes", 10),
    ];
    
    pitch_values.iter()
        .find(|(p, _)| pitch.starts_with(p))
        .map(|(_, v)| *v)
        .unwrap_or(0)
}

fn calculate_relative_octave(pitch: &str, specified_octave: i32, last_octave: &i32, last_pitch: &str) -> i32 {
    // In LilyPond's relative mode, the octave is chosen such that the interval
    // from the previous note is at most a perfect fourth (5 semitones).
    // 
    // IMPORTANT: If user explicitly specifies octave marks (' or ,), those take precedence!
    // For example: after "a", "c," means "go to c in a lower octave relative to a"
    // 
    // Strategy:
    // 1. If specified_octave != 3 (i.e., user used ' or ,), use it as absolute override
    // 2. Otherwise, choose octave based on minimizing interval from last note
    
    let current_pitch_value = get_pitch_value(pitch);
    
    // If this is the first note (no last_pitch), use the specified octave
    if last_pitch.is_empty() {
        return specified_octave;
    }
    
    // If user explicitly specified octave marks (specified_octave != 3, which is the default),
    // those marks are RELATIVE to the last note's octave, not absolute
    // For example: after a4, "c," means c in (a's octave - 1) = octave 3
    if specified_octave != 3 {
        // User specified explicit octave marks
        // In relative mode, octave marks are adjustments relative to what would be chosen
        let last_pitch_value = get_pitch_value(last_pitch);
        let last_absolute_position = last_octave * 12 + last_pitch_value;
        
        // Find the "natural" octave (without marks) based on relative mode rules
        let candidates = [
            last_octave - 1,
            *last_octave,
            last_octave + 1,
        ];
        
        let mut natural_octave = *last_octave;
        let mut min_distance = i32::MAX;
        
        for &candidate_octave in &candidates {
            let candidate_position = candidate_octave * 12 + current_pitch_value;
            let distance = (candidate_position - last_absolute_position).abs();
            
            if distance < min_distance {
                min_distance = distance;
                natural_octave = candidate_octave;
            } else if distance == min_distance && (candidate_octave - last_octave).abs() < (natural_octave - last_octave).abs() {
                natural_octave = candidate_octave;
            }
        }
        
        // Apply the octave adjustment from the marks
        // specified_octave - 3 gives the adjustment (e.g., c' = 4-3 = +1, c, = 2-3 = -1)
        return natural_octave + (specified_octave - 3);
    }
    
    // No explicit octave marks - use relative mode rules
    let last_pitch_value = get_pitch_value(last_pitch);
    let last_absolute_position = last_octave * 12 + last_pitch_value;
    
    let candidates = [
        last_octave - 1,
        *last_octave,
        last_octave + 1,
    ];
    
    let mut best_octave = *last_octave;
    let mut min_distance = i32::MAX;
    
    for &candidate_octave in &candidates {
        let candidate_position = candidate_octave * 12 + current_pitch_value;
        let distance = (candidate_position - last_absolute_position).abs();
        
        // Choose the octave with minimum distance
        // In case of tie, prefer the one closer to last_octave (current default)
        if distance < min_distance {
            min_distance = distance;
            best_octave = candidate_octave;
        } else if distance == min_distance && (candidate_octave - last_octave).abs() < (best_octave - last_octave).abs() {
            best_octave = candidate_octave;
        }
    }
    
    best_octave
}

fn parse_reference_octave(pair: pest::iterators::Pair<Rule>) -> Result<i32, String> {
    let mut octave = 3;  // Base octave for c (middle C is c')
    
    for inner in pair.into_inner() {
        match inner.as_rule() {
            Rule::octave_modifier => {
                let octave_str = inner.as_str();
                let up_count = octave_str.matches('\'').count() as i32;
                let down_count = octave_str.matches(',').count() as i32;
                octave = 3 + up_count - down_count;
            },
            _ => {}
        }
    }
    
    Ok(octave)
}

// Parse reference note and return (pitch, octave)
fn parse_reference_note(pair: pest::iterators::Pair<Rule>, _language: Option<&str>) -> Result<(String, i32), String> {
    let mut pitch = String::from("c");  // Default to c
    let mut octave = 3;  // Base octave for c (middle C is c')
    
    for inner in pair.into_inner() {
        match inner.as_rule() {
            Rule::note_name => {
                pitch = inner.as_str().to_string();
                // Keep original pitch name, don't convert
            },
            Rule::octave_modifier => {
                let octave_str = inner.as_str();
                let up_count = octave_str.matches('\'').count() as i32;
                let down_count = octave_str.matches(',').count() as i32;
                octave = 3 + up_count - down_count;
            },
            _ => {}
        }
    }
    
    Ok((pitch, octave))
}

// Parse modal transpose: \modalTranspose from_pitch to_pitch scale_ref music_expr
fn parse_modal_transpose(
    pair: pest::iterators::Pair<Rule>,
    notes: &mut Vec<LilyPondNote>,
    _last_duration: &mut String,
    parsed: &ParsedMusic,
) -> Result<(), String> {
    let mut from_pitch = String::new();
    let mut from_octave = 3;
    let mut to_pitch = String::new();
    let mut to_octave = 3;
    let mut scale_var_name = String::new();
    let mut music_var_name = String::new();
    
    let mut pitch_count = 0;
    
    for inner in pair.into_inner() {
        match inner.as_rule() {
            Rule::modal_transpose_pitch => {
                // modal_transpose_pitch is now atomic, so we need to parse it manually
                let pitch_str = inner.as_str();
                
                // Extract note name (first 1-2 characters)
                let mut pitch = String::new();
                let mut octave_marks = String::new();
                
                let mut chars = pitch_str.chars();
                if let Some(first_char) = chars.next() {
                    pitch.push(first_char);
                    
                    // Check for accidental (is/es)
                    let rest: String = chars.collect();
                    if rest.starts_with("is") || rest.starts_with("es") {
                        pitch.push_str(&rest[..2]);
                        octave_marks = rest[2..].to_string();
                    } else {
                        octave_marks = rest;
                    }
                }
                
                let octave = calculate_octave(&octave_marks);
                
                if pitch_count == 0 {
                    from_pitch = pitch;
                    from_octave = octave;
                } else if pitch_count == 1 {
                    to_pitch = pitch;
                    to_octave = octave;
                }
                pitch_count += 1;
            },
            Rule::variable_reference => {
                let ref_str = inner.as_str();
                if ref_str.starts_with("\\\\") {
                    let var_name = ref_str[1..].to_string();
                    if scale_var_name.is_empty() {
                        scale_var_name = var_name;
                    } else {
                        music_var_name = var_name;
                    }
                } else if ref_str.starts_with("\\") {
                    let var_name = ref_str[1..].to_string();
                    if scale_var_name.is_empty() {
                        scale_var_name = var_name;
                    } else {
                        music_var_name = var_name;
                    }
                }
            },
            _ => {}
        }
    }
    
   
    
    // Get the scale variable
    let scale_notes = if let Some(scale_var) = parsed.variables.get(&scale_var_name) {
        &scale_var.base.notes
    } else {
        return Ok(());
    };
    
    // Get the music variable
    let music_notes = if let Some(music_var) = parsed.variables.get(&music_var_name) {
        music_var.base.notes.clone()
    } else {
        return Ok(());
    };
    
    // Build scale mapping
    let scale_pitches: Vec<String> = scale_notes.iter()
        .filter(|n| !n.pitch.is_empty() && n.pitch != "r")
        .map(|n| n.pitch.clone())
        .collect();
    
    
    // Find from_pitch and to_pitch positions in scale
    let from_index = scale_pitches.iter().position(|p| p == &from_pitch);
    let to_index = scale_pitches.iter().position(|p| p == &to_pitch);
    
    if from_index.is_none() || to_index.is_none() {
        // Fallback: just copy the notes without transposition
        notes.extend(music_notes);
        return Ok(());
    }
    
    let from_idx = from_index.unwrap();
    let to_idx = to_index.unwrap();
    let scale_len = scale_pitches.len();
    
    // Calculate interval (in scale steps)
    let interval = (to_idx as i32 - from_idx as i32 + scale_len as i32) % scale_len as i32;
    let octave_shift = to_octave - from_octave;
    
    
    // Transpose each note
    for mut note in music_notes {
        if note.note_type == NoteType::Clef|| note.pitch == "r" || note.pitch.is_empty() {
            // Don't transpose clefs or rests
            notes.push(note);
            continue;
        }
        
        // Find note position in scale
        if let Some(note_idx) = scale_pitches.iter().position(|p| p == &note.pitch) {
            // Calculate new position
            let new_idx = (note_idx as i32 + interval) % scale_len as i32;
            let octave_change = (note_idx as i32 + interval) / scale_len as i32;
            
            note.pitch = scale_pitches[new_idx as usize].clone();
            note.octave = note.octave + octave_shift + octave_change;
            

        }
        
        notes.push(note);
    }
    
    Ok(())
}

fn parse_new_voice(pair: pest::iterators::Pair<Rule>, 
    _notes: &mut Vec<LilyPondNote>,
    parsed: &mut ParsedMusic,
    _last_duration: &mut String,
    _last_octave: &mut i32,
    _last_pitch: &mut String,
    _mode: OctaveMode) -> Result<(), String> {
    
    // Parse \new Voice = "name" { ... } or \new Voice = "name" \variableName
    let mut voice = Voice {
        base: MusicContainerBase {
            name: None,
            clef: None,
            time_signature: None,
            key_signature: None,
            notes: Vec::new(),
        },
        lyrics: Vec::new(),
        measures: Vec::new(),
    };

    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::identifier | Rule::string_literal => {
                // Extract the voice name
                let name_str = inner_pair.as_str();
                // Remove quotes if it's a string literal
                let name = if name_str.starts_with('"') && name_str.ends_with('"') {
                    name_str[1..name_str.len()-1].to_string()
                } else {
                    name_str.to_string()
                };
                voice.base.name = Some(name);
            },
            Rule::simple_staff => {
                // Parse the voice body (which contains staff_body)
                for staff_pair in inner_pair.into_inner() {
                    match staff_pair.as_rule() {
                        Rule::staff_body => parse_staff_body(staff_pair, parsed, &mut voice.base)?,
                        _ => {}
                    }
                }
            },
            Rule::variable_reference => {
                // Handle \variableName reference
                let ref_str = inner_pair.as_str();
                if ref_str.starts_with("\\") {
                    let var_name = ref_str[1..].to_string();
                    if let Some(variable) = parsed.variables.get(&var_name) {
                        voice.base.notes.extend(variable.base.notes.clone());
                    }
                }
            },
            _ => {}
        }
    }
    for note in &voice.base.notes {
        if note.note_type == NoteType::Clef {
            voice.base.clef = note.clef.clone();
            break;
        }
    }
    for note in &voice.base.notes {
        if note.note_type == NoteType::Time {
            voice.base.time_signature = note.time_sig.clone();
            break;
        }
    }
    for note in &voice.base.notes {
        if note.note_type == NoteType::Key {
            voice.base.key_signature = note.key_sig.clone();
            break;
        }
    }

    let staff_idx = parsed.staves.len() - 1;
    if let Some(last_staff) = parsed.staves.last_mut() {
        last_staff.base.clef = voice.base.clef.clone();
        last_staff.base.time_signature = voice.base.time_signature.clone();
        last_staff.base.key_signature = voice.base.key_signature.clone();
        last_staff.voices.push(voice);
        let voice_idx = last_staff.voices.len() - 1;
        // Insert voice index mapping only if it has a name
        if let Some(voice_name) = last_staff.voices[voice_idx].base.name.clone() {
            parsed.voices.insert(voice_name, (staff_idx, voice_idx));
        }
    }
    
    Ok(())
}

/// 将音符组织成小节
/// 根据时间标记和音符时值，将 staff.notes 或 voice.notes 分组成小节
/// 小节信息存放在 staff.measures 或 voice.measures 中，measure 包含该小节内音符的索引
fn organize_measures(parsed: &mut ParsedMusic) -> Result<(), String> {
    // 为每个 staff 组织小节
    for staff in parsed.staves.iter_mut() {
        // 首先为 staff.notes 组织小节（如果没有 voice）
        if staff.voices.is_empty() {
            organize_notes_into_measures(&staff.base.notes, &staff.base.time_signature, &parsed.partial, &mut staff.measures)?;
        } else {
            // 为每个 voice 组织小节
            for voice in staff.voices.iter_mut() {
                organize_notes_into_measures(&voice.base.notes, &voice.base.time_signature, &parsed.partial, &mut voice.measures)?;
            }
        }
    }
    Ok(())
}

/// 将一组音符分组成小节
/// 返回每个小节包含的音符索引范围
fn organize_notes_into_measures(
    notes: &[LilyPondNote],
    time_signature: &Option<String>,
    partial: &Option<String>,
    measures: &mut Vec<Measure>,
) -> Result<(), String> {
    // 解析时间标记获取小节的容量
    let measure_capacity = parse_time_signature_fraction(time_signature)?;
    
    let mut current_measure_notes = Vec::new();
    let mut current_duration = 0.0;
    
    // 如果有 partial（拍子开头），计算其占用的时间
    let partial_val = if let Some(ref p) = partial {
        duration_to_fraction(p, "")? 
    } else {
        0.0
    };
    
    // 对于第一小节，如果有 partial，容量应该减少
    let mut current_capacity = if partial_val > 0.0 {
        partial_val
    } else {
        measure_capacity
    };
    
    // 用于追踪 RepeatStart 和 alternative 区域
    let mut repeat_start_measure_idx: Option<usize> = None;
    let mut alternative_start_idx: Option<usize> = None;
    let mut alternative_start_measure_idx: Option<usize> = None;
    
    for (idx, note) in notes.iter().enumerate() {
        // 跳过没有时值的标记（clef, time, key, ottava 等）
        if note.note_type == NoteType::Clef 
            || note.note_type == NoteType::Time 
            || note.note_type == NoteType::Key
            || note.note_type == NoteType::Grace
            || note.note_type == NoteType::Ottava {
            // 这些标记不计算时间，直接添加到当前小节
            current_measure_notes.push(idx as u32);
            continue;
        }
        
        // 处理 RepeatStart 标记
        if note.note_type == NoteType::RepeatStart {
            repeat_start_measure_idx = Some(measures.len());
            if repeat_start_measure_idx != Some(0) {
                current_measure_notes.push(idx as u32);
            }
            continue;
        }
        
        // 处理 AlternativeStart 标记
        if note.note_type == NoteType::AlternativeStart {
            if !current_measure_notes.is_empty() {
                measures.push(Measure {
                    notes: current_measure_notes.clone(),
                });
                current_measure_notes.clear();
            }
            
            // 重置为正常小节容量
            current_capacity = measure_capacity;
            current_duration = 0.0;

            alternative_start_idx = Some(idx);
            alternative_start_measure_idx = Some(measures.len());
            current_measure_notes.push(idx as u32);
            continue;
        }
        
        // 处理 AlternativeEnd 标记
        if note.note_type == NoteType::AlternativeEnd {
            
            
            // 检查下一个节点是否为 RepeatEnd
            let next_is_repeat_end = idx + 1 < notes.len() && notes[idx + 1].note_type == NoteType::RepeatEnd;
            
            if !next_is_repeat_end {
                current_measure_notes.push(idx as u32);
                
                // 需要检查 alternative 区域最后一个小节是否不满
                // 如果不满，需要把 RepeatStart 所在小节的时值加上
                
                // 保存当前小节并开始新小节
                if !current_measure_notes.is_empty() {
                    measures.push(Measure {
                        notes: current_measure_notes.clone(),
                    });
                    current_measure_notes.clear();
                    current_duration = 0.0;
                }
                
                // 计算 alternative 区域最后一个小节的时值
                if let (Some(alt_start_measure_idx), Some(_alt_start_idx)) = (alternative_start_measure_idx, alternative_start_idx) {
                    let last_measure_idx = measures.len() - 1;
                    
                    // 只有当最后一个小节存在且时值不满时才处理
                    if last_measure_idx > alt_start_measure_idx && last_measure_idx < measures.len() {
                        let last_measure_duration = calculate_measure_duration(&measures[last_measure_idx], notes)?;
                        
                        if last_measure_duration < measure_capacity - 0.001 {
                            // 最后一个小节时值不满，需要合并 RepeatStart 所在小节
                            if let Some(repeat_start_idx) = repeat_start_measure_idx {
                                if repeat_start_idx < measures.len() {
                                    let repeat_start_duration = calculate_measure_duration(&measures[repeat_start_idx], notes)?;
                                    let combined_duration = last_measure_duration + repeat_start_duration;
                                    
                                    // 如果合并后仍不满一个小节，则扩展最后一个小节
                                    if combined_duration <= measure_capacity + 0.001 {
                                        // 使用 split_at_mut 避免同时借用问题
                                        if repeat_start_idx < last_measure_idx {
                                            let (first, second) = measures.split_at_mut(last_measure_idx);
                                            second[0].notes.extend(first[repeat_start_idx].notes.clone());
                                            // 返回后不需要再访问
                                        } else {
                                            let (first, second) = measures.split_at_mut(repeat_start_idx);
                                            first[last_measure_idx].notes.extend(second[0].notes.clone());
                                            // 返回后不需要再访问
                                        };
                                    }
                                }
                            }
                        }
                    }
                }
                
                // 重置容量为正常小节容量
                current_capacity = measure_capacity;
                alternative_start_idx = None;
                alternative_start_measure_idx = None;
            }
            continue;
        }
        
        // 处理 RepeatEnd 标记
        if note.note_type == NoteType::RepeatEnd {
            current_measure_notes.push(idx as u32);
            repeat_start_measure_idx = None;
            if !current_measure_notes.is_empty() {
                measures.push(Measure {
                    notes: current_measure_notes.clone(),
                });
                current_measure_notes.clear();
            }
            
            // 重置为正常小节容量
            current_capacity = measure_capacity;
            current_duration = 0.0;
            continue;
        }
        
        // 计算当前音符的时值
        let note_duration = duration_to_fraction(&note.duration, &note.dots)?;
        
        // 检查是否需要开始新的小节
        if current_duration + note_duration > current_capacity + 0.001 {
            // 当前小节已满，保存小节并开始新小节
            if !current_measure_notes.is_empty() {
                measures.push(Measure {
                    notes: current_measure_notes.clone(),
                });
                current_measure_notes.clear();
            }
            
            // 重置为正常小节容量
            current_capacity = measure_capacity;
            current_duration = 0.0;
        }
        
        // 将音符添加到当前小节
        current_measure_notes.push(idx as u32);
        current_duration += note_duration;
    }
    
    // 保存最后一个小节
    if !current_measure_notes.is_empty() {
        measures.push(Measure {
            notes: current_measure_notes,
        });
    }
    
    Ok(())
}

/// 计算一个小节的总时值
fn calculate_measure_duration(measure: &Measure, notes: &[LilyPondNote]) -> Result<f64, String> {
    let mut duration = 0.0;
    
    for &note_idx in &measure.notes {
        let note = &notes[note_idx as usize];
        
        // 跳过没有时值的标记
        if note.note_type == NoteType::Clef 
            || note.note_type == NoteType::Time 
            || note.note_type == NoteType::Key
            || note.note_type == NoteType::Ottava
            || note.note_type == NoteType::RepeatStart
            || note.note_type == NoteType::RepeatEnd
            || note.note_type == NoteType::AlternativeStart
            || note.note_type == NoteType::AlternativeEnd {
            continue;
        }
        
        let note_duration = duration_to_fraction(&note.duration, &note.dots)?;
        duration += note_duration;
    }
    
    Ok(duration)
}

/// 将时间标记字符串转换为小节容量（以分数形式）
/// 例如 "4/4" -> 1.0，"3/8" -> 0.375
fn parse_time_signature_fraction(time_sig: &Option<String>) -> Result<f64, String> {
    if let Some(sig) = time_sig {
        // 解析格式 "numerator/denominator"
        let parts: Vec<&str> = sig.split('/').collect();
        if parts.len() == 2 {
            if let (Ok(numerator), Ok(denominator)) = (parts[0].parse::<i32>(), parts[1].parse::<i32>()) {
                // 小节容量 = numerator / denominator，其中 denominator=4 表示一个四分音符
                // 实际容量 = numerator * (1/denominator) = numerator / denominator
                // 在音符时值中，1 表示全音符，0.5 表示半音符，0.25 表示四分音符
                return Ok((numerator as f64) / (denominator as f64));
            }
        }
    }
    // 默认 4/4
    Ok(1.0)
}

/// 将音符时值转换为分数形式
/// duration: 时值字符串（如 "4", "8", "16", "2"）
/// dots: 附点字符串（如 ".", ".."）
/// 返回：分数形式的时值（1.0 = 全音符，0.5 = 半音符，0.25 = 四分音符）
fn duration_to_fraction(duration: &str, dots: &str) -> Result<f64, String> {
    // 基础时值
    let base_value = match duration {
        "1" => 1.0,      // 全音符
        "2" => 0.5,      // 半音符
        "4" => 0.25,     // 四分音符
        "8" => 0.125,    // 八分音符
        "16" => 0.0625,  // 十六分音符
        "32" => 0.03125, // 三十二分音符
        "64" => 0.015625, // 六十四分音符
        "" => 0.25,      // 默认为四分音符
        _ => return Err(format!("Unknown duration: {}", duration)),
    };
    
    // 处理附点
    let mut value = base_value;
    let mut dot_value = base_value / 2.0;
    
    for ch in dots.chars() {
        if ch == '.' {
            value += dot_value;
            dot_value /= 2.0;
        }
    }
    
    Ok(value)
}
