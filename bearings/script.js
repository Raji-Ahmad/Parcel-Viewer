var isForwardBearing = true;

function dmsToDecimal(deg, min, sec = 0) {
    return parseFloat(deg) + parseFloat(min) / 60 + parseFloat(sec) / 3600;
}

function calculateNewCoordinatesFromEastingNorthing(initialCoords, bearing, distance) {
    const bearingDecimal = dmsToDecimal(...bearing.split(/\s+/));

    if (!isForwardBearing) {
        bearingDecimal = bearingDecimal + 180;
    }
    const bearingRad = (Math.PI / 180) * bearingDecimal;

    // Calculate the delta easting and northing based on bearing and distance
    const deltaEasting = distance * Math.sin(bearingRad);
    const deltaNorthing = distance * Math.cos(bearingRad);

    // Calculate the new easting and northing
    const newEasting = initialCoords[0] + deltaEasting;
    const newNorthing = initialCoords[1] + deltaNorthing;

    return [newEasting, newNorthing];
}


function getBearingAndDistanceData() {
    // Fetching the initial coordinate pair
    const initialEasting = parseFloat(document.getElementById('easting').value);
    const initialNorthing = parseFloat(document.getElementById('northing').value);

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

function calculateNewCoordinatesFromEastingNorthing(initialCoords, bearing, distance) {
    var bearingDecimal = dmsToDecimal(...bearing.split(/\s+/));
    if (!isForwardBearing) {
        bearingDecimal = bearingDecimal + 180;
    }
    const bearingRad = (Math.PI / 180) * bearingDecimal;

    // Calculate the delta easting and northing based on bearing and distance
    const deltaEasting = distance * Math.sin(bearingRad);
    const deltaNorthing = distance * Math.cos(bearingRad);

    // Calculate the new easting and northing
    const newEasting = initialCoords[0] + deltaEasting;
    const newNorthing = initialCoords[1] + deltaNorthing;

    return [parseFloat(newEasting.toFixed(3)), parseFloat(newNorthing.toFixed(3))];
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

function addListener() {
    document.addEventListener('input', function (e) {
        if (e.target && e.target.classList.contains('bearing')) {
            isValidBearing(e.target);
            updateCoordinates();
        }
        else if (e.target && e.target.classList.contains('distance')) {
            updateCoordinates()
        }
    });
}

document.addEventListener('input', function (e) {
    if (e.target && e.target.classList.contains('bearing')) {
        isValidBearing(e.target);

    }
})

function calculateCoordinates() {
    var resultCoordinates = getBDCoordinates();
    var coordText = document.getElementsByClassName('coord-text');
    for (let i = 0; i < coordText.length; i++) {
        coordText[i].value = resultCoordinates[i + 1]
    }

}

function addInputSet() {

    // const index = currentCoordinates.length;
    const newSet = document.createElement('div');
    newSet.className = 'form-row mt-3 bearing-distance-pair';
    newSet.innerHTML = `
    <div id="bearing-distance-pair-1 "class="col-md-3 form-group">
        <label for="inputBearing">Bearing:</label>
        <input type="text" class="form-control bearing" id="inputBearing" placeholder="Enter bearing (0-360)" oninput="calculateCoordinates(0)" required>
    </div>
    <div class="col-md-3 form-group">
        <label for="inputDistance">Distance (in meters):</label>
        <input type="number" class="form-control distance" id="inputDistance" placeholder="Enter distance" oninput="calculateCoordinates()" required>
    </div>
    <div class="col-md-3 form-group">
        <label for="calculatedCoordinates">Calculated Coordinates:</label>
        <textarea class="form-control coord-text" id="calculatedCoordinates0" rows="1" readonly></textarea>
        
    </div>
    <div class="col-md-3 form-group align-end">
        <button type="button" class="btn btn-danger mt-1" onclick="deleteInputSet(0)">Delete</button>
    </div>
</div>
    `;
    document.getElementById('coordinateForm').appendChild(newSet);
}

function deleteInputSet(index) {
    const elementToDelete = document.getElementById(`calculatedCoordinates${index}`).parentNode.parentNode;
    elementToDelete.parentNode.removeChild(elementToDelete);
}


function toogleCheckboxChange() {
    if (document.getElementById('backCheckbox').checked) {
        isForwardBearing = false;
    } else {
        isForwardBearing = true;
    }
}


var checkbox = document.getElementById('backCheckbox');

checkbox.addEventListener('change', toogleCheckboxChange);