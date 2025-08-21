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
const ctx = framePlaceholder.getContext("2d");
let pausado = false; //mostrar el frame solo si está pausado

const researcherInfo = document.getElementById("researcherInfo");

const acceptFrameBtn = document.getElementById("acceptFrameBtn");
let aceptado = false; //frame aceptado, para no modificarlo hasta terminar el formulario
let subbitted = false; //formulario del frame aceptado

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


/*Realización del formulario:
- Al seleccionar una zona, se muestran las estructuras correspondientes.
- Al seleccionar una estructura, se activa el brush correspondiente.
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
        structures.forEach(structure => {
            structure.classList.add("hidden");
        });
        selectedZone = event.target.value;
        showStructures(selectedZone);
    });
});

//Al seleccionar una estructura, se activa la misma y se accede al brush correspondiente.


framePlaceholder.addEventListener('mousedown', startDrawing);
framePlaceholder.addEventListener('mousemove', draw);
framePlaceholder.addEventListener('mouseup', stopDrawing);
framePlaceholder.addEventListener('mouseleave', stopDrawing);
framePlaceholder.addEventListener('touchstart', startDrawing);
framePlaceholder.addEventListener('touchmove', draw);
framePlaceholder.addEventListener('touchend', stopDrawing);
framePlaceholder.addEventListener('touchcancel', stopDrawing);

