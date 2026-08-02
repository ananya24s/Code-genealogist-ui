import React, { useState, useEffect } from 'react';
import { Search, FileCode, ChevronRight, AlertCircle } from 'lucide-react';
import './RepoExplorer.css';

const SUPPORTED_EXTENSIONS = ['py', 'js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx'];

function getExtension(path) {
  const parts = path.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export default function RepoExplorer({ repo, token, onFunctionSelected }) {
  const [files, setFiles] = useState([]);
  const [fileSearch, setFileSearch] = useState('');
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState('');

  const [selectedFile, setSelectedFile] = useState(null);
  const [functions, setFunctions] = useState([]);
  const [functionsLoading, setFunctionsLoading] = useState(false);
  const [functionsError, setFunctionsError] = useState('');

  const [manualMode, setManualMode] = useState(false);
  const [manualFilePath, setManualFilePath] = useState('');
  const [manualFunctionName, setManualFunctionName] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchTree() {
      setFilesLoading(true);
      setFilesError('');
      try {
        const ref = repo.default_branch || 'HEAD';
        const response = await fetch(
          `https://api.github.com/repos/${repo.full_name}/git/trees/${ref}?recursive=1`,
          { headers: { Authorization: `token ${token}` } }
        );
        if (!response.ok) {
          throw new Error('Could not load files for this repository.');
        }
        const data = await response.json();
        const blobs = (data.tree || []).filter(
          (item) => item.type === 'blob' && SUPPORTED_EXTENSIONS.includes(getExtension(item.path))
        );
        if (!cancelled) setFiles(blobs);
      } catch (err) {
        if (!cancelled) setFilesError(err.message);
      } finally {
        if (!cancelled) setFilesLoading(false);
      }
    }

    fetchTree();
    return () => { cancelled = true; };
  }, [repo, token]);

  const filteredFiles = fileSearch
    ? files.filter((f) => f.path.toLowerCase().includes(fileSearch.toLowerCase()))
    : files;

  const handleSelectFile = async (path) => {
    setSelectedFile(path);
    setFunctions([]);
    setFunctionsError('');
    setFunctionsLoading(true);
    try {
      const ref = repo.default_branch || 'HEAD';
      const contentResponse = await fetch(
        `https://api.github.com/repos/${repo.full_name}/contents/${path}?ref=${ref}`,
        { headers: { Authorization: `token ${token}` } }
      );
      if (!contentResponse.ok) {
        throw new Error('Could not load this file.');
      }
      const contentData = await contentResponse.json();
      const code = atob(contentData.content.replace(/\n/g, ''));

      const functionsResponse = await fetch('https://codegenealogist.onrender.com/functions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, file_path: path })
      });
      if (!functionsResponse.ok) {
        throw new Error('Could not analyze this file.');
      }
      const functionsData = await functionsResponse.json();
      setFunctions(functionsData.functions || []);
    } catch (err) {
      setFunctionsError(err.message);
    } finally {
      setFunctionsLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualFilePath || !manualFunctionName) return;
    onFunctionSelected({ filePath: manualFilePath, functionName: manualFunctionName });
  };

  return (
    <div className="explorer-container">
      <div className="explorer-header">
        <h1>Explore {repo?.name}</h1>
        <p className="explorer-subtitle">Pick a file, then pick a function to analyze</p>
      </div>

      <div className="explorer-grid">
        <div className="explorer-panel">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search files..."
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="explorer-list">
            {filesLoading && <p className="explorer-hint">Loading files...</p>}
            {filesError && (
              <div className="explorer-error">
                <AlertCircle size={16} />
                <span>{filesError}</span>
              </div>
            )}
            {!filesLoading && !filesError && filteredFiles.length === 0 && (
              <p className="explorer-hint">
                {fileSearch ? 'No files match your search.' : 'No supported files found in this repository.'}
              </p>
            )}
            {!filesLoading && filteredFiles.map((file) => (
              <button
                key={file.path}
                className={`explorer-item ${selectedFile === file.path ? 'active' : ''}`}
                onClick={() => handleSelectFile(file.path)}
              >
                <FileCode size={16} className="explorer-item-icon" />
                <span className="explorer-item-label">{file.path}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="explorer-panel">
          <h3 className="explorer-panel-title">Functions</h3>

          {!selectedFile && (
            <p className="explorer-hint">Select a file to see its functions.</p>
          )}

          {selectedFile && functionsLoading && (
            <p className="explorer-hint">Scanning {selectedFile}...</p>
          )}

          {functionsError && (
            <div className="explorer-error">
              <AlertCircle size={16} />
              <span>{functionsError}</span>
            </div>
          )}

          {selectedFile && !functionsLoading && !functionsError && functions.length === 0 && (
            <p className="explorer-hint">
              No functions detected in this file. Try entering the details manually below.
            </p>
          )}

          <div className="explorer-list">
            {!functionsLoading && functions.map((fn) => (
              <button
                key={fn.name}
                className="explorer-item"
                onClick={() => onFunctionSelected({ filePath: selectedFile, functionName: fn.name })}
              >
                <span className="explorer-item-label">{fn.name}</span>
                <span className="explorer-item-meta">line {fn.line}</span>
              </button>
            ))}
          </div>

          <button className="manual-toggle" onClick={() => setManualMode(!manualMode)}>
            {manualMode ? 'Hide manual entry' : "Can't find your function? Enter manually"}
            <ChevronRight size={14} style={{ transform: manualMode ? 'rotate(90deg)' : 'rotate(0deg)' }} />
          </button>

          {manualMode && (
            <div className="manual-form">
              <input
                type="text"
                placeholder="File path, e.g. src/utils/helpers.ts"
                value={manualFilePath}
                onChange={(e) => setManualFilePath(e.target.value)}
                className="form-input"
              />
              <input
                type="text"
                placeholder="Function name, e.g. calculateTotal"
                value={manualFunctionName}
                onChange={(e) => setManualFunctionName(e.target.value)}
                className="form-input"
              />
              <button
                className="analyze-btn"
                onClick={handleManualSubmit}
                disabled={!manualFilePath || !manualFunctionName}
              >
                Analyze Function
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
