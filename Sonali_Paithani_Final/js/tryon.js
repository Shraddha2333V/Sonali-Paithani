/**
 * SONALI PAITHANI — "See it on you" demo
 * -------------------------------------------------------------
 * PROTOTYPE NOTE: real garment-transfer AI (photo-realistic
 * virtual try-on) needs a trained model or a paid API and is out
 * of scope for a static prototype. This module ships a working,
 * honest stand-in so the client can see and click through the
 * intended UX today:
 *   1) Customer uploads a photo.
 *   2) We draw it to a canvas and lay a translucent saree-colour
 *      drape shape over the torso area, labelled "AI Preview (Demo)".
 *
 * To upgrade to real AI try-on later, replace `renderOverlay()`
 * with a call to a virtual try-on API (send the uploaded photo +
 * a product image, receive a composited image back) — the
 * upload UI and canvas plumbing below can stay as-is.
 * -------------------------------------------------------------
 */

(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.querySelector("#tryon-file");
    const canvasWrap = document.querySelector(".tryon-canvas-wrap");
    const generateBtn = document.querySelector("#tryon-generate");
    const swatchSelect = document.querySelector("#tryon-saree-select");
    if (!fileInput || !canvasWrap) return;

    let uploadedImage = null;
    let canvas = null;

    // Populate saree picker from catalog
    if (swatchSelect && typeof SAREES !== "undefined") {
      swatchSelect.innerHTML = SAREES.map((s) => `<option value="${s.id}">${s.name}</option>`).join("");
    }

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        uploadedImage = new Image();
        uploadedImage.onload = () => {
          canvasWrap.innerHTML = "";
          canvas = document.createElement("canvas");
          canvas.width = 600;
          canvas.height = 800;
          canvasWrap.appendChild(canvas);
          drawBase();
          if (generateBtn) generateBtn.disabled = false;
        };
        uploadedImage.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });

    function drawBase() {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // cover-fit the uploaded photo
      const scale = Math.max(canvas.width / uploadedImage.width, canvas.height / uploadedImage.height);
      const w = uploadedImage.width * scale;
      const h = uploadedImage.height * scale;
      ctx.drawImage(uploadedImage, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    }

    generateBtn?.addEventListener("click", () => {
      if (!uploadedImage) return;
      generateBtn.textContent = "Generating…";
      generateBtn.disabled = true;
      setTimeout(() => {
        drawBase();
        renderOverlay();
        generateBtn.textContent = "Regenerate preview";
        generateBtn.disabled = false;
      }, 900); // simulated processing delay
    });

    function renderOverlay() {
      const ctx = canvas.getContext("2d");
      const saree = (typeof SAREES !== "undefined" && SAREES.find((s) => s.id === swatchSelect?.value)) || SAREES[0];
      const [c1, c2] = saree.swatch;

      // Simple draped-fabric silhouette overlaying the lower 2/3 of the frame
      const grad = ctx.createLinearGradient(0, canvas.height * 0.28, canvas.width, canvas.height);
      grad.addColorStop(0, hexToRgba(c1, 0.72));
      grad.addColorStop(1, hexToRgba(c2, 0.55));

      ctx.save();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.18, canvas.height * 0.34);
      ctx.quadraticCurveTo(canvas.width * 0.02, canvas.height * 0.62, canvas.width * 0.14, canvas.height);
      ctx.lineTo(canvas.width * 0.86, canvas.height);
      ctx.quadraticCurveTo(canvas.width * 0.98, canvas.height * 0.6, canvas.width * 0.82, canvas.height * 0.34);
      ctx.quadraticCurveTo(canvas.width * 0.5, canvas.height * 0.44, canvas.width * 0.18, canvas.height * 0.34);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // pallu accent stripe
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = hexToRgba(c2, 0.9);
      ctx.fillRect(canvas.width * 0.62, canvas.height * 0.34, canvas.width * 0.1, canvas.height * 0.62);
      ctx.restore();

      // label
      ctx.font = "600 20px Poppins, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.fillText("AI Preview (Demo)", 20, 36);
      ctx.font = "400 15px Poppins, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(saree.name, 20, 60);
    }

    function hexToRgba(hex, alpha) {
      const h = hex.replace("#", "");
      const r = parseInt(h.substring(0, 2), 16);
      const g = parseInt(h.substring(2, 4), 16);
      const b = parseInt(h.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
  });
})();
