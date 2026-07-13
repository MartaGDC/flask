const body = document.body;
const content = document.querySelector(".content");

const reloadBtn = document.getElementById("reloadBtn");

const fileBtn = document.getElementById("fileBtn");
const fileName = document.getElementById("fileName");
let appName = "";
let nbFile = "";
let evaluatorName = "";
let unanalysedImages = [];

const framePlaceholder = document.getElementById("frame-placeholder");
const ctx = framePlaceholder.getContext("2d");
let savedFrame = null;

const researcherInfo = document.getElementById("researcherInfo");
/*let startTime = 0;
let elapsedTime = 0;
let running=true;*/
const submitBtn = document.getElementById("submitBtn");
let aceptado = false; //si false es porque no hay imagenes y no se puede dibujar
const sidebar = document.getElementById("sidebar");
const blocks = document.querySelectorAll(".block");

const zones = document.querySelectorAll('input[name="zone"]');
let selectedZone = zones[0].value;
const structures = document.querySelectorAll(".structure-item");
let selectedStructure = null;
let currentIndex = null;
const sliders = document.querySelectorAll('.brush-slider');
const  widths = Array.from(document.querySelectorAll(".brush-slider")).map(slider => parseInt(slider.value));
const colors = Array.from(document.querySelectorAll(".structure-item")).map(div => div.dataset.color);
const deleteDrawings = document.querySelectorAll(".delete");
let invisibleStructures = {};
const invisible = document.querySelectorAll(".invisible");
let drawing = false;
let trazos = [];
let trazoActual = null;


/*Botones reload y home:

*/
/*-------------------------BOTONES LOGOUT Y HOME-------------------------*/
reloadBtn.addEventListener("click", () => {
    location.reload();
})

/*Comenzar:
- Se muestra el nombre de la primera imagen no evaluada.
- Se carga la imagen.
*/
/*-------------------------COMENZAR-------------------------*/
//Se abre el díalogo al hacer click sobre select video
document.addEventListener("DOMContentLoaded", () =>{
    appName = body.dataset.appname;
    evaluatorName = researcherInfo.dataset.user;
    qualityGreen.classList.add("hidden");
    qualityYellow.classList.add("hidden");
    qualityRed.classList.add("hidden");
    qualityBlack.classList.add("hidden");
    invisible.forEach((invisibleBtn, _) => {
        invisibleBtn.classList.remove("active");
        invisibleBtn.classList.add("hidden");
    });
    //framePlaceholder.style.height="67vh"
    if (sessionStorage.getItem('reload')) {
        sessionStorage.removeItem('reload');
        getImage();
        sidebar.classList.remove("hidden");
        submitBtn.classList.remove("hidden");
        submitBtn.disabled = true;
        submitBtn.classList.add("disabled");
        content.style.marginRight = "21vw";
        fileBtn.disabled = true;
        fileBtn.classList.add("disabled");
        researcherInfo.classList.remove("hidden");

    }

});

fileBtn.textContent = "Start";
fileName.textContent = "No image shown.";
fileBtn.addEventListener("click", () => {
    getImage();
    sidebar.classList.remove("hidden");
    submitBtn.classList.remove("hidden");
    submitBtn.disabled = true;
    submitBtn.classList.add("disabled");
    content.style.marginRight = "21vw";
    fileBtn.disabled = true;
    fileBtn.classList.add("disabled");
    researcherInfo.classList.remove("hidden");
    /*startTime = Date.now();
    timerInterval = setInterval(updateTimer, 100);*/
});

/*function updateTimer() {
    if (!running) return;
    const now = Date.now();
    const diff = elapsedTime + (now - startTime);
    const seconds = (diff / 1000).toFixed(1);
    researcherInfo.textContent = `${seconds} seg`;
    researcherInfo.style.fontSize = "1.1vw";

    requestAnimationFrame(updateTimer);
}*/


async function getImage(){
    const res = await fetch(`/select/${appName}`);
    if (!res.ok) {
        alert("Error loading list of images");
        return;
    }
    const images = await res.json(); //Listado de imagenes disponibles
    try {
        const resp = await fetch(`/unanalysed-images/${appName}/${evaluatorName}`);
        if (resp.ok) { 
            unanalysedImages = await resp.json();
        }
        else { //No hay imagenes evaluadas
            unanalysedImages = images;
        }
    } catch(e){
        unanalysedImages = images;
    }

    if (unanalysedImages.length === 0){
        fileName.textContent = "Analaysis finished.";
        fileBtn.disabled = true;
        fileBtn.classList.add("disabled");
        researcherInfo.textContent = "";
        researcherInfo.classList.add("hidden");
        running=false;
    }
    else{
        aceptado = true;
        fileName.textContent = unanalysedImages[0];
        const imageURL = `/media/${unanalysedImages[0]}`;
        const img = new Image();
        img.src = imageURL;
        img.onload = function() {
            framePlaceholder.width = img.width;
            framePlaceholder.height = img.height;
            ctx.drawImage(img, 0, 0, framePlaceholder.width, framePlaceholder.height);
            savedFrame = ctx.getImageData(0, 0, framePlaceholder.width, framePlaceholder.height);
            /*startTime = Date.now();
            timerInterval = setInterval(updateTimer, 100);*/
        };
    }
    
};


/*Sidebar:
- Al seleccionar una estructura, se activa el brush correspondiente, permitiendo dibujar.
- El tamaño del brush se puede ajustar con un slider.
- Cada estructura tiene un botón para borrar el trazo correspondiente.
- Cuando se ha completado el formulario, se puede enviar.
*/
/*-------------------------SIDEBAR-------------------------*/
//Al seleccionar una zona, se muestran las estructuras correspondientes. Si no hay una zona seleccionada, se selecciona la primera por defecto.
function showStructures(selectedZone){
    activeStructures = document.querySelectorAll(`.${selectedZone}-structure-item`);
    activeStructures.forEach(structure => {
        structure.classList.remove("hidden");
        structure.classList.add("transparent");
        //structure.style.marginTop = "25vh"; //Necesario para supraespinoso porque había solo un pincel
        //structure.style.paddingBottom = "0vw"; //Necesario para supraespinoso porque había solo un pincel
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
}); //Esto no era necesario para Supraespinoso porque solo había una zona


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
    if(aceptado) {
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
//Borrar todos los trazos si se selecciona otra zona. Este funcion es innecesaria para supraespinoso
function clearDrawing() {
    ctx.clearRect(0, 0, framePlaceholder.width, framePlaceholder.height);
    if(savedFrame){
        ctx.putImageData(savedFrame, 0, 0);
    }
    trazos = [];
    validar();
}

//Formulario completado, validar y enviar (frame editado, filename, evaluator)
function validar() {
    //const allColorsDrawn = trazos.some(trazo => trazo.color === colors[0] && trazo.puntos.length > 0); //para supraespinoso porque solo hbaia un color
    allColorsDrawn=true; //Se han definido varias estructuras, dejar por ahora sin esta validación que obliga a dibujarlo todo
    if (allColorsDrawn) {
        submitBtn.disabled = false;
        submitBtn.classList.remove("disabled");
    }
    else {
        submitBtn.disabled = true;
        submitBtn.classList.add("disabled");
    }
}

submitBtn.addEventListener("click", () => { saveDrawing(); });

function saveDrawing(){
    submitBtn.disabled = true;

    /*running = false;
    elapsedTime += Date.now() - startTime;
    const seconds = (elapsedTime / 1000).toFixed(2);*/

    let objectJS = [];
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');

    const maskEditedCanvas = document.createElement('canvas');
    const maskEditedCtx = maskEditedCanvas.getContext('2d');
    maskEditedCanvas.width = framePlaceholder.width;
    maskEditedCanvas.height = framePlaceholder.height;
    maskEditedCtx.drawImage(framePlaceholder, 0, 0);
    const imageEditedURL = maskEditedCanvas.toDataURL();

    objectJS = {
        image: fileName.textContent, 
        imageEdited: imageEditedURL,
        filesaved: `rm_${evaluatorName}_${timestamp}.png`,
        zone: selectedZone,
        evaluator: evaluatorName
        /*time: parseFloat(seconds)*/
    };

    fetch('/saveRM', {
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
        recargarImagen();
    })
    .catch(error => {
        console.error('Error saving drawing:', error);
        alert('An error occurred while saving. Please try again.');
    });
}

function recargarImagen(){
    // Guardar datos para usar después de la recarga: nombre de la imagen evaluada
    sessionStorage.setItem('reload', true);
    location.reload();
}