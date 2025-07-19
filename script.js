const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const cardOverlay = document.getElementById("cardOverlay");
const toggleCardBtn = document.getElementById("toggleCardBtn");

let regionsData = [];
let regionIndex = 0;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

let isCardVisible = false;

toggleCardBtn.addEventListener("click", () => {
  if (isCardVisible) {
    cardOverlay.classList.remove("show");
    toggleCardBtn.textContent = "Ver Mensaje";
  } else {
    cardOverlay.classList.add("show");
    toggleCardBtn.textContent = "Ocultar Mensaje";
  }
  isCardVisible = !isCardVisible;

  if (backgroundAudio.paused) {
    backgroundAudio.play().catch((error) => {
      console.log(
        "Error al intentar reproducir el audio automáticamente:",
        error
      );
    });
  }
});

let minX, maxX, minY, maxY, dataWidth, dataHeight;

function getScale() {
  const size = Math.min(canvas.width, canvas.height);
  return (size * 0.9) / Math.max(dataWidth, dataHeight);
}

function drawRegion(region, scale, offsetX, offsetY) {
  const color = region.color
    .map((c) => (c <= 1 ? c * 255 : c))
    .map((v) => Math.min(255, v));
  ctx.fillStyle = `rgb(${color.map((v) => Math.floor(v)).join(",")})`;

  ctx.beginPath();
  region.contour.forEach(([x, y], i) => {
    const drawX = (x - (minX + dataWidth / 2)) * scale + offsetX;
    const drawY = (y - (minY + dataHeight / 2)) * scale + offsetY;
    if (i === 0) ctx.moveTo(drawX, drawY);
    else ctx.lineTo(drawX, drawY);
  });
  ctx.closePath();
  ctx.fill();
}

function animateConstruction() {
  const scale = getScale();
  const offsetX = canvas.width / 2;
  const offsetY = canvas.height / 2;

  if (regionIndex < regionsData.length) {
    drawRegion(regionsData[regionIndex], scale, offsetX, offsetY);
    regionIndex++;
    requestAnimationFrame(animateConstruction);
  }
}

fetch("rosas_filtered.json")
  .then((res) => res.json())
  .then((regions) => {
    regionsData = regions;

    const allPoints = regionsData.flatMap((r) => r.contour);
    const xs = allPoints.map((p) => p[0]);
    const ys = allPoints.map((p) => p[1]);

    minX = Math.min(...xs);
    maxX = Math.max(...xs);
    minY = Math.min(...ys);
    maxY = Math.max(...ys);

    dataWidth = maxX - minX;
    dataHeight = maxY - minY;

    animateConstruction();
  })
  .catch((error) => {
    console.error("Error al cargar o procesar el JSON:", error);
  });
