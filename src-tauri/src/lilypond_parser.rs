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
    Rest
}

impl Default for NoteType {
    fn default() -> Self {
        NoteType::Default
    }
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
    pub ottava: Option<i32>,  // Octave transposition (e.g., 1 for up one octave, -1 for down one octave)
    pub arpeggio: bool,  // True if this note has an arpeggio marking
    #[serde(default)]
    pub note_type: NoteType,  // Type of note: Default, Clef, Chord, Time
    #[serde(default)]
    pub group_start: bool,  // True if this note starts a slur group (note before opening parenthesis)
    #[serde(default)]
    pub group_end: bool,  // True if this note ends a slur group (last note before closing parenthesis)
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
    pub notes: Vec<LilyPondNote>,
}

#[derive(Debug, Clone)]
pub struct Variable {
    pub base: MusicContainerBase,
    pub lyric: Option<Lyric>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Voice {
    pub base: MusicContainerBase,
    pub lyrics: Vec<Lyric>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Staff {
    #[serde(flatten)]
    pub base: MusicContainerBase,
    pub voices: Vec<Voice>,
}

impl Staff {
    pub fn new(name: Option<String>) -> Self {
        Self {
            base: MusicContainerBase {
                name,
                clef: None,
                time_signature: None,
                notes: Vec::new(),
            },
            voices: Vec::new(),
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
                    Rule::string_literal => {
                        let s = item_pair.as_str();
                        // Remove quotes
                        value = s[1..s.len()-1].to_string();
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
                _ => {}
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
                parse_music_sequence(inner_pair, &mut base.notes, parsed, &mut last_duration, &mut last_octave, OctaveMode::Absolute)?;
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
    
    // Store the variable with its notes
    if !var_name.is_empty() {
        let variable = Variable {
            base: MusicContainerBase {
                name: Some(var_name.clone()),
                notes: var_notes.clone(),
                clef: var_clef.clone(),
                time_signature: var_time.clone(),
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
            Rule::key_signature => parse_key_signature(inner_pair, parsed)?,
            Rule::time_signature => parse_time_signature(inner_pair, parsed)?,
            Rule::tempo => parse_tempo(inner_pair, parsed)?,
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
        println!("DEBUG: lyric={:?}, lyricsto_target={:?}", lyric, lyricsto_target);
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
    mode: OctaveMode) -> Result<(), String> {
    
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::music_item => {
                // music_item can be basic_music_item or music_mode
                for item in inner_pair.into_inner() {
                    match item.as_rule() {
                        Rule::basic_music_item => {
                            parse_basic_music_item(item, notes, parsed, last_duration, last_octave, mode)?;
                        },
                        Rule::music_mode => {
                            // Handle music_mode if needed
                            parse_music_mode(item, notes, parsed)?;
                        },
                        Rule::new_voice => {
                            // Handle \new Voice = "name" { ... } or \new Voice = "name" \variableName
                            parse_new_voice(item, notes, parsed, last_duration, last_octave, mode)?;
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
    let input_str = pair.as_str();
    let mut last_duration = "4".to_string();
    let mode_type = pair.as_rule();
    
    println!("[parse_music_mode] ========== 开始 ==========");
    println!("[parse_music_mode] 输入内容: {}, 模式类型: {:?}", input_str,mode_type);

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
    
    println!("[parse_music_mode] 实际处理的模式类型: {:?}", actual_mode_type);
    
    match actual_mode_type {
        Rule::fixed_mode => {
            let mut fixed_ref_octave = 4;
            
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
                                    parse_basic_music_item(seq_item,  notes, parsed, &mut last_duration,  &mut fixed_ref_octave, OctaveMode::Fixed)?;
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
            
            for mode_item in actual_pair.into_inner() {
                match mode_item.as_rule() {
                    Rule::relative_reference => {
                        relative_ref_octave = parse_reference_octave(mode_item)?;
                        println!("[parse_music_mode] Relative 模式 - reference octave: {}", relative_ref_octave);
                    },
                    Rule::basic_music_sequence => {
                        for seq_item in mode_item.into_inner() {
                            match seq_item.as_rule() {
                                Rule::basic_music_item => {
                                    parse_basic_music_item(seq_item,  notes, parsed, &mut last_duration,  &mut relative_ref_octave, OctaveMode::Relative)?;
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
            for mode_item in actual_pair.into_inner() {
                match mode_item.as_rule() {
                    Rule::basic_music_sequence => {
                        for seq_item in mode_item.into_inner() {
                            match seq_item.as_rule() {
                                Rule::basic_music_item => {
                                    parse_basic_music_item(seq_item,  notes, parsed, &mut last_duration,  &mut last_octave, OctaveMode::Absolute)?;
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
    
    println!("[parse_music_mode] 输出时 notes 数量: {}", notes.len());
    println!("[parse_music_mode] ========== 结束 ==========\n");
    
    Ok(())
}

fn parse_basic_music_item(pair: pest::iterators::Pair<Rule>, 
    notes: &mut Vec<LilyPondNote>,     
    parsed: &mut ParsedMusic,
    last_duration: &mut String, 
    last_octave: &mut i32,
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
                        ottava: None,
                        arpeggio: false,
                        note_type: NoteType::Clef,
                        group_start: false,
                        group_end: false,
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
                        ottava: None,
                        arpeggio: false,
                        note_type: NoteType::Time,
                        group_start: false,
                        group_end: false,
                    };
                    notes.push(time_note);
                    println!("[parse_basic_music_item] Created time signature note: {}", time_sig_value);
                }
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
                        ottava: Some(ottava_val),
                        arpeggio: false,
                        note_type: NoteType::Default,
                        group_start: false,
                        group_end: false,
                    };
                    notes.push(ottava_note);
                    println!("[parse_basic_music_item] Created ottava note with value: {}", ottava_val);
                }
            },
            Rule::musical_note => {
                let note = parse_musical_note(inner_pair, last_duration, last_octave, mode)?;
                notes.push(note);
            },
            Rule::rest => {
                let rest = parse_rest(inner_pair, last_duration)?;
                notes.push(rest);
            },
            Rule::angle_brackets => {
                let chord: LilyPondNote = parse_chord(inner_pair, last_duration, last_octave, mode)?;
                notes.push(chord);
            },
            Rule::parentheses => {
                println!("[parse_basic_music_item] 找到括号: {}", inner_pair.as_str());
                
                // Mark the previous note as group_start (the note before the opening parenthesis)
                if let Some(last_note) = notes.last_mut() {
                    last_note.group_start = true;
                    println!("[parse_basic_music_item] 设置 group_start 为 true: pitch={}", last_note.pitch);
                }
                
                // Parse notes inside parentheses
                let notes_before_paren = notes.len();
                parse_parentheses(inner_pair, notes, parsed, last_duration, last_octave, mode)?;
                
                // Mark the last note inside parentheses as group_end
                if notes.len() > notes_before_paren {
                    if let Some(last_note_in_paren) = notes.last_mut() {
                        last_note_in_paren.group_end = true;
                        println!("[parse_basic_music_item] 设置 group_end 为 true: pitch={}", last_note_in_paren.pitch);
                    }
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
            
            _ => {}
        }
    }
    Ok(())
}

fn parse_parentheses(pair: pest::iterators::Pair<Rule>, 
    notes: &mut Vec<LilyPondNote>, 
    parsed: &mut ParsedMusic,
    last_duration: &mut String,
    last_octave: &mut i32,
    mode: OctaveMode) -> Result<(), String> {
    // Parse notes inside parentheses (e.g., (e'8) or (d'8))
    for inner_pair in pair.into_inner() {
        match inner_pair.as_rule() {
            Rule::music_sequence => {
                parse_music_sequence(inner_pair, notes, parsed, last_duration,  last_octave, mode)?;
            },
            _ => {}
        }
    }
    Ok(())
}

fn parse_musical_note(pair: pest::iterators::Pair<Rule>, 
    last_duration: &mut String,
    last_octave: &mut i32,
    mode: OctaveMode) -> Result<LilyPondNote, String> {
    // println!("[DEBUG] parse_musical_note - Input: {}", pair.as_str());
    
    let mut pitch = String::new();
    let mut octave_marks = String::new();
    let mut duration = last_duration.clone();
    let mut dots = String::new();
    
    for inner_pair in pair.into_inner() {
        // println!("[DEBUG] parse_musical_note - Inner rule: {:?}, content: {}", inner_pair.as_rule(), inner_pair.as_str());
        
        match inner_pair.as_rule() {
            Rule::note_name => {
                pitch = inner_pair.as_str().to_string();
            },
            Rule::octave_modifier => {
                octave_marks = inner_pair.as_str().to_string();
            },
            Rule::duration => {
                let (dur, d) = parse_duration(inner_pair)?;
                duration = dur;
                dots = d;
                *last_duration = duration.clone();
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
            octave = calculate_relative_octave(&pitch, octave, last_octave);
            *last_octave = octave;
            
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
        ottava: None,
        arpeggio: false,
        note_type: NoteType::Default,
        group_start: false,
        group_end: false,
    })
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
        ottava: None,
        arpeggio: false,
        note_type: NoteType::Rest,
        group_start: false,
        group_end: false,
    })
}

fn parse_chord(pair: pest::iterators::Pair<Rule>, 
    last_duration: &mut String,
    last_octave: &mut i32,
    mode: OctaveMode) -> Result<LilyPondNote, String> {
    let mut chord_notes: Vec<(String, i32)> = Vec::new();
    let mut duration = last_duration.clone();
    let mut dots = String::new();
    let mut first_note: Option<LilyPondNote> = None;
    let mut _note_count = 0;
    
    // Parse the content inside angle brackets
    let content = pair.as_str();
    // Remove < and > and any trailing duration
    let inner_content = if content.starts_with('<') && content.contains('>') {
        let end_bracket = content.find('>').unwrap();
        &content[1..end_bracket]
    } else {
        &content[1..content.len()-1]
    };
    
    // Create a temporary last_octave for chord notes parsing
    // In relative mode, chord notes should be relative to each other
    let mut chord_last_octave = *last_octave;
    
    // Parse individual notes in the chord
    let mut current_note = String::new();
    for ch in inner_content.chars() {
        if ch.is_whitespace() {
            if !current_note.is_empty() {
                // Parse this note with proper octave calculation
                if let Ok(note) = parse_note_string_with_mode(&current_note, &mut chord_last_octave, mode) {
                    if first_note.is_none() {
                        first_note = Some(note.clone());
                    } else {
                        // Only add to chord_notes if it's not the first note
                        chord_notes.push((note.pitch, note.octave));
                    }
                    _note_count += 1;
                }
                current_note.clear();
            }
        } else {
            current_note.push(ch);
        }
    }
    
    // Don't forget the last note
    if !current_note.is_empty() {
        if let Ok(note) = parse_note_string_with_mode(&current_note, &mut chord_last_octave, mode) {
            if first_note.is_none() {
                first_note = Some(note.clone());
            } else {
                // Only add to chord_notes if it's not the first note
                chord_notes.push((note.pitch, note.octave));
            }
            _note_count += 1;
        }
    }
    
    // Update last_octave based on the last note in the chord
    // This is important for relative mode
    *last_octave = chord_last_octave;
    
    // Check for duration after the closing bracket
    if let Some(end_bracket) = content.find('>') {
        let after_bracket = &content[end_bracket+1..];
        if !after_bracket.is_empty() {
            // Try to parse duration
            if let Ok((dur, dots_str)) = parse_duration_string(after_bracket) {
                duration = dur;
                dots = dots_str;
                *last_duration = duration.clone();
            }
        }
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
fn parse_note_string_with_mode(
    note_str: &str, 
    last_octave: &mut i32,
    mode: OctaveMode
) -> Result<LilyPondNote, String> {
    let mut pitch = String::new();
    let mut octave_marks = String::new();
    
    for ch in note_str.chars() {
        if ch == '\'' || ch == ',' {
            octave_marks.push(ch);
        } else {
            pitch.push(ch);
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
            octave = calculate_relative_octave(&pitch, octave, last_octave);
            *last_octave = octave;
        },
        OctaveMode::Absolute => {
            // In absolute mode, octave is used as-is
        }
    }
    
    Ok(LilyPondNote {
        pitch,
        duration: "4".to_string(),
        octave,
        dots: String::new(),
        chord_notes: Vec::new(),
        clef: None,
        time_sig: None,
        ottava: None,
        arpeggio: false,
        note_type: NoteType::Default,
        group_start: false,
        group_end: false,
    })
}

// TODO: 能否和parse_duration合并了？
fn parse_duration_string(dur_str: &str) -> Result<(String, String), String> {
    let mut duration_num = String::new();
    let mut dots = String::new();
    
    for ch in dur_str.chars() {
        if ch.is_numeric() {
            duration_num.push(ch);
        } else if ch == '.' {
            dots.push(ch);
        }
    }
    
    if duration_num.is_empty() {
        duration_num = "4".to_string();
    }
    
    Ok((duration_num, dots))
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

fn calculate_relative_octave(pitch: &str, specified_octave: i32, last_octave: &i32) -> i32 {
    // In relative mode, choose the octave that makes the smallest interval
    // This is a simplified implementation - full LilyPond logic is more complex
    
    let pitch_values = [
        ("c", 0), ("d", 2), ("e", 4), ("f", 5), ("g", 7), ("a", 9), ("b", 11)
    ];
    
    let _current_pitch_value = pitch_values.iter()
        .find(|(p, _)| pitch.starts_with(p))
        .map(|(_, v)| *v)
        .unwrap_or(0);
    
    // For simplicity, use the specified octave if it's reasonable,
    // otherwise adjust based on the last octave
    if (specified_octave - last_octave).abs() <= 1 {
        specified_octave
    } else {
        *last_octave
    }
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
    _mode: OctaveMode) -> Result<(), String> {
    
    // Parse \new Voice = "name" { ... } or \new Voice = "name" \variableName
    let mut voice = Voice {
        base: MusicContainerBase {
            name: None,
            clef: None,
            time_signature: None,
            notes: Vec::new(),
        },
        lyrics: Vec::new(),
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
    
    let staff_idx = parsed.staves.len() - 1;
    if let Some(last_staff) = parsed.staves.last_mut() {
        last_staff.base.clef = voice.base.clef.clone();
        last_staff.base.time_signature = voice.base.time_signature.clone();
        last_staff.voices.push(voice);
        let voice_idx = last_staff.voices.len() - 1;
        // Insert voice index mapping only if it has a name
        if let Some(voice_name) = last_staff.voices[voice_idx].base.name.clone() {
            parsed.voices.insert(voice_name, (staff_idx, voice_idx));
        }
    }
    
    Ok(())
}
