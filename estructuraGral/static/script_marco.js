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
const submitBtn = document.getElementById("submitBtn");
let aceptado = false; //frame aceptado, para no modificarlo hasta terminar el formulario
let limits = false; //dibujar limites solo si se ha clicado el boton y aun no se ha guardado el dibujo hehco
let scale = false; //lo mimso para la escala
let submitted = false; //formulario del frame aceptado

const sidebar = document.getElementById("sidebar");
const blocks = document.querySelectorAll(".block");
const limitsBtn = document.getElementById("limitsBtn");
const scaleBtn = document.getElementById("scaleBtn");

let drawing = false;
let trazos = [];
let trazoActual = null;


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
        if (frame!== null){
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
    console.log(lastValue);

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
    range.noUiSlider.on('update', function( values, handle ) {
        if ( handle ) {
            lastValue = (values[handle] / 100) * videoPlayer.duration;
            videoPlayer.currentTime = lastValue;
            lastFrame = Math.floor(lastValue * 30); //Si 30 fps por segundo.
        } else {
            firstValue = (values[handle] / 100) * videoPlayer.duration;
            videoPlayer.currentTime = firstValue;
            firstFrame = Math.floor(firstValue * 30); //Si 30 fps por segundo.
        }
    });
});

acceptGroupBtn.addEventListener("click", ()=> {
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
    for (let i = firstFrame; i <= lastFrame; i++) {
        videoPlayer.currentTime = i/30;
        ctx.drawImage(videoPlayer, 0, 0);
        savedFrames.push(ctx.getImageData(0, 0, framePlaceholder.width, framePlaceholder.height));
    }
});




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
});



/*Sidebar:
- Seleccion de marco
- Guardado del marco
- Seleccion de escala
- Guardado de escala
- Cuando se ha completado, se puede enviar
*/
/*-------------------------SIDEBAR-------------------------*/
limitsBtn.addEventListener("click", () => {
    overlay.style.cursor="crosshair";
    limits= true;
});

let startX, startY;
let isSelecting = false;
let selection = null;

// Obtener coordenadas del mouse o táctil
function getPos(canvas, e) {
    const rect = canvas.getBoundingClientRect();

    // Coordenadas del clic respecto al viewport
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Ajuste de escala
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}
overlay.addEventListener("mousedown", startSelection);
overlay.addEventListener("mousemove", drawSelection);
overlay.addEventListener("mouseup", endSelection);
overlay.addEventListener("touchstart", startSelection);
overlay.addEventListener("touchmove", drawSelection);
overlay.addEventListener("touchend", endSelection);

function startSelection(e) {
    if(limits){
        const pos = getPos(overlay, e);
        startX = pos.x;
        startY = pos.y;
        isSelecting = true;
    }
}

function drawSelection(e) {
    if(limits){
        if (!isSelecting) return;
        e.preventDefault();

        const pos = getPos(overlay, e);
        const width = pos.x - startX;
        const height = pos.y - startY;

        // Dibuja la capa semitransparente
        ctxOverlay.fillStyle = "rgba(255, 255, 255)";
        ctxOverlay.fillRect(0, 0, overlay.width, overlay.height);

        // Crear "ventana" de selección (área más clara)
        ctxOverlay.clearRect(startX, startY, width, height);

    }
}

function endSelection(e) {
    if(limits) {
        if (!isSelecting) return;
        isSelecting = false;

        const pos = getPos(overlay, e);
        const width = pos.x - startX;
        const height = pos.y - startY;

        selection = {
            x: Math.min(startX, pos.x),
            y: Math.min(startY, pos.y),
            w: Math.abs(width),
            h: Math.abs(height)
        };
    }
}


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
    if(aceptado){
        drawing = true;
        trazoActual = {color: colors[currentIndex], width: widths[currentIndex], puntos: []};
        draw(e);
    }
}
function stopDrawing() {
    if (aceptado){
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

//Formulario completado, validar y enviar (video, frame original, frame editado, filename, marco, escala, evaluator)
function validar() {
    
}

submitBtn.addEventListener("click", () => {
    if (aceptado && submitted) {
        saveDrawing();
    }
});

function saveDrawing(){
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
                evaluator: evaluatorName
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
        recargarVideo(appName, fileName.textContent);
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