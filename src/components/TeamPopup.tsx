import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { TeamMember } from '../types';
import { teamMemberService } from '../services/teamMemberService';
import clsx from 'clsx';

interface TeamPopupProps {
  isOpen: boolean;
  onClose: () => void;
  teamMembers: TeamMember[];
  onTeamMembersChange: (teamMembers: TeamMember[]) => void;
  userId: string;
}

const memberColors = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-green-100 text-green-700 border-green-200',
  'bg-yellow-100 text-yellow-700 border-yellow-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-red-100 text-red-700 border-red-200',
  'bg-orange-100 text-orange-700 border-orange-200',
];

export const TeamPopup: React.FC<TeamPopupProps> = ({
  isOpen,
  onClose,
  teamMembers,
  onTeamMembersChange,
  userId,
}) => {
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedColor, setSelectedColor] = useState(memberColors[0]);
  const [isLoading, setIsLoading] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Function to extract color name from color class string
  const getColorName = (colorString: string) => {
    // Extract the color name from the first part (e.g., 'bg-blue-100' -> 'blue')
    const match = colorString.match(/bg-(\w+)-100/);
    return match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : 'Color';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleAddMember = async () => {
    if (!newMemberName.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const newMember = await teamMemberService.createTeamMember({
        name: newMemberName.trim(),
        color: selectedColor,
        user_id: userId,
      });
      
      onTeamMembersChange([...teamMembers, newMember]);
      setNewMemberName('');
      setSelectedColor(memberColors[0]);
    } catch (error) {
      console.error('Failed to create team member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      await teamMemberService.deleteTeamMember(memberId);
      onTeamMembersChange(teamMembers.filter(member => member.id !== memberId));
    } catch (error) {
      console.error('Failed to delete team member:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={popupRef}
        className="bg-white rounded-xl shadow-2xl max-w-md w-full p-0 relative transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold !text-gray-800">Team Members</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Add New Team Member */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Team Member</h4>
            
            {/* Member Name Input */}
            <div className="mb-3">
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddMember();
                  }
                }}
                placeholder="Member name (e.g., John, Sarah, Mike)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Choose Color</label>
              <div className="flex flex-wrap gap-2">
                {memberColors.map((color, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedColor(color)}
                    className={clsx(
                      'inline-flex items-center px-3 py-2 rounded-full text-xs font-medium border cursor-pointer transition-all',
                      color,
                      selectedColor === color ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:scale-105'
                    )}
                  >
                    {getColorName(color)}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleAddMember}
              disabled={!newMemberName.trim() || isLoading}
              className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Adding...' : 'Add Team Member'}
            </button>
          </div>

          {/* Existing Team Members */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Existing Team Members</h4>
            {teamMembers.length === 0 ? (
              <p className="text-gray-500 text-sm">No team members added yet. Create your first team member above!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {teamMembers.map((member) => (
                  <span
                    key={member.id}
                    className={clsx(
                      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                      member.color
                    )}
                  >
                    {member.name}
                    <button
                      onClick={() => handleDeleteMember(member.id)}
                      className="ml-2 text-gray-600 hover:text-red-600 transition-colors"
                      title="Delete team member"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
