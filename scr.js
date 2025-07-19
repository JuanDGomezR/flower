const canvas = document.getElementById("drawingCanvas");
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
});

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("drawingCanvas");
  const ctx = canvas.getContext("2d");

  let regionsData = [];
  let originalRegionsData = [];
  let currentRegionIndex = 0;
  let animationFrameId;
  let scale, centerX, centerY;
  let minX, maxX, minY, maxY;

  const animationDelay = 50;

  const regionsPerFrame = 3;
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    if (originalRegionsData.length > 0) {
      regionsData = [...originalRegionsData];
      calculateDrawingMetrics();
      currentRegionIndex = 0;
      cancelAnimationFrame(animationFrameId);
      animateDrawing();
    } else {
      drawFromJSON("rosas.json");
    }
  }
  function calculateDrawingMetrics() {
    if (originalRegionsData.length === 0) {
      console.warn("No hay datos para calcular métricas de dibujo.");
      minX = maxX = minY = maxY = 0;
      scale = 1;
      centerX = 0;
      centerY = 0;
      return;
    }

    let allPoints = [];
    originalRegionsData.forEach((region) => {
      region.contour.forEach((point) => {
        allPoints.push({ x: point[0], y: point[1] });
      });
    });

    if (allPoints.length === 0) {
      minX = maxX = minY = maxY = 0;
      scale = 1;
      centerX = 0;
      centerY = 0;
      return;
    }

    minX = Math.min(...allPoints.map((p) => p.x));
    maxX = Math.max(...allPoints.map((p) => p.x));
    minY = Math.min(...allPoints.map((p) => p.y));
    maxY = Math.max(...allPoints.map((p) => p.y));

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const effectiveContentWidth = contentWidth === 0 ? 1 : contentWidth;
    const effectiveContentHeight = contentHeight === 0 ? 1 : contentHeight;

    const scaleX = (canvas.width * 0.95) / effectiveContentWidth;
    const scaleY = (canvas.height * 0.95) / effectiveContentHeight;
    scale = Math.min(scaleX, scaleY);

    centerX = (minX + maxX) / 2;
    centerY = (minY + maxY) / 2;
  }

  async function drawFromJSON(jsonFile) {
    try {
      const response = await fetch(jsonFile);
      if (!response.ok) {
        console.error(
          `Error HTTP! estado: ${response.status}. Asegúrate de que 'rosas.json' existe y el servidor local está corriendo.`
        );
        return;
      }
      originalRegionsData = await response.json();
      regionsData = [...originalRegionsData];

      if (regionsData.length === 0) {
        console.warn(
          "No se encontraron puntos en los datos JSON. Revisa la estructura del archivo 'rosas.json'."
        );
        return;
      }

      calculateDrawingMetrics();

      currentRegionIndex = 0;
      cancelAnimationFrame(animationFrameId);
      animateDrawing();
    } catch (error) {
      console.error("Error al cargar o analizar el JSON:", error);
    }
  }

  function animateDrawing() {
    if (regionsData.length === 0 || scale === undefined) {
      console.warn(
        "Datos o métricas de dibujo no listos para la animación, reintentando..."
      );
      animationFrameId = setTimeout(
        () => requestAnimationFrame(animateDrawing),
        100
      );
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    const endRegionIndex = Math.min(
      currentRegionIndex + regionsPerFrame,
      regionsData.length
    );

    for (let i = 0; i < endRegionIndex; i++) {
      const region = regionsData[i];
      const color = `rgb(${region.color[0]}, ${region.color[1]}, ${region.color[2]})`;
      ctx.fillStyle = color;
      ctx.strokeStyle = color;

      const points = region.contour;
      if (points.length < 1) {
        continue;
      }

      ctx.beginPath();

      let xCanvas = (points[0][0] - centerX) * scale + canvas.width / 2;
      let yCanvas = (points[0][1] - centerY) * scale + canvas.height / 2;

      ctx.moveTo(xCanvas, yCanvas);

      for (let j = 1; j < points.length; j++) {
        xCanvas = (points[j][0] - centerX) * scale + canvas.width / 2;
        yCanvas = (points[j][1] - centerY) * scale + canvas.height / 2;
        ctx.lineTo(xCanvas, yCanvas);
      }

      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();

    if (endRegionIndex < regionsData.length) {
      currentRegionIndex = endRegionIndex;
      animationFrameId = setTimeout(
        () => requestAnimationFrame(animateDrawing),
        animationDelay
      );
    } else {
      cancelAnimationFrame(animationFrameId);
      console.log("Animación completada.");
    }
  }

  resizeCanvas();
});
