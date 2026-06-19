const body = document.body;
const content = document.querySelector(".content");

const reloadBtn = document.getElementById("reloadBtn");
const downloadBtn = document.getElementById("downloadBtn");
const uploadBtn = document.getElementById("uploadBtn");
const uploadWindow = document.getElementById("uploadWindow");
const uploadedFile = document.getElementById("uploadedFile");
const fileName = document.getElementById("fileName");
let appName = "";
let evaluatorName = "";
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
const framePlaceholder = document.getElementById("frame-placeholder"); //imagen
const overlay = document.getElementById("canvas-overlay"); //imagen para escala
const ctx = framePlaceholder.getContext("2d", { willReadFrequently: true }); // ctx de imgen
const ctxOverlay = overlay.getContext("2d"); //ctx para escala

let frame = null;
let savedFrame = null;
let pausado = false; //mostrar el frame solo si está pausado

const researcherInfo = document.getElementById("researcherInfo");
let numFramesEval = null;

const acceptFrameBtn = document.getElementById("acceptFrameBtn");
const submitBtn = document.getElementById("submitBtn");
let aceptado = false;
let dibujoHecho = false; //dibujo de escala
let submitted = false; //trazos de colores

const scaleSave = document.getElementById("scaleSave");
let scaleInfo = null;
let objectJSQuality = null;

const setThresholds = document.getElementById("setThresholds");
const boneSlidersContainer = document.querySelectorAll(".boneSlider-bar");
const boneSliders = document.querySelectorAll(".boneSlider");
const boneSliderLabels = document.querySelectorAll(".boneSliderLabel");
let thresholds = [];
const acceptThresholdBtn = document.getElementById("acceptThresholdBtn");
let thresholdAceptado = false;
const structureControls = document.getElementById("structureControls");
let objectJSBone = null;

const sidebar = document.getElementById("sidebar");
const blocks = document.querySelectorAll(".block");
const zoneControls = document.getElementById("zoneControls");
const zones = document.querySelectorAll('input[name="zone"]');
let selectedZone = zones[0].value;
const structures = document.querySelectorAll(".structure-item");
let selectedStructure = null;
let currentIndex = null;
let indexUsados = [];
const sliders = Array.from(document.querySelectorAll('.brush-slider'));
const  widths = Array.from(document.querySelectorAll(".brush-slider")).map(slider => parseInt(slider.value));
const colors = Array.from(structures).map(div => div.dataset.color);
let mask = [{color: null, width: null, puntos: []}];
const deleteDrawings = document.querySelectorAll(".delete");
let trazos = [];
let trazoActual = null;

let drawing = false;
let startX, startY;
let endX, endY;

/*Botones reload y download:*/
/*-------------------------BOTONES LOGOUT Y HOME-------------------------*/
reloadBtn.addEventListener("click", () => {
    location.reload();
});

downloadBtn.addEventListener("click", ()=> {
    window.location.href = "/download";
});

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
    uploadBtn.addEventListener("click", () => {
        uploadWindow.classList.remove("hidden");
    })
}

uploadedFile.addEventListener("change", async() => {
    const file = uploadedFile.files[0];
    const filename = file.name.toLowerCase();
    fileName.textContent=filename;
    if (!file) return;
    const permitidos = [".jpg", ".jpeg", ".png", ".mp4", ".mpeg", ".mha", ".wmv"];
    if(!permitidos.some(ext => filename.endsWith(ext))) {
    alert("Only JPG, PNG, MP4, MHA or WMV files are allowed.");
        return;
    }
    const formData = new FormData();
    formData.append("file", file);
    document.getElementById("uploadStatus").classList.remove("hidden");
    try {
        const res = await fetch(`/upload`, {
            method: "POST",
            body: formData
        });
        const data = await res.json();
        if (!res.ok) {
            alert(data.error || "Upload failed");
            return;
        }
        document.getElementById("uploadStatus").classList.add("hidden");
        uploadWindow.classList.add("hidden");
        selectVideo(data.filename, null);
    } catch (err) {
        console.error(err);
        alert("Error uploading file");
    }
})


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
                overlay.width = img.width;
                overlay.height = img.height;
                ctx.drawImage(img, 0, 0, framePlaceholder.width, framePlaceholder.height);
                savedFrame = ctx.getImageData(0, 0, framePlaceholder.width, framePlaceholder.height);
            };
            scaleSave.disabled = false;
            scaleSave.classList.remove("hidden");
            uploadBtn.disabled = true;
            uploadBtn.classList.add("disabled");
            aceptado = true;
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
            //await countFramesPerEval(evaluatorName);
            researcherInfo.textContent = `Evaluator ${evaluatorName} studied ${numFramesEval} frames from this video.`;
            pausado = true;
            drawFrame();
            acceptFrameBtn.classList.remove("hidden");
            uploadBtn.disabled = true;
            uploadBtn.classList.add("disabled");
        }
    } else {
        fileName.textContent = "No video selected.";
        videoContainer.style.display = "none";
        acceptFrameBtn.disabled = true;
    }
}

async function countFramesPerEval() {
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
    overlay.width = videoPlayer.videoWidth;
    overlay.height = videoPlayer.videoHeight;

    progress.min = 0;
    progress.max = 100;
    progress.value = 0;
});


videoPlayer.addEventListener("timeupdate", () => {
    progress.value = (videoPlayer.currentTime / videoPlayer.duration) * 100;
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


/*Aceptar seleccion:
- Al hacer click en "Select frame", se muestra el sidebar.
- No se puede modificar la seleccion del frame al mover el video:
    - a menos que se complete el formulario del sidebar y
    - se haya enviado el formulario
- Se activa el sidebar hasta que se envíe el formulario.
- Se guarda el frame y la información del investigador.
- Otras cosas:________________________________________________________________________
*/
/*-------------------------ACEPTAR SELECCION DE UN FRAME-------------------------*/
acceptFrameBtn.addEventListener("click", () => {
    pausar();
    acceptFrameBtn.classList.add("hidden");
    aceptado = true;
    scaleSave.disabled = false;
    scaleSave.classList.remove("hidden");
    activarListeners(true);
    //Si ya se ha aceptado el frame, no quiero que cambie el frame al mover el video. A menos que se haya finalizado el form de aside (if form terminado y submitted true, aceptado = false).
    frame = Math.floor(videoPlayer.currentTime * 30) //Si 30 fps por segundo.
    savedFrame = ctx.getImageData(0, 0, framePlaceholder.width, framePlaceholder.height);
});


/*Escala:
- Dibujar rectángulo para marcar la escala
- Guardar escala
*/
/*-------------------------DIBUJAR Y GUARDAR ESCALA-------------------------*/
function activarListeners(bool){
    const activo = bool ? 'addEventListener' : 'removeEventListener';
    overlay.style.touchAction = "none";
    overlay[activo]("pointerdown", startDrawing); //overlay["addEventListener"]("mousedown", startDrawing) es lo mismo que overlay.addEventListener("mousedown", startDrawing)
    overlay[activo]("pointermove", draw);
    overlay[activo]("pointerup", stopDrawing);
    overlay[activo]("pointercancel", stopDrawing);
    overlay.style.cursor= bool ? "crosshair" : "";
}

scaleSave.addEventListener('click', () => {
    if(dibujoHecho){
        scaleInfo = calculateScale();
        if (scaleInfo) {
            console.log("Scale info:", scaleInfo);
        }
        scaleSave.disabled = true;
        scaleSave.classList.add("hidden");
        boneSlidersContainer.forEach(boneSliderContainer => {
            if (boneSliderContainer.classList.contains(`${selectedZone}-item`)) {
                boneSliderContainer.classList.remove("hidden");
                boneSliderContainer.style.display = "flex";
                boneSliderContainer.style.flexDirection = "column";
                boneSliderContainer.style.alignItems = "center";
                activeStructures = document.querySelectorAll(`.${selectedZone}-item`);
                selectedStructure = activeStructures[0];
                boneSliders.forEach((boneSlider, index) => {
                    thresholds[index] = parseInt(boneSliders[index].value, 10);
                    boneSlider.disabled = false;
                    boneSlider.classList.remove("hidden");
                });
                boneSliderLabels.forEach((boneSliderLabel, index) => {
                    boneSliderLabel.classList.remove("hidden");
                    boneSliderLabel.textContent = "Threshold: " + thresholds[index];
                });
            } else {
                boneSliderContainer.classList.add("hidden");
                boneSliderContainer.style.display = "none";
            }
        });
        acceptThresholdBtn.classList.remove("hidden");
        acceptThresholdBtn.disabled = false;
        applyThreshold(savedFrame, thresholds[0]);
        dibujoHecho=false;
        ctxOverlay.clearRect(0,0, overlay.width, overlay.height);
        activarListeners(false);
        sidebar.classList.remove("hidden");
        content.style.marginRight = "21vw";
    }
    else{
        alert('Draw something on canvas before saving.');
    }
});
//Dibujar rectangulo escala
function startDrawing(e) {
    overlay.setPointerCapture(e.pointerId);
    const pos = getPos(overlay, e);
    startX = pos.x;
    startY = pos.y;
    drawing = true;
    dibujoHecho=false;
}
function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(overlay, e);
    ctxOverlay.clearRect(0, 0, overlay.width, overlay.height);
    ctxOverlay.fillStyle = "rgba(255, 255, 255, 0.7)"; //capa blanca
    ctxOverlay.fillRect(0, 0, overlay.width, overlay.height); //capa blanca para todo el overlay
    const width = pos.x - startX;
    const height = pos.y - startY;
    ctxOverlay.clearRect(startX, startY, width, height);
}

function stopDrawing(e) {
    if (!drawing) return;
    overlay.releasePointerCapture(e.pointerId);
    const pos = getPos(overlay, e);
    endX = pos.x;
    endY = pos.y;
    drawing = false;
    dibujoHecho=true;
}

function getPos(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    //Si existe el contacto con la pantalla, recoge el valor del primer contacto con la misma (por si hay varios dedos), si no, recoge directamente la posicion del raton
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: (clientX - rect.left)/rect.width*canvas.width,
        y: (clientY - rect.top)/rect.height*canvas.height
    };
}

function calculateScale() {
    if (startX === null || startY === null || endX === undefined || endY === undefined) {
        return null;
    }
    const rectHeight = Math.abs(endY - startY);
    const imageHeight = framePlaceholder.height;
    const scale = rectHeight / imageHeight; // pixels per pixel
    return scale;
}


/*Sidebar Thresholds:
- Al seleccionar una zona, se muestran las estructuras correspondientes.
- El threshold de analisis bone se puede ajustar con un slider.
- Slider para marcar el umbral de tejido de interés (no creo que sirva para tejidos sin un gran contraste)
- Modificar los blancos y negros del frame de acuerdo al threshold
- Al aceptar los thresholds, se deshabilita la seleccion de zona y se activa el sidebar de brush.
*/
/*-------------------------SIDEBAR THRESHOLDS-------------------------*/
//Al seleccionar una zona, se muestran las estructuras correspondientes. Si no hay una zona seleccionada, se selecciona la primera por defecto.
function showStructures(selectedZone){
    if (!thresholdAceptado){
        // Mostrar los sliders de threshold correspondientes a la zona seleccionada
        boneSlidersContainer.forEach(boneSliderContainer => {
            if (boneSliderContainer.classList.contains(`${selectedZone}-item`)) {
                boneSliderContainer.classList.remove("hidden");
                boneSliderContainer.style.display = "flex";
                boneSliderContainer.style.flexDirection = "column";
                boneSliderContainer.style.alignItems = "center";
                activeStructures = document.querySelectorAll(`.${selectedZone}-item`);
                selectedStructure = activeStructures[0];
                boneSliders.forEach((boneSlider, index) => {
                    thresholds[index] = parseInt(boneSliders[index].value, 10);
                    boneSlider.disabled = false;
                    boneSlider.classList.remove("hidden");
                });
                boneSliderLabels.forEach((boneSliderLabel, index) => {
                    boneSliderLabel.classList.remove("hidden");
                    boneSliderLabel.textContent = "Threshold: " + thresholds[index];
                });
            } else {
                boneSliderContainer.classList.add("hidden");
                boneSliderContainer.style.display = "none";
            }
        });
    }
    else {
        //Mostrar las estructuras correspondientes a la zona seleccionada para seleccion de brush
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
}
showStructures(selectedZone);

boneSliders.forEach((boneSlider, index) => {
    boneSlider.addEventListener('input', () => {
        thresholds[index] = parseInt(boneSlider.value, 10);
        boneSliderLabels[index].textContent = "Threshold: " + thresholds[index];
        applyThreshold(savedFrame, thresholds[index]);
    });
});

function applyThreshold(image, threshold) {
    var canvasElement = document.createElement("canvas");
    var contextElement = canvasElement.getContext("2d");
    canvasElement.width = image.width;
    canvasElement.height = image.height;
    contextElement.putImageData(image, 0, 0);
    var imageData = contextElement.getImageData(0, 0, canvasElement.width, canvasElement.height);
    var data = imageData.data;
    var len = data.length;
    for (var i = 0; i < len; i += 4) {
        var gray = data[i];
        var color = gray < threshold ? 0 : 255;
        data[i] = color; // red
        data[i + 1] = color; // green
        data[i + 2] = color; // blue
    }
    contextElement.putImageData(imageData, 0, 0);
    var imgElement = new Image();
    imgElement.src = canvasElement.toDataURL();
    imgElement.onload = function() {
        ctx.clearRect(0, 0, framePlaceholder.width, framePlaceholder.height);
        ctx.drawImage(imgElement, 0, 0);
    };
}

acceptThresholdBtn.addEventListener('click', () => {
    thresholdAceptado = true;
    acceptThresholdBtn.disabled = true;
    acceptThresholdBtn.classList.add("hidden");
    boneSlidersContainer.forEach(boneSliderContainer => {
        boneSliderContainer.classList.add("hidden");
        boneSliderContainer.style.display = "none";
    });
    structureControls.classList.remove("hidden");
    setThresholds.classList.add("hidden");
    showStructures(selectedZone);
    zones.forEach(zone => {
        zone.disabled = true;
    });
    zoneControls.classList.add("disabled");

    ctx.clearRect(0, 0, framePlaceholder.width, framePlaceholder.height);
    ctx.putImageData(savedFrame, 0, 0);
    //Dibujos con los brush
    overlay.style.display = "none";
    framePlaceholder.style.touchAction = "none";
    framePlaceholder["addEventListener"]("mousedown", startDrawingBrush); //framePlaceholder["addEventListener"]("mousedown", startDrawing) es lo mismo que framePlaceholder.addEventListener("mousedown", startDrawing)
    framePlaceholder["addEventListener"]("mousemove", drawBrush);
    framePlaceholder["addEventListener"]("mouseup", stopDrawingBrush);
    framePlaceholder["addEventListener"]("mouseleave", stopDrawingBrush);
    framePlaceholder["addEventListener"]("touchstart", startDrawingBrush);
    framePlaceholder["addEventListener"]("touchmove", drawBrush);
    framePlaceholder["addEventListener"]("touchend", stopDrawingBrush);
    framePlaceholder["addEventListener"]("touchcancel", stopDrawingBrush);

    submitBtn.classList.remove("hidden");
    submitBtn.classList.add("disabled");
    validar();
});

/*Sidebar Brush:
- El tamaño del brush se puede ajustar con un slider.
- Al seleccionar una estructura, se activa el brush correspondiente, permitiendo dibujar.
- Cada estructura tiene un botón para borrar el trazo correspondiente.
- Cuando se ha completado el formulario, se puede enviar.
*/
/*-------------------------SIDEBAR BRUSH-------------------------*/
zones.forEach(zone => {
    if (!thresholdAceptado) {
        zone.addEventListener('change', (event) => {
            selectedZone = event.target.value;
            showStructures(selectedZone);
        });
    } else {
        zone.addEventListener('change', (event) => {
            structures.forEach((structure) => {
                structure.classList.add("hidden");
                clearDrawing();
            });
            selectedZone = event.target.value;
            showStructures(selectedZone);
        });
    }
});
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


function startDrawingBrush(e) {
    if(aceptado){
        drawing = true;
        trazoActual = {color: colors[currentIndex], width: widths[currentIndex], puntos: []};
        if (indexUsados.find(uso => uso === currentIndex) == null) {
            indexUsados.push(currentIndex);
        }
        drawBrush(e);
    }
}
function stopDrawingBrush() {
    if (aceptado){
        if(trazoActual) {
            trazos.push(trazoActual);
            indexUsados.forEach((uso, index) => {
                if (colors[uso] === trazoActual.color) {
                    if (!mask[index]) {
                        mask[index] = {color: null, width: null, puntos: []};
                    }
                    mask[index].puntos.push(...trazoActual.puntos);
                    mask[index].color = colors[uso];
                    mask[index].width = widths[uso];
                }
            });
            trazoActual = null;
        }
        validar();
        drawing = false;
        ctx.beginPath();
    }
}

function drawBrush(e) {
    if (aceptado){
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
    mask = mask.filter(trazo => trazo.color !== colorDelete)
    indexUsados = indexUsados.filter(indice =>  colors[indice] !== colorDelete)
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

function validar() {
    /*const activeColors = Array.from(structures).map(s => s.querySelector('.brush-slider').style.accentColor);
    const allColorsDrawn = activeColors.every(color =>
        trazos.some(trazo => trazo.color === color && trazo.puntos.length > 0)
    );*/
    allColorsDrawn=true; //Se han definido muchas estructuras, dejar por ahora sin esta validación que obliga a dibujarlo todo
    if (allColorsDrawn) {
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



/*Parametros de calidad de tejido y region quemada:
- fetch calculos tissue-quality
- fetch calculos region quemada
*/
/*-------------------------PARÁMETROS-------------------------*/
submitBtn.addEventListener('click', () => {
    if (aceptado && submitted) {
        submitBtn.disabled = true;

        const maskOriginalCanvas = document.createElement("canvas");
        const maskOriginalCtx = maskOriginalCanvas.getContext("2d");
        maskOriginalCanvas.width = savedFrame.width;
        maskOriginalCanvas.height = savedFrame.height;
        maskOriginalCtx.putImageData(savedFrame, 0, 0);
        const imageURL = maskOriginalCanvas.toDataURL();
        
        let maskEdited = [{zona: null, estructura: null, mask: null}];
        indexUsados.forEach((indiceUsado, indice) => {
            const maskEditedCanvas = document.createElement('canvas');
            const maskEditedCtx = maskEditedCanvas.getContext('2d');
            maskEditedCanvas.width = savedFrame.width;
            maskEditedCanvas.height = savedFrame.height;
            trazos.forEach(trazo => {
                if (trazo.color === colors[indiceUsado]) {
                    maskEditedCtx.lineWidth = widths[indiceUsado];
                    maskEditedCtx.lineCap = 'round';
                    maskEditedCtx.strokeStyle = "rgba(255,255,255,1)";
                    for (let i = 1; i < trazo.puntos.length; i++) {
                        const punto1 = trazo.puntos[i-1];
                        const punto2 = trazo.puntos[i];
                        maskEditedCtx.beginPath();
                        maskEditedCtx.moveTo(punto1.x, punto1.y);
                        maskEditedCtx.lineTo(punto2.x, punto2.y);
                        maskEditedCtx.stroke();
                    }
                    maskEditedCtx.beginPath();                    
                    if (!maskEdited[indice]) {
                        maskEdited[indice] = {zona: null, estructura: null, mask: null, threshold: null};
                    }
                    maskEdited[indice].zona = selectedZone;
                    maskEdited[indice].estructura = activeStructures[indiceUsado].querySelector('.structure-name').textContent;
                    maskEdited[indice].mask = maskEditedCanvas;
                    maskEdited[indice].threshold = thresholds[indiceUsado];
                }
            })
        });

        maskEdited.forEach(mascara => {
            objectJSQuality = saveQualityData(maskOriginalCanvas, mascara.mask, mascara.zona, mascara.estructura)
            objectJSBone = saveBoneData(maskOriginalCanvas, mascara.mask, mascara.zona, mascara.estructura, mascara.threshold)
            saveData(objectJSQuality, objectJSBone);
        });
    } else{
        alert('Draw something on canvas before saving.');
    }
});

function saveQualityData(originalCanvas, maskCanvas, zona, estructura) {
    const originalURL = originalCanvas.toDataURL();
    const maskURL = maskCanvas.toDataURL();
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
    const quality = {
        timestamp: timestamp,
        video: fileName.textContent, 
        zona: zona, 
        estructura: estructura,
        frameoriginal: `${fileName.textContent}_${frame}.png`, 
        frameMask: `${timestamp}.png`,
        originalImage: originalURL,
        maskImage: maskURL,
        evaluator: evaluatorName,
        dimensions:{width: originalCanvas.width, height: originalCanvas.height}
    };
    return quality;
};

function saveBoneData(originalCanvas, maskCanvas, zona, estructura, threshold) {
    const originalURL = originalCanvas.toDataURL();
    const maskURL = maskCanvas.toDataURL();
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
    const bone = {
        timestamp: timestamp,
        video: fileName.textContent,
        zona: zona, 
        estructura: estructura,
        frameoriginal: `${fileName.textContent}_${frame}.png`, 
        frameMask: `${timestamp}_bone.png`,
        originalImage: originalURL,
        maskImage: maskURL,
        evaluator: evaluatorName,
        dimensions:{width: originalCanvas.width, height: originalCanvas.height},
        threshold: threshold,
        scale: scaleInfo
    };
    return bone;
};

function saveData(objectJSQuality, objectJSBone) {
    fetch('/save-parametres', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            qualityData: objectJSQuality,
            boneData: objectJSBone
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
        //recargarVideo(appName, fileName.textContent);
    })
    .catch((error) => {
        console.error('Error:', error);
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