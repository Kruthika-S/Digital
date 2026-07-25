import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, MessageSquare, Send } from 'lucide-react';

export default function LeadDetails() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteMessage, setNoteMessage] = useState('');
  const { user } = useAuth();
  
  const statusOptions = ['New', 'Contacted', 'Qualified', 'Proposal Sent', 'Won', 'Lost'];

  const fetchLead = async () => {
    try {
      const { data } = await api.get(`/leads/${id}`);
      setLead(data);
    } catch (error) {
      console.error('Failed to fetch lead', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLead();
  }, [id]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      await api.put(`/leads/${id}`, { status: newStatus });
      setLead({ ...lead, status: newStatus });
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteMessage.trim()) return;
    try {
      await api.post(`/leads/${id}/notes`, { message: noteMessage });
      setNoteMessage('');
      fetchLead(); // Refresh notes
    } catch (error) {
      console.error('Failed to add note', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!lead) return <div>Lead not found or access denied.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">{lead.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Lead Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500">Company</p>
                <p className="font-medium text-slate-900">{lead.company}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-medium text-slate-900">{lead.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Phone</p>
                <p className="font-medium text-slate-900">{lead.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Source</p>
                <p className="font-medium text-slate-900">{lead.source}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Created</p>
                <p className="font-medium text-slate-900">{new Date(lead.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquare size={20} /> Notes
            </h2>
            
            <div className="space-y-4 mb-6">
              {lead.notes?.map((note) => (
                <div key={note.id} className="bg-slate-50 p-4 rounded-md">
                  <p className="text-slate-700">{note.message}</p>
                  <div className="mt-2 text-xs text-slate-500 flex justify-between">
                    <span>{note.author_name}</span>
                    <span>{new Date(note.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
              {(!lead.notes || lead.notes.length === 0) && (
                <p className="text-slate-500 text-sm">No notes added yet.</p>
              )}
            </div>

            <form onSubmit={handleAddNote} className="flex gap-2">
              <input
                type="text"
                placeholder="Add a note..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={noteMessage}
                onChange={(e) => setNoteMessage(e.target.value)}
              />
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Status & Assignment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={lead.status}
                  onChange={handleStatusChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <p className="text-sm text-slate-500">Assigned To</p>
                <p className="font-medium text-slate-900">{lead.assigned_user_name || 'Unassigned'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
