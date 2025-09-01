const content = document.querySelector(".content");

const fileBtn = document.getElementById("fileBtn");
const fileName = document.getElementById("fileName");
const videoFileInput = document.getElementById("videoFileInput");
const popup = document.getElementById("evaluator-popup");
const evaluatorInput = document.getElementById("evaluator");
const evaluatorSubmit = document.getElementById("evaluator-submit");
let evaluatorName = "";

const videoContainer = document.getElementById("video-container");
const videoPlayer = document.getElementById("video-player")
const prevFrameBtn = document.getElementById("prev-frame");
const nextFrameBtn = document.getElementById("next-frame");
const framePlaceholder = document.getElementById("frame-placeholder");
const ctx = framePlaceholder.getContext("2d", { willReadFrequently: true });
let savedFrame = null;
let pausado = false; //mostrar el frame solo si está pausado

const researcherInfo = document.getElementById("researcherInfo");

const acceptFrameBtn = document.getElementById("acceptFrameBtn");
let aceptado = false; //frame aceptado, para no modificarlo hasta terminar el formulario
let submitted = false; //formulario del frame aceptado

const sidebar = document.getElementById("sidebar");

const qualityButtons = document.querySelectorAll(".quality-button");
const qualityGreen = document.getElementById("qualityGreen");
const qualityYellow = document.getElementById("qualityYellow");
const qualityRed = document.getElementById("qualityRed");
let selectedQuality = "";

const zones = document.querySelectorAll('input[name="zone"]');
let selectedZone = zones[0].value;;

const structures = document.querySelectorAll(".structure-item");
let selectedStructure = null;
let currentIndex = 0;
const sliders = document.querySelectorAll('.brush-slider');
const  widths = Array.from(document.querySelectorAll(".brush-slider")).map(slider => parseInt(slider.value));
const colors = Array.from(document.querySelectorAll(".structure-item")).map(div => div.dataset.color);
const deleteDrawings = document.querySelectorAll(".delete");
let drawing = false;
let trazos = [];
let trazoActual = null;

/*Seleccion del video:
- Se abre un diálogo para seleccionar un archivo de video.
- Se muestra el nombre del archivo seleccionado.
- Se carga e inicia el video.
- Se muestra el frame del video en un canvas cuando el video está pausado.
- Se habilita el botón para aceptar el frame del video.
*/
/*-------------------------SELECCION DEL VIDEO-------------------------*/
//Se abre el díalogo al hacer click sobre select video
fileBtn.addEventListener("click", () => {
    if (!evaluatorName || evaluatorName.trim() === "") {
        popup.classList.remove("hidden");
        evaluatorInput.focus();
        content.classList.add("disabled");
    }
    else {
        videoFileInput.click();
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
        videoFileInput.click();
        content.classList.remove("disabled");
    }
    else {
        alert("Evaluator name is required to proceed.");
    }
}

// Al seleccionar un archivo de video, se muestra su nombre y se carga el video
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

videoPlayer.addEventListener("loadedmetadata", () => { //Mejora muchísimo la resolución de la imagen del frame
    framePlaceholder.width = videoPlayer.videoWidth;
    framePlaceholder.height = videoPlayer.videoHeight;
});

videoPlayer.addEventListener("pause", () => {
    pausado = true;
    drawFrame();
});

videoPlayer.addEventListener("play", () => {
    pausado = false;
});

prevFrameBtn.addEventListener("click", () => {
    videoPlayer.pause();
    pausado = true;
    videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - (1/30)); //Si 30 fps
});

nextFrameBtn.addEventListener("click", () => {
    videoPlayer.pause();
    pausado = true;
    videoPlayer.currentTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + (1/30));
});

function drawFrame() {
    if (pausado && !aceptado) {
        ctx.drawImage(videoPlayer, 0, 0);
        savedFrame = ctx.getImageData(0, 0, framePlaceholder.width, framePlaceholder.height);

    }
    acceptFrameBtn.disabled = false; //Habilita el botón de aceptar frame solo si ya hay uno mostrandose
    requestAnimationFrame(drawFrame); //Hace un loop mientras pausado siga siendo true, permite que se actualice el frame
}



/*Aceptar frame:
- Al hacer click en "Accept frame", se muestra el sidebar.
- No se puede modificar la seleccion del frame al mover el video:
    - a menos que se complete el formulario del sidebar y
    - se haya enviado el formulario
- Se activa el sidebar hasta que se envíe el formulario.
- Se guarda el frame y la información del investigador.
*/
/*-------------------------ACEPTAR EL FRAME-------------------------*/
acceptFrameBtn.addEventListener("click", () => {
    aceptado = true;
    videoPlayer.style.controls = false;
    videoPlayer.pause();
    sidebar.classList.remove("hidden");
    acceptFrameBtn.textContent = "Submit";
    fileBtn.disabled = true;
    fileBtn.classList.add("disabled");
    acceptFrameBtn.classList.add("disabled");
    //Si ya se ha aceptado el frame, no quiero que cambie el frame al mover el video. A menos que se haya finalizado el form de aside (if form terminado y submitted true, aceptado = false).
    
    //Funciones para guardar el frame y la información del investigador:




});


/*Sidebar:
- Selección de calidad (verde, amarillo, rojo).
- Al seleccionar una zona, se muestran las estructuras correspondientes.
- Al seleccionar una estructura, se activa el brush correspondiente, permitiendo dibujar.
- El tamaño del brush se puede ajustar con un slider.
- Cada estructura tiene un botón para borrar el trazo correspondiente.
- Cuando se ha completado el formulario, se puede enviar.
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
    drawing = true;
    trazoActual = {color: colors[currentIndex], width: widths[currentIndex], puntos: []};
    draw(e);
}
function stopDrawing() {
    if(trazoActual) {
        trazos.push(trazoActual);
        trazoActual = null;
    }
    if (aceptado){
        validar();
    }
    drawing = false;
    ctx.beginPath();
}

function draw(e) {
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
function validar() {
    activeStructures = document.querySelectorAll(`.${selectedZone}-structure-item`);
    const activeColors = Array.from(activeStructures).map(s => s.querySelector('.structure-name').style.color);
    const allColorsDrawn = activeColors.every(color => 
        trazos.some(trazo => trazo.color === color && trazo.puntos.length > 0)
    );
    if (allColorsDrawn) {
        acceptFrameBtn.disabled = false;
        acceptFrameBtn.classList.remove("disabled");
    }
    else{
        acceptFrameBtn.disabled = true;
        acceptFrameBtn.classList.add("disabled");
        submitted = false;
    }
}

acceptFrameBtn.addEventListener("click", () => {
    if (aceptado && !submitted) {
        saveDrawing();
    }
});

