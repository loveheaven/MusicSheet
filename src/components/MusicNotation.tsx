import React, { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Voice, Formatter, Accidental, Flow, StaveConnector, Beam, Dot, Curve, TextBracket, GraceNote, GraceNoteGroup, Volta, Barline, ClefNote, Tuplet, Note } from 'vexflow';
import { durationMap, pitchMap, jianpuMap, vexFlowDurationMap, shouldShowAccidental } from '../utils/musicMaps';
import type { LilyPondNote, Lyric, VoiceData, Staff, ParsedMusic, Measure } from '../utils/musicMaps';

interface MusicNotationProps {
  musicData: ParsedMusic;
  currentNoteIndices: Map<number, number>;
  measuresPerRow?: number;
  showJianpu?: boolean;
  showMeasureNumbers?: boolean;
}

const MusicNotation: React.FC<MusicNotationProps> = ({ musicData, currentNoteIndices, measuresPerRow = 1, showJianpu = false, showMeasureNumbers = false }) => {
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

  const drawMultiMeasureRest = (staveNote: any, ctx: any, stave: any, duration: string, isHighlighted: boolean = false) => {
    // Draw a multi-measure rest symbol
    // This consists of a thick horizontal line in the middle of the staff
    // with the number of measures above it
    
    // Calculate the center of the measure
    // Use stave's X position and width to find the center
    const staveX = stave.getX();
    const staveWidth = stave.getWidth();
    const centerX = staveX + staveWidth / 2;
    
    const staveY = stave.getYForLine(2); // Middle line of the staff
    const width = 15; // Width of the rest symbol
    
    // Draw thick horizontal line
    ctx.save();
    ctx.strokeStyle = isHighlighted ? '#ff6b6b' : '#000000';
    ctx.fillStyle = isHighlighted ? '#ff6b6b' : '#000000';
    ctx.lineWidth = 6;
    ctx.lineCap = 'square';
    ctx.beginPath();
    ctx.moveTo(centerX - width / 2, staveY);
    ctx.lineTo(centerX + width / 2, staveY);
    ctx.stroke();
    
    // // Draw vertical lines at both ends (optional, for style)
    // ctx.lineWidth = 2;
    // ctx.beginPath();
    // ctx.moveTo(centerX - width / 2, staveY - 8);
    // ctx.lineTo(centerX - width / 2, staveY + 8);
    // ctx.moveTo(centerX + width / 2, staveY - 8);
    // ctx.lineTo(centerX + width / 2, staveY + 8);
    // ctx.stroke();
    
    ctx.restore();
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
      const linesAfter = getLinesAfter(baseDuration, hasDots);
      if(hasDots && parseInt(baseDuration) === 2) {
        hasDots = false;
      }
      
      return { 
        number: '0', 
        dotsAbove: 0, 
        dotsBelow: 0, 
        durationLines, 
        linesAfter: linesAfter, 
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
      jianpu = '♯' + jianpu; // Sharp
    } else if (accidental.includes('b')) {
      jianpu = '♭' + jianpu; // Flat
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
   * @param maxNoteBottomPerRow - Array of maximum note bottom Y positions per row
   */
  const drawJianpuForNotes = (
    context: any,
    notes: any[],
    jianpuInfos: Map<any, ReturnType<typeof convertNoteToJianpu>>,
    maxJianpuBottomPerRow: number[]
  ) => {
    context.fillStyle = '#0066cc';
    context.font = `${lyricFontSize}px Arial`;
    context.textAlign = 'center';
    

    // Second pass: draw jianpu notation
    for (let noteIndex = 0; noteIndex < notes.length; noteIndex++) {
      const note = notes[noteIndex];
      const rowIdx = note._rowIndex;
      
      
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

    }
    
    const timeSignatureMarker = flattenedNotes.find((note: any) => note._isTimeSignatureMarker);
    if (timeSignatureMarker) {
      timeSignatureToDisplay = timeSignatureMarker._timeSignature;

    }
    
    // Add clef if needed
    if (clefToDisplay && measureIndex === 0) {
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
          measureStave.addKeySignature('C');
        }
      }
      
      // Only add global time signature if there's no time signature marker in this measure
      if (musicData.time_signature && !timeSignatureToDisplay) {
        measureStave.addTimeSignature(musicData.time_signature);
      }
    }

    const hasRepeatStart = flattenedNotes.find((note: any) => note._isRepeatStart);
    if (hasRepeatStart && measureIndex !== 0) {
      // Start of repeat: left repeat sign (repeat begin barline)
      try {
        measureStave.setBegBarType(Barline.type.REPEAT_BEGIN);
      } catch (e) {
        // Silently fail
      }
    }
    
    const hasAlternativeEnd = flattenedNotes.find((note: any) => note._isAlternativeEnd);
    if (hasAlternativeEnd) {
      // Start of repeat: left repeat sign (repeat begin barline)
      try {
        measureStave.setEndBarType(Barline.type.REPEAT_END);
      } catch (e) {
        // Silently fail
      }
    }

    const alternativeStartNote = flattenedNotes.find((note: any) => note._isAlternative);
    var alternativeIndex: number[] | undefined;
    if(alternativeStartNote) alternativeIndex = alternativeStartNote._alternativeIndex;
    if (alternativeIndex && alternativeIndex.length > 0) {
      const altIdx = alternativeIndex[0]; // Get first alternative index (1-based)
      const voltaText = `${altIdx}`;
      
      try {
        // Set volta bracket
        measureStave.setVoltaType(Volta.type.BEGIN, voltaText, 0);
      } catch (e) {
        // Silently fail
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
   * @param keySignature - Current key signature (e.g., 'F', 'G', 'C')
   * @returns VexFlow StaveNote or marker object
   */
  const createVexFlowNote = (
    note: LilyPondNote,
    clef: string,
    noteIndex: number,
    staffIndex: number
  ): any => {
    // Check if this is a clef marker - use ClefNote to render it
    if (note.note_type === 'Clef' && note.clef) {
      const clefNote = new ClefNote(note.clef);
      (clefNote as any)._isClefMarker = true;
      (clefNote as any)._clefType = note.clef;
      return clefNote;
    }

    // Check if this is a time signature marker
    if (note.note_type === 'Time' && note.time_sig) {

      return {
        _isTimeSignatureMarker: true,
        _timeSignature: note.time_sig,
        getTicks: () => ({ value: () => 0 })
      };
    }

    // Check if this is a key signature marker
    if (note.note_type === 'Key' && note.key_sig) {

      return {
        _isKeyMarker: true,
        _keySignature: note.key_sig,
        getTicks: () => ({ value: () => 0 })
      };
    }

    if (note.note_type === 'Ottava') {

      return {
        _isOttavaMarker: true,
        _ottava: note.ottava,
        getTicks: () => ({ value: () => 0 })
      } as any;
    }

    // Handle repeat start marker
    if (note.note_type === 'RepeatStart') {
      return {
        _isRepeatStart: true,
        getTicks: () => ({ value: () => 0 })
      };
    }

    // Handle repeat end marker
    if (note.note_type === 'RepeatEnd') {
      return {
        _isRepeatEnd: true,
        getTicks: () => ({ value: () => 0 })
      };
    }

    // Handle alternative marker
    if (note.note_type === 'AlternativeStart') {
      return {
        _isAlternative: true,
        _alternativeIndex: note.alternative_index,
        getTicks: () => ({ value: () => 0 })
      };
    }

    if (note.note_type === 'AlternativeEnd') {
      return {
        _isAlternativeEnd: true,
        getTicks: () => ({ value: () => 0 })
      };
    }

    // Check if this is a grace note
    const isGraceNote = note.note_type === 'Grace';

    let staveNote: any;
    const noteClef = note.clef;
    
    if (note.note_type === 'Chord' && note.chord_notes && note.chord_notes.length > 0) {
      // Build keys array for all notes in the chord
      const keys = [
        `${convertPitch(note.pitch)}/${note.octave}`,
        ...note.chord_notes.map(([pitch, octave]) => `${convertPitch(pitch)}/${octave}`)
      ];
      
      // Create chord with duration
      let duration = durationMap[note.duration] || 'q';
      if (note.dots && note.dots.length > 0) {
        duration += 'd'.repeat(note.dots.length);
      }
      
      staveNote = new StaveNote({
        clef: clef,
        keys: keys,
        duration: duration,
        auto_stem: true
      });
      
      // Add dots
      addDotsToNote(staveNote, note.dots, keys.length);
      
      // Store pitch and octave info for later accidental processing
      // Accidentals will be added later when processing measures
      (staveNote as any)._lilypondPitch = note.pitch;
      (staveNote as any)._lilypondOctave = note.octave;
      (staveNote as any)._lilypondChordNotes = note.chord_notes;

      // Add arpeggio marking if present
      if (note.arpeggio) {
        (staveNote as any)._arpeggio = true;
      }
    } else {
      // Regular note or rest
      const vexNote = convertLilyPondToVexFlow(note);
      const parts = vexNote.split('/');
      
      if (parts[0] === 'r') {
        // Create a regular rest
        let duration = parts[1];
        if (note.dots && note.dots.length > 0) {
          duration += 'd'.repeat(note.dots.length);
        }
        
        // Choose rest position based on clef
        const restKeys: { [key: string]: string } = {
          'bass': 'd/3',
          'alto': 'c/4',
          'tenor': 'a/3'
        };
        const restKey = restKeys[clef] || 'b/4'; // Default for treble clef
        
        staveNote = new StaveNote({
          clef: clef,
          keys: [restKey],
          duration: duration,
          type: 'r'
        });
        
        addDotsToNote(staveNote, note.dots);
      } else if (parts[0] === 'R') {
        // Create a multi-measure rest (uppercase R)
        // Use whole rest as base, but mark it for special rendering
        const restKeys: { [key: string]: string } = {
          'bass': 'd/3',
          'alto': 'c/4',
          'tenor': 'a/3'
        };
        const restKey = restKeys[clef] || 'b/4'; // Default for treble clef
        
        // Use whole rest 'w' for multi-measure rest display
        staveNote = new StaveNote({
          clef: clef,
          keys: [restKey],
          duration: 'wr', // Whole rest
          type: 'r'
        });
        
        // Mark this as a multi-measure rest for custom rendering
        (staveNote as any)._isMultiMeasureRest = true;
        (staveNote as any)._originalDuration = note.duration;
      } else {
        // Create a regular note
        const [pitch, octave, baseDuration] = parts;
        let duration = baseDuration;
        if (note.dots && note.dots.length > 0) {
          duration += 'd'.repeat(note.dots.length);
        }
        
        // Determine whether to create a grace note or regular note
        const NoteClass = isGraceNote ? GraceNote : StaveNote;
        
        // For grace notes, use 32nd note duration (don't use the actual duration)
        // Grace notes should not occupy time in the measure
        const noteDuration = duration;
        
        staveNote = new NoteClass({
          clef: clef,
          keys: [`${pitch}/${octave}`],
          duration: noteDuration,
          auto_stem: true
        });

        // Add dots only for non-grace notes
        if (!isGraceNote) {
          addDotsToNote(staveNote, note.dots);
        }
        
        // Store pitch and octave info for later accidental processing
        (staveNote as any)._lilypondPitch = note.pitch;
        (staveNote as any)._lilypondOctave = note.octave;
        
        // Mark grace notes for later attachment to the following note
        if (isGraceNote) {
          (staveNote as any)._isGraceNote = true;
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
    
    // Store tuplet fraction info if present
    if (note.tuplet_fraction) {
      (staveNote as any)._tupletFraction = note.tuplet_fraction;
    }

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
    measureNotes: any[],
    tuplets: Tuplet[],
    beamsForTuplets: Beam[],
    marginLeft: number = 60
  ) => {
    // Create beams using Beam.generateBeams for automatic beaming
    // Filter out grace notes from beaming since they're handled by GraceNoteGroup
    const nonGraceNotes = measureNotes.filter((note: any) => !(note as any)._isGraceNote && !(note as any)._tupletFraction);
    var beams = Beam.generateBeams(nonGraceNotes);
    beams = beams.concat(beamsForTuplets);
    
    // Hide multi-measure rests before drawing voice (they will be drawn manually later)
    // Grace notes should NOT be hidden since they're attached as modifiers to regular notes
    const hiddenNotes: any[] = [];
    for (let i = 0; i < measureNotes.length; i++) {
      const note = measureNotes[i];
      if ((note as any)._isMultiMeasureRest) {
        // Save original style and make invisible
        (note as any)._originalStyle = {
          fillStyle: note.style?.fillStyle,
          strokeStyle: note.style?.strokeStyle
        };
        note.setStyle({ fillStyle: 'transparent', strokeStyle: 'transparent' });
        hiddenNotes.push(note);
      }
    }
    
    // Beams should be created before voice rendering.
    // Draw voice with beamed notes
    voice.draw(context, measureStave);
    
    // Restore original styles
    for (const note of hiddenNotes) {
      if ((note as any)._originalStyle) {
        note.setStyle((note as any)._originalStyle);
      }
    }
    
    // Draw beams
    beams.forEach((beam) => {
      beam.setContext(context).draw();
    });
    
    tuplets.forEach((tuplet) => {
      tuplet.setContext(context).draw();
    });

    // Draw arpeggios
    for (let i = 0; i < measureNotes.length; i++) {
      const note = measureNotes[i];
      if ((note as any)._arpeggio) {
        drawArpeggio(note, context);
      }
    }

    // Draw multi-measure rests
    for (let i = 0; i < measureNotes.length; i++) {
      const note = measureNotes[i];
      if ((note as any)._isMultiMeasureRest) {
        const duration = (note as any)._originalDuration || '1';
        // Check if this note has highlight color in its saved original style
        const isHighlighted = (note as any)._originalStyle?.fillStyle === '#ff6b6b' || (note as any)._originalStyle?.strokeStyle === '#ff6b6b';
        drawMultiMeasureRest(note, context, measureStave, duration, isHighlighted);
      }
    }

    // Draw slurs using common function
    drawSlursForNotes(context, measureNotes, marginLeft);
  };

  /**
   * Draw slurs (curved lines) for a set of notes based on group markers
   * @param context - Canvas rendering context
   * @param notes - Array of VexFlow notes to draw slurs for
   */
  const drawSlursForNotes = (context: any, notes: any[], marginLeft: number) => {
    const slurs: Curve[] = [];
    let slurStartNote: any = null;
    let slurStartIndex = -1;
    
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      
      // Check if this note starts a slur group
      if ((note as any)._groupStart) {
        slurStartNote = note;
        slurStartIndex = i;
      }
      
      // Check if this note ends a slur group
      if ((note as any)._groupEnd && slurStartNote) {
        // Check if slur crosses rows (different _rowIndex)
        const startRow = (slurStartNote as any)._rowIndex;
        const endRow = (note as any)._rowIndex;
        
        if (startRow !== undefined && endRow !== undefined && startRow !== endRow) {
          // Cross-row slur: draw slur segments that extend to staff boundaries
          // Collect all slur notes by row
          const notesByRow: Map<number, any[]> = new Map();
          for (let j = slurStartIndex; j <= i; j++) {
            const noteRow = (notes[j] as any)._rowIndex;
            if (noteRow !== undefined) {
              if (!notesByRow.has(noteRow)) {
                notesByRow.set(noteRow, []);
              }
              notesByRow.get(noteRow)!.push(notes[j]);
            }
          }
          
          // For each row, we need to draw slurs that extend to staff boundaries
          // This requires custom drawing using lower-level canvas APIs
          notesByRow.forEach((rowNotes, rowIdx) => {
            // Set consistent style for slur curves
            context.strokeStyle = '#000000';
            context.lineWidth = 1.5;
            
            if (rowIdx === startRow) {
              // First row: from first slur note to end of staff (right edge)
              const firstNote = rowNotes[0];
              const lastNote = rowNotes[rowNotes.length - 1];
              
              // Get the position of the last note (or first if only one)
              const noteToUse = lastNote;
              const boundingBox = noteToUse.getBoundingBox();
              const startX = firstNote.getAbsoluteX();
              const endX = boundingBox.getX() + boundingBox.getW() + 50; // Extend to right edge
              const y = boundingBox.getY() - 10;
              
              // Draw a custom slur curve extending to the right with more curve
              context.beginPath();
              context.moveTo(startX, y);
              const cp1x = startX + (endX - startX) * 0.2;
              const cp1y = y - 30; // More downward curve
              const cp2x = startX + (endX - startX) * 0.8;
              const cp2y = y - 30; // More downward curve
              context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, y);
              context.stroke();
            } else if (rowIdx === endRow) {
              // Last row: from start of staff (left edge) to last slur note
              const firstNote = rowNotes[0]; // First note in this row
              const lastNote = rowNotes[rowNotes.length - 1];
              const boundingBox = lastNote.getBoundingBox();
              const firstNoteBBox = firstNote.getBoundingBox();
              
              const startX = marginLeft; // Start from the left margin
              const endX = lastNote.getAbsoluteX();
              const y = boundingBox.getY() - 10;
              
              // Calculate curve height based on width
              // Wider curve = more curve depth, narrower = less curve depth
              const width = endX - startX;
              const curveDepth = Math.min(30, width * 0.15); // Max 30, scales with width
              
              // Draw a custom slur curve extending from the left
              context.beginPath();
              context.moveTo(startX, y);
              // Control points weighted more towards the ending note to make curve closer to slur_start
              const cp1x = startX + (endX - startX) * 0.1;
              const cp1y = y - curveDepth;
              const cp2x = startX + (endX - startX) * 0.6;
              const cp2y = y - curveDepth;
              context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, y);
              context.stroke();
            } else {
              // Middle row: from start of staff to end of staff
              if (rowNotes.length > 0) {
                const firstNote = rowNotes[0];
                const boundingBox = firstNote.getBoundingBox();
                const startX = boundingBox.getX() - 100;
                const endX = boundingBox.getX() + 200; // Span across
                const y = boundingBox.getY() - 10;
                
                context.beginPath();
                context.moveTo(startX, y);
                const cp1x = startX + (endX - startX) * 0.3;
                const cp1y = y - 10;
                const cp2x = startX + (endX - startX) * 0.7;
                const cp2y = y - 10;
                context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, y);
                context.stroke();
              }
            }
          });
        } else {
          // Same-row slur: determine stem direction and draw manually to ensure proper positioning
          // Collect notes between slurStartNote and note (inclusive)
          const slurNotes = notes.slice(slurStartIndex, i + 1);
          
          // Determine average stem direction of notes in the slur
          // Stem direction: 1 = up, -1 = down
          let stemDirection = 0;
          let stemCount = 0;
          for (const slurNote of slurNotes) {
            try {
              // Skip markers and rests
              if (slurNote._isClefMarker || slurNote._isTimeSignatureMarker || 
                  slurNote._isKeyMarker || slurNote._isOttavaMarker) {
                continue;
              }
              const isRest = slurNote.duration?.includes('r') || 
                            slurNote.isRest?.() || 
                            slurNote.constructor.name === 'StaveRest';
              if (isRest) continue;
              
              const stem = slurNote.getStem?.();
              if (stem) {
                const direction = stem.getDirection();
                stemDirection += direction;
                stemCount++;
              }
            } catch (e) {
              // Ignore errors
            }
          }
          
          // Calculate average stem direction
          const avgStemDirection = stemCount > 0 ? stemDirection / stemCount : 1;
          
          // Find the highest/lowest point among all notes in the slur
          let extremeY = 0;
          let hasValidY = false;
          
          for (const slurNote of slurNotes) {
            try {
              // Skip markers and rests
              if (slurNote._isClefMarker || slurNote._isTimeSignatureMarker || 
                  slurNote._isKeyMarker || slurNote._isOttavaMarker) {
                continue;
              }
              const isRest = slurNote.duration?.includes('r') || 
                            slurNote.isRest?.() || 
                            slurNote.constructor.name === 'StaveRest';
              if (isRest) continue;
              
              const bbox = slurNote.getBoundingBox();
              if (bbox) {
                if (!hasValidY) {
                  extremeY = avgStemDirection > 0 ? bbox.getY() : (bbox.getY() + bbox.getH());
                  hasValidY = true;
                } else {
                  if (avgStemDirection > 0) {
                    // Stems up: find highest point (minimum Y)
                    extremeY = Math.min(extremeY, bbox.getY());
                  } else {
                    // Stems down: find lowest point (maximum Y)
                    extremeY = Math.max(extremeY, bbox.getY() + bbox.getH());
                  }
                }
              }
            } catch (e) {
              // Ignore errors
            }
          }
          
          // Draw custom slur curve that stays above/below all notes
          try {
            const startX = slurStartNote.getAbsoluteX();
            const endX = note.getAbsoluteX();
            const spanX = endX - startX;
            
            // Get start and end note Y positions for better curve fitting
            const startBBox = slurStartNote.getBoundingBox();
            const endBBox = note.getBoundingBox();
            
            // Calculate base Y positions for start and end points
            let startY, endY;
            if (avgStemDirection > 0) {
              // Stems up: slur above notes
              startY = startBBox.getY() - 8; // Closer to start note
              endY = endBBox.getY() - 8; // Closer to end note
            } else {
              // Stems down: slur below notes
              startY = startBBox.getY() + startBBox.getH() + 8;
              endY = endBBox.getY() + endBBox.getH() + 8;
            }
            
            // Calculate the middle Y position (peak of the curve)
            // Should be further away to create a nice arc
            let midY;
            if (avgStemDirection > 0) {
              // Stems up: peak should be higher (lower Y value)
              midY = hasValidY ? extremeY - 25 : Math.min(startY, endY) - 25;
            } else {
              // Stems down: peak should be lower (higher Y value)
              midY = hasValidY ? extremeY + 25 : Math.max(startY, endY) + 25;
            }
            
            // Draw bezier curve with control points that create a nice arc
            context.save();
            context.strokeStyle = '#000000';
            context.lineWidth = 1.5;
            context.beginPath();
            context.moveTo(startX, startY);
            
            // Control points positioned to create a smooth, curved arc
            // First control point: close to start, pulling toward the peak
            const cp1x = startX + spanX * 0.15;
            const cp1y = startY + (midY - startY) * 0.7;
            
            // Second control point: close to end, pulling toward the peak
            const cp2x = startX + spanX * 0.85;
            const cp2y = endY + (midY - endY) * 0.7;
            
            context.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
            context.stroke();
            context.restore();
          } catch (e) {
            // Fallback to VexFlow Curve
            const slur = new Curve(slurStartNote, note, {
              cps: [
                { x: 0, y: avgStemDirection > 0 ? -25 : 25 },
                { x: 0, y: avgStemDirection > 0 ? -25 : 25 }
              ]
            });
            slurs.push(slur);
          }
        }
        slurStartNote = null;
        slurStartIndex = -1;
      }
    }
    
    // Draw slurs
    slurs.forEach((slur) => {
      slur.setContext(context).draw();
    });
  };

  /**
   * Draw ottava brackets for notes
   * @param context - Canvas context
   * @param ottavaMarkers - Array of ottava marker info
   * @param notes - Array of notes
   * @param staffY - Y position of the staff
   */
  const drawOttavaForNotes = (
    context: any,
    ottavaMarkers: Array<{
      startNoteIndex: number;
      endNoteIndex: number;
      ottavaValue: number;
    }>,
    notes: any[],
    staffY: number
  ) => {
    if (!ottavaMarkers || ottavaMarkers.length === 0) return;

    ottavaMarkers.forEach((marker) => {
      const { startNoteIndex, endNoteIndex, ottavaValue } = marker;
      
      if (startNoteIndex >= notes.length || endNoteIndex > notes.length) {
        return;
      }

      try {
        const startNote = notes[startNoteIndex];
        const endNote = notes[Math.min(endNoteIndex, notes.length - 1)];

        
        // Determine ottava label and position
        // VexFlow TextBracket positions: 1 = top, -1 = bottom
        let ottavaLabel = '';
        let position = 1; // Default to top
        
        if (ottavaValue === 1) {
          ottavaLabel = '8va';
          position = 1; // TOP
        } else if (ottavaValue === -1) {
          ottavaLabel = '8vb';
          position = -1; // BOTTOM
        } else if (ottavaValue === 2) {
          ottavaLabel = '15ma';
          position = 1; // TOP
        } else if (ottavaValue === -2) {
          ottavaLabel = '15mb';
          position = -1; // BOTTOM
        } else {
          return; // Unknown ottava value
        }

        // Create and draw TextBracket
        // Use superscript for the ottava label (8va, 8vb, etc.)
        const textBracket = new TextBracket({
          start: startNote,
          stop: endNote,
          text: '',
          superscript: ottavaLabel,
          position: position
        });
        
        textBracket.setContext(context).draw();
      } catch (e) {
        return;
      }
    });
  };

  /**
   * Draw lyrics for a set of notes
   * @param context - Canvas rendering context
   * @param lyrics - Array of lyric objects with text_nodes
   * @param notes - Array of VexFlow notes to align lyrics with
   * @param maxNoteBottomPerRow - Array of maximum note bottom Y positions per row
   */
  const drawLyricsForNotes = (
    context: any,
    lyrics: any[],
    notes: any[],
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
        const rowIdx = note._rowIndex;
        
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

  /**
   * Convert LilyPond pitch to VexFlow pitch format
   * @param pitch - LilyPond pitch (e.g., 'cis', 'bes', 'f')
   * @returns VexFlow pitch format (e.g., 'c#', 'bb', 'f')
   */
  const convertPitch = (pitch: string): string => {
    let result = pitch;
    if (result.includes('is')) {
      result = result.replace('is', '#');
    } else if (result.includes('es')) {
      result = result.replace('es', 'b');
    }
    return result;
  };

  /**
   * Add dots to a note for visual display
   * @param staveNote - VexFlow StaveNote object
   * @param dots - Dots string from LilyPondNote
   * @param numNotes - Number of notes in the chord (1 for single note)
   */
  const addDotsToNote = (staveNote: any, dots: string, numNotes: number = 1): void => {
    if (dots && dots.length > 0) {
      const numDots = dots.length;
      for (let noteIndex = 0; noteIndex < numNotes; noteIndex++) {
        for (let dotIndex = 0; dotIndex < numDots; dotIndex++) {
          staveNote.addModifier(new Dot(), noteIndex);
        }
      }
    }
  };

  /**
   * Add accidental modifier to a note if needed based on key signature and measure context
   * @param staveNote - VexFlow StaveNote object
   * @param pitch - LilyPond pitch (e.g., 'bes', 'fis', 'c', 'b')
   * @param keySignature - Key signature string (e.g., 'F', 'G', 'Bb', 'D')
   * @param noteIndex - Index of the note in the chord (0 for single note or chord base)
   * @param measureAccidentals - Map tracking accidentals used in current measure (e.g., {'c4': '#'})
   * @param octave - Octave of the note
   */
  const addAccidentalIfNeeded = (
    staveNote: any, 
    pitch: string, 
    keySignature: string, 
    noteIndex: number,
    measureAccidentals?: Map<string, string>,
    octave?: number
  ): void => {
    // Create a unique key for this pitch+octave combination in the measure
    const pitchKey = octave !== undefined ? `${pitch.charAt(0)}${octave}` : pitch.charAt(0);
    
    // Check if this pitch was already altered in the current measure
    if (measureAccidentals && measureAccidentals.has(pitchKey)) {
      const measureAccidental = measureAccidentals.get(pitchKey);
      const currentAccidental = pitch.includes('is') ? '#' : pitch.includes('es') ? 'b' : 'n';
      
      // If the accidental matches what was already set in the measure, don't show it again
      if (measureAccidental === currentAccidental) {
        return;
      }
      // If different, show the new accidental and update the measure state
      if (currentAccidental === '#') {
        staveNote.addModifier(new Accidental('#'), noteIndex);
        measureAccidentals.set(pitchKey, '#');
      } else if (currentAccidental === 'b') {
        staveNote.addModifier(new Accidental('b'), noteIndex);
        measureAccidentals.set(pitchKey, 'b');
      } else {
        staveNote.addModifier(new Accidental('n'), noteIndex);
        measureAccidentals.set(pitchKey, 'n');
      }
      return;
    }
    
    // First occurrence in measure: check against key signature
    const needsAccidental = shouldShowAccidental(pitch, keySignature);
    if (needsAccidental === '#') {
      staveNote.addModifier(new Accidental('#'), noteIndex);
      if (measureAccidentals) measureAccidentals.set(pitchKey, '#');
    } else if (needsAccidental === 'b') {
      staveNote.addModifier(new Accidental('b'), noteIndex);
      if (measureAccidentals) measureAccidentals.set(pitchKey, 'b');
    } else if (needsAccidental === 'n') {
      staveNote.addModifier(new Accidental('n'), noteIndex);
      if (measureAccidentals) measureAccidentals.set(pitchKey, 'n');
    } else if (measureAccidentals) {
      // No accidental shown, but track the natural state from key signature
      const currentAccidental = pitch.includes('is') ? '#' : pitch.includes('es') ? 'b' : 'n';
      measureAccidentals.set(pitchKey, currentAccidental);
    }
  };

  const convertLilyPondToVexFlow = (note: LilyPondNote): string => {
    // Handle regular rest
    if (note.pitch === 'r') {
      const duration = durationMap[note.duration] || 'q';
      return `r/${duration}`;
    }

    // Handle multi-measure rest (uppercase R)
    if (note.pitch === 'R') {
      const duration = durationMap[note.duration] || 'q';
      return `R/${duration}`;
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

  // Build vexflow notes of measures by backend measure note index
  const buildMeasuresFromBackend = (
    staffIdx: number,
    voiceIdx: number,
    staffData: any, // {voices: [{notes: [], lyrics: [], measures: []}], measures: [], hasVoices: true}
    voiceNotes: any[]
  ): any[][] => {
    const measures: any[][] = [];
    const backendMeasures = staffData.voices[voiceIdx]?.measures;
    
    if (backendMeasures && backendMeasures.length > 0) {
      // Use backend measure indices
      backendMeasures.forEach((measure: Measure) => {
        const measureNotes: any[] = [];
        measure.notes.forEach((noteIdx: number) => {
          if (noteIdx < voiceNotes.length) {
            measureNotes.push(voiceNotes[noteIdx]);
          }
        });
        // Always push measure, even if empty (markers only)
        measures.push(measureNotes);
      });
    }
    return measures;
  };
  
  const drawStartMeasureNumber = (context: any, 
    showMeasureNumbers: boolean, 
    startMeasure: number, 
    rowY: number, 
    marginLeft: number) => {
    // Display measure number at the start of the row if showMeasureNumbers is enabled
    if (showMeasureNumbers) {
      context.save();
      context.font = 'bold 16px Arial';
      context.fillStyle = '#666666';
      context.textAlign = 'right';
      // Measure numbers start from 1
      const measureNumber = startMeasure + 1;
      context.fillText(measureNumber.toString(), marginLeft - 20, rowY + 25);
      context.restore();
    }
  };

  // Helper function to create and configure a tuplet with proper direction
  const createTuplet = (tupletNotes: any[], fraction: string | null) => {
    if (tupletNotes.length === 0 || !fraction) return { tuplet: undefined, beam: undefined };

    const beam: Beam = new Beam(tupletNotes, true);
    // Determine direction using beam information first
    const tupletDirection = beam.getStemDirection?.();
    const tupletLocation = tupletDirection === -1 ? 
      (Tuplet as any).LOCATION_BOTTOM : 
      (Tuplet as any).LOCATION_TOP;
    
    const tuplet = new Tuplet(tupletNotes, {
      location: tupletLocation,
    });
    tupletNotes.forEach((note) => {
      note.setTuplet(tuplet);
    });
    
    // Parse tuplet_fraction format: "n/m" where n notes occupy m beats
    const fractionParts = fraction.split('/');
    if (fractionParts.length === 2) {
      const notesCount = parseInt(fractionParts[0], 10);
      if (!isNaN(notesCount)) {
        tuplet.setNotesOccupied(notesCount);
      }
    }
      
    return {tuplet, beam};
  };

  const drawStaffForCurrentRow = (context: any, 
    startMeasure: number, 
    endMeasure: number, 
    staffVoices: any[],
    staffY: number,
    staveWidth: number,
    bottomYPositionForStavesInCurrentRow: number[],
    marginLeft: number,
    ticksPerBeat: number,
    beatValue: number,
    numBeats: number,
    staff: Staff,
    rowIndex: number) => {
    const rowStaffMeasures: Stave[] = [];

    var bottomYPosition = -1;
    // Render measures for this staff
    for (let measureIdx = startMeasure; measureIdx < endMeasure; measureIdx++) {
      const colIndex = measureIdx - startMeasure;
      const x = marginLeft + colIndex * staveWidth;

      // Collect all notes from all voices for this measure
      const allVoiceNotesForMeasure: any[][] = [];
      for (let voiceIdx = 0; voiceIdx < staffVoices.length; voiceIdx++) {
        const measures = staffVoices[voiceIdx];
        if (measureIdx < measures.length && measures[measureIdx].length > 0) {
          allVoiceNotesForMeasure.push(measures[measureIdx]);
        }
      }

      // Create measure stave using common function,并且画五线谱线
      const { stave: measureStave, clefToDisplay, timeSignatureToDisplay } = createMeasureStave(
        x,
        staffY,
        staveWidth,
        measureIdx,
        allVoiceNotesForMeasure,
        staff.clef || 'treble',
        context    
      );
      rowStaffMeasures.push(measureStave);
      bottomYPosition = Math.max(bottomYPosition, measureStave.getYForLine(4));      

      // Render notes for this measure - handle multiple voices
      const voicesToRender: any[] = [];
      
      for (let voiceIdx = 0; voiceIdx < staffVoices.length; voiceIdx++) {
        const voiceMeasures = staffVoices[voiceIdx];
        if (measureIdx < voiceMeasures.length && voiceMeasures[measureIdx].length > 0) {
          // Filter out clef markers and time signature markers - they shouldn't be rendered as notes
          const measureNotes = voiceMeasures[measureIdx].filter((note: any) => 
            !note._isTimeSignatureMarker && !note._isKeyMarker && !note._isOttavaMarker && !note._isRepeatStart && !note._isRepeatEnd && !note._isAlternative && !note._isAlternativeEnd
          );
          
          if (measureNotes.length === 0) {
            // Skip if only clef markers in this measure
            continue;
          }

          

          
          let notesToRender = [...measureNotes];

          
          
          // Process grace notes and tuplets together: group consecutive grace notes/tuplets and attach to following note
          const processedNotes: any[] = [];
          var graceNoteBuffer: any[] = [];
          var currentTupletFraction: string | null = null;
          var currentTupletNotes: any[] = [];
          var tupletNotesPerGroup = 0;
          const tuplets: Tuplet[] = [];
          const beamsForTuplets: Beam[] = [];
          
          for (let i = 0; i < notesToRender.length; i++) {
            const currentNote = notesToRender[i];
            
            if ((currentNote as any)._isGraceNote) {
              // Collect grace notes
              graceNoteBuffer.push(currentNote);
            } else {
              // First, handle any pending tuplets before processing the regular note
              if ((currentNote as any)._tupletFraction) {
                const tupletFraction = (currentNote as any)._tupletFraction;
                
                // If tuplet fraction changed, finalize previous tuplet group
                if (tupletFraction !== currentTupletFraction) {
                  if (currentTupletNotes.length > 0) {
                    const {tuplet, beam} = createTuplet(currentTupletNotes, currentTupletFraction);
                    if (tuplet) tuplets.push(tuplet);
                    if (beam) beamsForTuplets.push(beam);
                  }
                  currentTupletNotes = [];
                  tupletNotesPerGroup = 0;
                  currentTupletFraction = tupletFraction;
                  
                  // Parse new tuplet fraction
                  const fractionParts = tupletFraction.split('/');
                  if (fractionParts.length === 2) {
                    tupletNotesPerGroup = parseInt(fractionParts[0], 10);
                    if (isNaN(tupletNotesPerGroup)) {
                      tupletNotesPerGroup = 0;
                    }
                  }
                }
                
                currentTupletNotes.push(currentNote);
                
                // When we have enough notes for a tuplet group, create the tuplet
                if (tupletNotesPerGroup > 0 && currentTupletNotes.length === tupletNotesPerGroup) {
                  const {tuplet, beam} = createTuplet(currentTupletNotes, currentTupletFraction);
                  if (tuplet) tuplets.push(tuplet);
                  if (beam) beamsForTuplets.push(beam);
                  currentTupletNotes = [];
                }
              } else {
                // Non-tuplet note: finalize any pending tuplet
                if (currentTupletNotes.length > 0) {
                  const {tuplet, beam} = createTuplet(currentTupletNotes, currentTupletFraction);
                  if (tuplet) tuplets.push(tuplet);
                  if (beam) beamsForTuplets.push(beam);
                }
                currentTupletNotes = [];
                currentTupletFraction = null;
                tupletNotesPerGroup = 0;
              }
              
              // Create GraceNoteGroup for buffered grace notes and attach to current note
              if (graceNoteBuffer.length > 0) {
                try {
                  // Create GraceNoteGroup without beaming - beaming will be done automatically after formatting
                  const graceNoteGroup = new GraceNoteGroup(graceNoteBuffer, false);
                  currentNote.addModifier(graceNoteBuffer.length > 1 ? graceNoteGroup.beamNotes() : graceNoteGroup, 0);
                  graceNoteBuffer = []; // Clear the buffer
                } catch (e) {
                  console.error(`[GraceNoteGroup] Error creating or attaching grace note group:`, e);
                  console.error(`Error details:`, {
                    message: e instanceof Error ? e.message : String(e),
                    stack: e instanceof Error ? e.stack : undefined,
                  });
                  console.log(`Grace note buffer contents:`, graceNoteBuffer);
                  console.log(`Current note:`, currentNote);
                  // Fallback: just add notes as-is
                  processedNotes.push(...graceNoteBuffer);
                  graceNoteBuffer = [];
                }
              }
              // Then add the regular note
              processedNotes.push(currentNote);
            }
          }
          
          // Finalize any remaining tuplets or grace notes (edge case)
          if (currentTupletNotes.length > 0) {
            const {tuplet, beam} = createTuplet(currentTupletNotes, currentTupletFraction);
            if (tuplet) tuplets.push(tuplet);
            if (beam) beamsForTuplets.push(beam);
          }
          
          if (graceNoteBuffer.length > 0) {
            console.warn(`[GraceNoteGroup] Trailing grace notes not attached:`, graceNoteBuffer.length);
            processedNotes.push(...graceNoteBuffer);
          }

          let measureTicks = 0;
          measureNotes.forEach((note: any) => {
            // Mark notes with their row index for cross-row slur detection
            note._rowIndex = rowIndex;
            // Grace notes don't contribute to measure timing
            if ((note as any)._tupletFraction) {
              const fractionParts = (note as any)._tupletFraction.split('/');
              
              const notesPerGroup = parseInt(fractionParts[0], 10);
              const notesPerBeat = parseInt(fractionParts[1], 10);
              // console.log(`notesPerGroup: ${notesPerGroup}`, `notesPerBeat: ${notesPerBeat}`, `note.getTicks().value(): ${note.getTicks().value()}`);
              measureTicks += note.getTicks().value() * notesPerBeat / notesPerGroup;
            } else 
            if (!((note as any)._isGraceNote)) {
              measureTicks += note.getTicks().value();
            }
          });

          const actualBeats = measureTicks / ticksPerBeat;
          // For first measure (pickup), use its actual beat count; for others use full beats or actual, whichever is smaller
          const voiceBeats = measureIdx === 0 && musicData.partial ? (measureTicks / ticksPerBeat) : Math.min(actualBeats, numBeats);
          const voice = new Voice({
            num_beats: voiceBeats,
            beat_value: beatValue
          });

          voice.setMode(Voice.Mode.SOFT);
          voice.addTickables(processedNotes);
          voicesToRender.push({ voice, measureNotes, tuplets, beamsForTuplets, voiceIdx });
        }
      }

      if (voicesToRender.length > 0) {
        // Create formatter with options for better spacing
        const formatter = new Formatter();
        
        // Format all voices together
        const allVoices = voicesToRender.map(v => v.voice);
        //formatter.joinVoices(allVoices).format(allVoices, formatWidth);
        formatter.joinVoices(allVoices).formatToStave(allVoices, measureStave);
        // const minWidth = formatter.preCalculateMinTotalWidth(allVoices);
        
        voicesToRender.forEach(({ voice, measureNotes, tuplets, beamsForTuplets}) => {
          drawVoiceWithDecorations(context, voice, measureStave, measureNotes, tuplets, beamsForTuplets, marginLeft);
        });
      }
    }
    
    bottomYPositionForStavesInCurrentRow.push(bottomYPosition);

    // Connect measure staves in the same row
    if (rowStaffMeasures.length > 1) {
      // Set canvas style for connectors
      context.strokeStyle = '#000000';
      context.lineWidth = 1;
      
      for (let i = 0; i < rowStaffMeasures.length - 1; i++) {
        const connector = new StaveConnector(rowStaffMeasures[i], rowStaffMeasures[i + 1]);
        connector.setType(StaveConnector.type.SINGLE);
        connector.setContext(context).draw();
      }
    }
  };
  const drawOttavaMarkers = (context: any, ottavaMarkers: any[], allNotes: any[], notesPerRow: any[]) => {
    // Process each ottava marker
    ottavaMarkers.forEach((marker) => {
      const { startNoteIndex, endNoteIndex, ottavaValue } = marker;
      
      // Find which rows the ottava spans
      const startRow = allNotes[startNoteIndex]._rowIndex;
      const endRow = allNotes[Math.min(endNoteIndex - 1, allNotes.length - 1)]._rowIndex;
      
      // Split ottava into segments for each row
      for (let rowIdx = startRow; rowIdx <= endRow; rowIdx++) {
        const rowNotes = notesPerRow[rowIdx];
        
        // Calculate the start and end index within this row
        let rowStartGlobalIndex = 0;
        for (let i = 0; i < rowIdx; i++) {
          rowStartGlobalIndex += notesPerRow[i].length;
        }
        
        // Find the segment of ottava in this row
        const segmentStartInRow = Math.max(startNoteIndex - rowStartGlobalIndex, 0);
        const segmentEndInRow = Math.min(endNoteIndex - 1 - rowStartGlobalIndex, rowNotes.length - 1);
        
        if (segmentStartInRow <= segmentEndInRow && segmentStartInRow < rowNotes.length) {
          const segmentMarker = {
            startNoteIndex: segmentStartInRow,
            endNoteIndex: segmentEndInRow + 1,
            ottavaValue
          };
          
          drawOttavaForNotes(context, [segmentMarker], rowNotes, 0);
        }
      }
    });
  };

  const collectRenderInfo = (
    staffIndex: number,
    voiceIdx: number,
    lyrics: any[], 
    voiceMeasures: any[],
    measureRows:number[], 
    maxMeasures:number,
    bottomYPositions: number[][],
    renderingInfo: any[]) => {
    

    measureRows.forEach((startMeasure, rowIndex) => {
      const notesInRow: any[] = [];
      const lyricStartY = bottomYPositions[staffIndex][rowIndex];
      const endMeasure = Math.min(startMeasure + measuresPerRow, maxMeasures);

      for (let measureIdx = startMeasure; measureIdx < endMeasure; measureIdx++) {
        
        if (measureIdx < voiceMeasures.length) {
          const measureNotes = voiceMeasures[measureIdx].filter((note: any) => 
            !note._isClefMarker && !note._isTimeSignatureMarker && !note._isKeyMarker && !note._isOttavaMarker && !note._isRepeatStart && !note._isRepeatEnd && !note._isAlternative && !note._isAlternativeEnd
          );
          notesInRow.push(...measureNotes);
        }
      }
      if (notesInRow.length > 0) {
        let entry = renderingInfo.find(e => e.staffIndex === staffIndex && e.voiceIdx === voiceIdx);
        if (!entry) {
          entry = {
            staffIndex,
            voiceIdx,
            lyrics,
            notesPerRow: [],
            rowYPositions: [],
            ottavaMarkers: []
          };
          renderingInfo.push(entry);
        }
        
        entry.notesPerRow.push(notesInRow);            
        entry.rowYPositions.push(lyricStartY);
      }
    });

    let globalNoteIndex = 0;
    let ottavaStartIndex = -1;
    let currentOttavaValue = 0;
    const ottavaMarkersForVoice: Array<{
      startNoteIndex: number;
      endNoteIndex: number;
      ottavaValue: number;
    }> = [];
        
    // Process ALL measures for this voice (across all rows)
    // Build list of actual notes (excluding Ottava markers and other non-playable elements)
    const allActualNotes: any[] = [];
    for (let measureIdx = 0; measureIdx < maxMeasures; measureIdx++) {          
      if (measureIdx < voiceMeasures.length) {
        const measureNotes = voiceMeasures[measureIdx];
        for (const note of measureNotes) {
          if (!note._isClefMarker && !note._isTimeSignatureMarker && !note._isKeyMarker && !note._isRepeatStart && !note._isRepeatEnd && !note._isAlternative && !note._isAlternativeEnd && !note._isOttavaMarker) {
            allActualNotes.push(note);
          }
        }
      }
    }
    
    // Now process Ottava markers and track their ranges using actual note indices
    for (let measureIdx = 0; measureIdx < maxMeasures; measureIdx++) {          
      if (measureIdx < voiceMeasures.length) {
        const measureNotes = voiceMeasures[measureIdx];
        
        for (const note of measureNotes) {
          if (note._isOttavaMarker) {
            if (note._ottava !== 0) {
              // Start of ottava - ottavaStartIndex is the current actual note index
              ottavaStartIndex = globalNoteIndex;
              currentOttavaValue = note._ottava;
            } else {
              // End of ottava - endNoteIndex is the current actual note index - 1
              if (ottavaStartIndex !== -1) {
                ottavaMarkersForVoice.push({
                  startNoteIndex: ottavaStartIndex,
                  endNoteIndex: globalNoteIndex - 1,
                  ottavaValue: currentOttavaValue
                });
                ottavaStartIndex = -1;
                currentOttavaValue = 0;
              }
            }
          } else if (!note._isClefMarker && !note._isTimeSignatureMarker && !note._isKeyMarker && !note._isRepeatStart && !note._isRepeatEnd && !note._isAlternative && !note._isAlternativeEnd) {
            globalNoteIndex++;
          }
        }
      }
    }
        
    // Create entry for ottava rendering
    if (ottavaMarkersForVoice.length > 0) {
      let entry = renderingInfo.find(e => e.staffIndex === staffIndex && e.voiceIdx === voiceIdx);
      if (entry) {
        entry.ottavaMarkers = ottavaMarkersForVoice;
      }
    }
  };

  useEffect(() => {
    console.log('musicData:', musicData);
    
    if (!containerRef.current) {
      return;
    }

    // Check if we have staves
    const hasStaves = musicData?.staves && musicData.staves.length > 0;
    
    if (!hasStaves) {
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
      console.error('VexFlow Rendering Error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined,
      });
      
      const context = renderer.getContext();
      context.fillText('Music notation rendering error', 50, 100);
      context.fillText('Check console for details', 50, 130);
    }

  }, [musicData, currentNoteIndices, measuresPerRow, containerWidth, leftMargin, rightMargin, lyricFontSize, lyricLineSpacing, showJianpu, pianoStaffSpacing, pianoSystemSpacing, showMeasureNumbers]);

  const renderMultipleStaves = (renderer: any, musicData: ParsedMusic) => {
    const staves = musicData.staves || [];
    if (staves.length === 0) return;

    // Get time signature from the first staff (each staff should have its own time_signature)
    const staffTimeSignature = staves[0]?.time_signature || musicData.time_signature || '4/4';
    const [numBeats, beatValue] = staffTimeSignature.split('/').map(Number);
    
    const ticksPerBeat = Flow.durationToTicks(beatValue.toString());
    
    // Determine notes to render for each staff
    // If staff has voices, keep them separate; otherwise use staff.notes
    // staffVoicesData = [{voices: [{notes: [], lyrics: [], measures: []}], measures: [], hasVoices: true}]
    const staffVoicesData = staves.map((staff, staffIdx) => {
      if (staff.voices && staff.voices.length > 0) {
        // Multiple voices: keep them separate
        return {
          voices: staff.voices.map(voice => ({
            notes: voice.base.notes || [],
            lyrics: voice.lyrics || [],
            measures: voice.measures || []
          })),
          hasVoices: true
        };
      } else {
        // No voices: treat staff.notes as a single voice
        return {
          voices: [{
            notes: staff.notes || [],
            lyrics: staff.lyrics || [],
            measures: staff.measures || []
          }],
          hasVoices: false
        };
      }
    });

    // Convert notes for each staff and voice, tracking clef changes and ottava
    const keySignature = musicData.key_signature || 'C';
    // staffVexNotes = [staff[voice[vexflowNote]]]
    const staffVexNotes = staffVoicesData.map((staffData, staffIdx) => 
      staffData.voices.map((voiceData, voiceIdx) => {
        let currentClef = staves[staffIdx].clef || 'treble';
        let currentOttava = 0; // Track current ottava offset
        return voiceData.notes.map((note, noteIdx) => {
          // Update ottava if this note is an Ottava marker
          if (note.note_type === 'Ottava' && note.ottava !== undefined) {
            currentOttava = note.ottava;
          }
          
          // Apply ottava offset to the note before creating VexFlow note
          const noteToProcess = { ...note };
          if (currentOttava !== 0 && note.note_type !== 'Ottava' && note.pitch && note.pitch !== 'r' && note.pitch !== 'R') {
            // Apply ottava transposition to octave
            // Note: In LilyPond, \ottava #1 means lower an octave (display lower), so we subtract
            noteToProcess.octave = (noteToProcess.octave || 0) - currentOttava;
            
            // Also apply to chord notes if they exist
            if (noteToProcess.chord_notes && noteToProcess.chord_notes.length > 0) {
              noteToProcess.chord_notes = noteToProcess.chord_notes.map(([pitch, octave]) => 
                [pitch, octave - currentOttava]
              );
            }
          }
          
          const vexFlowNote = createVexFlowNote(noteToProcess, currentClef, noteIdx, staffIdx);
          // Update clef if this note is a ClefNote
          if (note.note_type === 'Clef' && note.clef) {
            currentClef = note.clef;
          }
          return vexFlowNote;
        });
      })
    );

    // Split each staff's voices' notes into measures using backend data
    // staffMeasures = [staff[voice[measure[vexflowNote]]]]
    const staffMeasures = staffVexNotes.map((staffVoices, staffIdx) => 
      staffVoices.map((voiceNotes, voiceIdx) => {
        const backendMeasures = buildMeasuresFromBackend(staffIdx, voiceIdx, staffVoicesData[staffIdx], voiceNotes);
        
        if (backendMeasures.length > 0) {
          // Backend measures exist, use them
          const measures = backendMeasures;
          const currentKeySignature = keySignature;
          
          // Process each measure to add accidentals based on measure context
          measures.forEach(measure => {
            const measureAccidentals = new Map<string, string>();
            measure.forEach((staveNote: any) => {
              if (staveNote._isClefMarker || staveNote._isTimeSignatureMarker || staveNote._isKeyMarker || staveNote._isOttavaMarker) {
                return;
              }
              const isRest = staveNote.duration?.includes('r') || staveNote.isRest?.() || staveNote.constructor.name === 'StaveRest';
              if (isRest) {
                return;
              }
              if (staveNote._lilypondPitch) {
                const pitch = staveNote._lilypondPitch;
                const octave = staveNote._lilypondOctave;
                addAccidentalIfNeeded(staveNote, pitch, currentKeySignature, 0, measureAccidentals, octave);
                if (staveNote._lilypondChordNotes && staveNote._lilypondChordNotes.length > 0) {
                  staveNote._lilypondChordNotes.forEach(([chordPitch, chordOctave]: [string, number], i: number) => {
                    addAccidentalIfNeeded(staveNote, chordPitch, currentKeySignature, i + 1, measureAccidentals, chordOctave);
                  });
                }
              }
            });
          });
          return measures;
        }
        
        // Backend must provide measures data
        return [];
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
    // measureRows keeps the start messure index for each row
    const measureRows: number[] = [];
    for (let i = 0; i < maxMeasures; i += measuresPerRow) {
      measureRows.push(i);
    }

    // Store lyric rendering info for later (after all notes are drawn)
    const renderingInfo: Array<{
      staffIndex: number;
      voiceIdx: number;
      lyrics: any[];
      notesPerRow: Array<any[]>; // notes for each row
      rowYPositions: number[]; // Y position for each row
      ottavaMarkers: Array<{
        startNoteIndex: number;
        endNoteIndex: number;
        ottavaValue: number;
      }>;
    }> = [];

    const bottomYPositions: number[][] = [];

    // Render each row
    measureRows.forEach((startMeasure, rowIndex) => {
      const endMeasure = Math.min(startMeasure + measuresPerRow, maxMeasures);
      const rowY = 40 + rowIndex * (totalStaffHeight + systemSpacing); // the start Y position for this row

      // Display measure number at the start of the row if showMeasureNumbers is enabled
      drawStartMeasureNumber(context, showMeasureNumbers, startMeasure, rowY, marginLeft);
      
      // Render each staff in this row
      staves.forEach((staff, staffIndex) => {
        bottomYPositions.push([]);
        const staffY = rowY + staffIndex * (staveHeight + staffSpacing);
        drawStaffForCurrentRow(context, 
          startMeasure, 
          endMeasure, 
          staffMeasures[staffIndex],
          staffY,
          staveWidth,
          bottomYPositions[staffIndex],
          marginLeft,
          ticksPerBeat,
          beatValue,
          numBeats,
          staff,
          rowIndex);

      });

      // Connect staves vertically with a single brace on the left side of the row
      if (staves.length > 1) {
        const firstStaveY = rowY;
        const lastStaveY = rowY + (staves.length - 1) * (staveHeight + staffSpacing);
        
        // Create temporary staves for the brace connector at the leftmost position
        const leftStave = new Stave(marginLeft, firstStaveY, 0);
        const rightStave = new Stave(marginLeft, lastStaveY, 0);
        
        // Set canvas style for brace connector
        context.strokeStyle = '#000000';
        context.lineWidth = 1;
        
        const connector = new StaveConnector(leftStave, rightStave);
        connector.setType(StaveConnector.type.BRACE);
        connector.setContext(context).draw();
      }
      
    });
    
    // Collect ottava rendering info AFTER all rows are rendered
    // Use the notes collected during rendering (from renderingInfo)
    // to ensure we use the correctly positioned notes
    staves.forEach((staff, staffIndex) => {
      const currentStaffVoices = staffVoicesData[staffIndex];
      
      currentStaffVoices.voices.forEach((voiceData: any, voiceIdx: number) => {
        collectRenderInfo(staffIndex,
          voiceIdx,
          voiceData.lyrics, 
          staffMeasures[staffIndex][voiceIdx],
          measureRows, 
          maxMeasures,
          bottomYPositions,
          renderingInfo);
      });
    });
    
    // Draw ottava, slurs, jianpu, lyrics after all notes are rendered
    // This allows lyrics to span across multiple rows
    // renderingInfo is per staff and voice. rowYPositions contains y positions for all the rows of a voice of a stave.
    renderingInfo.forEach((noteEntry) => {
      const { lyrics, notesPerRow, rowYPositions, ottavaMarkers, staffIndex } = noteEntry;
      // Flatten all notes from all rows, but filter out special note types
      const allNotes: any[] = [];
      
      notesPerRow.forEach((notes, rowIdx) => {
        notes.forEach(note => {
          // Skip clef markers, time signature markers, and rests                
          if (!(note._isClefMarker || note._isTimeSignatureMarker || note._isKeyMarker || note._isOttavaMarker || note._isRepeatStart || note._isRepeatEnd || note._isAlternative || note._isAlternativeEnd)) {
            allNotes.push(note);
          }
        });
      });
      
      if (allNotes.length === 0) return;

      // Draw ottava brackets using notes from renderingInfo
      // These notes are collected during rendering and have correct positions
      // Handle ottava that spans multiple rows by splitting into segments
      if (ottavaMarkers.length > 0) {
        drawOttavaMarkers(context, ottavaMarkers, allNotes, notesPerRow);
      }
      
      // Draw slurs after all notes are rendered (including cross-row slurs)
      drawSlursForNotes(context, allNotes, marginLeft);

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
        
        // if maxNoteBottom is less than rowYPositions[rowIdx], it means the note is very above the stave. 
        // so we use the bottom line of the stave plus jianpu padding as the position of jianpu or lyrics
        if (maxNoteBottom < rowYPositions[rowIdx]) {
          // console.log('maxNoteBottom', maxNoteBottom, rowYPositions[rowIdx], rowIdx);
          maxNoteBottomPerRow[rowIdx] = rowYPositions[rowIdx] + jianpuPadding;
        } else {
          // else we use the lowest note bottom as the position of jianpu or lyrics
          // maxNoteBottom is definitely bigger than 0.  
          maxNoteBottomPerRow[rowIdx] = maxNoteBottom > 0 ? maxNoteBottom + jianpuPadding : rowYPositions[rowIdx] + staveHeight + 5;        
        }
      }
      
      
      // Draw jianpu (simplified notation) if enabled
      if (showJianpu) {    
        const maxJianpuBottomPerRow: number[] = [];
        // if not drawing Jianpu, use maxNoteBottomPerRow as Lyrics bottom; if drawing, we have to
        // add the duration lines and dots below as Lyrics bottom
        const maxLyricsBottomPerRow: number[] = [];

        // Use Map to store note -> jianpuInfo mapping
        const jianpuInfos = new Map<any, ReturnType<typeof convertNoteToJianpu>>();

        for (let rowIdx = 0; rowIdx < notesPerRow.length; rowIdx++) {
          let maxJianpuBottom = maxNoteBottomPerRow[rowIdx];
          
          for (const note of notesPerRow[rowIdx]) {
            const jianpuInfo = convertNoteToJianpu(note);
            jianpuInfos.set(note, jianpuInfo);
            // if we need to show jianpu, we have to add dots above as Jianpu start position
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
            if (jianpuInfo) {
              // if we need to show jianpu, the Lyrics bottom is the max of the Jianpu bottom and the duration lines and dots below
              maxLyricsBottom = Math.max(maxLyricsBottom, maxJianpuBottomPerRow[rowIdx] 
                + (jianpuInfo.durationLines > 0 ? dotVerticalSpacing * jianpuInfo.durationLines : 0)
                + (jianpuInfo.dotsBelow > 0 ? dotVerticalSpacing * jianpuInfo.dotsBelow : 0));
            }
          }
          maxLyricsBottomPerRow[rowIdx] = maxLyricsBottom > 0? maxLyricsBottom : rowYPositions[rowIdx] + staveHeight + 5;
        }
        
        // Use common function to draw jianpu
        drawJianpuForNotes(context, allNotes, jianpuInfos, maxJianpuBottomPerRow);
        // use maxNoteBottomPerRow because we need to 和不显示简谱的时候保持一致
        maxNoteBottomPerRow = maxLyricsBottomPerRow;
      }
      
      // Use common function to draw lyrics
      drawLyricsForNotes(context, lyrics, allNotes, maxNoteBottomPerRow);


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
      {/* Music Info Header */}
      {musicData && (
        <div className="music-header">
          <div className="music-header-main">
            {musicData.title && (
              <h2 className="music-title">{musicData.title}</h2>
            )}
            <div className="music-header-right">
              {musicData.composer && (
                <p className="music-composer">{musicData.composer}</p>
              )}
              <div className="music-meta">
                {musicData.time_signature && (
                  <span className="meta-item">
                    <strong>拍号:</strong> {musicData.time_signature}
                  </span>
                )}
                {musicData.tempo && (
                  <span className="meta-item">
                    <strong>速度:</strong> {musicData.tempo}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
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