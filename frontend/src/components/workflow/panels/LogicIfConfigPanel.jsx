import { X } from 'lucide-react';

const LogicIfConfigPanel = ({ node, onChange, onClose }) => {
    const { data } = node;
    const { condition = '', label = 'If/Else' } = data;

    return (
        <div className="config-panel">
            <div className="panel-header">
                <h3>Logic Configuration</h3>
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
                    <label>Condition (Python expression)</label>
                    <input
                        type="text"
                        className="font-mono text-xs bg-gray-900 border-gray-700 rounded p-2 focus:border-blue-500 focus:outline-none"
                        value={condition}
                        onChange={(e) => onChange({ ...data, condition: e.target.value })}
                        placeholder="e.g. results['node_1']['returncode'] == 0"
                    />
                </div>

                <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
                    <p className="text-[10px] text-gray-400">
                        <strong>Available Variables:</strong><br />
                        <code>results</code> — dict of previous node outputs, keyed by node ID<br />
                        <code>context</code> — trigger execution context<br /><br />
                        <strong>Examples:</strong><br />
                        <code className="text-gray-300">{"results['abc123']['returncode'] == 0"}</code><br />
                        <code className="text-gray-300">{"context.get('event_type') == 'high_cpu'"}</code><br />
                        <code className="text-gray-300">len(results) &gt; 0</code>
                    </p>
                </div>

                <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="text-gray-300">True branch — condition evaluates to truthy</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-gray-300">False branch — condition evaluates to falsy or errors</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogicIfConfigPanel;
