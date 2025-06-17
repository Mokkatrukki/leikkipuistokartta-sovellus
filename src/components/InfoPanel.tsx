import React from 'react';

import type { SelectedDistrictData, PlaygroundFeatureProperties } from '../App'; // Import types from App

interface InfoPanelProps {
  selectedDistrict: SelectedDistrictData | null;
  onPlaygroundSelect: (id: string | null) => void;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ selectedDistrict, onPlaygroundSelect }) => {
  if (!selectedDistrict || !selectedDistrict.properties) {
    return (
      <div style={{ padding: '20px', borderLeft: '1px solid #ccc', height: '100vh', overflowY: 'auto' }}>
        <h2>Information Panel</h2>
        <p>Click on a district on the map to see details here.</p>
      </div>
    );
  }

  const districtName = selectedDistrict.properties.NIMI || selectedDistrict.properties.Aj_kaupu_1 || selectedDistrict.properties.name || 'Unknown District';
  const { playgroundInfo } = selectedDistrict;

  const namedPlaygrounds = playgroundInfo?.featurePropertiesList.filter(pg => {
    // Log each playground's properties being checked for 'named'
    // console.log('Checking for named:', pg, 'tags.name:', pg.tags?.name, 'direct name:', pg.name);
    const name = pg.tags?.name || pg.name; // Check both tags.name and direct name property
    return name && String(name).trim() !== '';
  }) || [];
  
  const unnamedPlaygrounds = playgroundInfo?.featurePropertiesList.filter(pg => {
    // Log each playground's properties being checked for 'unnamed'
    // console.log('Checking for unnamed:', pg, 'tags.name:', pg.tags?.name, 'direct name:', pg.name);
    const name = pg.tags?.name || pg.name; // Check both tags.name and direct name property
    return !name || String(name).trim() === '';
  }) || [];

  const renderPlaygroundList = (list: PlaygroundFeatureProperties[], title: string) => {
    if (list.length === 0) return null;
    return (
      <>
        <h4>{title} ({list.length})</h4>
        {list.map((pgProps, index) => (
          <div 
            key={`${title}-${index}-${pgProps.id}`}
            style={{ border: '1px solid #eee', padding: '10px', marginBottom: '10px', borderRadius: '4px', cursor: 'pointer' }}
            onClick={() => onPlaygroundSelect(pgProps.id as string | null)} // Assuming pgProps.id is the unique ID
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            <strong>{pgProps.tags?.name || pgProps.name || 'Unnamed Playground'} (ID: {pgProps.id})</strong>
            <pre style={{ fontSize: '0.8em', whiteSpace: 'pre-wrap', wordBreak: 'break-all', backgroundColor: '#f9f9f9', padding: '5px' }}>
              {JSON.stringify(pgProps, null, 2)}
            </pre>
          </div>
        ))}
      </>
    );
  };

  return (
    <div style={{ padding: '20px', borderLeft: '1px solid #ccc', height: '100vh', overflowY: 'auto' }}>
      <h2>{districtName}</h2>
      {playgroundInfo ? (
        <>
          <p><strong>Total Playgrounds Found:</strong> {playgroundInfo.count}</p>
          
          {renderPlaygroundList(namedPlaygrounds, 'Named Playgrounds')}
          {renderPlaygroundList(unnamedPlaygrounds, 'Unnamed Playgrounds / No Name Tag')}

          {playgroundInfo.featurePropertiesList.length === 0 && playgroundInfo.count > 0 && 
            <p>Playgrounds counted, but no specific feature details were processed.</p>}
        </>
      ) : (
        <p>No playground information available for this district.</p>
      )}
      
      <hr style={{ margin: '20px 0' }}/>
      <h3>Raw District Properties (Debug):</h3>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
        {JSON.stringify(selectedDistrict.properties, null, 2)}
      </pre>
      
      {playgroundInfo && (
        <>
          <h3>Raw PlaygroundInfo Object (Debug):</h3>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
            {JSON.stringify(playgroundInfo, null, 2)}
          </pre>
        </>
      )}
    </div>
  );
};

export default InfoPanel;
