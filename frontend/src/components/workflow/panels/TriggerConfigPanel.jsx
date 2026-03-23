import React, { useState } from 'react';
import { X, Play, Clock, Webhook, Zap, Copy, Check } from 'lucide-react';

const TriggerConfigPanel = ({ node, onChange, onClose }) => {
    const { data } = node;
    const { triggerType = 'manual', label = 'Trigger', triggerConfig = {} } = data;
    const [copied, setCopied] = useState(false);

    const handleTypeChange = (type) => {
        onChange({
            ...data,
            triggerType: type,
            label: `${type.charAt(0).toUpperCase() + type.slice(1)} Trigger`
        });
    };

    const handleConfigChange = (key, value) => {
        onChange({
            ...data,
            triggerConfig: {
                ...triggerConfig,
                [key]: value
            }
        });
    };

    const webhookUrl = triggerConfig.webhook_id
        ? `${window.location.origin}/api/v1/workflows/hooks/${triggerConfig.webhook_id}`
        : null;

    const copyWebhookUrl = () => {
        if (webhookUrl) {
            navigator.clipboard.writeText(webhookUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="config-panel">
            <div className="panel-header">
                <h3>Trigger Configuration</h3>
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
                    <label>Trigger Type</label>
                    <div className="trigger-type-grid grid grid-cols-2 gap-2 mt-2">
                        <button
                            className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-colors ${triggerType === 'manual' ? 'bg-blue-900/30 border-blue-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                            onClick={() => handleTypeChange('manual')}
                        >
                            <Play size={20} className={triggerType === 'manual' ? 'text-blue-400' : 'text-gray-400'} />
                            <span className="text-xs">Manual</span>
                        </button>
                        <button
                            className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-colors ${triggerType === 'cron' ? 'bg-purple-900/30 border-purple-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                            onClick={() => handleTypeChange('cron')}
                        >
                            <Clock size={20} className={triggerType === 'cron' ? 'text-purple-400' : 'text-gray-400'} />
                            <span className="text-xs">Schedule</span>
                        </button>
                        <button
                            className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-colors ${triggerType === 'webhook' ? 'bg-green-900/30 border-green-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                            onClick={() => handleTypeChange('webhook')}
                        >
                            <Webhook size={20} className={triggerType === 'webhook' ? 'text-green-400' : 'text-gray-400'} />
                            <span className="text-xs">Webhook</span>
                        </button>
                        <button
                            className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-colors ${triggerType === 'event' ? 'bg-yellow-900/30 border-yellow-500' : 'bg-gray-800 border-gray-700 hover:border-gray-500'}`}
                            onClick={() => handleTypeChange('event')}
                        >
                            <Zap size={20} className={triggerType === 'event' ? 'text-yellow-400' : 'text-gray-400'} />
                            <span className="text-xs">System Event</span>
                        </button>
                    </div>
                </div>

                {triggerType === 'cron' && (
                    <div className="form-group animate-in fade-in slide-in-from-top-1">
                        <label>Cron Expression</label>
                        <input
                            type="text"
                            value={triggerConfig.cron || '0 * * * *'}
                            onChange={(e) => handleConfigChange('cron', e.target.value)}
                            placeholder="e.g. 0 0 * * *"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">
                            (Min Hour Day Month Week)
                        </p>
                    </div>
                )}

                {triggerType === 'webhook' && (
                    <div className="form-group animate-in fade-in slide-in-from-top-1">
                        <label>Webhook URL</label>
                        {webhookUrl ? (
                            <>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={webhookUrl}
                                        readOnly
                                        className="bg-gray-900 text-gray-300 cursor-default font-mono text-xs flex-1"
                                    />
                                    <button
                                        onClick={copyWebhookUrl}
                                        className="px-3 py-1 rounded border border-gray-600 bg-gray-800 hover:bg-gray-700 transition-colors"
                                        title="Copy URL"
                                    >
                                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
                                    </button>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1">
                                    Send POST requests to this URL to trigger the workflow.
                                </p>
                            </>
                        ) : (
                            <p className="text-[10px] text-yellow-400 mt-1">
                                Save the workflow to generate the webhook URL.
                            </p>
                        )}
                        <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-700">
                            <p className="text-[10px] text-gray-400">
                                <strong>Request body</strong> is available in your workflow as <code>context.body</code>.
                                Query parameters are in <code>context.query</code>.
                            </p>
                        </div>
                    </div>
                )}

                {triggerType === 'event' && (
                    <div className="form-group animate-in fade-in slide-in-from-top-1">
                        <label>System Event</label>
                        <select
                            value={triggerConfig.eventType || 'health_check_failed'}
                            onChange={(e) => handleConfigChange('eventType', e.target.value)}
                        >
                            <option value="health_check_failed">Health Check Failed</option>
                            <option value="high_cpu">High CPU Usage (&gt;80%)</option>
                            <option value="high_memory">High Memory Usage (&gt;80%)</option>
                            <option value="git_push">Git Push Received</option>
                            <option value="app_stopped">Application Stopped</option>
                        </select>
                        <p className="text-[10px] text-gray-500 mt-1">
                            Event data is available as <code>context.event_data</code>.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TriggerConfigPanel;
