window.mapPins = {
  // 道の駅ピン: stamped=true/false で色が変わる
  stationPin(stamped) {
    const color = stamped ? '#4CAF50' : '#9E9E9E';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M 16 40 C 8 32 1 26 1 16 A 15 15 0 1 1 31 16 C 31 26 24 32 16 40 Z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <text x="16" y="22" font-size="13" font-weight="bold" text-anchor="middle" fill="white" font-family="sans-serif">道</text>
    </svg>`;
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(32, 40),
      anchor: new google.maps.Point(16, 40)
    };
  },

  // 出発地ピン: 家型・オレンジ
  startPin() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M 16 40 C 8 32 1 26 1 16 A 15 15 0 1 1 31 16 C 31 26 24 32 16 40 Z" fill="#FF8C00" stroke="white" stroke-width="1.5"/>
      <polygon points="16,6 4,17 28,17" fill="white"/>
      <rect x="8" y="17" width="16" height="11" rx="1" fill="white"/>
      <rect x="13" y="21" width="6" height="7" rx="1" fill="#FF8C00"/>
    </svg>`;
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(32, 40),
      anchor: new google.maps.Point(16, 40)
    };
  },

  // 目的地ピン: 雫型・dayNumber(1-7)で色分け・order(数字)を表示
  destinationPin(dayNumber, order) {
    const colors = {
      1: '#E53935',
      2: '#FB8C00',
      3: '#FDD835',
      4: '#43A047',
      5: '#039BE5',
      6: '#1E88E5',
      7: '#8E24AA'
    };
    const color = colors[dayNumber] || colors[1];
    const textColor = dayNumber === 3 ? '#333333' : 'white';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M 16 40 C 8 32 1 26 1 16 A 15 15 0 1 1 31 16 C 31 26 24 32 16 40 Z" fill="${color}" stroke="white" stroke-width="1.5"/>
      <text x="16" y="22" font-size="14" font-weight="bold" text-anchor="middle" fill="${textColor}" font-family="sans-serif">${order}</text>
    </svg>`;
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(32, 40),
      anchor: new google.maps.Point(16, 40)
    };
  }
};
