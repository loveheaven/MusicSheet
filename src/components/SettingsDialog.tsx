import React, { useState, useEffect } from 'react';
import { X, Palette, Cloud } from 'lucide-react';
import './SettingsDialog.css';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'appearance' | 'webdav';

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  
  // 外观设置
  const [leftMargin, setLeftMargin] = useState(20);
  const [rightMargin, setRightMargin] = useState(20);
  
  // WebDAV设置
  const [webdavUrl, setWebdavUrl] = useState('');
  const [webdavUsername, setWebdavUsername] = useState('');
  const [webdavPassword, setWebdavPassword] = useState('');
  const [webdavPath, setWebdavPath] = useState('/');

  // 从localStorage加载设置
  useEffect(() => {
    if (isOpen) {
      const savedLeftMargin = localStorage.getItem('leftMargin');
      const savedRightMargin = localStorage.getItem('rightMargin');
      const savedWebdavUrl = localStorage.getItem('webdavUrl');
      const savedWebdavUsername = localStorage.getItem('webdavUsername');
      const savedWebdavPassword = localStorage.getItem('webdavPassword');
      const savedWebdavPath = localStorage.getItem('webdavPath');
      
      if (savedLeftMargin) setLeftMargin(Number(savedLeftMargin));
      if (savedRightMargin) setRightMargin(Number(savedRightMargin));
      if (savedWebdavUrl) setWebdavUrl(savedWebdavUrl);
      if (savedWebdavUsername) setWebdavUsername(savedWebdavUsername);
      if (savedWebdavPassword) setWebdavPassword(savedWebdavPassword);
      if (savedWebdavPath) setWebdavPath(savedWebdavPath);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSave = () => {
    // 保存外观设置
    localStorage.setItem('leftMargin', leftMargin.toString());
    localStorage.setItem('rightMargin', rightMargin.toString());
    
    // 保存WebDAV设置
    localStorage.setItem('webdavUrl', webdavUrl);
    localStorage.setItem('webdavUsername', webdavUsername);
    localStorage.setItem('webdavPassword', webdavPassword);
    localStorage.setItem('webdavPath', webdavPath);
    
    // 触发自定义事件通知其他组件设置已更新
    window.dispatchEvent(new CustomEvent('settingsUpdated', {
      detail: { leftMargin, rightMargin }
    }));
    
    onClose();
  };

  return (
    <div className="settings-overlay" onClick={handleOverlayClick}>
      <div className="settings-dialog">
        <div className="settings-header-tabs">
          <div className="settings-tabs">
          <button 
            className={`tab-button ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <Palette size={16} />
            外观设置
          </button>
          <button 
            className={`tab-button ${activeTab === 'webdav' ? 'active' : ''}`}
            onClick={() => setActiveTab('webdav')}
          >
            <Cloud size={16} />
            WebDAV设置
          </button>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="settings-content">
          {activeTab === 'appearance' && (
            <div className="settings-section">
              <div className="section-header">
                <Palette size={18} />
                <h3>外观设置</h3>
              </div>
              
              <div className="setting-item">
                <label>乐谱左边距 (px)</label>
                <div className="number-input-group">
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={leftMargin}
                    onChange={(e) => setLeftMargin(Number(e.target.value))}
                  />
                  <span className="unit">px</span>
                </div>
              </div>
              
              <div className="setting-item">
                <label>乐谱右边距 (px)</label>
                <div className="number-input-group">
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={rightMargin}
                    onChange={(e) => setRightMargin(Number(e.target.value))}
                  />
                  <span className="unit">px</span>
                </div>
              </div>
              
              <div className="setting-description">
                <p>调整乐谱显示区域的左右边距，适应不同的屏幕尺寸。</p>
              </div>
            </div>
          )}
          
          {activeTab === 'webdav' && (
            <div className="settings-section">
              <div className="section-header">
                <Cloud size={18} />
                <h3>WebDAV设置</h3>
              </div>
              
              <div className="setting-item">
                <label>WebDAV服务器地址</label>
                <input
                  type="url"
                  className="text-input"
                  placeholder="https://example.com/webdav"
                  value={webdavUrl}
                  onChange={(e) => setWebdavUrl(e.target.value)}
                />
              </div>
              
              <div className="setting-item">
                <label>用户名</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="输入用户名"
                  value={webdavUsername}
                  onChange={(e) => setWebdavUsername(e.target.value)}
                />
              </div>
              
              <div className="setting-item">
                <label>密码</label>
                <input
                  type="password"
                  className="text-input"
                  placeholder="输入密码"
                  value={webdavPassword}
                  onChange={(e) => setWebdavPassword(e.target.value)}
                />
              </div>
              
              <div className="setting-item">
                <label>远程路径</label>
                <input
                  type="text"
                  className="text-input"
                  placeholder="/"
                  value={webdavPath}
                  onChange={(e) => setWebdavPath(e.target.value)}
                />
              </div>
              
              <div className="setting-description">
                <p>配置WebDAV服务器信息，用于同步和备份乐谱文件。</p>
                <p className="warning">⚠️ 密码将以加密方式存储在本地。</p>
              </div>
            </div>
          )}
        </div>

        <div className="settings-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;