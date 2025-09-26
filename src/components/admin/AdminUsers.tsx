import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  is_verified: boolean;
  total_volume: number;
  created_at: string;
};

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (search = '') => {
    setLoading(true);
    try {
      let query = supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      const { data, error } = await query;
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchTerm);
  };

  const toggleVerification = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_verified: !currentStatus }).eq('id', userId);
      if (error) throw error;
      toast.success(`User verification status updated.`);
      fetchUsers(searchTerm);
    } catch (error) {
      toast.error('Failed to update user.');
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">User Management</h2>
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full bg-dark-secondary border border-dark-border rounded-lg px-4 py-2 text-white"
        />
        <button type="submit" className="bg-brand-orange text-white px-4 py-2 rounded-lg">Search</button>
      </form>
      {loading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div> : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="p-2 text-gray-400">Name</th>
                <th className="p-2 text-gray-400">Email</th>
                <th className="p-2 text-gray-400">Volume</th>
                <th className="p-2 text-gray-400">Verified</th>
                <th className="p-2 text-gray-400">Joined</th>
                <th className="p-2 text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-dark-border hover:bg-dark-secondary">
                  <td className="p-2 text-white">{user.full_name || 'N/A'}</td>
                  <td className="p-2 text-gray-300">{user.email}</td>
                  <td className="p-2 text-white">₹{user.total_volume.toLocaleString()}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${user.is_verified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {user.is_verified ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="p-2 text-gray-400">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="p-2">
                    <button onClick={() => toggleVerification(user.id, user.is_verified)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded">
                      {user.is_verified ? 'Un-verify' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
