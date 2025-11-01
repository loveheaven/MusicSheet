import React, { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Play, Pause, Square, Music, Upload, Volume2, Download, Loader } from 'lucide-react';
import MusicNotation from './components/MusicNotation';
import AudioPlayer, { INSTRUMENT_SAMPLES } from './components/AudioPlayer';
import MenuDropdown from './components/MenuDropdown';
import SettingsDialog from './components/SettingsDialog';
import ExportDropdown from './components/ExportDropdown';
import './App.css';

type NoteType = 'Default' | 'Clef' | 'Chord' | 'Time';

interface LilyPondNote {
  pitch: string;
  duration: string;
  octave: number;
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

interface ParsedMusic {
  title?: string;
  composer?: string;
  tempo?: string;
  key_signature?: string;
  time_signature?: string;
  notes?: LilyPondNote[];
  staves?: Staff[];
}

function App() {
  const [musicData, setMusicData] = useState<ParsedMusic | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNoteIndices, setCurrentNoteIndices] = useState<Map<number, number>>(new Map());
  const [lilypondContent, setLilypondContent] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [measuresPerRow, setMeasuresPerRow] = useState(2);
  const [selectedInstrument, setSelectedInstrument] = useState('piano');
  const audioPlayerRef = useRef<any>(null);
  const exportButtonRef = useRef<HTMLDivElement>(null);

  // Get available instruments from AudioPlayer's INSTRUMENT_SAMPLES
  const availableInstruments = Object.keys(INSTRUMENT_SAMPLES);

  const loadSampleMusic = async () => {
    try {
      const sampleContent = await invoke<string>('get_sample_lilypond');
      setLilypondContent(sampleContent);
      console.log('Sample content:', sampleContent);
      const parsed = await invoke<ParsedMusic>('parse_lilypond_content', { content: sampleContent });
      console.log('Parsed music data:', parsed);
      const allNotes = parsed?.staves?.flatMap(staff => staff.notes || []) || parsed?.notes || [];
      console.log('Number of notes:', allNotes.length);
      setMusicData(parsed);
      
      // Initialize currentNoteIndices to highlight the first real note (not Clef/Time marker) of each staff
      const initialIndices = new Map<number, number>();
      if (parsed?.staves && parsed.staves.length > 0) {
        parsed.staves.forEach((staff, staffIndex) => {
          // Find the first note that is not a Clef or Time marker
          if (staff.notes && staff.notes.length > 0) {
            const firstRealNoteIndex = staff.notes.findIndex(
              note => note.note_type !== 'Clef' && note.note_type !== 'Time'
            );
            if (firstRealNoteIndex !== -1) {
              initialIndices.set(staffIndex, firstRealNoteIndex);
            }
          }
        });
      } else if (parsed?.notes && parsed.notes.length > 0) {
        // Find the first note that is not a Clef or Time marker
        const firstRealNoteIndex = parsed.notes.findIndex(
          note => note.note_type !== 'Clef' && note.note_type !== 'Time'
        );
        if (firstRealNoteIndex !== -1) {
          initialIndices.set(0, firstRealNoteIndex);
        }
      }
      setCurrentNoteIndices(initialIndices);
    } catch (error) {
      console.error('Error loading sample music:', error);
    }
  };

  const openFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'LilyPond Files',
          extensions: ['ly', 'ily']
        }]
      });

      if (selected) {
        const parsed = await invoke<ParsedMusic>('parse_lilypond_file', { filePath: selected });
        setMusicData(parsed);
        
        // Initialize currentNoteIndices to highlight the first real note (not Clef/Time marker) of each staff
        const initialIndices = new Map<number, number>();
        if (parsed?.staves && parsed.staves.length > 0) {
          parsed.staves.forEach((staff, staffIndex) => {
            // Find the first note that is not a Clef or Time marker
            const firstRealNoteIndex = staff.notes.findIndex(
              note => note.note_type !== 'Clef' && note.note_type !== 'Time'
            );
            if (firstRealNoteIndex !== -1) {
              initialIndices.set(staffIndex, firstRealNoteIndex);
            }
          });
        } else if (parsed?.notes && parsed.notes.length > 0) {
          // Find the first note that is not a Clef or Time marker
          const firstRealNoteIndex = parsed.notes.findIndex(
            note => note.note_type !== 'Clef' && note.note_type !== 'Time'
          );
          if (firstRealNoteIndex !== -1) {
            initialIndices.set(0, firstRealNoteIndex);
          }
        }
        setCurrentNoteIndices(initialIndices);
      }
    } catch (error) {
      console.error('Error opening file:', error);
    }
  };

  const handlePlay = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop();
      // Don't set state here - let AudioPlayer handle it through callbacks
    }
  };

  const handleExportClick = () => {
    setIsExportDropdownOpen(!isExportDropdownOpen);
  };

  const handleExport = async (format: 'mp3' | 'wav' | 'midi') => {
    try {
      setIsExporting(true);
      if (audioPlayerRef.current) {
        await audioPlayerRef.current.export(format);
      }
      setIsExportDropdownOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportClose = () => {
    setIsExportDropdownOpen(false);
  };

  const handleNoteProgress = (staffIndex: number, noteIndex: number) => {
    setCurrentNoteIndices(prev => {
      const newMap = new Map(prev);
      newMap.set(staffIndex, noteIndex);
      return newMap;
    });
  };

  const handlePlaybackEnd = () => {
    setIsPlaying(false);
    setCurrentNoteIndices(new Map());
  };

  const handleImportMusic = () => {
    openFile();
  };

  const handleSettings = () => {
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setIsSettingsOpen(false);
  };

  useEffect(() => {
    loadSampleMusic();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="title-section">
            <Music className="app-icon" />
            <h1>Music Sheet Reader</h1>
          </div>
          <div className="header-actions">
            <button onClick={loadSampleMusic} className="btn btn-primary">
              Load Sample
            </button>
            <MenuDropdown 
              onImportMusic={handleImportMusic}
              onSettings={handleSettings}
            />
          </div>
        </div>
      </header>

      <main className="main-content">
        {musicData ? (
          <>
            <div className="music-info">
              <div className="info-grid">
                {musicData.title && (
                  <div className="info-item">
                    <label>Title:</label>
                    <span>{musicData.title}</span>
                  </div>
                )}
                {musicData.composer && (
                  <div className="info-item">
                    <label>Composer:</label>
                    <span>{musicData.composer}</span>
                  </div>
                )}
                {musicData.key_signature && (
                  <div className="info-item">
                    <label>Key:</label>
                    <span>{musicData.key_signature}</span>
                  </div>
                )}
                {musicData.time_signature && (
                  <div className="info-item">
                    <label>Time:</label>
                    <span>{musicData.time_signature}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="controls">
              <div className="controls-left">
                <div className="instrument-control">
                  <label htmlFor="instrumentSelect">乐器:</label>
                  <select 
                    id="instrumentSelect"
                    value={selectedInstrument} 
                    onChange={(e) => setSelectedInstrument(e.target.value)}
                    className="instrument-select"
                    disabled={isPlaying || isExporting}
                  >
                    {availableInstruments.map(instrument => (
                      <option key={instrument} value={instrument}>
                        {instrument.charAt(0).toUpperCase() + instrument.slice(1).replace('-', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="controls-right">
                <button 
                  onClick={handlePlay} 
                  disabled={isPlaying || isExporting}
                  className="btn btn-play"
                >
                  <Play size={20} />
                  Play
                </button>
                <button 
                  onClick={handlePause} 
                  disabled={!isPlaying}
                  className="btn btn-pause"
                >
                  <Pause size={20} />
                  Pause
                </button>
                <button 
                  onClick={handleStop}
                  className="btn btn-stop"
                >
                  <Square size={20} />
                  Stop
                </button>
                <div className="export-button-wrapper" ref={exportButtonRef}>
                  <button 
                    onClick={handleExportClick}
                    disabled={isExporting}
                    className="btn btn-export"
                  >
                    {isExporting ? (
                      <Loader size={20} className="icon-spinning" />
                    ) : (
                      <Download size={20} />
                    )}
                    Export
                  </button>
                  <ExportDropdown
                    isOpen={isExportDropdownOpen}
                    isExporting={isExporting}
                    onExport={handleExport}
                    onClose={handleExportClose}
                  />
                </div>
              </div>
            </div>

            <div className="layout-controls">
              <div className="measures-per-row-control">
                <label htmlFor="measuresPerRow">每行小节数:</label>
                <select 
                  id="measuresPerRow"
                  value={measuresPerRow} 
                  onChange={(e) => setMeasuresPerRow(Number(e.target.value))}
                  className="measures-select"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                  <option value={6}>6</option>
                </select>
              </div>
            </div>

            <div className="notation-container">
              <MusicNotation 
                musicData={musicData} 
                currentNoteIndices={currentNoteIndices}
                measuresPerRow={measuresPerRow}
              />
            </div>

            <AudioPlayer
              ref={audioPlayerRef}
              staves={musicData?.staves}
              notes={musicData?.notes}
              onNoteProgress={handleNoteProgress}
              onPlaybackEnd={handlePlaybackEnd}
              selectedInstrument={selectedInstrument}
            />
          </>
        ) : (
          <div className="empty-state">
            <Music size={64} className="empty-icon" />
            <h2>No Music Loaded</h2>
            <p>Open a LilyPond file or load a sample to get started</p>
            <div className="empty-actions">
              <button onClick={openFile} className="btn btn-primary">
                <Upload size={16} />
                Open File
              </button>
              <button onClick={loadSampleMusic} className="btn btn-secondary">
                Load Sample
              </button>
            </div>
          </div>
        )}
      </main>

      <SettingsDialog 
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
      />
    </div>
  );
}

export default App;