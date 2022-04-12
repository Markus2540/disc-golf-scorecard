const trackSelector = document.querySelector('#trackselector');
trackSelector.value = "none"; //Default selection for trackSelector
const addPlayer = document.querySelector('#addPlayer');
addPlayer.hidden = true; //If no track is selected the button for adding a player is hidden
let db;
const scoreBoard = document.querySelector('.scoreboard');
const modalBox = document.querySelector('.modalBox');
const modalBoxContent = document.querySelector('#modalBoxContent');
const previousResults = document.querySelector('.previousresults');
const darkBackground = document.querySelector('.darkbackground');
let arrowEventListenersAdded = false;
/*
Prevents arrowEventListeners from stacking. If this was true and the related if-clause were 
true, pressing the left and right buttons on the scoreboard manipulator would skip as many 
pages as you have opened the scoreboard manipulator.
*/
let parYht, today, date, timeStart, timeEnd, startTime, endTime, roundTime, trackName,
    scores, players, nmbrOfLanes, trackToBuild, selectedTrack;

function closeModalBox() {
    modalBox.style.display = 'none';
    darkBackground.style.display = 'none';
}

//enableSelector and disableSelector are used for enabling and disabling the track selector.
const enableSelector = document.querySelector('#es');
enableSelector.checked = true;
enableSelector.addEventListener('click', () => {
    trackSelector.disabled = false;
});
const disableSelector = document.querySelector('#ds');
disableSelector.addEventListener('click', () => {
    trackSelector.disabled = true;
});

window.onload = function () {
    fetch('json/discgolftracks.json').then(function (response) {
        return response.json();
    }).then(function (json) {
        let tracks = json;
        initialize(tracks);
    }).catch(function (err) {
        console.log('Fetch problem: ' + err.message);
    });

    let request = window.indexedDB.open('results_db', 1);

    request.onerror = function () {
        console.log('Database failed to open');
    };
    request.onsuccess = function () {
        console.log('Database opened successfully');

        db = request.result;

        displayData();
    };

    request.onupgradeneeded = function (e) {
        let db = e.target.result;
    
    // roundIDDB
    // trackNameDB
    // nmbrOfLanesDB
    // startDateDB
    // startTimeDB
    // endTimeDBDB
    // roundTimeDB
    // [playersDB]
    // [roundScoresDB]
    
        let objectStore = db.createObjectStore('scores_os', { keyPath: 'roundIDDB', autoIncrement: true });

        objectStore.createIndex('trackNameDB', 'trackNameDB', { unique: false });
        objectStore.createIndex('nmbrOfLanesDB', 'nmbrOfLanesDB', { unique: false });
        objectStore.createIndex('startDateDB', 'startDateDB', { unique: false });
        objectStore.createIndex('startTimeDB', 'startTimeDB', { unique: false });
        objectStore.createIndex('endTimeDB', 'endTimeDB', { unique: false });
        objectStore.createIndex('roundTimeDB', 'roundTimeDB', { unique: false });
        objectStore.createIndex('playersDB', 'playersDB', { unique: false });
        objectStore.createIndex('roundScoresDB', 'roundStoresDB', { unique: false });

        console.log('Database setup complete');
    }

    function saveScore() {
        let newItem = [{
            trackNameDB: trackName, nmbrOfLanesDB: nmbrOfLanes, startDateDB: date,
            startTimeDB: timeStart, endTimeDB: timeEnd, roundTimeDB: roundTime,
            playersDB: players, roundScoresDB: scores
        }];

        let transaction = db.transaction(['scores_os'], 'readwrite');

        transaction.oncomplete = function () {
            console.log(`transaction.oncomplete ajettu`);
            location.reload();
        };

        transaction.onerror = function () {
            console.log(`transaction.onerror ajettu`);
        };

        let objectStore = transaction.objectStore('scores_os');
        
        let request = objectStore.add(newItem[0]);

        
        request.onsuccess = function () {
            console.log(`request.onsuccess ajettu`);
        };
    }

    function initialize(tracks) {
        selectedTrack = trackSelector.value;

        trackSelector.addEventListener('change', () => {
            if (trackSelector.value === "none") {
                addPlayer.hidden = true;
                scoreBoard.innerHTML = "";
                modalBox.style.display = 'none';
            } else {
                addPlayer.hidden = false;
                selectedTrack = trackSelector.value;
                trackToBuild = [];
                for (let i = 0; i < tracks.length; i++) {
                    if (tracks[i].trackID === selectedTrack) {
                        trackToBuild = tracks[i];
                    }
                }
                today = new Date();
                date = `${(today.getDate())}/${(today.getMonth() + 1)}/${today.getFullYear()}`;
                timeStart = `${today.getHours()}:${today.getMinutes()}`;
                startTime = Date.now();

                buildScoreboard();
            }
        });

        function buildScoreboard() {
            parYht = 0;
            let distanceYht = 0;
            scoreBoard.innerHTML = "";
            let tblBody = document.createElement('tbody');
            let row = document.createElement('tr');
            let thead = document.createElement('thead');


            thead.appendChild(document.createElement('th')).textContent = `Pelaaja`;
            for (let j = 0; j < trackToBuild.lanes; j++) {
                thead.appendChild(document.createElement('th')).textContent = `${j + 1}`;
            }
            thead.appendChild(document.createElement('th')).textContent = `Yht.`;

            scoreBoard.appendChild(thead);

            row.appendChild(document.createElement('td')).textContent = `Par`;
            for (let j = 0; j < trackToBuild.lanes; j++) {
                row.appendChild(document.createElement('td')).textContent = `${trackToBuild.par[j]}`;
                parYht = parYht + trackToBuild.par[j];
            }
            row.appendChild(document.createElement('td')).textContent = `${parYht}`;
            tblBody.appendChild(row);
            row = document.createElement('tr');
            row.appendChild(document.createElement('td')).textContent = `Pituus`;
            for (let j = 0; j < trackToBuild.lanes; j++) {
                row.appendChild(document.createElement('td')).textContent = `${trackToBuild.distance[j]}`;
                distanceYht = distanceYht + trackToBuild.distance[j];
            }
            row.appendChild(document.createElement('td')).textContent = `${distanceYht}`;
            tblBody.appendChild(row);

            scoreBoard.appendChild(tblBody);
        }

        let columnIndex;

        function totalThrows() {
            if (newBodyRef.rows.length > 2) {
                for (let i = 0; i < newBodyRef.rows.length - 2; i++) {
                    let totalNumberOfThrows = 0;
                    for (let j = 1; j < newBodyRef.rows[newBodyRef.rows.length - 2].cells.length - 1; j++) {
                        let value = newBodyRef.rows[2 + i].cells[j].innerHTML;
                        value = Number(value);
                        totalNumberOfThrows = totalNumberOfThrows + value;
                    }
                    newBodyRef.rows[2 + i].cells[trackToBuild.lanes + 1].innerHTML = totalNumberOfThrows;
                }
            }
        }

        function buildLaneScoreManipulator(j) {
            const minusBtn = document.createElement('button');
            const plusBtn = document.createElement('button');
            const manipulatorDiv = document.createElement('div');
            let paragraph = document.createElement('p');
            let turns = newBodyRef.rows[(j + 2)].cells.item(columnIndex).innerHTML;
            modalBoxContent.appendChild(manipulatorDiv);
            manipulatorDiv.className = `scoreManipulator`;
            manipulatorDiv.appendChild(paragraph).textContent = `${newBodyRef.rows[(j + 2)].cells.item([0]).innerHTML}`;
            paragraph = document.createElement('p');
            manipulatorDiv.appendChild(paragraph).textContent = `${turns}`;
            paragraph.insertAdjacentElement("afterbegin", minusBtn);
            paragraph.insertAdjacentElement("beforeend", plusBtn);
            minusBtn.textContent = "-";
            plusBtn.textContent = "+";
            minusBtn.style.marginRight = "10px";
            plusBtn.style.marginLeft = "10px";
            var x = document.querySelector('.scoreboard').rows.length;

            plusBtn.addEventListener('click', function mBPlusBtn() {
                turns++;
                newBodyRef.rows[(j + 2)].cells.item(columnIndex).innerHTML = turns;
                paragraph.textContent = `${turns}`;
                paragraph.insertAdjacentElement("afterbegin", minusBtn);
                paragraph.insertAdjacentElement("beforeend", plusBtn);
                totalThrows();
            });

            minusBtn.addEventListener('click', function mBMinusBtn() {
                if (turns > 0) {
                    turns--;
                    newBodyRef.rows[(j + 2)].cells.item(columnIndex).innerHTML = turns;
                    paragraph.textContent = `${turns}`;
                    paragraph.insertAdjacentElement("afterbegin", minusBtn);
                    paragraph.insertAdjacentElement("beforeend", plusBtn);
                    totalThrows();
                }
            });
        }


        let newBodyRef;
        addPlayer.addEventListener('click', () => {
            let playerToAdd = window.prompt('Anna lisättävän pelaajan nimi: ');
            if (playerToAdd === "") {
                alert('Pelaajalla pitää olla nimi');
            } else if (playerToAdd === null) {
                return;
            } else {
                newBodyRef = document.querySelector('.scoreboard').getElementsByTagName('tbody')[0];
                var newRow = newBodyRef.insertRow(-1);

                let newCell = newRow.insertCell(0);
                let newText = document.createTextNode(playerToAdd);
                newCell.appendChild(newText);

                for (let i = 0; i < trackToBuild.lanes; i++) {
                    newCell = newRow.insertCell(i + 1);
                    newCell.textContent = 0;

                    let rows = document.querySelectorAll('tr');
                    let rowsArray = Array.from(rows);

                    newCell.addEventListener('click', function newCellEventListener(event) {
                        modalBox.style.display = 'block';
                        darkBackground.style.display = 'block';
                        const h2 = document.createElement('h2');
                        const para = document.createElement('p');
                        const div = document.createElement('div');
                        let rowIndex = rowsArray.findIndex(row => row.contains(event.target));
                        let columns = Array.from(rowsArray[rowIndex].querySelectorAll('td'));
                        columnIndex = columns.findIndex(column => column == event.target);
                        modalBoxContent.innerHTML = "";
                        div.appendChild(h2);
                        modalBoxContent.appendChild(div).className="titleDiv";
                        h2.textContent = `Väylä ${columnIndex}`;

                        function keksiParempiNimi() {
                            for (let j = 0; j < (newBodyRef.rows.length - 2); j++) {
                                buildLaneScoreManipulator(j);
                            }
                        }
                        keksiParempiNimi();

                        if (arrowEventListenersAdded === false) {
                            leftArrow.addEventListener('click', function mBLeftArrow() {
                                /*if (columnIndex <= 1) {
                                    columnIndex = 0;
                                    console.log(`Nimisivu ja columnIndex = ${columnIndex}`);
                                    modalBoxContent.innerHTML = "";
                                    titleDiv.innerHTML = "";
                                    div.appendChild(h2);
                                    modalBoxContent.appendChild(div).className = "titleDiv";
                                    h2.textContent = `Pelaajat: `;
                                } else {
                                    columnIndex--;
                                    modalBoxContent.innerHTML = "";
                                    titleDiv.innerHTML = "";
                                    div.appendChild(h2);
                                    modalBoxContent.appendChild(div).className = "titleDiv";
                                    h2.textContent = `Väylä ${columnIndex}`;
                                    keksiParempiNimi();
                                }*/
                                columnIndex--;
                                if (columnIndex < 1) { columnIndex = 1; }
                                modalBoxContent.innerHTML = "";
                                titleDiv.innerHTML = "";
                                div.appendChild(h2);
                                modalBoxContent.appendChild(div).className = "titleDiv";
                                h2.textContent = `Väylä ${columnIndex}`;
                                keksiParempiNimi();
                            });
                            rightArrow.addEventListener('click', function mBRightArrow() {
                                if (columnIndex < trackToBuild.lanes) {
                                    columnIndex++;
                                    modalBoxContent.innerHTML = "";
                                    titleDiv.innerHTML = "";
                                    div.appendChild(h2);
                                    modalBoxContent.appendChild(div).className = "titleDiv";
                                    h2.textContent = `Väylä ${columnIndex}`;
                                    keksiParempiNimi();
                                } else {
                                    columnIndex = trackToBuild.lanes + 1;
                                    modalBoxContent.innerHTML = "";
                                    titleDiv.innerHTML = "";
                                    div.appendChild(h2);
                                    div.appendChild(para);
                                    modalBoxContent.appendChild(div).className = "titleDiv";
                                    h2.textContent = `Tulokset:`;
                                    para.textContent = `Kierroksen par-tulos: ${parYht}`;
                                    if (scoreBoard.rows.length > 2) {
                                        
                                        for (let i = 0; i < (newBodyRef.rows.length - 2); i++) {
                                            const para = document.createElement('p');
                                            para.textContent = `${newBodyRef.rows[2 + i].cells[0].innerHTML} läpäisi radan ${newBodyRef.rows[2 + i].cells[trackToBuild.lanes + 1].innerHTML} heitolla!`;
                                            modalBoxContent.appendChild(para);
                                        }
                                    }
                                    const saveBtn = document.createElement('button');
                                    modalBoxContent.appendChild(saveBtn);
                                    saveBtn.id = "tallennusnappi";
                                    saveBtn.textContent = "Tallenna";
                                    saveBtn.addEventListener('click', () => {
                                        stopTime = new Date();
                                        timeEnd = `${stopTime.getHours()}:${stopTime.getMinutes()}`;
                                        endTime = Date.now();
                                        roundTime = endTime - startTime;
                                        nmbrOfLanes = trackToBuild.lanes;
                                        players = [];
                                        for (let i = 0; i < (newBodyRef.rows.length - 2); i++) {
                                            players.push(newBodyRef.rows[2 + i].cells[0].innerHTML);
                                        }
                                        scores = [];
                                        for (let i = 0; i < newBodyRef.rows.length - 2; i++) {
                                            let tempScore = [];
                                            for (let j = 1; j < newBodyRef.rows[newBodyRef.rows.length - 2].cells.length; j++) {
                                                let scoreToAdd = newBodyRef.rows[2 + i].cells[j].innerHTML;
                                                scoreToAdd = Number(scoreToAdd);
                                                tempScore.push(scoreToAdd);
                                            }
                                            scores.push(tempScore);
                                            tempScore = [];
                                        }
                                        trackName = trackToBuild.trackName;
                                        saveScore();
                                    });
                                }
                            });
                            arrowEventListenersAdded = true;
                            const titleDiv = document.querySelector('.titleDiv');
                        } else {
                            //console.log('No need to add arrowEventListeners the second time.');
                        }
                        trackSelector.addEventListener('change', function deleteEventListeners() {
                            for (let i = 0; i < (newBodyRef.rows.length); i++) {
                                newBodyRef.deleteRow(-1);
                            }
                            trackSelector.removeEventListener('change', deleteEventListeners);
                        });
                    });
                }
                newCell = newRow.insertCell(trackToBuild.lanes + 1);
                newText = document.createTextNode(`0`);
                newCell.appendChild(newText);
            }
        });     
    }

    function displayData() {
        while (previousResults.firsChild) {
            previousResults.removeChild(previousResults.firstChild);
        }

        let objectStore = db.transaction('scores_os').objectStore('scores_os');
        objectStore.openCursor(null, 'prev').onsuccess = function(e) {
            let cursor = e.target.result;

            if (cursor) {
                let tbl2 = document.createElement('table');
                let row2 = document.createElement('tr');
                let thead2 = document.createElement('thead');
                const createDiv = document.createElement('div');

                // roundIDDB
                // trackNameDB
                // nmbrOfLanesDB
                // startDateDB
                // startTimeDB
                // endTimeDBDB
                // roundTimeDB
                // [playersDB]
                // [roundScoresDB]

                previousResults.appendChild(document.createElement('h3')).textContent = `${cursor.value.trackNameDB} ${cursor.value.startDateDB} ${cursor.value.startTimeDB}-${cursor.value.endTimeDB}`;
                previousResults.appendChild(createDiv);
                createDiv.className = `scoreboarddiv`;
                createDiv.appendChild(tbl2);

                thead2.appendChild(document.createElement('th')).textContent = `Pelaaja`;
                for (let j = 0; j < cursor.value.nmbrOfLanesDB; j++) {
                    thead2.appendChild(document.createElement('th')).textContent = `${j + 1}`;
                }
                thead2.appendChild(document.createElement('th')).textContent = `Yht.`;
                tbl2.appendChild(thead2);

                for (let i = 0; i < cursor.value.playersDB.length; i++) {
                    row2.appendChild(document.createElement('td')).textContent = cursor.value.playersDB[i];
                    for (let j = 0; j < (cursor.value.nmbrOfLanesDB + 1); j++) {
                        row2.appendChild(document.createElement('td')).textContent = cursor.value.roundScoresDB[i][j];
                    }          
                    tbl2.appendChild(row2);
                    row2 = document.createElement('tr');
                }
                tbl2.appendChild(row2);
                tbl2.className = `scoreboard`;

                cursor.continue();
            } else {
                if (previousResults.children.length === 0) {
                    previousResults.appendChild(document.createElement('h3')).textContent = `Ei pelattuja kierroksia.`;
                }
            }
        };
    }
};

var acc = document.getElementsByClassName("accordion");
for (let i = 0; i < acc.length; i++) {
    acc[i].addEventListener("click", function() {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.maxHeight) {
            panel.style.maxHeight = null;
        } else {
            panel.style.maxHeight = panel.scrollHeight + "px";
        }
    });
}

const leftArrow = document.getElementById('leftArrow');
const lACanvas = leftArrow.getContext('2d');
const closeModalBoxRight = document.querySelector('#closeModalBoxRight');
const cMBRCanvas = closeModalBoxRight.getContext('2d');
const closeModalBoxLeft = document.querySelector('#closeModalBoxLeft');
const cMBLCanvas = closeModalBoxLeft.getContext('2d');
const rightArrow = document.getElementById('rightArrow');
const rACanvas = rightArrow.getContext('2d');

lACanvas.fillStyle = 'red';
lACanvas.fillRect(0, 0, 35, 250);
lACanvas.beginPath();
lACanvas.lineWidth = 3;
lACanvas.strokeStyle = 'black';
lACanvas.moveTo(32, 235);
lACanvas.lineTo(3, 125);
lACanvas.lineTo(32, 15);
lACanvas.stroke();

cMBRCanvas.fillStyle = 'blue';
cMBRCanvas.fillRect(0, 0, 35, 35);
cMBRCanvas.lineWidth = 3;
cMBRCanvas.strokeStyle = 'black';
cMBRCanvas.beginPath();
cMBRCanvas.moveTo(3, 3);
cMBRCanvas.lineTo(32, 32);
cMBRCanvas.stroke();
cMBRCanvas.beginPath();
cMBRCanvas.moveTo(32, 3);
cMBRCanvas.lineTo(3, 32);
cMBRCanvas.stroke();

cMBLCanvas.fillStyle = 'blue';
cMBLCanvas.fillRect(0, 0, 35, 35);
cMBLCanvas.lineWidth = 3;
cMBLCanvas.strokeStyle = 'black';
cMBLCanvas.beginPath();
cMBLCanvas.moveTo(3, 3);
cMBLCanvas.lineTo(32, 32);
cMBLCanvas.stroke();
cMBLCanvas.beginPath();
cMBLCanvas.moveTo(32, 3);
cMBLCanvas.lineTo(3, 32);
cMBLCanvas.stroke();

rACanvas.fillStyle = 'yellow';
rACanvas.fillRect(0, 0, 35, 250);
rACanvas.lineWidth = 3;
rACanvas.strokeStyle = 'black';
rACanvas.moveTo(3, 235);
rACanvas.lineTo(32, 125);
rACanvas.lineTo(3, 15);
rACanvas.stroke();

closeModalBoxLeft.addEventListener('click', closeModalBox);
closeModalBoxRight.addEventListener('click', closeModalBox);

const instructions = document.getElementById("instructions");
const hideInfobox = document.getElementById("hideinfobox");
const infoBox = document.getElementById("infobox");

instructions.addEventListener('click', () => {
    darkBackground.style.display = "block";
    infoBox.style.display = "block";
});

hideInfobox.addEventListener('click', () => {
    darkBackground.style.display = "none";
    infoBox.style.display = "none";
});