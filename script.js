let map;
let marker;
let autocomplete;

function initAutocomplete() {
  const input = document.getElementById("location");
  autocomplete = new google.maps.places.Autocomplete(input, {
    types: ["(cities)"],
    fields: ["geometry", "name"],
  });

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();
    if (place.geometry) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const placeName = place.name;

      localStorage.setItem('lastSearchedLocation', placeName);
      getWeatherByCoordinates(lat, lng, placeName);
    }
  });
}

function getWeather() {
  const locationInput = document.getElementById('location').value.trim();
  if (!locationInput) {
    alert('Inserisci una località!');
    return;
  }

  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: locationInput }, function (results, status) {
    if (status === 'OK' && results[0]) {
      const lat = results[0].geometry.location.lat();
      const lng = results[0].geometry.location.lng();
      const placeName = results[0].formatted_address;

      localStorage.setItem('lastSearchedLocation', locationInput);
      getWeatherByCoordinates(lat, lng, placeName);
    } else {
      alert('Località non trovata!');
    }
  });
}

function getWeatherByCoordinates(lat, lng, placeName = '') {
  const apiKey = '889bc1d884914a61801154738250206';
  const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lng}&days=3&lang=it`;

  document.getElementById('weather').innerHTML = "<p>Caricamento dati meteo...</p>";
  document.getElementById('forecast-link').style.display = 'none';

  fetch(url)
    .then(response => response.json())
    .then(data => {
      localStorage.setItem('forecast3days', JSON.stringify(data.forecast.forecastday));
      document.getElementById('forecast-link').style.display = 'inline-block';

      if (!map) {
        map = new google.maps.Map(document.getElementById('map'), { center: { lat, lng }, zoom: 10 });
      } else {
        map.setCenter({ lat, lng });
      }

      if (marker) marker.setMap(null);
      marker = new google.maps.Marker({ position: { lat, lng }, map: map });

      const today = data.forecast.forecastday[0];
      let html = `
        <h3>${placeName || data.location.name}</h3>
        <p><strong>🌡 Temperatura attuale:</strong> ${data.current.temp_c}°C</p>
        <p><strong>🌤 Condizioni:</strong> ${data.current.condition.text}</p>
        <img src="https:${data.current.condition.icon}" alt="Icona meteo">
        <h4>Previsioni orarie</h4>
      `;

      const currentHour = new Date().getHours();
      today.hour.forEach(hour => {
        const hourTime = new Date(hour.time).getHours();
        if (hourTime >= currentHour) {
          const timeStr = hourTime.toString().padStart(2, '0');
          html += `
            <div class="weather-hour fade-in">
              <span>${timeStr}:00 – ${hour.temp_c}°C, ${hour.condition.text}</span>
              <img src="https:${hour.condition.icon}" alt="Icona meteo" />
            </div>
          `;
        }
      });

      document.getElementById('weather').innerHTML = html;
    })
    .catch(error => {
      console.error("Errore nel recupero dati:", error);
      document.getElementById('weather').innerHTML = "<p>Errore nel caricamento dei dati meteo.</p>";
    });
}

function saveLocation() {
  const location = document.getElementById('location').value.trim();
  if (location) {
    let saved = JSON.parse(localStorage.getItem('locations') || '[]');
    if (!saved.includes(location)) {
      saved.push(location);
      localStorage.setItem('locations', JSON.stringify(saved));
      showSavedLocations();
    }
  }
}

function deleteLocation(location) {
  let saved = JSON.parse(localStorage.getItem('locations') || '[]');
  saved = saved.filter(loc => loc !== location);
  localStorage.setItem('locations', JSON.stringify(saved));
  showSavedLocations();
}

function showSavedLocations() {
  const saved = JSON.parse(localStorage.getItem('locations') || '[]');
  const div = document.getElementById('saved-locations');
  div.innerHTML = '<h4>📍 Località salvate:</h4>' + saved.map(loc => `
    <span style="display:inline-block; margin:5px;">
      <button onclick="document.getElementById('location').value='${loc}'; getWeather();">${loc}</button>
      <button onclick="deleteLocation('${loc}')" style="background:red;">🗑</button>
    </span>
  `).join('');
}

window.onload = () => {
  showSavedLocations();

  document.getElementById('location').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      getWeather();
    }
  });

  const last = localStorage.getItem('lastSearchedLocation');
  if (last) {
    document.getElementById('location').value = last;
    getWeather();
  }
};
