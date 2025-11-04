import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Flow, StaveConnector, Beam, Dot, TimeSignature, Curve, Articulation, Modifier } from 'vexflow';

type NoteType = 'Default' | 'Clef' | 'Chord' | 'Time';

interface LilyPondNote {
  pitch: string;
  duration: string;
  octave: number;
  dots: string;
  chord_notes?: Array<[string, number]>;
  clef?: string;
  time_sig?: string;  // Time signature (e.g., "4/4", "3/4")
  ottava?: number;  // Octave transposition
  arpeggio?: boolean;  // True if this note has an arpeggio marking
  note_type?: NoteType;  // Type of note: Default, Clef, Chord, Time
  group_start?: boolean;  // True if this note starts a slur group
  group_end?: boolean;  // True if this note ends a slur group
}

interface Lyric {
  text_nodes: string[];
}

interface VoiceData {
  base: {
    name?: string;
    clef?: string;
    notes: LilyPondNote[];
  };
  lyrics: Lyric[];
}

interface Staff {
  name?: string;
  clef?: string;
  notes?: LilyPondNote[];
  voices?: VoiceData[];
  lyrics?: any[];
}

interface ParsedMusic {
  title?: string;
  composer?: string;
  tempo?: string;
  key_signature?: string;
  time_signature?: string;
  notes?: LilyPondNote[];
  staves?: Staff[];
}

interface MusicNotationProps {
  musicData: ParsedMusic;
  currentNoteIndices: Map<number, number>;
  measuresPerRow?: number;
}

const MusicNotation: React.FC<MusicNotationProps> = ({ musicData, currentNoteIndices, measuresPerRow = 1 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftMargin, setLeftMargin] = React.useState(20);
  const [rightMargin, setRightMargin] = React.useState(20);
  const [containerWidth, setContainerWidth] = React.useState(800);
  const [lyricFontSize, setLyricFontSize] = React.useState(12);
  const [lyricLineSpacing, setLyricLineSpacing] = React.useState(15);

  // 监听窗口大小变化
  useEffect(() => {
    const updateContainerWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        console.log('Container width updated:', width);
        setContainerWidth(width > 0 ? width : 800);
      }
    };

    // 使用 setTimeout 确保 DOM 已经渲染
    const timer = setTimeout(() => {
      updateContainerWidth();
    }, 100);

    // 监听窗口大小变化
    window.addEventListener('resize', updateContainerWidth);
    
    // 使用 ResizeObserver 监听容器大小变化
    let resizeObserver: ResizeObserver | null = null;
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        updateContainerWidth();
      });
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateContainerWidth);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  // 监听设置更新事件
  useEffect(() => {
    const handleSettingsUpdate = (event: CustomEvent) => {
      if (event.detail.leftMargin !== undefined) {
        setLeftMargin(event.detail.leftMargin);
      }
      if (event.detail.rightMargin !== undefined) {
        setRightMargin(event.detail.rightMargin);
      }
      if (event.detail.lyricFontSize !== undefined) {
        setLyricFontSize(event.detail.lyricFontSize);
      }
      if (event.detail.lyricLineSpacing !== undefined) {
        setLyricLineSpacing(event.detail.lyricLineSpacing);
      }
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    
    // 从localStorage加载初始值
    const savedLeftMargin = localStorage.getItem('leftMargin');
    const savedRightMargin = localStorage.getItem('rightMargin');
    const savedLyricFontSize = localStorage.getItem('lyricFontSize');
    const savedLyricLineSpacing = localStorage.getItem('lyricLineSpacing');
    if (savedLeftMargin) setLeftMargin(Number(savedLeftMargin));
    if (savedRightMargin) setRightMargin(Number(savedRightMargin));
    if (savedLyricFontSize) setLyricFontSize(Number(savedLyricFontSize));
    if (savedLyricLineSpacing) setLyricLineSpacing(Number(savedLyricLineSpacing));

    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    };
  }, []);

  const drawArpeggio = (staveNote: any, ctx: any) => {
    // Draw a vertical wavy line (arpeggio) to the left of the note
    const noteHeadBounds = staveNote.getBoundingBox();
    const x = noteHeadBounds.x - 6; // Position closer to the note
    const y = noteHeadBounds.y;
    const height = noteHeadBounds.h;
    
    // Draw wavy line using bezier curves
    const waveWidth = 5;
    const waveHeight = 4;
    let currentY = y;
    
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2.5; // Thicker line
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, currentY);
    
    while (currentY < y + height) {
      // Draw a small wave
      ctx.bezierCurveTo(
        x - waveWidth, currentY,
        x - waveWidth, currentY + waveHeight,
        x, currentY + waveHeight * 2
      );
      currentY += waveHeight * 2;
    }
    ctx.stroke();
  };

  const convertLilyPondToVexFlow = (note: LilyPondNote): string => {
    // Handle rest
    if (note.pitch === 'r') {
      const durationMap: { [key: string]: string } = {
        '1': 'w',   // whole note
        '2': 'h',   // half note
        '4': 'q',   // quarter note
        '8': '8',   // eighth note
        '16': '16', // sixteenth note
      };
      const duration = durationMap[note.duration] || 'q';
      return `r/${duration}`;
    }

    // Convert LilyPond pitch to VexFlow format
    const pitchMap: { [key: string]: string } = {
      'c': 'c',
      'd': 'd',
      'e': 'e',
      'f': 'f',
      'g': 'g',
      'a': 'a',
      'b': 'b'
    };

    let pitch = pitchMap[note.pitch.charAt(0)] || 'c';
    
    // Handle accidentals (is = sharp, es = flat)
    // Note: 'b' is a note name (B), not a flat symbol
    if (note.pitch.includes('is')) {
      pitch += '#';
    } else if (note.pitch.includes('es')) {
      pitch += 'b';
    }

    // Convert octave
    const octave = note.octave;
    
    // Convert duration
    const durationMap: { [key: string]: string } = {
      '1': 'w',   // whole note
      '2': 'h',   // half note
      '4': 'q',   // quarter note
      '8': '8',   // eighth note
      '16': '16', // sixteenth note
      '32': '32' // thirty-second note
    };

    const duration = durationMap[note.duration] || 'q';

    return `${pitch}/${octave}/${duration}`;
  };

  useEffect(() => {
    console.log('MusicNotation useEffect triggered');
    console.log('musicData:', musicData);
    
    if (!containerRef.current) {
      console.log('Early return: no container');
      return;
    }

    // Check if we have staves or notes
    const hasStaves = musicData?.staves && musicData.staves.length > 0;
    const hasNotes = musicData?.notes && musicData.notes.length > 0;
    
    if (!hasStaves && !hasNotes) {
      console.log('Early return: no staves or notes');
      return;
    }

    // Clear previous content
    containerRef.current.innerHTML = '';

    const div = containerRef.current;
    const renderer = new Renderer(div, Renderer.Backends.SVG);

    try {
      if (hasStaves) {
        // Render multiple staves in parallel
        renderMultipleStaves(renderer, musicData);
      } else {
        // Fallback: render single staff with all notes
        renderSingleStaff(renderer, musicData);
      }
    } catch (error) {
      console.error('Error rendering music notation:', error);
      const context = renderer.getContext();
      context.fillText('Music notation rendering error', 50, 100);
    }

  }, [musicData, currentNoteIndices, measuresPerRow, containerWidth, leftMargin, rightMargin, lyricFontSize, lyricLineSpacing]);

  const renderMultipleStaves = (renderer: any, musicData: ParsedMusic) => {
    const staves = musicData.staves || [];
    if (staves.length === 0) return;

    const timeSignature = musicData.time_signature || '4/4';
    const [numBeats, beatValue] = timeSignature.split('/').map(Number);
    const ticksPerBeat = Flow.durationToTicks(beatValue.toString());
    const ticksPerMeasure = ticksPerBeat * numBeats;

    // Determine notes to render for each staff
    // If staff has voices, keep them separate; otherwise use staff.notes
    const staffVoicesData = staves.map((staff, staffIdx) => {
      if (staff.voices && staff.voices.length > 0) {
        // Multiple voices: keep them separate
        return {
          voices: staff.voices.map(voice => ({
            notes: voice.base.notes || [],
            lyrics: voice.lyrics || []
          })),
          hasVoices: true
        };
      } else {
        // No voices: treat staff.notes as a single voice
        return {
          voices: [{
            notes: staff.notes || [],
            lyrics: staff.lyrics || []
          }],
          hasVoices: false
        };
      }
    });

    // Convert notes for each staff and voice, tracking clef changes
    const staffVexNotes = staffVoicesData.map((staffData, staffIdx) => 
      staffData.voices.map((voiceData, voiceIdx) =>
        voiceData.notes.map((note, noteIdx) => {
        // Check if this is a clef marker
        if (note.note_type === 'Clef' && note.clef) {
          console.log(`Found clef marker at note ${noteIdx}: ${note.clef}`);
          // Return a special clef marker object
          return {
            _isClefMarker: true,
            _clefType: note.clef,
            getTicks: () => ({ value: () => 0 })  // Clef markers don't consume time
          };
        }

        // Check if this is a time signature marker
        if (note.note_type === 'Time' && note.time_sig) {
          console.log(`Found time signature marker at note ${noteIdx}: ${note.time_sig}`);
          // Return a special time signature marker object
          return {
            _isTimeSignatureMarker: true,
            _timeSignature: note.time_sig,
            getTicks: () => ({ value: () => 0 })  // Time signature markers don't consume time
          };
        }

        let staveNote: any;
        // Store clef info on the staveNote for later use
        const noteClef = note.clef;
        if (noteClef) {
          console.log(`Note ${noteIdx} has clef: ${noteClef}`);
        }
        
        if (note.note_type === 'Chord' && note.chord_notes && note.chord_notes.length > 0) {
          // Create a chord
          const durationMap: { [key: string]: string } = {
            '1': 'w',   // whole note
            '2': 'h',   // half note
            '4': 'q',   // quarter note
            '8': '8',   // eighth note
            '16': '16', // sixteenth note
            '32': '32' // thirty-second note
          };
          let duration = durationMap[note.duration] || 'q';
          // Add 'd' suffix for dotted notes (e.g., 'qd' for dotted quarter note)
          const hasDots = note.dots && note.dots.length > 0;
          if (hasDots) {
            duration += 'd'.repeat(note.dots.length);
          }
          
          // Build keys array for all notes in the chord
          const keys: string[] = [];
          
          // Add the base note
          let basePitch = note.pitch;
          if (basePitch.includes('is')) {
            basePitch = basePitch.replace('is', '#');
          } else if (basePitch.includes('es')) {
            basePitch = basePitch.replace('es', 'b');
          }
          keys.push(`${basePitch}/${note.octave}`);
          
          // Add chord notes
          for (const [chordPitch, chordOctave] of note.chord_notes) {
            let pitch = chordPitch;
            if (pitch.includes('is')) {
              pitch = pitch.replace('is', '#');
            } else if (pitch.includes('es')) {
              pitch = pitch.replace('es', 'b');
            }
            keys.push(`${pitch}/${chordOctave}`);
          }
          
          staveNote = new StaveNote({
            clef: staves[staffIdx].clef || 'treble',
            keys: keys,
            duration: duration,
            auto_stem: true  // Automatically determine stem direction
          });
          
          // Add dots explicitly for visual display
          // For chords, add dots to all notes in the chord
          if (hasDots) {
            const numDots = note.dots.length;
            for (let noteIndex = 0; noteIndex < keys.length; noteIndex++) {
              for (let dotIndex = 0; dotIndex < numDots; dotIndex++) {
                staveNote.addModifier(new Dot(), noteIndex);
              }
            }
          }
          
          // Add accidentals for the base note if needed
          if (note.pitch.includes('is')) {
            staveNote.addModifier(new Accidental('#'), 0);
          } else if (note.pitch.length > 1 && note.pitch.includes('es')) {
            staveNote.addModifier(new Accidental('b'), 0);
          }

          // Add arpeggio marking if present
          if (note.arpeggio) {
            (staveNote as any)._arpeggio = true;
          }
        } else {
          // Regular note or rest
          const vexNote = convertLilyPondToVexFlow(note);
          const parts = vexNote.split('/');
          
          if (parts[0] === 'r') {
            // Create a rest
            let duration = parts[1];
            // Add 'd' suffix for dotted notes (e.g., 'qd' for dotted quarter note)
            const hasDots = note.dots && note.dots.length > 0;
            if (hasDots) {
              duration += 'd'.repeat(note.dots.length);
            }
            staveNote = new StaveNote({
              clef: staves[staffIdx].clef || 'treble',
              keys: ['b/4'],  // Rest needs a key, but it won't be displayed
              duration: duration,
              type: 'r'  // Mark as rest
            });
            // Add dots explicitly for visual display
            if (hasDots) {
              for (let i = 0; i < note.dots.length; i++) {
                staveNote.addModifier(new Dot(), 0);
              }
            }
          } else {
            // Create a regular note
            const [pitch, octave, baseDuration] = parts;
            // Add 'd' suffix for dotted notes (e.g., 'qd' for dotted quarter note)
            let duration = baseDuration;
            const hasDots = note.dots && note.dots.length > 0;
            if (hasDots) {
              duration += 'd'.repeat(note.dots.length);
            }
            staveNote = new StaveNote({
              clef: staves[staffIdx].clef || 'treble',
              keys: [`${pitch}/${octave}`],
              duration: duration,
              auto_stem: true  // Automatically determine stem direction
            });

            // Add dots explicitly for visual display
            if (hasDots) {
              for (let i = 0; i < note.dots.length; i++) {
                staveNote.addModifier(new Dot(), 0);
              }
            }

            if (pitch.includes('#')) {
              staveNote.addModifier(new Accidental('#'), 0);
            } else if (pitch.length > 1 && pitch.includes('b')) {
              // Only add flat modifier if pitch is longer than 1 char (e.g., 'cb', 'db')
              // Single 'b' is the B note, not a flat symbol
              staveNote.addModifier(new Accidental('b'), 0);
            }
          }
        }

        // Add arpeggio marking if present
        if (note.arpeggio) {
          (staveNote as any)._arpeggio = true;
        }

        // Highlight current note for this staff
        const currentNoteForStaff = currentNoteIndices.get(staffIdx);
        if (currentNoteForStaff !== undefined && noteIdx === currentNoteForStaff) {
          staveNote.setStyle({ fillStyle: '#ff6b6b', strokeStyle: '#ff6b6b' });
        }

        // Attach clef info and slur markers to the note for later use
        (staveNote as any)._lilyPondClef = noteClef;
        (staveNote as any)._groupStart = note.group_start || false;
        (staveNote as any)._groupEnd = note.group_end || false;

        return staveNote;
        })
      )
    );

    // Split each staff's voices' notes into measures
    const staffMeasures = staffVexNotes.map(staffVoices => 
      staffVoices.map(voiceNotes => {
        const measures: any[][] = [];
        let currentMeasure: any[] = [];
        let currentTicks = 0;

        for (const note of voiceNotes) {
        // Check if this is a clef marker
        if ((note as any)._isClefMarker) {
          // If current measure is full, start a new measure with the clef marker
          if (currentTicks >= ticksPerMeasure && currentMeasure.length > 0) {
            measures.push([...currentMeasure]);
            currentMeasure = [note];
            currentTicks = 0;
          } else {
            // Add clef marker to current measure without counting ticks
            currentMeasure.push(note);
          }
          continue;
        }

        // Check if this is a time signature marker
        if ((note as any)._isTimeSignatureMarker) {
          // If current measure is full, start a new measure with the time signature marker
          if (currentTicks >= ticksPerMeasure && currentMeasure.length > 0) {
            measures.push([...currentMeasure]);
            currentMeasure = [note];
            currentTicks = 0;
          } else {
            // Add time signature marker to current measure without counting ticks
            currentMeasure.push(note);
          }
          continue;
        }

        const noteTicks = note.getTicks().value();

        // Check if adding this note would exceed the measure
        if (currentTicks + noteTicks > ticksPerMeasure && currentMeasure.length > 0) {
          // Current measure is full, start a new measure
          measures.push([...currentMeasure]);
          currentMeasure = [note];
          currentTicks = noteTicks;
        } else if (currentTicks + noteTicks === ticksPerMeasure) {
          // This note exactly fills the measure
          currentMeasure.push(note);
          measures.push([...currentMeasure]);
          currentMeasure = [];
          currentTicks = 0;
        } else {
          // Add note to current measure
          currentMeasure.push(note);
          currentTicks += noteTicks;
        }
      }

        if (currentMeasure.length > 0) {
          measures.push(currentMeasure);
        }

        return measures;
      })
    );

    // Get the maximum number of measures across all staves (all voices should have same measure count)
    const maxMeasures = Math.max(...staffMeasures.map(staffVoices => 
      Math.max(...staffVoices.map(voiceMeasures => voiceMeasures.length))
    ));

    // Calculate layout - use dynamic container width
    const marginLeft = leftMargin;
    const marginRight = rightMargin;
    const availableWidth = containerWidth - marginLeft - marginRight;
    const staveWidth = Math.floor(availableWidth / measuresPerRow);
    const staveHeight = 100;
    const staffSpacing = 30;
    const numStaves = staves.length;
    const totalStaffHeight = numStaves * staveHeight + (numStaves - 1) * staffSpacing;
    const totalRows = Math.ceil(maxMeasures / measuresPerRow);

    // Resize renderer
    renderer.resize(containerWidth, Math.max(200, totalRows * totalStaffHeight + 100));
    const context = renderer.getContext();

    // Group measures by rows
    const measureRows: number[] = [];
    for (let i = 0; i < maxMeasures; i += measuresPerRow) {
      measureRows.push(i);
    }

    // Store lyric rendering info for later (after all notes are drawn)
    const lyricRenderingInfo: Array<{
      staffIndex: number;
      voiceIdx: number;
      lyrics: any[];
      notesPerRow: Array<any[]>; // notes for each row
      rowYPositions: number[]; // Y position for each row
    }> = [];

    // Render each row
    measureRows.forEach((startMeasure, rowIndex) => {
      const endMeasure = Math.min(startMeasure + measuresPerRow, maxMeasures);
      const rowY = 40 + rowIndex * totalStaffHeight;

      // Render each staff in this row
      staves.forEach((staff, staffIndex) => {
        const staffY = rowY + staffIndex * (staveHeight + staffSpacing);
        const rowStaves: Stave[] = [];

        // Render measures for this staff
        for (let measureIdx = startMeasure; measureIdx < endMeasure; measureIdx++) {
          const colIndex = measureIdx - startMeasure;
          const x = marginLeft + colIndex * staveWidth;

          const measureStave = new Stave(x, staffY, staveWidth);

          // Check if this measure has a clef change or time signature change
          const voiceMeasures = staffMeasures[staffIndex];
          let clefToDisplay: string | null = null;
          let timeSignatureToDisplay: string | null = null;
          
          if (measureIdx === 0) {
            // First measure: always show clef
            clefToDisplay = staves[staffIndex].clef || 'treble';
          }
          
          // Check for markers in any voice (for multi-voice staves)
          for (let voiceIdx = 0; voiceIdx < voiceMeasures.length; voiceIdx++) {
            const measures = voiceMeasures[voiceIdx];
            if (measureIdx < measures.length && measures[measureIdx].length > 0) {
              // Check if there's a clef marker in this measure
              if (!clefToDisplay || measureIdx > 0) {
                const clefMarker = measures[measureIdx].find((note: any) => note._isClefMarker) as any;
                if (clefMarker) {
                  clefToDisplay = clefMarker._clefType;
                  console.log(`Measure ${measureIdx}: Found clef marker for ${clefToDisplay}`);
                }
              }

              // Check if there's a time signature marker in this measure
              if (!timeSignatureToDisplay) {
                const timeSignatureMarker = measures[measureIdx].find((note: any) => note._isTimeSignatureMarker) as any;
                if (timeSignatureMarker) {
                  timeSignatureToDisplay = timeSignatureMarker._timeSignature;
                  console.log(`Measure ${measureIdx}: Found time signature marker for ${timeSignatureToDisplay}`);
                }
              }
            }
          }

          if (clefToDisplay) {
            console.log(`Adding clef ${clefToDisplay} to measure ${measureIdx}`);
            measureStave.addClef(clefToDisplay);
          }

          if (timeSignatureToDisplay) {
            console.log(`Adding time signature ${timeSignatureToDisplay} to measure ${measureIdx}`);
            measureStave.addTimeSignature(timeSignatureToDisplay);
          }

          // Add key signature and global time signature only to the first measure (if no marker overrides it)
          if (measureIdx === 0) {
            if (musicData.key_signature) {
              try {
                measureStave.addKeySignature(musicData.key_signature);
              } catch (error) {
                console.warn('Invalid key signature:', musicData.key_signature, error);
                measureStave.addKeySignature('C');
              }
            }

            // Only add global time signature if there's no time signature marker in this measure
            if (musicData.time_signature && !timeSignatureToDisplay) {
              measureStave.addTimeSignature(musicData.time_signature);
            }
          }

          measureStave.setContext(context).draw();
          rowStaves.push(measureStave);

          // Render notes for this measure - handle multiple voices
          const staffVoices = staffMeasures[staffIndex];
          const voicesToRender: any[] = [];
          
          for (let voiceIdx = 0; voiceIdx < staffVoices.length; voiceIdx++) {
            const voiceMeasures = staffVoices[voiceIdx];
            if (measureIdx < voiceMeasures.length && voiceMeasures[measureIdx].length > 0) {
              // Filter out clef markers and time signature markers - they shouldn't be rendered as notes
              const measureNotes = voiceMeasures[measureIdx].filter((note: any) => 
                !note._isClefMarker && !note._isTimeSignatureMarker
              );
              
              if (measureNotes.length === 0) {
                // Skip if only clef markers in this measure
                continue;
              }

              let measureTicks = 0;
              measureNotes.forEach(note => {
                measureTicks += note.getTicks().value();
              });

              const actualBeats = measureTicks / ticksPerBeat;
              const voiceBeats = Math.min(actualBeats, numBeats);
              const voice = new Voice({
                num_beats: voiceBeats,
                beat_value: beatValue
              });

              voice.setMode(Voice.Mode.SOFT);
              voice.addTickables(measureNotes);
              voicesToRender.push({ voice, measureNotes });
            }
          }

          if (voicesToRender.length > 0) {
            // Calculate available width for notes
            // Reserve space for clef (if present), key signature, time signature, and padding
            let reservedWidth = 20; // Base padding
            if (measureIdx === 0 || clefToDisplay) {
              reservedWidth += 40; // Clef width
            }
            if (measureIdx === 0 && musicData.key_signature) {
              reservedWidth += 20; // Key signature width
            }
            if ((measureIdx === 0 && musicData.time_signature && !timeSignatureToDisplay) || timeSignatureToDisplay) {
              reservedWidth += 30; // Time signature width
            }
            
            const availableWidth = Math.max(staveWidth - reservedWidth, 100); // Minimum 100px for notes
            
            // Create formatter with options for better spacing
            const formatter = new Formatter();
            
            // Calculate minimum width needed based on note count
            const totalNoteCount = voicesToRender.reduce((sum, v) => sum + v.measureNotes.length, 0);
            const minWidthPerNote = 25; // Minimum pixels per note
            const idealWidth = totalNoteCount * minWidthPerNote;
            
            // Use the larger of available width or ideal width, but cap at available
            const formatWidth = Math.min(Math.max(availableWidth, idealWidth), availableWidth);
            
            // Format all voices together
            const allVoices = voicesToRender.map(v => v.voice);
            formatter.joinVoices(allVoices).format(allVoices, formatWidth);
            
            // Draw all voices and their beams/slurs
            voicesToRender.forEach(({ voice, measureNotes }) => {
              // Custom beam grouping: group consecutive beamable notes with same duration
              // Maximum 4 notes per beam group
              const beams: Beam[] = [];
              let currentGroup: any[] = [];
              let lastDuration: string | null = null;
              const MAX_BEAM_GROUP_SIZE = 4;
              
              for (let i = 0; i < measureNotes.length; i++) {
                const note = measureNotes[i];
                const duration = note.getDuration();
                
                // Check if this is a rest note
                const isRest = duration.includes('r') || note.isRest?.() || note.constructor.name === 'StaveRest';
                
                // Check if note is beamable (8th notes or shorter, not whole/half/quarter)
                const baseDuration = duration.replace(/[dr]/g, '');
                const isBeamable = ['8', '16', '32', '64'].includes(baseDuration);
                
                if (isBeamable && !isRest) {
                  // Check if this note has the same duration as the previous one
                  if (lastDuration === null || lastDuration === duration) {
                    currentGroup.push(note);
                    lastDuration = duration;
                    
                    // If group reaches max size, create beam and start new group
                    if (currentGroup.length >= MAX_BEAM_GROUP_SIZE) {
                      if (currentGroup.length >= 2) {
                        // Use autoStem=true to automatically adjust stem direction
                        beams.push(new Beam(currentGroup, true));
                      }
                      currentGroup = [];
                      lastDuration = null;
                    }
                  } else {
                    // Duration changed, end current group and start new one
                    if (currentGroup.length >= 2) {
                      // Use autoStem=true to automatically adjust stem direction
                      beams.push(new Beam(currentGroup, true));
                    }
                    currentGroup = [note];
                    lastDuration = duration;
                  }
                } else {
                  // Not beamable or is a rest, end current group
                  if (currentGroup.length >= 2) {
                    // Use autoStem=true to automatically adjust stem direction
                    beams.push(new Beam(currentGroup, true));
                  }
                  currentGroup = [];
                  lastDuration = null;
                }
              }
              
              // Don't forget the last group
              if (currentGroup.length >= 2) {
                // Use autoStem=true to automatically adjust stem direction
                beams.push(new Beam(currentGroup, true));
              }
              
              // Draw voice with beamed notes
              voice.draw(context, measureStave);
              
              // Draw beams
              beams.forEach((beam) => {
                beam.setContext(context).draw();
              });
              
              // Create and draw slurs based on group_start and group_end markers
              const slurs: Curve[] = [];
              let slurStartNote: any = null;
              
              for (let i = 0; i < measureNotes.length; i++) {
                const note = measureNotes[i];
                
                // Check if this note starts a slur group
                if ((note as any)._groupStart) {
                  slurStartNote = note;
                }
                
                // Check if this note ends a slur group
                if ((note as any)._groupEnd && slurStartNote) {
                  // Create a slur from slurStartNote to current note
                  const slur = new Curve(slurStartNote, note, {
                    cps: [
                      { x: 0, y: 10 },
                      { x: 0, y: 10 }
                    ]
                  });
                  slurs.push(slur);
                  slurStartNote = null;
                }
              }
              
              // Draw slurs
              slurs.forEach((slur) => {
                slur.setContext(context).draw();
              });

              // Draw arpeggios
              for (let i = 0; i < measureNotes.length; i++) {
                const note = measureNotes[i];
                if ((note as any)._arpeggio) {
                  drawArpeggio(note, context);
                }
              }
            });
          }
        }

        // Connect staves in the same row
        if (rowStaves.length > 1) {
          for (let i = 0; i < rowStaves.length - 1; i++) {
            const connector = new StaveConnector(rowStaves[i], rowStaves[i + 1]);
            connector.setType(StaveConnector.type.SINGLE);
            connector.setContext(context).draw();
          }
        }
      });

      // Connect staves vertically with a single brace on the left side of the row
      if (staves.length > 1) {
        const firstStaveY = rowY;
        const lastStaveY = rowY + (staves.length - 1) * (staveHeight + staffSpacing);
        
        // Create temporary staves for the brace connector at the leftmost position
        const leftStave = new Stave(marginLeft, firstStaveY, 0);
        const rightStave = new Stave(marginLeft, lastStaveY, 0);
        
        const connector = new StaveConnector(leftStave, rightStave);
        connector.setType(StaveConnector.type.BRACE);
        connector.setContext(context).draw();
      }

      // Collect lyric rendering info for this row
      staves.forEach((staff, staffIndex) => {
        const staffY = rowY + staffIndex * (staveHeight + staffSpacing);
        const lyricStartY = staffY + staveHeight + 15;
        
        const currentStaffVoices = staffVoicesData[staffIndex];
        
        currentStaffVoices.voices.forEach((voiceData: any, voiceIdx: number) => {
          const lyrics = voiceData.lyrics;
          const voiceNotes = voiceData.notes;
          
          if (lyrics && lyrics.length > 0 && voiceNotes && voiceNotes.length > 0) {
            const voiceMeasures = staffMeasures[staffIndex][voiceIdx];
            
            // Collect notes from this row
            const notesInRow: any[] = [];
            for (let measureIdx = startMeasure; measureIdx < endMeasure; measureIdx++) {
              if (measureIdx < voiceMeasures.length) {
                const measureNotes = voiceMeasures[measureIdx].filter((note: any) => 
                  !note._isClefMarker && !note._isTimeSignatureMarker
                );
                notesInRow.push(...measureNotes);
              }
            }
            
            // Find or create entry for this staff/voice
            let entry = lyricRenderingInfo.find(e => e.staffIndex === staffIndex && e.voiceIdx === voiceIdx);
            if (!entry) {
              entry = {
                staffIndex,
                voiceIdx,
                lyrics,
                notesPerRow: [],
                rowYPositions: []
              };
              lyricRenderingInfo.push(entry);
            }
            
            entry.notesPerRow.push(notesInRow);
            entry.rowYPositions.push(lyricStartY);
          }
        });
      });
    });

    // Draw lyrics after all notes are rendered
    // This allows lyrics to span across multiple rows
    lyricRenderingInfo.forEach((info) => {
      const { lyrics, notesPerRow, rowYPositions } = info;
      
      // Flatten all notes from all rows, but filter out special note types
      const allNotes: any[] = [];
      const noteToRowMap: number[] = []; // Maps note index to row index
      
      notesPerRow.forEach((notes, rowIdx) => {
        notes.forEach(note => {
          // Skip clef markers, time signature markers, and rests
          const isRest = note.isRest?.() ;
        
          if (!(note._isClefMarker || note._isTimeSignatureMarker || isRest)) {
            allNotes.push(note);
            noteToRowMap.push(rowIdx);
          }
        });
      });
      
      if (allNotes.length === 0) return;
      
      // Draw each lyric line
      lyrics.forEach((lyric: any, lyricIdx: number) => {
        if (!lyric.text_nodes || lyric.text_nodes.length === 0) return;
        
        context.fillStyle = '#000000';
        context.font = `${lyricFontSize}px Arial`;
        context.textAlign = 'center';
        
        let noteIndex = 0;
        
        // Draw each text node
        for (let textIdx = 0; textIdx < lyric.text_nodes.length; textIdx++) {
          // Skip notes that are inside a slur group (not the start)
          while (noteIndex < allNotes.length) {
            const currentNote = allNotes[noteIndex];
            // If this note is not a slur start and is inside a slur group, skip it
            if ((currentNote as any)._groupEnd && !(currentNote as any)._groupStart) {
              noteIndex++;
            } else {
              break;
            }
          }
          
          if (noteIndex >= allNotes.length) break;
          
          const textNode = lyric.text_nodes[textIdx];
          const note = allNotes[noteIndex];
          const rowIdx = noteToRowMap[noteIndex];
          
          const lyricY = rowYPositions[rowIdx] + lyricIdx * lyricLineSpacing;
          
          // Get note's x position
          let noteX = 0;
          try {
            if (typeof note.getAbsoluteX === 'function') {
              noteX = note.getAbsoluteX();
            } else if (typeof note.getX === 'function') {
              noteX = note.getX();
            } else if (note.x !== undefined) {
              noteX = note.x;
            } else {
              noteX = marginLeft + 50 + noteIndex * 30;
            }
          } catch (e) {
            noteX = marginLeft + 50 + noteIndex * 30;
          }
          
          // Draw lyric text
          context.fillText(textNode, noteX, lyricY);
          
          // Move to next note, but skip all notes inside the current slur group
          noteIndex++;
          while (noteIndex < allNotes.length) {
            const nextNote = allNotes[noteIndex];
            // If this note is inside a slur group (has group_end but not group_start), skip it
            if ((nextNote as any)._groupEnd && !(nextNote as any)._groupStart) {
              noteIndex++;
            } else {
              break;
            }
          }
        }
        
        context.textAlign = 'left';
      });
    });
  };

  const renderSingleStaff = (renderer: any, musicData: ParsedMusic) => {
    const allNotes = musicData.notes || [];
    console.log('notes length:', allNotes.length);

    if (allNotes.length === 0) return;

    renderer.resize(containerWidth, 200);
    const context = renderer.getContext();

    const allVexNotes = allNotes.map((note, index) => {
      // Check if this is a clef marker
      if (note.note_type === 'Clef' && note.clef) {
        console.log(`Found clef marker in single staff at note ${index}: ${note.clef}`);
        // Return a special clef marker object
        return {
          _isClefMarker: true,
          _clefType: note.clef,
          getTicks: () => ({ value: () => 0 })  // Clef markers don't consume time
        };
      }

      // Check if this is a time signature marker
      if (note.note_type === 'Time' && note.time_sig) {
        console.log(`Found time signature marker in single staff at note ${index}: ${note.time_sig}`);
        // Return a special time signature marker object
        return {
          _isTimeSignatureMarker: true,
          _timeSignature: note.time_sig,
          getTicks: () => ({ value: () => 0 })  // Time signature markers don't consume time
        };
      }

      let staveNote: any;
      
      if (note.note_type === 'Chord' && note.chord_notes && note.chord_notes.length > 0) {
        // Create a chord
        const durationMap: { [key: string]: string } = {
          '1': 'w',   // whole note
          '2': 'h',   // half note
          '4': 'q',   // quarter note
          '8': '8',   // eighth note
          '16': '16', // sixteenth note
        };
        let duration = durationMap[note.duration] || 'q';
        // Add 'd' suffix for dotted notes (e.g., 'qd' for dotted quarter note)
        const hasDots = note.dots && note.dots.length > 0;
        if (hasDots) {
          duration += 'd'.repeat(note.dots.length);
        }
        
        // Build keys array for all notes in the chord
        const keys: string[] = [];
        
        // Add the base note
        let basePitch = note.pitch;
        if (basePitch.includes('is')) {
          basePitch = basePitch.replace('is', '#');
        } else if (basePitch.includes('es')) {
          basePitch = basePitch.replace('es', 'b');
        }
        keys.push(`${basePitch}/${note.octave}`);
        
        // Add chord notes
        for (const [chordPitch, chordOctave] of note.chord_notes) {
          let pitch = chordPitch;
          if (pitch.includes('is')) {
            pitch = pitch.replace('is', '#');
          } else if (pitch.includes('es')) {
            pitch = pitch.replace('es', 'b');
          }
          keys.push(`${pitch}/${chordOctave}`);
        }
        
        staveNote = new StaveNote({
          clef: 'treble',
          keys: keys,
          duration: duration,
          auto_stem: true  // Automatically determine stem direction
        });
        
        // Add dots explicitly for visual display
        // For chords, add dots to all notes in the chord
        if (hasDots) {
          const numDots = note.dots.length;
          for (let noteIndex = 0; noteIndex < keys.length; noteIndex++) {
            for (let dotIndex = 0; dotIndex < numDots; dotIndex++) {
              staveNote.addModifier(new Dot(), noteIndex);
            }
          }
        }
        
        // Add accidentals for the base note if needed
        if (note.pitch.includes('is')) {
          staveNote.addModifier(new Accidental('#'), 0);
        } else if (note.pitch.length > 1 && note.pitch.includes('es')) {
          staveNote.addModifier(new Accidental('b'), 0);
        }

        // Add arpeggio marking if present
        if (note.arpeggio) {
          (staveNote as any)._arpeggio = true;
        }
      } else {
        // Regular note or rest
        const vexNote = convertLilyPondToVexFlow(note);
        const parts = vexNote.split('/');
        
        if (parts[0] === 'r') {
          // Create a rest
          let duration = parts[1];
          // Add 'd' suffix for dotted notes (e.g., 'qd' for dotted quarter note)
          const hasDots = note.dots && note.dots.length > 0;
          if (hasDots) {
            duration += 'd'.repeat(note.dots.length);
          }
          staveNote = new StaveNote({
            clef: 'treble',
            keys: ['b/4'],  // Rest needs a key, but it won't be displayed
            duration: duration,
            type: 'r'  // Mark as rest
          });
          // Add dots explicitly for visual display
          if (hasDots) {
            for (let i = 0; i < note.dots.length; i++) {
              staveNote.addModifier(new Dot(), 0);
            }
          }
        } else {
          // Create a regular note
          const [pitch, octave, baseDuration] = parts;
          // Add 'd' suffix for dotted notes (e.g., 'qd' for dotted quarter note)
          let duration = baseDuration;
          const hasDots = note.dots && note.dots.length > 0;
          if (hasDots) {
            duration += 'd'.repeat(note.dots.length);
          }
          staveNote = new StaveNote({
            clef: 'treble',
            keys: [`${pitch}/${octave}`],
            duration: duration,
            auto_stem: true  // Automatically determine stem direction
          });

          // Add dots explicitly for visual display
          if (hasDots) {
            for (let i = 0; i < note.dots.length; i++) {
              staveNote.addModifier(new Dot(), 0);
            }
          }

          if (pitch.includes('#')) {
            staveNote.addModifier(new Accidental('#'), 0);
          } else if (pitch.length > 1 && pitch.includes('b')) {
            // Only add flat modifier if pitch is longer than 1 char (e.g., 'cb', 'db')
            // Single 'b' is the B note, not a flat symbol
            staveNote.addModifier(new Accidental('b'), 0);
          }
        }
      }

      // Add arpeggio marking if present
      if (note.arpeggio) {
        (staveNote as any)._arpeggio = true;
      }

      // Highlight current note for staff 0 (single staff mode)
      const currentNoteForStaff = currentNoteIndices.get(0);
      if (currentNoteForStaff !== undefined && index === currentNoteForStaff) {
        staveNote.setStyle({ fillStyle: '#ff6b6b', strokeStyle: '#ff6b6b' });
      }

      return staveNote;
    });

    if (allVexNotes.length > 0) {
      const timeSignature = musicData.time_signature || '4/4';
      const [numBeats, beatValue] = timeSignature.split('/').map(Number);

      const ticksPerBeat = Flow.durationToTicks(beatValue.toString());
      const ticksPerMeasure = ticksPerBeat * numBeats;

      const measures: any[][] = [];
      let currentMeasure: any[] = [];
      let currentTicks = 0;

      for (const note of allVexNotes) {
        // Check if this is a clef marker
        if ((note as any)._isClefMarker) {
          // If current measure is full, start a new measure with the clef marker
          if (currentTicks >= ticksPerMeasure && currentMeasure.length > 0) {
            measures.push([...currentMeasure]);
            currentMeasure = [note];
            currentTicks = 0;
          } else {
            // Add clef marker to current measure without counting ticks
            currentMeasure.push(note);
          }
          continue;
        }

        // Check if this is a time signature marker
        if ((note as any)._isTimeSignatureMarker) {
          // If current measure is full, start a new measure with the time signature marker
          if (currentTicks >= ticksPerMeasure && currentMeasure.length > 0) {
            measures.push([...currentMeasure]);
            currentMeasure = [note];
            currentTicks = 0;
          } else {
            // Add time signature marker to current measure without counting ticks
            currentMeasure.push(note);
          }
          continue;
        }

        const noteTicks = note.getTicks().value();

        // Check if adding this note would exceed the measure
        if (currentTicks + noteTicks > ticksPerMeasure && currentMeasure.length > 0) {
          // Current measure is full, start a new measure
          measures.push([...currentMeasure]);
          currentMeasure = [note];
          currentTicks = noteTicks;
        } else if (currentTicks + noteTicks === ticksPerMeasure) {
          // This note exactly fills the measure
          currentMeasure.push(note);
          measures.push([...currentMeasure]);
          currentMeasure = [];
          currentTicks = 0;
        } else {
          // Add note to current measure
          currentMeasure.push(note);
          currentTicks += noteTicks;
        }
      }

      if (currentMeasure.length > 0) {
        measures.push(currentMeasure);
      }

      // Use dynamic container width
      const marginLeft = leftMargin;
      const marginRight = rightMargin;
      const availableWidth = containerWidth - marginLeft - marginRight;
      const staveWidth = Math.floor(availableWidth / measuresPerRow);
      const staveHeight = 120;
      const totalRows = Math.ceil(measures.length / measuresPerRow);

      renderer.resize(containerWidth, Math.max(200, totalRows * staveHeight + 100));

      const measureRows: any[][][] = [];
      for (let i = 0; i < measures.length; i += measuresPerRow) {
        measureRows.push(measures.slice(i, i + measuresPerRow));
      }

      measureRows.forEach((rowMeasures, rowIndex) => {
        const y = 40 + rowIndex * staveHeight;
        const rowStaves: Stave[] = [];

        rowMeasures.forEach((measureNotes, colIndex) => {
          const measureIndex = rowIndex * measuresPerRow + colIndex;
          const x = marginLeft + colIndex * staveWidth;

          const measureStave = new Stave(x, y, staveWidth);

          // Check for clef markers and time signature markers in this measure
          let clefToDisplay: string | null = null;
          let timeSignatureToDisplay: string | null = null;
          
          if (measureIndex === 0) {
            clefToDisplay = 'treble';
          }
          
          // Check for markers in any measure (including first)
          const clefMarker = measureNotes.find((note: any) => note._isClefMarker);
          if (clefMarker) {
            clefToDisplay = clefMarker._clefType;
            console.log(`Single staff measure ${measureIndex}: Found clef marker for ${clefToDisplay}`);
          }

          const timeSignatureMarker = measureNotes.find((note: any) => note._isTimeSignatureMarker);
          if (timeSignatureMarker) {
            timeSignatureToDisplay = timeSignatureMarker._timeSignature;
            console.log(`Single staff measure ${measureIndex}: Found time signature marker for ${timeSignatureToDisplay}`);
          }

          if (clefToDisplay) {
            measureStave.addClef(clefToDisplay);
          }

          if (timeSignatureToDisplay) {
            measureStave.addTimeSignature(timeSignatureToDisplay);
          }

          if (measureIndex === 0) {
            if (musicData.key_signature) {
              try {
                measureStave.addKeySignature(musicData.key_signature);
              } catch (error) {
                console.warn('Invalid key signature:', musicData.key_signature, error);
                measureStave.addKeySignature('C');
              }
            }

            // Only add global time signature if there's no time signature marker in this measure
            if (musicData.time_signature && !timeSignatureToDisplay) {
              measureStave.addTimeSignature(musicData.time_signature);
            }
          }

          measureStave.setContext(context).draw();
          rowStaves.push(measureStave);
        });

        if (rowStaves.length > 1) {
          for (let i = 0; i < rowStaves.length - 1; i++) {
            const connector = new StaveConnector(rowStaves[i], rowStaves[i + 1]);
            connector.setType(StaveConnector.type.SINGLE);
            connector.setContext(context).draw();
          }
        }

        rowMeasures.forEach((measureNotes, colIndex) => {
          const measureStave = rowStaves[colIndex];

          // Filter out clef markers and time signature markers - they shouldn't be rendered as notes
          const notesToRender = measureNotes.filter((note: any) => 
            !note._isClefMarker && !note._isTimeSignatureMarker
          );

          if (notesToRender.length > 0) {
            let measureTicks = 0;
            notesToRender.forEach(note => {
              measureTicks += note.getTicks().value();
            });

            const actualBeats = measureTicks / ticksPerBeat;
            const voiceBeats = Math.min(actualBeats, numBeats);
            const voice = new Voice({
              num_beats: voiceBeats,
              beat_value: beatValue
            });

            voice.setMode(Voice.Mode.SOFT);
            voice.addTickables(notesToRender);

            // Calculate available width for notes in single staff mode
            const measureIndex = rowIndex * measuresPerRow + colIndex;
            let reservedWidth = 20; // Base padding
            
            // Check if this measure has clef, key signature, or time signature
            const hasClef = measureIndex === 0 || measureNotes.some((note: any) => note._isClefMarker);
            const hasKeySignature = measureIndex === 0 && musicData.key_signature;
            const hasTimeSignature = (measureIndex === 0 && musicData.time_signature) || 
                                     measureNotes.some((note: any) => note._isTimeSignatureMarker);
            
            if (hasClef) reservedWidth += 40;
            if (hasKeySignature) reservedWidth += 20;
            if (hasTimeSignature) reservedWidth += 30;
            
            const availableWidth = Math.max(staveWidth - reservedWidth, 100);
            
            // Create formatter with options for better spacing
            const formatter = new Formatter();
            
            // Calculate minimum width needed based on note count
            const noteCount = notesToRender.length;
            const minWidthPerNote = 25; // Minimum pixels per note
            const idealWidth = noteCount * minWidthPerNote;
            
            // Use available width, ensuring notes don't get too cramped
            const formatWidth = Math.max(availableWidth, Math.min(idealWidth, availableWidth));
            
            formatter.joinVoices([voice]).format([voice], formatWidth);
            
            // Draw voice and its beams/slurs
            {
              // Custom beam grouping: group consecutive beamable notes with same duration
              // Maximum 4 notes per beam group
              const beams: Beam[] = [];
              let currentGroup: any[] = [];
              let lastDuration: string | null = null;
              const MAX_BEAM_GROUP_SIZE = 4;
              
              for (let i = 0; i < notesToRender.length; i++) {
                const note = notesToRender[i];
                const duration = note.getDuration();
                
                // Check if this is a rest note
                const isRest = duration.includes('r') || note.isRest?.() || note.constructor.name === 'StaveRest';
                
                // Check if note is beamable (8th notes or shorter, not whole/half/quarter)
                const baseDuration = duration.replace(/[dr]/g, '');
                const isBeamable = ['8', '16', '32', '64'].includes(baseDuration);
                
                if (isBeamable && !isRest) {
                  // Check if this note has the same duration as the previous one
                  if (lastDuration === null || lastDuration === duration) {
                    currentGroup.push(note);
                    lastDuration = duration;
                    
                    // If group reaches max size, create beam and start new group
                    if (currentGroup.length >= MAX_BEAM_GROUP_SIZE) {
                      if (currentGroup.length >= 2) {
                        // Use autoStem=true to automatically adjust stem direction
                        beams.push(new Beam(currentGroup, true));
                      }
                      currentGroup = [];
                      lastDuration = null;
                    }
                  } else {
                    // Duration changed, end current group and start new one
                    if (currentGroup.length >= 2) {
                      // Use autoStem=true to automatically adjust stem direction
                      beams.push(new Beam(currentGroup, true));
                    }
                    currentGroup = [note];
                    lastDuration = duration;
                  }
                } else {
                  // Not beamable or is a rest, end current group
                  if (currentGroup.length >= 2) {
                    // Use autoStem=true to automatically adjust stem direction
                    beams.push(new Beam(currentGroup, true));
                  }
                  currentGroup = [];
                  lastDuration = null;
                }
              }
              
              // Don't forget the last group
              if (currentGroup.length >= 2) {
                // Use autoStem=true to automatically adjust stem direction
                beams.push(new Beam(currentGroup, true));
              }
              
              // Draw voice with beamed notes
              voice.draw(context, measureStave);
              
              // Draw beams
              beams.forEach((beam) => {
                beam.setContext(context).draw();
              });
              
              // Create and draw slurs based on group_start and group_end markers
              const slurs: Curve[] = [];
              let slurStartNote: any = null;
              
              for (let i = 0; i < notesToRender.length; i++) {
                const note = notesToRender[i];
                
                // Check if this note starts a slur group
                if ((note as any)._groupStart) {
                  slurStartNote = note;
                }
                
                // Check if this note ends a slur group
                if ((note as any)._groupEnd && slurStartNote) {
                  // Create a slur from slurStartNote to current note
                  const slur = new Curve(slurStartNote, note, {
                    cps: [
                      { x: 0, y: 10 },
                      { x: 0, y: 10 }
                    ]
                  });
                  slurs.push(slur);
                  slurStartNote = null;
                }
              }
              
              // Draw slurs
              slurs.forEach((slur) => {
                slur.setContext(context).draw();
              });

              // Draw arpeggios
              for (let i = 0; i < measureNotes.length; i++) {
                const note = measureNotes[i];
                if ((note as any)._arpeggio) {
                  drawArpeggio(note, context);
                }
              }
            }
          }
        });
      });
    }
  };

  // Calculate display notes, considering voices
  const displayNotes = musicData?.staves?.flatMap(staff => {
    if (staff.voices && staff.voices.length > 0) {
      // If staff has voices, collect notes from all voices
      return staff.voices.flatMap(voice => voice.base.notes || []);
    } else {
      // Otherwise use staff.notes
      return staff.notes || [];
    }
  }) || musicData?.notes || [];
  
  const staffCount = musicData?.staves?.length || 0;
  
  // Build status string showing current note for each staff
  const statusParts: string[] = [];
  if (staffCount > 0) {
    musicData?.staves?.forEach((staff, idx) => {
      const currentNote = currentNoteIndices.get(idx);
      const staffName = staff.name || `Staff ${idx + 1}`;
      
      // Calculate total notes for this staff
      let totalNotes = 0;
      if (staff.voices && staff.voices.length > 0) {
        totalNotes = staff.voices.reduce((sum, voice) => sum + (voice.base.notes?.length || 0), 0);
      } else {
        totalNotes = staff.notes?.length || 0;
      }
      
      if (currentNote !== undefined && totalNotes > 0) {
        statusParts.push(`${staffName}: ${currentNote + 1}/${totalNotes}`);
      }
    });
  }
  
  return (
    <div className="music-notation">
      <div ref={containerRef} className="notation-canvas"></div>
      {displayNotes.length > 0 && (
        <p className="notation-note">
          {staffCount > 0 
            ? `${staffCount} staff(s) • ${displayNotes.length} notes • ${statusParts.length > 0 ? statusParts.join(' | ') : 'Ready to play'}`
            : `Displaying complete score with ${displayNotes.length} notes`
          }
        </p>
      )}
    </div>
  );
};

export default MusicNotation;