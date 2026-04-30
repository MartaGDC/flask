const cuerpo = document.getElementById("cuerpo");
const buttonContainer = document.getElementById("buttonContainer");
const btnEco = document.getElementById("btnEco");
const btnFisio = document.getElementById("btnFisio");
const btnSimFisio = document.getElementById("btnSimFisio");
const btnSimPatol = document.getElementById("btnSimPatol");

const contentSimFisio = document.getElementById("contentSimFisio");
const zonasCuerpo = document.getElementById("zonasCuerpo");
const windowZona = document.querySelector(".windowZona");
const btnAddZona = document.getElementById("btnAddZona");
let zonaSeleccionada = "";

const cortesDisponibles = document.getElementById("cortesDisponibles");
const btnAceptarNuevaZona = document.getElementById("btnAceptarNuevaZona");
const btnCancelarNuevaZona = document.getElementById("btnCancelarNuevaZona");
let corteSeleccionado="";

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


//------------------SIMULACION FISIO------------------
document.addEventListener("click", function (e) {
    if (!windowZona.contains(e.target)) {
        windowZona.classList.add("hidden");
        const btnAddZona = document.getElementById("btnAddZona");
        if (btnAddZona) {
            btnAddZona.classList.remove("active");
        }
    }
});


btnSimFisio.onclick = async () => {
    selectOption('simfisio');
    const resZonas = await fetch("/api/zonas");
    if (!resZonas.ok) {
        alert("Error loading list of videos");
        return;
    }
    const zonas = await resZonas.json();
    zonasCuerpo.innerHTML = ""; //Limpia si ya se habia rellenado en la ejecucion (tambien elimina el boton de añadir)
    zonas.forEach(zona => {
        const divZona = document.createElement("div");
        divZona.textContent = zona;

    //SELECCION ZONA
        divZona.onClick = () => {
            zonaSeleccionada = zona;
        }
        zonasCuerpo.appendChild(divZona);
    });

    //Añadir botón "Añadir". CREACION ZONA
    const btnAddZona = document.createElement("button");
    btnAddZona.id = "btnAddZona";
    btnAddZona.textContent = "Añadir";
    btnAddZona.addEventListener('click', async (event) => {
        const resCortes = await fetch('/api/cortes');
        if (!resCortes.ok) {
            alert("Error loading list of videos");
            return;
        }
        const cortes = await resCortes.json();
        cortesDisponibles.innerHTML=""; //También limpia el checkbox "Otro:"
        cortes.forEach(corte => {
            const labelCorte = document.createElement('label');
            const inputCorte = document.createElement('input');
            inputCorte.type = "checkbox";
            inputCorte.value = corte;
            labelCorte.appendChild(inputCorte);
            labelCorte.append(" " + corte);
            cortesDisponibles.appendChild(labelCorte);
        });
        const otroCorteLabel = document.createElement("div");
        const otroCorteInput = document.createElement("input");
        otroCorteInput.type = "text";
        otroCorteLabel.textContent= "Otro: ";
        otroCorteLabel.appendChild(otroCorteInput);
        cortesDisponibles.appendChild(otroCorteLabel);
        btnAddZona.classList.add("active");
        windowZona.classList.remove("hidden");
    })
    zonasCuerpo.appendChild(btnAddZona);
}

btnAceptarNuevaZona.addEventListener('click', () => {
    
});

btnCancelarNuevaZona.addEventListener('click', () => {
    windowZona.classList.add("hidden");
    const btnAddZona = document.getElementById("btnAddZona");
    if (btnAddZona) {
        btnAddZona.classList.remove("active");
    }
});




//------------------POSTGRESQL------------------
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




