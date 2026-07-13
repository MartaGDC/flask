const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
let evaluatorName = ""; // Initialize evaluatorName as a global variable
let drawing = false;
let imagePaths = [];
let currentImageIndex = 0;
let drawingData = [];
let widths = [10,10,10,20];
let colors = ['cyan', 'magenta','magenta', 'yellow'];
let currentColorIndex = 0;
let drawingCount = 0;
let selectedQuality = "fair";

const img = document.getElementById('sourceImage');
const getRandomSampleButton = document.getElementById('getRandomSample');
const startLoadingButton = document.getElementById('startLoading');
const saveDrawingButton = document.getElementById('saveDrawing');
const clearDrawingButton = document.getElementById('clearDrawing'); // New button

img.onload = function() {
    canvas.width = 710;
    canvas.height = 410;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
};

getRandomSampleButton.addEventListener('click', getRandomSample);
startLoadingButton.addEventListener('click', startLoading);
saveDrawingButton.addEventListener('click', saveDrawing);
clearDrawingButton.addEventListener('click', clearDrawing); // New event listener

// Disable buttons initially
startLoadingButton.disabled = true;
saveDrawingButton.disabled = true;
clearDrawingButton.disabled = true;

function getRandomSample() {
    // Prompt the user for the evaluator's name
    evaluatorName = prompt("Please enter the evaluator's name:");

    if (evaluatorName) {
        // Proceed with fetching images if a name is provided
        fetch('/images')
            .then(response => response.json())
            .then(files => {
                const sampleSize = 10;
                const randomIndices = [];

                while (randomIndices.length < sampleSize) {
                    const randomIndex = Math.floor(Math.random() * files.length);
                    if (!randomIndices.includes(randomIndex)) {
                        randomIndices.push(randomIndex);
                    }
                }

                imagePaths = randomIndices.map(index => `static/echographies/${files[index]}`);
                startLoadingButton.disabled = false;
                getRandomSampleButton.disabled = true;
                alert('✅ Random sample of 10 images selected!');
            })
            .catch(error => console.error('Error fetching images:', error));
    } else {
        alert('Evaluator name is required to proceed.');
    }
}

function startLoading() {
    if (imagePaths.length > 0) {
        loadNextImage();
        document.getElementById('saveDrawing').disabled = false;
        clearDrawingButton.disabled = false; // Enable the clear button
        currentColorIndex = 0;
        startLoadingButton.textContent = `Image 1/${imagePaths.length}`; // Initialize the button text with the first image count
        getRandomSampleButton.disabled = true; // Optionally disable the button
        startLoadingButton.disabled = true; // Optionally disable the button
    }
}

function loadNextImage() {
    if (currentImageIndex < imagePaths.length) {
        img.src = imagePaths[currentImageIndex];
        startLoadingButton.textContent = `Image ${currentImageIndex + 1}/${imagePaths.length}`; // Update the button text with the current image count
        currentImageIndex++;

        const qualityButtons = document.querySelectorAll('.quality-button');
        qualityButtons.forEach(button => button.classList.remove('active'));

        selectedQuality = "null"; // Set selectedQuality to null initially

        // Reset the opacity of the right menu
        const rightMenu = document.getElementById('rightMenu');
        rightMenu.style.opacity = '1'; // Reset opacity to fully visible
        // Enable all inputs and buttons in the right menu
        const inputs = rightMenu.querySelectorAll('input, button');
        inputs.forEach(input => {
            input.disabled = false; // Enable all inputs and buttons
        });

    } else {
        alert('All images loaded!');
        startLoadingButton.textContent = "Start"; // Reset the button text
        getRandomSampleButton.disabled = false; // Optionally enable the button
        //Reload the page to start again
        window.location.reload();
    }
}
function saveDrawing() {

    if (selectedQuality === "null") {
        alert('Please select a quality (Good, Fair, or Bad) before saving.');
        return; // Exit the function if no quality is selected
    }

    const form = document.getElementById('questionnaire');
    const formData = new FormData(form);

    console.log(`Saving with quality: ${selectedQuality}`); // Debugging log 

    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d');
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;

    // Draw the mask (drawing) on the new canvas
    maskCtx.drawImage(canvas, 0, 0);

    // Convert the mask canvas to a data URL
    const dataURL = maskCanvas.toDataURL();
    const timestamp = new Date().toISOString().replace(/[:.-]/g, ''); // Generate a timestamp

    // Log the data being sent
    console.log('Data being sent:', {
        image: dataURL,
        filename: `${timestamp}.png`,
        originalImage: imagePaths[currentImageIndex - 1],
        evName: evaluatorName,
        imgQuality: selectedQuality
    });

    fetch('/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
            image: dataURL, 
            filename: `${timestamp}.png`, // Use the timestamp in the filename
            originalImage: imagePaths[currentImageIndex - 1], // Include the original image filename
            evName: evaluatorName, // Evaluators name
            imgQuality: selectedQuality
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Drawing saved successfully:', data); // Debugging log
        loadNextImage(); // Load the next image
        drawingCount++;
        resetQuestionnaire(); // Reset the questionnaire after saving
    })
    .catch(error => {
        console.error('Error saving drawing:', error);
        alert('An error occurred while saving. Please try again.');
    });

    currentColorIndex = 0; // Reset the color index
}

function clearDrawing() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height); // Redraw the current image
    currentColorIndex = 0; // Reset the color index
}

canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

canvas.addEventListener('touchstart', startDrawing);
canvas.addEventListener('touchmove', draw);
canvas.addEventListener('touchend', stopDrawing);
canvas.addEventListener('touchcancel', stopDrawing);

document.addEventListener('DOMContentLoaded', () => {
    const qualityButtons = document.querySelectorAll('.quality-button');

    qualityButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons
            qualityButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to the clicked button
            button.classList.add('active');
            
            // Update the selected quality
            selectedQuality = button.innerText.toLowerCase(); // Ensure it matches "good", "fair", or "bad"
            console.log(`Selected Quality: ${selectedQuality}`); // 
        });
    });
});


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

function startDrawing(e) {
    drawing = true;
    draw(e);
}

function draw(e) {
    if (!drawing) return;
    e.preventDefault(); // Prevent scrolling when drawing

    ctx.lineWidth = widths[currentColorIndex];
    ctx.lineCap = 'round';
    ctx.strokeStyle = colors[currentColorIndex];

    let pos;
    if (e.type.includes('mouse')) {
        pos = getMousePos(canvas, e);
    } else {
        pos = getTouchPos(canvas, e);
    }

    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);

    drawingData.push({ x: pos.x, y: pos.y });
}

function stopDrawing() {
    drawing = false;
    ctx.beginPath();
    currentColorIndex = (currentColorIndex + 1) % colors.length; // Cycle to the next color
}

document.addEventListener('DOMContentLoaded', function() {
    const questionnaire = document.getElementById('questionnaire');
    
    questionnaire.addEventListener('change', function(e) {
        if (e.target.type === 'radio') {
            // Remove 'selected' class from all labels in this question group
            const labels = e.target.closest('.options').querySelectorAll('label');
            labels.forEach(label => label.classList.remove('selected'));
            
            // Add 'selected' class to the label of the checked radio button
            e.target.closest('label').classList.add('selected');
        }
    });
});

function resetQuestionnaire() {
    const form = document.getElementById('questionnaire');
    form.reset(); // This resets all form inputs to their default state

    // Remove 'selected' class from all labels
    const labels = form.querySelectorAll('.options label');
    labels.forEach(label => label.classList.remove('selected'));
}

// Add this new code to handle the sliders:
document.addEventListener('DOMContentLoaded', function() {
    const cyanSlider = document.getElementById('cyanWidth');
    const magentaSlider = document.getElementById('magentaWidth');
    const yellowSlider = document.getElementById('yellowWidth');

    const cyanValue = document.getElementById('cyanWidthValue');
    const magentaValue = document.getElementById('magentaWidthValue');
    const yellowValue = document.getElementById('yellowWidthValue');

    function updateWidth(index, value) {
        widths[index] = parseInt(value);
        document.getElementById(`${colors[index]}WidthValue`).textContent = value;
    }

    cyanSlider.addEventListener('input', () => {
        updateWidth(0, cyanSlider.value);
        clearDrawing(); // Clear the drawing when the width is changed
    });
    
    magentaSlider.addEventListener('input', () => {
        updateWidth(1, magentaSlider.value);
        clearDrawing(); // Clear the drawing when the width is changed
    });
    
    magentaSlider.addEventListener('input', () => {
        updateWidth(2, magentaSlider.value);
        clearDrawing(); // Clear the drawing when the width is changed
    });
    
    yellowSlider.addEventListener('input', () => {
        updateWidth(3, yellowSlider.value);
        clearDrawing(); // Clear the drawing when the width is changed
    });

    document.getElementById('qualityGreen').addEventListener('click', enableRightMenu);
    document.getElementById('qualityYellow').addEventListener('click', enableRightMenu);

});

document.getElementById('qualityRed').addEventListener('click', () => {
    // Disable all inputs and buttons in the right menu except for quality buttons and the "Save" button
    const rightMenu = document.getElementById('rightMenu');
    const inputs = rightMenu.querySelectorAll('input, button');
    
    inputs.forEach(input => {
        if (!input.classList.contains('quality-button') && input.id !== 'saveDrawing') {
            input.disabled = true;
        }
    });

    // Ensure the "Save" button is enabled
    document.getElementById('saveDrawing').disabled = false;
    clearDrawing(); // Clear the drawing when the width is changed

    // Optionally, you can also visually indicate that the menu is partially disabled
    rightMenu.style.opacity = '0.8'; // Adjust opacity to indicate partial disablement
});

function enableRightMenu() {
    const rightMenu = document.getElementById('rightMenu');
    const inputs = rightMenu.querySelectorAll('input, button');
    
    inputs.forEach(input => {
        input.disabled = false; // Enable all inputs and buttons
    });

    // Reset the opacity to indicate the menu is fully enabled
    rightMenu.style.opacity = '1';
}
