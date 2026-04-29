const cuerpo = document.getElementById("cuerpo");
const buttonContainer = document.getElementById("buttonContainer");
const btnEco = document.getElementById("btnEco");
const btnFisio = document.getElementById("btnFisio");
const btnSimFisio = document.getElementById("btnSimFisio");
const btnSimPatol = document.getElementById("btnSimPatol");

const contentSimFisio = document.getElementById("contentSimFisio");
const zonasCuerpo = document.querySelectorAll(".zonasBody");
const windowZona = document.querySelector(".windowZona");
const btnAddZona = document.getElementById("btnAddZona");
let zonaSeleccionada = "";

//Seleccion apartado
function selectOption(option) {
    if (option === 'simfisio') {
        buttonContainer.style.display = "none";
        cuerpo.style.display = "flex";
        cuerpo.style.flexDirection = "column";
        cuerpo.style.justifyContent = "start";
        cuerpo.style.alignItems = "start";
        contentSimFisio.style.display = "block";
    }
}
btnSimFisio.onclick = async () => {
    selectOption('simfisio');
    const res = await fetch("/api/zonas");
    if (!res.ok) {
        alert("Error loading list of videos");
        return;
    }
    zonasCuerpo.innerHTML = "";
    const zonas = await res.json();
}


//Seleccion y creación zona
zonasCuerpo.forEach(botonZona => {
    botonZona.addEventListener('click', (event) => {
        zonaSeleccionada = botonZona.textContent;
    });
});

btnAddZona.addEventListener('click', (event) => {
    console.log(windowZona);
    windowZona.classList.remove("hidden");
})


function createZone(zona) {
    fetch('/crearZona', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(zona)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}




