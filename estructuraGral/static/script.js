const acceptBtn = document.getElementById("acceptFrameBtn");
const sidebar = document.getElementById("sidebar");

acceptBtn.addEventListener("click", () => {
    sidebar.classList.remove("hidden");
});