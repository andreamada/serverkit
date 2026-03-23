import React from 'react';
import { X, Terminal, Code } from 'lucide-react';

const ScriptConfigPanel = ({ node, onChange, onClose }) => {
    const { data } = node;
    const {
        language = 'bash',
        label = 'Run Script',
        content = '',
        timeout = 300,
        retryCount = 0,
        retryDelay = 5
    } = data;

    return (
        <div className="config-panel">
            <div className="panel-header">
                <h3>Script Configuration</h3>
                <button onClick={onClose}><X size={18} /></button>
            </div>

            <div className="panel-body">
                <div className="form-group">
                    <label>Node Label</label>
                    <input
                        type="text"
                        value={label}
                        onChange={(e) => onChange({ ...data, label: e.target.value })}
                    />
                </div>

                <div className="form-group">
                    <label>Language</label>
                    <div className="flex gap-2">
                        <button
                            className={`flex-1 p-2 rounded border flex items-center justify-center gap-2 ${language === 'bash' ? 'bg-gray-700 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                            onClick={() => onChange({ ...data, language: 'bash' })}
                        >
                            <Terminal size={14} />
                            <span>Bash</span>
                        </button>
                        <button
                            className={`flex-1 p-2 rounded border flex items-center justify-center gap-2 ${language === 'python' ? 'bg-gray-700 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                            onClick={() => onChange({ ...data, language: 'python' })}
                        >
                            <Code size={14} />
                            <span>Python</span>
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label>Script Content</label>
                    <textarea
                        className="font-mono text-xs bg-gray-900 border-gray-700 rounded p-2 h-64 focus:border-blue-500 focus:outline-none"
                        value={content}
                        onChange={(e) => onChange({ ...data, content: e.target.value })}
                        placeholder={language === 'bash' ? "#!/bin/bash\necho 'Hello World'" : "print('Hello World')"}
                    />
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <div className="form-group">
                        <label>Timeout (s)</label>
                        <input
                            type="number"
                            min="1"
                            max="3600"
                            value={timeout}
                            onChange={(e) => onChange({ ...data, timeout: parseInt(e.target.value) || 300 })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Retries</label>
                        <input
                            type="number"
                            min="0"
                            max="5"
                            value={retryCount}
                            onChange={(e) => onChange({ ...data, retryCount: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="form-group">
                        <label>Delay (s)</label>
                        <input
                            type="number"
                            min="1"
                            max="300"
                            value={retryDelay}
                            onChange={(e) => onChange({ ...data, retryDelay: parseInt(e.target.value) || 5 })}
                        />
                    </div>
                </div>

                <div className="mt-4 p-3 bg-blue-900/20 rounded border border-blue-500/30">
                    <p className="text-[10px] text-blue-300">
                        <strong>Variables:</strong><br />
                        <code className="text-blue-200">{'${node_id.stdout}'}</code> — output from a previous node<br />
                        <code className="text-blue-200">$NODE_ID_OUTPUT</code> — same, as env var<br />
                        <code className="text-blue-200">$WORKFLOW_ID</code>, <code className="text-blue-200">$EXECUTION_ID</code> — workflow metadata
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ScriptConfigPanel;
