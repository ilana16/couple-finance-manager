import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { FileText, Plus, Edit2, Trash2, Pin } from 'lucide-react';
import { FirestoreStorage, createTimestamp } from '../lib/firestore-storage';

interface Note {
  id: string;
  userId: string;
  userName: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const noteStorage = new FirestoreStorage<Note>('notes');

export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotes();
  }, [user]);

  const loadNotes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const all = await noteStorage.getAll();
      setNotes(all.sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }));
    } catch (error) {
      console.error('Error loading notes:', error);
      alert('Failed to load notes. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await noteStorage.delete(id);
        await loadNotes();
      } catch (error) {
        console.error('Error deleting note:', error);
        alert('Failed to delete note. Please try again.');
      }
    }
  };

  const togglePin = async (id: string) => {
    try {
      const note = notes.find(n => n.id === id);
      if (note) {
        await noteStorage.update(id, {
          isPinned: !note.isPinned,
          updatedAt: createTimestamp(),
        });
        await loadNotes();
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
      alert('Failed to update note. Please try again.');
    }
  };

  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.isPinned);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Shared Notes</h1>
        <p className="text-gray-600 mt-1">Collaborate on financial planning and ideas</p>
      </div>

      {/* Search and Add */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Note
        </button>
      </div>

      {/* Notes Display */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'No notes found matching your search' : 'No notes yet. Start by adding your first note!'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Your First Note
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {pinnedNotes.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Pin className="w-5 h-5" />
                Pinned Notes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={() => {
                      setEditingNote(note);
                      setShowAddModal(true);
                    }}
                    onDelete={() => handleDelete(note.id)}
                    onTogglePin={() => togglePin(note.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {unpinnedNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <h2 className="text-lg font-semibold text-gray-900 mb-3">All Notes</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unpinnedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={() => {
                      setEditingNote(note);
                      setShowAddModal(true);
                    }}
                    onDelete={() => handleDelete(note.id)}
                    onTogglePin={() => togglePin(note.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showAddModal && (
        <NoteModal
          note={editingNote}
          onClose={() => {
            setShowAddModal(false);
            setEditingNote(null);
          }}
          onSave={() => {
            loadNotes();
            setShowAddModal(false);
            setEditingNote(null);
          }}
        />
      )}
    </div>
  );
}

function NoteCard({ note, onEdit, onDelete, onTogglePin }: any) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-bold text-gray-900 flex-1">{note.title}</h3>
        <div className="flex gap-2">
          <button
            onClick={onTogglePin}
            className={`${note.isPinned ? 'text-yellow-600' : 'text-gray-400'} hover:text-yellow-600`}
          >
            <Pin className="w-4 h-4" />
          </button>
          <button onClick={onEdit} className="text-blue-600 hover:text-blue-900">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="text-red-600 hover:text-red-900">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <p className="text-gray-700 text-sm mb-4 line-clamp-4">{note.content}</p>

      <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
        <p>By {note.userName}</p>
        <p>Updated {new Date(note.updatedAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
}

function NoteModal({ note, onClose, onSave }: any) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: note?.title || '',
    content: note?.content || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const data = {
      userId: user.id,
      userName: user.name,
      title: formData.title,
      content: formData.content,
      isPinned: note?.isPinned || false,
      createdAt: note?.createdAt || createTimestamp(),
      updatedAt: createTimestamp(),
    };

    try {
      if (note) {
        await noteStorage.update(note.id, data);
      } else {
        await noteStorage.create(data);
      }
      onSave();
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save note. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold mb-4">
          {note ? 'Edit Note' : 'Add Note'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Note title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={10}
              placeholder="Write your note here..."
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {note ? 'Update' : 'Add'} Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
