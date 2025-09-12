const body = document.body;
const content = document.querySelector(".content");

const logoutBtn = document.getElementById("logoutBtn");
const homeBtn = document.getElementById("homeBtn");

const fileBtn = document.getElementById("fileBtn");
const fileName = document.getElementById("fileName");
//const videoFileInput = document.getElementById("videoFileInput");
let appName = "";
const videoWindow = document.getElementById("videoWindow");
const videoList = document.getElementById("videoList");
const popup = document.getElementById("evaluator-popup");
const evaluatorInput = document.getElementById("evaluator");
const evaluatorSubmit = document.getElementById("evaluator-submit");
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
let selectedZone = zones[0].value;;

const structures = document.querySelectorAll(".structure-item");
let selectedStructure = null;
let currentIndex = null;
const sliders = document.querySelectorAll('.brush-slider');
const  widths = Array.from(document.querySelectorAll(".brush-slider")).map(slider => parseInt(slider.value));
const colors = Array.from(document.querySelectorAll(".structure-item")).map(div => div.dataset.color);
const deleteDrawings = document.querySelectorAll(".delete");
let drawing = false;
let trazos = [];
let trazoActual = null;


/*Botones logout y home:

*/
/*-------------------------BOTONES LOGOUT Y HOME-------------------------*/
homeBtn.addEventListener("click", () => {
    location.reload();
})

logoutBtn.addEventListener("click", () => {
    fetch("http://127.0.0.1:5004/logout", { method: "POST" })
        .then(response => {
            if (response.ok) {
                window.location.href = "http://127.0.0.1/index.php";
            }
        });
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
});

fileBtn.addEventListener("click", () => {
    if (!evaluatorName || evaluatorName.trim() === "") {
        popup.classList.remove("hidden");
        evaluatorInput.focus();
        content.classList.add("disabled");
    }
    else {
        //videoFileInput.click();
        getVideos();
    }
});

evaluatorInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        submitEvaluator();
    }
});
evaluatorSubmit.addEventListener("click", submitEvaluator);
function submitEvaluator() {
    evaluatorName = evaluatorInput.value.trim();
    if (evaluatorName !== "") {
        popup.classList.add("hidden");
        //videoFileInput.click();
        getVideos();
    }
    else {
        alert("Evaluator name is required to proceed.");
    }
}

// Al seleccionar un archivo de video, se muestra su nombre y se carga el video
async function getVideos(){
    const res = await fetch(`/select/${appName}`);
    if (!res.ok) {
        alert("Error loading list of videos");
        return;
    }
    const videos = await res.json();
    videoList.innerHTML = "";
    videoWindow.classList.remove("hidden");
    videos.forEach(video => {
        const li = document.createElement("li");
        li.textContent = video;
        li.addEventListener("click", () => selectVideo(appName, video));
        videoList.appendChild(li);
    });
}
function selectVideo(appName, filename){
    if (filename) {
        videoWindow.classList.add("hidden");
        content.classList.remove("disabled");
        const videoURL = `/media/${appName}/${filename}`;
        fileName.textContent = filename;
        videoPlayer.src = videoURL;
        videoContainer.style.display = "block";
        videoPlayer.load();
        videoPlayer.currentTime = 0; // Reset to the start of the video
        researcherInfo.textContent = `Evaluator ${evaluatorName} studied X frames from this video.`; //Modificar cuando tenga como recoger los frames guardados
        pausado = true;
        drawFrame();
        acceptFrameBtn.classList.remove("hidden");
        acceptFramesBtn.classList.remove("hidden");
    } else {
        fileName.textContent = "No video selected.";
        videoContainer.style.display = "none";
        acceptFrameBtn.disabled = true;
        acceptFramesBtn.disabled = true;
    }
}

/*
videoFileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
        fileName.textContent = file.name;
        const videoURL = URL.createObjectURL(file);
        videoPlayer.src = videoURL;
        videoContainer.style.display = "block";
        videoPlayer.load();
        videoPlayer.currentTime = 0; // Reset to the start of the video
        researcherInfo.textContent = `Evaluator ${evaluatorName} studied X frames from this video.`; //Modificar cuando tenga como recoger los frames guardados
        pausado = true;
        drawFrame();
    } else {
        fileName.textContent = "No video selected.";
        videoContainer.style.display = "none";
        acceptFrameBtn.disabled = true;
    }
});
*/
videoPlayer.addEventListener("loadedmetadata", () => { //Mejora muchísimo la resolución de la imagen del frame
    framePlaceholder.width = videoPlayer.videoWidth;
    framePlaceholder.height = videoPlayer.videoHeight;
    
    progress.min = 0;
    progress.max = 100;
    progress.value = 0;
});


/*
videoPlayer.addEventListener("loadedmetadata", () => { //Mejora muchísimo la resolución de la imagen del frame
    framePlaceholder.width = videoPlayer.videoWidth;
    framePlaceholder.height = videoPlayer.videoHeight;
    noUiSlider.create(range, {
        start: [ 0, 10 ],
        step: 1,
        margin: 2,
        connect: true,
        range: {
            'min': 0,
            'max': 100
        }
    });
});
range.noUiSlider.on('update', function( values, handle ) {
    if ( handle ) {
        valueInput.value = values[handle];
    } else {
        valueSpan.innerHTML = values[handle];
    }
});
valueInput.addEventListener('change', function(){
    range.noUiSlider.set([null, this.value]);
}); */


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
/*videoPlayer.addEventListener("pause", () => {
    pausado = true;
    drawFrame();
});
videoPlayer.addEventListener("play", () => {
    pausado = false;
});*/
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
    noUiSlider.create(range, {
        start: [ 0, 10 ],
        step: 1,
        margin: 2,
        connect: true,
        range: {
            'min': 0,
            'max': 100
        }
    });
    lastValue = (10 / 100) * videoPlayer.duration;
    lastFrame = Math.floor(lastValue * 30); //Si 30 fps por segundo.
    firstValue = 0;
    firstFrame = Math.floor(firstValue * 30); //Si 30 fps por segundo.
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
    console.log(frames.length, savedFrames.length);
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
    acceptFrameBtn.classList.add("hidden");
    acceptFramesBtn.classList.add("hidden");
    submitBtn.classList.remove("hidden");
    submitBtn.classList.add("disabled");
    aceptado = true;
    videoPlayer.pause();
    sidebar.classList.remove("hidden");
    fileBtn.disabled = true;
    fileBtn.classList.add("disabled");
    content.style.marginRight = "21vw";

    //Si ya se ha aceptado el frame, no quiero que cambie el frame al mover el video. A menos que se haya finalizado el form de aside (if form terminado y submitted true, aceptado = false).
    frame = Math.floor(videoPlayer.currentTime * 30) //Si 30 fps por segundo.
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
    slider.addEventListener('input', () => {
        widths[index] = parseInt(slider.value);
        clearColorDrawing(colors[index]);
    });
});
deleteDrawings.forEach((deleteButton, index) => {
    deleteButton.addEventListener('click', () => {
        clearColorDrawing(colors[index]);
    });
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
qualityGreen.addEventListener("click", greenYellowQuality);
qualityYellow.addEventListener("click", greenYellowQuality);
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
    selectedZone= "";
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
    good = true;
}



function validar() {
    activeStructures = document.querySelectorAll(`.${selectedZone}-structure-item`);
    const activeColors = Array.from(activeStructures).map(s => s.querySelector('.brush-slider').style.accentColor);
    const allColorsDrawn = activeColors.every(color =>
        trazos.some(trazo => trazo.color === color && trazo.puntos.length > 0
        )
    );
    if (allColorsDrawn || selectedQuality==="None" || selectedQuality === "Bad") {
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
        if (selectedQuality === "") {
                alert('Please select a quality (Good, Fair, or Bad) before saving.');
                submitBtn.classList.remove("disabled");

                return;
            }
            saveDrawing();
    }
});

function saveDrawing(){
    let objectJS = [];
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');

    if (frames.length > 0) {
        frames.forEach((numframe, index) => {
            //imagenes de cada frame para guardarlas en png. Tendrán el mismo timestamp, así que añadimos el frame al final
            const maskOriginalCanvas = document.createElement("canvas");
            const maskOriginalCtx = maskOriginalCanvas.getContext("2d");
            maskOriginalCanvas.width = savedFrames[index].width;
            maskOriginalCanvas.height = savedFrames[index].height;
            maskOriginalCtx.putImageData(savedFrames[index], 0, 0);
            const imageURL = maskOriginalCanvas.toDataURL();
            const imageEditedURL = maskOriginalCanvas.toDataURL();

            objectJS.push({
                video: fileName.textContent, 
                frame: numframe,
                originalImage: imageURL,
                imageEdited: imageEditedURL,
                filesaved: `${timestamp}_${index}.png`,
                quality: selectedQuality,
                zone: selectedZone,
                evaluator: evaluatorName
            });
        });
    } else {
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

        objectJS = {
            video: fileName.textContent, 
            frame: frame,
            originalImage: imageURL,
            imageEdited: imageEditedURL,
            filesaved: `${timestamp}.png`,
            quality: selectedQuality,
            zone: selectedZone,
            evaluator: evaluatorName
        };
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
        location.reload()
    })
    .catch(error => {
        console.error('Error saving drawing:', error);
        alert('An error occurred while saving. Please try again.');
    });
}