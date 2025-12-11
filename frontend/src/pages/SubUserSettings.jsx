import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function SettingsPageSubUser() {
  const [activeTab, setActiveTab] = useState('edit-profile');
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState({
    business_name: '',
    display_name: '',
    email: '',
    user_type: ''
  });

  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [message, setMessage] = useState({ text: '', type: '' });
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getProfile();
      if (response.data.user_type !== 'business_subuser') {
        navigate('/Dashboard');
        return;
      }
      
      setProfile(response.data);
      
      // Store in sessionStorage
      sessionStorage.setItem("user_name", response.data.display_name);
      sessionStorage.setItem("user_email", response.data.email);
      sessionStorage.setItem("business_name", response.data.business_name);
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
      const response = await authAPI.updateSubUserProfile({
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
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  const navItems = [
    { id: 'edit-profile', label: 'Edit Profile' },
    { id: 'change-password', label: 'Change Password' }
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50" style={{ backgroundColor: '#E0E0E0' }}>
        <aside 
          className={`flex flex-col items-center text-white h-screen transition-all duration-300 ${
            isExpanded ? 'w-64' : 'w-20'
          }`}
          style={{
            backgroundColor: "#174D1F",
            boxShadow: "4px 0 12px rgba(0, 0, 0, 0.15)",
          }}
        >
          {/* Sidebar skeleton */}
        </aside>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50" style={{ backgroundColor: '#E0E0E0' }}>
      {/* Sidebar */}
      <aside 
        className={`flex flex-col items-center text-white h-screen transition-all duration-300 ${
          isExpanded ? 'w-64' : 'w-20'
        }`}
        style={{
          backgroundColor: '#174D1F',
          boxShadow: '4px 0 12px rgba(0, 0, 0, 0.15)'
        }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="h-20 flex items-center w-full justify-center px-4 mb-2">
          <div 
            className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-gray-700 font-bold flex-shrink-0 text-lg"
            style={{
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              border: '3px solid #6BB577'
            }}
          >
            {getInitials(profile.display_name)}
          </div>
          {isExpanded && (
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{profile.display_name}</p>
              <p className="text-xs text-gray-300 opacity-80">Sub User</p>
            </div>
          )}
        </div>

        <nav className="flex-1 w-full px-2">
          <ul className="space-y-2">
            <li>
              <Link 
                to="/SubUserDash" 
                className="flex items-center px-4 py-3 rounded-lg transition-all duration-200 hover:bg-green-600 hover:bg-opacity-20"
              >
                <svg className="h-6 w-6 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
                {isExpanded && <span className="ml-4 text-sm font-medium whitespace-nowrap">Dashboard</span>}
              </Link>
            </li>
          </ul>
        </nav>

        <div className="h-24 flex items-center justify-center w-full px-4">
          <img
            src={isExpanded ? "/ClariFi-Logo.png" : "/ClariFi-Logo-Small.png"}
            alt="Logo"
            className={`object-contain transition-all duration-300 ${
              isExpanded ? 'h-12 w-auto' : 'h-14 w-14'
            }`}
            style={{ filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.25))' }}
          />
        </div>

        <div className="w-full px-2 pb-4 border-t border-white border-opacity-20 pt-2">
          <Link 
            to="/SubUserSettings" 
            className="flex items-center px-4 py-3 rounded-lg transition-all duration-200 hover:bg-green-600 hover:bg-opacity-20"
          >
            <svg className="h-6 w-6 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            {isExpanded && <span className="ml-4 text-sm font-medium whitespace-nowrap">Settings</span>}
          </Link>
        </div>
      </aside>

      <div className="flex-1 w-full">
        <div className="p-8 h-screen flex flex-col relative">
          <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-6">
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
                <div className="flex-1 flex border-r border-gray-200">
                  <nav className="w-64 border-r border-gray-200 p-6">
                    <div className="space-y-1">
                      {navItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium ${
                            activeTab === item.id
                              ? 'bg-[#7d5ba6] text-white'
                              : 'text-[#333333] hover:bg-gray-100'
                          }`}
                          disabled={saving}
                        >
                          {item.label}
                        </button>
                      ))}
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
                              <label className="text-sm font-medium text-[#333333] mb-2 block">Business Name</label>
                              <input
                                type="text"
                                value={profile.business_name}
                                readOnly
                                className="w-full px-4 py-2 border-2 border-[#86a59c] rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                              />
                              <p className="text-xs text-gray-500 mt-1">Business name cannot be changed by sub-users</p>
                            </div>

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
                              <label className="text-sm font-medium text-[#333333] mb-2 block">Old Password</label>
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
                              <label className="text-sm font-medium text-[#333333] mb-2 block">New Password</label>
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
                              <label className="text-sm font-medium text-[#333333] mb-2 block">Confirm Password</label>
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
                              <p className="text-sm font-medium text-[#333333] mb-2">Password Requirements:</p>
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
                </div>

                <div className="w-80 p-8 flex flex-col items-center">
                  <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full bg-[#89ce94] flex items-center justify-center mb-4">
                      <span className="text-4xl font-bold text-white">
                        {getInitials(profile.display_name)}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-[#7d5ba6] mb-2">
                      {profile.business_name}
                    </p>

                    <h3 className="text-xl font-bold text-[#333333] mb-2">
                      {profile.display_name}
                    </h3>

                    <p className="text-sm text-gray-600">
                      {profile.email}
                    </p>
                    
                    <p className="text-xs text-gray-500 mt-2 capitalize">Business Sub-user</p>
                  </div>
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