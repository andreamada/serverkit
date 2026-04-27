import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
import Modal from '../Modal';

const WebhookSubscriptionModal = ({ subscription, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [selectedEvents, setSelectedEvents] = useState([]);
    const [retryCount, setRetryCount] = useState(3);
    const [timeoutSeconds, setTimeoutSeconds] = useState(10);
    const [availableEvents, setAvailableEvents] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.getAvailableEvents().then(data => {
            setAvailableEvents(data.events || []);
        }).catch(() => {});

        if (subscription) {
            setName(subscription.name || '');
            setUrl(subscription.url || '');
            setSelectedEvents(subscription.events || []);
            setRetryCount(subscription.retry_count || 3);
            setTimeoutSeconds(subscription.timeout_seconds || 10);
        }
    }, [subscription]);

    const handleEventToggle = (eventType) => {
        setSelectedEvents(prev =>
            prev.includes(eventType)
                ? prev.filter(e => e !== eventType)
                : [...prev, eventType]
        );
    };

    const handleCategoryToggle = (category) => {
        const categoryEvents = availableEvents
            .filter(e => e.category === category)
            .map(e => e.type);
        const allSelected = categoryEvents.every(e => selectedEvents.includes(e));
        if (allSelected) {
            setSelectedEvents(prev => prev.filter(e => !categoryEvents.includes(e)));
        } else {
            setSelectedEvents(prev => [...new Set([...prev, ...categoryEvents])]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim() || !url.trim() || selectedEvents.length === 0) return;
        setSaving(true);
        try {
            await onSubmit({
                name: name.trim(),
                url: url.trim(),
                events: selectedEvents,
                retry_count: retryCount,
                timeout_seconds: timeoutSeconds,
            });
        } finally {
            setSaving(false);
        }
    };

    // Group events by category
    const groupedEvents = availableEvents.reduce((acc, event) => {
        if (!acc[event.category]) acc[event.category] = [];
        acc[event.category].push(event);
        return acc;
    }, {});

    return (
        <Modal open={true} onClose={onClose} title={subscription ? 'Edit Subscription' : 'Create Webhook Subscription'} className="webhook-modal">
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Slack Notifications, CI Trigger"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Payload URL</label>
                            <input
                                type="url"
                                className="form-input"
                                value={url}
                                onChange={e => setUrl(e.target.value)}
                                placeholder="https://example.com/webhook"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Events</label>
                            <div className="webhook-modal__events">
                                {Object.entries(groupedEvents).map(([category, events]) => {
                                    const categoryEvents = events.map(e => e.type);
                                    const allSelected = categoryEvents.every(e => selectedEvents.includes(e));
                                    return (
                                        <div key={category} className="webhook-modal__event-group">
                                            <label className="webhook-modal__category">
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    onChange={() => handleCategoryToggle(category)}
                                                />
                                                <strong>{category}</strong>
                                            </label>
                                            <div className="webhook-modal__event-list">
                                                {events.map(event => (
                                                    <label key={event.type} className="webhook-modal__event-item">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedEvents.includes(event.type)}
                                                            onChange={() => handleEventToggle(event.type)}
                                                        />
                                                        <span className="webhook-modal__event-type">{event.type}</span>
                                                        <span className="webhook-modal__event-desc">{event.description}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Retry Count</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={retryCount}
                                    onChange={e => setRetryCount(parseInt(e.target.value) || 3)}
                                    min={0}
                                    max={10}
                                />
                            </div>
                            <div className="form-group">
                                <label>Timeout (seconds)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={timeoutSeconds}
                                    onChange={e => setTimeoutSeconds(parseInt(e.target.value) || 10)}
                                    min={1}
                                    max={30}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={saving || !name.trim() || !url.trim() || selectedEvents.length === 0}
                        >
                            {saving ? 'Saving...' : (subscription ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
        </Modal>
    );
};

export default WebhookSubscriptionModal;
