import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Flow, StaveConnector, Beam, Dot, Curve } from 'vexflow';
import { durationMap, pitchMap, jianpuMap, vexFlowDurationMap } from '../utils/musicMaps';
import type { LilyPondNote, Lyric, VoiceData, Staff, ParsedMusic } from '../utils/musicMaps';

interface MusicNotationProps {
  musicData: ParsedMusic;
  currentNoteIndices: Map<number, number>;
  measuresPerRow?: number;
  showJianpu?: boolean;
}

const MusicNotation: React.FC<MusicNotationProps> = ({ musicData, currentNoteIndices, measuresPerRow = 1, showJianpu = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftMargin, setLeftMargin] = React.useState(20);
  const [rightMargin, setRightMargin] = React.useState(20);
  const [containerWidth, setContainerWidth] = React.useState(800);
  const [lyricFontSize, setLyricFontSize] = React.useState(12);
  const [lyricLineSpacing, setLyricLineSpacing] = React.useState(15);
  const [pianoStaffSpacing, setPianoStaffSpacing] = React.useState(30);
  const [pianoSystemSpacing, setPianoSystemSpacing] = React.useState(30);

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
      if (event.detail.pianoStaffSpacing !== undefined) {
        setPianoStaffSpacing(event.detail.pianoStaffSpacing);
      }
      if (event.detail.pianoSystemSpacing !== undefined) {
        setPianoSystemSpacing(event.detail.pianoSystemSpacing);
      }
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate as EventListener);
    
    // 从localStorage加载初始值
    const savedLeftMargin = localStorage.getItem('leftMargin');
    const savedRightMargin = localStorage.getItem('rightMargin');
    const savedLyricFontSize = localStorage.getItem('lyricFontSize');
    const savedLyricLineSpacing = localStorage.getItem('lyricLineSpacing');
    const savedPianoStaffSpacing = localStorage.getItem('pianoStaffSpacing');
    const savedPianoSystemSpacing = localStorage.getItem('pianoSystemSpacing');
    if (savedLeftMargin) setLeftMargin(Number(savedLeftMargin));
    if (savedRightMargin) setRightMargin(Number(savedRightMargin));
    if (savedLyricFontSize) setLyricFontSize(Number(savedLyricFontSize));
    if (savedLyricLineSpacing) setLyricLineSpacing(Number(savedLyricLineSpacing));
    if (savedPianoStaffSpacing) setPianoStaffSpacing(Number(savedPianoStaffSpacing));
    if (savedPianoSystemSpacing) setPianoSystemSpacing(Number(savedPianoSystemSpacing));

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
  /**
   * Convert VexFlow note to Jianpu (simplified notation) information
   * Extracts information directly from the VexFlow StaveNote object
   * @param note - VexFlow StaveNote object
   * @returns Jianpu notation information including number, octave dots, duration lines, and duration dots
   */
  const convertNoteToJianpu = (note: any): { 
    number: string; 
    dotsAbove: number; 
    dotsBelow: number; 
    durationLines: number; 
    linesAfter: number; 
    hasDots: boolean;
  } => {
    // Extract information from VexFlow StaveNote
    // StaveNote has properties: keys (array of pitch/octave strings), duration (string)
    
    // Check if it's a rest
    const isRest = note.duration.includes('r') || note.isRest?.() || note.constructor.name === 'StaveRest';
    
    if (isRest) {
      // Parse duration from VexFlow format (e.g., "qr", "hr", "wr")
      const durationStr = note.duration || 'q';
      const baseDuration = parseDurationFromVexFlow(durationStr);
      const durationLines = getDurationLines(baseDuration);
      
      // Check if rest has duration dots
      let hasDots = false;
      if (note.modifiers && Array.isArray(note.modifiers)) {
        hasDots = note.modifiers.some((mod: any) => 
          mod.constructor.name === '_Dot' || mod.getCategory?.() === 'dots'
        );
      }
      if(hasDots && parseInt(baseDuration) === 2) {
        hasDots = false;
      }
      
      return { 
        number: '0', 
        dotsAbove: 0, 
        dotsBelow: 0, 
        durationLines, 
        linesAfter: 0, 
        hasDots 
      };
    }

    // Get the first key (for chords, we use the base note)
    const key = note.keys && note.keys.length > 0 ? note.keys[0] : 'c/4';
    
    // Parse key format: "pitch/octave" (e.g., "c/4", "d#/5", "eb/3")
    const keyParts = key.split('/');
    const pitchStr = keyParts[0] || 'c';
    const octave = parseInt(keyParts[1] || '4');
    
    // Extract base pitch (c, d, e, f, g, a, b)
    const basePitch = pitchStr.charAt(0).toLowerCase();
    
    // Get jianpu number (1-7)
    let jianpu = jianpuMap[basePitch] || '1';
    
    // Handle accidentals (# or b)
    // Note: Check from index 1 onwards to avoid confusing 'b' pitch with 'b' flat
    const accidental = pitchStr.substring(1);
    if (accidental.includes('#')) {
      jianpu += '#'; // Sharp
    } else if (accidental.includes('b')) {
      jianpu += 'b'; // Flat
    }

    // Calculate octave indicators (dots above/below the number)
    // C4-B4 is the middle octave (no dots)
    // C5-B5: 1 dot above
    // C6-B6: 2 dots above
    // C3-B3: 1 dot below
    // C2-B2: 2 dots below
    let dotsAbove = 0;
    let dotsBelow = 0;
    
    if (octave > 4) {
      dotsAbove = octave - 4;
    } else if (octave < 4) {
      dotsBelow = 4 - octave;
    }

    // Parse duration from VexFlow format (e.g., "q", "h", "w", "8", "16", "qd", "hd")
    const durationStr = note.duration || 'q';
    const baseDuration = parseDurationFromVexFlow(durationStr);
    
    // Calculate duration lines (下加线)
    const durationLines = getDurationLines(baseDuration);
    
    // Check if note has duration dots (附点)
    // VexFlow stores dots as modifiers, count Dot instances
    let hasDots = false;
    if (note.modifiers && Array.isArray(note.modifiers)) {
      hasDots = note.modifiers.some((mod: any) => 
        mod.constructor.name === '_Dot' || mod.getCategory?.() === 'dots'
      );
    }
    
    // Calculate lines after for whole/half notes
    const linesAfter = getLinesAfter(baseDuration, hasDots);
    if(hasDots && parseInt(baseDuration) === 2) {
      hasDots = false;
    }
    if(jianpu === '7') {
      console.log('jianpu', jianpu, hasDots, linesAfter, durationLines, durationStr);
    }
    return { 
      number: jianpu, 
      dotsAbove, 
      dotsBelow, 
      durationLines, 
      linesAfter, 
      hasDots 
    };
  };

  const dotVerticalSpacing = 5;
  /**
   * Draw Jianpu (simplified notation) for a set of notes
   * @param context - Canvas rendering context
   * @param notes - Array of VexFlow notes to draw jianpu for
   * @param lilypondNotes - Array of corresponding LilyPond notes
   * @param noteToRowMap - Maps note index to row index
   * @param maxNoteBottomPerRow - Array of maximum note bottom Y positions per row
   */
  const drawJianpuForNotes = (
    context: any,
    notes: any[],
    noteToRowMap: number[],
    jianpuInfos: Map<any, ReturnType<typeof convertNoteToJianpu>>,
    maxJianpuBottomPerRow: number[]
  ) => {
    context.fillStyle = '#0066cc';
    context.font = `${lyricFontSize}px Arial`;
    context.textAlign = 'center';
    

    // Second pass: draw jianpu notation
    for (let noteIndex = 0; noteIndex < notes.length; noteIndex++) {
      const note = notes[noteIndex];
      const rowIdx = noteToRowMap[noteIndex];
      
      
      // Get jianpu Y position based on the lowest note in this row
      const jianpuY = maxJianpuBottomPerRow[rowIdx];
      
      // Get note's x position directly from VexFlow note
      let noteX = 0;
      try {
        if (typeof note.getAbsoluteX === 'function') {
          noteX = note.getAbsoluteX();
        } else if (typeof note.getX === 'function') {
          noteX = note.getX();
        } else if (note.x !== undefined) {
          noteX = note.x;
        }
      } catch (e) {
        // Ignore errors
      }
      
      // Get jianpuInfo from Map using note object as key
      const jianpuInfo = jianpuInfos.get(note);
      if (!jianpuInfo) continue; // Skip if no jianpu info found
      
      // Draw jianpu number (with center alignment)
      context.textAlign = 'center';
      context.fillText(jianpuInfo.number, noteX, jianpuY);
      
      // Measure the text width to position elements correctly
      const textMetrics = context.measureText(jianpuInfo.number);
      const textWidth = textMetrics.width;
      const textHeight = lyricFontSize; // Use font size as approximate height
      
      // Draw octave dots above (stacked vertically above the number)
      if (jianpuInfo.dotsAbove > 0) {
        const dotRadius = 2;
        
        for (let i = 0; i < jianpuInfo.dotsAbove; i++) {
          const dotX = noteX + textWidth / 2;
          const dotY = jianpuY - textHeight - i * dotVerticalSpacing;
          context.beginPath();
          context.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
          context.fill();
        }
      }
      
      var lineY = jianpuY;
      // Draw duration lines (下加线) for 8th, 16th, 32nd notes
      if (jianpuInfo.durationLines > 0) {
        context.strokeStyle = '#0066cc';
        context.lineWidth = 1;
        
        const lineLength = textWidth * 1.2; // Line length is 80% of number width
        const lineSpacing = 3; // Spacing between lines
        const startY = jianpuY + 3; // Start below the number
        
        for (let i = 0; i < jianpuInfo.durationLines; i++) {
          lineY = startY + i * lineSpacing;
          context.beginPath();
          context.moveTo(noteX + (textWidth - lineLength)/2, lineY);
          context.lineTo(noteX + (lineLength + textWidth)/2 , lineY);
          context.stroke();
        }
      }

      // Draw octave dots below (stacked vertically below the number)
      if (jianpuInfo.dotsBelow > 0) {
        const dotRadius = 2;
        const startY = lineY;
        for (let i = 0; i < jianpuInfo.dotsBelow; i++) {
          const dotX = noteX + textWidth / 2;
          lineY = startY + 3 + i * dotVerticalSpacing;
          context.beginPath();
          context.arc(dotX, lineY, dotRadius, 0, Math.PI * 2);
          context.fill();
        }
      }
      

      // Draw line after for whole notes (全音符延长线)
      if (jianpuInfo.linesAfter > 0) {
        context.strokeStyle = '#0066cc';
        context.lineWidth = 1;
        
        const lineLength = textWidth; // Slightly longer than the number
        const lineY = jianpuY - textHeight / 2 + 3;
        for (let i = 0; i < jianpuInfo.linesAfter; i++) {
          
          context.beginPath();
          context.moveTo(noteX + textWidth + i * lineLength + 2, lineY);
          context.lineTo(noteX + textWidth + (i + 1) * lineLength  , lineY);
          context.stroke();
        }
      }

      // Draw duration dots (附点) to the right of the number
      if (jianpuInfo.hasDots) {
        const dotRadius = 2;
        const dotX = noteX + textWidth  + 4;
        const dotY = jianpuY - 3; // Slightly above the baseline
        context.beginPath();
        context.arc(dotX, dotY, dotRadius, 0, Math.PI * 2);
        context.fill();
      }
    }
    
    context.textAlign = 'left';
  };

  /**
   * Create and configure a measure stave with clef, key signature, and time signature
   * @param x - X position of the stave
   * @param y - Y position of the stave
   * @param width - Width of the stave
   * @param measureIndex - Index of the measure (0-based)
   * @param allMeasureNotes - All notes in this measure (can be array of arrays for multi-voice)
   * @param defaultClef - Default clef to use if no marker found
   * @param context - Canvas rendering context
   * @returns Object with stave and marker information
   */
  const createMeasureStave = (
    x: number,
    y: number,
    width: number,
    measureIndex: number,
    allMeasureNotes: any[] | any[][],
    defaultClef: string,
    context: any
  ): { stave: Stave; clefToDisplay: string | null; timeSignatureToDisplay: string | null } => {
    const measureStave = new Stave(x, y, width);
    
    // Check for clef markers and time signature markers in this measure
    let clefToDisplay: string | null = null;
    let timeSignatureToDisplay: string | null = null;
    
    if (measureIndex === 0) {
      clefToDisplay = defaultClef;
    }
    
    // Flatten notes if it's a multi-voice array
    const flattenedNotes: any[] = [];
    if (Array.isArray(allMeasureNotes)) {
      if (allMeasureNotes.length > 0 && Array.isArray(allMeasureNotes[0])) {
        // Multi-voice: flatten all voices
        for (const voiceNotes of allMeasureNotes as any[][]) {
          flattenedNotes.push(...voiceNotes);
        }
      } else {
        // Single voice: use as is
        flattenedNotes.push(...(allMeasureNotes as any[]));
      }
    }
    
    // Check for markers in the measure notes
    const clefMarker = flattenedNotes.find((note: any) => note._isClefMarker);
    if (clefMarker) {
      clefToDisplay = clefMarker._clefType;
      console.log(`Measure ${measureIndex}: Found clef marker for ${clefToDisplay}`);
    }
    
    const timeSignatureMarker = flattenedNotes.find((note: any) => note._isTimeSignatureMarker);
    if (timeSignatureMarker) {
      timeSignatureToDisplay = timeSignatureMarker._timeSignature;
      console.log(`Measure ${measureIndex}: Found time signature marker for ${timeSignatureToDisplay}`);
    }
    
    // Add clef if needed
    if (clefToDisplay) {
      measureStave.addClef(clefToDisplay);
    }
    
    // Add time signature if needed
    if (timeSignatureToDisplay) {
      measureStave.addTimeSignature(timeSignatureToDisplay);
    }
    
    // Add key signature and global time signature only to the first measure
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
    return { stave: measureStave, clefToDisplay, timeSignatureToDisplay };
  };

  /**
   * Create a VexFlow note from a LilyPond note
   * @param note - LilyPond note object
   * @param clef - Clef to use for this note
   * @param noteIndex - Index of the note (for highlighting)
   * @param staffIndex - Index of the staff (for highlighting)
   * @returns VexFlow StaveNote or marker object
   */
  const createVexFlowNote = (
    note: LilyPondNote,
    clef: string,
    noteIndex: number,
    staffIndex: number
  ): any => {
    // Check if this is a clef marker
    if (note.note_type === 'Clef' && note.clef) {
      console.log(`Found clef marker at note ${noteIndex}: ${note.clef}`);
      return {
        _isClefMarker: true,
        _clefType: note.clef,
        getTicks: () => ({ value: () => 0 })
      };
    }

    // Check if this is a time signature marker
    if (note.note_type === 'Time' && note.time_sig) {
      console.log(`Found time signature marker at note ${noteIndex}: ${note.time_sig}`);
      return {
        _isTimeSignatureMarker: true,
        _timeSignature: note.time_sig,
        getTicks: () => ({ value: () => 0 })
      };
    }

    let staveNote: any;
    const noteClef = note.clef;
    
    if (note.note_type === 'Chord' && note.chord_notes && note.chord_notes.length > 0) {
      // Create a chord
      let duration = durationMap[note.duration] || 'q';
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
        clef: clef,
        keys: keys,
        duration: duration,
        auto_stem: true
      });
      
      // Add dots explicitly for visual display
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
        const hasDots = note.dots && note.dots.length > 0;
        if (hasDots) {
          duration += 'd'.repeat(note.dots.length);
        }
        staveNote = new StaveNote({
          clef: clef,
          keys: ['b/4'],
          duration: duration,
          type: 'r'
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
        let duration = baseDuration;
        const hasDots = note.dots && note.dots.length > 0;
        if (hasDots) {
          duration += 'd'.repeat(note.dots.length);
        }
        staveNote = new StaveNote({
          clef: clef,
          keys: [`${pitch}/${octave}`],
          duration: duration,
          auto_stem: true
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
          staveNote.addModifier(new Accidental('b'), 0);
        }
      }
    }

    // Add arpeggio marking if present
    if (note.arpeggio) {
      (staveNote as any)._arpeggio = true;
    }

    // Highlight current note for this staff
    const currentNoteForStaff = currentNoteIndices.get(staffIndex);
    if (currentNoteForStaff !== undefined && noteIndex === currentNoteForStaff) {
      staveNote.setStyle({ fillStyle: '#ff6b6b', strokeStyle: '#ff6b6b' });
    }

    // Attach clef info and slur markers to the note for later use
    (staveNote as any)._lilyPondClef = noteClef;
    (staveNote as any)._groupStart = note.group_start || false;
    (staveNote as any)._groupEnd = note.group_end || false;

    return staveNote;
  };

  /**
   * Draw a single voice with its beams, slurs, and arpeggios
   * @param context - Canvas rendering context
   * @param voice - VexFlow Voice object
   * @param measureStave - Stave to draw on
   * @param measureNotes - Array of notes in this voice
   */
  const drawVoiceWithDecorations = (
    context: any,
    voice: Voice,
    measureStave: Stave,
    measureNotes: any[]
  ) => {
    // Create beams using common function
    const beams = createBeamsForNotes(measureNotes);
    
    // Draw voice with beamed notes
    voice.draw(context, measureStave);
    
    // Draw beams
    beams.forEach((beam) => {
      beam.setContext(context).draw();
    });
    
    // Draw slurs using common function
    drawSlursForNotes(context, measureNotes);

    // Draw arpeggios
    for (let i = 0; i < measureNotes.length; i++) {
      const note = measureNotes[i];
      if ((note as any)._arpeggio) {
        drawArpeggio(note, context);
      }
    }
  };

  /**
   * Create beams for a set of notes based on duration grouping
   * @param notes - Array of VexFlow notes to create beams for
   * @returns Array of Beam objects
   */
  const createBeamsForNotes = (notes: any[]): Beam[] => {
    const beams: Beam[] = [];
    let currentGroup: any[] = [];
    let lastDuration: string | null = null;
    const MAX_BEAM_GROUP_SIZE = 4;
    
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
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
              beams.push(new Beam(currentGroup, true));
            }
            currentGroup = [];
            lastDuration = null;
          }
        } else {
          // Duration changed, end current group and start new one
          if (currentGroup.length >= 2) {
            beams.push(new Beam(currentGroup, true));
          }
          currentGroup = [note];
          lastDuration = duration;
        }
      } else {
        // Not beamable or is a rest, end current group
        if (currentGroup.length >= 2) {
          beams.push(new Beam(currentGroup, true));
        }
        currentGroup = [];
        lastDuration = null;
      }
    }
    
    // Don't forget the last group
    if (currentGroup.length >= 2) {
      beams.push(new Beam(currentGroup, true));
    }
    
    return beams;
  };

  /**
   * Draw slurs (curved lines) for a set of notes based on group markers
   * @param context - Canvas rendering context
   * @param notes - Array of VexFlow notes to draw slurs for
   */
  const drawSlursForNotes = (context: any, notes: any[]) => {
    const slurs: Curve[] = [];
    let slurStartNote: any = null;
    
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      
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
  };

  /**
   * Draw lyrics for a set of notes
   * @param context - Canvas rendering context
   * @param lyrics - Array of lyric objects with text_nodes
   * @param notes - Array of VexFlow notes to align lyrics with
   * @param noteToRowMap - Maps note index to row index
   * @param maxNoteBottomPerRow - Array of maximum note bottom Y positions per row
   */
  const drawLyricsForNotes = (
    context: any,
    lyrics: any[],
    notes: any[],
    noteToRowMap: number[],
    maxNoteBottomPerRow: number[]
  ) => {
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
        while (noteIndex < notes.length) {
          const currentNote = notes[noteIndex];
          // If this note is not a slur start and is inside a slur group, skip it
          if ((currentNote as any)._groupEnd && !(currentNote as any)._groupStart) {
            noteIndex++;
          } else {
            break;
          }
        }
        
        // Skip rests (休止符)
        while (noteIndex < notes.length) {
          const currentNote = notes[noteIndex];
          const isRest = currentNote.duration?.includes('r') || 
                        currentNote.isRest?.() || 
                        currentNote.constructor.name === 'StaveRest';
          if (isRest) {
            noteIndex++;
          } else {
            break;
          }
        }
        
        if (noteIndex >= notes.length) break;
        
        const textNode = lyric.text_nodes[textIdx];
        const note = notes[noteIndex];
        const rowIdx = noteToRowMap[noteIndex];
        
        // Calculate lyric Y for this row
        // If jianpu is shown, lyrics go below jianpu
        // If jianpu is not shown, lyrics use the same base position as jianpu would
        const lyricBaseY = showJianpu ? maxNoteBottomPerRow[rowIdx] + lyricFontSize + 5 : maxNoteBottomPerRow[rowIdx];
        const lyricY = lyricBaseY + lyricIdx * lyricLineSpacing;
        
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
            noteX = leftMargin + 50 + noteIndex * 30;
          }
        } catch (e) {
          noteX = leftMargin + 50 + noteIndex * 30;
        }
        
        // Draw lyric text
        context.fillText(textNode, noteX, lyricY);
        
        // Move to next note, but skip all notes inside the current slur group
        noteIndex++;
        while (noteIndex < notes.length) {
          const nextNote = notes[noteIndex];
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
  };

  /**
   * Parse VexFlow duration format to numeric duration
   * VexFlow format: "w" (whole), "h" (half), "q" (quarter), "8" (eighth), "16" (sixteenth), "32" (thirty-second)
   * May include "d" suffix for dotted notes (e.g., "qd", "hd")
   * May include "r" suffix for rests (e.g., "qr", "hr")
   */
  const parseDurationFromVexFlow = (vexDuration: string): string => {
    // Remove 'd' (dot) and 'r' (rest) suffixes
    const cleanDuration = vexDuration.replace(/[dr]/g, '');
    
    // Map VexFlow duration to numeric duration using imported map
    return vexFlowDurationMap[cleanDuration] || '4'; // Default to quarter note
  };

  /**
   * Get number of duration lines (下加线) for a given duration
   * These are short lines drawn below notes shorter than quarter notes
   */
  const getDurationLines = (duration: string): number => {
    const dur = parseInt(duration);
    if (dur >= 8 && dur < 16) return 1;  // 8th note: 1 line
    if (dur >= 16 && dur < 32) return 2; // 16th note: 2 lines
    if (dur >= 32) return 3;             // 32nd note: 3 lines
    return 0;                            // Quarter note or longer: no lines
  };

  /**
   * Get number of lines after the number for whole/half notes
   * Whole note: 3 line after (to distinguish from quarter note)
   */
  const getLinesAfter = (duration: string, hasDots: boolean): number => {
    const dur = parseInt(duration);
    if (dur === 1) return 3;  // Whole note: 1 line below
    if (dur === 2) {
      if (hasDots) return 2; else return 1;
    }
    if (dur === 4) return 0; 
    return 0;                 // All other durations: no line below
  };

  const convertLilyPondToVexFlow = (note: LilyPondNote): string => {
    // Handle rest
    if (note.pitch === 'r') {
      const duration = durationMap[note.duration] || 'q';
      return `r/${duration}`;
    }

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

    // Check if we have staves
    const hasStaves = musicData?.staves && musicData.staves.length > 0;
    
    if (!hasStaves) {
      console.log('Early return: no staves');
      return;
    }

    // Clear previous content
    containerRef.current.innerHTML = '';

    const div = containerRef.current;
    const renderer = new Renderer(div, Renderer.Backends.SVG);

    try {
      // Render multiple staves in parallel
      renderMultipleStaves(renderer, musicData);
    } catch (error) {
      console.error('Error rendering music notation:', error);
      const context = renderer.getContext();
      context.fillText('Music notation rendering error', 50, 100);
    }

  }, [musicData, currentNoteIndices, measuresPerRow, containerWidth, leftMargin, rightMargin, lyricFontSize, lyricLineSpacing, showJianpu, pianoStaffSpacing, pianoSystemSpacing]);

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
        voiceData.notes.map((note, noteIdx) => 
          createVexFlowNote(note, staves[staffIdx].clef || 'treble', noteIdx, staffIdx)
        )
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
    const staffSpacing = pianoStaffSpacing; // 使用设置中的钢琴谱内部行间距
    const systemSpacing = pianoSystemSpacing; // 使用设置中的钢琴谱系统间距
    const numStaves = staves.length;
    const totalStaffHeight = numStaves * staveHeight + (numStaves - 1) * staffSpacing;
    const totalRows = Math.ceil(maxMeasures / measuresPerRow);

    // Resize renderer
    renderer.resize(containerWidth, Math.max(200, totalRows * (totalStaffHeight + systemSpacing) + 100));
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
      jianpuYPositions: number[]; // Y position for jianpu
    }> = [];

    // Render each row
    measureRows.forEach((startMeasure, rowIndex) => {
      const endMeasure = Math.min(startMeasure + measuresPerRow, maxMeasures);
      const rowY = 40 + rowIndex * (totalStaffHeight + systemSpacing);

      // Render each staff in this row
      staves.forEach((staff, staffIndex) => {
        const staffY = rowY + staffIndex * (staveHeight + staffSpacing);
        const rowStaves: Stave[] = [];

        // Render measures for this staff
        for (let measureIdx = startMeasure; measureIdx < endMeasure; measureIdx++) {
          const colIndex = measureIdx - startMeasure;
          const x = marginLeft + colIndex * staveWidth;

          // Collect all notes from all voices for this measure
          const voiceMeasures = staffMeasures[staffIndex];
          const allVoiceNotesForMeasure: any[][] = [];
          for (let voiceIdx = 0; voiceIdx < voiceMeasures.length; voiceIdx++) {
            const measures = voiceMeasures[voiceIdx];
            if (measureIdx < measures.length && measures[measureIdx].length > 0) {
              allVoiceNotesForMeasure.push(measures[measureIdx]);
            }
          }

          // Create measure stave using common function
          const { stave: measureStave, clefToDisplay, timeSignatureToDisplay } = createMeasureStave(
            x,
            staffY,
            staveWidth,
            measureIdx,
            allVoiceNotesForMeasure,
            staves[staffIndex].clef || 'treble',
            context
          );
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
              drawVoiceWithDecorations(context, voice, measureStave, measureNotes);
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

      // Collect lyric and jianpu rendering info for this row
      staves.forEach((staff, staffIndex) => {
        const staffY = rowY + staffIndex * (staveHeight + staffSpacing);
        const lyricStartY = staffY + staveHeight + 15;
        const jianpuY = staffY + staveHeight + 5; // Jianpu between staff and lyrics
        
        const currentStaffVoices = staffVoicesData[staffIndex];
        
        currentStaffVoices.voices.forEach((voiceData: any, voiceIdx: number) => {
          const lyrics = voiceData.lyrics;
          const voiceNotes = voiceData.notes;
          
          // Collect notes from this row (for both lyrics and jianpu)
          const notesInRow: any[] = [];
          for (let measureIdx = startMeasure; measureIdx < endMeasure; measureIdx++) {
            const voiceMeasures = staffMeasures[staffIndex][voiceIdx];
            if (measureIdx < voiceMeasures.length) {
              const measureNotes = voiceMeasures[measureIdx].filter((note: any) => 
                !note._isClefMarker && !note._isTimeSignatureMarker
              );
              notesInRow.push(...measureNotes);
            }
          }
          
          // Create entry for this staff/voice (for both lyrics and jianpu)
          if (notesInRow.length > 0 && (lyrics.length > 0 || showJianpu)) {
            let entry = lyricRenderingInfo.find(e => e.staffIndex === staffIndex && e.voiceIdx === voiceIdx);
            if (!entry) {
              entry = {
                staffIndex,
                voiceIdx,
                lyrics,
                notesPerRow: [],
                rowYPositions: [],
                jianpuYPositions: []
              };
              lyricRenderingInfo.push(entry);
            }
            
            entry.notesPerRow.push(notesInRow);
            entry.rowYPositions.push(lyricStartY);
            entry.jianpuYPositions.push(jianpuY);
          }
        });
      });
    });

    // Draw lyrics after all notes are rendered
    // This allows lyrics to span across multiple rows
    lyricRenderingInfo.forEach((info) => {
      const { lyrics, notesPerRow, rowYPositions, staffIndex } = info;
      
      // Flatten all notes from all rows, but filter out special note types
      const allNotes: any[] = [];
      const noteToRowMap: number[] = []; // Maps note index to row index
      
      notesPerRow.forEach((notes, rowIdx) => {
        notes.forEach(note => {
          // Skip clef markers, time signature markers, and rests                
          if (!(note._isClefMarker || note._isTimeSignatureMarker )) {
            allNotes.push(note);
            noteToRowMap.push(rowIdx);
          }
        });
      });
      
      if (allNotes.length === 0) return;
      
      // Calculate the lowest point of notes for each row separately
      // This is used to position jianpu and lyrics below the notes
      const jianpuPadding = lyricFontSize + 3;
      var maxNoteBottomPerRow: number[] = [];
      
      for (let rowIdx = 0; rowIdx < notesPerRow.length; rowIdx++) {
        let maxNoteBottom = 0;
        for (const note of notesPerRow[rowIdx]) {
          try {
            if (typeof note.getBoundingBox === 'function') {
              const bbox = note.getBoundingBox();
              if (bbox && bbox.y !== undefined && bbox.h !== undefined) {
                const noteBottom = bbox.y + bbox.h;
                maxNoteBottom = Math.max(maxNoteBottom, noteBottom);
              }
            }
          } catch (e) {
            // Ignore errors getting bounding box
          }
        }
        maxNoteBottomPerRow[rowIdx] = maxNoteBottom > 0 ? maxNoteBottom + jianpuPadding : rowYPositions[rowIdx] + staveHeight + 5;        
      }
      
      
      // Draw jianpu (simplified notation) if enabled
      if (showJianpu) {
        const maxJianpuBottomPerRow: number[] = [];
        const maxLyricsBottomPerRow: number[] = [];

        // Use Map to store note -> jianpuInfo mapping
        const jianpuInfos = new Map<any, ReturnType<typeof convertNoteToJianpu>>();

        for (let rowIdx = 0; rowIdx < notesPerRow.length; rowIdx++) {
          let maxJianpuBottom = maxNoteBottomPerRow[rowIdx];
          
          for (const note of notesPerRow[rowIdx]) {
            const jianpuInfo = convertNoteToJianpu(note);
            jianpuInfos.set(note, jianpuInfo);
            if (jianpuInfo.dotsAbove > 0) {
              maxJianpuBottom = Math.max(maxJianpuBottom, maxNoteBottomPerRow[rowIdx] + dotVerticalSpacing * jianpuInfo.dotsAbove);
            }
          }
          maxJianpuBottomPerRow[rowIdx] = maxJianpuBottom > 0? maxJianpuBottom : rowYPositions[rowIdx] + staveHeight + 5;
        }
        
        for(let rowIdx = 0; rowIdx < notesPerRow.length; rowIdx++) {
          let maxLyricsBottom = maxJianpuBottomPerRow[rowIdx];
          for (const note of notesPerRow[rowIdx]) {
            const jianpuInfo = jianpuInfos.get(note);
            maxLyricsBottom = Math.max(maxLyricsBottom, maxJianpuBottomPerRow[rowIdx] 
              + (jianpuInfo.durationLines > 0 ? dotVerticalSpacing * jianpuInfo.durationLines : 0)
              + (jianpuInfo.dotsBelow > 0 ? dotVerticalSpacing * jianpuInfo.dotsBelow : 0));
            
          }
          maxLyricsBottomPerRow[rowIdx] = maxLyricsBottom > 0? maxLyricsBottom : rowYPositions[rowIdx] + staveHeight + 5;
        }
        
        // Use common function to draw jianpu
        drawJianpuForNotes(context, allNotes, noteToRowMap, jianpuInfos, maxJianpuBottomPerRow);
        maxNoteBottomPerRow = maxLyricsBottomPerRow;
      }
      
      // Use common function to draw lyrics
      drawLyricsForNotes(context, lyrics, allNotes, noteToRowMap, maxNoteBottomPerRow);
    });
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
  }) || [];
  
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