/**
 * Music notation mapping utilities and type definitions
 * Common mappings and interfaces used across the application for converting between different music notation formats
 */

/**
 * Type definitions for music notation
 */

/**
 * Note type classification
 */
export type NoteType = 'Default' | 'Clef' | 'Chord' | 'Time' | 'Key' | 'Ottava' | 'Rest' | 'Grace' | 'RepeatStart' | 'RepeatEnd' | 'AlternativeStart' | 'AlternativeEnd';

/**
 * LilyPond note representation
 * Represents a single note or chord in LilyPond format
 */
export interface LilyPondNote {
  pitch: string;
  duration: string;
  octave: number;
  dots: string;
  chord_notes?: Array<[string, number]>;
  clef?: string;
  time_sig?: string;  // Time signature (e.g., "4/4", "3/4")
  key_sig?: string;  // Key signature (e.g., "C", "D")
  ottava?: number;  // Octave transposition
  arpeggio?: boolean;  // True if this note has an arpeggio marking
  note_type?: NoteType;  // Type of note: Default, Clef, Chord, Time
  group_start?: boolean;  // True if this note starts a slur group
  group_end?: boolean;  // True if this note ends a slur group
  alternative_index?: number[];  // Alternative index (for alternative endings)
}

/**
 * Lyric data for a voice
 */
export interface Lyric {
  text_nodes: string[];
}

/**
 * Measure containing note indices
 */
export interface Measure {
  notes: number[];
}

/**
 * Voice data containing notes and lyrics
 */
export interface VoiceData {
  base: {
    name?: string;
    clef?: string;
    notes: LilyPondNote[];
  };
  lyrics: Lyric[];
  measures?: Measure[];
}

/**
 * Staff (譜表) containing notes or multiple voices
 */
export interface Staff {
  name?: string;
  clef?: string;
  time_signature?: string;  // Time signature (e.g., "4/4", "3/8")
  notes?: LilyPondNote[];
  voices?: VoiceData[];
  lyrics?: any[];
  measures?: Measure[];
}

/**
 * Complete parsed music data from LilyPond
 */
export interface ParsedMusic {
  title?: string;
  composer?: string;
  tempo?: string;
  key_signature?: string;
  time_signature?: string;
  partial?: string;  // Pickup measure duration (e.g., "8", "4", "16")
  staves?: Staff[];
}

/**
 * Duration mapping from LilyPond to VexFlow format
 * Maps LilyPond duration values to VexFlow duration strings
 */
export const durationMap: { [key: string]: string } = {
  '1': 'w',   // whole note
  '2': 'h',   // half note
  '4': 'q',   // quarter note
  '8': '8',   // eighth note
  '16': '16', // sixteenth note
  '32': '32'  // thirty-second note
};

/**
 * Pitch mapping from LilyPond to VexFlow format
 * Maps LilyPond pitch names to VexFlow pitch names
 * Supports both English (b) and German (h for B-natural) notation
 */
export const pitchMap: { [key: string]: string } = {
  'c': 'c',
  'd': 'd',
  'e': 'e',
  'f': 'f',
  'g': 'g',
  'a': 'a',
  'b': 'b',
  'h': 'b'  // German notation: h = B-natural
};

/**
 * Duration mapping for audio playback (in seconds)
 * Maps LilyPond duration values to time in seconds
 * tempo is 120 bpm
 */
export const durationToSecondsMap: { [key: string]: number } = {
  '1': 2.0,     // Whole note
  '2': 1.0,     // Half note
  '4': 0.5,     // Quarter note
  '8': 0.25,    // Eighth note
  '16': 0.125,  // Sixteenth note
  '32': 0.0625  // Thirty-second note
};

/**
 * Jianpu (simplified notation) mapping
 * Maps LilyPond pitch names to Jianpu numbers (1-7 for do-ti)
 * Supports both English and German notation
 */
export const jianpuMap: { [key: string]: string } = {
  'c': '1',  // do
  'd': '2',  // re
  'e': '3',  // mi
  'f': '4',  // fa
  'g': '5',  // sol
  'a': '6',  // la
  'b': '7',  // ti
  'h': '7'   // ti (German notation: h = B-natural)
};

/**
 * VexFlow duration to numeric duration mapping
 * Maps VexFlow duration strings to numeric duration values
 * Used for converting VexFlow note durations to numeric format for calculations
 */
export const vexFlowDurationMap: { [key: string]: string } = {
  'w': '1',   // whole note
  'h': '2',   // half note
  'q': '4',   // quarter note
  '8': '8',   // eighth note
  '16': '16', // sixteenth note
  '32': '32'  // thirty-second note
};

/**
 * Determine if an accidental should be shown for a note given the key signature
 * @param pitch - LilyPond pitch (e.g., 'bes', 'fis', 'c', 'b')
 * @param keySignature - Key signature string (e.g., 'F', 'G', 'Bb', 'D')
 * @returns '#' for sharp, 'b' for flat, 'n' for natural, null for no accidental needed
 */
export const shouldShowAccidental = (pitch: string, keySignature: string): string | null => {
  // Get the base note (first character)
  let baseNote = pitch.charAt(0).toLowerCase();
  
  // In German notation, 'h' means B-natural, 'b' means B-flat
  // Convert 'h' to 'b' for consistency in key signature checking
  const isGermanH = baseNote === 'h';
  if (isGermanH) {
    baseNote = 'b';
  }
  
  // Determine if the note has a sharp or flat in LilyPond notation
  const hasSharp = pitch.includes('is');
  const hasFlat = pitch.includes('es');
  
  // Key signature alterations
  // Maps key signature to which notes are altered
  const keySignatureAlterations: { [key: string]: { [note: string]: string } } = {
    // Major keys with sharps
    'G': { 'f': '#' },
    'D': { 'f': '#', 'c': '#' },
    'A': { 'f': '#', 'c': '#', 'g': '#' },
    'E': { 'f': '#', 'c': '#', 'g': '#', 'd': '#' },
    'B': { 'f': '#', 'c': '#', 'g': '#', 'd': '#', 'a': '#' },
    'F#': { 'f': '#', 'c': '#', 'g': '#', 'd': '#', 'a': '#', 'e': '#' },
    'C#': { 'f': '#', 'c': '#', 'g': '#', 'd': '#', 'a': '#', 'e': '#', 'b': '#' },
    
    // Major keys with flats
    'F': { 'b': 'b' },
    'Bb': { 'b': 'b', 'e': 'b' },
    'Eb': { 'b': 'b', 'e': 'b', 'a': 'b' },
    'Ab': { 'b': 'b', 'e': 'b', 'a': 'b', 'd': 'b' },
    'Db': { 'b': 'b', 'e': 'b', 'a': 'b', 'd': 'b', 'g': 'b' },
    'Gb': { 'b': 'b', 'e': 'b', 'a': 'b', 'd': 'b', 'g': 'b', 'c': 'b' },
    'Cb': { 'b': 'b', 'e': 'b', 'a': 'b', 'd': 'b', 'g': 'b', 'c': 'b', 'f': 'b' },
    
    // C major (no alterations)
    'C': {}
  };
  
  const alterations = keySignatureAlterations[keySignature] || {};
  const keyAlteration = alterations[baseNote];
  
  // Special case for German 'h' (B-natural)
  // If the key signature has B-flat, 'h' should show natural sign
  if (isGermanH && !hasSharp && !hasFlat) {
    if (keyAlteration === 'b') {
      return 'n';  // Show natural sign
    }
    return null;  // No accidental needed
  }
  
  // If the note has a sharp in LilyPond
  if (hasSharp) {
    // If key signature already has this note as sharp, don't show accidental
    if (keyAlteration === '#') {
      return null;
    }
    // Otherwise, show sharp
    return '#';
  }
  
  // If the note has a flat in LilyPond
  if (hasFlat) {
    // If key signature already has this note as flat, don't show accidental
    if (keyAlteration === 'b') {
      return null;
    }
    // Otherwise, show flat
    return 'b';
  }
  
  // Note is natural in LilyPond notation
  // If key signature has an alteration for this note, show natural sign
  if (keyAlteration) {
    return 'n';
  }
  
  // No accidental needed
  return null;
};
