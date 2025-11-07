const body = document.body;
const content = document.querySelector(".content");

const reloadBtn = document.getElementById("reloadBtn");

const fileBtn = document.getElementById("fileBtn");
const fileName = document.getElementById("fileName");
//const videoFileInput = document.getElementById("videoFileInput");
let appName = "";
let nbFile = "";
const videoWindow = document.getElementById("videoWindow");
const videoList = document.getElementById("videoList");
let evaluatorName = "";

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
const overlay = document.getElementById("canvas-overlay");
const ctx = framePlaceholder.getContext("2d", { willReadFrequently: true });
const ctxOverlay = overlay.getContext("2d");
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
let aceptado = false; //frame aceptado, para no modificarlo hasta terminar el formulario
let dibujoHecho = false;
let limits = false; //dibujar limites solo si se ha clicado el boton y aun no se ha guardado el dibujo hehco
let scale = false; //lo mimso para la escala
let marcoSubmitted = false;
let escalaSubmitted = false;

const sidebar = document.getElementById("sidebar");
const limitsBtn = document.getElementById("limitsBtn");
const saveLimits = document.getElementById("saveLimits");
const clearLimits = document.getElementById("clearLimits");
const scaleBtn = document.getElementById("scaleBtn");
const saveScale = document.getElementById("saveScale");
const clearScale = document.getElementById("clearScale");

let drawing = false;
let startX, startY;


/*Botones reload y home:

*/
/*-------------------------BOTONES LOGOUT Y HOME-------------------------*/
reloadBtn.addEventListener("click", () => {
    location.reload();
})

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

    fetch(`/verifyUser/${evaluatorName}/${appName}`)
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            alert(data.message);
            window.location.href = data.redirect;
        } else {}
    })
    .catch();
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
    selectVideo(appName, nbFile, frame);
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
        li.addEventListener("click", () => selectVideo(appName, video, frame));
        videoList.appendChild(li);
    }); 
}

async function selectVideo(appName, filename, frame){
    if (filename) {
        videoWindow.classList.add("hidden");
        content.classList.remove("disabled");
        const videoURL = `/media/${appName}/${filename}`;
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
        if(numFramesEval===0){
            researcherInfo.textContent = `Evaluator ${evaluatorName} hasn't studied this video.`;
        }
        else{
            researcherInfo.textContent = `Evaluator ${evaluatorName} has already studied this video.`;
        }
        pausado = true;
        drawFrame();
        acceptFrameBtn.classList.remove("hidden");
        acceptFramesBtn.classList.remove("hidden");
        fileBtn.disabled = true;
        fileBtn.classList.add("disabled");
    } else {
        fileName.textContent = "No video selected.";
        videoContainer.style.display = "none";
        acceptFrameBtn.disabled = true;
        acceptFramesBtn.disabled = true;
    }
}

async function countFramesPerEval(evaluatorName) {
    try {
        const response = await fetch('static/DATA/file_info.json');
        if (!response.ok) {
            numFramesEval = 0;
            return;
        }
        const data = await response.json();
        numFramesEval = data.filter(item => item.evaluator === evaluatorName && item.video.startsWith(fileName.textContent)).length;
        console.log(data);
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
    sidebar.classList.remove("hidden");
    content.style.marginRight = "21vw";
    aceptado=true;
    for (let i = firstFrame; i <= lastFrame; i++) {
        frames.push(i);
    }
    savedFrames = await captureFrames(videoPlayer, ctx, firstFrame, lastFrame); //necesario un await, porque empezaba a tener problemas para que realmente videoplayer se posicionase
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
    aceptado = true;
    sidebar.classList.remove("hidden");
    content.style.marginRight = "21vw";

    //Si ya se ha aceptado el frame, no quiero que cambie el frame al mover el video. A menos que se haya finalizado el form de aside (if form terminado y submitted true, aceptado = false).
    frame = Math.floor(videoPlayer.currentTime * 30) //Si 30 fps por segundo.
});



/*Sidebar:
- Seleccion de marco
- Guardado del marco
- Seleccion de escala
- Guardado de escala
- Cuando se ha completado, se puede enviar
*/
/*-------------------------SIDEBAR-------------------------*/
//Quitar eventos y ponerlos para que el overlay responda solo cuando debe
function activarListeners(bool){
    const activo = bool ? 'addEventListener' : 'removeEventListener';
    overlay[activo]("mousedown", startDrawing); //overlay["addEventListener"]("mousedown", startDrawing) es lo mismo que overlay.addEventListener("mousedown", startDrawing)
    overlay[activo]("mousemove", draw);
    overlay[activo]("mouseup", stopDrawing);
    overlay[activo]("touchstart", startDrawing);
    overlay[activo]("touchmove", draw);
    overlay[activo]("touchend", stopDrawing);
    overlay.style.cursor= bool ? "crosshair" : "";
}

limitsBtn.addEventListener("click", () => {
    limitsBtn.disabled = true;
    limitsBtn.classList.add("disabled");
    scaleBtn.disabled = true;
    scaleBtn.classList.add("disabled");
    saveScale.disabled = true;
    saveScale.classList.add("disabled");
    clearScale.disabled = true;
    clearScale.classList.add("disabled");
    saveLimits.disabled = false;
    saveLimits.classList.remove("disabled");
    clearLimits.disabled = false;
    clearLimits.classList.remove("disabled");

    limits= true;
    activarListeners(true);
});
saveLimits.addEventListener('click', () => {
    if(dibujoHecho){
        marcoSubmitted=true;
        saveDrawing("marco");
        activarListeners(false);
        if(!escalaSubmitted){
            scaleBtn.disabled = false;
            scaleBtn.classList.remove("disabled");
        }
        saveLimits.disabled = true;
        saveLimits.classList.add("disabled");
        clearLimits.disabled = true;
        clearLimits.classList.add("disabled");
        dibujoHecho=false;
    }
    else{
        alert('Draw something on canvas before saving.');
    }
});
clearLimits.addEventListener('click', () => {
    ctxOverlay.clearRect(0,0, overlay.width, overlay.height);
    limits=false;
    limitsBtn.disabled = false;
    limitsBtn.classList.remove("disabled");
    if(!escalaSubmitted) {
        scaleBtn.disabled = false;
        scaleBtn.classList.remove("disabled");
    }
    saveLimits.disabled = true;
    saveLimits.classList.add("disabled");
    clearLimits.disabled = true;
    clearLimits.classList.add("disabled");
    activarListeners(false);
});


scaleBtn.addEventListener("click", () => {
    limitsBtn.disabled = true;
    limitsBtn.classList.add("disabled");
    scaleBtn.disabled = true;
    scaleBtn.classList.add("disabled");
    saveLimits.disabled = true;
    saveLimits.classList.add("disabled");
    clearLimits.disabled = true;
    clearLimits.classList.add("disabled");
    saveScale.disabled = false;
    saveScale.classList.remove("disabled");
    clearScale.disabled = false;
    clearScale.classList.remove("disabled");

    scale= true;
    activarListeners(true);
});
saveScale.addEventListener('click', () => {
    if(dibujoHecho){
        escalaSubmitted=true;
        saveDrawing("escala");
        activarListeners(false);
        if(!marcoSubmitted) {
            limitsBtn.disabled = false;
            limitsBtn.classList.remove("disabled");
        }
        saveScale.disabled = true;
        saveScale.classList.add("disabled");
        clearScale.disabled = true;
        clearScale.classList.add("disabled");
        dibujoHecho=false;
    }
    else{
        alert('Draw something on canvas before saving.');
    }
});
clearScale.addEventListener('click', () => {
    ctxOverlay.clearRect(0,0, overlay.width, overlay.height);
    escala=false;
    scaleBtn.disabled = false;
    scaleBtn.classList.remove("disabled");
    if(!marcoSubmitted) {
        limitsBtn.disabled = false;
        limitsBtn.classList.remove("disabled");
    }
    saveScale.disabled = true;
    saveScale.classList.add("disabled");
    clearScale.disabled = true;
    clearScale.classList.add("disabled");
    activarListeners(false);
});
//Dibujar rectangulos
function startDrawing(e) {
    if(limits || scale){
        const pos = getPos(overlay, e);
        startX = pos.x;
        startY = pos.y;
        drawing = true;
        dibujoHecho=false;
    }
}

function draw(e) {
    if(limits || scale){
        if (!drawing) return;
        e.preventDefault();
        const pos = getPos(overlay, e);
        const width = pos.x - startX;
        const height = pos.y - startY;
        ctxOverlay.fillStyle = "rgba(255, 255, 255)"; //capa blanca
        ctxOverlay.fillRect(0, 0, overlay.width, overlay.height); //capa blanca para todo el overlay
        ctxOverlay.clearRect(startX, startY, width, height); //quitar capa blanca en rectangulo dibujado
    }
}

function stopDrawing(e) {
    if(limits || scale){
        if (!drawing) return;
        drawing = false;
        dibujoHecho=true;
    }
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


function saveDrawing(caract){
    let objectJS = [];
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');

    if (frames.length > 0) { //Existe un listado de frames
        frames.forEach((numframe, index) => {
            //imagenes de cada frame para guardarlas en png. Tendrán el mismo timestamp, así que añadimos el frame al final
            const maskEditedCanvas = document.createElement('canvas');
            const maskEditedCtx = maskEditedCanvas.getContext('2d');
            maskEditedCanvas.width = savedFrames[index].width;
            maskEditedCanvas.height = savedFrames[index].height;
            maskEditedCtx.putImageData(savedFrames[index], 0, 0);
            maskEditedCtx.drawImage(overlay, 0, 0);
            const imageEditedURL = maskEditedCanvas.toDataURL();

            const maskOriginalCanvas = document.createElement("canvas");
            const maskOriginalCtx = maskOriginalCanvas.getContext("2d");
            maskOriginalCanvas.width = savedFrames[index].width;
            maskOriginalCanvas.height = savedFrames[index].height;
            maskOriginalCtx.putImageData(savedFrames[index], 0, 0);
            const imageURL = maskOriginalCanvas.toDataURL();
            const frameObject = {
                video: fileName.textContent, 
                frame: numframe,
                originalImage: imageURL,
                imageEdited: imageEditedURL,
                frameoriginal: `0_4_${fileName.textContent}_${numframe}.png`, 
                filesaved: `${timestamp}_${caract}_${index}.png`,
                quality: "",
                zone: "none",
                evaluator: evaluatorName
            }
            objectJS.push(frameObject);     
        });
    } else { //No existe frames, solo frame
        const maskEditedCanvas = document.createElement('canvas');
        const maskEditedCtx = maskEditedCanvas.getContext('2d');
        maskEditedCanvas.width = overlay.width;
        maskEditedCanvas.height = overlay.height;
        maskEditedCtx.putImageData(savedFrame, 0, 0);
        maskEditedCtx.drawImage(overlay, 0, 0);
        const imageEditedURL = maskEditedCanvas.toDataURL();

        const maskOriginalCanvas = document.createElement("canvas");
        const maskOriginalCtx = maskOriginalCanvas.getContext("2d");
        maskOriginalCanvas.width = savedFrame.width;
        maskOriginalCanvas.height = savedFrame.height;
        maskOriginalCtx.putImageData(savedFrame, 0, 0);
        const imageURL = maskOriginalCanvas.toDataURL();
        objectJS = {
            video: fileName.textContent, 
            frame: frame,
            originalImage: imageURL,
            imageEdited: imageEditedURL,
            frameoriginal: `0_4_${fileName.textContent}_${frame}.png`, 
            filesaved: `${timestamp}_${caract}.png`,
            quality: "",
            zone: "none",
            evaluator: evaluatorName
        };
    }

    ctxOverlay.clearRect(0,0, overlay.width, overlay.height);

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
        if(marcoSubmitted && escalaSubmitted) {
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