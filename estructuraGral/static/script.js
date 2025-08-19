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
let pausado = false;

const researcherInfo = document.getElementById("researcherInfo");

const acceptFrameBtn = document.getElementById("acceptFrameBtn");
let aceptado = false;

const sidebar = document.getElementById("sidebar");

const qualityButtons = document.getElementById("qualityButtons");
const qualityGreen = document.getElementById("qualityGreen");
const qualityYellow = document.getElementById("qualityYellow");
const qualityRed = document.getElementById("qualityRed");

const structure1 = document.getElementById("structure1");
const structure1Brush = document.getElementById("structure1 brush");
const structure2 = document.getElementById("structure2");
const structure2Brush = document.getElementById("structure2 brush");
const structure3 = document.getElementById("structure3");
const structure3Brush = document.getElementById("structure3 brush");
const structure4 = document.getElementById("structure4");
const structure4Brush = document.getElementById("structure4 brush");


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
    }
    else {
        videoFileInput.click();
    }
});
evaluatorSubmit.addEventListener("click", () => {
    evaluatorName = evaluatorInput.value.trim();
    if (evaluatorName !== "") {
        popup.classList.add("hidden");
        videoFileInput.click();
    }
    else {
        alert("Please enter a valid evaluator name.");
    }
});
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
    - a menos que se complete el formulario del sidebar o
    - se haga click de nuevo en "Accept frame".
- Se pueden seleccionar las estructuras y la calidad del frame.
- Se guarda el frame y la información del investigador.
- El sidebar permanece visible hasta que se complete el formulario.
*/
/*-------------------------ACEPTAR EL FRAME-------------------------*/
acceptFrameBtn.addEventListener("click", () => {
    aceptado = true;
    videoPlayer.style.controls = false;
    videoPlayer.pause();
    videoContainer.style.display = "none";
    sidebar.classList.remove("hidden");
    acceptFrameBtn.textContent = "Submit";
    //Si ya se ha aceptado el frame, no quiero que cambie el frame al mover el video. A menos que se haya finalizado el form de aside o in hacer click en aceptar frame
    
    //Funciones para guardar el frame y la información del investigador:
});
