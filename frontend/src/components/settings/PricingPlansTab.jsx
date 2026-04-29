import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Check, Server, HardDrive, Cpu, Shield } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

const PricingPlansTab = () => {
    const toast = useToast();
    const [plans, setPlans] = useState([]);
    const [currency, setCurrency] = useState('USD');
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price_monthly: 0,
        price_yearly: 0,
        has_monthly: true,
        has_yearly: true,
        max_sites: 1,
        has_backups: false,
        resource_specs: {
            cpu: '1',
            memory: '1GB',
            disk: '10GB'
        }
    });

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [plansData, settingsData] = await Promise.all([
                api.listPricingPlans(),
                api.getSystemSettings()
            ]);
            setPlans(plansData.plans || []);
            setCurrency(settingsData.company_currency || 'USD');
        } catch (err) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    }

    async function loadPlans() {
        try {
            const data = await api.listPricingPlans();
            setPlans(data.plans || []);
        } catch (err) {
            toast.error('Failed to load pricing plans');
        }
    }

    const handleEdit = (plan) => {
        setEditingId(plan.id);
        setFormData({
            name: plan.name,
            description: plan.description || '',
            price_monthly: plan.price_monthly !== null ? plan.price_monthly : 0,
            price_yearly: plan.price_yearly !== null ? plan.price_yearly : 0,
            has_monthly: plan.price_monthly !== null,
            has_yearly: plan.price_yearly !== null,
            max_sites: plan.max_sites || 1,
            has_backups: plan.has_backups || false,
            resource_specs: plan.resource_specs || { cpu: '1', memory: '1GB', disk: '10GB' }
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setIsAdding(false);
        setFormData({
            name: '',
            description: '',
            price_monthly: 0,
            price_yearly: 0,
            has_monthly: true,
            has_yearly: true,
            max_sites: 1,
            has_backups: false,
            resource_specs: { cpu: '1', memory: '1GB', disk: '10GB' }
        });
    };

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('Plan name is required');
            return;
        }

        if (!formData.has_monthly && !formData.has_yearly) {
            toast.error('At least one price (monthly or yearly) must be enabled');
            return;
        }

        const payload = {
            ...formData,
            price_monthly: formData.has_monthly ? formData.price_monthly : null,
            price_yearly: formData.has_yearly ? formData.price_yearly : null
        };

        try {
            if (editingId) {
                await api.updatePricingPlan(editingId, payload);
                toast.success('Plan updated successfully');
            } else {
                await api.createPricingPlan(payload);
                toast.success('Plan created successfully');
            }
            handleCancel();
            loadPlans();
        } catch (err) {
            toast.error(err.message || 'Failed to save plan');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this plan?')) return;

        try {
            await api.deletePricingPlan(id);
            toast.success('Plan deleted successfully');
            loadPlans();
        } catch (err) {
            toast.error('Failed to delete plan');
        }
    };

    const sym = currency === 'USD' ? '$' : currency;

    if (loading) return <div className="text-sm text-muted-foreground py-4">Loading plans...</div>;

    return (
        <div className="flex flex-col gap-6 pricing-plans-tab">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-semibold text-foreground">Pricing Plans</h2>
                    <p className="text-sm text-muted-foreground">Manage subscription plans for your SaaS containers.</p>
                </div>
                {!isAdding && !editingId && (
                    <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
                        <Plus size={14} /> Add Plan
                    </button>
                )}
            </div>

            {/* Edit / Add form */}
            {(isAdding || editingId) && (
                <div className="settings-card edit-card">
                    <h3 className="text-sm font-semibold text-foreground mb-4">
                        {editingId ? 'Edit Plan' : 'New Plan'}
                    </h3>

                    {/* Row 1: name + description */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="form-group mb-0">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Plan Name</label>
                            <input type="text" className="form-control w-full"
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                placeholder="e.g. Professional" />
                        </div>
                        <div className="form-group mb-0">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                            <input type="text" className="form-control w-full"
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                placeholder="Brief summary..." />
                        </div>
                    </div>

                    {/* Row 2: pricing + sites + backups */}
                    <div className="grid grid-cols-4 gap-3 mb-3">
                        {/* Monthly */}
                        <div className="form-group mb-0 flex flex-col">
                            <div className="flex items-center justify-between mb-1 h-5">
                                <span className="text-xs font-medium text-muted-foreground">Monthly</span>
                                <label className="toggle-switch toggle-sm">
                                    <input type="checkbox" checked={formData.has_monthly}
                                        onChange={e => setFormData({...formData, has_monthly: e.target.checked})} />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            {formData.has_monthly
                                ? <input type="number" className="form-control w-full"
                                    value={formData.price_monthly}
                                    onChange={e => setFormData({...formData, price_monthly: e.target.value})}
                                    placeholder="0.00" />
                                : <div className="form-control w-full opacity-30 select-none">—</div>}
                        </div>
                        {/* Yearly */}
                        <div className="form-group mb-0 flex flex-col">
                            <div className="flex items-center justify-between mb-1 h-5">
                                <span className="text-xs font-medium text-muted-foreground">Yearly</span>
                                <label className="toggle-switch toggle-sm">
                                    <input type="checkbox" checked={formData.has_yearly}
                                        onChange={e => setFormData({...formData, has_yearly: e.target.checked})} />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            {formData.has_yearly
                                ? <input type="number" className="form-control w-full"
                                    value={formData.price_yearly}
                                    onChange={e => setFormData({...formData, price_yearly: e.target.value})}
                                    placeholder="0.00" />
                                : <div className="form-control w-full opacity-30 select-none">—</div>}
                        </div>
                        {/* Max Sites */}
                        <div className="form-group mb-0 flex flex-col">
                            <div className="flex items-center h-5 mb-1">
                                <span className="text-xs font-medium text-muted-foreground">Max Sites</span>
                            </div>
                            <input type="number" className="form-control w-full"
                                value={formData.max_sites} min="1"
                                onChange={e => setFormData({...formData, max_sites: e.target.value})} />
                        </div>
                        {/* Backups */}
                        <div className="form-group mb-0 flex flex-col">
                            <div className="flex items-center justify-between mb-1 h-5">
                                <span className="text-xs font-medium text-muted-foreground">Backups</span>
                                <label className="toggle-switch toggle-sm">
                                    <input type="checkbox" checked={formData.has_backups}
                                        onChange={e => setFormData({...formData, has_backups: e.target.checked})} />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            <div className="form-control w-full text-xs text-muted-foreground flex items-center">
                                {formData.has_backups ? 'Included' : 'Not included'}
                            </div>
                        </div>
                    </div>

                    {/* Row 3: resources */}
                    <div className="border-t border-border pt-3 mt-1">
                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                            <Server size={12} /> Resource Allocations
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="form-group mb-0">
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">CPU Units</label>
                                <div className="flex items-center gap-2">
                                    <Cpu size={13} className="shrink-0 text-muted-foreground" />
                                    <input type="text" className="form-control w-full"
                                        value={formData.resource_specs.cpu}
                                        onChange={e => setFormData({...formData, resource_specs: {...formData.resource_specs, cpu: e.target.value}})}
                                        placeholder="e.g. 1" />
                                </div>
                            </div>
                            <div className="form-group mb-0">
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Memory</label>
                                <div className="flex items-center gap-2">
                                    <HardDrive size={13} className="shrink-0 text-muted-foreground" />
                                    <input type="text" className="form-control w-full"
                                        value={formData.resource_specs.memory}
                                        onChange={e => setFormData({...formData, resource_specs: {...formData.resource_specs, memory: e.target.value}})}
                                        placeholder="e.g. 1GB" />
                                </div>
                            </div>
                            <div className="form-group mb-0">
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Disk</label>
                                <div className="flex items-center gap-2">
                                    <HardDrive size={13} className="shrink-0 text-muted-foreground" />
                                    <input type="text" className="form-control w-full"
                                        value={formData.resource_specs.disk}
                                        onChange={e => setFormData({...formData, resource_specs: {...formData.resource_specs, disk: e.target.value}})}
                                        placeholder="e.g. 20GB" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-border">
                        <button className="btn btn-secondary" onClick={handleCancel}>
                            <X size={14} /> Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSave}>
                            <Save size={14} /> {editingId ? 'Update' : 'Save Plan'}
                        </button>
                    </div>
                </div>
            )}

            {/* Plans grid */}
            {plans.length === 0 ? (
                <div className="empty-state">
                    <Server size={40} />
                    <h3>No pricing plans</h3>
                    <p>Create your first plan to start offering SaaS services.</p>
                    <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
                        <Plus size={14} /> Create Plan
                    </button>
                </div>
            ) : (
                <div className="plans-grid">
                    {plans.map(plan => (
                        <div key={plan.id} className={`plan-card ${!plan.is_active ? 'inactive' : ''}`}>
                            {/* Card header */}
                            <div className="flex items-start justify-between mb-2">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold text-foreground truncate">{plan.name}</h3>
                                        {!plan.is_active && (
                                            <span className="badge badge-warning text-[10px] px-1.5 py-0">Inactive</span>
                                        )}
                                    </div>
                                    {plan.description && (
                                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{plan.description}</p>
                                    )}
                                </div>
                                <div className="flex gap-1 shrink-0 ml-2">
                                    <button className="icon-btn" onClick={() => handleEdit(plan)} title="Edit">
                                        <Edit2 size={13} />
                                    </button>
                                    <button className="icon-btn delete" onClick={() => handleDelete(plan.id)} title="Delete">
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>

                            {/* Pricing row */}
                            <div className="flex items-baseline gap-3 my-3">
                                {plan.price_monthly !== null && (
                                    <div className="flex items-baseline gap-0.5">
                                        <span className="text-xs text-muted-foreground">{sym}</span>
                                        <span className="text-xl font-bold text-foreground">{plan.price_monthly}</span>
                                        <span className="text-xs text-muted-foreground">/mo</span>
                                    </div>
                                )}
                                {plan.price_monthly !== null && plan.price_yearly !== null && (
                                    <span className="text-muted-foreground text-xs">·</span>
                                )}
                                {plan.price_yearly !== null && (
                                    <div className="flex items-baseline gap-0.5">
                                        <span className="text-xs text-muted-foreground">{sym}</span>
                                        <span className="text-base font-semibold text-foreground">{plan.price_yearly}</span>
                                        <span className="text-xs text-muted-foreground">/yr</span>
                                    </div>
                                )}
                            </div>

                            {/* Specs */}
                            <div className="flex flex-wrap gap-x-3 gap-y-1 pt-2 border-t border-border">
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Check size={11} className="text-green-500" />
                                    {plan.max_sites} {plan.max_sites === 1 ? 'site' : 'sites'}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Cpu size={11} /> {plan.resource_specs?.cpu} vCPU
                                </span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <HardDrive size={11} /> {plan.resource_specs?.memory}
                                </span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <HardDrive size={11} /> {plan.resource_specs?.disk}
                                </span>
                                {plan.has_backups && (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Shield size={11} /> Backups
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PricingPlansTab;
