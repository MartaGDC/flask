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
const framePlaceholder = document.getElementById("frame-placeholder");
const overlay = document.getElementById("canvas-overlay");
const ctx = framePlaceholder.getContext("2d", { willReadFrequently: true });
const ctxOverlay = overlay.getContext("2d");

let frame = null;
let savedFrame = null;
let pausado = false; //mostrar el frame solo si está pausado

const researcherInfo = document.getElementById("researcherInfo");
let numFramesEval = null;

const acceptFrameBtn = document.getElementById("acceptFrameBtn");
const submitBtn = document.getElementById("submitBtn");
let aceptado = false;
let dibujoHecho = false;

const scaleSave = document.getElementById("scaleSave");
let scaleInfo = null;
let objectJSQuality = null;
const boneSlider = document.getElementById("boneSlider");
const boneSliderSpan = document.getElementById("boneSliderSpan");
const boneSliderLabel = document.getElementById("boneSliderLabel")
const acceptThresholdBtn = document.getElementById("acceptThresholdBtn");
let threshold = null;
let objectJSBone = null;

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
            await countFramesPerEval(evaluatorName);
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
        boneSlider.disabled = false;
        boneSlider.classList.remove("hidden");
        boneSliderSpan.classList.remove("hidden");
        boneSliderLabel.classList.remove("hidden");
        acceptThresholdBtn.disabled = false;
        acceptThresholdBtn.classList.remove("hidden");
        threshold = parseInt(boneSlider.value, 10);
        boneSliderLabel.textContent += threshold;
        applyThreshold(savedFrame, threshold); 
        dibujoHecho=false;
        ctxOverlay.clearRect(0,0, overlay.width, overlay.height);
        activarListeners(false);
    }
    else{
        alert('Draw something on canvas before saving.');
    }
});
//Dibujar rectangulos
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


/*"Bone" threshold:
- Slider para marcar el umbral de tejido quemado
- Modificar los colores del frame de acuerdo al threshold
*/
/*-------------------------MARCAR UMBRAL DE TEJIDO QUEMADO-------------------------*/
boneSlider.addEventListener('input', () => {
    threshold = parseInt(boneSlider.value, 10);
    boneSliderLabel.textContent = "Value: " + threshold; 
    applyThreshold(savedFrame, threshold);
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
    boneSlider.disabled = true;
    boneSlider.classList.add("hidden");
    boneSliderSpan.classList.add("hidden");
    boneSliderLabel.classList.add("hidden");
    acceptThresholdBtn.disabled = true;
    acceptThresholdBtn.classList.add("hidden");
    submitBtn.disabled = false;
    submitBtn.classList.remove("hidden");
    ctx.clearRect(0, 0, framePlaceholder.width, framePlaceholder.height);
    ctx.putImageData(savedFrame, 0, 0);
    activarListeners(true);
});


/*Parametros de calidad de tejido y region quemada:
- Dibujar rectángulo para marcar la zona de interés
- fetch calculos tissue-quality
- fetch calculos region quemada
*/
/*-------------------------PARÁMETROS-------------------------*/
submitBtn.addEventListener('click', () => {
    if(dibujoHecho){
        submitBtn.disabled = true;

        objectJSQuality = saveQualityData();
        objectJSBone = saveBoneData();
        saveData(objectJSQuality, objectJSBone);
    } else{
        alert('Draw something on canvas before saving.');
    }
});

function saveQualityData() {
    const maskOriginalCanvas = document.createElement("canvas");
    const maskOriginalCtx = maskOriginalCanvas.getContext("2d");
    maskOriginalCanvas.width = savedFrame.width;
    maskOriginalCanvas.height = savedFrame.height;
    maskOriginalCtx.putImageData(savedFrame, 0, 0);
    const imageURL = maskOriginalCanvas.toDataURL();
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
    const quality = {
        timestamp: timestamp,
        video: fileName.textContent, 
        frameoriginal: `${fileName.textContent}_${frame}.png`, 
        originalImage: imageURL,
        evaluator: evaluatorName,
        startPoint: { x: startX, y: startY },
        endPoint: { x: endX, y: endY },
        dimensions:{width: maskOriginalCanvas.width, height: maskOriginalCanvas.height}
    };
    return quality;
};

function saveBoneData() {
    const maskOriginalCanvas = document.createElement("canvas");
    const maskOriginalCtx = maskOriginalCanvas.getContext("2d");
    maskOriginalCanvas.width = savedFrame.width;
    maskOriginalCanvas.height = savedFrame.height;
    maskOriginalCtx.putImageData(savedFrame, 0, 0);
    const imageURL = maskOriginalCanvas.toDataURL();
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
    const bone = {
        timestamp: timestamp,
        video: fileName.textContent, 
        frameoriginal: `${fileName.textContent}_${frame}.png`, 
        originalImage: imageURL,
        evaluator: evaluatorName,
        startPoint: { x: startX, y: startY },
        endPoint: { x: endX, y: endY },
        dimensions:{width: maskOriginalCanvas.width, height: maskOriginalCanvas.height},
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
        recargarVideo(appName, fileName.textContent);
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