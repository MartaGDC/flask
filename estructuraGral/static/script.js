const body = document.body;
const content = document.querySelector(".content");

const reloadBtn = document.getElementById("reloadBtn");
const fileBtn = document.getElementById("fileBtn");
const fileName = document.getElementById("fileName");
let appName = "";
let evaluatorName = "";
let token = "";
let nbFile = "";

const videoWindow = document.getElementById("videoWindow");
const videoList = document.getElementById("videoList");
const videoContainer = document.getElementById("video-container");
const videoPlayer = document.getElementById("video-player");
const progress = document.getElementById("progress");
const range = document.getElementById("range");
const prevFrameBtn = document.getElementById("prev-frame");
const nextFrameBtn = document.getElementById("next-frame");
const playBtn = document.getElementById("play");
const pauseBtn = document.getElementById("pause");
const startFrame = document.getElementById("mark-start");
const endFrame = document.getElementById("mark-end");
const framePlaceholder = document.getElementById("frame-placeholder");
const ctx = framePlaceholder.getContext("2d", { willReadFrequently: true });

let firstValue = null;
let firstFrame = null;
let lastValue = null;
let lastFrame = null;
let startTime = null;
let endTime = null;
let frame = null;
let savedFrame = null;
let savedFrames = [];
let pausado = false; //mostrar el frame solo si está pausado

const researcherInfo = document.getElementById("researcherInfo");
let numFramesEval = null;

const acceptFrameBtn = document.getElementById("acceptFrameBtn");
const acceptFramesBtn = document.getElementById("acceptFramesBtn");
const acceptGroupBtn = document.getElementById("acceptGroup");
const frames = [];
const submitBtn = document.getElementById("submitBtn");
let aceptado = false; //frame aceptado, para no modificarlo hasta terminar el formulario
let good = true;
let submitted = false; //formulario del frame aceptado

const sidebar = document.getElementById("sidebar");
const blocks = document.querySelectorAll(".block");

const qualityButtons = document.querySelectorAll(".quality-button");
const qualityGreen = document.getElementById("qualityGreen");
const qualityYellow = document.getElementById("qualityYellow");
const qualityRed = document.getElementById("qualityRed");
const qualityBlack = document.getElementById("qualityBlack");
let selectedQuality = "";

const zones = document.querySelectorAll('input[name="zone"]');
let selectedZone = zones[0].value;

const structures = document.querySelectorAll(".structure-item");
let selectedStructure = null;
let currentIndex = null;
const sliders = Array.from(document.querySelectorAll('.brush-slider'));
const  widths = Array.from(document.querySelectorAll(".brush-slider")).map(slider => parseInt(slider.value));
const colors = Array.from(structures).map(div => div.dataset.color);
const deleteDrawings = document.querySelectorAll(".delete");
let invisibleStructures = {};
const invisible = document.querySelectorAll(".invisible");
let drawing = false;
let trazos = [];
let trazoActual = null;

const referencia = document.getElementById("ref");


/*Botones reload y home:

*/
/*-------------------------BOTONES LOGOUT Y HOME-------------------------*/
reloadBtn.addEventListener("click", () => location.reload());

/*Seleccion del video:
- Se abre un diálogo para seleccionar un archivo de video.
- Se muestra el nombre del archivo seleccionado.
- Se carga e inicia el video.
*/
/*-------------------------SELECCION DEL VIDEO-------------------------*/
//Se abre el díalogo al hacer click sobre select video
document.addEventListener("DOMContentLoaded", () =>{
    appName = body.dataset.appname;
    evaluatorName = researcherInfo.dataset.user;
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (!token || token === "undefined" || token === "") {
        alert("You must enter a valid user for this project.\nEnter new credentials.");
        window.location.href = "http://localhost/index.php";
        return;
    }

    if (appName === "base_artefactos") {
        qualityGreen.classList.add("hidden");
        qualityYellow.classList.add("hidden");
        qualityRed.classList.add("hidden");
        qualityBlack.classList.add("hidden");
    }
});

if(sessionStorage.getItem('reloadAfterSave') === 'true'){
    appName = sessionStorage.getItem('selectedApp');
    nbFile = sessionStorage.getItem('selectedFile');
    frame = sessionStorage.getItem('frame');
    evaluatorName = sessionStorage.getItem('evaluator');
    sessionStorage.removeItem('reloadAfterSave');
    sessionStorage.removeItem('selectedApp');
    sessionStorage.removeItem('selectedFile');
    sessionStorage.removeItem('frame');
    sessionStorage.removeItem('evaluator');
    selectVideo(nbFile, frame);
} else {
    fileBtn.addEventListener("click", () => {
        getVideos();
    });
}

// Al seleccionar un archivo de video, se muestra su nombre y se carga el video
async function getVideos(){
    const res = await fetch(`/select/${appName}`);
    if (!res.ok) {
        alert("Error loading list of videos");
        return;
    }
    videoList.innerHTML = "";
    const videos = await res.json();
    videoWindow.classList.remove("hidden");
    videos.forEach(video => {
        const li = document.createElement("li");
        li.textContent = video;
        li.addEventListener("click", () => selectVideo(video, frame));
        videoList.appendChild(li);
    }); 
}

async function selectVideo(filename, frame){
    if (filename) {
        if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".png") || filename.toLowerCase().endsWith(".mha")) {
            videoWindow.classList.add("hidden");
            content.classList.remove("disabled");
            const imageURL = `/media/${filename}`;
            fileName.textContent = filename;
            const img = new Image();
            img.src = imageURL;
            img.onload = function() {
                framePlaceholder.width = img.width;
                framePlaceholder.height = img.height;
                ctx.drawImage(img, 0, 0, framePlaceholder.width, framePlaceholder.height);
                savedFrame = ctx.getImageData(0, 0, framePlaceholder.width, framePlaceholder.height);
            };
            submitBtn.classList.remove("hidden");
            fileBtn.disabled = true;
            fileBtn.classList.add("disabled");
            aceptado = true;
            sidebar.classList.remove("hidden");
            content.style.marginRight = "21vw";
            validar();

        } else {
            videoWindow.classList.add("hidden");
            content.classList.remove("disabled");
            const videoURL = `/media/${filename}`;
            fileName.textContent = filename;
            videoPlayer.src = videoURL;
            videoContainer.style.display = "block";
            videoPlayer.load();
            if (frame && !isNaN(frame)){
                const currentTime = frame / 30;
                videoPlayer.currentTime =currentTime;
            }
            else{
                videoPlayer.currentTime = 0; // Reset to the start of the video
            }
            await countFramesPerEval(evaluatorName);
            researcherInfo.textContent = `Evaluator ${evaluatorName} studied ${numFramesEval} frames from this video.`; //Modificar cuando tenga como recoger los frames guardados
            pausado = true;
            drawFrame();
            acceptFrameBtn.classList.remove("hidden");
            acceptFramesBtn.classList.remove("hidden");
            fileBtn.disabled = true;
            fileBtn.classList.add("disabled");
        }
    } else {
        fileName.textContent = "No video selected.";
        videoContainer.style.display = "none";
        acceptFrameBtn.disabled = true;
        acceptFramesBtn.disabled = true;
    }
}

async function countFramesPerEval(evaluatorName) {
    try {
        const video = fileName.textContent;
        const response = await fetch(`/count_frames/${evaluatorName}/${video}`);
        if (!response.ok) {
            numFramesEval = 0;
            return;
        }
        const data = await response.json();
        numFramesEval = data.count;
    } catch (e) {
        numFramesEval = 0;
    }
}


videoPlayer.addEventListener("loadedmetadata", () => { //Mejora muchísimo la resolución de la imagen del frame
    framePlaceholder.width = videoPlayer.videoWidth;
    framePlaceholder.height = videoPlayer.videoHeight;
    
    progress.min = 0;
    progress.max = 100;
    progress.value = 0;
});


videoPlayer.addEventListener("timeupdate", () => {
    progress.value = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    if (lastValue !== null && firstValue !== null) {
        ctx.drawImage(videoPlayer, 0, 0);
        if (videoPlayer.currentTime >= lastValue) {
            videoPlayer.currentTime = firstValue;
            pausar();
        }
    }
});
progress.addEventListener("input", () => {
    drawFrame();
    videoPlayer.currentTime = (progress.value / 100) * videoPlayer.duration;
});
playBtn.addEventListener("click", reproducir);
pauseBtn.addEventListener("click", () =>{
    pausar();
    drawFrame();
});
function reproducir(){
    videoPlayer.play();
    pausado = false;
    playBtn.classList.add("hidden");
    pauseBtn.classList.remove("hidden")
}
function pausar(){
    videoPlayer.pause();
    pausado = true;
    pauseBtn.classList.add("hidden");
    playBtn.classList.remove("hidden")
}

function drawFrame() {
    if (pausado && !aceptado) {
        ctx.drawImage(videoPlayer, 0, 0);
        savedFrame = ctx.getImageData(0, 0, framePlaceholder.width, framePlaceholder.height);
        acceptFrameBtn.disabled = false; //Habilita el botón de aceptar frame solo si ya hay uno mostrandose
    }
    requestAnimationFrame(drawFrame); //Hace un loop mientras pausado siga siendo true, permite que se actualice el frame
}



/*Seleccionar un solo frame:
- Se muestra el frame del video en un canvas cuando el video está pausado.
- Se habilita el botón para aceptar el frame del video.
*/
/*-------------------------SELECCIONAR UN SOLO FRAME-------------------------*/
prevFrameBtn.addEventListener("click", () => {
    pausar();
    videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - (1/30)); //Si 30 fps
});

nextFrameBtn.addEventListener("click", () => {
    pausar();
    videoPlayer.currentTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + (1/30));
});



/*Seleccionar un grupo de frames:
- Se muestra el frame del video en un canvas cuando el video está pausado.
- Se habilitan los botones para seleccionar el grupo de frames.
- Una vez seleeccionado el frame incial y el frame final, se habilita el sidebar
*/
/*-------------------------SELECCIONAR UN GRUPO DE FRAMES-------------------------*/
acceptFramesBtn.addEventListener("click", () => {
    good = false;
    acceptFrameBtn.classList.add("hidden");
    acceptFramesBtn.classList.add("hidden");
    acceptGroupBtn.classList.remove("hidden");
    progress.classList.add("hidden");
    range.classList.remove("hidden");
    if(frame!==null) {
        firstValue = (frame/30)/videoPlayer.duration *100;
    }
    else {
        firstValue = 0;
    }
    lastValue = 10 + firstValue;

    if (range.noUiSlider) {
        range.noUiSlider.destroy();
    }
    noUiSlider.create(range, {
        start: [ firstValue, lastValue ],
        step: 1,
        margin: 2,
        connect: true,
        range: {
            'min': 0,
            'max': 100
        }
    });
    range.noUiSlider.on('update', listenerRange);
});

function listenerRange(values, handle) {
    if ( handle ) {
        lastValue = (values[handle] / 100) * videoPlayer.duration;
        videoPlayer.currentTime = lastValue;
        lastFrame = Math.floor(lastValue * 30); //Si 30 fps por segundo.
    } else {
        firstValue = (values[handle] / 100) * videoPlayer.duration;
        videoPlayer.currentTime = firstValue;
        firstFrame = Math.floor(firstValue * 30); //Si 30 fps por segundo.
    }
}

acceptGroupBtn.addEventListener("click", async ()=> {
    range.noUiSlider.off('update', listenerRange);
    range.noUiSlider.destroy();

    acceptGroupBtn.classList.add("hidden");
    submitBtn.classList.remove("hidden");
    submitBtn.classList.add("disabled");
    sidebar.classList.remove("hidden");
    qualityGreen.classList.add("hidden");
    qualityYellow.classList.add("hidden");
    blocks.forEach(block => {
        block.classList.add("hidden");
    });
    aceptado=true;
    for (let i = firstFrame; i <= lastFrame; i++) {
        frames.push(i);
    }
    savedFrames = await captureFrames(videoPlayer, ctx, firstFrame, lastFrame); //necesario un await, porque empezaba a tener problemas para que realmente videoplayer se posicionase
    validar();
});
async function captureFrames(videoPlayer, ctx, firstFrame, lastFrame, fps = 30) {
    for (let i = firstFrame; i <= lastFrame; i++) {
        const time = i / fps;
        videoPlayer.currentTime = time;
        await new Promise(resolve => {
            videoPlayer.addEventListener('seeked', resolve, { once: true });
        });
        ctx.drawImage(videoPlayer, 0, 0);
        savedFrames.push(ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height));
    }
    return savedFrames;
}



/*Aceptar seleccion:
- Al hacer click en "Select frame", se muestra el sidebar.
- No se puede modificar la seleccion del frame o grupo de frames, al mover el video:
    - a menos que se complete el formulario del sidebar y
    - se haya enviado el formulario
- Se activa el sidebar hasta que se envíe el formulario.
- Se guarda el frame o frames y la información del investigador.
*/
/*-------------------------ACEPTAR SELECCION DE UN FRAME-------------------------*/
acceptFrameBtn.addEventListener("click", () => {
    pausar();
    acceptFrameBtn.classList.add("hidden");
    acceptFramesBtn.classList.add("hidden");
    submitBtn.classList.remove("hidden");
    submitBtn.classList.add("disabled");
    aceptado = true;
    sidebar.classList.remove("hidden");
    content.style.marginRight = "21vw";

    //Si ya se ha aceptado el frame, no quiero que cambie el frame al mover el video. A menos que se haya finalizado el form de aside (if form terminado y submitted true, aceptado = false).
    frame = Math.floor(videoPlayer.currentTime * 30) //Si 30 fps por segundo.
    validar();
});



/*Sidebar:
- Selección de calidad (verde, amarillo, rojo, negro). 
- Al seleccionar una zona, se muestran las estructuras correspondientes.
- Al seleccionar una estructura, se activa el brush correspondiente, permitiendo dibujar.
- El tamaño del brush se puede ajustar con un slider.
- Cada estructura tiene un botón para borrar el trazo correspondiente.
- Cuando se ha completado el formulario, se puede enviar. Si rojo o negro, no necesita info, formulario finalizado
*/
/*-------------------------SIDEBAR-------------------------*/
qualityButtons.forEach(button => {
    button.addEventListener('click', () => {
        selectedQuality = button.innerText.toLowerCase();
        qualityButtons.forEach(btn => btn.classList.add('transparent'));
        button.classList.remove('transparent');
        validar();
    })
});


//Al seleccionar una zona, se muestran las estructuras correspondientes. Si no hay una zona seleccionada, se selecciona la primera por defecto.
function showStructures(selectedZone){
    activeStructures = document.querySelectorAll(`.${selectedZone}-structure-item`);
    activeStructures.forEach(structure => {
        structure.classList.remove("hidden");
        structure.classList.add("transparent");
    });
    selectedStructure = activeStructures[0];
    const firstIndex = selectedStructure.querySelector('.brush-slider');
    currentIndex = Array.from(sliders).indexOf(firstIndex); //Actualizar el color cuando se cambia la zona
    selectedStructure.classList.remove("transparent");
    activeStructures.forEach(structure => {
        structure.addEventListener('click', (event) => {
            structures.forEach(structure => {
                structure.classList.add("transparent");
            });
            selectedStructure = event.currentTarget;
            selectedStructure.classList.remove("transparent");
        });
    });
}
showStructures(selectedZone);
zones.forEach(zone => {
    zone.addEventListener('change', (event) => {
        structures.forEach((structure) => {
            structure.classList.add("hidden");
            invisible.forEach((invisibleBtn, _) => {
                invisibleBtn.classList.remove("active");
                const structureName = invisibleBtn.getAttribute('data-structure');
                invisibleStructures[structureName] = false;
            });
            clearDrawing();
        });
        selectedZone = event.target.value;
        showStructures(selectedZone);
    });
});


//Al seleccionar una estructura, se activa la misma y se accede al brush correspondiente.
structures.forEach((structure, index) => {
    structure.addEventListener('click', () => {
        widths[index] = parseInt(sliders[index].value);
        currentIndex = index;
    });
});
sliders.forEach((slider, index) => {
    slider.addEventListener('input', async e => {
        widths[index] = parseInt(slider.value);
        await fetch("/update_brush", {
            method:"POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                appName: appName,
                name: structures[index].querySelector('.structure-name').textContent.trim(),
                zone: selectedZone,
                width: parseInt(slider.value)
            })
        });
    });
});

deleteDrawings.forEach((deleteButton, index) => {
    deleteButton.addEventListener('click', () => {
        clearColorDrawing(colors[index]);
    });
});

invisible.forEach((invisibleBtn, _) => {
    invisibleBtn.addEventListener('click', () => {
        const structureName = invisibleBtn.getAttribute('data-structure');
        const isActive = invisibleBtn.classList.toggle('active');
        invisibleStructures[structureName] = isActive;
    }) 
});

//Dibujos con los brush
framePlaceholder.addEventListener('mousedown', startDrawing);
framePlaceholder.addEventListener('mousemove', draw);
framePlaceholder.addEventListener('mouseup', stopDrawing);
framePlaceholder.addEventListener('mouseleave', stopDrawing);
framePlaceholder.addEventListener('touchstart', startDrawing);
framePlaceholder.addEventListener('touchmove', draw);
framePlaceholder.addEventListener('touchend', stopDrawing);
framePlaceholder.addEventListener('touchcancel', stopDrawing);

function startDrawing(e) {
    if(aceptado && good){
        drawing = true;
        trazoActual = {color: colors[currentIndex], width: widths[currentIndex], puntos: []};
        draw(e);
    }
}
function stopDrawing() {
    if (aceptado && good){
        if(trazoActual) {
            trazos.push(trazoActual);
            trazoActual = null;
        }
            validar();
        drawing = false;
        ctx.beginPath();
    }
}

function draw(e) {
    if (aceptado && good){

        if (!drawing) return;
        e.preventDefault();

        const color = colors[currentIndex];
        const width = widths[currentIndex];
        let pos;
        if (e.type.includes('mouse')) {
            pos = getMousePos(framePlaceholder, e);
        } else {
            pos = getTouchPos(framePlaceholder, e);
        }
        trazoActual.puntos.push(pos);
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.strokeStyle = color;

        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }
}

function getMousePos(canvas, evt) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (evt.clientX - rect.left)/rect.width*canvas.width,
        y: (evt.clientY - rect.top)/rect.height*canvas.height
    };
}
function getTouchPos(canvas, touch) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: (touch.touches[0].clientX - rect.left)/rect.width*canvas.width,
        y: (touch.touches[0].clientY - rect.top)/rect.height*canvas.height
    };
}

//Borrar el trazo correspondiente
function clearColorDrawing(colorDelete) {
    trazos = trazos.filter(trazo => trazo.color !== colorDelete);
    redrawRest(colorDelete);
}
function redrawRest(colorDelete=null) {
    ctx.clearRect(0, 0, framePlaceholder.width, framePlaceholder.height);
    ctx.putImageData(savedFrame, 0, 0);
    trazos.forEach(trazo => {
        if (!colorDelete || trazo.color !== colorDelete) {
            ctx.lineWidth = trazo.width;
            ctx.lineCap = 'round';
            ctx.strokeStyle = trazo.color;
            for (let i = 1; i < trazo.puntos.length; i++) {
                const punto1 = trazo.puntos[i-1];
                const punto2 = trazo.puntos[i];
                ctx.beginPath();
                ctx.moveTo(punto1.x, punto1.y);
                ctx.lineTo(punto2.x, punto2.y);
                ctx.stroke();
            }
            ctx.beginPath();
        }
    });
    validar();
}
//Borrar todos los trazos si se selecciona otra zona.
function clearDrawing() {
    ctx.clearRect(0, 0, framePlaceholder.width, framePlaceholder.height);
    ctx.putImageData(savedFrame, 0, 0);
    trazos = [];
    validar();
}

//Formulario completado, validar y enviar (video, frame original, frame editado, filename, quality, zone, evaluator)
qualityGreen.addEventListener('click', greenYellowQuality);
qualityYellow.addEventListener('click', greenYellowQuality);
qualityRed.addEventListener('click', redBlackQuality);
qualityBlack.addEventListener('click',redBlackQuality);

function redBlackQuality(){
    zones.forEach(zone => {
        zone.parentElement.classList.add("disabled");
        zone.disabled = true;
    });

    structures.forEach(structure => {
        structure.disabled = true;
        structure.classList.add("disabled");
    });
    if (referencia){
        referencia.checked = false;
        referencia.disabled = true;
    }
    clearDrawing();
    good = false;
}
function greenYellowQuality() {
    zones.forEach(zone => {
        zone.parentElement.classList.remove("disabled");
        zone.disabled = false;
    });
    structures.forEach(structure => {
        structure.disabled = false;
        structure.classList.remove("disabled");
    });
    if(referencia){
        referencia.disabled = false;
    }
    good = true;
}



function validar() {
    /*const activeColors = Array.from(structures).map(s => s.querySelector('.brush-slider').style.accentColor);
    const allColorsDrawn = activeColors.every(color =>
        trazos.some(trazo => trazo.color === color && trazo.puntos.length > 0)
    );*/
    allColorsDrawn=true; //Se han definido muchas estructuras, dejar por ahora sin esta validación que obliga a dibujarlo todo
    if (allColorsDrawn || selectedQuality==="none" || selectedQuality === "bad" || appName === "base_artefactos") {
        submitBtn.disabled = false;
        submitBtn.classList.remove("disabled");
        submitted = true;
    }
    else{
        submitBtn.disabled = true;
        submitBtn.classList.add("disabled");
        submitted = false;
    }
}

submitBtn.addEventListener("click", () => {
    if (aceptado && submitted) {
        if (selectedQuality === "" && appName!=="base_artefactos") {
            alert('Please select a quality (Good, Fair, or Bad) before saving.');
            submitBtn.classList.remove("disabled");

            return;
        }
        saveDrawing();

    }
});

function saveDrawing(){
    submitBtn.disabled = true;

    let objectJS = [];
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');

    if (frames.length > 0) { //Existe un listado de frames
        frames.forEach((numframe, index) => {
            //imagenes de cada frame para guardarlas en png. Tendrán el mismo timestamp, así que añadimos el frame al final
            const maskOriginalCanvas = document.createElement("canvas");
            const maskOriginalCtx = maskOriginalCanvas.getContext("2d");
            maskOriginalCanvas.width = savedFrames[index].width;
            maskOriginalCanvas.height = savedFrames[index].height;
            maskOriginalCtx.putImageData(savedFrames[index], 0, 0);
            const imageURL = maskOriginalCanvas.toDataURL();
            const imageEditedURL = maskOriginalCanvas.toDataURL();
            
            //Los dibujos hechos en los botones de Base pueden pertenecer a cualquier proyecto. Establecer de alguna manera que el dibujo pertenece a analisis de base y no del proyecto al que pertence la imagen original
            if(appName==="base_tejidos"){
                const frameObject = {
                    video: fileName.textContent, 
                    frame: numframe,
                    originalImage: imageURL,
                    imageEdited: imageEditedURL,
                    frameoriginal: `0_1_${fileName.textContent}_${numframe}.png`, 
                    filesaved: `${timestamp}_${index}.png`,
                    quality: selectedQuality,
                    zone: selectedZone,
                    evaluator: evaluatorName
                }
                Object.entries(invisibleStructures).forEach(([name, used]) => {
                    if (used) {
                        frameObject[name] = "invisible";
                    }
                });
                objectJS.push(frameObject);
            }
            else if(appName==="base_artefactos"){
                const frameObject = {
                    video: fileName.textContent, 
                    frame: numframe,
                    originalImage: imageURL,
                    imageEdited: imageEditedURL,
                    frameoriginal: `0_2_${fileName.textContent}_${numframe}.png`, 
                    filesaved: `${timestamp}_${index}.png`,
                    quality: selectedQuality,
                    zone: selectedZone,
                    evaluator: evaluatorName
                }
                Object.entries(invisibleStructures).forEach(([name, used]) => {
                    if (used) {
                        frameObject[name] = "invisible";
                    }
                });
                objectJS.push(frameObject);
            }
             else if(appName==="base_ROIS"){
                const frameObject = {
                    video: fileName.textContent, 
                    frame: numframe,
                    originalImage: imageURL,
                    imageEdited: imageEditedURL,
                    frameoriginal: `0_3_${fileName.textContent}_${numframe}.png`, 
                    filesaved: `${timestamp}_${index}.png`,
                    quality: selectedQuality,
                    zone: selectedZone,
                    evaluator: evaluatorName,
                    referencia: referencia.checked ? "ref" : "no ref"
                }
                Object.entries(invisibleStructures).forEach(([name, used]) => {
                    if (used) {
                        frameObject[name] = "invisible";
                    }
                });
                objectJS.push(frameObject);
            }
            else if(appName==="aquiles_longitudinal"){
                const frameObject = {
                    video: fileName.textContent, 
                    frame: numframe,
                    originalImage: imageURL,
                    imageEdited: imageEditedURL,
                    frameoriginal: `11_1_${fileName.textContent}_${numframe}.png`, 
                    filesaved: `${timestamp}_${index}.png`,
                    quality: selectedQuality,
                    zone: selectedZone,
                    evaluator: evaluatorName
                }
                Object.entries(invisibleStructures).forEach(([name, used]) => {
                    if (used) {
                        frameObject[name] = "invisible";
                    }
                });
                objectJS.push(frameObject);
            }
            else if(appName==="aquiles_transversal"){
                const frameObject = {
                    video: fileName.textContent, 
                    frame: numframe,
                    originalImage: imageURL,
                    imageEdited: imageEditedURL,
                    frameoriginal: `11_2_${fileName.textContent}_${numframe}.png`, 
                    filesaved: `${timestamp}_${index}.png`,
                    quality: selectedQuality,
                    zone: selectedZone,
                    evaluator: evaluatorName
                }
                Object.entries(invisibleStructures).forEach(([name, used]) => {
                    if (used) {
                        frameObject[name] = "invisible";
                    }
                });
                objectJS.push(frameObject);
            }
            else {
                const frameObject = {
                    video: fileName.textContent, 
                    frame: numframe,
                    originalImage: imageURL,
                    imageEdited: imageEditedURL,
                    frameoriginal: `${fileName.textContent}_${numframe}.png`, 
                    filesaved: `${timestamp}_${index}.png`,
                    quality: selectedQuality,
                    zone: selectedZone,
                    evaluator: evaluatorName
                };
                Object.entries(invisibleStructures).forEach(([name, used]) => {
                    if (used) {
                        frameObject[name] = "invisible";
                    }
                });
                objectJS.push(frameObject);
            }                
        });
    } else { //No existe frames, solo frame
        const maskEditedCanvas = document.createElement('canvas');
        const maskEditedCtx = maskEditedCanvas.getContext('2d');
        maskEditedCanvas.width = framePlaceholder.width;
        maskEditedCanvas.height = framePlaceholder.height;
        maskEditedCtx.drawImage(framePlaceholder, 0, 0);
        const imageEditedURL = maskEditedCanvas.toDataURL();

        const maskOriginalCanvas = document.createElement("canvas");
        const maskOriginalCtx = maskOriginalCanvas.getContext("2d");
        maskOriginalCanvas.width = savedFrame.width;
        maskOriginalCanvas.height = savedFrame.height;
        maskOriginalCtx.putImageData(savedFrame, 0, 0);
        const imageURL = maskOriginalCanvas.toDataURL();

        if(appName==="base_tejidos"){
            objectJS = {
                video: fileName.textContent, 
                frame: frame,
                originalImage: imageURL,
                imageEdited: imageEditedURL,
                frameoriginal: `0_1_${fileName.textContent}_${frame}.png`, 
                filesaved: `${timestamp}.png`,
                quality: selectedQuality,
                zone: (selectedQuality === "bad" || selectedQuality === "none") ? "none" : selectedZone,
                evaluator: evaluatorName
            };
            Object.entries(invisibleStructures).forEach(([name, used]) => {
                if(used){
                    objectJS[name] = "invisible";
                }
            });
        }
        else if (appName==="base_artefactos"){
            objectJS = {
                video: fileName.textContent, 
                frame: frame,
                originalImage: imageURL,
                imageEdited: imageEditedURL,
                frameoriginal: `0_2_${fileName.textContent}_${frame}.png`, 
                filesaved: `${timestamp}.png`,
                quality: selectedQuality,
                zone: (selectedQuality === "bad" || selectedQuality === "none") ? "none" : selectedZone,
                evaluator: evaluatorName
            };
            Object.entries(invisibleStructures).forEach(([name, used]) => {
                if(used){
                    objectJS[name] = "invisible";
                }
            });
        }
        else if (appName==="base_ROIS"){
            objectJS = {
                video: fileName.textContent, 
                frame: frame,
                originalImage: imageURL,
                imageEdited: imageEditedURL,
                frameoriginal: `0_3_${fileName.textContent}_${frame}.png`, 
                filesaved: `${timestamp}.png`,
                quality: selectedQuality,
                zone: (selectedQuality === "bad" || selectedQuality === "none") ? "none" : selectedZone,
                evaluator: evaluatorName,
                referencia: referencia.checked ? "ref" : "no ref"
            };
            Object.entries(invisibleStructures).forEach(([name, used]) => {
                if(used){
                    objectJS[name] = "invisible";
                }
            });
        }
        else if (appName==="aquiles_longitudinal"){
            objectJS = {
                video: fileName.textContent, 
                frame: frame,
                originalImage: imageURL,
                imageEdited: imageEditedURL,
                frameoriginal: `11_1_${fileName.textContent}_${frame}.png`, 
                filesaved: `${timestamp}.png`,
                quality: selectedQuality,
                zone: (selectedQuality === "bad" || selectedQuality === "none") ? "none" : selectedZone,
                evaluator: evaluatorName,
            };
            Object.entries(invisibleStructures).forEach(([name, used]) => {
                if(used){
                    objectJS[name] = "invisible";
                }
            });
        }
        else if (appName==="aquiles_transversal"){
            objectJS = {
                video: fileName.textContent, 
                frame: frame,
                originalImage: imageURL,
                imageEdited: imageEditedURL,
                frameoriginal: `11_2_${fileName.textContent}_${frame}.png`, 
                filesaved: `${timestamp}.png`,
                quality: selectedQuality,
                zone: (selectedQuality === "bad" || selectedQuality === "none") ? "none" : selectedZone,
                evaluator: evaluatorName,
            };
            Object.entries(invisibleStructures).forEach(([name, used]) => {
                if(used){
                    objectJS[name] = "invisible";
                }
            });
        }
        else {
            objectJS = {
                video: fileName.textContent, 
                frame: frame,
                originalImage: imageURL,
                imageEdited: imageEditedURL,
                frameoriginal: `${fileName.textContent}_${frame}.png`, 
                filesaved: `${timestamp}.png`,
                quality: selectedQuality,
                zone: (selectedQuality === "bad" || selectedQuality === "none") ? "none" : selectedZone,
                evaluator: evaluatorName
            };
            Object.entries(invisibleStructures).forEach(([name, used]) => {
                if(used){
                    objectJS[name] = "invisible";
                }
            });
        }
    }


    fetch('/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(objectJS)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Drawing saved successfully:', data);
        alert('Drawing saved successfully.');
        const name = fileName.textContent.toLowerCase();
        if (name.endsWith(".jpg") || name.endsWith(".png") || name.endsWith(".mha")) {
            location.reload();
        } else {
            recargarVideo(appName, fileName.textContent);
        }
    })
    .catch(error => {
        console.error('Error saving drawing:', error);
        alert('An error occurred while saving. Please try again.');
    });
}

function recargarVideo(appName, filename){
    // Guardar datos para usar después de la recarga
    sessionStorage.setItem('reloadAfterSave', 'true');
    sessionStorage.setItem('selectedApp', appName);
    sessionStorage.setItem('selectedFile', filename);
    sessionStorage.setItem('evaluator', evaluatorName);
    sessionStorage.setItem('frame', frame);
    location.reload();
}