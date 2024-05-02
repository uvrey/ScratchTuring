import React, { useState } from 'react';

function TuringCheckbox(props) {
  const [selectedKey, setSelectedKey] = useState(null); // Stores the selected key

  const handleCheckboxChange = (event) => {
    const newSelectedKey = event.target.value;
    if (newSelectedKey !== selectedKey) { // Only update if different key is selected
      setSelectedKey(newSelectedKey);
    }
  };

  return (
    <div>
      {Object.keys(props.items).map((key) => (
        <label key={key}>
          <input
            type="checkbox"
            value={key}
            checked={selectedKey === key} // Set checked based on selectedKey
            onChange={handleCheckboxChange}
          />
          {key}
        </label>
      ))}
    </div>
  );
}

export default TuringCheckbox;
