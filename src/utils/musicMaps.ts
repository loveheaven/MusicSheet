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
export type NoteType = 'Default' | 'Clef' | 'Chord' | 'Time' | 'Key' | 'Ottava' | 'Rest';

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
}

/**
 * Lyric data for a voice
 */
export interface Lyric {
  text_nodes: string[];
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
}

/**
 * Staff (譜表) containing notes or multiple voices
 */
export interface Staff {
  name?: string;
  clef?: string;
  notes?: LilyPondNote[];
  voices?: VoiceData[];
  lyrics?: any[];
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
 */
export const pitchMap: { [key: string]: string } = {
  'c': 'c',
  'd': 'd',
  'e': 'e',
  'f': 'f',
  'g': 'g',
  'a': 'a',
  'b': 'b'
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
 */
export const jianpuMap: { [key: string]: string } = {
  'c': '1',  // do
  'd': '2',  // re
  'e': '3',  // mi
  'f': '4',  // fa
  'g': '5',  // sol
  'a': '6',  // la
  'b': '7'   // ti
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
