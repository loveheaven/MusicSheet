import { useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';

// Instrument sample mappings - Complete list from tonejs-instruments
export const INSTRUMENT_SAMPLES = {
  'bass-electric': {
    'A#1': 'As1.mp3', 'A#2': 'As2.mp3', 'A#3': 'As3.mp3', 'A#4': 'As4.mp3',
    'C#1': 'Cs1.mp3', 'C#2': 'Cs2.mp3', 'C#3': 'Cs3.mp3', 'C#4': 'Cs4.mp3',
    'E1': 'E1.mp3', 'E2': 'E2.mp3', 'E3': 'E3.mp3', 'E4': 'E4.mp3',
    'G1': 'G1.mp3', 'G2': 'G2.mp3', 'G3': 'G3.mp3', 'G4': 'G4.mp3'
  },
  'bassoon': {
    'A4': 'A4.mp3', 'C3': 'C3.mp3', 'C4': 'C4.mp3', 'C5': 'C5.mp3', 'E4': 'E4.mp3',
    'G2': 'G2.mp3', 'G3': 'G3.mp3', 'G4': 'G4.mp3', 'A2': 'A2.mp3', 'A3': 'A3.mp3'
  },
  'cello': {
    'E3': 'E3.mp3', 'E4': 'E4.mp3', 'F2': 'F2.mp3', 'F3': 'F3.mp3', 'F4': 'F4.mp3',
    'F#3': 'Fs3.mp3', 'F#4': 'Fs4.mp3', 'G2': 'G2.mp3', 'G3': 'G3.mp3', 'G4': 'G4.mp3',
    'G#2': 'Gs2.mp3', 'G#3': 'Gs3.mp3', 'G#4': 'Gs4.mp3', 'A2': 'A2.mp3', 'A3': 'A3.mp3', 'A4': 'A4.mp3',
    'A#2': 'As2.mp3', 'A#3': 'As3.mp3', 'B2': 'B2.mp3', 'B3': 'B3.mp3', 'B4': 'B4.mp3',
    'C2': 'C2.mp3', 'C3': 'C3.mp3', 'C4': 'C4.mp3', 'C5': 'C5.mp3', 'C#3': 'Cs3.mp3', 'C#4': 'Cs4.mp3',
    'D2': 'D2.mp3', 'D3': 'D3.mp3', 'D4': 'D4.mp3', 'D#2': 'Ds2.mp3', 'D#3': 'Ds3.mp3', 'D#4': 'Ds4.mp3', 'E2': 'E2.mp3'
  },
  'clarinet': {
    'D4': 'D4.mp3', 'D5': 'D5.mp3', 'D6': 'D6.mp3', 'F3': 'F3.mp3', 'F4': 'F4.mp3', 'F5': 'F5.mp3',
    'F#6': 'Fs6.mp3', 'A#3': 'As3.mp3', 'A#4': 'As4.mp3', 'A#5': 'As5.mp3', 'D3': 'D3.mp3'
  },
  'contrabass': {
    'C2': 'C2.mp3', 'C#3': 'Cs3.mp3', 'D2': 'D2.mp3', 'E2': 'E2.mp3', 'E3': 'E3.mp3',
    'F#1': 'Fs1.mp3', 'F#2': 'Fs2.mp3', 'G1': 'G1.mp3', 'G#2': 'Gs2.mp3', 'G#3': 'Gs3.mp3',
    'A2': 'A2.mp3', 'A#1': 'As1.mp3', 'B3': 'B3.mp3'
  },
  'flute': {
    'A6': 'A6.mp3', 'C4': 'C4.mp3', 'C5': 'C5.mp3', 'C6': 'C6.mp3', 'C7': 'C7.mp3',
    'E4': 'E4.mp3', 'E5': 'E5.mp3', 'E6': 'E6.mp3', 'A4': 'A4.mp3', 'A5': 'A5.mp3'
  },
  'french-horn': {
    'D3': 'D3.mp3', 'D5': 'D5.mp3', 'D#2': 'Ds2.mp3', 'F3': 'F3.mp3', 'F5': 'F5.mp3',
    'G2': 'G2.mp3', 'A1': 'A1.mp3', 'A3': 'A3.mp3', 'C2': 'C2.mp3', 'C4': 'C4.mp3'
  },
  'guitar-acoustic': {
    'F4': 'F4.mp3', 'F#2': 'Fs2.mp3', 'F#3': 'Fs3.mp3', 'F#4': 'Fs4.mp3', 'G2': 'G2.mp3', 'G3': 'G3.mp3', 'G4': 'G4.mp3',
    'G#2': 'Gs2.mp3', 'G#3': 'Gs3.mp3', 'G#4': 'Gs4.mp3', 'A2': 'A2.mp3', 'A3': 'A3.mp3', 'A4': 'A4.mp3',
    'A#2': 'As2.mp3', 'A#3': 'As3.mp3', 'A#4': 'As4.mp3', 'B2': 'B2.mp3', 'B3': 'B3.mp3', 'B4': 'B4.mp3',
    'C3': 'C3.mp3', 'C4': 'C4.mp3', 'C5': 'C5.mp3', 'C#3': 'Cs3.mp3', 'C#4': 'Cs4.mp3', 'C#5': 'Cs5.mp3',
    'D2': 'D2.mp3', 'D3': 'D3.mp3', 'D4': 'D4.mp3', 'D5': 'D5.mp3', 'D#2': 'Ds2.mp3', 'D#3': 'Ds3.mp3', 'D#4': 'Ds3.mp3',
    'E2': 'E2.mp3', 'E3': 'E3.mp3', 'E4': 'E4.mp3', 'F2': 'F2.mp3', 'F3': 'F3.mp3'
  },
  'guitar-electric': {
    'D#3': 'Ds3.mp3', 'D#4': 'Ds4.mp3', 'D#5': 'Ds5.mp3', 'E2': 'E2.mp3', 'F#2': 'Fs2.mp3', 'F#3': 'Fs3.mp3',
    'F#4': 'Fs4.mp3', 'F#5': 'Fs5.mp3', 'A2': 'A2.mp3', 'A3': 'A3.mp3', 'A4': 'A4.mp3', 'A5': 'A5.mp3',
    'C3': 'C3.mp3', 'C4': 'C4.mp3', 'C5': 'C5.mp3', 'C6': 'C6.mp3', 'C#2': 'Cs2.mp3'
  },
  'guitar-nylon': {
    'F#2': 'Fs2.mp3', 'F#3': 'Fs3.mp3', 'F#4': 'Fs4.mp3', 'F#5': 'Fs5.mp3', 'G3': 'G3.mp3', 'G5': 'G3.mp3',
    'G#2': 'Gs2.mp3', 'G#4': 'Gs4.mp3', 'G#5': 'Gs5.mp3', 'A2': 'A2.mp3', 'A3': 'A3.mp3', 'A4': 'A4.mp3', 'A5': 'A5.mp3',
    'A#5': 'As5.mp3', 'B1': 'B1.mp3', 'B2': 'B2.mp3', 'B3': 'B3.mp3', 'B4': 'B4.mp3', 'C#3': 'Cs3.mp3', 'C#4': 'Cs4.mp3',
    'C#5': 'Cs5.mp3', 'D2': 'D2.mp3', 'D3': 'D3.mp3', 'D5': 'D5.mp3', 'D#4': 'Ds4.mp3', 'E2': 'E2.mp3', 'E3': 'E3.mp3',
    'E4': 'E4.mp3', 'E5': 'E5.mp3'
  },
  'harmonium': {
    'C2': 'C2.mp3', 'C3': 'C3.mp3', 'C4': 'C4.mp3', 'C5': 'C5.mp3', 'C#2': 'Cs2.mp3', 'C#3': 'Cs3.mp3', 'C#4': 'Cs4.mp3',
    'C#5': 'Cs5.mp3', 'D2': 'D2.mp3', 'D3': 'D3.mp3', 'D4': 'D4.mp3', 'D5': 'D5.mp3', 'D#2': 'Ds2.mp3', 'D#3': 'Ds3.mp3',
    'D#4': 'Ds4.mp3', 'E2': 'E2.mp3', 'E3': 'E3.mp3', 'E4': 'E4.mp3', 'F2': 'F2.mp3', 'F3': 'F3.mp3', 'F4': 'F4.mp3',
    'F#2': 'Fs2.mp3', 'F#3': 'Fs3.mp3', 'G2': 'G2.mp3', 'G3': 'G3.mp3', 'G4': 'G4.mp3', 'G#2': 'Gs2.mp3', 'G#3': 'Gs3.mp3',
    'G#4': 'Gs4.mp3', 'A2': 'A2.mp3', 'A3': 'A3.mp3', 'A4': 'A4.mp3', 'A#2': 'As2.mp3', 'A#3': 'As3.mp3', 'A#4': 'As4.mp3'
  },
  'harp': {
    'C5': 'C5.mp3', 'D2': 'D2.mp3', 'D4': 'D4.mp3', 'D6': 'D6.mp3', 'D7': 'D7.mp3', 'E1': 'E1.mp3', 'E3': 'E3.mp3',
    'E5': 'E5.mp3', 'F2': 'F2.mp3', 'F4': 'F4.mp3', 'F6': 'F6.mp3', 'F7': 'F7.mp3', 'G1': 'G1.mp3', 'G3': 'G3.mp3',
    'G5': 'G5.mp3', 'A2': 'A2.mp3', 'A4': 'A4.mp3', 'A6': 'A6.mp3', 'B1': 'B1.mp3', 'B3': 'B3.mp3', 'B5': 'B5.mp3',
    'B6': 'B6.mp3', 'C3': 'C3.mp3'
  },
  'organ': {
    'C3': 'C3.mp3', 'C4': 'C4.mp3', 'C5': 'C5.mp3', 'C6': 'C6.mp3', 'D#1': 'Ds1.mp3', 'D#2': 'Ds2.mp3',
    'D#3': 'Ds3.mp3', 'D#4': 'Ds4.mp3', 'D#5': 'Ds5.mp3', 'F#1': 'Fs1.mp3', 'F#2': 'Fs2.mp3', 'F#3': 'Fs3.mp3',
    'F#4': 'Fs4.mp3', 'F#5': 'Fs5.mp3', 'A1': 'A1.mp3', 'A2': 'A2.mp3', 'A3': 'A3.mp3', 'A4': 'A4.mp3',
    'A5': 'A5.mp3', 'C1': 'C1.mp3', 'C2': 'C2.mp3'
  },
  'piano': {
    'A7': 'A7.mp3', 'A1': 'A1.mp3', 'A2': 'A2.mp3', 'A3': 'A3.mp3', 'A4': 'A4.mp3', 'A5': 'A5.mp3', 'A6': 'A6.mp3',
    'A#7': 'As7.mp3', 'A#1': 'As1.mp3', 'A#2': 'As2.mp3', 'A#3': 'As3.mp3', 'A#4': 'As4.mp3', 'A#5': 'As5.mp3', 'A#6': 'As6.mp3',
    'B7': 'B7.mp3', 'B1': 'B1.mp3', 'B2': 'B2.mp3', 'B3': 'B3.mp3', 'B4': 'B4.mp3', 'B5': 'B5.mp3', 'B6': 'B6.mp3',
    'C7': 'C7.mp3', 'C1': 'C1.mp3', 'C2': 'C2.mp3', 'C3': 'C3.mp3', 'C4': 'C4.mp3', 'C5': 'C5.mp3', 'C6': 'C6.mp3',
    'C#7': 'Cs7.mp3', 'C#1': 'Cs1.mp3', 'C#2': 'Cs2.mp3', 'C#3': 'Cs3.mp3', 'C#4': 'Cs4.mp3', 'C#5': 'Cs5.mp3', 'C#6': 'Cs6.mp3',
    'D7': 'D7.mp3', 'D1': 'D1.mp3', 'D2': 'D2.mp3', 'D3': 'D3.mp3', 'D4': 'D4.mp3', 'D5': 'D5.mp3', 'D6': 'D6.mp3',
    'D#7': 'Ds7.mp3', 'D#1': 'Ds1.mp3', 'D#2': 'Ds2.mp3', 'D#3': 'Ds3.mp3', 'D#4': 'Ds4.mp3', 'D#5': 'Ds5.mp3', 'D#6': 'Ds6.mp3',
    'E7': 'E7.mp3', 'E1': 'E1.mp3', 'E2': 'E2.mp3', 'E3': 'E3.mp3', 'E4': 'E4.mp3', 'E5': 'E5.mp3', 'E6': 'E6.mp3',
    'F7': 'F7.mp3', 'F1': 'F1.mp3', 'F2': 'F2.mp3', 'F3': 'F3.mp3', 'F4': 'F4.mp3', 'F5': 'F5.mp3', 'F6': 'F6.mp3',
    'F#7': 'Fs7.mp3', 'F#1': 'Fs1.mp3', 'F#2': 'Fs2.mp3', 'F#3': 'Fs3.mp3', 'F#4': 'Fs4.mp3', 'F#5': 'Fs5.mp3', 'F#6': 'Fs6.mp3',
    'G7': 'G7.mp3', 'G1': 'G1.mp3', 'G2': 'G2.mp3', 'G3': 'G3.mp3', 'G4': 'G4.mp3', 'G5': 'G5.mp3', 'G6': 'G6.mp3',
    'G#7': 'Gs7.mp3', 'G#1': 'Gs1.mp3', 'G#2': 'Gs2.mp3', 'G#3': 'Gs3.mp3', 'G#4': 'Gs4.mp3', 'G#5': 'Gs5.mp3', 'G#6': 'Gs6.mp3'
  },
  'saxophone': {
    'D#5': 'Ds5.mp3', 'E3': 'E3.mp3', 'E4': 'E4.mp3', 'E5': 'E5.mp3', 'F3': 'F3.mp3', 'F4': 'F4.mp3', 'F5': 'F5.mp3',
    'F#3': 'Fs3.mp3', 'F#4': 'Fs4.mp3', 'F#5': 'Fs5.mp3', 'G3': 'G3.mp3', 'G4': 'G4.mp3', 'G5': 'G5.mp3',
    'G#3': 'Gs3.mp3', 'G#4': 'Gs4.mp3', 'G#5': 'Gs5.mp3', 'A4': 'A4.mp3', 'A5': 'A5.mp3', 'A#3': 'As3.mp3',
    'A#4': 'As4.mp3', 'B3': 'B3.mp3', 'B4': 'B4.mp3', 'C4': 'C4.mp3', 'C5': 'C5.mp3', 'C#3': 'Cs3.mp3',
    'C#4': 'Cs4.mp3', 'C#5': 'Cs5.mp3', 'D3': 'D3.mp3', 'D4': 'D4.mp3', 'D5': 'D5.mp3', 'D#3': 'Ds3.mp3', 'D#4': 'Ds4.mp3'
  },
  'trombone': {
    'A#3': 'As3.mp3', 'C3': 'C3.mp3', 'C4': 'C4.mp3', 'C#2': 'Cs2.mp3', 'C#4': 'Cs4.mp3', 'D3': 'D3.mp3',
    'D4': 'D4.mp3', 'D#2': 'Ds2.mp3', 'D#3': 'Ds3.mp3', 'D#4': 'Ds4.mp3', 'F2': 'F2.mp3', 'F3': 'F3.mp3',
    'F4': 'F4.mp3', 'G#2': 'Gs2.mp3', 'G#3': 'Gs3.mp3', 'A#1': 'As1.mp3', 'A#2': 'As2.mp3'
  },
  'trumpet': {
    'C6': 'C6.mp3', 'D5': 'D5.mp3', 'D#4': 'Ds4.mp3', 'F3': 'F3.mp3', 'F4': 'F4.mp3', 'F5': 'F5.mp3',
    'G4': 'G4.mp3', 'A3': 'A3.mp3', 'A5': 'A5.mp3', 'A#4': 'As4.mp3', 'C4': 'C4.mp3'
  },
  'tuba': {
    'A#2': 'As2.mp3', 'A#3': 'As3.mp3', 'D3': 'D3.mp3', 'D4': 'D4.mp3', 'D#2': 'Ds2.mp3',
    'F1': 'F1.mp3', 'F2': 'F2.mp3', 'F3': 'F3.mp3', 'A#1': 'As1.mp3'
  },
  'violin': {
    'A3': 'A3.mp3', 'A4': 'A4.mp3', 'A5': 'A5.mp3', 'A6': 'A6.mp3', 'C4': 'C4.mp3', 'C5': 'C5.mp3',
    'C6': 'C6.mp3', 'C7': 'C7.mp3', 'E4': 'E4.mp3', 'E5': 'E5.mp3', 'E6': 'E6.mp3', 'G4': 'G4.mp3',
    'G5': 'G5.mp3', 'G6': 'G6.mp3'
  },
  'xylophone': {
    'C8': 'C8.mp3', 'G4': 'G4.mp3', 'G5': 'G5.mp3', 'G6': 'G6.mp3', 'G7': 'G7.mp3',
    'C5': 'C5.mp3', 'C6': 'C6.mp3', 'C7': 'C7.mp3'
  }
};

type NoteType = 'Default' | 'Clef' | 'Chord' | 'Time';

interface LilyPondNote {
  pitch: string;
  duration: string;
  octave: number;
  dots: string;  // Dots for dotted notes
  chord_notes?: Array<[string, number]>;
  time_sig?: string;  // Time signature (e.g., "4/4", "3/4")
  note_type?: NoteType;  // Type of note: Default, Clef, Chord, Time
  group_start?: boolean;  // True if this note starts a slur group
  group_end?: boolean;  // True if this note ends a slur group
}

interface Staff {
  name?: string;
  clef?: string;
  notes?: LilyPondNote[];
  lyrics?: any[];
}

interface AudioPlayerProps {
  notes?: LilyPondNote[];
  staves?: Staff[];
  onNoteProgress: (staffIndex: number, noteIndex: number) => void;
  onPlaybackEnd: () => void;
  selectedInstrument?: string;
}

const AudioPlayer = forwardRef<any, AudioPlayerProps>(({ notes, staves, onNoteProgress, onPlaybackEnd, selectedInstrument = 'piano' }, ref) => {
  const synthsRef = useRef<Map<number, Tone.Sampler | Tone.Synth>>(new Map());
  const isPlayingRef = useRef(false);
  const scheduledEventsRef = useRef<number[]>([]);
  const isPausedRef = useRef(false);
  const isInitializedRef = useRef(false);
  const currentNoteIndicesRef = useRef<Map<number, number>>(new Map());
  const recorderRef = useRef<Tone.Recorder | null>(null);



  // Reset player state when notes, staves, or instrument change
  useEffect(() => {
    // Stop current playback
    if (isPlayingRef.current) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      Tone.Transport.position = 0;
    }

    // Clear scheduled events
    scheduledEventsRef.current.forEach(id => Tone.Transport.clear(id));
    scheduledEventsRef.current = [];

    // Reset state flags
    isPlayingRef.current = false;
    isPausedRef.current = false;
    isInitializedRef.current = false;

    // Clear current note indices
    currentNoteIndicesRef.current.clear();

    // Dispose old synths
    synthsRef.current.forEach(synth => synth.dispose());
    synthsRef.current.clear();
  }, [notes, staves, selectedInstrument]);

  const convertLilyPondToTone = (note: LilyPondNote): string | string[] | null => {
    // Handle rest
    if (note.pitch === 'r') {
      return null;  // Rest has no pitch
    }

    // Handle chord
    if (note.note_type === 'Chord' && note.chord_notes && note.chord_notes.length > 0) {
      const pitches: string[] = [];
      
      // Add base note
      let basePitch = note.pitch.charAt(0).toUpperCase();
      if (note.pitch.includes('is')) {
        basePitch += '#';
      } else if (note.pitch.includes('es')) {
        basePitch += 'b';
      }
      pitches.push(`${basePitch}${note.octave}`);
      
      // Add chord notes
      for (const [chordPitch, chordOctave] of note.chord_notes) {
        let pitch = chordPitch.charAt(0).toUpperCase();
        if (chordPitch.includes('is')) {
          pitch += '#';
        } else if (chordPitch.includes('es')) {
          pitch += 'b';
        }
        pitches.push(`${pitch}${chordOctave}`);
      }
      
      return pitches;
    }

    // Regular note
    let pitch = note.pitch.charAt(0).toUpperCase();
    
    if (note.pitch.includes('is')) {
      pitch += '#';
    } else if (note.pitch.includes('es')) {
      pitch += 'b';
    }

    return `${pitch}${note.octave}`;
  };

  const getDurationInSeconds = (duration: string, dots?: string): number => {
    const durationMap: { [key: string]: number } = {
      '1': 2.0,
      '2': 1.0,
      '4': 0.5,
      '8': 0.25,
      '16': 0.125,
    };

    let baseDuration = durationMap[duration] || 0.5;
    
    // Apply dots: each dot adds half of the previous duration
    // One dot: 1.5x, Two dots: 1.75x, Three dots: 1.875x
    if (dots && dots.length > 0) {
      let multiplier = 1.0;
      let addedDuration = baseDuration / 2;
      for (let i = 0; i < dots.length; i++) {
        multiplier += addedDuration / baseDuration;
        addedDuration /= 2;
      }
      baseDuration *= multiplier;
    }
    
    return baseDuration;
  };

  const createSynthForStaff = async (staffIndex: number): Promise<Tone.Sampler | Tone.Synth> => {
    if (synthsRef.current.has(staffIndex)) {
      return synthsRef.current.get(staffIndex)!;
    }

    let synth: Tone.Sampler | Tone.Synth;

    // Check if we have samples for the selected instrument
    const instrumentSamples = INSTRUMENT_SAMPLES[selectedInstrument as keyof typeof INSTRUMENT_SAMPLES];
    
    if (instrumentSamples) {
      try {
        // Ensure Tone context is running
        if (Tone.context.state !== 'running') {
          await Tone.start();
        }
        
        console.log(`Loading ${selectedInstrument} samples...`);
        
        // Create Tone.Sampler with the instrument samples
        synth = await new Promise<Tone.Sampler>((resolve, reject) => {
          const sampler = new Tone.Sampler({
            urls: instrumentSamples,
            baseUrl: `/tonejs-instruments/samples/${selectedInstrument}/`,
            onload: () => {
              console.log(`${selectedInstrument} loaded successfully`);
              resolve(sampler);
            },
            onerror: (error) => {
              console.error(`Error loading ${selectedInstrument}:`, error);
              reject(error);
            }
          }).toDestination();
          
          // Timeout fallback
          setTimeout(() => {
            console.log(`${selectedInstrument} loaded via timeout fallback`);
            resolve(sampler);
          }, 5000);
        });
        
        console.log(`Successfully created ${selectedInstrument} sampler`);
      } catch (error) {
        console.warn(`Failed to load instrument ${selectedInstrument}, falling back to synth:`, error);
        synth = createFallbackSynth();
      }
    } else {
      // Fallback to basic synth for unsupported instruments
      console.log(`No samples available for ${selectedInstrument}, using fallback synth`);
      synth = createFallbackSynth();
    }

    synthsRef.current.set(staffIndex, synth);
    return synth;
  };

  const createFallbackSynth = (): Tone.Synth => {
    return new Tone.Synth({
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.3,
        release: 0.8
      }
    }).toDestination();
  };

  const playNote = (synth: Tone.Sampler | Tone.Synth, pitch: string | string[], duration: number, time: number) => {
    if (Array.isArray(pitch)) {
      // Chord: play all notes simultaneously
      pitch.forEach(p => {
        synth.triggerAttackRelease(p, duration, time);
      });
    } else {
      // Single note
      synth.triggerAttackRelease(pitch, duration, time);
    }
  };

  const exportAudio = async (format: 'wav' | 'mp3', filename?: string) => {
    try {
      if (Tone.context.state !== 'running') {
        await Tone.start();
      }

      // Create a new recorder connected to the destination
      const recorder = new Tone.Recorder();
      Tone.Destination.connect(recorder);
      recorderRef.current = recorder;

      // Start recording
      recorder.start();

      // Clear existing events
      scheduledEventsRef.current.forEach(id => Tone.Transport.clear(id));
      scheduledEventsRef.current = [];
      Tone.Transport.cancel();
      Tone.Transport.stop();
      Tone.Transport.position = 0;

      // Initialize current note indices
      currentNoteIndicesRef.current.clear();

      // Determine which data structure to use
      const hasStaves = staves && staves.length > 0;
      const hasNotes = notes && notes.length > 0;
      let totalDuration = 0;

      if (hasStaves) {
        // Play multiple staves simultaneously
        const synthPromises = staves!.map(async (staff, staffIndex) => {
          if (!staff.notes || staff.notes.length === 0) return null;
          const synth = await createSynthForStaff(staffIndex);
          return { staff, staffIndex, synth };
        });

        const loadedStaves = await Promise.all(synthPromises);
        
        loadedStaves.forEach((staffData) => {
          if (!staffData) return;
          const { staff, synth } = staffData;
          let transportTime = 0;

          if (!staff.notes) return;
          staff.notes.forEach((note) => {
            const toneNote = convertLilyPondToTone(note);
            const noteDuration = getDurationInSeconds(note.duration, note.dots);

            // Schedule note playback (skip rests)
            if (toneNote !== null) {
              const noteEventId = Tone.Transport.schedule((time) => {
                playNote(synth, toneNote, noteDuration, time);
              }, transportTime);
              scheduledEventsRef.current.push(noteEventId);
            }

            transportTime += noteDuration;
          });

          totalDuration = Math.max(totalDuration, transportTime);
        });
      } else if (hasNotes) {
        // Fallback: play single staff (backward compatibility)
        const synth = await createSynthForStaff(0);
        let transportTime = 0;

        notes!.forEach((note) => {
          const toneNote = convertLilyPondToTone(note);
          const noteDuration = getDurationInSeconds(note.duration, note.dots);

          // Schedule note playback (skip rests)
          if (toneNote !== null) {
            const noteEventId = Tone.Transport.schedule((time) => {
              playNote(synth, toneNote, noteDuration, time);
            }, transportTime);
            scheduledEventsRef.current.push(noteEventId);
          }

          transportTime += noteDuration;
        });

        totalDuration = transportTime;
      }

      // Start playback
      Tone.Transport.start();

      // Wait for playback to complete
      await new Promise(resolve => {
        setTimeout(resolve, (totalDuration + 0.5) * 1000);
      });

      // Stop transport
      Tone.Transport.stop();
      Tone.Transport.cancel();
      Tone.Transport.position = 0;

      // Stop recording and get the audio
      const audio = await recorder.stop();

      // Disconnect recorder
      Tone.Destination.disconnect(recorder);

      // Create a blob and download
      const mimeType = format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
      const extension = format === 'mp3' ? 'mp3' : 'wav';
      const blob = new Blob([audio], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `music-${selectedInstrument}-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`Audio exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error('Error exporting audio:', error);
      throw error;
    }
  };

  const exportMidi = async (filename?: string) => {
    try {
      // Create a new MIDI file
      const midi = new Midi();
      midi.header.setTempo(120);

      // Determine which data structure to use
      const hasStaves = staves && staves.length > 0;
      const hasNotes = notes && notes.length > 0;

      // Helper function to convert note name to MIDI note number
      const noteNameToMidi = (noteName: string): number => {
        const noteMap: { [key: string]: number } = {
          'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11
        };
        
        const match = noteName.match(/([A-G])#?b?(\d+)/);
        if (!match) return 60; // Default to middle C
        
        const noteLetter = match[1];
        const octave = parseInt(match[2]);
        let semitone = noteMap[noteLetter] || 0;
        
        if (noteName.includes('#')) semitone += 1;
        if (noteName.includes('b')) semitone -= 1;
        
        return (octave + 1) * 12 + semitone;
      };

      // Helper function to convert duration to seconds
      const durationToSeconds = (duration: string, dots?: string): number => {
        const durationMap: { [key: string]: number } = {
          '1': 2.0,   // Whole note
          '2': 1.0,   // Half note
          '4': 0.5,   // Quarter note
          '8': 0.25,  // Eighth note
          '16': 0.125 // Sixteenth note
        };

        let baseDuration = durationMap[duration] || 0.5;
        
        // Apply dots
        if (dots && dots.length > 0) {
          let multiplier = 1.0;
          let addedDuration = baseDuration / 2;
          for (let i = 0; i < dots.length; i++) {
            multiplier += addedDuration / baseDuration;
            addedDuration /= 2;
          }
          baseDuration *= multiplier;
        }
        
        return baseDuration;
      };

      if (hasStaves) {
        // Process all staves - each staff gets its own track
        staves!.forEach((staff, staffIndex) => {
          if (!staff.notes || staff.notes.length === 0) return;

          // Create a new track for each staff
          const track = midi.addTrack();
          
          // Set track name if available
          if (staff.name) {
            track.name = staff.name;
          }

          let currentTime = 0;
          staff.notes.forEach((note) => {
            // Skip non-playable notes
            if (note.note_type === 'Clef' || note.note_type === 'Time' || note.pitch === 'r') {
              const duration = durationToSeconds(note.duration, note.dots);
              currentTime += duration;
              return;
            }

            const toneNote = convertLilyPondToTone(note);
            const duration = durationToSeconds(note.duration, note.dots);

            if (Array.isArray(toneNote)) {
              // Chord: add all notes
              toneNote.forEach(pitch => {
                const midiNote = noteNameToMidi(pitch);
                track.addNote({
                  midi: midiNote,
                  time: currentTime,
                  duration: duration,
                  velocity: 0.8
                });
              });
            } else if (toneNote) {
              // Single note
              const midiNote = noteNameToMidi(toneNote);
              track.addNote({
                midi: midiNote,
                time: currentTime,
                duration: duration,
                velocity: 0.8
              });
            }

            currentTime += duration;
          });
        });
      } else if (hasNotes) {
        // Process single staff
        const track = midi.addTrack();
        let currentTime = 0;
        notes!.forEach((note) => {
          // Skip non-playable notes
          if (note.note_type === 'Clef' || note.note_type === 'Time' || note.pitch === 'r') {
            const duration = durationToSeconds(note.duration, note.dots);
            currentTime += duration;
            return;
          }

          const toneNote = convertLilyPondToTone(note);
          const duration = durationToSeconds(note.duration, note.dots);

          if (Array.isArray(toneNote)) {
            // Chord: add all notes
            toneNote.forEach(pitch => {
              const midiNote = noteNameToMidi(pitch);
              track.addNote({
                midi: midiNote,
                time: currentTime,
                duration: duration,
                velocity: 0.8
              });
            });
          } else if (toneNote) {
            // Single note
            const midiNote = noteNameToMidi(toneNote);
            track.addNote({
              midi: midiNote,
              time: currentTime,
              duration: duration,
              velocity: 0.8
            });
          }

          currentTime += duration;
        });
      }

      // Generate MIDI data and download
      const midiData = midi.toArray();
      const blob = new Blob([new Uint8Array(midiData)], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `music-${selectedInstrument}-${Date.now()}.mid`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('MIDI exported successfully');
    } catch (error) {
      console.error('Error exporting MIDI:', error);
      throw error;
    }
  };

  useImperativeHandle(ref, () => ({
    play: async () => {
      if (isPlayingRef.current) return;

      try {
        if (Tone.context.state !== 'running') {
          await Tone.start();
        }

        isPlayingRef.current = true;

        if (isPausedRef.current && isInitializedRef.current) {
          isPausedRef.current = false;
          Tone.Transport.start();
          return;
        }

        // Clear existing events
        scheduledEventsRef.current.forEach(id => Tone.Transport.clear(id));
        scheduledEventsRef.current = [];
        Tone.Transport.cancel();
        Tone.Transport.stop();
        Tone.Transport.position = 0;

        // Initialize current note indices
        currentNoteIndicesRef.current.clear();

        // Determine which data structure to use
        const hasStaves = staves && staves.length > 0;
        const hasNotes = notes && notes.length > 0;

        if (hasStaves) {
          // Play multiple staves simultaneously
          const synthPromises = staves!.map(async (staff, staffIndex) => {
            if (!staff.notes || staff.notes.length === 0) return null;
            
            // Find the first real note (not Clef or Time marker)
            const firstRealNoteIndex = staff.notes.findIndex(
              note => note.note_type !== 'Clef' && note.note_type !== 'Time'
            );
            currentNoteIndicesRef.current.set(staffIndex, firstRealNoteIndex !== -1 ? firstRealNoteIndex : 0);
            const synth = await createSynthForStaff(staffIndex);
            return { staff, staffIndex, synth };
          });

          const loadedStaves = await Promise.all(synthPromises);
          
          loadedStaves.forEach((staffData) => {
            if (!staffData) return;
            const { staff, staffIndex, synth } = staffData;
            let transportTime = 0;

            if (!staff.notes) return;
            staff.notes.forEach((note, noteIndex) => {
              const toneNote = convertLilyPondToTone(note);
              const noteDuration = getDurationInSeconds(note.duration, note.dots);

              // Schedule note playback (skip rests)
              if (toneNote !== null) {
                const noteEventId = Tone.Transport.schedule((time) => {
                  if (!isPlayingRef.current) return;
                  playNote(synth, toneNote, noteDuration, time);
                }, transportTime);
                scheduledEventsRef.current.push(noteEventId);
              }

              // Schedule UI update
              const uiEventId = Tone.Transport.schedule((time) => {
                if (!isPlayingRef.current) return;
                Tone.Draw.schedule(() => {
                  if (isPlayingRef.current) {
                    currentNoteIndicesRef.current.set(staffIndex, noteIndex);
                    onNoteProgress(staffIndex, noteIndex);
                  }
                }, time);
              }, transportTime);

              scheduledEventsRef.current.push(uiEventId);
              transportTime += noteDuration;
            });
          });

          // Calculate total duration (max duration across all staves)
          const maxDuration = Math.max(
            ...staves!.map(staff =>
              (staff.notes || []).reduce((sum, note) => sum + getDurationInSeconds(note.duration, note.dots), 0)
            )
          );

          // Schedule playback end
          const endEventId = Tone.Transport.schedule((time) => {
            Tone.Draw.schedule(() => {
              isPlayingRef.current = false;
              isPausedRef.current = false;
              isInitializedRef.current = false;
              onPlaybackEnd();
            }, time);
          }, maxDuration);

          scheduledEventsRef.current.push(endEventId);
        } else if (hasNotes) {
          // Fallback: play single staff (backward compatibility)
          // Find the first real note (not Clef or Time marker)
          const firstRealNoteIndex = notes!.findIndex(
            note => note.note_type !== 'Clef' && note.note_type !== 'Time'
          );
          currentNoteIndicesRef.current.set(0, firstRealNoteIndex !== -1 ? firstRealNoteIndex : 0);
          const synth = await createSynthForStaff(0);
          let transportTime = 0;

          notes!.forEach((note, noteIndex) => {
            const toneNote = convertLilyPondToTone(note);
            const noteDuration = getDurationInSeconds(note.duration, note.dots);

            // Schedule note playback (skip rests)
            if (toneNote !== null) {
              const noteEventId = Tone.Transport.schedule((time) => {
                if (!isPlayingRef.current) return;
                playNote(synth, toneNote, noteDuration, time);
              }, transportTime);
              scheduledEventsRef.current.push(noteEventId);
            }

            const uiEventId = Tone.Transport.schedule((time) => {
              if (!isPlayingRef.current) return;
              Tone.Draw.schedule(() => {
                if (isPlayingRef.current) {
                  currentNoteIndicesRef.current.set(0, noteIndex);
                  onNoteProgress(0, noteIndex);
                }
              }, time);
            }, transportTime);

            scheduledEventsRef.current.push(uiEventId);
            transportTime += noteDuration;
          });

          const endEventId = Tone.Transport.schedule((time) => {
            Tone.Draw.schedule(() => {
              isPlayingRef.current = false;
              isPausedRef.current = false;
              isInitializedRef.current = false;
              onPlaybackEnd();
            }, time);
          }, notes!.reduce((sum, note) => sum + getDurationInSeconds(note.duration, note.dots), 0));

          scheduledEventsRef.current.push(endEventId);
        }

        isInitializedRef.current = true;
        isPausedRef.current = false;
        Tone.Transport.start();

      } catch (error) {
        console.error('Error starting playback:', error);
        isPlayingRef.current = false;
      }
    },

    pause: () => {
      isPlayingRef.current = false;
      isPausedRef.current = true;
      Tone.Transport.pause();
    },

    stop: () => {
      isPlayingRef.current = false;
      isPausedRef.current = false;
      isInitializedRef.current = false;

      scheduledEventsRef.current.forEach(id => Tone.Transport.clear(id));
      scheduledEventsRef.current = [];

      Tone.Transport.stop();
      Tone.Transport.cancel();
      Tone.Transport.position = 0;

      // Stop all synths
      synthsRef.current.forEach(synth => {
        try {
          if (synth.triggerRelease) {
            synth.triggerRelease();
          }
        } catch (error) {
          console.warn('Error stopping synth:', error);
        }
      });

      // Reset all note indices to the first real note (not Clef/Time marker)
      if (staves && staves.length > 0) {
        staves.forEach((staff, staffIndex) => {
          if (!staff.notes || staff.notes.length === 0) return;
          
          const firstRealNoteIndex = staff.notes.findIndex(
            note => note.note_type !== 'Clef' && note.note_type !== 'Time'
          );
          const resetIndex = firstRealNoteIndex !== -1 ? firstRealNoteIndex : 0;
          currentNoteIndicesRef.current.set(staffIndex, resetIndex);
          onNoteProgress(staffIndex, resetIndex);
        });
      } else if (notes && notes.length > 0) {
        const firstRealNoteIndex = notes.findIndex(
          note => note.note_type !== 'Clef' && note.note_type !== 'Time'
        );
        const resetIndex = firstRealNoteIndex !== -1 ? firstRealNoteIndex : 0;
        currentNoteIndicesRef.current.set(0, resetIndex);
        onNoteProgress(0, resetIndex);
      }
    },

    export: async (format: 'wav' | 'mp3' | 'midi' = 'wav', filename?: string) => {
      try {
        if (format === 'midi') {
          return await exportMidi(filename);
        } else {
          return await exportAudio(format, filename);
        }
      } catch (error) {
        console.error('Error exporting:', error);
        throw error;
      }
    }
  }));

  return null;
});

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;
