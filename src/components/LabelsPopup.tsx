import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Label } from '../types';
import { labelService } from '../services/labelService';
import clsx from 'clsx';

interface LabelsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  labels: Label[];
  onLabelsChange: (labels: Label[]) => void;
  userId: string;
}

const labelColors = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-green-100 text-green-700 border-green-200',
  'bg-yellow-100 text-yellow-700 border-yellow-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-pink-100 text-pink-700 border-pink-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-red-100 text-red-700 border-red-200',
  'bg-orange-100 text-orange-700 border-orange-200',
];

export const LabelsPopup: React.FC<LabelsPopupProps> = ({
  isOpen,
  onClose,
  labels,
  onLabelsChange,
  userId,
}) => {
  const [newLabelName, setNewLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState(labelColors[0]);
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

  const handleAddLabel = async () => {
    if (!newLabelName.trim() || !userId) return;

    // Check for duplicate labels
    const labelExists = labels.some(label => 
      label.name.toLowerCase().trim() === newLabelName.toLowerCase().trim()
    );

    if (labelExists) {
      alert('A label with this name already exists!');
      return;
    }

    setIsLoading(true);
    try {
      const newLabel = await labelService.createLabel({
        name: newLabelName.trim(),
        color: selectedColor,
        user_id: userId,
      });

      onLabelsChange([...labels, newLabel]);
      setNewLabelName('');
      setSelectedColor(labelColors[0]);
    } catch (error) {
      console.error('Failed to create label:', error);
      alert('Failed to create label. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteLabel = async (labelId: string) => {
    try {
      await labelService.deleteLabel(labelId);
      onLabelsChange(labels.filter(label => label.id !== labelId));
    } catch (error) {
      console.error('Failed to delete label:', error);
      alert('Failed to delete label. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={popupRef}
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-0 relative transform transition-all duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold !text-gray-800">Manage Labels</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Add New Label */}
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Create New Label</h4>
            <div className="space-y-3">
              <input
                type="text"
                value={newLabelName}
                onChange={(e) => setNewLabelName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddLabel();
                  }
                }}
                placeholder="Label name (e.g., Bug, Feature, Design)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              {/* Color Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose Color</label>
                <div className="flex flex-wrap gap-2">
                  {labelColors.map((color, index) => (
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
                onClick={handleAddLabel}
                disabled={!newLabelName.trim() || isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Creating...' : 'Create Label'}
              </button>
            </div>
          </div>

          {/* Existing Labels */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Existing Labels</h4>
            {labels.length === 0 ? (
              <p className="text-gray-500 text-sm">No labels created yet. Create your first label above!</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {labels.map((label) => (
                  <span
                    key={label.id}
                    className={clsx(
                      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border',
                      label.color
                    )}
                  >
                    {label.name}
                    <button
                      onClick={() => handleDeleteLabel(label.id)}
                      className="ml-2 text-gray-600 hover:text-red-600 transition-colors"
                      title="Delete label"
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
