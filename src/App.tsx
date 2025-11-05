import { useState, useRef, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { Play, Pause, Square, Music, Upload, Download, Loader } from 'lucide-react';
import MusicNotation from './components/MusicNotation';
import AudioPlayer, { INSTRUMENT_SAMPLES } from './components/AudioPlayer';
import MenuDropdown from './components/MenuDropdown';
import SettingsDialog from './components/SettingsDialog';
import ExportDropdown from './components/ExportDropdown';
import type { ParsedMusic } from './utils/musicMaps';
import './App.css';

function App() {
  const [musicData, setMusicData] = useState<ParsedMusic | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentNoteIndices, setCurrentNoteIndices] = useState<Map<number, number>>(new Map());
  const [lilypondContent, setLilypondContent] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [measuresPerRow, setMeasuresPerRow] = useState(() => {
    const saved = localStorage.getItem('measuresPerRow');
    return saved ? parseInt(saved, 10) : 2;
  });
  const [selectedInstrument, setSelectedInstrument] = useState(() => {
    return localStorage.getItem('selectedInstrument') || 'piano';
  });
  const [staffInstruments, setStaffInstruments] = useState<Map<number, string>>(new Map());
  const [staffVolumes, setStaffVolumes] = useState<Map<number, boolean>>(new Map());
  const [showJianpu, setShowJianpu] = useState(() => {
    const saved = localStorage.getItem('showJianpu');
    return saved ? JSON.parse(saved) : false;
  });
  const [tempo, setTempo] = useState(() => {
    const saved = localStorage.getItem('tempo');
    return saved ? parseFloat(saved) : 1.0;
  });
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
      const allNotes = parsed?.staves?.flatMap(staff => staff.notes || []) || [];
      console.log('Number of notes:', allNotes.length);
      setMusicData(parsed);
      
      // Initialize currentNoteIndices to highlight the first real note (not Clef/Time marker) of each staff
      const initialIndices = new Map<number, number>();
      if (parsed?.staves && parsed.staves.length > 0) {
        parsed.staves.forEach((staff, staffIndex) => {
          // Check if staff has voices or notes
          if (staff.voices && staff.voices.length > 0) {
            // For multi-voice staves, find first real note in first voice
            const firstVoice = staff.voices[0];
            const firstRealNoteIndex = firstVoice.base.notes.findIndex(
              note => note.note_type !== 'Clef' && note.note_type !== 'Time'
            );
            if (firstRealNoteIndex !== -1) {
              initialIndices.set(staffIndex, firstRealNoteIndex);
            }
          } else if (staff.notes && staff.notes.length > 0) {
            // Find the first note that is not a Clef or Time marker
            const firstRealNoteIndex = staff.notes.findIndex(
              note => note.note_type !== 'Clef' && note.note_type !== 'Time'
            );
            if (firstRealNoteIndex !== -1) {
              initialIndices.set(staffIndex, firstRealNoteIndex);
            }
          }
        });
        
        // Initialize staff instruments and volumes
        const newStaffInstruments = new Map<number, string>();
        const newStaffVolumes = new Map<number, boolean>();
        
        // Try to restore staffInstruments from localStorage
        const savedInstruments = localStorage.getItem('staffInstruments');
        const instrumentsMap = savedInstruments ? JSON.parse(savedInstruments) : {};
        
        parsed.staves.forEach((_, staffIndex) => {
          // Use saved instrument if available, otherwise use selectedInstrument
          newStaffInstruments.set(staffIndex, instrumentsMap[staffIndex] || selectedInstrument);
          newStaffVolumes.set(staffIndex, true);
        });
        setStaffInstruments(newStaffInstruments);
        setStaffVolumes(newStaffVolumes);
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
            // Check if staff has voices or notes
            if (staff.voices && staff.voices.length > 0) {
              // For multi-voice staves, find first real note in first voice
              const firstVoice = staff.voices[0];
              const firstRealNoteIndex = firstVoice.base.notes.findIndex(
                note => note.note_type !== 'Clef' && note.note_type !== 'Time'
              );
              if (firstRealNoteIndex !== -1) {
                initialIndices.set(staffIndex, firstRealNoteIndex);
              }
            } else if (staff.notes && staff.notes.length > 0) {
              // Find the first note that is not a Clef or Time marker
              const firstRealNoteIndex = staff.notes.findIndex(
                note => note.note_type !== 'Clef' && note.note_type !== 'Time'
              );
              if (firstRealNoteIndex !== -1) {
                initialIndices.set(staffIndex, firstRealNoteIndex);
              }
            }
          });
          
          // Initialize staff instruments and volumes
          const newStaffInstruments = new Map<number, string>();
          const newStaffVolumes = new Map<number, boolean>();
          
          // Try to restore staffInstruments from localStorage
          const savedInstruments = localStorage.getItem('staffInstruments');
          const instrumentsMap = savedInstruments ? JSON.parse(savedInstruments) : {};
          
          parsed.staves.forEach((_, staffIndex) => {
            // Use saved instrument if available, otherwise use selectedInstrument
            newStaffInstruments.set(staffIndex, instrumentsMap[staffIndex] || selectedInstrument);
            newStaffVolumes.set(staffIndex, true);
          });
          setStaffInstruments(newStaffInstruments);
          setStaffVolumes(newStaffVolumes);
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
      setIsPlaying(false);
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
    // Don't clear note indices here - let them stay on the first note
    // They will be reset when playback starts again
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

  // Save measuresPerRow to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('measuresPerRow', measuresPerRow.toString());
  }, [measuresPerRow]);

  // Save selectedInstrument to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('selectedInstrument', selectedInstrument);
  }, [selectedInstrument]);

  // Save staffInstruments to localStorage whenever it changes
  useEffect(() => {
    if (staffInstruments.size > 0) {
      const instrumentsObj: Record<number, string> = {};
      staffInstruments.forEach((value, key) => {
        instrumentsObj[key] = value;
      });
      localStorage.setItem('staffInstruments', JSON.stringify(instrumentsObj));
    }
  }, [staffInstruments]);

  // Save showJianpu to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('showJianpu', JSON.stringify(showJianpu));
  }, [showJianpu]);

  // Save tempo to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('tempo', tempo.toString());
  }, [tempo]);

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
                {musicData?.staves && musicData.staves.length > 0 ? (
                  <div className="staff-controls-container">
                    {musicData.staves.map((staff, staffIndex) => (
                      <div key={staffIndex} className="staff-control-row">
                        <div className="instrument-control">
                          <label htmlFor={`instrumentSelect-${staffIndex}`}>
                            {staff.name || `Staff ${staffIndex + 1}`}:
                          </label>
                          <select 
                            id={`instrumentSelect-${staffIndex}`}
                            value={staffInstruments.get(staffIndex) || selectedInstrument} 
                            onChange={(e) => {
                              const newInstruments = new Map(staffInstruments);
                              newInstruments.set(staffIndex, e.target.value);
                              setStaffInstruments(newInstruments);
                            }}
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
                        <div className="volume-toggle">
                          <button
                            onClick={() => {
                              const newVolumes = new Map(staffVolumes);
                              newVolumes.set(staffIndex, !newVolumes.get(staffIndex));
                              setStaffVolumes(newVolumes);
                            }}
                            className={`volume-switch ${staffVolumes.get(staffIndex) ? 'volume-on' : 'volume-off'}`}
                            disabled={isPlaying || isExporting}
                            title={staffVolumes.get(staffIndex) ? '音量开启' : '音量关闭'}
                          >
                            <span className="volume-switch-slider"></span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
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
                )}
              </div>
              <div className="controls-right">
                <div className="tempo-control">
                  <label htmlFor="tempoControl">速度:</label>
                  <input
                    id="tempoControl"
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={tempo}
                    onChange={(e) => setTempo(parseFloat(e.target.value))}
                    disabled={isPlaying || isExporting}
                    className="tempo-slider"
                  />
                  <span className="tempo-value">{tempo.toFixed(1)}x</span>
                </div>
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
                    disabled={isExporting || isPlaying}
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
              <div className="jianpu-toggle-control">
                <label htmlFor="showJianpu">显示简谱:</label>
                <button
                  id="showJianpu"
                  onClick={() => setShowJianpu(!showJianpu)}
                  className={`jianpu-switch ${showJianpu ? 'jianpu-on' : 'jianpu-off'}`}
                  title={showJianpu ? '简谱已开启' : '简谱已关闭'}
                >
                  <span className="jianpu-switch-slider"></span>
                </button>
              </div>
            </div>

            <div className="notation-container">
              <MusicNotation 
                musicData={musicData} 
                currentNoteIndices={currentNoteIndices}
                measuresPerRow={measuresPerRow}
                showJianpu={showJianpu}
              />
            </div>

            <AudioPlayer
              ref={audioPlayerRef}
              staves={musicData?.staves}
              onNoteProgress={handleNoteProgress}
              onPlaybackEnd={handlePlaybackEnd}
              selectedInstrument={selectedInstrument}
              staffInstruments={staffInstruments}
              staffVolumes={staffVolumes}
              tempo={tempo}
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
