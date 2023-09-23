
let isResizing = false;
let coordPairCounter = 4; // as we start with 4 pairs
let bearingDistanceCounter = 4;
let activeOption;
var map;
let selectedCoordSystem1 = "epsg:26331"; // default value for option1
let selectedCoordSystem2 = "epsg:26331"; // default value for option2
let w = 1;


proj4.defs("EPSG:3857", "+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext +no_defs");
proj4.defs("EPSG:32631", "+proj=utm +zone=31 +datum=WGS84 +units=m +no_defs");
proj4.defs("EPSG:32632", "+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs");
proj4.defs("EPSG:32633", "+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs");
proj4.defs("EPSG:26331", "+proj=utm +zone=31 +ellps=clrk80 +towgs84=-92,-93,122,0,0,0,0 +units=m +no_defs");
proj4.defs("EPSG:26332", "+proj=utm +zone=32 +ellps=clrk80 +towgs84=-92,-93,122,0,0,0,0 +units=m +no_defs");

function getRandomColor() {
    {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            {
                color += letters[Math.floor(Math.random() * 16)];
            }
        }
        return color;
    }
}

document.addEventListener("DOMContentLoaded", function () {

    const OSM = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        'maxZoom': 25
    });

    const Esri_WorldImagery = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        'maxZoom': 20
    });

    const googleSat = L.tileLayer('http://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 22,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });




    // Initialize map
    map = L.map('map', {
        layers: [
            OSM,
        ]
    }).setView([8.21, 4.71], 7); // set to desired location

    var parcels = new L.FeatureGroup().addTo(map);
    var drawnItems = new L.FeatureGroup().addTo(map);



    // add layer control
    var baseLayers = {
        'Open Street Map': OSM,
        'Google Sat': googleSat,
        'Esri World Imagery': Esri_WorldImagery,

    }
    var overlayLayers = {
        'Parcel': parcels,
        'Draw Items': drawnItems
    }
    var layerControl = L.control.layers(baseLayers, overlayLayers).addTo(map);

    const drawControl = new L.Control.Draw({
        draw: {
            rectangle: true,     // Allow drawing only rectangles
            polygon: true,      // Disable drawing polygons
            marker: true,       // Disable drawing markers
            circlemarker: false, // Disable drawing circle markers
            polyline: true      // Disable drawing polylines
        },
        edit: {
            featureGroup: drawnItems
        }
    });
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, function (e) {
        // drawnItems.clearLayers();
        const layer = e.layer;
        layer.setStyle({
            "fillOpacity": 0,
            "color": getRandomColor(),
            "weight": 1.5 * w,
            "opacity": 1
        });
        drawnItems.addLayer(layer);
    });

    map.on('draw:deleted', function (e) {
        const layers = e.layers;
        layers.eachLayer(function (layer) {
            drawnItems.removeLayer(layer);
        });
    });


    // add geocoder
    const geocoder = L.Control.geocoder({
        defaultMarkGeocode: false, // Don't add a marker to the map by default
    })
        .on('markgeocode', function (e) {
            // Zoom to the location after geocoding
            map.fitBounds(e.geocode.bbox);
        })
        .addTo(map);

    // Initialize Leaflet.measure control
    L.control.measure({
        position: 'topright',
        primaryLengthUnit: 'meters', secondaryLengthUnit: 'feets',
        primaryAreaUnit: 'sqmeters', secondaryAreaUnit: 'acres'
    }).addTo(map);


    document.getElementById('viewButton').addEventListener('click', function () {
        // Fetch coordinates from input fields and draw polygon on the map
        // For example:

        let coords

        switch (activeOption) {
            case 'option1-content':
                coords = getCoordinates();
                coords = convertToLatLongMultiple(coords, selectedCoordSystem1.toUpperCase())
                break;
            case 'option2-content':
                coords = getBDCoordinates();
                coords = convertToLatLongMultiple(coords, selectedCoordSystem2.toUpperCase())
                break;
            default:
                return
        }

        console.log('coords')
        console.log(coords)



        // let latlngs = [
        //     [51.509, -0.08],
        //     [51.503, -0.06],
        //     [51.51, -0.047]
        // ];

        let parcel_color = '#a41a1a';

        parcels.clearLayers();
        L.polygon(coords, { color: 'red' }).addTo(parcels);
        map.fitBounds(parcels.getBounds());
    });

    // Handle Option 2 by using turf.js for calculations using the bearing and distance
});

function toggleSection(id) {
    const sections = ['option1-content', 'option2-content'];

    sections.forEach(sectionId => {
        const sectionContent = document.getElementById(sectionId);
        if (sectionId === id) {
            sectionContent.style.display = sectionContent.style.display === "none" || sectionContent.style.display === "" ? "block" : "none";
            activeOption = id
        } else {
            sectionContent.style.display = "none";
        }
    });
}



document.querySelector(".resizer").addEventListener("mousedown", function (event) {
    isResizing = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', function () {
        isResizing = false;
        document.removeEventListener('mousemove', handleMouseMove);
    });
});

function handleMouseMove(event) {
    if (isResizing) {
        const leftPanel = document.querySelector('.left-pane');
        const rightPanel = document.querySelector('.right-pane');
        const resizer = document.querySelector('.resizer');

        const leftWidth = event.clientX;
        const rightWidth = window.innerWidth - event.clientX - resizer.offsetWidth;

        leftPanel.style.width = `${leftWidth}px`;
        rightPanel.style.width = `${rightWidth}px`;

        // leftPanel.style.width = `${event.clientX}px`;
    }
}


document.getElementById('addPair').addEventListener('click', function () {
    coordPairCounter++;
    const newPair = document.createElement('div');
    newPair.className = 'coordinate-pair all-coordinates';
    newPair.id = `coordinate-pair-${coordPairCounter}`;
    newPair.innerHTML = `
        <label>${coordPairCounter}. Easting: <input type="number" class="easting"></label>
        <label> Northing: <input type="number" class="northing"></label>
    `;
    document.getElementById('option1-content').insertBefore(newPair, document.getElementById('addPair'));
});

document.getElementById('removePair').addEventListener('click', function () {
    if (coordPairCounter > 1) { // Prevent removing all pairs
        const pairToRemove = document.getElementById(`coordinate-pair-${coordPairCounter}`);
        pairToRemove.parentNode.removeChild(pairToRemove);
        coordPairCounter--;
    }
});


function getCoordinates() {
    const coordinates = [];
    const pairs = document.querySelectorAll('.all-coordinates');

    pairs.forEach(pair => {
        const easting = pair.querySelector('.easting').value;
        const northing = pair.querySelector('.northing').value;
        console.log('northing')
        console.log(northing)

        // Ensure both easting and northing values are provided before adding to the array
        if (easting !== "" && northing !== "") {
            coordinates.push([parseFloat(easting), parseFloat(northing)]);
        }
    });

    return coordinates;
}


document.getElementById('addBearingDistance').addEventListener('click', function () {
    bearingDistanceCounter++;
    const newPair = document.createElement('div');
    newPair.className = 'bearing-distance-pair';
    newPair.id = `bearing-distance-pair-${bearingDistanceCounter}`;
    newPair.innerHTML = `
        <label>${bearingDistanceCounter}. Bearing : <input type="text" class="bearing"></label>
        <label>Distance: <input type="number" class="distance"></label>
    `;
    document.getElementById('option2-content').insertBefore(newPair, document.getElementById('addBearingDistance'));
});

document.getElementById('removeBearingDistance').addEventListener('click', function () {
    if (bearingDistanceCounter > 1) {
        const pairToRemove = document.getElementById(`bearing-distance-pair-${bearingDistanceCounter}`);
        pairToRemove.parentNode.removeChild(pairToRemove);
        bearingDistanceCounter--;
    }
});

function isValidBearing(inputElement) {
    const bearing = inputElement.value;
    const regex = /^([0-9]{1,3})\s+([0-9]{1,2})(?:\s+([0-9]{1,2}(?:\.\d{1,2})?))?$/;
    const match = bearing.match(regex);

    if (match) {
        const degrees = parseFloat(match[1]);
        const minutes = parseFloat(match[2]);
        const seconds = match[3] ? parseFloat(match[3]) : 0;

        if (degrees >= 0 && degrees < 360 && minutes >= 0 && minutes < 60 && seconds >= 0 && seconds < 60) {
            inputElement.style.borderColor = ""; // Reset border color
            return true;
        }
    }

    inputElement.style.borderColor = "red"; // Set border color to red
    return false;
}

document.addEventListener('input', function (e) {
    if (e.target && e.target.classList.contains('bearing')) {
        isValidBearing(e.target);
    }
});


function getBearingAndDistanceData() {
    // Fetching the initial coordinate pair
    const initialEasting = parseFloat(document.getElementById('initial-easting').value);
    const initialNorthing = parseFloat(document.getElementById('initial-northing').value);

    const initialCoords = [initialEasting, initialNorthing];

    // Fetching all the pairs of bearing and distance
    const bearingDistancePairs = [];
    const bearingDistanceElements = document.getElementsByClassName('bearing-distance-pair');

    for (let i = 0; i < bearingDistanceElements.length; i++) {
        const bearingElement = bearingDistanceElements[i].querySelector('.bearing');
        const distanceElement = bearingDistanceElements[i].querySelector('.distance');

        const bearing = bearingElement.value;
        const distance = parseFloat(distanceElement.value);

        bearingDistancePairs.push([bearing, distance]);
    }

    return [initialCoords, bearingDistancePairs];
}


function dmsToDecimal(deg, min, sec = 0) {
    return parseFloat(deg) + parseFloat(min) / 60 + parseFloat(sec) / 3600;
}

function calculateNewCoordinatesFromEastingNorthing(initialCoords, bearing, distance) {
    const bearingDecimal = dmsToDecimal(...bearing.split(/\s+/));
    const bearingRad = (Math.PI / 180) * bearingDecimal;

    // Calculate the delta easting and northing based on bearing and distance
    const deltaEasting = distance * Math.sin(bearingRad);
    const deltaNorthing = distance * Math.cos(bearingRad);

    // Calculate the new easting and northing
    const newEasting = initialCoords[0] + deltaEasting;
    const newNorthing = initialCoords[1] + deltaNorthing;

    return [newEasting, newNorthing];
}

function generateCoordinates(initialCoord, bearingDistancePairs) {

    let currentCoord = initialCoord;
    const coordinates = [initialCoord];  // Start with the initial coordinate

    for (let pair of bearingDistancePairs) {
        const [bearing, distance] = pair;
        currentCoord = calculateNewCoordinatesFromEastingNorthing(currentCoord, bearing, distance);
        coordinates.push(currentCoord);
    }

    return coordinates;
}


function getBDCoordinates() {
    let data = getBearingAndDistanceData()
    coords = generateCoordinates(...data)
    return coords
}

function switchLongLat(arr) {
    let switched = []
    for (let i = 0; i < arr.length; i++) {
        switched.push(arr[i][1], arr[i][0])
    }
    return switched;
}

function convertToLatLong(coordinates, epsgCode) {
    const sourceProjection = proj4.defs(epsgCode);
    const destProjection = proj4.defs("EPSG:4326"); // EPSG:4326 = WGS 84, which represents latitude and longitude
    let lonLat = proj4(sourceProjection, destProjection, coordinates);
    return [lonLat[1], lonLat[0]]
}

function convertToLatLongMultiple(coordinates, epsgCode) {
    converted = [];
    for (let i = 0; i < coordinates.length; i++) {
        let conv = convertToLatLong(coordinates[i], epsgCode);
        converted.push(conv);

    }

    return converted;
}

function updateCoordSystem1(value) {
    selectedCoordSystem1 = value;
    console.log("Selected Coordinate System:", selectedCoordSystem1); // Just for debugging. You can remove this line.
}

function updateCoordSystem2(value) {
    selectedCoordSystem2 = value;
    console.log("Selected Coordinate System:", selectedCoordSystem2); // Just for debugging. You can remove this line.
}











