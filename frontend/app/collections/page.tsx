"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { collectionService } from '@/lib/services/collection.service';
import type { CollectionResponse } from '@/lib/types/api';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CollectionsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [collections, setCollections] = useState<CollectionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingBoard, setEditingBoard] = useState<CollectionResponse | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBoardName, setEditBoardName] = useState('');
  const [editBoardDescription, setEditBoardDescription] = useState('');
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState<CollectionResponse | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadCollections();
    }
  }, [isAuthenticated]);

  const loadCollections = async () => {
    try {
      setLoading(true);
      const data = await collectionService.getAll();
      setCollections(data);
    } catch (err) {
      console.error('Failed to load collections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      toast.error('Board name is required');
      return;
    }

    const toastId = toast.loading('Creating board...');

    try {
      setCreating(true);
      const newCollection = await collectionService.create({
        name: newBoardName.trim(),
        description: newBoardDescription.trim() || undefined,
      });
      setCollections([newCollection, ...collections]);
      toast.success('Board created!', { id: toastId });
      setShowCreateModal(false);
      setNewBoardName('');
      setNewBoardDescription('');
    } catch (err: any) {
      console.error('Failed to create board:', err);
      toast.error(err.message || 'Failed to create board', { id: toastId });
    } finally {
      setCreating(false);
    }
  };

  const handleEditBoard = async () => {
    if (!editingBoard || !editBoardName.trim()) {
      toast.error('Board name is required');
      return;
    }

    const toastId = toast.loading('Updating board...');

    try {
      setUpdating(true);
      const updated = await collectionService.update(editingBoard.id, {
        name: editBoardName.trim(),
        description: editBoardDescription.trim() || undefined,
      });
      setCollections(collections.map(c => c.id === updated.id ? updated : c));
      toast.success('Board updated!', { id: toastId });
      setShowEditModal(false);
      setEditingBoard(null);
      setEditBoardName('');
      setEditBoardDescription('');
    } catch (err: any) {
      console.error('Failed to update board:', err);
      toast.error(err.message || 'Failed to update board', { id: toastId });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteBoard = async () => {
    if (!deletingBoard) return;

    const toastId = toast.loading('Deleting board...');

    try {
      setDeleting(true);
      await collectionService.delete(deletingBoard.id);
      setCollections(collections.filter(c => c.id !== deletingBoard.id));
      toast.success('Board deleted', { id: toastId });
      setShowDeleteConfirm(false);
      setDeletingBoard(null);
    } catch (err: any) {
      console.error('Failed to delete board:', err);
      toast.error(err.message || 'Failed to delete board', { id: toastId });
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (collection: CollectionResponse) => {
    setEditingBoard(collection);
    setEditBoardName(collection.name);
    setEditBoardDescription(collection.description || '');
    setShowEditModal(true);
    setOpenDropdown(null);
  };

  const openDeleteConfirm = (collection: CollectionResponse) => {
    setDeletingBoard(collection);
    setShowDeleteConfirm(true);
    setOpenDropdown(null);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="max-w-[1600px] mx-auto px-4 pt-24 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Boards</h1>
          <p className="text-gray-600">Organize and share your collections</p>
        </div>

        {/* Create Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="mb-8 inline-flex items-center gap-2 px-6 py-3 bg-[#e60023] text-white rounded-full font-semibold hover:bg-[#ad081b] transition-colors shadow-lg"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create board
        </button>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {/* Collections Grid */}
        {!loading && collections.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {collections.map((collection) => (
              <div key={collection.id} className="group relative">
                <Link
                  href={`/collections/${collection.id}`}
                  className="block cursor-pointer"
                >
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 relative hover:opacity-90 transition-opacity">
                    {collection.coverImageUrl ? (
                      <img
                        src={collection.coverImageUrl}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <h3 className="font-semibold text-gray-900 truncate">{collection.name}</h3>
                    <p className="text-sm text-gray-500">{collection.mediaCount} pins</p>
                  </div>
                </Link>
                
                {/* Dropdown Menu */}
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenDropdown(openDropdown === collection.id ? null : collection.id);
                    }}
                    className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="5" r="2" />
                      <circle cx="12" cy="12" r="2" />
                      <circle cx="12" cy="19" r="2" />
                    </svg>
                  </button>
                  
                  {openDropdown === collection.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setOpenDropdown(null)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-20 overflow-hidden">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            openEditModal(collection);
                          }}
                          className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit board
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            openDeleteConfirm(collection);
                          }}
                          className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete board
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && collections.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Create your first board</h3>
            <p className="text-gray-600 mb-6">Organize your pins into boards</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-[#e60023] text-white rounded-full font-semibold hover:bg-[#ad081b] transition-colors"
            >
              Create board
            </button>
          </div>
        )}
      </main>

      {/* Create Board Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Create board</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="Like Places to Go or Recipes to Make"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e60023] focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  placeholder="What's your board about?"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e60023] focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewBoardName('');
                  setNewBoardDescription('');
                }}
                disabled={creating}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBoard}
                disabled={creating || !newBoardName.trim()}
                className="flex-1 px-4 py-3 bg-[#e60023] text-white rounded-full font-semibold hover:bg-[#ad081b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Board Modal */}
      {showEditModal && editingBoard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Edit board</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={editBoardName}
                  onChange={(e) => setEditBoardName(e.target.value)}
                  placeholder="Board name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e60023] focus:border-transparent"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={editBoardDescription}
                  onChange={(e) => setEditBoardDescription(e.target.value)}
                  placeholder="What's your board about?"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e60023] focus:border-transparent resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingBoard(null);
                  setEditBoardName('');
                  setEditBoardDescription('');
                }}
                disabled={updating}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEditBoard}
                disabled={updating || !editBoardName.trim()}
                className="flex-1 px-4 py-3 bg-[#e60023] text-white rounded-full font-semibold hover:bg-[#ad081b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {updating ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingBoard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">Delete this board?</h2>
            <p className="text-gray-600 mb-6">
              Once you delete <span className="font-semibold">{deletingBoard.name}</span>, you can't undo it!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletingBoard(null);
                }}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBoard}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-full font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
