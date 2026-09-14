import React, { useRef, useState } from 'react';

// Generic image picker with preview. Calls onFileSelected(file) when the user
// chooses a valid image; parent decides when/how to upload it.
export default function ImageUpload({ onFileSelected, previewSrc, onClearPreview, children }) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');

  function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB');
      return;
    }
    setError('');
    onFileSelected(file);
    e.target.value = '';
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <button type="button" onClick={() => inputRef.current?.click()}>
        {children || '📷'}
      </button>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}

      {previewSrc && (
        <div className="relative inline-block mt-2">
          <img src={previewSrc} alt="preview" className="w-20 h-20 object-cover rounded-lg border" />
          <button
            type="button"
            onClick={onClearPreview}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-dune-900 text-white text-xs flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
