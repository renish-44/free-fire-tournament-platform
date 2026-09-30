import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const FormBuilder = () => {
    const { id } = useParams();
    const { api } = useAuth();
    
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tournament, setTournament] = useState(null);

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingField, setEditingField] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        label: '',
        field_type: 'text',
        required: false,
        placeholder: '',
        description: '',
        options: '', // comma separated string for easy input
        active: true
    });

    const fetchFields = async () => {
        try {
            const [tRes, fRes] = await Promise.all([
                api.get(`/tournaments/${id}`),
                api.get(`/admin/tournaments/${id}/fields`)
            ]);
            setTournament(tRes.data);
            setFields(fRes.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFields();
    }, [id]);

    const openModal = (field = null) => {
        if (field) {
            setEditingField(field);
            setFormData({
                label: field.label,
                field_type: field.field_type,
                required: field.required,
                placeholder: field.placeholder || '',
                description: field.description || '',
                options: field.options ? field.options.join(', ') : '',
                active: field.active
            });
        } else {
            setEditingField(null);
            setFormData({
                label: '',
                field_type: 'text',
                required: false,
                placeholder: '',
                description: '',
                options: '',
                active: true
            });
        }
        setModalOpen(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                options: formData.options ? formData.options.split(',').map(o => o.trim()).filter(Boolean) : []
            };

            if (editingField) {
                await api.put(`/admin/tournaments/${id}/fields/${editingField._id}`, payload);
            } else {
                await api.post(`/admin/tournaments/${id}/fields`, payload);
            }
            setModalOpen(false);
            fetchFields();
        } catch (error) {
            alert(error.response?.data?.detail || 'Failed to save field');
        }
    };

    const handleDelete = async (fieldId) => {
        if (!window.confirm('Delete this custom field?')) return;
        try {
            await api.delete(`/admin/tournaments/${id}/fields/${fieldId}`);
            fetchFields();
        } catch (error) {
            alert('Failed to delete');
        }
    };

    const handleMove = async (index, direction) => {
        const newFields = [...fields];
        if (direction === 'up' && index > 0) {
            [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
        } else if (direction === 'down' && index < newFields.length - 1) {
            [newFields[index + 1], newFields[index]] = [newFields[index], newFields[index + 1]];
        } else {
            return;
        }
        
        setFields(newFields);
        
        // Save new order to backend
        try {
            await api.post(`/admin/tournaments/${id}/fields/reorder`, {
                field_ids: newFields.map(f => f._id)
            });
        } catch (error) {
            console.error('Failed to reorder', error);
        }
    };

    if (loading) return <div className="text-white p-8">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Link to="/admin/tournaments" className="text-yellow-500 hover:text-yellow-400 font-bold uppercase tracking-widest text-sm mb-2 block">
                        ← Back to Tournaments
                    </Link>
                    <h2 className="text-3xl font-black text-white uppercase">Form Builder</h2>
                    <p className="text-gray-400">Manage custom registration fields for <strong className="text-white">{tournament?.name}</strong></p>
                </div>
                <button onClick={() => openModal()} className="bg-yellow-500 hover:bg-yellow-400 text-gray-950 font-bold py-2 px-6 rounded shadow uppercase transition">
                    + Add Field
                </button>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-xl">
                {fields.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-800 rounded-xl">
                        No custom fields configured.<br/>Players will only see default fields (Name, IGN, UID, etc.).
                    </div>
                ) : (
                    <div className="space-y-4">
                        {fields.map((f, index) => (
                            <div key={f._id} className={`flex items-center justify-between p-4 bg-gray-950 border ${!f.active ? 'border-red-900/50 opacity-60' : 'border-gray-800'} rounded-xl shadow-lg transition group`}>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-lg font-bold text-white">{f.label}</h4>
                                        <span className="bg-gray-800 text-gray-400 text-xs px-2 py-1 rounded font-mono">{f.field_name}</span>
                                        <span className="bg-blue-900/50 text-blue-400 text-xs px-2 py-1 rounded border border-blue-800">{f.field_type}</span>
                                        {f.required && <span className="bg-red-900/50 text-red-400 text-xs px-2 py-1 rounded border border-red-800">Required</span>}
                                        {!f.active && <span className="bg-gray-800 text-gray-500 text-xs px-2 py-1 rounded border border-gray-700">Disabled</span>}
                                    </div>
                                    {f.description && <p className="text-sm text-gray-500 mt-1">{f.description}</p>}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                    <div className="flex flex-col gap-1 mr-4 opacity-0 group-hover:opacity-100 transition">
                                        <button disabled={index === 0} onClick={() => handleMove(index, 'up')} className="text-gray-500 hover:text-white disabled:opacity-30">▲</button>
                                        <button disabled={index === fields.length - 1} onClick={() => handleMove(index, 'down')} className="text-gray-500 hover:text-white disabled:opacity-30">▼</button>
                                    </div>
                                    <button onClick={() => openModal(f)} className="text-yellow-500 hover:text-yellow-400 font-bold px-3 py-1 bg-yellow-500/10 rounded transition">Edit</button>
                                    <button onClick={() => handleDelete(f._id)} className="text-red-500 hover:text-red-400 font-bold px-3 py-1 bg-red-500/10 rounded transition">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
                        <h3 className="text-2xl font-black text-white uppercase mb-6">
                            {editingField ? 'Edit Field' : 'New Field'}
                        </h3>
                        
                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Label *</label>
                                <input required type="text" value={formData.label} onChange={(e) => setFormData({...formData, label: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white outline-none focus:border-yellow-500" placeholder="e.g. College Name" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Field Type *</label>
                                    <select value={formData.field_type} onChange={(e) => setFormData({...formData, field_type: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white outline-none focus:border-yellow-500">
                                        <option value="text">Short Text</option>
                                        <option value="textarea">Long Text</option>
                                        <option value="number">Number</option>
                                        <option value="email">Email</option>
                                        <option value="phone">Phone</option>
                                        <option value="dropdown">Dropdown</option>
                                        <option value="radio">Radio</option>
                                        <option value="checkbox">Checkbox</option>
                                    </select>
                                </div>
                                <div className="flex items-center mt-8 gap-4">
                                    <label className="flex items-center gap-2 text-white font-bold cursor-pointer">
                                        <input type="checkbox" checked={formData.required} onChange={(e) => setFormData({...formData, required: e.target.checked})} className="w-5 h-5 accent-yellow-500" />
                                        Required Field
                                    </label>
                                </div>
                            </div>

                            {['dropdown', 'radio', 'checkbox'].includes(formData.field_type) && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Options (Comma separated) *</label>
                                    <input required type="text" value={formData.options} onChange={(e) => setFormData({...formData, options: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white outline-none focus:border-yellow-500" placeholder="Option 1, Option 2, Option 3" />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Placeholder</label>
                                <input type="text" value={formData.placeholder} onChange={(e) => setFormData({...formData, placeholder: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white outline-none focus:border-yellow-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Help Text / Description</label>
                                <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded p-3 text-white outline-none focus:border-yellow-500" />
                            </div>
                            
                            <div>
                                <label className="flex items-center gap-2 text-white font-bold cursor-pointer">
                                    <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({...formData, active: e.target.checked})} className="w-5 h-5 accent-yellow-500" />
                                    Active (Visible on form)
                                </label>
                            </div>

                            <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-800">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white font-bold transition">Cancel</button>
                                <button type="submit" className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-950 rounded font-bold transition">Save Field</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FormBuilder;
