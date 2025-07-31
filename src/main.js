import "./style.css";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";

// DOM Elements

//Join Users Button
const joinBtn=document.getElementById("join-btn")
//Form Modal
const joinModal=document.getElementById("join-modal")
const closeModal=document.getElementById("cancel-join")
//My Location Button Handler
const myLocationBtn = document.getElementById("my-location");
const infoLocation = document.querySelector(".info-location")
const infoLocationCloseBtn = document.querySelector(".info-location__close-icon")



mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/dark-v11",
  attributionControl: false,
  logoPosition: "bottom-right",
  projection: "mercator",
  zoom: 9,
  hash: true,
  center: [69.2753, 41.3126],
});

map.on("load", async () => {
  map.addSource("me", {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: []
    }
  });

  map.addLayer({
    id: "points-layer",
    type: "circle",
    source: "me",
    paint: {
      'circle-color': '#2563EB',
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        8, 6,
        12, 10,
        16, 14
      ],
      'circle-stroke-color': '#FFFFFF',
      'circle-stroke-width': 1,
      'circle-opacity': 0.85,
      'circle-stroke-opacity': 1,
    }
  });

  // My Location Button Handler
  myLocationBtn.onclick = () => {
    function success(position) {
      const { longitude, latitude } = position.coords;
      const newData = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
        properties: {
          id: 'current_user' // Example property
        },
      };
      map.getSource("me").setData({
        type: "FeatureCollection",
        features: [newData]
      });
      map.flyTo({
        center: [longitude, latitude],
        zoom: 15,
        essential: true
      });
    }
    function error(err) {
      console.warn(`ERROR(${err.code}): ${err.message}`);
    }
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(success, error, options);
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };
  // My Location Info Button Handler
  map.on('click', 'points-layer', (e) => {
    const coordinates = e.features[0].geometry.coordinates

    const long = document.getElementById("info-location__longitude")
    const lat = document.getElementById("info-location__latitude")

    long.textContent = `longitude: ${coordinates[0].toFixed(6)}`
    lat.textContent = `latitude: ${coordinates[1].toFixed(6)}`


    infoLocation.classList.add("show")

    setTimeout(() => {
      infoLocation.classList.remove("show")
    }, 3_500)
  });
  // My Location Info Close Button Handler
  infoLocationCloseBtn.onclick = () => {
    infoLocation.classList.remove("show")
  }
  // Join Button Handler
  joinBtn.onclick=()=>{
    joinModal.style.visibility="visible"
  }
  closeModal.onclick=()=>{
    joinModal.style.visibility="hidden"
  }
});