import React from 'react';
import { X, MessageSquare, Mail, Slack, Bell } from 'lucide-react';

const NotificationConfigPanel = ({ node, onChange, onClose }) => {
    const { data } = node;
    const { channel = 'discord', label = 'Notify', message = '' } = data;

    return (
        <div className="config-panel">
            <div className="panel-header">
                <h3>Notification Configuration</h3>
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
                    <label>Channel</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            className={`p-2 rounded border flex items-center justify-center gap-2 transition-colors ${channel === 'discord' ? 'bg-indigo-900/30 border-indigo-500 text-indigo-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                            onClick={() => onChange({ ...data, channel: 'discord' })}
                        >
                            <MessageSquare size={14} />
                            <span className="text-xs">Discord</span>
                        </button>
                        <button
                            className={`p-2 rounded border flex items-center justify-center gap-2 transition-colors ${channel === 'slack' ? 'bg-pink-900/30 border-pink-500 text-pink-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                            onClick={() => onChange({ ...data, channel: 'slack' })}
                        >
                            <Slack size={14} />
                            <span className="text-xs">Slack</span>
                        </button>
                        <button
                            className={`p-2 rounded border flex items-center justify-center gap-2 transition-colors ${channel === 'email' ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                            onClick={() => onChange({ ...data, channel: 'email' })}
                        >
                            <Mail size={14} />
                            <span className="text-xs">Email</span>
                        </button>
                        <button
                            className={`p-2 rounded border flex items-center justify-center gap-2 transition-colors ${channel === 'system' ? 'bg-gray-700 border-gray-500 text-gray-200' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
                            onClick={() => onChange({ ...data, channel: 'system' })}
                        >
                            <Bell size={14} />
                            <span className="text-xs">All</span>
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label>Message Template</label>
                    <textarea
                        className="text-xs bg-gray-900 border-gray-700 rounded p-2 h-48 focus:border-blue-500 focus:outline-none"
                        value={message}
                        onChange={(e) => onChange({ ...data, message: e.target.value })}
                        placeholder="e.g. Build finished for {{workflow_name}} — exit code: ${build_node.returncode}"
                    />
                </div>

                <div className="mt-4 p-3 bg-gray-800 rounded border border-gray-700">
                    <p className="text-[10px] text-gray-400">
                        <strong>Variables:</strong><br />
                        <code>{'{{workflow_name}}'}</code>, <code>{'{{execution_id}}'}</code>, <code>{'{{started_at}}'}</code><br />
                        <code>{'${node_id.stdout}'}</code> — output from a specific node<br />
                        <code>{'${node_id.returncode}'}</code> — exit code from a script node<br />
                        <code>{'{{context.field}}'}</code> — value from trigger context
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NotificationConfigPanel;
