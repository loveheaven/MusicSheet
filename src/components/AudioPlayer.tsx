import React, { useImperativeHandle, forwardRef, useRef, useEffect } from 'react';
import * as Tone from 'tone';

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
}

const AudioPlayer = forwardRef<any, AudioPlayerProps>(({ notes, staves, onNoteProgress, onPlaybackEnd }, ref) => {
  const synthsRef = useRef<Map<number, Tone.Synth>>(new Map());
  const isPlayingRef = useRef(false);
  const scheduledEventsRef = useRef<number[]>([]);
  const isPausedRef = useRef(false);
  const isInitializedRef = useRef(false);
  const currentNoteIndicesRef = useRef<Map<number, number>>(new Map());

  // Reset player state when notes or staves change (new music loaded)
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
  }, [notes, staves]);

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

  const createSynthForStaff = (staffIndex: number): Tone.Synth => {
    if (synthsRef.current.has(staffIndex)) {
      return synthsRef.current.get(staffIndex)!;
    }

    const synth = new Tone.Synth({
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

    synthsRef.current.set(staffIndex, synth);
    return synth;
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
          staves!.forEach((staff, staffIndex) => {
            if (!staff.notes || staff.notes.length === 0) return;
            
            // Find the first real note (not Clef or Time marker)
            const firstRealNoteIndex = staff.notes.findIndex(
              note => note.note_type !== 'Clef' && note.note_type !== 'Time'
            );
            currentNoteIndicesRef.current.set(staffIndex, firstRealNoteIndex !== -1 ? firstRealNoteIndex : 0);
            const synth = createSynthForStaff(staffIndex);
            let transportTime = 0;

            staff.notes.forEach((note, noteIndex) => {
              const toneNote = convertLilyPondToTone(note);
              const noteDuration = getDurationInSeconds(note.duration, note.dots);

              // Schedule note playback (skip rests)
              if (toneNote !== null) {
                const noteEventId = Tone.Transport.schedule((time) => {
                  if (!isPlayingRef.current) return;
                  if (Array.isArray(toneNote)) {
                    // Chord: play all notes simultaneously
                    toneNote.forEach(pitch => {
                      synth.triggerAttackRelease(pitch, noteDuration, time);
                    });
                  } else {
                    // Single note
                    synth.triggerAttackRelease(toneNote, noteDuration, time);
                  }
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
          const synth = createSynthForStaff(0);
          let transportTime = 0;

          notes!.forEach((note, noteIndex) => {
            const toneNote = convertLilyPondToTone(note);
            const noteDuration = getDurationInSeconds(note.duration, note.dots);

            // Schedule note playback (skip rests)
            if (toneNote !== null) {
              const noteEventId = Tone.Transport.schedule((time) => {
                if (!isPlayingRef.current) return;
                if (Array.isArray(toneNote)) {
                  // Chord: play all notes simultaneously
                  toneNote.forEach(pitch => {
                    synth.triggerAttackRelease(pitch, noteDuration, time);
                  });
                } else {
                  // Single note
                  synth.triggerAttackRelease(toneNote, noteDuration, time);
                }
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
        synth.triggerRelease();
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

      onPlaybackEnd();
    }
  }));

  return null;
});

AudioPlayer.displayName = 'AudioPlayer';

export default AudioPlayer;
