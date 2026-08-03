import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, AlertCircle } from 'lucide-react';
import './RepoExplorer.css';

const SUPPORTED_EXTENSIONS = ['py', 'js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx'];

const KIND_LABELS = {
  'python-def': 'DEF',
  'js-function': 'FN',
  'js-arrow': 'ARROW',
};

function getExtension(path) {
  const parts = path.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

function fileName(path) {
  return path.split('/').pop();
}

function ScanningLabel({ text }) {
  return (
    <div className="scanning-label">
      <span>{text}</span>
      <span className="scanning-bar" aria-hidden="true"><span className="scanning-bar-fill" /></span>
    </div>
  );
}

export default function RepoExplorer({ repo, token, onFunctionSelected }) {
  const [files, setFiles] = useState([]);
  const [fileSearch, setFileSearch] = useState('');
  const [filesLoading, setFilesLoading] = useState(true);
  const [filesError, setFilesError] = useState('');

  const [view, setView] = useState('files');
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
    setView('functions');
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
      <div className="explorer-trail">
        <span className="trail-segment trail-repo">
          <span className="trail-label">REPO</span>
          <span className="trail-value">{repo?.name}</span>
        </span>
        <ChevronRight size={13} className="trail-arrow" aria-hidden="true" />
        <button
          className={`trail-segment trail-clickable ${view === 'files' ? 'is-current' : ''}`}
          onClick={() => setView('files')}
        >
          <span className="trail-label">FILE</span>
          <span className="trail-value">{selectedFile ? fileName(selectedFile) : '—'}</span>
        </button>
        <ChevronRight size={13} className="trail-arrow" aria-hidden="true" />
        <button
          className={`trail-segment trail-clickable ${view === 'functions' ? 'is-current' : ''}`}
          onClick={() => selectedFile && setView('functions')}
          disabled={!selectedFile}
        >
          <span className="trail-label">FUNCTION</span>
          <span className="trail-value">{functions.length ? `${functions.length} found` : '—'}</span>
        </button>
        <span className="trail-rule" aria-hidden="true" />
      </div>

      {view === 'files' ? (
        <div className="explorer-panel" key="files">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search files..."
              value={fileSearch}
              onChange={(e) => setFileSearch(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="explorer-list">
            {filesLoading && <ScanningLabel text="Loading repository tree" />}
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
            {!filesLoading && filteredFiles.map((file, i) => (
              <button
                key={file.path}
                className={`file-row ${selectedFile === file.path ? 'active' : ''}`}
                onClick={() => handleSelectFile(file.path)}
              >
                <span className="file-row-index">{String(i + 1).padStart(3, '0')}</span>
                <span className={`file-kind kind-${getExtension(file.path)}`}>{getExtension(file.path)}</span>
                <span className="file-row-label">{file.path}</span>
                <ChevronRight size={14} className="file-row-arrow" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="explorer-panel" key="functions">
          {functionsLoading && <ScanningLabel text={`Scanning ${fileName(selectedFile)}`} />}

          {functionsError && (
            <div className="explorer-error">
              <AlertCircle size={16} />
              <span>{functionsError}</span>
            </div>
          )}

          {!functionsLoading && !functionsError && functions.length === 0 && (
            <p className="explorer-hint">
              No functions detected in this file. Try entering the details manually below.
            </p>
          )}

          {!functionsLoading && functions.length > 0 && (
            <div className="specimen-grid">
              {functions.map((fn, i) => (
                <button
                  key={fn.name}
                  className="specimen-card"
                  onClick={() => onFunctionSelected({ filePath: selectedFile, functionName: fn.name })}
                >
                  <span className="specimen-card-bracket specimen-card-bracket--tl" />
                  <span className="specimen-card-bracket specimen-card-bracket--br" />
                  <span className="specimen-index">{String(i + 1).padStart(2, '0')}</span>
                  <span className={`specimen-kind kind-${fn.kind}`}>{KIND_LABELS[fn.kind] || fn.kind}</span>
                  <span className="specimen-name">{fn.name}</span>
                  <span className="specimen-line">LINE {fn.line}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

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
  );
}
