import { useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { Midi } from '@tonejs/midi';
import { durationToSecondsMap } from '../utils/musicMaps';
import type { LilyPondNote, Staff } from '../utils/musicMaps';

// Helper function to check if a note is non-playable (metadata or rest)
const isNonPlayableNote = (note: LilyPondNote): boolean => {
  return note.note_type === 'Clef' || note.note_type === 'Time' 
  || note.note_type === 'RepeatStart' || note.note_type === 'RepeatEnd'
  || note.note_type === 'AlternativeStart' || note.note_type === 'AlternativeEnd'
  || note.note_type === 'Key' || note.note_type === 'Ottava';
};

// Helper function to process notes with repeat volta logic
const processNotesWithRepeatVolta = (allNotes: LilyPondNote[]): { note: LilyPondNote; transportTime: number; originalIndex: number }[] => {
  const processedNotes: { note: LilyPondNote; transportTime: number }[] = [];
  
  // RepeatContext: tracks state for each repeat block
  interface RepeatContext {
    startIndex: number;
    repeatTimes: number;
    currentIteration: number;
    hasAlternatives: boolean;
    firstAlternativeIdx: number;
    lastAlternativeIdx: number;
  }
  
  const repeatStack: RepeatContext[] = [];
  let idx = 0;
  let transportTime = 0;

  const getDurationInSeconds = (duration: string, dots?: string): number => {
    const durationToSecondsMap: { [key: string]: number } = {
      '1': 4, '2': 2, '4': 1, '8': 0.5, '16': 0.25, '32': 0.125, '64': 0.0625,
    };
    let baseDuration = durationToSecondsMap[duration] || 0.5;
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

  // Helper: find matching RepeatEnd for a RepeatStart
  const findMatchingRepeatEnd = (startIdx: number): number => {
    let nestedCount = 0;
    for (let i = startIdx + 1; i < allNotes.length; i++) {
      if (allNotes[i].note_type === 'RepeatStart') nestedCount++;
      if (allNotes[i].note_type === 'RepeatEnd') {
        if (nestedCount === 0) return i;
        nestedCount--;
      }
    }
    return -1;
  };

  // Helper: find first AlternativeStart after a given index
  const findFirstAlternativeStart = (startIdx: number, repeatEndIdx: number): number => {
    for (let i = startIdx; i <= repeatEndIdx; i++) {
      if (allNotes[i].note_type === 'AlternativeStart') return i;
    }
    return -1;
  };

  // Helper: find matching AlternativeEnd for an AlternativeStart
  const findMatchingAlternativeEnd = (startIdx: number): number => {
    let nestedCount = 0;
    for (let i = startIdx + 1; i < allNotes.length; i++) {
      if (allNotes[i].note_type === 'AlternativeStart') nestedCount++;
      if (allNotes[i].note_type === 'AlternativeEnd') {
        if (nestedCount === 0) return i;
        nestedCount--;
      }
    }
    return -1;
  };

  while (idx < allNotes.length) {
    const note = allNotes[idx];

    // Handle RepeatStart
    if (note.note_type === 'RepeatStart') {
      const repeatEndIdx = findMatchingRepeatEnd(idx);
      
      if (repeatEndIdx !== -1) {
        const repeatEndNote = allNotes[repeatEndIdx];
        const repeatTimes = (repeatEndNote as any)?.repeat_times || 2;
        const firstAltIdx = findFirstAlternativeStart(idx + 1, repeatEndIdx);
        const hasAlternatives = firstAltIdx !== -1;
        
        const context: RepeatContext = {
          startIndex: idx + 1,
          repeatTimes,
          currentIteration: 0,
          hasAlternatives,
          firstAlternativeIdx: firstAltIdx,
          lastAlternativeIdx: repeatEndIdx,
        };
        
        repeatStack.push(context);
        console.log(`[processNotesWithRepeatVolta] RepeatStart at ${idx}, times=${repeatTimes}, hasAlternatives=${hasAlternatives}`);
      }
    }

    // Handle AlternativeStart
    if (note.note_type === 'AlternativeStart') {
      const alternativeIndex = (note as any)?.alternative_index || [];
      const repeatCtx = repeatStack[repeatStack.length - 1];
      const currentIter = repeatCtx ? repeatCtx.currentIteration : 0;

      // currentIteration is 0-based, alternativeIndex is 1-based
      // So iteration 0 corresponds to alternativeIndex [1], iteration 1 to [2], etc.
      const shouldPlay = alternativeIndex.includes(currentIter + 1);

      console.log(`[processNotesWithRepeatVolta] AlternativeStart at ${idx}, alternativeIndex=${alternativeIndex}, currentIter=${currentIter}, shouldPlay=${shouldPlay}`);

      if (!shouldPlay) {
        // Skip until matching AlternativeEnd
        const altEndIdx = findMatchingAlternativeEnd(idx);
        if (altEndIdx !== -1) {
          idx = altEndIdx;
        }
      }
    }

    // Handle AlternativeEnd
    if (note.note_type === 'AlternativeEnd') {
      processedNotes.push({ note, transportTime, originalIndex: idx });
      
      const repeatCtx = repeatStack[repeatStack.length - 1];
      if (repeatCtx) {
        // Increment iteration counter
        repeatCtx.currentIteration++;
        console.log(`[processNotesWithRepeatVolta] AlternativeEnd at ${idx}, newIteration=${repeatCtx.currentIteration}, maxTimes=${repeatCtx.repeatTimes}`);
        
        if (repeatCtx.currentIteration < repeatCtx.repeatTimes) {
          // Jump back to repeat start
          console.log(`[processNotesWithRepeatVolta] Jumping back to ${repeatCtx.startIndex}`);
          idx = repeatCtx.startIndex - 1; // -1 because idx++ at end of loop
        } else {
          // Repeat finished, pop from stack
          console.log(`[processNotesWithRepeatVolta] Repeat finished`);
          repeatStack.pop();
        }
      }
      idx++;
      continue;
    }

    // Handle RepeatEnd (only if no alternatives)
    if (note.note_type === 'RepeatEnd') {
      processedNotes.push({ note, transportTime, originalIndex: idx });
      
      const repeatCtx = repeatStack[repeatStack.length - 1];
      if (repeatCtx && !repeatCtx.hasAlternatives) {
        // Increment iteration counter
        repeatCtx.currentIteration++;
        console.log(`[processNotesWithRepeatVolta] RepeatEnd at ${idx}, newIteration=${repeatCtx.currentIteration}, maxTimes=${repeatCtx.repeatTimes}`);
        
        if (repeatCtx.currentIteration < repeatCtx.repeatTimes) {
          // Jump back to repeat start
          console.log(`[processNotesWithRepeatVolta] Jumping back to ${repeatCtx.startIndex}`);
          idx = repeatCtx.startIndex - 1;
        } else {
          // Repeat finished, pop from stack
          console.log(`[processNotesWithRepeatVolta] Repeat finished`);
          repeatStack.pop();
        }
      }
      idx++;
      continue;
    }

    // Regular note or non-playable marker
    if (!isNonPlayableNote(note)) {
      const duration = getDurationInSeconds(note.duration, note.dots);
      processedNotes.push({ note, transportTime, originalIndex: idx });
      transportTime += duration;
    } else {
      // Non-playable notes still get added with their index for tracking
      processedNotes.push({ note, transportTime, originalIndex: idx });
    }

    idx++;
  }

  return processedNotes;
};

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

interface AudioPlayerProps {
  staves?: Staff[];
  onNoteProgress: (staffIndex: number, noteIndex: number) => void;
  onPlaybackEnd: () => void;
  selectedInstrument?: string;
  staffInstruments?: Map<number, string>;
  staffVolumes?: Map<number, boolean>;
  tempo?: number;
}

const AudioPlayer = forwardRef<any, AudioPlayerProps>(({ staves, onNoteProgress, onPlaybackEnd, selectedInstrument = 'piano', staffInstruments = new Map(), staffVolumes = new Map(), tempo = 1.0 }, ref) => {
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
  }, [ staves, selectedInstrument, staffInstruments]);

  const convertLilyPondToTone = (note: LilyPondNote): string | string[] | null => {
    // Handle rest (both regular rest 'r' and multi-measure rest 'R')
    if (note.pitch === 'r' || note.pitch === 'R') {
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
    let baseDuration = durationToSecondsMap[duration] || 0.5;
    
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
    
    // Apply tempo: divide by tempo (e.g., 2x tempo = half duration)
    return baseDuration / tempo;
  };

  const createSynthForStaff = async (staffIndex: number): Promise<Tone.Sampler | Tone.Synth> => {
    if (synthsRef.current.has(staffIndex)) {
      return synthsRef.current.get(staffIndex)!;
    }

    let synth: Tone.Sampler | Tone.Synth;

    // Get the instrument for this staff, or use the global selected instrument
    const instrument = staffInstruments.get(staffIndex) || selectedInstrument;
    
    // Check if we have samples for the selected instrument
    const instrumentSamples = INSTRUMENT_SAMPLES[instrument as keyof typeof INSTRUMENT_SAMPLES];
    
    if (instrumentSamples) {
      try {
        // Ensure Tone context is running
        if (Tone.context.state !== 'running') {
          await Tone.start();
        }
        
        console.log(`Loading ${instrument} samples for staff ${staffIndex}...`);
        
        // Create Tone.Sampler with the instrument samples
        synth = await new Promise<Tone.Sampler>((resolve, reject) => {
          const sampler = new Tone.Sampler({
            urls: instrumentSamples,
            baseUrl: `/tonejs-instruments/samples/${instrument}/`,
            onload: () => {
              console.log(`${instrument} loaded successfully for staff ${staffIndex}`);
              resolve(sampler);
            },
            onerror: (error) => {
              console.error(`Error loading ${instrument} for staff ${staffIndex}:`, error);
              reject(error);
            }
          }).toDestination();
          
          // Timeout fallback
          setTimeout(() => {
            console.log(`${instrument} loaded via timeout fallback for staff ${staffIndex}`);
            resolve(sampler);
          }, 5000);
        });
        
        console.log(`Successfully created ${instrument} sampler for staff ${staffIndex}`);
      } catch (error) {
        console.warn(`Failed to load instrument ${instrument} for staff ${staffIndex}, falling back to synth:`, error);
        synth = createFallbackSynth();
      }
    } else {
      // Fallback to basic synth for unsupported instruments
      console.log(`No samples available for ${instrument}, using fallback synth for staff ${staffIndex}`);
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

  const playNote = (synth: Tone.Sampler | Tone.Synth, pitch: string | string[], duration: number, time: number, volume: boolean = true) => {
    // If volume is off, don't play the note
    if (!volume) {
      return;
    }
    
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

      let totalDuration = 0;

      const hasStaves = staves && staves.length > 0;
      if (!hasStaves) {
        return;
      }

      
      // Play multiple staves simultaneously
      const synthPromises = staves!.map(async (staff, staffIndex) => {
        // Check if staff has voices or measures
        const hasVoices = staff.voices && staff.voices.length > 0;
        const hasMeasures = staff.measures && staff.measures.length > 0;
        
        if (!hasVoices && !hasMeasures) return null;
        const synth = await createSynthForStaff(staffIndex);
        return { staff, staffIndex, synth };
      });

      const loadedStaves = await Promise.all(synthPromises);
      
      loadedStaves.forEach((staffData) => {
        if (!staffData) return;
        const { staff, staffIndex, synth } = staffData;
        const staffVolume = staffVolumes.get(staffIndex) ?? true;

        // Check if staff has voices or measures
        const hasVoices = staff.voices && staff.voices.length > 0;
        const hasMeasures = staff.measures && staff.measures.length > 0;

        if (hasVoices) {
          // Play all voices in this staff simultaneously
          staff.voices!.forEach((voice) => {
            // Iterate through all notes in all measures using indices to fetch actual notes
            const measureIndices = voice.measures?.flatMap(measure => measure.notes) || [];
            const allNotes = measureIndices.map(idx => voice.base.notes[idx]).filter(note => note !== undefined);
            
            // Process notes with repeat volta logic
            const processedNotes = processNotesWithRepeatVolta(allNotes);
            
            processedNotes.forEach(({ note, transportTime }) => {
              // Skip non-playable notes
              if (isNonPlayableNote(note)) {
                return;
              }

              const toneNote = convertLilyPondToTone(note);
              const noteDuration = getDurationInSeconds(note.duration, note.dots);

              // Schedule note playback
              if (toneNote !== null) {
                const noteEventId = Tone.Transport.schedule((time) => {
                  playNote(synth, toneNote, noteDuration, time, staffVolume);
                }, transportTime);
                scheduledEventsRef.current.push(noteEventId);
              }
            });

            // Calculate total duration after repeat volta processing
            let voiceDuration = 0;
            processedNotes.forEach(({ note, transportTime }) => {
              if (!isNonPlayableNote(note)) {
                voiceDuration = Math.max(voiceDuration, transportTime + getDurationInSeconds(note.duration, note.dots));
              }
            });
            totalDuration = Math.max(totalDuration, voiceDuration);
          });
        } else if (hasMeasures) {
          // Play notes from staff.measures using indices to fetch actual notes
          const measureIndices = staff.measures.flatMap(measure => measure.notes);
          const allNotes = measureIndices.map(idx => staff.notes![idx]).filter(note => note !== undefined);
          
          // Process notes with repeat volta logic
          const processedNotes = processNotesWithRepeatVolta(allNotes);
          
          processedNotes.forEach(({ note, transportTime }) => {
            // Skip non-playable notes
            if (isNonPlayableNote(note)) {
              return;
            }

            const toneNote = convertLilyPondToTone(note);
            const noteDuration = getDurationInSeconds(note.duration, note.dots);

            // Schedule note playback
            if (toneNote !== null) {
              const noteEventId = Tone.Transport.schedule((time) => {
                playNote(synth, toneNote, noteDuration, time, staffVolume);
              }, transportTime);
              scheduledEventsRef.current.push(noteEventId);
            }
          });

          // Calculate total duration after repeat volta processing
          let staffDuration = 0;
          processedNotes.forEach(({ note, transportTime }) => {
            if (!isNonPlayableNote(note)) {
              staffDuration = Math.max(staffDuration, transportTime + getDurationInSeconds(note.duration, note.dots));
            }
          });
          totalDuration = Math.max(totalDuration, staffDuration);
        }
      });
      

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
            
      const hasStaves = staves && staves.length > 0;
      if (!hasStaves) {
        return;
      }


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
        let baseDuration = durationToSecondsMap[duration] || 0.5;
        
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

      // Process all staves
      staves!.forEach((staff, staffIndex) => {
        // Check if staff has voices or measures
        const hasVoices = staff.voices && staff.voices.length > 0;
        const hasMeasures = staff.measures && staff.measures.length > 0;
        
        if (!hasVoices && !hasMeasures) return;

        const staffVolume = staffVolumes.get(staffIndex) ?? true;

        if (hasVoices) {
          // Process all voices in this staff
          staff.voices!.forEach((voice, voiceIdx) => {
            // Create a new track for each voice
            const track = midi.addTrack();
            
            // Set track name if available
            if (staff.name && voice.base.name) {
              track.name = `${staff.name} - ${voice.base.name}`;
            } else if (staff.name) {
              track.name = `${staff.name} - Voice ${voiceIdx + 1}`;
            } else if (voice.base.name) {
              track.name = voice.base.name;
            }

            // Iterate through all notes in all measures using indices to fetch actual notes
            const measureIndices = voice.measures?.flatMap(measure => measure.notes) || [];
            const allNotes = measureIndices.map(idx => voice.base.notes[idx]).filter(note => note !== undefined);
            
            // Process notes with repeat volta logic
            const processedNotes = processNotesWithRepeatVolta(allNotes);
            
            processedNotes.forEach(({ note, transportTime }) => {
              // Skip non-playable metadata notes (Clef, Time, Key, etc.)
              if (isNonPlayableNote(note)) {
                return;
              }
              
              // Handle rest - advance time but don't add note
              if (note.pitch === 'r' || note.pitch === 'R') {
                return;
              }

              // Skip if volume is off
              if (!staffVolume) {
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
                    time: transportTime,
                    duration: duration,
                    velocity: 0.8
                  });
                });
              } else if (toneNote) {
                // Single note
                const midiNote = noteNameToMidi(toneNote);
                track.addNote({
                  midi: midiNote,
                  time: transportTime,
                  duration: duration,
                  velocity: 0.8
                });
              }
            });
          });
        } else if (hasMeasures) {
          // Process staff.measures
          // Create a new track for each staff
          const track = midi.addTrack();
          
          // Set track name if available
          if (staff.name) {
            track.name = staff.name;
          }

          const measureIndices = staff.measures.flatMap(measure => measure.notes);
          const allNotes = measureIndices.map(idx => staff.notes![idx]).filter(note => note !== undefined);
          
          // Process notes with repeat volta logic
          const processedNotes = processNotesWithRepeatVolta(allNotes);
          
          processedNotes.forEach(({ note, transportTime }) => {
            // Skip non-playable metadata notes (Clef, Time, Key, etc.)
            if (isNonPlayableNote(note)) {
              return;
            }
            
            // Handle rest - advance time but don't add note
            if (note.pitch === 'r' || note.pitch === 'R') {
              return;
            }

            // Skip if volume is off
            if (!staffVolume) {
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
                  time: transportTime,
                  duration: duration,
                  velocity: 0.8
                });
              });
            } else if (toneNote) {
              // Single note
              const midiNote = noteNameToMidi(toneNote);
              track.addNote({
                midi: midiNote,
                time: transportTime,
                duration: duration,
                velocity: 0.8
              });
            }
          });
        }
      });
    

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
        if (!hasStaves) {
          return;
        }

      
        // Play multiple staves simultaneously
        const synthPromises = staves!.map(async (staff, staffIndex) => {
          // Check if staff has voices or measures
          const hasVoices = staff.voices && staff.voices.length > 0;
          const hasMeasures = staff.measures && staff.measures.length > 0;
          
          if (!hasVoices && !hasMeasures) return null;
          
          // Find the first real note (not Clef or Time marker) in complete note list
          let firstRealNoteIndex = -1;
          if (hasVoices) {
            // For voices, find first real note in first voice using complete note list
            const firstVoice = staff.voices![0];
            const completeNotes = firstVoice.base.notes || [];
            firstRealNoteIndex = completeNotes.findIndex(
              note => !isNonPlayableNote(note)
            );
          } else if (hasMeasures) {
            // For regular measures, find first real note in complete note list
            const completeNotes = staff.notes || [];
            firstRealNoteIndex = completeNotes.findIndex(
              note => !isNonPlayableNote(note)
            );
          }
          
          // Set initial highlight to first real note
          const initialIndex = firstRealNoteIndex !== -1 ? firstRealNoteIndex : 0;
          currentNoteIndicesRef.current.set(staffIndex, initialIndex);
          onNoteProgress(staffIndex, initialIndex);
          
          const synth = await createSynthForStaff(staffIndex);
          return { staff, staffIndex, synth };
        });

        const loadedStaves = await Promise.all(synthPromises);
        
        loadedStaves.forEach((staffData) => {
          if (!staffData) return;
          const { staff, staffIndex, synth } = staffData;
          const staffVolume = staffVolumes.get(staffIndex) ?? true;

          // Check if staff has voices or measures
          const hasVoices = staff.voices && staff.voices.length > 0;
          const hasMeasures = staff.measures && staff.measures.length > 0;

          if (hasVoices) {
            // Play all voices in this staff simultaneously
            let maxVoiceDuration = 0;
            staff.voices!.forEach((voice, voiceIdx) => {
              // Iterate through all notes in all measures using indices
              const measureIndices = voice.measures?.flatMap(measure => measure.notes) || [];
              const allNotes = measureIndices.map(idx => voice.base.notes[idx]).filter(note => note !== undefined);
              
              // Process notes with repeat volta logic
              const processedNotes = processNotesWithRepeatVolta(allNotes);
              
              let maxNoteDuration = 0;
              processedNotes.forEach(({ note, transportTime, originalIndex }) => {
                const noteDuration = getDurationInSeconds(note.duration, note.dots);
                
                // Skip non-playable notes (but still update time for UI sync)
                if (isNonPlayableNote(note)) {
                  // Don't play or highlight, but time still advances
                  return;
                }

                const toneNote = convertLilyPondToTone(note);

                // Schedule note playback
                if (toneNote !== null) {
                  const noteEventId = Tone.Transport.schedule((time) => {
                    if (!isPlayingRef.current) return;
                    playNote(synth, toneNote, noteDuration, time, staffVolume);
                  }, transportTime);
                  scheduledEventsRef.current.push(noteEventId);
                }

                // Schedule UI update for the first voice (to show highlight)
                // Update UI slightly BEFORE the audio starts to avoid visual lag
                if (voiceIdx === 0) {
                  const uiEventId = Tone.Transport.schedule((time) => {
                    if (!isPlayingRef.current) return;
                    Tone.Draw.schedule(() => {
                      if (isPlayingRef.current) {
                        currentNoteIndicesRef.current.set(staffIndex, originalIndex);
                        onNoteProgress(staffIndex, originalIndex);
                      }
                    }, time);
                  }, Math.max(0, transportTime - 0.05)); // Update UI 50ms before audio
                  scheduledEventsRef.current.push(uiEventId);
                }

                maxNoteDuration = Math.max(maxNoteDuration, transportTime + noteDuration);
              });
              maxVoiceDuration = Math.max(maxVoiceDuration, maxNoteDuration);
            });
          } else if (hasMeasures) {
            // Play notes from staff.measures using indices
            const measureIndices = staff.measures.flatMap(measure => measure.notes);
            const allNotes = measureIndices.map(idx => staff.notes![idx]).filter(note => note !== undefined);
            
            // Process notes with repeat volta logic
            const processedNotes = processNotesWithRepeatVolta(allNotes);
            
            processedNotes.forEach(({ note, transportTime, originalIndex }) => {
              const noteDuration = getDurationInSeconds(note.duration, note.dots);
              
              // Skip non-playable notes (but still update time for UI sync)
              if (isNonPlayableNote(note)) {
                // Don't play or highlight, but time still advances
                return;
              }

              const toneNote = convertLilyPondToTone(note);

              // Schedule note playback
              if (toneNote !== null) {
                const noteEventId = Tone.Transport.schedule((time) => {
                  if (!isPlayingRef.current) return;
                  playNote(synth, toneNote, noteDuration, time, staffVolume);
                }, transportTime);
                scheduledEventsRef.current.push(noteEventId);
              }

              // Schedule UI update
              // Update UI slightly BEFORE the audio starts to avoid visual lag
              const uiEventId = Tone.Transport.schedule((time) => {
                if (!isPlayingRef.current) return;
                Tone.Draw.schedule(() => {
                  if (isPlayingRef.current) {
                    currentNoteIndicesRef.current.set(staffIndex, originalIndex);
                    onNoteProgress(staffIndex, originalIndex);
                  }
                }, time);
              }, Math.max(0, transportTime - 0.05)); // Update UI 50ms before audio

              scheduledEventsRef.current.push(uiEventId);
            });
          }
        });

        // Calculate total duration (max duration across all staves)
        let maxDuration = 0;
        staves!.forEach(staff => {
          if (staff.voices && staff.voices.length > 0) {
            // For multi-voice staves, get max duration across all voices
            const staffMaxDuration = Math.max(
              ...staff.voices.map(voice => {
                const measureIndices = voice.measures?.flatMap(measure => measure.notes) || [];
                const allNotes = measureIndices.map(idx => voice.base.notes[idx]).filter(note => note !== undefined);
                return allNotes.reduce((sum, note) => {
                  if (isNonPlayableNote(note)) return sum;
                  return sum + getDurationInSeconds(note.duration, note.dots);
                }, 0);
              })
            );
            maxDuration = Math.max(maxDuration, staffMaxDuration);
          } else if (staff.measures) {
            // For single-measure staves using indices
            const measureIndices = staff.measures.flatMap(measure => measure.notes);
            const allNotes = measureIndices.map(idx => staff.notes![idx]).filter(note => note !== undefined);
            const staffDuration = allNotes.reduce((sum, note) => {
              if (isNonPlayableNote(note)) return sum;
              return sum + getDurationInSeconds(note.duration, note.dots);
            }, 0);
            maxDuration = Math.max(maxDuration, staffDuration);
          }
        });

        // Schedule playback end
        const endEventId = Tone.Transport.schedule((time) => {
          Tone.Draw.schedule(() => {
            isPlayingRef.current = false;
            isPausedRef.current = false;
            isInitializedRef.current = false;
            
            // Reset all note indices to the first real note
            staves!.forEach((staff, staffIndex) => {
              let firstRealNoteIndex = -1;
              
              if (staff.voices && staff.voices.length > 0) {
                const firstVoice = staff.voices[0];
                const measureIndices = firstVoice.measures?.flatMap(measure => measure.notes) || [];
                const allNotes = measureIndices.map(idx => firstVoice.base.notes[idx]).filter(note => note !== undefined);
                firstRealNoteIndex = allNotes.findIndex(
                  note => !isNonPlayableNote(note)
                );
              } else if (staff.measures && staff.measures.length > 0) {
                const measureIndices = staff.measures.flatMap(measure => measure.notes);
                const allNotes = measureIndices.map(idx => staff.notes![idx]).filter(note => note !== undefined);
                firstRealNoteIndex = allNotes.findIndex(
                  note => !isNonPlayableNote(note)
                );
              }
              
              const resetIndex = firstRealNoteIndex !== -1 ? firstRealNoteIndex : 0;
              currentNoteIndicesRef.current.set(staffIndex, resetIndex);
              onNoteProgress(staffIndex, resetIndex);
            });
            
            onPlaybackEnd();
          }, time);
        }, maxDuration);

        scheduledEventsRef.current.push(endEventId);
        

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
            synth.triggerRelease('+0');
          }
        } catch (error) {
          console.warn('Error stopping synth:', error);
        }
      });

      // Reset all note indices to the first real note (not Clef/Time marker)
      if (staves && staves.length > 0) {
        staves.forEach((staff, staffIndex) => {
          let firstRealNoteIndex = -1;
          
          // Check if staff has voices
          if (staff.voices && staff.voices.length > 0) {
            // For voices, find first real note in first voice using complete note list
            const firstVoice = staff.voices[0];
            const completeNotes = firstVoice.base.notes || [];
            firstRealNoteIndex = completeNotes.findIndex(
              note => !isNonPlayableNote(note)
            );
          } else if (staff.measures && staff.measures.length > 0) {
            // For regular measures, find first real note in complete note list
            const completeNotes = staff.notes || [];
            firstRealNoteIndex = completeNotes.findIndex(
              note => !isNonPlayableNote(note)
            );
          }
          
          const resetIndex = firstRealNoteIndex !== -1 ? firstRealNoteIndex : 0;
          currentNoteIndicesRef.current.set(staffIndex, resetIndex);
          onNoteProgress(staffIndex, resetIndex);
        });
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
