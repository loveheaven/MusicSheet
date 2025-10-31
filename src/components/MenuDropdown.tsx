import React, { useState, useRef, useEffect } from 'react';
import { Menu, Upload, Settings } from 'lucide-react';
import './MenuDropdown.css';

interface MenuDropdownProps {
  onImportMusic: () => void;
  onSettings: () => void;
}

const MenuDropdown: React.FC<MenuDropdownProps> = ({ onImportMusic, onSettings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="menu-dropdown" ref={menuRef}>
      <button 
        className="menu-button"
        onClick={toggleMenu}
        aria-label="菜单"
      >
        <Menu size={20} />
      </button>
      
      {isOpen && (
        <div className="menu-content">
          <button 
            className="menu-item"
            onClick={() => handleMenuItemClick(onImportMusic)}
          >
            <Upload size={16} />
            <span>导入歌谱</span>
          </button>
          <button 
            className="menu-item"
            onClick={() => handleMenuItemClick(onSettings)}
          >
            <Settings size={16} />
            <span>设置</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default MenuDropdown;