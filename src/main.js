//frontend
import "./style.css";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import moment from 'moment';
import { io } from 'socket.io-client';

//Join Users Button
const profileBtn = document.getElementById("profile")
const usernameInput = document.getElementById("username")
const avatarInput = document.getElementById("avatar")
const fileName = document.getElementById("file-name")
const joinBtn = document.getElementById("join-user")
const cancelJoin = document.getElementById("cancel-join")

//Form Modal
const joinModal = document.getElementById("join-modal")
const closeModal = document.getElementById("cancel-join")

//My Location Button Handler
const myLocationBtn = document.getElementById("my-location");
const infoLocation = document.querySelector(".info-location")
const infoLocationCloseBtn = document.querySelector(".info-location__close-icon")

//User List
const userListBtn = document.getElementById("user-list");
const userListPanel = document.getElementById("user-list-panel");
const userListItems = document.querySelector(".user-list-items")

//socket io connect
const socket = io('http://localhost:3000');

socket.on("user-added", (userData) => {
    // Clear existing user list
    userListItems.innerHTML = '';

    // Add each user to the list
    for (let person of userData) {
        const { socketId, username, avatarBuffer, joinedAt } = person; // Fixed: destructure from person, not userData

        const userItem = document.createElement("div")
        userItem.classList.add("user-item")
        userItem.innerHTML = `
            <img src="${avatarBuffer}" alt="Avatar" class="user-avatar">
            <div class="user-info">
                <span class="user-name">${username}</span>
                <span class="user-join-time">${joinedAt}</span>
            </div>
        `
        userListItems.appendChild(userItem)
    }
})

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
                    id: 'current_user'
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
    profileBtn.onclick = () => {
        joinModal.style.visibility = "visible"
    }

    closeModal.onclick = () => {
        joinModal.style.visibility = "hidden"
    }

    // User List Toggle Handler
    userListBtn.onclick = () => {
        userListPanel.classList.toggle("show");
    }

    // Add User
    joinBtn.onclick = (e) => {
        e.preventDefault();

        const name = usernameInput.value.trim();
        const file = avatarInput.files[0];

        if (!name || !file) {
            alert("Iltimos, ism va rasmni kiriting.");
            return;
        }

        // Clear form first
        usernameInput.value = "";
        avatarInput.value = null;
        fileName.textContent = "";
        joinModal.style.visibility = "hidden";

        // Get location and send user data
        navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
                const coordinates = [coords.longitude, coords.latitude];

                socket.emit("add-user", {
                    username: name,
                    socketId: socket.id,
                    avatarBuffer: URL.createObjectURL(file),
                    avatarName: file.name,
                    coordinates: coordinates,
                });

                console.log("User coordinates:", coordinates);
            },
            (error) => {
                console.error("Geolocation error:", error);
                // Still add user without coordinates if location fails
                socket.emit("add-user", {
                    username: name,
                    socketId: socket.id,
                    avatarBuffer: URL.createObjectURL(file),
                    avatarName: file.name,
                    coordinates: null,
                });
            }
        );
    };

    // Onchange File Name
    avatarInput.onchange = () => {
        const file = avatarInput.files[0];
        if (file) {
            fileName.textContent = file.name;
        } else {
            fileName.textContent = "Fayl tanlanmadi";
        }
    };
});