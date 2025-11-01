import React, { useRef, useEffect, useState } from 'react';
import { Download, FileAudio, Music } from 'lucide-react';
import './ExportDropdown.css';

type ExportFormat = 'mp3' | 'wav' | 'midi';

interface ExportDropdownProps {
  isOpen: boolean;
  isExporting: boolean;
  onExport: (format: ExportFormat) => void;
  onClose: () => void;
}

interface Position {
  top: number;
  left: number;
}

const ExportDropdown: React.FC<ExportDropdownProps> = ({ isOpen, isExporting, onExport, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // 检查是否点击了 export 按钮
        const exportButton = document.querySelector('.btn-export');
        if (exportButton && !exportButton.contains(event.target as Node)) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      // 获取 export 按钮的位置
      const exportButton = document.querySelector('.btn-export') as HTMLElement;
      if (exportButton) {
        const rect = exportButton.getBoundingClientRect();
        // 菜单显示在按钮下方，右对齐
        setPosition({
          top: rect.bottom + 8,
          left: rect.right - 200 // 菜单宽度为 200px，所以右对齐
        });
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleExport = (format: ExportFormat) => {
    onExport(format);
    onClose();
  };

  return (
    <div 
      className="export-dropdown" 
      ref={dropdownRef}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
    >
      <div className="export-menu">
        <button
          className="export-item"
          onClick={() => handleExport('wav')}
          disabled={isExporting}
        >
          <FileAudio size={16} />
          <div className="export-item-content">
            <span className="export-item-name">WAV</span>
            <span className="export-item-desc">无损音频格式</span>
          </div>
        </button>

        <button
          className="export-item"
          onClick={() => handleExport('mp3')}
          disabled={isExporting}
        >
          <Music size={16} />
          <div className="export-item-content">
            <span className="export-item-name">MP3</span>
            <span className="export-item-desc">有损压缩格式</span>
          </div>
        </button>

        <button
          className="export-item"
          onClick={() => handleExport('midi')}
          disabled={isExporting}
        >
          <Download size={16} />
          <div className="export-item-content">
            <span className="export-item-name">MIDI</span>
            <span className="export-item-desc">音乐数据格式</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ExportDropdown;
