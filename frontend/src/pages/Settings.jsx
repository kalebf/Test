import { useState, useEffect } from 'react';
import NavBar from './NavBar';
import { authAPI } from '../services/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('edit-profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    display_name: "",
    email: "",
    user_type: ""
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [message, setMessage] = useState({ text: '', type: '' });

  // Load user profile on component mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getProfile();
      setProfile(response.data);
      
      // Also store in sessionStorage
      sessionStorage.setItem("user_name", response.data.display_name);
      sessionStorage.setItem("user_email", response.data.email);
      sessionStorage.setItem("user_type", response.data.user_type);
    } catch (error) {
      console.error("Error loading profile:", error);
      setMessage({ 
        text: error.response?.data?.detail || "Failed to load profile", 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });
    
    try {
      const response = await authAPI.updatePersonalProfile({
        display_name: profile.display_name,
        email: profile.email
      });
      
      setMessage({ 
        text: response.data.message || "Profile updated successfully", 
        type: 'success' 
      });
      
      // Update sessionStorage
      sessionStorage.setItem("user_name", profile.display_name);
      sessionStorage.setItem("user_email", profile.email);
      
      // Reload profile
      setTimeout(() => loadProfile(), 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ 
        text: error.response?.data?.detail || "Failed to update profile", 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  const validatePassword = (password) => {
    const hasMinLength = password.length >= 9;
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNoSpaces = !/\s/.test(password);
    return hasMinLength && hasNumber && hasSpecialChar && hasNoSpaces;
  };

  const handleChangePassword = async () => {
    if (!passwordData.old_password || !passwordData.new_password || !passwordData.confirm_password) {
      setMessage({ text: 'Please fill in all password fields', type: 'error' });
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }

    if (!validatePassword(passwordData.new_password)) {
      setMessage({ text: 'Password does not meet requirements', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const response = await authAPI.changePassword({
        old_password: passwordData.old_password,
        new_password: passwordData.new_password
      });
      
      setMessage({ 
        text: response.data.message || "Password changed successfully", 
        type: 'success' 
      });
      
      // Clear password fields
      setPasswordData({
        old_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      console.error("Error changing password:", error);
      setMessage({ 
        text: error.response?.data?.detail || "Failed to change password", 
        type: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50" style={{ backgroundColor: '#E0E0E0' }}>
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" style={{ backgroundColor: '#E0E0E0' }}>
      <NavBar />
      
      <div className="flex-1 w-full">
        <div className="p-8 h-screen flex flex-col relative">
          <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
              <h1 className="text-3xl font-bold text-[#333333]">Settings</h1>
            </div>

            {message.text && (
              <div className={`mb-4 p-4 rounded-lg ${
                message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-400' : 
                message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-400' : 
                'bg-blue-100 text-blue-700 border border-blue-400'
              }`}>
                {message.text}
              </div>
            )}

            <div className="bg-white rounded-2xl border-2 border-[#86a59c] shadow-sm flex-1 flex overflow-hidden">
              <div className="flex w-full">
                <nav className="w-64 border-r border-gray-200 p-6 flex-shrink-0 overflow-y-auto">
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveTab('edit-profile')}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'edit-profile'
                          ? 'bg-[#7d5ba6] text-white'
                          : 'text-[#333333] hover:bg-gray-100'
                      }`}
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('change-password')}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === 'change-password'
                          ? 'bg-[#7d5ba6] text-white'
                          : 'text-[#333333] hover:bg-gray-100'
                      }`}
                    >
                      Change Password
                    </button>
                  </div>
                </nav>

                <div className="flex-1 p-8 overflow-y-auto">
                  <div className="max-w-2xl">
                    {activeTab === 'edit-profile' && (
                      <div>
                        <h2 className="text-2xl font-bold text-[#333333] mb-2">Edit Profile</h2>
                        <p className="text-gray-600 mb-6">Update your profile information</p>

                        <div className="space-y-6">
                          <div>
                            <label className="text-sm font-medium text-[#333333] mb-2 block">Full Name</label>
                            <input
                              type="text"
                              value={profile.display_name}
                              onChange={(e) => setProfile({...profile, display_name: e.target.value})}
                              className="w-full px-4 py-2 border-2 border-[#86a59c] rounded-lg"
                              disabled={saving}
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium text-[#333333] mb-2 block">Email</label>
                            <input
                              type="email"
                              value={profile.email}
                              onChange={(e) => setProfile({...profile, email: e.target.value})}
                              className="w-full px-4 py-2 border-2 border-[#86a59c] rounded-lg"
                              disabled={saving}
                            />
                          </div>

                          <button 
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="px-6 py-2 bg-[#89ce94] text-white rounded-lg hover:bg-[#7dc987] disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            {saving ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    )}

                    {activeTab === 'change-password' && (
                      <div>
                        <h2 className="text-2xl font-bold text-[#333333] mb-2">Change Password</h2>
                        <p className="text-gray-600 mb-6">Update your password to keep your account secure</p>

                        <div className="space-y-6">
                          <div>
                            <label className="text-sm font-medium mb-2">Old Password</label>
                            <input
                              type="password"
                              value={passwordData.old_password}
                              onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                              className="w-full px-4 py-2 border-2 border-[#86a59c] rounded-lg"
                              disabled={saving}
                              placeholder="Enter old password"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2">New Password</label>
                            <input
                              type="password"
                              value={passwordData.new_password}
                              onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                              className="w-full px-4 py-2 border-2 border-[#86a59c] rounded-lg"
                              disabled={saving}
                              placeholder="Enter new password"
                            />
                          </div>

                          <div>
                            <label className="text-sm font-medium mb-2">Confirm Password</label>
                            <input
                              type="password"
                              value={passwordData.confirm_password}
                              onChange={(e) => setPasswordData({...passwordData, confirm_password: e.target.value})}
                              className="w-full px-4 py-2 border-2 border-[#86a59c] rounded-lg"
                              disabled={saving}
                              placeholder="Confirm new password"
                            />
                          </div>

                          <div className="p-4 bg-gray-50 rounded-lg border-2 border-[#86a59c]">
                            <p className="text-sm font-medium mb-2">Password Requirements:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              <li>• At least 9 characters</li>
                              <li>• Must contain a number</li>
                              <li>• Must contain a special character</li>
                              <li>• No spaces allowed</li>
                            </ul>
                          </div>

                          <button 
                            onClick={handleChangePassword}
                            disabled={saving}
                            className="px-6 py-2 bg-[#89ce94] text-white rounded-lg hover:bg-[#7dc987] disabled:bg-gray-300 disabled:cursor-not-allowed"
                          >
                            {saving ? 'Changing Password...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile Preview */}
                <div className="w-80 p-8 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full bg-[#89ce94] flex items-center justify-center mb-4">
                    <span className="text-4xl font-bold text-white">
                      {getInitials(profile.display_name)}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold mb-2">{profile.display_name || "User"}</h3>
                  <p className="text-sm text-gray-600">{profile.email || "email@example.com"}</p>
                  <p className="text-xs text-gray-500 mt-2 capitalize">{profile.user_type?.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="fixed bottom-4 right-4 text-xs text-gray-500">
            App is owned by Team Nova in partner with Commerce Bank
          </div>
        </div>
      </div>
    </div>
  );
}